import { requireAdmin, adminErrorResponse } from '@/app/lib/admin-server';
import { getAdminDb } from '@/app/lib/firebase-admin';

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
          return {
            id: account.id,
            talentId: account.id,
            talentEmail: account.data().email ?? null,
            talentVerificationStatus:
              verification?.talentVerificationStatus ?? 'not_submitted',
            profileCompletenessScore:
              verification?.profileCompletenessScore ??
              profile.data()?.profileCompletenessScore ??
              0,
            profileCompletenessChecklist:
              verification?.profileCompletenessChecklist ??
              profile.data()?.profileCompletenessChecklist ??
              {},
            ...verification,
            profile: profile.exists ? profile.data() : null,
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
      },
      logs: serialize(logs),
    });
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}
