import { db } from "../../db";
import { logger } from "../../utils/db-logger";
import { downloadAll } from "./downloadAll";
import { seed } from "./seed";
import { validate } from "./validate";

const args = new Set(process.argv.slice(2));
const skipDownload = args.has("--skip-download");
const skipValidate = args.has("--skip-validate");
const validateOnly = args.has("--validate-only");

async function run() {
  if (!skipDownload) {
    logger.info("Step 1/3: download");
    await downloadAll();
  } else {
    logger.info("Step 1/3: download (skipped)");
  }

  if (!skipValidate) {
    logger.info("Step 2/3: validate");
    await validate();
  } else {
    logger.info("Step 2/3: validate (skipped)");
  }

  if (validateOnly) {
    logger.info("--validate-only: stopping after validation");
    return;
  }

  logger.info("Step 3/3: seed");
  await seed();

  logger.info("All done");
}

try {
  await run();
} catch (err) {
  logger.error({ err }, "run failed");
  process.exit(1);
} finally {
  await db.$client.end();
}
