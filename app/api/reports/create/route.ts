import { FieldValue } from 'firebase-admin/firestore';
import {
  adminErrorResponse,
  AdminRequestError,
  requireUser,
  writeAuditLog,
} from '@/app/lib/admin-server';
import { getAdminDb } from '@/app/lib/firebase-admin';
import { parseJsonBody } from '@/app/lib/api-helpers';
import {
  buildReportNotifications,
  getReportPriority,
  isDuplicateReport,
  isReportReasonCode,
  isReportTargetType,
  normalizeReportReasonText,
} from '@/app/lib/report-policy';
import { getReporterRole, loadReportTarget } from '@/app/lib/report-server';
import {
  createNotification,
  deliverNotifications,
  notifyAdmins,
} from '@/app/lib/notification-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const actor = await requireUser(request);
    const body = await parseJsonBody<{
      targetType?: unknown;
      targetId?: unknown;
      reasonCode?: unknown;
      reasonText?: unknown;
    }>(request, 12_000);
    if (!isReportTargetType(body.targetType)) {
      throw new AdminRequestError('A valid report target is required.');
    }
    if (
      typeof body.targetId !== 'string' ||
      !body.targetId.trim() ||
      body.targetId.length > 300
    ) {
      throw new AdminRequestError('A valid target identifier is required.');
    }
    if (!isReportReasonCode(body.reasonCode)) {
      throw new AdminRequestError('Select a valid reason for the report.');
    }

    let reasonText = '';
    try {
      reasonText = normalizeReportReasonText(body.reasonText, body.reasonCode);
    } catch (error: unknown) {
      throw new AdminRequestError(
        error instanceof Error ? error.message : 'Report details are invalid.'
      );
    }

    const db = getAdminDb();
    const targetId = body.targetId.trim();
    const targetKey = `${body.targetType}:${targetId}`;
    const [reporterRole, target, duplicateSnapshot] = await Promise.all([
      getReporterRole(db, actor),
      loadReportTarget({
        db,
        actor,
        targetType: body.targetType,
        targetId,
      }),
      db
        .collection('reports')
        .where('reporterId', '==', actor.uid)
        .where('targetKey', '==', targetKey)
        .limit(10)
        .get(),
    ]);

    const duplicate = duplicateSnapshot.docs.find((item) => {
      const data = item.data();
      const createdAt = data.createdAt?.toDate?.() ?? new Date(0);
      return isDuplicateReport({
        status: data.status,
        createdAt,
      });
    });
    if (duplicate) {
      return Response.json({
        ok: true,
        reportId: duplicate.id,
        existing: true,
      });
    }

    const reportRef = db.collection('reports').doc();
    await reportRef.create({
      targetType: body.targetType,
      targetId,
      targetKey,
      targetOwnerId: target.targetOwnerId,
      reporterId: actor.uid,
      reporterRole,
      reasonCode: body.reasonCode,
      reasonText,
      status: 'open',
      priority: getReportPriority(body.reasonCode),
      evidenceSnapshots: target.evidenceSnapshots,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      reviewedBy: null,
      reviewedAt: null,
      resolutionAction: null,
      resolutionNote: null,
      adminOnlyNotes: null,
    });
    await writeAuditLog({
      action: 'report_created',
      actor,
      targetId: reportRef.id,
      targetType: 'report',
      reason: body.reasonCode,
      metadata: {
        reportTargetType: body.targetType,
        reportTargetId: targetId,
      },
    });

    const notifications = buildReportNotifications({
      reportId: reportRef.id,
      reporterId: actor.uid,
      reporterRole,
      targetType: body.targetType,
    });
    await deliverNotifications(() =>
      Promise.all([
        createNotification(notifications.reporter),
        notifyAdmins(notifications.admin),
      ])
    );

    return Response.json({ ok: true, reportId: reportRef.id, existing: false });
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}
