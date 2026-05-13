import Cryptr from "cryptr";
import { renderToStaticMarkup } from "react-dom/server";
import { z } from "zod";

import { sendEmail } from "~/utils/emails.server";

import { getAuthSession } from "./sessions";
import { logger } from "./utils/logger.server";

if (typeof process.env.MAGIC_LINK_SECRET !== "string") {
  logger.fatal(
    { MAGIC_LINK_SECRET: process.env.MAGIC_LINK_SECRET },
    "Missing env: MAGIC_LINK_SECRET",
  );
  throw new Error("Missing env: MAGIC_LINK_SECRET");
}

const cryptr = new Cryptr(process.env.MAGIC_LINK_SECRET);

const MagicLinkPayloadSchema = z.object({
  email: z.string(),
  nonce: z.string(),
  createdAt: z.string(),
});

type MagicLinkPayload = z.infer<typeof MagicLinkPayloadSchema>;

/**
 * Builds a signed, encrypted magic link URL for the given email.
 *
 * @param email - The recipient's email address, embedded in the encrypted payload.
 * @param nonce - A one-time UUID that must match the session nonce during validation.
 * @returns An absolute URL string pointing to `/validate-magic-link?magic=<encrypted-payload>`.
 * @throws {Error} If the `ORIGIN` environment variable is not set.
 */
export function generateMagicLink(email: string, nonce: string) {
  const payload: MagicLinkPayload = {
    email,
    nonce,
    createdAt: new Date().toISOString(),
  };
  const encryptedPayload = cryptr.encrypt(JSON.stringify(payload));

  if (typeof process.env.ORIGIN !== "string") {
    logger.fatal({ ORIGIN: process.env.ORIGIN }, "Missing env: ORIGIN");
    throw new Error("Missing env: ORIGIN");
  }

  const url = new URL(process.env.ORIGIN);
  url.pathname = "/validate-magic-link";
  url.searchParams.set("magic", encryptedPayload);
  return url.toString();
}

const magicLinkMaxAge = 1000 * 60 * 10; // 10 minutes
// const magicLinkMaxAge = 1000; // 1 second

const expiredMagicLinkMessage = `This link has expired (links are valid for ${magicLinkMaxAge / 60000} minutes). Please request a new one from the login page.`;

const retryLoginMessage =
  "This link is invalid. Please request a new one from the login page, and make sure to open it on the same browser you used to log in.";

type Session = Awaited<ReturnType<typeof getAuthSession>>;

export type ValidateMagicLinkResult =
  | { ok: true; payload: MagicLinkPayload; session: Session }
  | {
      ok: false;
      reason: "invalid" | "expired" | "nonce_mismatch";
      message: string;
      session: Session;
    };

/**
 * Validates the magic link in the request URL against the session nonce.
 *
 * Reads the `magic` search parameter from the request URL and the `nonce` from
 * the session cookie. Always returns the session so the caller can commit or
 * destroy it regardless of outcome.
 *
 * @param request - The incoming request; must carry both the `?magic=` param and a session cookie.
 * @returns `{ ok: true, payload, session }` on success, or `{ ok: false, reason, message, session }`
 *   where `reason` is `"invalid"` (bad/missing token), `"expired"`, or `"nonce_mismatch"`.
 */
export async function validateMagicLink(
  request: Request,
): Promise<ValidateMagicLinkResult> {
  const cookieHeader = request.headers.get("cookie");
  const session = await getAuthSession(cookieHeader);

  const url = new URL(request.url);
  const magic = url.searchParams.get("magic");

  if (typeof magic !== "string") {
    logger.warn({ url, magic }, "'magic' search parameter does not exist");
    return {
      ok: false,
      reason: "invalid",
      message: retryLoginMessage,
      session,
    };
  }

  let payload: MagicLinkPayload;
  try {
    const parsed = MagicLinkPayloadSchema.safeParse(
      JSON.parse(cryptr.decrypt(magic)),
    );
    if (!parsed.success) {
      logger.warn(
        { parsed, magic },
        "magic link payload failed schema validation",
      );
      return {
        ok: false,
        reason: "invalid",
        message: retryLoginMessage,
        session,
      };
    }
    payload = parsed.data;
  } catch (err) {
    logger.error(
      { magic, err },
      "decrypt threw, invalid or tampered magic link",
    );
    return {
      ok: false,
      reason: "invalid",
      message: retryLoginMessage,
      session,
    };
  }

  const createdAt = new Date(payload.createdAt);
  const expiresAt = createdAt.getTime() + magicLinkMaxAge;
  if (Date.now() > expiresAt) {
    logger.warn(
      { payload, magicLinkExpiresAt: expiresAt },
      "the magic link has expired",
    );
    session.unset("nonce");
    return {
      ok: false,
      reason: "expired",
      message: expiredMagicLinkMessage,
      session,
    };
  }

  const sessionNonce = session.get("nonce");
  if (!sessionNonce || sessionNonce !== payload.nonce) {
    logger.warn(
      { payload, sessionNoncePresent: !!sessionNonce },
      "nonce missing or mismatched",
    );
    session.unset("nonce");
    return {
      ok: false,
      reason: "nonce_mismatch",
      message: retryLoginMessage,
      session,
    };
  }

  return { ok: true, payload, session };
}

/**
 * Sends the magic link to the given email address.
 *
 * In non-production environments the link is console-logged and no email is sent.
 *
 * @param link - The full magic link URL returned by {@link generateMagicLink}.
 * @param email - The recipient's email address.
 * @returns `{ ok: true, id }` on success; the shape matches the Resend API response.
 */
export function sendMagicLinkEmail(link: string, email: string) {
  if (process.env.NODE_ENV !== "production") {
    logger.debug({ link }, "Magic link (non-production)");
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
