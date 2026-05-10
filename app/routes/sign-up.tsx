import { data, Form, useActionData } from "react-router";
import z from "zod";

import { createUser } from "~/models/app_user.server";
import { validateForm } from "~/utils/form-validation";
import { sendResponseData } from "~/utils/response-package";

import type { Route } from "./+types/sign-up";

type SignUpErrors = {
  email?: string;
  password?: string;
  form?: string;
};

const signUpSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password cannot be blank"),
});

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  return validateForm(formData, signUpSchema, async ({ email, password }) => {
    const result = await createUser(email, password);
    if (!result.ok) {
      const errors: SignUpErrors =
        result.constraint === "email_unique_ignore_case"
          ? { email: "An account with that email already exists" }
          : { form: result.message };
      return data({ success: false, data: { email }, errors }, { status: 400 });
    }
    return sendResponseData(result.data);
  });
}

export default function SignUp() {
  const actionData = useActionData<typeof action>();

  if (actionData?.success) {
    return <SignUpSuccess />;
  }

  const actionEmail = actionData?.data?.email;

  return (
    <div>
      <Form method="post">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          name="email"
          id="email"
          placeholder="email"
          defaultValue={actionEmail ?? ""}
        />
        {actionData?.errors?.email ? (
          <div>Error: {actionData.errors.email}</div>
        ) : null}
        <label htmlFor="password">Password</label>
        <input
          type="text"
          name="password"
          id="password"
          placeholder="password"
        />
        {actionData?.errors?.password ? (
          <div>Error: {actionData.errors.password}</div>
        ) : null}
        {actionData?.errors?.form ? (
          <div>Error: {actionData.errors.form}</div>
        ) : null}
        <button>Sign Up</button>
      </Form>
    </div>
  );
}

function SignUpSuccess() {
  return <div>Sign up successful</div>;
}
