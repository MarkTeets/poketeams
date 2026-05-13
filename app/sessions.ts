import { createCookieSessionStorage } from "react-router";

import { authCookie, sessionCookie } from "./cookies";

export const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<{ userId: number }, never>({
    cookie: sessionCookie,
  });

export const {
  getSession: getAuthSession,
  commitSession: commitAuthSession,
  destroySession: destroyAuthSession,
} = createCookieSessionStorage<{ nonce: string; pendingEmail: string }, never>({
  cookie: authCookie,
});
