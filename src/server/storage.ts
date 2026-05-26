import "server-only";

import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const DEFAULT_DATA_DIR = path.resolve(
  process.cwd(),
  "..",
  ".data",
  "swap-web-next"
);

const DATA_DIR = process.env.SWAP_DATA_DIR
  ? path.resolve(process.env.SWAP_DATA_DIR)
  : DEFAULT_DATA_DIR;

async function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

export async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const fullPath = path.join(DATA_DIR, filePath);
    const raw = await readFile(fullPath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeJson(filePath: string, data: unknown): Promise<void> {
  const fullPath = path.join(DATA_DIR, filePath);
  await ensureDir(path.dirname(fullPath));
  await writeFile(fullPath, JSON.stringify(data, null, 2), "utf-8");
}
