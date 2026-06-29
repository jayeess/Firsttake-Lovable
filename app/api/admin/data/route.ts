import { requireAdmin, adminErrorResponse } from '@/app/lib/admin-server';
import {
  validatePublicFirebaseEnv,
  validateServerFirebaseEnv,
} from '@/app/lib/env-validation';
import { getAdminDb } from '@/app/lib/firebase-admin';
import { getEmailProviderStatus } from '@/app/lib/email/email-provider';
import { calculateTalentProfileCompleteness } from '@/app/lib/profile-completeness';
import type { TalentProfile } from '@/app/lib/types';

export const runtime = 'nodejs';

const serialize = (snapshot: FirebaseFirestore.QuerySnapshot) =>
  snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const view = new URL(request.url).searchParams.get('view') ?? 'overview';
    const db = getAdminDb();

    if (view === 'verifications') {
      const snapshot = await db
        .collection('recruiterVerifications')
        .orderBy('updatedAt', 'desc')
        .limit(100)
        .get();
      return Response.json({ verifications: serialize(snapshot) });
    }
    if (view === 'users') {
      const snapshot = await db.collection('users').limit(200).get();
      return Response.json({ users: serialize(snapshot) });
    }
    if (view === 'talentVerifications') {
      const [snapshot, talentAccounts] = await Promise.all([
        db
          .collection('talentVerifications')
          .orderBy('updatedAt', 'desc')
          .limit(100)
          .get(),
        db.collection('users').where('userType', '==', 'TALENT').limit(200).get(),
      ]);
      const verificationByTalent = new Map(
        snapshot.docs.map((item) => [item.id, item.data()])
      );
      const talents = await Promise.all(
        talentAccounts.docs.map(async (account) => {
          const verification = verificationByTalent.get(account.id);
          const profile = await db
            .collection('users')
            .doc(account.id)
            .collection('talentProfiles')
            .doc(account.id)
            .get();
          const media = await db
            .collection('users')
            .doc(account.id)
            .collection('talentProfiles')
            .doc(account.id)
            .collection('media')
            .orderBy('sortOrder', 'asc')
            .get();
          const profileData = profile.exists
            ? (profile.data() as TalentProfile)
            : null;
          const completeness = profileData
            ? calculateTalentProfileCompleteness(profileData)
            : null;
          return {
            id: account.id,
            talentId: account.id,
            talentEmail: account.data().email ?? null,
            ...verification,
            talentVerificationStatus:
              verification?.talentVerificationStatus ?? 'not_submitted',
            profileCompletenessScore:
              completeness?.score ??
              profileData?.profileCompletenessScore ??
              verification?.profileCompletenessScore ??
              0,
            profileCompletenessChecklist:
              completeness?.checklist ??
              profileData?.profileCompletenessChecklist ??
              verification?.profileCompletenessChecklist ??
              {},
            profile: profileData,
            media: serialize(media),
          };
        })
      );
      return Response.json({ talents });
    }
    if (view === 'auditions') {
      const snapshot = await db
        .collection('auditions')
        .orderBy('createdAt', 'desc')
        .limit(200)
        .get();
      return Response.json({ auditions: serialize(snapshot) });
    }
    if (view === 'auditLogs') {
      const snapshot = await db
        .collection('auditLogs')
        .orderBy('timestamp', 'desc')
        .limit(200)
        .get();
      return Response.json({ logs: serialize(snapshot) });
    }
    if (view === 'conversations') {
      const snapshot = await db
        .collection('conversations')
        .orderBy('updatedAt', 'desc')
        .limit(100)
        .get();
      return Response.json({ conversations: serialize(snapshot) });
    }
    if (view === 'reports') {
      const snapshot = await db
        .collection('reports')
        .orderBy('createdAt', 'desc')
        .limit(200)
        .get();
      const reports = await Promise.all(
        snapshot.docs.map(async (item) => {
          const events = await item.ref
            .collection('events')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();
          return {
            id: item.id,
            ...item.data(),
            events: serialize(events),
          };
        })
      );
      return Response.json({ reports });
    }
    if (view === 'betaFeedback') {
      const snapshot = await db
        .collection('betaFeedback')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();
      return Response.json({ feedback: serialize(snapshot) });
    }
    if (view === 'betaReadiness') {
      const email = getEmailProviderStatus();
      const [admins, users, recruiterVerifications, talentVerifications] =
        await Promise.all([
          db.collection('users').where('isAdmin', '==', true).limit(1).get(),
          db.collection('users').limit(1).get(),
          db.collection('recruiterVerifications').limit(1).get(),
          db.collection('talentVerifications').limit(1).get(),
        ]);
      return Response.json({
        checks: {
          firebaseProjectConnected: true,
          adminSdkConfigured: validateServerFirebaseEnv().ok,
          publicFirebaseConfigured: validatePublicFirebaseEnv().ok,
          adminUserExists: !admins.empty,
          firestoreReachable: true,
          anyUserExists: !users.empty,
          recruiterVerificationEnabled: true,
          talentVerificationEnabled: true,
          emailNotificationFoundationAdded: true,
          emailDeliveryModeSafe: true,
          emailProviderConfigured: email.configured,
          emailNoopModeActive: !email.configured,
          notificationPreferencesEnabled: true,
          pwaManifestAdded: true,
          pushNotificationsPending: true,
          realEmailProviderSetupPending: !email.configured,
          recruiterVerificationRecords: recruiterVerifications.size,
          talentVerificationRecords: talentVerifications.size,
        },
        env: {
          public: validatePublicFirebaseEnv(),
          server: validateServerFirebaseEnv(),
          email,
        },
      });
    }

    if (view === 'launchReadiness') {
      const email = getEmailProviderStatus();
      const [
        admins,
        users,
        recruiterVerifications,
        talentVerifications,
        auditions,
        applications,
        openReports,
      ] = await Promise.all([
        db.collection('users').where('isAdmin', '==', true).limit(1).get(),
        db.collection('users').get(),
        db.collection('recruiterVerifications').get(),
        db.collection('talentVerifications').get(),
        db.collection('auditions').get(),
        db.collectionGroup('applications').get(),
        db
          .collection('reports')
          .where('status', 'in', ['open', 'under_review'])
          .get(),
      ]);
      const userData = users.docs.map((item) => item.data());
      const verificationData = recruiterVerifications.docs.map((item) =>
        item.data()
      );
      const auditionData = auditions.docs.map((item) => item.data());
      const applicationData = applications.docs.map((item) => item.data());
      const openReportData = openReports.docs.map((item) => item.data());
      return Response.json({
        checks: {
          firebaseProjectConnected: true,
          adminSdkConfigured: validateServerFirebaseEnv().ok,
          publicFirebaseConfigured: validatePublicFirebaseEnv().ok,
          adminUserExists: !admins.empty,
          firestoreReachable: true,
          anyUserExists: !users.empty,
          recruiterVerificationEnabled: true,
          talentVerificationEnabled: true,
          emailNotificationFoundationAdded: true,
          emailDeliveryModeSafe: true,
          emailProviderConfigured: email.configured,
          emailNoopModeActive: !email.configured,
          notificationPreferencesEnabled: true,
          pwaManifestAdded: true,
        },
        stats: {
          totalUsers: users.size,
          talents: userData.filter((u) => u.userType === 'TALENT').length,
          recruiters: userData.filter((u) => u.userType === 'RECRUITER').length,
          pendingVerifications: verificationData.filter(
            (v) => v.status === 'pending'
          ).length,
          pendingTalentVerifications: talentVerifications.docs.filter(
            (v) => v.data().talentVerificationStatus === 'pending'
          ).length,
          approvedRecruiters: verificationData.filter(
            (v) => v.status === 'approved'
          ).length,
          suspendedUsers: userData.filter(
            (u) => u.accountStatus === 'SUSPENDED'
          ).length,
          activeAuditions: auditionData.filter(
            (a) => a.status === 'ACTIVE' && a.moderationStatus !== 'REMOVED'
          ).length,
          totalApplications: applications.size,
          selfTapeRequests: auditionData.filter(
            (a) => a.selfTapeEnabled === true
          ).length,
          selfTapeSubmissions: applicationData.filter(
            (a) =>
              a.selfTapeStatus === 'submitted' ||
              a.selfTapeStatus === 'reviewed' ||
              Boolean(a.selfTapeSubmission)
          ).length,
        },
        reports: {
          openCount: openReportData.filter((r) => r.status === 'open').length,
          urgentCount: openReportData.filter((r) => r.priority === 'urgent')
            .length,
        },
        env: {
          public: validatePublicFirebaseEnv(),
          server: validateServerFirebaseEnv(),
          email,
        },
      });
    }

    const [
      users,
      verifications,
      talentVerifications,
      auditions,
      applications,
      logs,
    ] =
      await Promise.all([
        db.collection('users').get(),
        db.collection('recruiterVerifications').get(),
        db.collection('talentVerifications').get(),
        db.collection('auditions').get(),
        db.collectionGroup('applications').get(),
        db.collection('auditLogs').orderBy('timestamp', 'desc').limit(8).get(),
      ]);
    const userData = users.docs.map((item) => item.data());
    const verificationData = verifications.docs.map((item) => item.data());
    const auditionData = auditions.docs.map((item) => item.data());
    const applicationData = applications.docs.map((item) => item.data());

    return Response.json({
      stats: {
        totalUsers: users.size,
        talents: userData.filter((item) => item.userType === 'TALENT').length,
        recruiters: userData.filter((item) => item.userType === 'RECRUITER').length,
        pendingVerifications: verificationData.filter(
          (item) => item.status === 'pending'
        ).length,
        pendingTalentVerifications: talentVerifications.docs.filter(
          (item) => item.data().talentVerificationStatus === 'pending'
        ).length,
        approvedRecruiters: verificationData.filter(
          (item) => item.status === 'approved'
        ).length,
        suspendedUsers: userData.filter(
          (item) => item.accountStatus === 'SUSPENDED'
        ).length,
        activeAuditions: auditionData.filter(
          (item) =>
            item.status === 'ACTIVE' && item.moderationStatus !== 'REMOVED'
        ).length,
        totalApplications: applications.size,
        selfTapeRequests: auditionData.filter(
          (item) => item.selfTapeEnabled === true
        ).length,
        selfTapeSubmissions: applicationData.filter(
          (item) =>
            item.selfTapeStatus === 'submitted' ||
            item.selfTapeStatus === 'reviewed' ||
            Boolean(item.selfTapeSubmission)
        ).length,
      },
      logs: serialize(logs),
    });
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}
