import { eq } from "drizzle-orm";
import { db } from "~/lib/db";
import { pumpLogos, fuelRecords } from "~/lib/db/schema";

export async function DELETE({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Invalid pump id." }, { status: 400 });

  const [used] = await db.select({ id: fuelRecords.id })
    .from(fuelRecords).where(eq(fuelRecords.pumpLogoId, id)).limit(1);
  if (used) {
    return Response.json({ error: "This pump is linked to saved records. Keep it to preserve history, or change the linked records first." }, { status: 409 });
  }

  const result = await db.delete(pumpLogos).where(eq(pumpLogos.id, id));
  return Response.json({ deleted: true });
}
