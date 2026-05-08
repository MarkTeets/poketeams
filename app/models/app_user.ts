import { sql } from "drizzle-orm";

import type { ModelResult } from "~/types";

import { db } from "../../database/db";
import { usersTable } from "../../database/schema";
import { getDbErrorMessage } from "../utils/dbErrorInterpreter";

export type UserRecord = {
  userId: number;
  username: string;
  email: string;
};

export const getAllUsers = async (): Promise<ModelResult<UserRecord[]>> => {
  try {
    const result = await db
      .select({
        userId: usersTable.userId,
        username: usersTable.username,
        email: usersTable.email,
      })
      .from(usersTable);
    return { ok: true, data: result };
  } catch (error) {
    const { message, constraint } = getDbErrorMessage(error);
    console.error("Database operation failed:", { message, constraint, originalError: error });
    return { ok: false, message, constraint };
  }
};

export const getUserByEmail = async (email: string): Promise<ModelResult<UserRecord[]>> => {
  try {
    const result = await db
      .select({
        userId: usersTable.userId,
        username: usersTable.username,
        email: usersTable.email,
      })
      .from(usersTable)
      .where(sql`lower(${usersTable.email}) = ${email.toLowerCase()}`);
    return { ok: true, data: result };
  } catch (error) {
    const { message, constraint } = getDbErrorMessage(error);
    console.error("Database operation failed:", { message, constraint, originalError: error });
    return { ok: false, message, constraint };
  }
};

export const createUser = async (email: string, password: string): Promise<ModelResult<UserRecord>> => {
  try {
    const [user] = await db
      .insert(usersTable)
      .values({ email, password, username: email.charAt(0) })
      .returning({
        userId: usersTable.userId,
        username: usersTable.username,
        email: usersTable.email,
      });
    return { ok: true, data: user };
  } catch (error) {
    const { message, constraint } = getDbErrorMessage(error);
    console.error("Database operation failed:", { message, constraint, originalError: error });
    return { ok: false, message, constraint };
  }
};
