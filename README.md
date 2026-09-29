# JahitFlow

Web management and order tracking for a garment workshop, built with Next.js
App Router, TypeScript, Tailwind CSS, Prisma, and MySQL.

## Local setup

1. Install Node.js and npm, and start MySQL (the workspace has been set up for
   a local Laragon MySQL instance).
2. Copy `.env.example` to `.env` and set the application and shadow database
   URLs, a random `AUTH_SECRET`, unique seed passwords (at least 12 characters),
   and the optional WhatsApp number. MySQL must have a `konveksi_db` database
   and a separate `konveksi_shadow` database; the configured user needs full
   privileges on both for local development migrations. Keep `.env` private
   and out of source control.
3. Install dependencies and initialize the database:

   ```powershell
   npm install
   npm run db:migrate -- --name init
   npm run db:seed
   ```

4. Run the app:

   ```powershell
   npm run dev
   ```

Open `http://localhost:3000`; admin sign-in is at `/login`. Seeded users are
`owner@konveksi.local` and `kasir@konveksi.local`. Their passwords are the
values assigned to `SEED_OWNER_PASSWORD` and `SEED_ADMIN_PASSWORD` in `.env`.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |
| `npm run build` | Create a production build |
| `npm run db:generate` | Generate the Prisma Client |
| `npm run db:migrate` | Create/apply a development migration |
| `npm run db:seed` | Create demo users and sample orders |
| `npm run db:studio` | Open Prisma Studio |
