import { test } from 'node:test';
import assert from 'node:assert/strict';

test('fresh QA profile is onboarding-complete imperial with no fabricated feature data', async () => {
  const { qaSeedSettings } = await import('../../scripts/seed-qa-account.mjs');
  const settings = qaSeedSettings(null);
  assert.equal(settings?.onboardingCompleted, true);
  assert.equal(settings?.measurementUnit, 'imperial');
  assert.equal(settings?.dailyCalorieTarget, 0);
  assert.equal(settings?.currentWeight, undefined);
});

test('compatible existing QA settings are preserved exactly rather than reset', async () => {
  const { qaSeedSettings } = await import('../../scripts/seed-qa-account.mjs');
  const existing = { onboardingCompleted: true, measurementUnit: 'imperial', dailyCalorieTarget: 2175.5, profileName: 'Existing QA' };
  const before = structuredClone(existing);
  assert.equal(qaSeedSettings(existing), null);
  assert.deepEqual(existing, before);
});

test('incompatible existing QA profile refuses without overwriting settings', async () => {
  const { qaSeedSettings } = await import('../../scripts/seed-qa-account.mjs');
  for (const existing of [{}, { onboardingCompleted: false, measurementUnit: 'imperial' }, { onboardingCompleted: true, measurementUnit: 'metric' }]) {
    const before = structuredClone(existing);
    assert.throws(() => qaSeedSettings(existing), /existing.*incompatible/i);
    assert.deepEqual(existing, before);
  }
});
