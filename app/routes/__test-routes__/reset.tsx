import { resetRateLimits } from "~/utils/rate-limit.server";
import { truncateAllTables } from "~/utils/test-db.server";
import { clearTestInbox } from "~/utils/test-inbox.server";

export async function action() {
  if (process.env.TEST_MODE !== "true") {
    throw new Response("Not Found", { status: 404 });
  }
  await truncateAllTables();
  resetRateLimits();
  clearTestInbox();
  return Response.json({ ok: true });
}
