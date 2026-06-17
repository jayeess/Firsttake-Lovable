import { FieldValue } from 'firebase-admin/firestore';
import { parseJsonBody } from '@/app/lib/api-helpers';
import { getAdminAuth, getAdminDb } from '@/app/lib/firebase-admin';
import { validateBetaFeedback } from '@/app/lib/beta-feedback-policy';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<{
      type?: string;
      rating?: number | string | null;
      message?: string;
      route?: string;
      contactEmail?: string;
    }>(request, 16_000);
    const feedback = validateBetaFeedback(body);
    const user = await getOptionalUser(request);
    const role = await getUserRole(user?.uid);
    const now = FieldValue.serverTimestamp();

    await getAdminDb().collection('betaFeedback').add({
      userId: user?.uid ?? null,
      role,
      type: feedback.type,
      rating: feedback.rating,
      message: feedback.message,
      route: feedback.route || null,
      contactEmail: feedback.contactEmail || null,
      status: 'new',
      createdAt: now,
      updatedAt: now,
    });

    return Response.json({ ok: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Feedback could not be submitted.';
    const status =
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof error.status === 'number'
        ? error.status
        : message.includes('valid') ||
            message.includes('characters') ||
            message.includes('Rating') ||
            message.includes('at least')
          ? 400
          : 500;
    return Response.json({ error: message }, { status });
  }
}

const getOptionalUser = async (request: Request) => {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  try {
    return await getAdminAuth().verifyIdToken(authorization.slice(7));
  } catch {
    return null;
  }
};

const getUserRole = async (uid?: string) => {
  if (!uid) return 'anonymous';
  const user = await getAdminDb().collection('users').doc(uid).get();
  const role = user.data()?.userType;
  return typeof role === 'string' ? role : 'signed_in';
};
