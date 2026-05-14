import { sql } from "drizzle-orm";

import { db } from "../../database/db";

export async function truncateAllTables() {
  const rows = await db.execute<{ qualified: string }>(sql`
    SELECT format('%I.%I', table_schema, table_name) AS qualified
    FROM information_schema.tables
    WHERE table_schema IN ('app_user', 'trainer')
      AND table_type = 'BASE TABLE'
  `);
  const tables = rows.rows.map((r) => r.qualified);
  if (tables.length === 0) return;
  await db.execute(
    sql.raw(`TRUNCATE TABLE ${tables.join(", ")} RESTART IDENTITY CASCADE`),
  );
}
