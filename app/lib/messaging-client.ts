import { getFirebaseAuth } from './firebase';
import type { Conversation, ConversationMessage } from './types';

const headers = async () => {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Please sign in again.');
  return {
    Authorization: `Bearer ${await user.getIdToken()}`,
    'Content-Type': 'application/json',
  };
};

const parse = async <T>(response: Response): Promise<T> => {
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? 'Messaging request failed.');
  return payload as T;
};

export const getConversations = async () =>
  parse<{ conversations: Conversation[] }>(
    await fetch('/api/messages/conversations', {
      headers: await headers(),
      cache: 'no-store',
    })
  );

export const createConversation = async (
  auditionId: string,
  applicationId: string
) =>
  parse<{ conversationId: string; created: boolean }>(
    await fetch('/api/messages/conversations', {
      method: 'POST',
      headers: await headers(),
      body: JSON.stringify({ auditionId, applicationId }),
    })
  );

export const getConversation = async (id: string) =>
  parse<{ conversation: Conversation; messages: ConversationMessage[] }>(
    await fetch(`/api/messages/conversations/${encodeURIComponent(id)}`, {
      headers: await headers(),
      cache: 'no-store',
    })
  );

export const sendMessage = async (conversationId: string, body: string) =>
  parse<{ messageId: string }>(
    await fetch('/api/messages/send', {
      method: 'POST',
      headers: await headers(),
      body: JSON.stringify({ conversationId, body }),
    })
  );

export const markConversationRead = async (conversationId: string) =>
  parse<{ ok: true }>(
    await fetch('/api/messages/read', {
      method: 'POST',
      headers: await headers(),
      body: JSON.stringify({ conversationId }),
    })
  );
