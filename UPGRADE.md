# Next.js upgrade branch

This branch bumps dependencies toward a modern Next stack.

## What changed

- `next` 14.2.15 → **15.5.4** (React 19)
- Related type packages and eslint-config-next aligned

## Smoke test checklist (run locally before merging)

```bash
npm install
npm run build
npm run dev
```

Check:

- [ ] Home page loads with categories and search
- [ ] Theme toggle (light/dark) and no flash
- [ ] URL query `?q=` and `?category=` sync
- [ ] Favicons load on cards
- [ ] `/sitemap.xml` and `/robots.txt`
- [ ] Open Graph image (`/opengraph-image`)

## Next step (optional)

After 15 is stable in production, move to Next **16.x** in a follow-up PR. Next 16 may need further App Router / config adjustments.

## Note

Feature work (SEO, UX, favicons, cleaned links) landed on `main` after this branch was cut. Rebase or merge `main` into this branch before opening a PR:

```bash
git fetch origin
git checkout chore/next-16-upgrade
git merge origin/main
```
