## Project rules

- Feature code lives in `src/features/<module>/` (types, pure logic, hooks, components); app shell in `src/components/layout/`. Why: keeps reservations isolated so future modules (clientes, ventas, inventario) don't touch it.
- Reservation visuals read only from `types.ts` shapes; current data is fictional (`mock-data.ts`) and simulated in `use-mock-reservation.ts`. Why: the real backend can replace the mock hook without rewriting components.
- Table state (open/low/full/closed/locked) is computed only in `table-state.ts` and covered by tests. Why: one source of truth for availability rules.
- Design tokens and pixel utilities in `src/styles.css` mirror the public Astro site's stylesheet. Why: both sites must look like one brand; port changes from the public site rather than inventing new styles.
- Brand images are local public assets copied from the public site. Why: avoids external asset dependencies.
