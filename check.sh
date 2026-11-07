#!/usr/bin/env bash
cd "$(dirname "$0")"
FAIL=0
chk(){ if (eval "$2") >/dev/null 2>&1; then echo "✔ $1"; else echo "✘ $1"; FAIL=1; fi; }

chk "Node >= 20"                    "node -e 'process.exit(+process.versions.node.split(\".\")[0]>=20?0:1)'"
chk "Lockfile unique (racine)"      "test -f package-lock.json && ! test -e client/package-lock.json && ! test -e server/package-lock.json"
chk "Workspaces server+client"      "npm ls -w server -w client --depth=0"

for p in express cors helmet cookie-parser express-rate-limit jsonwebtoken argon2 zod dotenv pdfkit @prisma/client prisma tsx typescript; do
  chk "server dep: $p" "test -d node_modules/$p"
done
for p in react-router-dom axios zustand react-hook-form lucide-react tailwindcss vite; do
  chk "client dep: $p" "test -d node_modules/$p"
done
chk "TypeScript 5.9.x"              "npx tsc -v | grep -q 'Version 5\.9'"

chk ".env : clés 64 hex"            "grep -Eq '^ENC_KEY=[0-9a-f]{64}$' server/.env && grep -Eq '^IDX_KEY=[0-9a-f]{64}$' server/.env && grep -Eq '^JWT_SECRET=[0-9a-f]{64}$' server/.env"
chk ".env ignoré par git"           "git check-ignore -q server/.env"
chk "prisma.config.ts charge dotenv" "grep -q 'dotenv/config' server/prisma.config.ts"
chk "pas de package.json#prisma"    "node -e 'process.exit(require(\"./server/package.json\").prisma?1:0)'"

chk "PostgreSQL : select 1"         "set -a; . server/.env; set +a; psql \"\${DATABASE_URL%%\\?*}\" -c 'select 1'"
chk "prisma validate"               "cd server && npx prisma validate"
chk "tsc serveur"                   "cd server && npx tsc --noEmit"
chk "build client"                  "npm run build -w client"

(cd server && timeout 8 npx tsx src/server.ts >/dev/null 2>&1 &) ; sleep 4
chk "API /api/health"               "curl -sf localhost:4000/api/health"

[ $FAIL = 0 ] && echo "=== TOUT EST OK ===" || echo "=== ECHECS A CORRIGER ==="
