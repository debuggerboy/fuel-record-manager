import { eq } from "drizzle-orm";
import { db } from "~/lib/db";
import { pumpLogos } from "~/lib/db/schema";

export async function GET({ params }: { params: { id: string } }) {
  const id = Number(params.id);

  if (!Number.isInteger(id) || id < 1) {
    return new Response("Invalid pump id", { status: 400 });
  }

  const [pump] = await db
    .select({
      logoData: pumpLogos.logoData,
      logoMimeType: pumpLogos.logoMimeType,
    })
    .from(pumpLogos)
    .where(eq(pumpLogos.id, id))
    .limit(1);

  if (!pump) {
    return new Response("Logo not found", { status: 404 });
  }

  const imageData = new Uint8Array(pump.logoData);

  return new Response(imageData, {
    headers: {
      "Content-Type": pump.logoMimeType,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
