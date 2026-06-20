# standup_tracker landing

Small static landing page for [`01max/standup_tracker`](https://github.com/01max/standup_tracker).

Cloudflare Workers & Pages settings:

- Framework preset: none
- Build command: `npm ci && npm run build`
- Deploy command: `npx wrangler deploy`

The `wrangler.toml` file configures the `standup-tracker-landing` Worker and
serves `dist/` as static assets.

The build step minifies HTML, CSS, and JavaScript, rewrites asset references to
content-hashed filenames, creates AVIF / WebP / PNG screenshot variants, and
writes cache headers for immutable static assets.

Run the production build locally with:

```sh
npm ci
npm run build
```

Local assets:

- `assets/standup-tracker-ui.png` is the current README screenshot.

The drag-to-install link fetches the generated bookmarklet from
`https://raw.githubusercontent.com/01max/standup_tracker/main/standup-companion.bookmarklet.js`
at page load. For local preview, serving the folder over HTTP is closer to the
Cloudflare Pages runtime than opening `index.html` directly:

```sh
python3 -m http.server 8787 --bind 127.0.0.1
```
