import { eq } from "drizzle-orm";
import { db } from "~/lib/db";
import { fuelRecords } from "~/lib/db/schema";

export async function GET({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Invalid record id." }, { status: 400 });
  const [record] = await db.select().from(fuelRecords).where(eq(fuelRecords.id, id)).limit(1);
  if (!record) return Response.json({ error: "Record not found." }, { status: 404 });

  return Response.json({
    ...record,
    pumpLogoSnapshot: record.pumpLogoSnapshot
      ? Buffer.from(record.pumpLogoSnapshot).toString("base64")
      : null,
    document: JSON.parse(record.documentSnapshot),
  });
}

export async function DELETE({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Invalid record id." }, { status: 400 });
  await db.delete(fuelRecords).where(eq(fuelRecords.id, id));
  return Response.json({ deleted: true });
}
