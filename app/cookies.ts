import { createCookie } from "react-router";

if (typeof process.env.AUTH_COOKIE_SECRET !== "string") {
  throw new Error("Missing env: AUTH_COOKIE_SECRET");
}

export const sessionCookie = createCookie("poketeams__session", {
  httpOnly: true,
  secure: true,
  secrets: [process.env.AUTH_COOKIE_SECRET],
});
