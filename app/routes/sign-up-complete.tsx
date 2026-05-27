import classNames from "classnames";
import { redirect, useActionData, useLoaderData } from "react-router";
import z from "zod";

import { createUser } from "~/models/app_user.server";
import {
  commitSession,
  destroyAuthSession,
  getAuthSession,
  getSession,
} from "~/sessions";
import { validateForm } from "~/utils/form-validation";
import { logger } from "~/utils/logger.server";
import { sendData, sendResponseError } from "~/utils/response-package";

import type { Route } from "./+types/sign-up-complete";

export async function loader({ request }: Route.LoaderArgs) {
  const authSession = await getAuthSession(request.headers.get("cookie"));
  const pendingEmail = authSession.get("pendingEmail");

  if (!pendingEmail) {
    return sendResponseError({
      message:
        "No pending sign-up found. Please start the login process again.",
    });
  }

  return sendData({
    success: true,
    data: { email: pendingEmail },
    errors: null,
  });
}

const signUpSchema = z.object({
  username: z
    .string()
    .transform((val) => (val.includes("@") ? "" : val))
    .pipe(
      z
        .string()
        .max(30, "Username must be 30 characters or fewer")
        .regex(
          /^[a-zA-Z0-9_-]*$/,
          "Username can only contain letters, numbers, underscores, and hyphens",
        ),
    ),
});

export async function action({ request }: Route.ActionArgs) {
  const authSession = await getAuthSession(request.headers.get("cookie"));
  const pendingEmail = authSession.get("pendingEmail");

  if (!pendingEmail) {
    return sendResponseError({
      message: "Session expired. Please start the login process again.",
    });
  }

  const formData = await request.formData();
  return validateForm(
    formData,
    signUpSchema,
    async ({ username }) => {
      const result = await createUser(pendingEmail, username);
      // True only when db call throws an error
      if (!result.ok) {
        return sendData(
          {
            success: false,
            data: { username },
            errors: { message: result.message },
          },
          { status: 500 },
        );
      }

      const user = result.data;
      // True only when db call didn't throw error, but also didn't return a user
      if (!user) {
        return sendData(
          {
            success: false,
            data: { username },
            errors: {
              message:
                "An unexpected error occurred. User was not successfully added to database",
            },
          },
          { status: 500 },
        );
      }

      // User created, Rotate session: destroy auth session, create fresh user session
      const userSession = await getSession(request.headers.get("cookie"));
      userSession.set("userId", user.userId);
      logger.info({ userId: user.userId }, "New user signed up and logged in");
      const headers = new Headers();
      headers.append("Set-Cookie", await destroyAuthSession(authSession));
      headers.append("Set-Cookie", await commitSession(userSession));
      return redirect("/app", { headers });
    },
    (errors) => {
      const rawUsername = formData.get("username");
      const username =
        typeof rawUsername === "string" ? rawUsername : undefined;
      return sendData(
        { success: false, data: { username }, errors },
        { status: 400 },
      );
    },
  );
}

export default function SignUpComplete() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const validSession = loaderData?.success === true;
  return (
    <div>
      {!validSession ? (
        <div className="text-center">
          <div className="mt-24">
            <h1 className="my-8 text-2xl">Login attempt failed</h1>
            <p className="mx-auto max-w-md">{loaderData?.errors?.message}</p>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="mt-24">
            <h1 className="my-8 text-2xl">You&apos;re almost done</h1>
            <h2>Confirm your username below to complete the sign in process</h2>
            <form
              method="post"
              className={classNames(
                "flex flex-col px-8 mx-16 md:mx-auto",
                "border-2 border-gray-200 rounded-md p-8 mt-8 md:w-80",
              )}
            >
              <label htmlFor="username">Username</label>
              <input
                id="username"
                autoComplete="off"
                name="username"
                placeholder="username"
                defaultValue={
                  actionData?.data?.username ?? loaderData?.data?.email ?? ""
                }
              />
              <div>{actionData?.errors?.username}</div>
              <p>
                Replace your email with a preferred username, or leave it as is
              </p>
              <div>{actionData?.errors?.message}</div>
              <button className="mx-auto w-36">Finish Sign Up</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
