import { createCookie } from "react-router";

import { logger } from "~/utils/logger.server";

if (typeof process.env.AUTH_COOKIE_SECRET !== "string") {
  logger.fatal(
    { AUTH_COOKIE_SECRET: process.env.AUTH_COOKIE_SECRET },
    "Missing env: AUTH_COOKIE_SECRET",
  );
  throw new Error("Missing env: AUTH_COOKIE_SECRET");
}

if (typeof process.env.SESSION_COOKIE_SECRET !== "string") {
  logger.fatal(
    { SESSION_COOKIE_SECRET: process.env.SESSION_COOKIE_SECRET },
    "Missing env: SESSION_COOKIE_SECRET",
  );
  throw new Error("Missing env: SESSION_COOKIE_SECRET");
}

const baseCookieConfig = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
};

// Post-login session: stores userId only
export const sessionCookie = createCookie("poketeams__session", {
  ...baseCookieConfig,
  secrets: [process.env.SESSION_COOKIE_SECRET],
});

// Pre-login session: stores nonce and pendingEmail, destroyed on successful login/signup
export const authCookie = createCookie("poketeams__auth", {
  ...baseCookieConfig,
  secrets: [process.env.AUTH_COOKIE_SECRET],
});
