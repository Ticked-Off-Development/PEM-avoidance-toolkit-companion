import { test, expect } from './global-setup.js';

// Helper: complete onboarding and dismiss tour
async function completeOnboarding(page) {
  await page.goto('/');
  // Wait for app to render (either onboarding or main UI)
  await page.waitForTimeout(1000);
  // Click Get Started if onboarding is shown
  const getStarted = page.getByRole('button', { name: 'Get Started' });
  if (await getStarted.isVisible().catch(() => false)) {
    await getStarted.click();
    await page.waitForTimeout(500);
    // Dismiss tour steps by clicking Skip
    const skip = page.getByText('Skip');
    if (await skip.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skip.click();
      await page.waitForTimeout(500);
    }
  }
  // Wait for header to confirm main UI is rendered
  await page.locator('header').waitFor({ state: 'visible', timeout: 10000 });
}

test.describe('Onboarding Tour', () => {
  test('shows tour after clicking Get Started', async ({ page }) => {
    await page.goto('/');
    const getStarted = page.getByText('Get Started');
    if (await getStarted.isVisible({ timeout: 3000 }).catch(() => false)) {
      await getStarted.click();
      // Tour should appear
      const stepText = page.getByText('Step 1 of 4');
      await expect(stepText).toBeVisible({ timeout: 2000 });
      await expect(page.getByText('Track Your Day')).toBeVisible();
    }
  });

  test('tour Next button advances to next step', async ({ page }) => {
    await page.goto('/');
    const getStarted = page.getByText('Get Started');
    if (await getStarted.isVisible({ timeout: 3000 }).catch(() => false)) {
      await getStarted.click();
      await page.getByText('Next').click();
      await expect(page.getByText('Step 2 of 4')).toBeVisible({ timeout: 2000 });
      await expect(page.getByText('See Your Patterns')).toBeVisible();
    }
  });

  test('tour Skip button closes the tour', async ({ page }) => {
    await page.goto('/');
    const getStarted = page.getByText('Get Started');
    if (await getStarted.isVisible({ timeout: 3000 }).catch(() => false)) {
      await getStarted.click();
      await page.getByText('Skip').click();
      // Tour overlay should disappear
      await expect(page.getByText('Step 1 of 4')).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('tour Done button on last step closes the tour', async ({ page }) => {
    await page.goto('/');
    const getStarted = page.getByText('Get Started');
    if (await getStarted.isVisible({ timeout: 3000 }).catch(() => false)) {
      await getStarted.click();
      // Click Next 3 times to get to step 4
      for (let i = 0; i < 3; i++) {
        await page.getByText('Next').click();
        await page.waitForTimeout(200);
      }
      await expect(page.getByText('Step 4 of 4')).toBeVisible();
      await page.getByText('Done').click();
      await expect(page.getByText('Step 4 of 4')).not.toBeVisible({ timeout: 2000 });
    }
  });
});

test.describe('Daily Logging Reminder', () => {
  test('shows reminder banner when no entry logged today', async ({ page }) => {
    await completeOnboarding(page);
    // Should show the reminder on the Track tab
    await expect(page.getByText("Don't forget to log today!")).toBeVisible({ timeout: 3000 });
  });

  test('dismiss button hides the reminder', async ({ page }) => {
    await completeOnboarding(page);
    const reminder = page.getByText("Don't forget to log today!");
    if (await reminder.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.getByLabel('Dismiss reminder').click();
      await expect(reminder).not.toBeVisible({ timeout: 2000 });
    }
  });
});

test.describe('Export & Backup Modal', () => {
  test('opens export modal with expected buttons', async ({ page }) => {
    await completeOnboarding(page);
    await page.getByLabel('Export data').click();
    await expect(page.getByText('Export & Backup')).toBeVisible({ timeout: 2000 });
    await expect(page.getByText('Copy to Clipboard')).toBeVisible();
    await expect(page.getByText('Download CSV')).toBeVisible();
    await expect(page.getByText('Print Report')).toBeVisible();
    await expect(page.getByText('Download Backup')).toBeVisible();
    await expect(page.getByText('Restore Backup')).toBeVisible();
  });

  test('close button dismisses export modal', async ({ page }) => {
    await completeOnboarding(page);
    await page.getByLabel('Export data').click();
    await expect(page.getByText('Export & Backup')).toBeVisible();
    await page.getByLabel('Close export dialog').click();
    await expect(page.getByText('Export & Backup')).not.toBeVisible({ timeout: 2000 });
  });

  test('export modal contains report text', async ({ page }) => {
    await completeOnboarding(page);
    await page.getByLabel('Export data').click();
    // The report text appears in the modal's preview area
    await expect(page.getByRole('dialog').getByText('PEM AVOIDANCE TOOLKIT')).toBeVisible({ timeout: 2000 });
  });
});

test.describe('Accessibility - ARIA attributes', () => {
  test('bottom navigation has aria-label', async ({ page }) => {
    await completeOnboarding(page);
    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible();
  });

  test('nav buttons have aria-current for active tab', async ({ page }) => {
    await completeOnboarding(page);
    // Track tab should be active by default
    const trackBtn = page.locator('nav[aria-label="Main navigation"] button[aria-current="page"]');
    await expect(trackBtn).toBeVisible({ timeout: 3000 });
    const text = await trackBtn.textContent();
    expect(text).toContain('Track');
  });

  test('theme toggle has aria-label', async ({ page }) => {
    await completeOnboarding(page);
    const btn = page.getByLabel(/Switch to (light|dark) theme/);
    await expect(btn).toBeVisible();
  });

  test('header uses semantic <header> element', async ({ page }) => {
    await completeOnboarding(page);
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('content area uses semantic <main> element', async ({ page }) => {
    await completeOnboarding(page);
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Tab Navigation', () => {
  test('clicking Patterns tab shows Pattern Analysis', async ({ page }) => {
    await completeOnboarding(page);
    await page.getByLabel('Patterns').click();
    await expect(page.getByText('Pattern Analysis')).toBeVisible({ timeout: 3000 });
  });

  test('clicking Plan tab shows Crash Avoidance Plan', async ({ page }) => {
    await completeOnboarding(page);
    await page.getByLabel('Plan').click();
    await expect(page.getByText('Crash Avoidance Plan')).toBeVisible({ timeout: 3000 });
  });

  test('clicking Learn tab shows Learn content', async ({ page }) => {
    await completeOnboarding(page);
    await page.getByLabel('Learn').click();
    await expect(page.getByText('What is PEM?')).toBeVisible({ timeout: 3000 });
  });

  test('clicking Track tab shows today card', async ({ page }) => {
    await completeOnboarding(page);
    await page.getByLabel('Patterns').click();
    await page.getByLabel('Track').click();
    await expect(page.getByText(/^Today \u2014/)).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Day Editor - Delete Entry', () => {
  test('delete button not shown for new (unsaved) entries', async ({ page }) => {
    await completeOnboarding(page);
    // Click "+ Log" to open editor for today
    await page.getByRole('button', { name: 'Log today\'s entry' }).click();
    await page.waitForTimeout(500);
    // Delete button should NOT be visible since there's no saved entry
    await expect(page.getByText('Delete This Entry')).not.toBeVisible({ timeout: 1000 });
  });

  test('delete button shown for existing entries', async ({ page }) => {
    await completeOnboarding(page);
    // Create an entry first
    await page.getByRole('button', { name: 'Log today\'s entry' }).click();
    await page.waitForTimeout(500);
    // Interact with a field to enable Save
    await page.getByRole('radio', { name: '5' }).first().click();
    await page.getByText('Save').first().click();
    await page.waitForTimeout(500);
    // Now open the saved entry
    await page.getByRole('button', { name: "Edit today's entry" }).click();
    await page.waitForTimeout(500);
    // Delete button should be visible
    await expect(page.getByText('Delete This Entry')).toBeVisible({ timeout: 2000 });
  });
});

test.describe('Lazy Loading', () => {
  test('all tabs load without error', async ({ page }) => {
    await completeOnboarding(page);

    // Track
    await expect(page.getByText(/^Today \u2014/)).toBeVisible({ timeout: 3000 });

    // Patterns
    await page.getByLabel('Patterns').click();
    await expect(page.getByText('Pattern Analysis')).toBeVisible({ timeout: 3000 });

    // Plan
    await page.getByLabel('Plan').click();
    await expect(page.getByText('Crash Avoidance Plan')).toBeVisible({ timeout: 3000 });

    // Learn
    await page.getByLabel('Learn').click();
    await expect(page.getByText('What is PEM?')).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Plan View - Accessibility', () => {
  test('plan section buttons have aria-expanded', async ({ page }) => {
    await completeOnboarding(page);
    await page.getByLabel('Plan').click();
    await page.waitForTimeout(500);
    const causeBtn = page.locator('button[aria-expanded]').first();
    await expect(causeBtn).toBeVisible();
    const expanded = await causeBtn.getAttribute('aria-expanded');
    expect(expanded).toBe('false');
  });

  test('clicking section toggles aria-expanded', async ({ page }) => {
    await completeOnboarding(page);
    await page.getByLabel('Plan').click();
    await page.waitForTimeout(500);
    const causeBtn = page.locator('button[aria-expanded]').first();
    await causeBtn.click();
    const expanded = await causeBtn.getAttribute('aria-expanded');
    expect(expanded).toBe('true');
  });
});

// Helper: open day editor for today
async function openDayEditor(page) {
  await completeOnboarding(page);
  await page.getByRole('button', { name: 'Log today\'s entry' }).click();
  await page.waitForTimeout(500);
}

// Helper: select a score from a ScoreInput radio group
async function selectScore(page, groupLabel, value) {
  const group = page.locator(`[aria-label="${groupLabel} score selector"]`);
  await group.getByRole('radio', { name: String(value), exact: true }).click();
}

test.describe('Auto-Calculate Overall Activity', () => {
  test('auto-calculates average of activity scores', async ({ page }) => {
    await openDayEditor(page);
    await selectScore(page, 'Physical', 2);
    await selectScore(page, 'Mental', 4);
    await selectScore(page, 'Emotional', 6);
    await page.waitForTimeout(300);
    // Overall Activity auto-calculated group should show "4.0"
    const autoGroup = page.locator('[aria-label="Overall Activity ★ score (auto-calculated)"]');
    await expect(autoGroup.getByText('4.0')).toBeVisible({ timeout: 2000 });
    await expect(autoGroup.getByText('tap to override')).toBeVisible();
  });

  test('shows em-dash when no activity data', async ({ page }) => {
    await openDayEditor(page);
    const autoGroup = page.locator('[aria-label="Overall Activity ★ score (auto-calculated)"]');
    await expect(autoGroup.getByText('—')).toBeVisible({ timeout: 2000 });
    await expect(autoGroup.getByText('tap to override')).not.toBeVisible();
  });

  test('tap to override enters override mode', async ({ page }) => {
    await openDayEditor(page);
    await selectScore(page, 'Physical', 2);
    await selectScore(page, 'Mental', 4);
    await selectScore(page, 'Emotional', 6);
    await page.waitForTimeout(300);
    // Click the auto-calculated area to enter override
    const autoGroup = page.locator('[aria-label="Overall Activity ★ score (auto-calculated)"]');
    await autoGroup.click();
    await page.waitForTimeout(300);
    // Should now show override mode with reset button and radio buttons
    const overrideGroup = page.locator('[aria-label="Overall Activity ★ score"]');
    await expect(overrideGroup).toBeVisible({ timeout: 2000 });
    await expect(overrideGroup.getByLabel('Reset to calculated average')).toBeVisible();
    // Radio button for the rounded value (4) should be checked
    const radio4 = overrideGroup.getByRole('radio', { name: '4', exact: true });
    await expect(radio4).toHaveAttribute('aria-checked', 'true');
  });

  test('reset returns to auto-calculated state', async ({ page }) => {
    await openDayEditor(page);
    await selectScore(page, 'Physical', 2);
    await selectScore(page, 'Mental', 4);
    await selectScore(page, 'Emotional', 6);
    await page.waitForTimeout(300);
    // Enter override mode
    const autoGroup = page.locator('[aria-label="Overall Activity ★ score (auto-calculated)"]');
    await autoGroup.click();
    await page.waitForTimeout(300);
    // Select a different value (9)
    const overrideGroup = page.locator('[aria-label="Overall Activity ★ score"]');
    await overrideGroup.getByRole('radio', { name: '9', exact: true }).click();
    // Click reset
    await overrideGroup.getByLabel('Reset to calculated average').click();
    await page.waitForTimeout(300);
    // Should return to auto-calculated showing 4.0
    const restoredGroup = page.locator('[aria-label="Overall Activity ★ score (auto-calculated)"]');
    await expect(restoredGroup.getByText('4.0')).toBeVisible({ timeout: 2000 });
    await expect(restoredGroup.getByText('avg')).toBeVisible();
  });
});

test.describe('Auto-Calculate Overall Symptom', () => {
  test('auto-calculates symptom averages per period', async ({ page }) => {
    await openDayEditor(page);
    // Fill Fatigue AM=4, Pain AM=6
    await page.getByLabel('Fatigue AM score').fill('4');
    await page.getByLabel('Pain AM score').fill('6');
    await page.waitForTimeout(300);
    // Overall Symptom auto-calculated group should show AM=5.0
    const autoGroup = page.locator('[aria-label="Overall Symptom ★ symptom scores (auto-calculated)"]');
    await expect(autoGroup.getByText('5.0')).toBeVisible({ timeout: 2000 });
    // PM should show em-dash (no data) — use .first() since Mid also shows —
    await expect(autoGroup.getByText('—').first()).toBeVisible();
  });

  test('tap to override enters override mode', async ({ page }) => {
    await openDayEditor(page);
    await page.getByLabel('Fatigue AM score').fill('4');
    await page.getByLabel('Pain AM score').fill('6');
    await page.waitForTimeout(300);
    // Click the auto-calculated row
    const autoGroup = page.locator('[aria-label="Overall Symptom ★ symptom scores (auto-calculated)"]');
    await autoGroup.click();
    await page.waitForTimeout(300);
    // Should now show override mode with input fields and reset button
    const overrideGroup = page.locator('[aria-label="Overall Symptom ★ symptom scores"]');
    await expect(overrideGroup).toBeVisible({ timeout: 2000 });
    await expect(overrideGroup.getByLabel('Reset to calculated average')).toBeVisible();
    // AM input should have the calculated value
    const amInput = overrideGroup.getByLabel('Overall Symptom ★ AM score');
    await expect(amInput).toBeVisible();
    await expect(amInput).toHaveValue('5.0');
  });

  test('reset returns to auto-calculated state', async ({ page }) => {
    await openDayEditor(page);
    await page.getByLabel('Fatigue AM score').fill('4');
    await page.getByLabel('Pain AM score').fill('6');
    await page.waitForTimeout(300);
    // Enter override mode
    const autoGroup = page.locator('[aria-label="Overall Symptom ★ symptom scores (auto-calculated)"]');
    await autoGroup.click();
    await page.waitForTimeout(300);
    // Change AM value
    const overrideGroup = page.locator('[aria-label="Overall Symptom ★ symptom scores"]');
    const amInput = overrideGroup.getByLabel('Overall Symptom ★ AM score');
    await amInput.fill('9');
    // Click reset
    await overrideGroup.getByLabel('Reset to calculated average').click();
    await page.waitForTimeout(300);
    // Should return to auto-calculated with avg label
    const restoredGroup = page.locator('[aria-label="Overall Symptom ★ symptom scores (auto-calculated)"]');
    await expect(restoredGroup).toBeVisible({ timeout: 2000 });
    await expect(restoredGroup.getByText('5.0')).toBeVisible();
  });
});

test.describe('Auto-Calculate Save & Reload', () => {
  test('auto-calculated values persist after save and re-open', async ({ page }) => {
    await openDayEditor(page);
    // Fill activity scores: avg = (3+6+9)/3 = 6
    await selectScore(page, 'Physical', 3);
    await selectScore(page, 'Mental', 6);
    await selectScore(page, 'Emotional', 9);
    // Fill a symptom: Fatigue AM=8
    await page.getByLabel('Fatigue AM score').fill('8');
    await page.waitForTimeout(300);
    // Save
    await page.getByText('Save').first().click();
    await page.waitForTimeout(500);
    // Re-open the saved entry
    await page.getByRole('button', { name: "Edit today's entry" }).click();
    await page.waitForTimeout(500);
    // Entry re-opens in auto-calculated mode (overrideActivity: false is preserved)
    // Overall Activity should show 6.0 (computed from saved scores)
    const actGroup = page.locator('[aria-label="Overall Activity ★ score (auto-calculated)"]');
    await expect(actGroup).toBeVisible({ timeout: 2000 });
    await expect(actGroup.getByText('6.0')).toBeVisible();
    // Overall Symptom AM should show 8.0 (computed from saved Fatigue AM=8)
    const symGroup = page.locator('[aria-label="Overall Symptom ★ symptom scores (auto-calculated)"]');
    await expect(symGroup).toBeVisible({ timeout: 2000 });
    await expect(symGroup.getByText('8.0')).toBeVisible();
  });
});

test.describe('Empty Save Prevention', () => {
  test('save disabled on new entry until field touched', async ({ page }) => {
    await completeOnboarding(page);
    await page.getByRole('button', { name: 'Log today\'s entry' }).click();
    await page.waitForTimeout(500);
    // Save should be disabled
    const saveBtn = page.getByText('Save').first();
    await expect(saveBtn).toBeDisabled();
    // Tap a score to enable Save
    await page.getByRole('radio', { name: '0' }).first().click();
    await expect(saveBtn).toBeEnabled();
  });

  test('save enabled on existing entry', async ({ page }) => {
    await completeOnboarding(page);
    // Create entry with data
    await page.getByRole('button', { name: 'Log today\'s entry' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('radio', { name: '5' }).first().click();
    await page.getByText('Save').first().click();
    await page.waitForTimeout(500);
    // Reopen existing entry
    await page.getByRole('button', { name: "Edit today's entry" }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Save').first()).toBeEnabled();
  });

  test('tapping save without data does not create entry', async ({ page }) => {
    await completeOnboarding(page);
    await page.getByRole('button', { name: 'Log today\'s entry' }).click();
    await page.waitForTimeout(500);
    // Save is disabled, clicking should have no effect
    const saveBtn = page.getByText('Save').first();
    await expect(saveBtn).toBeDisabled();
    // Cancel out
    await page.getByText('Cancel').first().click();
    await page.waitForTimeout(500);
    // Should still show "Log today's entry" (not "Edit"), confirming no entry was saved
    await expect(page.getByRole('button', { name: 'Log today\'s entry' })).toBeVisible({ timeout: 2000 });
  });
});
