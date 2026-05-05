import { sql } from "drizzle-orm";

import { db } from "../db";
import { usersTable } from "../schema";
import { getDbErrorMessage } from "../utils/dbErrorInterpreter";

export const getAllUsers = async () => {
  try {
    const result = await db.select().from(usersTable);
    return { success: true, users: result, error: undefined };
  } catch (error) {
    const { message, constraint } = getDbErrorMessage(error);
    console.error("Database operation failed:", {
      message,
      constraint,
      originalError: error,
    });

    return { success: false, users: undefined, error: message };
  }
};

export const getUserByEmail = async (email: string) => {
  try {
    const result = await db
      .select()
      .from(usersTable)
      .where(sql`lower(${usersTable.email}) = ${email.toLowerCase()}`);
    return { success: true, users: result, error: undefined };
  } catch (error) {
    const { message, constraint } = getDbErrorMessage(error);

    console.error("Database operation failed:", {
      message,
      constraint,
      originalError: error,
    });

    return { success: false, users: undefined, error: message };
  }
};
