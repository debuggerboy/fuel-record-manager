import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";

const filename = process.env.DB_FILE_NAME || "./data/fuel-records.db";
mkdirSync(dirname(filename), { recursive: true });

const sqlite = new Database(filename, { create: true });
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");
sqlite.exec("PRAGMA busy_timeout = 5000;");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS pump_logos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pump_name TEXT NOT NULL,
    logo_data BLOB NOT NULL,
    logo_mime_type TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS fuel_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_number TEXT NOT NULL UNIQUE,
    purchase_date TEXT NOT NULL,
    purchase_time TEXT,
    station_name TEXT NOT NULL,
    station_address TEXT NOT NULL,
    pump_logo_id INTEGER,
    pump_name_snapshot TEXT,
    pump_logo_snapshot BLOB,
    pump_logo_mime_type_snapshot TEXT,
    fuel_type TEXT NOT NULL,
    fuel_rate_paise INTEGER NOT NULL,
    quantity_litres REAL NOT NULL,
    total_amount_paise INTEGER NOT NULL,
    vehicle_number TEXT,
    payment_method TEXT,
    template_id TEXT NOT NULL DEFAULT 'classic',
    notes TEXT,
    document_snapshot TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (pump_logo_id) REFERENCES pump_logos(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_fuel_records_purchase_date
    ON fuel_records(purchase_date);
  CREATE INDEX IF NOT EXISTS idx_fuel_records_vehicle
    ON fuel_records(vehicle_number);
`);

export const db = drizzle({ client: sqlite, schema });
export { sqlite };
