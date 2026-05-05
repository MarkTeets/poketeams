import { SQL, sql } from 'drizzle-orm';
import { type AnyPgColumn, timestamp } from 'drizzle-orm/pg-core';


export const timestamps = {
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp(),
}

export function lower(email: AnyPgColumn): SQL {
  return sql`lower(${email})`;
}