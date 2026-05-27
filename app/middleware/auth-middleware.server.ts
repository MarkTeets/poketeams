import { createContext, type MiddlewareFunction, redirect } from "react-router";

import type { UserRecord } from "~/models/app_user.server";
import { getCurrentUser } from "~/utils/auth.server";
import { logger } from "~/utils/logger.server";

export const requireLoggedOutUserMiddleware: MiddlewareFunction = async ({
  request,
}) => {
  const user = await getCurrentUser(request);
  if (user !== null) {
    logger.debug(
      { userId: user.userId },
      "requireLoggedOutUserMiddleware: user is logged in, redirecting to /app",
    );
    throw redirect("/app");
  }
};

export const userContext = createContext<UserRecord | null>(null);

export const requireLoggedInUserMiddleware: MiddlewareFunction = async ({
  request,
  context,
}) => {
  const user = await getCurrentUser(request);
  if (user === null) {
    logger.debug(
      "requireLoggedInUserMiddleware: no user, redirecting to /login",
    );
    throw redirect("/login");
  }
  context.set(userContext, user);
};
