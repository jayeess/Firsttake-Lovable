'use client';

import { getFirebaseAuth } from './firebase';
import type { ReportReasonCode, ReportTargetType } from './types';

export const createReport = async (input: {
  targetType: ReportTargetType;
  targetId: string;
  reasonCode: ReportReasonCode;
  reasonText: string;
}) => {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Please log in to submit a report.');
  const response = await fetch('/api/reports/create', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await user.getIdToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  const result = (await response.json()) as {
    error?: string;
    reportId?: string;
    existing?: boolean;
  };
  if (!response.ok) {
    throw new Error(result.error ?? 'Report could not be submitted.');
  }
  return result;
};
