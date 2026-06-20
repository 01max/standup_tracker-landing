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

## Local development

Serve the source files locally:

```sh
bin/dev
```

The server defaults to `http://127.0.0.1:8787/`. Override the host or port with
environment variables:

```sh
PORT=3000 bin/dev
```

You can also run it through npm:

```sh
npm run dev
```

## Production build

Run the production build locally:

```sh
npm ci
npm run build
```

Preview the compiled `dist/` output:

```sh
python3 -m http.server 8788 --bind 127.0.0.1 --directory dist
```

Local assets:

- `assets/standup-tracker-ui.png` is the current README screenshot.

The drag-to-install link fetches the generated bookmarklet from
`https://raw.githubusercontent.com/01max/standup_tracker/main/standup-companion.bookmarklet.js`
at page load.
