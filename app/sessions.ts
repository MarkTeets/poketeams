import { createCookieSessionStorage } from "react-router";

import { sessionCookie } from "./cookies";

export const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<{ userId: number, nonce: string }, never>({
    cookie: sessionCookie,
  });
