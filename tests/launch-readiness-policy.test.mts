import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getLaunchBlockers,
  getLaunchReadinessSummary,
  getReadinessBand,
  scoreLaunchReadiness,
} from '../app/lib/launch-readiness-policy.ts';
import type { LaunchReadinessInput } from '../app/lib/launch-readiness-policy.ts';

const allClear: LaunchReadinessInput = {
  checks: {
    firebaseProjectConnected: true,
    firestoreReachable: true,
    adminSdkConfigured: true,
    publicFirebaseConfigured: true,
    adminUserExists: true,
    emailProviderConfigured: true,
  },
  stats: {
    totalUsers: 10,
    talents: 5,
    recruiters: 3,
    pendingVerifications: 0,
    pendingTalentVerifications: 0,
    approvedRecruiters: 2,
    suspendedUsers: 0,
    activeAuditions: 4,
    totalApplications: 8,
  },
  reports: {
    openCount: 0,
    urgentCount: 0,
  },
};

// All system checks failing, no marketplace supply, one urgent report
const hardBlocked: LaunchReadinessInput = {
  checks: {
    firebaseProjectConnected: false,
    firestoreReachable: false,
    adminSdkConfigured: false,
    publicFirebaseConfigured: false,
    adminUserExists: false,
    emailProviderConfigured: false,
  },
  stats: {
    totalUsers: 0,
    talents: 0,
    recruiters: 0,
    pendingVerifications: 0,
    pendingTalentVerifications: 0,
    approvedRecruiters: 0,
    suspendedUsers: 0,
    activeAuditions: 0,
    totalApplications: 0,
  },
  reports: {
    openCount: 0,
    urgentCount: 1,
  },
};

test('getReadinessBand returns ready at 80% and 100% with no critical blockers', () => {
  assert.equal(getReadinessBand(100, 0), 'ready');
  assert.equal(getReadinessBand(80, 0), 'ready');
});

test('getReadinessBand returns almost_ready between 50% and 79% with no critical blockers', () => {
  assert.equal(getReadinessBand(79, 0), 'almost_ready');
  assert.equal(getReadinessBand(50, 0), 'almost_ready');
});

test('getReadinessBand returns needs_attention below 50% with no critical blockers', () => {
  assert.equal(getReadinessBand(49, 0), 'needs_attention');
  assert.equal(getReadinessBand(0, 0), 'needs_attention');
});

test('getReadinessBand returns blocked when any critical blockers exist regardless of score', () => {
  assert.equal(getReadinessBand(100, 1), 'blocked');
  assert.equal(getReadinessBand(0, 5), 'blocked');
  assert.equal(getReadinessBand(79, 2), 'blocked');
});

test('scoreLaunchReadiness returns 100 when all items pass', () => {
  assert.equal(scoreLaunchReadiness(allClear), 100);
});

test('scoreLaunchReadiness returns 0 when all items fail', () => {
  assert.equal(scoreLaunchReadiness(hardBlocked), 0);
});

test('scoreLaunchReadiness awards partial points for partial readiness', () => {
  // Only infra checks pass (10+5+10+10+10=45), plus no urgent reports (10) = 55
  const partial: LaunchReadinessInput = {
    checks: {
      firebaseProjectConnected: true,
      firestoreReachable: true,
      adminSdkConfigured: true,
      publicFirebaseConfigured: true,
      adminUserExists: true,
      emailProviderConfigured: false,
    },
    stats: {
      totalUsers: 0,
      talents: 0,
      recruiters: 0,
      pendingVerifications: 0,
      pendingTalentVerifications: 0,
      approvedRecruiters: 0,
      suspendedUsers: 0,
      activeAuditions: 0,
      totalApplications: 0,
    },
    reports: { openCount: 0, urgentCount: 0 },
  };
  assert.equal(scoreLaunchReadiness(partial), 55);
});

test('getLaunchBlockers returns all non-ok items', () => {
  const blockers = getLaunchBlockers(hardBlocked);
  assert.ok(blockers.length > 0);
  assert.ok(blockers.every((b) => b.status !== 'ok'));
});

