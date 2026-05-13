import { eq, sql } from "drizzle-orm";

import type { ModelResult } from "~/types";
import { logger } from "~/utils/logger.server";

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
  } catch (err) {
    const { message, constraint } = getDbErrorMessage(err);
    logger.error(
      { err, message, constraint },
      "Database call via app_user.getAllUsers failure",
    );
    return { ok: false, message, constraint };
  }
};

export const getUserByEmail = async (
  email: string,
): Promise<ModelResult<UserRecord>> => {
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
  } catch (err) {
    const { message, constraint } = getDbErrorMessage(err);
    logger.error(
      { emailParam: email, err, message, constraint },
      "Database call via app_user.getUserByEmail failure",
    );
    return { ok: false, message, constraint };
  }
};

export const getUserById = async (
  userId: number,
): Promise<ModelResult<UserRecord>> => {
  if (!Number.isInteger(userId) || userId < 1) {
    return {
      ok: false,
      message: "userId must be an integer greater than 0",
      constraint: null,
    };
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
  } catch (err) {
    const { message, constraint } = getDbErrorMessage(err);
    logger.error(
      { userIdParam: userId, err, message, constraint },
      "Database call via app_user.getUserById failure",
    );
    return { ok: false, message, constraint };
  }
};

export const createUser = async (
  email: string,
  username?: string,
): Promise<ModelResult<UserRecord>> => {
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
  } catch (err) {
    const { message, constraint } = getDbErrorMessage(err);
    logger.error(
      { emailParam: email, usernameParam: username, err, message, constraint },
      "Database call via app_user.createUser failure",
    );
    return { ok: false, message, constraint };
  }
};
