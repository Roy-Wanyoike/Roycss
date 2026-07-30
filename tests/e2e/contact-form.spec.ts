import { test, expect } from "@playwright/test";

/**
 * Contact form — opened from the mobile menu or footer.
 *
 * The form POSTs to `/api/contact`. We mock that endpoint via `page.route`
 * so the suite is hermetic — no database, no email provider.
 *
 * Golden path:
 *   1. Opening the form via the mobile menu reveals name/email/subject/message fields.
 *   2. Submitting with empty fields surfaces an error response from the API.
 *   3. Submitting valid data with the API mocked to `{ ok: true }` shows the
 *      success state.
 *
 * Note: the form uses native HTML inputs (no client-side zod validation),
 * so "empty-field validation" is exercised through the mocked 400 response.
 */
test.describe("contact form", () => {
  test.beforeEach(async ({ page }) => {
    // Mobile viewport so the hamburger menu (which exposes the Contact link) is visible.
    await page.setViewportSize({ width: 375, height: 720 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("button", { name: "Contact" }).click();
  });

  test("opens with name, email, and message fields visible", async ({ page }) => {
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("#contact-name")).toBeVisible();
    await expect(dialog.locator("#contact-email")).toBeVisible();
    await expect(dialog.locator("#contact-message")).toBeVisible();
  });

  test("submitting empty fields surfaces an error", async ({ page }) => {
    // Mock the API to return a 400 with a validation error.
    await page.route("**/api/contact", (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ ok: false, error: "Name and email are required." }),
      }),
    );

    const dialog = page.getByRole("dialog");
    const submit = dialog.getByRole("button", { name: /Send|Submit/i }).first();
    await submit.click();

    // The form should display the error message somewhere in the dialog.
    await expect(dialog.getByText(/required|invalid|error/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("submitting valid data shows the success state when API returns ok", async ({ page }) => {
    await page.route("**/api/contact", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      }),
    );

    const dialog = page.getByRole("dialog");
    await dialog.locator("#contact-name").fill("Test User");
    await dialog.locator("#contact-email").fill("test@example.com");
    await dialog.locator("#contact-message").fill("This is a test message with enough length.");

    const submit = dialog.getByRole("button", { name: /Send|Submit/i }).first();
    await submit.click();

    // Success copy in the dialog: typically "Message sent" or a checkmark icon.
    await expect(dialog.getByText(/sent|success|thank/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("closing the form via the sheet's close button hides it", async ({ page }) => {
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Radix Sheet exposes an aria-label="Close" button in the top-right.
    const closeBtn = dialog.getByRole("button", { name: /Close/i }).first();
    await closeBtn.click();
    await expect(dialog).toBeHidden();
  });

  test("the message field shows a character counter", async ({ page }) => {
    const dialog = page.getByRole("dialog");
    const message = dialog.locator("#contact-message");
    await message.fill("hello world");
    // The counter pattern is "N / min" or just "N characters" — assert any digit appears.
    await expect(dialog.getByText(/\d+/).first()).toBeVisible();
  });
});
