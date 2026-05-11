import Cryptr from "cryptr";
import { renderToStaticMarkup } from "react-dom/server";
import { z } from "zod";

import { sendEmail } from "~/utils/emails.server";

import { sendResponseError } from "./utils/response-package";

if (typeof process.env.MAGIC_LINK_SECRET !== "string") {
  throw new Error("Missing env: MAGIC_LINK_SECRET");
}

const cryptr = new Cryptr(process.env.MAGIC_LINK_SECRET);

const MagicLinkPayloadSchema = z.object({
  email: z.string(),
  nonce: z.string(),
  createdAt: z.string(),
});

type MagicLinkPayload = z.infer<typeof MagicLinkPayloadSchema>;

export function generateMagicLink(email: string, nonce: string) {
  const payload: MagicLinkPayload = {
    email,
    nonce,
    createdAt: new Date().toISOString(),
  };
  const encryptedPayload = cryptr.encrypt(JSON.stringify(payload));

  if (typeof process.env.ORIGIN !== "string") {
    throw new Error("Missing env: ORIGIN");
  }

  const url = new URL(process.env.ORIGIN);
  url.pathname = "/validate-magic-link";
  url.searchParams.set("magic", encryptedPayload);
  return url.toString();
}

export function invalidMagicLink(message: string) {
  return sendResponseError({ error: message });
}

export function getMagicLinkPayload(request: Request) {
  const url = new URL(request.url);
  const magic = url.searchParams.get("magic");

  if (typeof magic !== "string") {
    throw invalidMagicLink("'magic' search parameter does not exist");
  }

  const result = MagicLinkPayloadSchema.safeParse(
    JSON.parse(cryptr.decrypt(magic)),
  );

  if (!result.success) {
    throw invalidMagicLink("invalid magic link payload");
  }

  return result.data;
}

export function sendMagicLinkEmail(link: string, email: string) {
  if (process.env.NODE_ENV !== "production") {
    console.log("process.env.NODE_ENV:", process.env.NODE_ENV);
    console.log(link);
    return { ok: true, id: "console logged" } as const;
  }

  const html = renderToStaticMarkup(
    <div>
      <h1>Log in to Poketeams</h1>
      <p>
        Hey there! Click the link below to finish logging in to the Poketeams
        app.
      </p>
      <a href={link}>Log In</a>
    </div>,
  );
  return sendEmail({
    from: "Poketeams <markteets@gmail.com>",
    to: email,
    subject: "Log in to Poketeams",
    html,
  });
}
