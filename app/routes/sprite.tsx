import { fileStorage, getStorageKey } from "~/utils/file-storage";
import { logger } from "~/utils/logger.server";
import { sendResponseError } from "~/utils/response-package";

import type { Route } from "./+types/sprite";

export async function loader({ params }: Route.LoaderArgs) {
  const url = params.url;
  const key = getStorageKey(url);

  if (key === null) {
    throw new Response(`Resource not found for ${url}`, { status: 404 });
  }

  // Check cache for file first. Populate file if not found
  let file = await fileStorage.get(key);
  logger.debug({ key, hit: !!file }, "sprite cache lookup");

  if (!file) {
    const response = await fetch(url);
    logger.debug({ url, status: response.status }, "sprite fetch from origin");

    if (!response.ok) {
      logger.warn({ response }, `pokeapi failed to retrieve ${url}`);
      return sendResponseError({ message: "PokeApi failed to send image" });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("Content-Type") ?? "image/png";

    file = await fileStorage.put(
      key,
      new File([buffer], key, { type: contentType }),
    );
    logger.debug({ key }, "sprite written to cache");
  }

  return new Response(file.stream(), {
    headers: {
      "Content-Type": file.type,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
