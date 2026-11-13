import { db } from "~/lib/db";
import { pumpLogos } from "~/lib/db/schema";
import { desc } from "drizzle-orm";

const MAX_BYTES = Number(process.env.MAX_LOGO_SIZE_MB || 3) * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function GET() {
  const rows = await db
    .select({
      id: pumpLogos.id,
      pumpName: pumpLogos.pumpName,
      logoMimeType: pumpLogos.logoMimeType,
      originalFilename: pumpLogos.originalFilename,
      createdAt: pumpLogos.createdAt,
    })
    .from(pumpLogos)
    .orderBy(desc(pumpLogos.createdAt));
  return Response.json(rows);
}

export async function POST({ request }: { request: Request }) {
  const form = await request.formData();
  const pumpName = String(form.get("pumpName") || "").trim();
  const file = form.get("logo");

  if (!pumpName) return Response.json({ error: "Pump name is required." }, { status: 400 });
  if (!(file instanceof File)) return Response.json({ error: "A logo file is required." }, { status: 400 });
  if (!ALLOWED.has(file.type)) return Response.json({ error: "Upload PNG, JPG or WebP only." }, { status: 415 });
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return Response.json({ error: `Logo must be smaller than ${MAX_BYTES / 1024 / 1024} MB.` }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  // Check signatures instead of trusting the browser-provided MIME type.
  const isPng = bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
  const isJpeg = bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const isWebp = bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!isPng && !isJpeg && !isWebp) {
    return Response.json({ error: "The uploaded file does not match a supported image format." }, { status: 415 });
  }

  const now = new Date().toISOString();
  const [created] = await db.insert(pumpLogos).values({
    pumpName,
    logoData: Buffer.from(bytes),
    logoMimeType: file.type,
    originalFilename: file.name.slice(0, 255),
    createdAt: now,
    updatedAt: now,
  }).returning({ id: pumpLogos.id });

  return Response.json({ id: created.id, pumpName }, { status: 201 });
}
