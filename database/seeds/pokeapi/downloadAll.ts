import { promises as fsPromises } from "fs";
import * as path from "path";

import { logger } from "../../utils/db-logger";
import { baseUrl, endpointMap, pokeApiResources, protocol } from "./constants";
import { cacheBase } from "./constants";

const CACHE_MAX_DAYS = 30;
const REQUEST_DELAY_MS = 100;
const LIST_LIMIT = 10000;

/** Resolves an absolute path for a cache file given a URL segment (e.g. `"pokemon/1"`). */
function constructCachePath(urlSegment: string): string {
  return path.join(cacheBase, urlSegment + ".json");
}
//console.log(constructCachePath("resources"));

/**
 * Returns `true` if the file at `filePath` exists and is younger than {@link CACHE_MAX_DAYS}.
 * Returns `false` if the file doesn't exist (ENOENT). Re-throws any other filesystem error.
 */
async function isCacheValid(filePath: string): Promise<boolean> {
  try {
    const stats = await fsPromises.stat(filePath);
    const ageInDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
    return ageInDays <= CACHE_MAX_DAYS;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return false;
    logger.error({ err, filePath }, "isCacheValid error");
    throw err;
  }
}

/** Creates all parent directories for `filePath` if they don't already exist. */
async function ensureDirectoryExists(filePath: string): Promise<void> {
  await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
}

/** Returns a promise that resolves after `ms` milliseconds, used to rate-limit API requests. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches `url`, writes the response JSON to `filePath`, and returns the parsed data.
 *
 * @throws {Error} If the HTTP response is not ok.
 */
async function fetchAndWrite(url: string, filePath: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  const data: unknown = await response.json();
  await ensureDirectoryExists(filePath);
  await fsPromises.writeFile(filePath, JSON.stringify(data), "utf8");
  return data;
}

/**
 * Fetches the PokeAPI root resource list and compares it against {@link pokeApiResources}.
 * Returns `true` if the cache is fresh (skipping the fetch) or if the lists match.
 * Returns `false` if the lists differ, signalling that the API has changed.
 *
 * @throws {Error} If the PokeAPI fetch fails.
 */
async function checkResourceList(): Promise<boolean> {
  const cacheFilePath = constructCachePath("resources");

  if (await isCacheValid(cacheFilePath)) {
    logger.debug({ cacheFilePath }, "Resource list cache is fresh");
    return true;
  }

  const response = await fetch(protocol + baseUrl.api);
  if (!response.ok) {
    logger.error(
      { status: response.status },
      "checkResourceList fetch failure",
    );
    throw new Error("PokeAPI resource list fetch failure");
  }
  const fetched = (await response.json()) as Record<string, unknown>;

  const knownKeys = Object.keys(pokeApiResources).sort();
  const fetchedKeys = Object.keys(fetched).sort();
  const matches =
    JSON.stringify(knownKeys) === JSON.stringify(fetchedKeys) &&
    knownKeys.every(
      (k) =>
        fetched[k] === pokeApiResources[k as keyof typeof pokeApiResources],
    );

  logger.debug(
    { matches },
    matches
      ? "Resource list matches known resources"
      : "Resource list does not match known resources",
  );

  if (matches) {
    await ensureDirectoryExists(cacheFilePath);
    await fsPromises.writeFile(cacheFilePath, JSON.stringify(fetched), "utf8");
  }

  return matches;
}

type ListResult = { url: string; name?: string };
type ListResponse = {
  count: number;
  next: string | null;
  results: ListResult[];
};

/**
 * Downloads and caches every resource for a single PokeAPI endpoint.
 * The paginated resource list is cached separately (`__list.json`) and reused when fresh.
 * Each individual resource file is checked against the cache before fetching; stale or missing
 * files are downloaded with a {@link REQUEST_DELAY_MS} delay between requests.
 *
 * @param endpoint - PokeAPI endpoint path, e.g. `"pokemon"` or `"move-ailment"`.
 */
