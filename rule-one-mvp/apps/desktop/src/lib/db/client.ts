import Database from "@tauri-apps/plugin-sql";
import { appConfigDir, join } from "@tauri-apps/api/path";

import { DATABASE_NAME, DATABASE_URL } from "./schema";

let databasePromise: Promise<Database> | null = null;

export async function getDatabase(): Promise<Database> {
  if (!databasePromise) {
    databasePromise = Database.load(DATABASE_URL);
  }

  return databasePromise;
}

export async function getDatabaseFilePath(): Promise<string> {
  const baseDir = await appConfigDir();
  return join(baseDir, DATABASE_NAME);
}