test('getLaunchBlockers returns empty array when all checks pass', () => {
  const blockers = getLaunchBlockers(allClear);
  assert.deepEqual(blockers, []);
});

test('getLaunchBlockers marks failed critical checks as blocked status', () => {
  const blockers = getLaunchBlockers(hardBlocked);
  const criticalBlockers = blockers.filter((b) => b.status === 'blocked');
  assert.ok(criticalBlockers.length >= 5, 'expected 5 critical blockers');
  assert.ok(
    criticalBlockers.some((b) => b.key === 'firebaseProjectConnected')
  );
  assert.ok(criticalBlockers.some((b) => b.key === 'adminSdkConfigured'));
});

test('getLaunchBlockers marks non-critical failures as warning status', () => {
  const noMarketplace: LaunchReadinessInput = {
    ...allClear,
    stats: { ...allClear.stats, approvedRecruiters: 0, activeAuditions: 0 },
  };
  const blockers = getLaunchBlockers(noMarketplace);
  const warnings = blockers.filter((b) => b.status === 'warning');
  assert.ok(warnings.some((b) => b.key === 'approvedRecruiterExists'));
  assert.ok(warnings.some((b) => b.key === 'activeAuditionExists'));
});

test('getLaunchReadinessSummary returns blocked band for hard-blocked state', () => {
  const summary = getLaunchReadinessSummary(hardBlocked);
  assert.equal(summary.band, 'blocked');
  assert.equal(summary.score, 0);
  assert.ok(summary.blockers.length > 0);
});

test('getLaunchReadinessSummary returns ready band for all-clear state', () => {
  const summary = getLaunchReadinessSummary(allClear);
  assert.equal(summary.band, 'ready');
  assert.equal(summary.score, 100);
  assert.deepEqual(summary.blockers, []);
});

test('getLaunchReadinessSummary identifies urgent reports as a blocker', () => {
  const withUrgentReports: LaunchReadinessInput = {
    ...allClear,
    reports: { openCount: 1, urgentCount: 1 },
  };
  const summary = getLaunchReadinessSummary(withUrgentReports);
  assert.ok(summary.blockers.some((b) => b.key === 'noUrgentOpenReports'));
});

test('getLaunchReadinessSummary returns almost_ready when infra passes but marketplace is empty', () => {
  const partial: LaunchReadinessInput = {
    checks: {
      firebaseProjectConnected: true,
      firestoreReachable: true,
      adminSdkConfigured: true,
      publicFirebaseConfigured: true,
      adminUserExists: true,
      emailProviderConfigured: false,
    },
    stats: {
      totalUsers: 0,
      talents: 0,
      recruiters: 0,
      pendingVerifications: 0,
      pendingTalentVerifications: 0,
      approvedRecruiters: 0,
      suspendedUsers: 0,
      activeAuditions: 0,
      totalApplications: 0,
    },
    reports: { openCount: 0, urgentCount: 0 },
  };
  const summary = getLaunchReadinessSummary(partial);
  // score=55, no critical blockers → almost_ready
  assert.equal(summary.band, 'almost_ready');
  assert.equal(summary.score, 55);
});

test('getLaunchReadinessSummary includes all items in items array', () => {
  const summary = getLaunchReadinessSummary(allClear);
  assert.ok(summary.items.length >= 10);
  assert.ok(summary.items.every((i) => i.key && i.label && i.status));
});

test('getLaunchBlockers includes actionHref for items that have one', () => {
  const withPending: LaunchReadinessInput = {
    ...allClear,
    stats: { ...allClear.stats, approvedRecruiters: 0 },
  };
  const blockers = getLaunchBlockers(withPending);
  const recruiterBlocker = blockers.find((b) => b.key === 'approvedRecruiterExists');
  assert.ok(recruiterBlocker);
  assert.equal(recruiterBlocker.actionHref, '/admin/verifications');
});
