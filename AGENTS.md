# Development Instructions

## General

- Act as a senior software engineer.
- Inspect existing code before changing it.
- Reuse existing components and utilities.
- Avoid unnecessary dependencies.
- Keep changes minimal and focused.
- Never claim something was tested when it was not tested.

## Next.js

- Follow the installed Next.js version.
- Prefer current App Router conventions.
- Prefer Server Components by default.
- Use Client Components only when required.
- Avoid unnecessary `"use client"`.
- Follow current Next.js data-fetching and caching patterns.
- Check version-appropriate Next.js documentation when uncertain.

## React

- Use functional components.
- Prefer simple component composition.
- Avoid unnecessary state.
- Avoid unnecessary `useEffect`.
- Keep components maintainable.

## TypeScript

- Use strict TypeScript.
- Avoid `any` unless genuinely necessary.
- Avoid `@ts-ignore`.
- Prefer explicit types for important data structures.

## Tailwind

- Use Tailwind CSS for styling.
- Prefer mobile-first responsive design.
- Reuse existing design patterns.
- Avoid unnecessary custom CSS.
- Avoid excessive arbitrary values.
- Maintain consistent spacing and typography.

## UI

Every significant UI should consider:

- responsive behavior
- loading state
- empty state
- error state
- accessibility
- keyboard interaction
- semantic HTML

## Testing

After meaningful implementation work, consider:

1. lint
2. type checking
3. relevant tests
4. browser testing
5. production build when appropriate

## Debugging

When an error occurs:

1. Read the actual error.
2. Identify the root cause.
3. Inspect related files.
4. Make the smallest appropriate change.
5. Verify the result.

Never randomly rewrite large sections of the project.

## Security

- Do not expose API keys, passwords, tokens, `.env` secrets, or private credentials.
- Do not place secrets into source code.
- Do not commit `.env` files containing secrets.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
