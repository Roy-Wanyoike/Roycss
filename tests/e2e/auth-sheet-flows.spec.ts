import { test, expect, type Page, type Route } from "@playwright/test";

/**
 * Auth sheet flows with page.route mocks (issue #277).
 *
 * Every existing spec sleeps 3s "for the auth 401 refresh cycle" — this spec
 * is the fix direction: the auth backend surface is MOCKED, so the sheet
 * flows are hermetic, deterministic and sleep-free.
 *
 * Mock layer (why /api/auth/*, not /api/v1/*): the browser-visible surface
 * of the auth stack is the same-origin Next route layer under /api/auth/*
 * (src/app/api/auth/*), which server-side proxies to the backend's
 * /api/v1/auth/* service. page.route can only intercept BROWSER traffic —
 * the server→backend hop (BACKEND_URL, port 4000) is invisible to it. So:
 *   - /api/auth/me       → 401 (no session) — resolves auth-context
 *                          immediately, replacing the 3s sleep;
 *   - /api/auth/login    → condition-checked: valid creds → 200
 *                          {data: user}, anything else → 401 {error};
 *   - /api/auth/register → 200 {data: user};
 *   - /api/auth/logout   → 200, call-counted for the logout pin;
 *   - /api/v1/**         → defensive 503 JSON — any stray same-origin
 *                          /api/v1 proxy call stays hermetic instead of
 *                          leaking to a backend that isn't running.
 *
 * Validation (invalid creds) = mocked 401 → inline role="alert" error.
 * Client-side register validation (short name/bad email/short password)
 * never needs the network at all.
 */
