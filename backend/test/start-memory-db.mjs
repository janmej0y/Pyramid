/**
 * Boots an in-memory MongoDB and prints its connection string.
 *
 * Lets the API and seed run against a real MongoDB server with no install,
 * which is how the suite is verified locally before an Atlas cluster exists.
 * Keep this process alive for as long as you need the database.
 */
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { writeFileSync } from "node:fs";

// A replica set (not a standalone) so transactions are available if needed.
const replSet = await MongoMemoryReplSet.create({
  replSet: { count: 1 },
});

const uri = replSet.getUri("pyramid");

writeFileSync(new URL("./.memory-db-uri", import.meta.url), uri);
console.log(uri);
console.log("in-memory MongoDB ready — press Ctrl+C to stop");

const shutdown = async () => {
  await replSet.stop();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
