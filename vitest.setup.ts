import { beforeEach } from "vitest";

import { truncateAllTables } from "~/utils/test-db.server";

beforeEach(async () => {
  await truncateAllTables();
});
