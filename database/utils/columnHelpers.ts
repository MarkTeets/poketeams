import { SQL, sql } from "drizzle-orm";
import { type AnyPgColumn, timestamp } from "drizzle-orm/pg-core";

// app-owned tables (trainer.*, app_user.*) — keep full timestamps
export const timestamps = {
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .notNull()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp(),
};

// pokeapi.* tables — nothing
// (intentional: per-row timestamps are meaningless for truncate-and-reseed data;
//  see meta.pokeapi_seed_runs for the audit trail)

export function lower(email: AnyPgColumn): SQL {
  return sql`lower(${email})`;
}
