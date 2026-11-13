import { integer, real, sqliteTable, text, blob } from "drizzle-orm/sqlite-core";

export const pumpLogos = sqliteTable("pump_logos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pumpName: text("pump_name").notNull(),
  logoData: blob("logo_data", { mode: "buffer" }).notNull(),
  logoMimeType: text("logo_mime_type").notNull(),
  originalFilename: text("original_filename").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const fuelRecords = sqliteTable("fuel_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recordNumber: text("record_number").notNull().unique(),
  purchaseDate: text("purchase_date").notNull(),
  purchaseTime: text("purchase_time"),
  stationName: text("station_name").notNull(),
  stationAddress: text("station_address").notNull(),
  pumpLogoId: integer("pump_logo_id"),
  pumpNameSnapshot: text("pump_name_snapshot"),
  pumpLogoSnapshot: blob("pump_logo_snapshot", { mode: "buffer" }),
  pumpLogoMimeTypeSnapshot: text("pump_logo_mime_type_snapshot"),
  fuelType: text("fuel_type").notNull(),
  fuelRatePaise: integer("fuel_rate_paise").notNull(),
  quantityLitres: real("quantity_litres").notNull(),
  totalAmountPaise: integer("total_amount_paise").notNull(),
  vehicleNumber: text("vehicle_number"),
  paymentMethod: text("payment_method"),
  templateId: text("template_id").notNull().default("classic"),
  notes: text("notes"),
  documentSnapshot: text("document_snapshot").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
