import 'server-only';

import type { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from './firebase-admin';
import { getRequestId, logServerEvent } from './server-logger';

export class AdminRequestError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

export const requireAdmin = async (request: Request): Promise<DecodedIdToken> => {
  const token = await requireUser(request);
  if (token.admin !== true) {
    throw new AdminRequestError('Administrator access is required.', 403);
  }
  return token;
};

export const requireUser = async (request: Request): Promise<DecodedIdToken> => {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    throw new AdminRequestError('Authentication is required.', 401);
  }

  return getAdminAuth().verifyIdToken(authorization.slice(7));
};

export const writeAuditLog = async ({
  action,
  actor,
  targetId,
  targetType,
  reason,
  note,
  metadata,
}: {
  action: string;
  actor: DecodedIdToken;
  targetId: string;
  targetType:
    | 'recruiter'
    | 'talent'
    | 'user'
    | 'audition'
    | 'media'
    | 'application'
    | 'conversation'
    | 'message'
    | 'report'
    | 'feedback';
  reason?: string;
  note?: string;
  metadata?: Record<string, unknown>;
}) => {
  await getAdminDb().collection('auditLogs').add({
    action,
    actorUid: actor.uid,
    actorEmail: actor.email ?? null,
    targetId,
    targetUid:
      targetType === 'audition' ||
      targetType === 'media' ||
      targetType === 'application' ||
      targetType === 'conversation'
        ? null
        : targetId,
    targetType,
    reason: reason ?? null,
    note: note ?? null,
    metadata: metadata ?? {},
    timestamp: FieldValue.serverTimestamp(),
  });
};

export const adminErrorResponse = (error: unknown) => {
  if (error instanceof AdminRequestError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return Response.json(
      { error: error.message },
      { status: error.status }
    );
  }

  logServerEvent('error', 'admin_api_request_failed', {
    name: error instanceof Error ? error.name : 'UnknownError',
  });
  return Response.json(
    { error: 'The secure admin service could not complete this request.' },
    { status: 500 }
  );
};

export const logAdminAction = (
  request: Request,
  action: string,
  actorUid?: string,
  targetId?: string
) => {
  logServerEvent('info', 'admin_action_requested', {
    requestId: getRequestId(request),
    action,
    actorUid,
    targetId,
  });
};
