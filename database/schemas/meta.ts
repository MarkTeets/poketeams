import { integer, pgSchema, text, timestamp, varchar } from "drizzle-orm/pg-core";

const metaSchema = pgSchema("meta");

export const pokeapiSeedRunsTable = metaSchema.table("pokeapi_seed_runs", {
  pokeapiSeedRunId: integer().primaryKey().generatedAlwaysAsIdentity(),
  startedAt: timestamp().defaultNow().notNull(),
  completedAt: timestamp(),
  status: varchar({ length: 20 }).notNull(),
  sourceCommit: varchar({ length: 40 }),
  pokeapiSnapshotDate: timestamp(),
  tableRowCounts: text(),
  notes: text(),
});
