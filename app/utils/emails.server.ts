import FormData from "form-data";
import Mailgun from "mailgun.js";

import { logger } from "./logger.server";

if (typeof process.env.MAILGUN_API_KEY !== "string") {
  logger.fatal(
    { MAILGUN_API_KEY: process.env.MAILGUN_API_KEY },
    "Missing env: MAILGUN_API_KEY",
  );
  throw new Error("Missing env: MAILGUN_API_KEY");
}

const mailgun = new Mailgun(FormData);
const client = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY,
});

type Message = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

type EmailResult =
  | { ok: true; id: string }
  | { ok: false; message: string; status: number };

function classifyMailgunError(err: unknown): {
  message: string;
  status: number;
} {
  const status =
    typeof err === "object" && err !== null && "status" in err
      ? (err as { status: number }).status
      : 0;

  switch (status) {
    case 401:
      return { message: "Email service rejected the API key.", status };
    case 402:
      return { message: "Email account limit reached.", status };
    case 404:
      return { message: "Email domain not found.", status };
    case 429:
      return { message: "Email rate limit exceeded.", status };
    default:
      return {
        message: err instanceof Error ? err.message : "Failed to send email.",
        status,
      };
  }
}

export async function sendEmail(message: Message): Promise<EmailResult> {
  if (typeof process.env.MAILGUN_DOMAIN !== "string") {
    logger.fatal(
      { MAILGUN_DOMAIN: process.env.MAILGUN_DOMAIN },
      "Missing env: MAILGUN_DOMAIN",
    );
    throw new Error("Missing env: MAILGUN_DOMAIN");
  }
  try {
    const response = await client.messages.create(
      process.env.MAILGUN_DOMAIN,
      message,
    );
    return { ok: true, id: response.id ?? "" };
  } catch (err) {
    return { ok: false, ...classifyMailgunError(err) };
  }
}
