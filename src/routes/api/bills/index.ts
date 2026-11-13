import { desc, eq, like, or } from "drizzle-orm";
import { db } from "~/lib/db";
import { fuelRecords, pumpLogos } from "~/lib/db/schema";

export async function GET({ request }: { request: Request }) {
  const url = new URL(request.url);
  const search = (url.searchParams.get("q") || "").trim();
  let query = db.select({
    id: fuelRecords.id,
    recordNumber: fuelRecords.recordNumber,
    purchaseDate: fuelRecords.purchaseDate,
    stationName: fuelRecords.stationName,
    stationAddress: fuelRecords.stationAddress,
    fuelType: fuelRecords.fuelType,
    quantityLitres: fuelRecords.quantityLitres,
    totalAmountPaise: fuelRecords.totalAmountPaise,
    vehicleNumber: fuelRecords.vehicleNumber,
    createdAt: fuelRecords.createdAt,
  }).from(fuelRecords).$dynamic();

  if (search) {
    query = query.where(or(
      like(fuelRecords.recordNumber, `%${search}%`),
      like(fuelRecords.stationName, `%${search}%`),
      like(fuelRecords.vehicleNumber, `%${search}%`),
    ));
  }
  return Response.json(await query.orderBy(desc(fuelRecords.createdAt)).limit(250));
}

export async function POST({ request }: { request: Request }) {
  const input = await request.json();
  const required = ["purchaseDate", "stationName", "stationAddress", "fuelType"];
  if (required.some((key) => !String(input[key] ?? "").trim())) {
    return Response.json({ error: "Please complete the date, station name, address and fuel type." }, { status: 400 });
  }

  const quantity = Number(input.quantityLitres);
  const ratePaise = Math.round(Number(input.fuelRateRupees) * 100);
  const totalPaise = Math.round(quantity * ratePaise);
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(ratePaise) || ratePaise < 0) {
    return Response.json({ error: "Enter a valid quantity and fuel rate." }, { status: 400 });
  }

  let pumpNameSnapshot: string | null = null;
  let pumpLogoSnapshot: Buffer | null = null;
  let pumpLogoMimeTypeSnapshot: string | null = null;
  const pumpLogoId = input.pumpLogoId ? Number(input.pumpLogoId) : null;

  if (pumpLogoId) {
    const [pump] = await db.select().from(pumpLogos).where(eq(pumpLogos.id, pumpLogoId)).limit(1);
    if (!pump) return Response.json({ error: "Selected pump logo no longer exists." }, { status: 400 });
    pumpNameSnapshot = pump.pumpName;
    pumpLogoSnapshot = Buffer.from(pump.logoData);
    pumpLogoMimeTypeSnapshot = pump.logoMimeType;
  }

  const now = new Date().toISOString();
  const recordNumber = `FR-${Date.now()}`;
  const snapshot = {
    ...input,
    recordNumber,
    totalAmountPaise: totalPaise,
    pumpNameSnapshot,
    templateId: input.templateId || "classic",
  };

  const [created] = await db.insert(fuelRecords).values({
    recordNumber,
    purchaseDate: String(input.purchaseDate),
    purchaseTime: input.purchaseTime ? String(input.purchaseTime) : null,
    stationName: String(input.stationName).trim(),
    stationAddress: String(input.stationAddress).trim(),
    pumpLogoId,
    pumpNameSnapshot,
    pumpLogoSnapshot,
    pumpLogoMimeTypeSnapshot,
    fuelType: String(input.fuelType),
    fuelRatePaise: ratePaise,
    quantityLitres: quantity,
    totalAmountPaise: totalPaise,
    vehicleNumber: input.vehicleNumber ? String(input.vehicleNumber).trim() : null,
    paymentMethod: input.paymentMethod ? String(input.paymentMethod) : null,
    templateId: String(input.templateId || "classic"),
    notes: input.notes ? String(input.notes) : null,
    documentSnapshot: JSON.stringify(snapshot),
    createdAt: now,
    updatedAt: now,
  }).returning({ id: fuelRecords.id, recordNumber: fuelRecords.recordNumber });

  return Response.json(created, { status: 201 });
}
