# Agents.md — Fuel Record Manager

## Project purpose
A local-first fuel purchase record manager inspired by the workflow of online fuel-bill generators. It stores user-entered personal records and pump logos in SQLite. It must not impersonate a fuel retailer, create counterfeit receipts, or present generated documents as official proof of purchase. Clearly label output as a personal record.

## Stack
- SolidStart 1.x (Bun deployment preset)
- SolidJS + TypeScript
- Bun runtime and `bun:sqlite`
- Drizzle ORM with the `bun-sqlite` adapter
- SQLite database persisted at `DB_FILE_NAME`
- Docker Compose with a named volume
- HTML/CSS preview, browser Print-to-PDF, and PNG export using `html-to-image`

## Important runtime compatibility decision
Use SolidStart 1.x for this Bun-runtime scaffold. SolidStart 2 currently documents a Node.js 24+ prerequisite, so do not casually upgrade `@solidjs/start` to 2.x while keeping the Bun runtime. Re-evaluate the runtime and deployment adapter before upgrading.

## Data model
- `pump_logos`: pump display name, image BLOB, MIME type, original filename, timestamps.
- `fuel_records`: user-entered purchase data, integer paise amounts, selected pump reference, and immutable pump name/logo snapshots.
- Keep monetary amounts in integer paise. Convert to rupees only for display.
- Preserve station-address line breaks end-to-end (textarea, JSON/API, SQLite TEXT, preview and print).
- Historical bill snapshots must remain readable even if the pump logo is later renamed or deleted.

## Security and validation
- Never expose the SQLite database file to the browser.
- All database access belongs in server-only route handlers/modules.
- Validate uploaded logo MIME type AND file signature; allow PNG, JPEG and WebP only.
- Enforce a configurable upload size limit (`MAX_LOGO_SIZE_MB`).
- Escape/render user text as text; do not inject it as HTML.
- Do not accept arbitrary file paths or remote image URLs for pump logos.
- Do not delete a pump logo while existing records reference it unless an explicit archival strategy preserves those records.
- This is intended for local/LAN use. Before remote exposure, add authentication, CSRF protections, rate limiting, and HTTPS/reverse-proxy configuration.

## Development
```bash
bun install
cp .env.example .env
bun run dev
```

## Docker
```bash
docker compose up --build -d
docker compose logs -f
```
Open `http://localhost:3000`. The `fuel-data` named volume persists SQLite data across container replacement.

## Quality gates
Before considering a change complete:
1. `bun run typecheck`
2. `bun run build`
3. `docker compose build`
4. Smoke-test create/list/load/delete bill flows.
5. Smoke-test logo upload, logo retrieval, and prevention of deleting a referenced logo.
6. Confirm address line breaks survive save/load and print.
7. Confirm the SQLite file lives under the mounted `/app/data` path in Docker.

## Coding conventions
- Keep route handlers thin; validate input before writing.
- Use parameterized Drizzle queries; never concatenate user input into SQL.
- Use server-side timestamps in ISO 8601 format.
- Keep API responses predictable and return appropriate HTTP status codes.
- Avoid adding dependencies for functionality already provided by SolidJS or Bun.
