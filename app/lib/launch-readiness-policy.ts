export type LaunchReadinessBand =
  | 'blocked'
  | 'needs_attention'
  | 'almost_ready'
  | 'ready';

export type LaunchReadinessSeverity = 'critical' | 'high' | 'medium' | 'info';

export type LaunchReadinessItem = {
  key: string;
  label: string;
  status: 'ok' | 'warning' | 'blocked';
  severity: LaunchReadinessSeverity;
  actionHref?: string;
  detail?: string;
};

export type LaunchReadinessInput = {
  checks: Record<string, boolean | number>;
  stats: {
    totalUsers: number;
    talents: number;
    recruiters: number;
    pendingVerifications: number;
    pendingTalentVerifications: number;
    approvedRecruiters: number;
    suspendedUsers: number;
    activeAuditions: number;
    totalApplications: number;
  };
  reports: {
    openCount: number;
    urgentCount: number;
  };
};

export type LaunchReadinessSummary = {
  score: number;
  band: LaunchReadinessBand;
  items: LaunchReadinessItem[];
  blockers: LaunchReadinessItem[];
};

type ScoringDef = {
  key: string;
  label: string;
  points: number;
  isCritical: boolean;
  severity: LaunchReadinessSeverity;
  getValue: (data: LaunchReadinessInput) => boolean;
  actionHref?: string;
  detail?: string;
};

// Total points = 100 so scoreLaunchReadiness returns a percentage directly.
const SCORING: ScoringDef[] = [
  {
    key: 'firebaseProjectConnected',
    label: 'Firebase project connected',
    points: 10,
    isCritical: true,
    severity: 'critical',
    getValue: (d) => d.checks['firebaseProjectConnected'] === true,
    detail: 'Firebase must be connected before any feature can work.',
  },
  {
    key: 'firestoreReachable',
    label: 'Firestore reachable',
    points: 5,
    isCritical: true,
    severity: 'critical',
    getValue: (d) => d.checks['firestoreReachable'] === true,
    detail: 'Firestore must be reachable for all data operations.',
  },
  {
    key: 'adminSdkConfigured',
    label: 'Admin SDK configured',
    points: 10,
    isCritical: true,
    severity: 'critical',
    getValue: (d) => d.checks['adminSdkConfigured'] === true,
    detail: 'Server env is missing required Firebase Admin SDK variables.',
  },
  {
    key: 'publicFirebaseConfigured',
    label: 'Firebase web env configured',
    points: 10,
    isCritical: true,
    severity: 'critical',
    getValue: (d) => d.checks['publicFirebaseConfigured'] === true,
    detail: 'Public Firebase env variables must be present for client auth.',
  },
  {
    key: 'adminUserExists',
    label: 'Admin user exists',
    points: 10,
    isCritical: true,
    severity: 'critical',
    getValue: (d) => d.checks['adminUserExists'] === true,
    detail: 'At least one admin account must exist for platform governance.',
    actionHref: '/admin/users',
  },
  {
    key: 'approvedRecruiterExists',
    label: 'Approved recruiter on platform',
    points: 15,
    isCritical: false,
    severity: 'high',
    getValue: (d) => (d.stats.approvedRecruiters ?? 0) > 0,
    detail: 'No recruiter has been approved. The marketplace cannot operate.',
    actionHref: '/admin/verifications',
  },
  {
    key: 'activeAuditionExists',
    label: 'Active audition posted',
    points: 15,
    isCritical: false,
    severity: 'high',
    getValue: (d) => (d.stats.activeAuditions ?? 0) > 0,
    detail: 'No active casting calls are live. Talent will see an empty marketplace.',
    actionHref: '/admin/auditions',
  },
  {
    key: 'anyUserExists',
    label: 'Platform has users',
    points: 5,
    isCritical: false,
    severity: 'medium',
    getValue: (d) => (d.stats.totalUsers ?? 0) > 0,
    detail: 'No accounts exist yet.',
  },
  {
    key: 'emailProviderConfigured',
    label: 'Email provider configured',
    points: 10,
    isCritical: false,
    severity: 'medium',
    getValue: (d) => d.checks['emailProviderConfigured'] === true,
    detail: 'Email is in no-op mode. Notifications will not be delivered.',
  },
  {
    key: 'noUrgentOpenReports',
    label: 'No urgent open reports',
    points: 10,
    isCritical: false,
    severity: 'high',
    getValue: (d) => (d.reports.urgentCount ?? 0) === 0,
    detail: 'Urgent safety reports must be resolved before controlled launch.',
    actionHref: '/admin/reports',
  },
];

export function scoreLaunchReadiness(data: LaunchReadinessInput): number {
  const total = SCORING.reduce((sum, def) => sum + def.points, 0);
  const earned = SCORING.reduce(
    (sum, def) => sum + (def.getValue(data) ? def.points : 0),
    0
  );
  return Math.round((earned / total) * 100);
}

export function getReadinessBand(
  score: number,
  criticalBlockers: number
): LaunchReadinessBand {
  if (criticalBlockers > 0) return 'blocked';
  if (score < 50) return 'needs_attention';
  if (score < 80) return 'almost_ready';
  return 'ready';
}

export function getLaunchItems(data: LaunchReadinessInput): LaunchReadinessItem[] {
  return SCORING.map((def) => {
    const ok = def.getValue(data);
    return {
      key: def.key,
      label: def.label,
      status: ok ? 'ok' : def.isCritical ? 'blocked' : 'warning',
      severity: def.severity,
      actionHref: def.actionHref,
      detail: def.detail,
    };
  });
}

export function getLaunchBlockers(data: LaunchReadinessInput): LaunchReadinessItem[] {
  return getLaunchItems(data).filter((item) => item.status !== 'ok');
}

export function getLaunchReadinessSummary(
  data: LaunchReadinessInput
): LaunchReadinessSummary {
  const items = getLaunchItems(data);
  const blockers = items.filter((item) => item.status !== 'ok');
  const criticalBlockers = items.filter((item) => item.status === 'blocked').length;
  const score = scoreLaunchReadiness(data);
  const band = getReadinessBand(score, criticalBlockers);
  return { score, band, items, blockers };
}
