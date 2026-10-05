#!/usr/bin/env bash
# Opens the dev server (npm run dev, port 3000) at https://dev.nnqlab.dev
# through the Cloudflare tunnel `finance-dev`, so it can be tried on a phone.
# Cloudflare Access guards the hostname; see "Tunnel cho dev server" in
# deploy/README.md. Usually run from web/ as `npm run tunnel`; Ctrl+C closes it.
set -euo pipefail

if ! command -v cloudflared >/dev/null; then
  echo "cloudflared not found: install it into ~/.local/bin (see deploy/README.md)." >&2
  exit 1
fi

exec cloudflared tunnel --no-autoupdate run --url http://localhost:3000 finance-dev
