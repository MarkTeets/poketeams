import { getUserById, type UserRecord } from "~/models/app_user.server";
import { getSession } from "~/sessions";
import { logger } from "~/utils/logger.server";

export async function getCurrentUser(
  request: Request,
): Promise<UserRecord | null> {
  const cookieHeader = request.headers.get("cookie");
  const session = await getSession(cookieHeader);

  const userId = session.get("userId");

  if (typeof userId !== "number") {
    return null;
  }

  const result = await getUserById(userId);
  if (!result.ok) {
    logger.error(
      { userId, message: result.message, constraint: result.constraint },
      "getCurrentUser: getUserById failed",
    );
    return null;
  }
  return result.data;
}
