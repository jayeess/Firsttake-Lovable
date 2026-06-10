import { getFirebaseAuth } from './firebase';

const getAdminHeaders = async () => {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Please sign in again.');
  return {
    Authorization: `Bearer ${await user.getIdToken()}`,
    'Content-Type': 'application/json',
  };
};

export const fetchAdminData = async <T>(view: string): Promise<T> => {
  const response = await fetch(`/api/admin/data?view=${encodeURIComponent(view)}`, {
    headers: await getAdminHeaders(),
    cache: 'no-store',
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? 'Admin data could not be loaded.');
  return payload as T;
};

export const runAdminAction = async (
  action: string,
  targetId: string,
  reason?: string
) => {
  const response = await fetch('/api/admin/action', {
    method: 'POST',
    headers: await getAdminHeaders(),
    body: JSON.stringify({ action, targetId, reason }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? 'Admin action failed.');
  return payload;
};
