import { integer, pgSchema, uniqueIndex, varchar } from "drizzle-orm/pg-core";

import { lower, timestamps } from "../utils/columnHelpers";

const appUserSchema = pgSchema("app_user");

export const usersTable = appUserSchema.table(
  "users",
  {
    userId: integer().primaryKey().generatedAlwaysAsIdentity(),
    username: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    password: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("email_unique_ignore_case").on(lower(table.email)),
  ],
);

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;
