import classNames from "classnames";
import { redirect, useActionData, useLoaderData } from "react-router";
import z from "zod";

import { createUser, getUserByEmail } from "~/models/app_user.server";
import { commitSession, getSession } from "~/sessions";
import { validateForm } from "~/utils/form-validation";
import { sendData, sendResponseError } from "~/utils/response-package";

import { getMagicLinkPayload, invalidMagicLink } from "../magic-links.server";
import type { Route } from "./+types/validate-magic-link";

// const magicLinkMaxAge = 1000 * 60 * 10; // 10 minutes
const magicLinkMaxAge = 1000; // 1 second

export async function loader({ request }: Route.LoaderArgs) {
  const magicLinkPayload = getMagicLinkPayload(request);
  // console.log("Loaded magic payload: ", magicLinkPayload);

  // 1. Validate expiration time
  const createdAt = new Date(magicLinkPayload.createdAt);
  const expiresAt = createdAt.getTime() + magicLinkMaxAge;

  if (Date.now() > expiresAt) {
    throw invalidMagicLink("the magic link has expired");
  }

  // 2. Validate nonce
  const cookieHeader = request.headers.get("cookie");
  const session = await getSession(cookieHeader);

  if (session.get("nonce") !== magicLinkPayload.nonce) {
    throw invalidMagicLink("invalid nonce");
  }

  // Try to fetch a user to see if they already exist
  const result = await getUserByEmail(magicLinkPayload.email);

  if (!result.ok) {
    return sendResponseError({ error: result.message });
  }

  const user = result.data;
  // if a user already exists, log them in by setting the session
  if (user) {
    session.set("userId", user.userId);
    session.unset("nonce");
    return redirect("/app", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  return sendData(
    { success: true, data: undefined, errors: undefined },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    },
  );
}

const signUpSchema = z.object({
  username: z.string(),
});

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const usernameRaw = formData.get("username");
  const username = typeof usernameRaw === "string" ? usernameRaw : undefined;
  return validateForm(
    formData,
    signUpSchema,
    async ({ username }) => {
      
      const magicLinkPayload = getMagicLinkPayload(request);
      const result = await createUser(magicLinkPayload.email, username);
      if (!result.ok) {
        return sendData(
          {
            success: false,
            data: { username },
            errors: { error: result.message },
          },
          { status: 500 },
        );
      }
      const user = result.data;
      if (!user) {
        return sendData(
          {
            success: false,
            data: { username },
            errors: {
              error:
                "An unexpected error occurred. User was not successfully added to database",
            },
          },
          { status: 500 },
        );
      }
      const cookie = request.headers.get("cookie");
      const session = await getSession(cookie);
      session.set("userId", user.userId);
      session.unset("nonce");
      return redirect("/app", {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    },
    (errors) =>
      sendData(
        {
          success: false,
          data: { username },
          errors,
        },
        { status: 400 },
      ),
  );
}

export default function ValidateMagicLink() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const loaderFail = loaderData?.success === false;
  return (
    <div className="text-center">
      <div className="mt-24">
        <h1 className="my-8 text-2xl">You&apos;re almost done</h1>
        <h2>Type in your username below to complete the sign in process</h2>
        <form
          method="post"
          className={classNames(
            "flex flex-col px-8 mx-16 md:mx-auto",
            "border-2 border-gray-200 rounded-md p-8 mt-8 md:w-80",
          )}
        >
          <div>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              autoComplete="off"
              name="username"
              placeholder="username"
              defaultValue={actionData?.data?.username ?? ""}
            />
            <div>{actionData?.errors?.username}</div>
            <p>Add a username you&apos;d like to go by, or not!</p>
            <div>{actionData?.errors?.error}</div>
            <div>{loaderFail && loaderData?.errors?.error ? loaderData?.errors?.error : null}</div>
            <div>{loaderData?.errors?.error ?? null}</div>
            <div>{loaderData?.errors?.error}</div>
          </div>
          <button className="mx-auto w-36">Finish Sign Up</button>
        </form>
      </div>
    </div>
  );
}
