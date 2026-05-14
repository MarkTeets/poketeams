import { getLastMagicLink } from "~/utils/test-inbox.server";

export function loader() {
  if (process.env.TEST_MODE !== "true") {
    throw new Response("Not Found", { status: 404 });
  }
  return Response.json({ link: getLastMagicLink() });
}
