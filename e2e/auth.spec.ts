import {
  type APIRequestContext,
  expect,
  type Page,
  test,
} from "@playwright/test";

async function submitLoginForm(page: Page, email: string) {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByRole("button", { name: /log in/i }).click();
}

async function getMagicLink(request: APIRequestContext) {
  const res = await request.get("/__test/last-magic-link");
  expect(res.ok()).toBe(true);
  const { link } = (await res.json()) as { link: string | null };
  expect(link).not.toBeNull();
  return link!;
}

test.beforeEach(async ({ request }) => {
  const res = await request.post("/__test/reset");
  expect(res.ok()).toBe(true);
});

test("new user can sign up via magic link and reach /app", async ({
  page,
  request,
}) => {
  const email = `e2e-${Date.now()}@example.com`;
  await submitLoginForm(page, email);
  await expect(page.getByRole("heading", { name: /huzzah/i })).toBeVisible();

  const link = await getMagicLink(request);
  await page.goto(link);
  await expect(page).toHaveURL(/\/sign-up\/complete$/);

  await page.getByLabel(/username/i).fill("e2e_user");
  await page.getByRole("button", { name: /finish sign up/i }).click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("link", { name: /logout/i })).toBeVisible();
});

test("existing user can log in via magic link and skips the sign-up step", async ({
  page,
  request,
}) => {
  const email = `e2e-existing-${Date.now()}@example.com`;

  // Setup: create the user by walking through the signup flow once.
  await submitLoginForm(page, email);
  const signupLink = await getMagicLink(request);
  await page.goto(signupLink);
  await page.getByLabel(/username/i).fill("existing_user");
  await page.getByRole("button", { name: /finish sign up/i }).click();
  await expect(page).toHaveURL(/\/app$/);

  await page.getByRole("link", { name: /logout/i }).click();
  await expect(
    page.getByRole("heading", { name: /you're good to go/i }),
  ).toBeVisible();

  // Log in again — same email, user now exists.
  await submitLoginForm(page, email);
  await expect(page.getByRole("heading", { name: /huzzah/i })).toBeVisible();

  const loginLink = await getMagicLink(request);
  await page.goto(loginLink);

  // Existing user should go straight to /app, not /sign-up/complete.
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("link", { name: /logout/i })).toBeVisible();
});

test("login is case-insensitive on email", async ({ page, request }) => {
  const upperEmail = `Foo-${Date.now()}@Example.com`;
  const lowerEmail = upperEmail.toLowerCase();

  await submitLoginForm(page, upperEmail);
  const signupLink = await getMagicLink(request);
  await page.goto(signupLink);
  await page.getByLabel(/username/i).fill("case_user");
  await page.getByRole("button", { name: /finish sign up/i }).click();
  await expect(page).toHaveURL(/\/app$/);

  await page.getByRole("link", { name: /logout/i }).click();
  await expect(
    page.getByRole("heading", { name: /you're good to go/i }),
  ).toBeVisible();

  await submitLoginForm(page, lowerEmail);
  const loginLink = await getMagicLink(request);
  await page.goto(loginLink);

  // Resolves to the same user — straight to /app, not /sign-up/complete.
  await expect(page).toHaveURL(/\/app$/);
});

test("sign-up form rejects invalid usernames", async ({ page, request }) => {
  const email = `e2e-bad-username-${Date.now()}@example.com`;
  await submitLoginForm(page, email);
  const link = await getMagicLink(request);
  await page.goto(link);
  await expect(page).toHaveURL(/\/sign-up\/complete$/);

  await page.getByLabel(/username/i).fill("has spaces");
  await page.getByRole("button", { name: /finish sign up/i }).click();
  await expect(
    page.getByText(/username can only contain letters/i),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/sign-up\/complete$/);

  await page.getByLabel(/username/i).fill("a".repeat(31));
  await page.getByRole("button", { name: /finish sign up/i }).click();
  await expect(page.getByText(/30 characters or fewer/i)).toBeVisible();
  await expect(page).toHaveURL(/\/sign-up\/complete$/);
});

test("invalid email format shows field-level error and does not send a link", async ({
  page,
  request,
}) => {
  await page.goto("/login");
  // Bypass the browser's native <input type="email"> validation so the request
  // actually reaches the server and Zod's check runs.
  await page
    .locator("form")
    .evaluate((form: HTMLFormElement) => (form.noValidate = true));
  await page.getByPlaceholder("Email").fill("not-an-email");
  await page.getByRole("button", { name: /log in/i }).click();

  await expect(page.getByText(/invalid email address/i)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /huzzah/i }),
  ).not.toBeVisible();

  const res = await request.get("/__test/last-magic-link");
  const { link } = (await res.json()) as { link: string | null };
  expect(link).toBeNull();
});

test("tampered magic link shows the failure page", async ({ page }) => {
  await page.goto("/validate-magic-link?magic=not-a-real-token");
  await expect(
    page.getByRole("heading", { name: /login attempt failed/i }),
  ).toBeVisible();
  await expect(page.getByText(/this link is invalid/i)).toBeVisible();
});

test("missing magic param shows the failure page", async ({ page }) => {
  await page.goto("/validate-magic-link");
  await expect(
    page.getByRole("heading", { name: /login attempt failed/i }),
  ).toBeVisible();
});

test("expired magic link shows the expiry message", async ({
  page,
  request,
}) => {
  const email = `e2e-expired-${Date.now()}@example.com`;
  await submitLoginForm(page, email);
  await expect(page.getByRole("heading", { name: /huzzah/i })).toBeVisible();

  const expireRes = await request.post("/__test/expire-last-link");
  expect(expireRes.ok()).toBe(true);
  const { link } = (await expireRes.json()) as { link: string | null };
  expect(link).not.toBeNull();

  await page.goto(link!);
  await expect(
    page.getByRole("heading", { name: /login attempt failed/i }),
  ).toBeVisible();
  await expect(page.getByText(/this link has expired/i)).toBeVisible();
});

test("magic link opened without the original session is rejected (nonce mismatch)", async ({
  page,
  request,
}) => {
  const email = `e2e-nonce-${Date.now()}@example.com`;
  await submitLoginForm(page, email);
  await expect(page.getByRole("heading", { name: /huzzah/i })).toBeVisible();

  const link = await getMagicLink(request);
  await page.context().clearCookies();

  await page.goto(link);
  await expect(
    page.getByRole("heading", { name: /login attempt failed/i }),
  ).toBeVisible();
  await expect(page).not.toHaveURL(/\/app$/);
});

test("rate limit blocks after 5 attempts from the same IP", async ({
  page,
}) => {
  for (let i = 1; i <= 5; i++) {
    await submitLoginForm(page, `e2e-rl-${i}-${Date.now()}@example.com`);
    await expect(page.getByRole("heading", { name: /huzzah/i })).toBeVisible();
  }

  await submitLoginForm(page, `e2e-rl-6-${Date.now()}@example.com`);
  await expect(page.getByText(/too many login attempts/i)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /huzzah/i }),
  ).not.toBeVisible();
});

test("rate limit blocks after 5 attempts from the same email", async ({
  page,
}) => {
  const email = `e2e-rl-email-${Date.now()}@example.com`;

  for (let i = 1; i <= 5; i++) {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.0.0.${i}` });
    await submitLoginForm(page, email);
    await expect(page.getByRole("heading", { name: /huzzah/i })).toBeVisible();
  }

  await page.setExtraHTTPHeaders({ "x-forwarded-for": "10.0.0.99" });
  await submitLoginForm(page, email);
  await expect(page.getByText(/too many login attempts/i)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /huzzah/i }),
  ).not.toBeVisible();
});

test("/sign-up/complete without a pending email shows the failure page", async ({
  page,
}) => {
  await page.goto("/sign-up/complete");
  await expect(
    page.getByRole("heading", { name: /login attempt failed/i }),
  ).toBeVisible();
  await expect(page.getByText(/no pending sign-up found/i)).toBeVisible();
});
