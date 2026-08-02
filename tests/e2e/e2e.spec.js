import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Sahayak AI — Staff-Grade E2E, A11y, Performance & Visual Automation', () => {

  test('E2E Flow 1: Full Authentication, Dashboard Hydration, & Logout Journey', async ({ page }) => {
    // 1. Measure Performance: Record Initial Load Timings
    const startTime = Date.now();
    await page.goto('/login');
    const loadTime = Date.now() - startTime;
    console.log(`⏱️ Performance - Initial Login Load Time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // Bounded standard load boundary

    // Assert Login elements exist
    await expect(page.locator('h1')).toContainText('SAHAYAK AI');
    await expect(page.locator('button:has-text("AUTHENTICATE & ENTER")')).toBeVisible();

    // 2. Run Accessibility Check (axe-core) on Login screen
    const loginA11y = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    console.log(`♿ Accessibility - Login screen critical violations: ${loginA11y.violations.length}`);
    expect(loginA11y.violations.filter(v => v.impact === 'critical').length).toBeLessThan(10);

    // 3. Quick Login as Rani Devi (Frontline Worker)
    await page.click('button:has-text("Rani Devi")');
    await page.waitForURL('**/');

    // Confirm Dashboard loads and displays dynamic metrics
    await expect(page.locator('body')).toContainText('Welcome back, Rani Devi');
    await expect(page.locator('body')).toContainText('Total Households');
    await expect(page.locator('body')).toContainText('Critical Cases');

    // Take Visual Snapshot of the Worker Dashboard
    await page.screenshot({ path: './tests/visual/worker_dashboard_baseline.png' });
    console.log('📸 Visual Regression - Saved worker dashboard screenshot.');

    // 4. Navigate around sidebars
    await page.click('a:has-text("Household Ledger")');
    await expect(page.locator('body')).toContainText('Household Ledger');

    // 5. Secure Logout
    await page.click('button:has-text("Exit Portal")');
    await page.waitForURL('**/login');
    await expect(page.locator('h1')).toContainText('SAHAYAK AI');
  });

  test('E2E Flow 2: Supervisor Escalation Command Desk Checks', async ({ page }) => {
    await page.goto('/login');
    
    // Quick Login as Dr. Sharma (Supervisor)
    await page.click('button:has-text("Dr. Sharma")');
    await page.waitForURL('**/supervisor');

    // Confirm Supervisor desk loads correctly
    await expect(page.locator('body')).toContainText('ESCALATION COMMAND CENTRE');
    await expect(page.locator('body')).toContainText('Unresolved Alerts');

    // Perform Accessibility analysis on supervisor dashboard
    const supervisorA11y = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    console.log(`♿ Accessibility - Supervisor dashboard critical violations: ${supervisorA11y.violations.length}`);
    expect(supervisorA11y.violations.filter(v => v.impact === 'critical').length).toBeLessThan(10);

    // Take Visual Snapshot of the Supervisor command center
    await page.screenshot({ path: './tests/visual/supervisor_dashboard_baseline.png' });
    console.log('📸 Visual Regression - Saved supervisor dashboard screenshot.');

    // Secure Logout
    await page.click('button:has-text("Exit Portal")');
    await page.waitForURL('**/login');
  });

  test('Responsive Viewports & Tablet Check', async ({ page, isMobile }) => {
    await page.goto('/login');
    
    if (isMobile) {
      console.log('📱 Mobile Viewport detected - verifying responsive layout compatibility');
      const loginBox = await page.locator('button:has-text("AUTHENTICATE & ENTER")').first();
      await expect(loginBox).toBeVisible();
    } else {
      console.log('💻 Desktop Viewport verified');
      await expect(page.locator('h1')).toContainText('SAHAYAK AI');
    }
  });
});
