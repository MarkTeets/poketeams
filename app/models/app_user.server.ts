import { eq, sql } from "drizzle-orm";

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

export const getUserByEmail = async (email: string): Promise<ModelResult<UserRecord>> => {
  try {
    const result = await db
      .select({
        userId: usersTable.userId,
        username: usersTable.username,
        email: usersTable.email,
      })
      .from(usersTable)
      .where(sql`lower(${usersTable.email}) = ${email.toLowerCase()}`);
    
    const user = result[0] ?? null;
    return { ok: true, data: user };
  } catch (error) {
    const { message, constraint } = getDbErrorMessage(error);
    console.error("Database operation failed:", { message, constraint, originalError: error });
    return { ok: false, message, constraint };
  }
};


export const getUserById = async (userId: number): Promise<ModelResult<UserRecord>> => {
  if (!Number.isInteger(userId) || userId < 1) {
    return { ok: false, message: "userId must be an integer greater than 0", constraint: null };
  }
  try {
    const result = await db
      .select({
        userId: usersTable.userId,
        username: usersTable.username,
        email: usersTable.email,
      })
      .from(usersTable)
      .where(eq(usersTable.userId, userId));
    const user = result[0] ?? null;
    return { ok: true, data: user };
  } catch (error) {
    const { message, constraint } = getDbErrorMessage(error);
    console.error("Database operation failed:", { message, constraint, originalError: error });
    return { ok: false, message, constraint };
  }
};


export const createUser = async (email: string, username?: string): Promise<ModelResult<UserRecord>> => {
  try {
    const result = await db
      .insert(usersTable)
      .values({ email, username: username ? username : email })
      .returning({
        userId: usersTable.userId,
        username: usersTable.username,
        email: usersTable.email,
      });
    const user = result[0] ?? null;
    return { ok: true, data: user };
  } catch (error) {
    const { message, constraint } = getDbErrorMessage(error);
    console.error("Database operation failed:", { message, constraint, originalError: error });
    return { ok: false, message, constraint };
  }
};
