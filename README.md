# standup_tracker landing

Small static landing page for [`01max/standup_tracker`](https://github.com/01max/standup_tracker).

Cloudflare Pages settings:

- Framework preset: none
- Build command: `exit 0`
- Build output directory: `.`

Local assets:

- `assets/standup-tracker-ui.png` is the current README screenshot.

The drag-to-install link fetches the generated bookmarklet from
`https://raw.githubusercontent.com/01max/standup_tracker/main/standup-companion.bookmarklet.js`
at page load. For local preview, serving the folder over HTTP is closer to the
Cloudflare Pages runtime than opening `index.html` directly:

```sh
python3 -m http.server 8787 --bind 127.0.0.1
```
