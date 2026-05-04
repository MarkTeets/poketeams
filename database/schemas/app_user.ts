import { integer, pgSchema, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "../columnHelpers";

const appUserSchema = pgSchema("app_user");

export const usersTable = appUserSchema.table("users", {
  userId: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  ...timestamps
});

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;
