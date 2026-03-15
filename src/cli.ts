#!/usr/bin/env node

import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import { Embedder } from "./embedder/embedder.js";
import { indexDocs } from "./ingest/index-docs.js";
import { logger } from "./logger.js";
import { startServer } from "./server.js";
import { closeDb, openDb } from "./store/db.js";

process.on("uncaughtException", (error) => {
  logger.error({ error }, "Uncaught exception");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled rejection");
  process.exit(1);
});

async function main(): Promise<void> {
  const docsPathEnv = process.env.DOCS_PATH;
  if (!docsPathEnv) {
    logger.error("DOCS_PATH environment variable is required");
    process.exit(1);
  }

  const docsPath = resolve(docsPathEnv.trim());
  const info = await stat(docsPath).catch(() => null);
  if (!info?.isDirectory()) {
    logger.error({ path: docsPath }, "DOCS_PATH is not a directory");
    process.exit(1);
  }

  const embedder = await Embedder.load();
  openDb(docsPath);

  await indexDocs(embedder, docsPath);

  await startServer(embedder);
}

main().catch((error) => {
  closeDb();
  logger.error({ error }, "Failed to start server");
  process.exit(1);
});
