# JahitFlow

Web management and order tracking for a garment workshop, built with Next.js
App Router, TypeScript, Tailwind CSS, Prisma, and MySQL.

## Local setup

1. Install Node.js and npm, and start MySQL (the workspace has been set up for
   a local Laragon MySQL instance).
2. Copy `.env.example` to `.env` and set the application and shadow database
   URLs, a random `AUTH_SECRET`, unique seed passwords (at least 12 characters),
   and the WhatsApp contact number in `NEXT_PUBLIC_WHATSAPP_NUMBER`. Use an
   Indonesian number such as `083121893686` or the international format
   `6283121893686`; both are normalized for the WhatsApp link. MySQL must have
   a `konveksi_db` database
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

## Data retention

Orders keep snapshots of the customer details and staff names that were recorded
when the order or its history entry was created. Updating a customer profile or
staff name therefore does not rewrite older order records. Foreign keys prevent
deleting an order, item, customer, or user while another record refers to it;
orders should be cancelled or completed rather than hard-deleted. The history
migration backfills snapshots from existing related records and changes only
columns and foreign-key constraints; it does not delete application rows.

When applying migrations to an existing database, use Prisma Migrate rather
than `prisma db push`:

```powershell
npx prisma migrate deploy
```

Expected form and database errors are returned as user-friendly messages.
Unexpected server errors are recorded in the server log and shown in the UI
without exposing database details to customers.

## Owner admin management

The Owner can create and update Admin/Kasir accounts at `/admin/admins`.
Admin role assignment is enforced by the server action; this screen cannot
create or promote an Owner account. Existing admins can be renamed, have their
email or password changed, and be deactivated/reactivated. Accounts are not
deleted, and the last active Admin cannot be deactivated. Resetting a password
increments the account session version and invalidates that admin's existing
sessions.
