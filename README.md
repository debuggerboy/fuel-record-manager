# Fuel Record Manager

A local-first SolidStart application for creating, previewing, saving and reopening personal fuel purchase records. It uses Bun, SQLite and Drizzle ORM, and runs in Docker with a persistent named volume.

> Generated documents are personal records only. Do not use this application to fabricate or represent a document as an official petrol-pump receipt or proof of purchase.

## Included in this scaffold

- SolidStart 1.x with Bun deployment preset.
- SQLite database using Bun's native `bun:sqlite` driver.
- Drizzle schema for fuel records and pump logos.
- Multiline **Station address** textarea; newlines are retained in storage and preview.
- Pump logo library: upload a pump name and PNG/JPEG/WebP logo.
- Pump logo images stored as SQLite BLOBs.
- Logo selection on the create-record form.
- Immutable pump name/logo snapshots on saved records.
- Prevent deletion of pump logos referenced by records.
- Previous records list with search and detail view.
- Live personal-record preview.
- Browser Print / Save PDF and PNG export.
- Docker Compose named volume for persistent SQLite data.

## Run locally with Bun

Requires Docker or Bun installed locally.

```bash
cp .env.example .env
bun install
bun run dev
```

Open http://localhost:3000.

## Run with Docker

```bash
docker compose up --build -d
docker compose logs -f fuel-record-manager
```

Open http://localhost:3000. For LAN access, use the host machine's LAN IP and port 3000.

Stop the app:

```bash
docker compose down
```

The database is stored in the `fuel-data` named volume. `docker compose down` does not remove it. **Do not run `docker compose down -v` unless you intend to delete the database volume.**

## Backup and restore

Find the volume:

```bash
docker volume ls
```

Create a compressed backup (replace the volume name if Compose prefixed it differently):

```bash
docker run --rm \
  -v fuel-record-manager_fuel-data:/data:ro \
  -v "$PWD:/backup" \
  alpine \
  tar czf /backup/fuel-data-backup.tgz -C /data .
```

Restore into an existing/empty volume only after stopping the application:

```bash
docker compose down
docker run --rm \
  -v fuel-record-manager_fuel-data:/data \
  -v "$PWD:/backup:ro" \
  alpine \
  sh -c 'tar xzf /backup/fuel-data-backup.tgz -C /data'
docker compose up -d
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| `DB_FILE_NAME` | `/app/data/fuel-records.db` in Docker | SQLite file path |
| `HOST` | `0.0.0.0` | Bind address |
| `PORT` | `3000` | HTTP port |
| `MAX_LOGO_SIZE_MB` | `3` | Maximum uploaded logo size |

## Notes

- The app stores money as integer paise to avoid floating-point currency errors.
- Pump logos are stored as image BLOBs in SQLite.
- Saved bills keep a copy of the selected pump name and logo to preserve historical appearance.
- The initial scaffold focuses on create, browse, load and delete. Full edit/update flows, authentication, CSV export, and automated database backup scheduling can be added next.
- This scaffold has not been built or smoke-tested in your environment. Run the quality gates in `Agents.md` after installing dependencies.
