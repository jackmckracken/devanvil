import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = process.cwd();
loadEnv({ path: resolve(projectRoot, ".env") });
if (existsSync(resolve(projectRoot, ".env.local"))) {
  loadEnv({ path: resolve(projectRoot, ".env.local"), override: true });
}
