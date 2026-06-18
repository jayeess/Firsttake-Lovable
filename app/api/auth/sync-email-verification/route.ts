import { FieldValue } from 'firebase-admin/firestore';
import {
  adminErrorResponse,
  requireUser,
} from '@/app/lib/admin-server';
import { getAdminDb } from '@/app/lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const actor = await requireUser(request);
    if (actor.email_verified !== true) {
      return Response.json({ ok: true, emailVerified: false });
    }

    await getAdminDb().collection('users').doc(actor.uid).set(
      {
        emailVerified: true,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return Response.json({ ok: true, emailVerified: true });
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}
