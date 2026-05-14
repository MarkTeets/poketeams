import { useActionData } from "react-router";
import { v4 as uuid } from "uuid";
import { z } from "zod";

import { generateMagicLink, sendMagicLinkEmail } from "~/magic-links.server";
import { requireLoggedOutUserMiddleware } from "~/middleware/auth-middleware.server";
import { commitAuthSession, getAuthSession } from "~/sessions";
import { validateForm } from "~/utils/form-validation";
import { logger } from "~/utils/logger.server";
import {
  allowByEmail,
  allowByIp,
  getClientIp,
} from "~/utils/rate-limit.server";
import { sendData, sendResponseError } from "~/utils/response-package";

import type { Route } from "./+types/login";

export const middleware = [requireLoggedOutUserMiddleware];

export async function loader({ request }: Route.LoaderArgs) {
  const cookieHeader = request.headers.get("cookie");
  const session = await getAuthSession(cookieHeader);
  logger.debug({ session }, "Login loader auth session data");
  return null;
}

const loginSchema = z.object({
  email: z.email(),
});

export async function action({ request }: Route.ActionArgs) {
  const cookieHeader = request.headers.get("cookie");
  const session = await getAuthSession(cookieHeader);
  logger.debug({ session }, "Login action session data");
  const formData = await request.formData();

  return validateForm(
    formData,
    loginSchema,
    async ({ email }) => {
      const ip = getClientIp(request);
      if (!allowByIp(ip) || !allowByEmail(email)) {
        logger.warn({ ip, email }, "Login rate limit exceeded");
        return sendResponseError({
          message: "Too many login attempts. Please wait before trying again.",
        });
      }
      const nonce = uuid();
      session.set("nonce", nonce);
      const link = generateMagicLink(email, nonce);
      const result = await sendMagicLinkEmail(link, email);
      // True if any errors happened sending email via Mailgun
      if (!result.ok) {
        logger.error({ result, email }, "sendMagicLinkEmail failed");
        return sendResponseError({
          message:
            "We are currently having problems sending automated emails, please try again later",
        });
      }
      // Otherwise, send successful status and commit the session
      return sendData(
        { success: true, data: undefined, errors: undefined },
        {
          headers: {
            "Set-Cookie": await commitAuthSession(session),
          },
        },
      );
    },
    (errors) => {
      const rawEmail = formData.get("email");
      const email = typeof rawEmail === "string" ? rawEmail : undefined;
      return sendData(
        {
          success: false,
          data: { email },
          errors,
        },
        { status: 400 },
      );
    },
  );
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  return (
    <div className="mt-36 text-center">
      {actionData?.success ? (
        <div>
          <h1 className="py-8 text-2xl">Huzzah!</h1>
          <p>
            Check your email and follow the instructions to finish logging in
          </p>
        </div>
      ) : (
        <div>
          <h1 className="mb-8 text-3xl">Poketeams</h1>
          <form
            method="post"
            className="
              mx-auto
              md:w-1/3
            "
          >
            <div className="pb-4 text-left">
              <input
                type="email"
                name="email"
                placeholder="Email"
                autoComplete="off"
                defaultValue={actionData?.data?.email}
              />
              <div>{actionData?.errors?.email}</div>
              <div>{actionData?.errors?.message}</div>
            </div>
            <button className="mx-auto w-1/3">Log In</button>
          </form>
          <p>This will also work for first-time users</p>
        </div>
      )}
    </div>
  );
}
