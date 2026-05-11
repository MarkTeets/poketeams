import { useActionData } from "react-router";
import { v4 as uuid } from "uuid";
import { z } from "zod";

import { generateMagicLink, sendMagicLinkEmail } from "~/magic-links.server";
import { commitSession, getSession } from "~/sessions";
import { validateForm } from "~/utils/form-validation";
import { responseErrorPackage, sendData } from "~/utils/response-package";

import type { Route } from "./+types/login";

export async function loader({ request }: Route.LoaderArgs) {
  const cookieHeader = request.headers.get("cookie");
  const session = await getSession(cookieHeader);
  console.log("Loader session data:", session.data);
  return null;
}

const loginSchema = z.object({
  email: z.email(),
});

export async function action({ request }: Route.ActionArgs) {
  const cookieHeader = request.headers.get("cookie");
  const session = await getSession(cookieHeader);
  console.log("Login loader session data:", session.data);
  const formData = await request.formData();

  return validateForm(
    formData,
    loginSchema,
    async ({ email }) => {
      const nonce = uuid();
      session.set("nonce", nonce);
      const link = generateMagicLink(email, nonce);
      const result = await sendMagicLinkEmail(link, email);
      if (!result.ok) {
        return responseErrorPackage({ message: result.message });
      }
      return sendData(
        { success: true, data: undefined, errors: undefined },
        {
          headers: {
            "Set-Cookie": await commitSession(session),
          },
        },
      );
    },
    (errors) => {
      const email = formData.get("email");
      return sendData(
        { success: false, data: typeof email === "string" ? email : undefined, errors },
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
          <h1 className="py-8 text-2xl">Yum!</h1>
          <p>
            Check your email and follow the instructions to finish logging in
          </p>
        </div>
      ) : (
        <div>
          <h1 className="mb-8 text-3xl">React Router Recipes</h1>
          <form method="post" className="
            mx-auto
            md:w-1/3
          ">
            <div className="pb-4 text-left">
              <input
                //type="email"
                name="email"
                placeholder="Email"
                autoComplete="off"
                defaultValue={actionData?.data}
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
