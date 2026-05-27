import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createFsFileStorage } from "@remix-run/file-storage/fs";

import { logger } from "~/utils/logger.server";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const storageDir = join(
  projectRoot,
  "server-cache/raw.githubusercontent.com/PokeAPI/sprites/master/sprites",
);
logger.debug({ storageDir }, "file-storage init");

export const fileStorage = createFsFileStorage(storageDir);

export function getStorageKey(url: string) {
  const prefix =
    "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/";
  if (url.startsWith(prefix)) {
    return url.slice(prefix.length);
  }
  return null;
}
