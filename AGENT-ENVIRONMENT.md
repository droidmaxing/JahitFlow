# Agent Environment

## Project

This workspace contains the JahitFlow Next.js application. It uses Next.js App
Router, TypeScript, Tailwind CSS, Prisma with MySQL, and Shadcn UI components.
Development rules for agents are in the root `AGENTS.md`.

## Skills

Project skills are available under `.agents/skills/`:

- `vercel-react-best-practices`: Vercel guidance for React and Next.js
  performance and implementation patterns.
- `web-design-guidelines`: guidance for accessibility, responsive layouts, and
  interface quality.
- `playwright-cli`: browser automation through the Playwright CLI, including
  navigation, interaction, screenshots, and inspection.

VS Code Agent Skills discovery can be checked from Copilot Chat with `/skills`.
The Playwright CLI is installed globally; verify its availability with
`playwright-cli --help`.

## MCP

- `next-devtools` is configured in `.vscode/mcp.json`. It exposes diagnostics
  for a running Next.js 16+ development server. Start the app with `npm run dev`
  before using its runtime tools.

No additional MCP servers are configured; Playwright CLI already supplies the
browser capabilities needed for this project.

## Local prerequisites and commands

- Node.js and npm are required; MySQL is required for application data.
- Configure local values in `.env` using `.env.example` as a template. Do not
  commit `.env` or place secrets in source files.
- Start MySQL, then run `npm run db:migrate -- --name init` and
  `npm run db:seed` to set up the local database and demo data.
- Start development with `npm run dev`; use `npm run lint`,
  `npm run typecheck`, and `npm run build` for validation.
- The demo login emails are `owner@konveksi.local` and `kasir@konveksi.local`.
  Their passwords are the local `SEED_OWNER_PASSWORD` and
  `SEED_ADMIN_PASSWORD` values and are never printed by the seed command.
