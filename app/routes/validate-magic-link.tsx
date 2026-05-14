import { replace, useLoaderData } from "react-router";

import { validateMagicLink } from "~/magic-links.server";
import { getUserByEmail } from "~/models/app_user.server";
import {
  commitAuthSession,
  commitSession,
  destroyAuthSession,
  getSession,
} from "~/sessions";
import { logger } from "~/utils/logger.server";
import { sendData, sendResponseError } from "~/utils/response-package";

import type { Route } from "./+types/validate-magic-link";

export async function loader({ request }: Route.LoaderArgs) {
  const validation = await validateMagicLink(request);

  if (!validation.ok) {
    return sendData(
      {
        success: false,
        data: undefined,
        errors: { message: validation.message },
      },
      {
        status: 400,
        headers: {
          "Set-Cookie": await commitAuthSession(validation.session),
        },
      },
    );
  }

  const { payload, session: authSession } = validation;
  const result = await getUserByEmail(payload.email);

  if (!result.ok) {
    return sendResponseError(
      { message: "An error occurred. Please try again later" },
      500,
    );
  }

  const user = result.data;

  if (user) {
    // Existing user: rotate session — destroy auth session, create fresh user session
    const userSession = await getSession(request.headers.get("cookie"));
    userSession.set("userId", user.userId);
    logger.info({ userId: user.userId }, "User logged in");
    const headers = new Headers();
    headers.append("Set-Cookie", await destroyAuthSession(authSession));
    headers.append("Set-Cookie", await commitSession(userSession));
    return replace("/app", { headers });
  }

  // New user: store pendingEmail in auth session, strip magic link from history
  authSession.set("pendingEmail", payload.email);
  authSession.unset("nonce");
  return replace("/sign-up/complete", {
    headers: { "Set-Cookie": await commitAuthSession(authSession) },
  });
}

export default function ValidateMagicLink() {
  const loaderData = useLoaderData<typeof loader>();
  return (
    <div className="text-center">
      <div className="mt-24">
        <h1 className="my-8 text-2xl">Login attempt failed</h1>
        <p className="mx-auto max-w-md">{loaderData?.errors?.message}</p>
      </div>
    </div>
  );
}
