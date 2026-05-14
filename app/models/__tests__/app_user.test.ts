import { describe, expect, test } from "vitest";

import type { ModelResult } from "~/types";

import {
  createUser,
  getAllUsers,
  getUserByEmail,
  getUserById,
} from "../app_user.server";

function expectOk<T>(
  result: ModelResult<T>,
): asserts result is Extract<ModelResult<T>, { ok: true }> {
  if (!result.ok) {
    throw new Error(`Expected ok=true, got error: ${result.message}`);
  }
}

function expectErr<T>(
  result: ModelResult<T>,
): asserts result is Extract<ModelResult<T>, { ok: false }> {
  if (result.ok) {
    throw new Error("Expected ok=false, but call succeeded");
  }
}

describe("createUser", () => {
  test("creates a user and returns it with userId, username, email", async () => {
    const result = await createUser("user@example.com", "user_one");
    expectOk(result);
    expect(result.data).toMatchObject({
      email: "user@example.com",
      username: "user_one",
    });
    expect(typeof result.data?.userId).toBe("number");
  });

  test("falls back to email when no username is provided", async () => {
    const result = await createUser("no-username@example.com");
    expectOk(result);
    expect(result.data?.username).toBe("no-username@example.com");
  });

  test("falls back to email when username is an empty string", async () => {
    const result = await createUser("empty@example.com", "");
    expectOk(result);
    expect(result.data?.username).toBe("empty@example.com");
  });

  test("rejects duplicate email with email_unique_ignore_case constraint", async () => {
    await createUser("dupe@example.com", "first");
    const result = await createUser("dupe@example.com", "second");
    expectErr(result);
    expect(result.constraint).toBe("email_unique_ignore_case");
  });

  test("rejects duplicate email case-insensitively", async () => {
    await createUser("MixedCase@Example.com", "first");
    const result = await createUser("mixedcase@example.COM", "second");
    expectErr(result);
    expect(result.constraint).toBe("email_unique_ignore_case");
  });
});

describe("getUserByEmail", () => {
  test("returns { ok: true, data: null } when no match exists", async () => {
    const result = await getUserByEmail("missing@example.com");
    expect(result).toEqual({ ok: true, data: null });
  });

  test("matches stored mixed-case email when input is lowercased", async () => {
    await createUser("CaseTest@Example.com", "case_user");
    const result = await getUserByEmail("casetest@example.com");
    expectOk(result);
    expect(result.data?.username).toBe("case_user");
  });
});

describe("getUserById", () => {
  test("rejects userId of 0 without a DB call and returns constraint: null", async () => {
    const result = await getUserById(0);
    expectErr(result);
    expect(result.constraint).toBeNull();
    expect(result.message).toMatch(/integer greater than 0/i);
  });

  test("rejects non-integer userId", async () => {
    const result = await getUserById(1.5);
    expectErr(result);
  });

  test("returns { ok: true, data: null } when no user has that id", async () => {
    const result = await getUserById(999999);
    expect(result).toEqual({ ok: true, data: null });
  });

  test("returns the user when found", async () => {
    const created = await createUser("byid@example.com", "by_id_user");
    expectOk(created);
    expect(created.data).not.toBeNull();
    const userId = created.data!.userId;

    const result = await getUserById(userId);
    expectOk(result);
    expect(result.data?.email).toBe("byid@example.com");
    expect(result.data?.username).toBe("by_id_user");
  });
});

describe("getAllUsers", () => {
  test("returns an empty array when no users exist", async () => {
    const result = await getAllUsers();
    expect(result).toEqual({ ok: true, data: [] });
  });

  test("returns every user", async () => {
    await createUser("a@example.com", "a_user");
    await createUser("b@example.com", "b_user");
    const result = await getAllUsers();
    expectOk(result);
    expect(result.data?.length).toBe(2);
  });
});
