# truncfix

Split large Repomix / code files so they survive AI chat uploads without truncation.

## Features

- Upload Repomix-style XML
- Live character-limit slider with risk assessment
- Smart splitting (keeps whole source files together when possible)
- Optional "allow one part to exceed limit" for oversized individual files
- Client-side zip generation (files never leave the browser for processing)
- Anonymous usage logging
- Light + Dark mode

## Development

```bash
npm install
npm run dev
```

App runs on http://localhost:3010

## Production (PM2)

```bash
npm run build
pm2 start npm --name truncfix -- start
```

## Notes

- Port: 3010
- Logging writes to `data/usage.log` (one JSON object per line)
