import { makeExpiredMagicLink } from "~/magic-links.server";
import { getLastMagicLink } from "~/utils/test-inbox.server";

export function action() {
  if (process.env.TEST_MODE !== "true") {
    throw new Response("Not Found", { status: 404 });
  }
  const original = getLastMagicLink();
  if (!original) {
    return Response.json({ link: null });
  }
  return Response.json({ link: makeExpiredMagicLink(original) });
}
