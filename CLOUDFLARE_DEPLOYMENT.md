# Cloudflare Workers deployment

The application uses TanStack Start with `@cloudflare/vite-plugin`. The Worker configuration lives in `wrangler.jsonc`. `src/server.ts` remains the custom TanStack Start server entry configured in `vite.config.ts`; Wrangler's `main` stays at `@tanstack/react-start/server-entry` as required by the Cloudflare framework integration.

## Firebase web configuration

For Workers Builds, configure these values under **Build variables**:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Vite embeds these values at build time, so they are not Worker runtime bindings. Firebase Web configuration is sent to the browser and must not contain private secrets. The source references each value statically so Vite can substitute the build variables. The development-only Firebase Emulator Suite configuration is unchanged.

## Commands

After updating the npm lockfile locally to include the new Cloudflare development tools, use:

```sh
npm run cf-typegen
npm run build
npm run preview
```

To deploy manually later, run `npm run deploy`. For Workers Builds, set `npm run deploy` as the deploy command; that script performs the build before invoking Wrangler. No deployment has been performed as part of this change.
