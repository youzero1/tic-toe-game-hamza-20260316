import "reflect-metadata";
import { DataSource } from "typeorm";
import { GameResult } from "../entities/GameResult";
import path from "path";
import fs from "fs";

let dataSource: DataSource | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  const dbPath = path.resolve(process.cwd(), "database.sqlite");

  // Ensure the directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dataSource = new DataSource({
    type: "sqljs",
    location: dbPath,
    autoSave: true,
    entities: [GameResult],
    synchronize: true,
    logging: false,
  });

  await dataSource.initialize();
  return dataSource;
}
