# AGENTS.md — JahitFlow

## 1. Fakta repo

- Remote: `git@github.com:droidmaxing/JahitFlow.git` — branch kerja: `main`
- Stack: Next.js (App Router, TypeScript strict), Prisma ORM, MySQL 8.0
- Database: MySQL 8.0, schema `konveksi_db`
- Struktur: `app/` (App Router, termasuk halaman publik `/track/[orderId]`), `components/`, `lib/`, `actions/` (server actions), `prisma/schema.prisma`, `prisma/seed.ts`. Repo ini **tidak** memakai folder `src/`.

## 2. Menjalankan (Docker Compose)

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps                  # jahit-flow-mysql (healthy), jahit-flow-app
curl -fsS http://127.0.0.1:3001
docker compose logs -f --tail=50 app
docker compose down                # JANGAN pakai -v: volume jahit-flow-mysql-data berisi data
```

Port host: web `3001:3000`, mysql `3308:3306`.
Lokal: `npm install && npx prisma generate && npm run dev`.

## 3. Gate wajib sebelum commit (harus hijau)

```bash
npx prisma generate     # WAJIB: tanpa ini tsc gagal (Prisma.Decimal tidak dikenal di prisma/seed.ts)
npm run lint            # ESLint
npm run typecheck       # tsc --noEmit
npm run build           # Next.js production build
```

Urutan ini sudah diverifikasi: `prisma generate` + lint + typecheck + build semuanya exit 0.
**Catatan penting:** `npm run typecheck` TANPA `prisma generate` lebih dulu akan gagal
(`prisma/seed.ts(...): error TS2339: Property 'Decimal' does not exist on type 'typeof Prisma'`)
karena Prisma client di `node_modules` tidak sinkron dengan schema — bukan bug kode.
CI: `.github/workflows/ci.yml` menjalankan generate → lint → typecheck → build.

## 4. Database & migrasi

- Skema: `prisma/schema.prisma`. Migrasi: `prisma/migrations/`.
- Alur perubahan skema: edit schema → `npx prisma migrate dev --name <deskripsi>` → `npx prisma generate` → sesuaikan `prisma/seed.ts`.
- Migrasi yang sudah ter-commit tidak boleh diedit; buat file migrasi baru.
- Seed harus idempoten; jangan `DROP`/`TRUNCATE` data nyata.
- Password seed memakai hash bcrypt (cost 10).

## 5. Aturan umum

- Act as a senior software engineer.
- Inspect existing code before changing it.
- Reuse existing components and utilities.
- Avoid unnecessary dependencies.
- Keep changes minimal and focused.
- Never claim something was tested when it was not tested.

### Next.js

- Follow the installed Next.js version.
- Prefer current App Router conventions.
- Prefer Server Components by default.
- Use Client Components only when required.
- Avoid unnecessary `"use client"`.
- Follow current Next.js data-fetching and caching patterns.
- Check version-appropriate Next.js documentation when uncertain.

### React

- Use functional components.
- Prefer simple component composition.
- Avoid unnecessary state.
- Avoid unnecessary `useEffect`.
- Keep components maintainable.

### TypeScript

- Use strict TypeScript.
- Avoid `any` unless genuinely necessary.
- Avoid `@ts-ignore`.
- Prefer explicit types for important data structures.

### Tailwind

- Use Tailwind CSS for styling.
- Prefer mobile-first responsive design.
- Reuse existing design patterns.
- Avoid unnecessary custom CSS.
- Avoid excessive arbitrary values.
- Maintain consistent spacing and typography.

### UI

Every significant UI should consider:

- responsive behavior
- loading state
- empty state
- error state
- accessibility
- keyboard interaction
- semantic HTML

### Testing

After meaningful implementation work, consider:

1. lint
2. type checking
3. relevant tests
4. browser testing
5. production build when appropriate

### Debugging

When an error occurs:

1. Read the actual error.
2. Identify the root cause.
3. Inspect related files.
4. Make the smallest appropriate change.
5. Verify the result.

Never randomly rewrite large sections of the project.

### Security

- Do not expose API keys, passwords, tokens, `.env` secrets, or private credentials.
- Do not place secrets into source code.
- Do not commit `.env` files containing secrets.
- `.env` compose wajib menyamarkan kredensial nyata dengan `[REDACTED]` di laporan/PR.

## 6. Konvensi commit

Format: `<tipe>: <deskripsi bahasa Indonesia>` — `feat`, `fix`, `refactor`, `docs`, `chore`.

## 7. Definisi selesai

1. Gate bagian 3 hijau (dengan `prisma generate` lebih dulu).
2. Fitur diverifikasi di stack yang jalan (port 3001), termasuk halaman publik `/track/[orderId]`.
3. `git status` bersih; tidak ada `.env`/kredensial ikut ter-commit.
4. Perubahan skema DB selalu disertai file migrasi baru.

## 8. Jebakan yang diketahui

- Jalankan `npx prisma generate` setiap kali `schema.prisma` berubah atau `node_modules` baru — penyebab error tipe `Prisma.*` nomor satu di repo ini.
- Host MySQL di dalam compose adalah `mysql`, bukan `localhost`/`127.0.0.1`.
- `docker compose down -v` menghapus volume `jahit-flow-mysql-data` — dilarang di server ini.
- Halaman `/track/[orderId]` bersifat publik; jangan menambahkan data internal (harga modal, data pelanggan lain) ke payload-nya.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