async function fetchAllForEndpoint(endpoint: string): Promise<void> {
  logger.info({ endpoint }, "Starting endpoint download");

  const listCachePath = constructCachePath(`${endpoint}/__list`);
  let allResults: ListResult[];

  if (await isCacheValid(listCachePath)) {
    logger.debug(
      { endpoint, listCachePath },
      "List cache is fresh, skipping list fetch",
    );
    const cached = await fsPromises.readFile(listCachePath, "utf8");
    allResults = JSON.parse(cached) as ListResult[];
  } else {
    let nextUrl: string | null =
      `${protocol}${baseUrl.api}${endpoint}?offset=0&limit=${LIST_LIMIT}`;
    allResults = [];

    while (nextUrl) {
      const response = await fetch(nextUrl);
      if (!response.ok) {
        logger.error(
          { endpoint, status: response.status },
          "List fetch failed",
        );
        return;
      }
      const list = (await response.json()) as ListResponse;
      allResults.push(...list.results);
      nextUrl = list.next;
      if (nextUrl) await delay(REQUEST_DELAY_MS);
    }

    await ensureDirectoryExists(listCachePath);
    await fsPromises.writeFile(
      listCachePath,
      JSON.stringify(allResults),
      "utf8",
    );
    logger.info(
      { endpoint, count: allResults.length },
      "Fetched resource list",
    );
  }

  let skipped = 0;
  let downloaded = 0;
  let failed = 0;

  for (const result of allResults) {
    const urlParts = result.url.replace(/\/$/, "").split("/");
    const id = urlParts[urlParts.length - 1];
    const filePath = constructCachePath(`${endpoint}/${id}`);

    if (await isCacheValid(filePath)) {
      skipped++;
      continue;
    }

    try {
      await fetchAndWrite(
        `${protocol}${baseUrl.api}${endpoint}/${id}`,
        filePath,
      );
      downloaded++;
      await delay(REQUEST_DELAY_MS);
    } catch (err) {
      logger.error({ err, endpoint, id }, "Failed to fetch resource");
      failed++;
    }
  }

  logger.info({ endpoint, downloaded, skipped, failed }, "Endpoint complete");
}

/**
 * Downloads encounter location data for every Pokémon in the local cache.
 * Reads Pokémon IDs from the cached `pokemon/` directory (so that endpoint must be
 * downloaded first) and fetches `pokemon/{id}/encounters` for each stale or missing entry.
 */
async function fetchPokemonLocationAreas(): Promise<void> {
  const endpoint = "pokemon-location-area";
  logger.info({ endpoint }, "Starting pokemon location area download");

  const pokemonDir = path.join(cacheBase, "pokemon");

  let entries;
  try {
    entries = await fsPromises.readdir(pokemonDir);
  } catch (err) {
    logger.error(
      { err },
      "Cannot read pokemon cache dir — run download for pokemon first",
    );
    return;
  }

  const pokemonIds = entries
    .filter((e) => e.endsWith(".json") && !e.startsWith("__"))
    .map((e) => e.replace(".json", ""));

  logger.info({ endpoint, count: pokemonIds.length }, "Found pokemon IDs");

  let skipped = 0;
  let downloaded = 0;
  let failed = 0;

  for (const id of pokemonIds) {
    const filePath = constructCachePath(`${endpoint}/${id}`);

    if (await isCacheValid(filePath)) {
      skipped++;
      logger.debug({ filePath }, "Skipped due to fresh cache");
      continue;
    }

    try {
      await fetchAndWrite(
        `${protocol}${baseUrl.api}pokemon/${id}/encounters`,
        filePath,
      );
      logger.debug({ filePath }, "Download success");
      downloaded++;
      await delay(REQUEST_DELAY_MS);
    } catch (err) {
      logger.error({ err, id }, "Failed to fetch pokemon location area");
      failed++;
    }
  }

  logger.info({ endpoint, downloaded, skipped, failed }, "Endpoint complete");
}

/**
 * Entry point for a full PokeAPI cache download.
 * Verifies the resource list hasn't changed (aborting if it has), then downloads every
 * endpoint in {@link endpointMap} followed by Pokémon location areas.
 * Individual endpoint failures are logged but do not stop the remaining downloads.
 */
export async function downloadAll(): Promise<void> {
  logger.info("Starting full PokeAPI download");

  if (!(await checkResourceList())) {
    logger.error("Aborting download: resource list does not match snapshot");
    return;
  }

  const endpointsToDownload = Object.entries(endpointMap).filter(
    ([key]) => key !== "pokemonLocationArea",
  );

  for (const [key, endpoint] of endpointsToDownload) {
    logger.debug({ key, endpoint }, "Processing endpoint");
    try {
      await fetchAllForEndpoint(endpoint);
    } catch (err) {
      logger.error({ err, key, endpoint }, "Endpoint download failed");
    }
  }

  await fetchPokemonLocationAreas();

  logger.info("Download complete");
}

if (process.argv[1]?.endsWith("downloadAll.ts")) {
  try {
    await downloadAll();
  } catch (err) {
    logger.error({ err }, "downloadAll fatal error");
    process.exit(1);
  }
}