test.describe("auth sheet flows (mocked backend)", () => {
  test.use({ viewport: { width: 1440, height: 900 } }); // lg+ header cluster

  const VALID_EMAIL = "qa@roycss.test";
  const VALID_PASSWORD = "correct-horse-battery";
  const MOCK_USER = {
    id: "qa-user-1",
    email: VALID_EMAIL,
    name: "QA Tester",
    emailVerified: true,
    createdAt: new Date("2026-01-01T00:00:00Z").toISOString(),
  };

  let logoutCalls: number;

  /** Install the hermetic auth mocks on every test's page. */
  async function mockAuthBackend(page: Page) {
    // No active session → auth-context resolves user=null instantly.
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body: '{"error":"no session"}' }),
    );

    await page.route("**/api/auth/login", async (route: Route) => {
      const body = route.request().postDataJSON() as {
        email?: string;
        password?: string;
      };
      if (body?.email === VALID_EMAIL && body?.password === VALID_PASSWORD) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_USER }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ error: "Invalid email or password" }),
        });
      }
    });

    await page.route("**/api/auth/register", async (route: Route) => {
      const body = route.request().postDataJSON() as { name?: string };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { ...MOCK_USER, name: body?.name ?? MOCK_USER.name } }),
      });
    });

    logoutCalls = 0;
    await page.route("**/api/auth/logout", async (route: Route) => {
      logoutCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: '{"data":null}',
      });
    });

    // Defensive: keep any stray /api/v1 proxy call from hitting a dead backend.
    await page.route("**/api/v1/**", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: '{"error":{"message":"backend unavailable in test"}}',
      }),
    );
  }

  /** Open the login sheet via the header trigger — the wait replaces the 3s sleep. */
  async function openLoginSheet(page: Page) {
    // Route-conditional wait: the signed-out header renders only after the
    // mocked /api/auth/me 401 resolves the auth-context loading state.
    const signIn = page.getByRole("button", { name: "Sign in", exact: true }).first();
    await expect(signIn).toBeVisible();
    await signIn.click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("Sign in to RoyCSS")).toBeVisible();
    return sheet;
  }

  async function login(page: Page) {
    const sheet = await openLoginSheet(page);
    await sheet.getByLabel("Email").fill(VALID_EMAIL);
    await sheet.getByLabel("Password").fill(VALID_PASSWORD);
    await sheet.getByRole("button", { name: "Sign in" }).click();
  }

  test.beforeEach(async ({ page }) => {
    await mockAuthBackend(page);
    await page.goto("/");
    // No 3s sleep: openLoginSheet's toBeVisible wait is route-conditional —
    // it fires exactly when the mocked /api/auth/me has resolved.
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  });

  test("login with invalid credentials shows the backend error inline", async ({ page }) => {
    const sheet = await openLoginSheet(page);
    await sheet.getByLabel("Email").fill(VALID_EMAIL);
    await sheet.getByLabel("Password").fill("wrong-password");
    await sheet.getByRole("button", { name: "Sign in" }).click();

    // The mocked 401 lands → LoginSheet renders the error with role="alert".
    const alert = sheet.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).toHaveText("Invalid email or password");
    // The sheet stays open — no success state was reached.
    await expect(sheet.getByText("Sign in to RoyCSS")).toBeVisible();
    // The header is still signed out (no account menu appeared).
    await expect(page.getByRole("button", { name: "Account menu" })).toHaveCount(0);
  });

  test("login with mocked-valid credentials signs in and closes the sheet", async ({ page }) => {
    await login(page);

    // Success = sheet closes AND the signed-in header (avatar menu) renders.
    const sheet = page.getByRole("dialog");
    await expect(sheet).toHaveCount(0);
    const accountMenu = page.getByRole("button", { name: "Account menu" });
    await expect(accountMenu).toBeVisible();
    // The signed-out triggers are gone.
    await expect(page.getByRole("button", { name: "Create account" })).toHaveCount(0);
  });

  test("register validates invalid input client-side before any network call", async ({
    page,
  }) => {
    const createAccount = page.getByRole("button", { name: "Create account" });
    await createAccount.click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("Create your RoyCSS account")).toBeVisible();

    await sheet.getByLabel("Name").fill("A");
    // "a@b" passes the browser's native type=email constraint but fails the
    // app's stricter regex — so the app-level inline error is what surfaces.
    await sheet.locator("#reg-email").fill("a@b");
    await sheet.getByLabel("Password", { exact: true }).fill("short");
    await sheet.getByLabel("Confirm password").fill("different");
    await sheet.getByRole("button", { name: "Create account" }).click();

    // Inline field errors — the sheets validate before POSTing.
    await expect(sheet.getByText("Name must be at least 2 characters")).toBeVisible();
    await expect(sheet.getByText("Enter a valid email address")).toBeVisible();
    await expect(sheet.getByText("Password must be at least 8 characters")).toBeVisible();
    await expect(sheet.getByText("Passwords do not match")).toBeVisible();
    // Still on the register sheet — no user was created.
    await expect(page.getByRole("button", { name: "Account menu" })).toHaveCount(0);
  });

  test("register with mocked-valid credentials signs in and closes the sheet", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Create account" }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("Create your RoyCSS account")).toBeVisible();

    await sheet.getByLabel("Name").fill("QA Tester");
    await sheet.locator("#reg-email").fill(VALID_EMAIL);
    await sheet.getByLabel("Password", { exact: true }).fill(VALID_PASSWORD);
    await sheet.getByLabel("Confirm password").fill(VALID_PASSWORD);
    await sheet.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible();
  });

  test("logout from the account menu returns the header to signed-out state", async ({
    page,
  }) => {
    await login(page);
    const accountMenu = page.getByRole("button", { name: "Account menu" });
    await expect(accountMenu).toBeVisible();

    await accountMenu.click();
    const signOut = page.getByRole("menuitem", { name: /Sign out/ });
    await expect(signOut).toBeVisible();
    await signOut.click();

    // auth-context clears the user → the signed-out triggers return, and the
    // mocked POST /api/auth/logout was called exactly once.
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
    await expect(accountMenu).toHaveCount(0);
    expect(logoutCalls).toBe(1);
  });
});
