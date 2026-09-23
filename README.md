# Paris Indoor Soccer

League site: schedule and results, standings, playoff bracket and team rosters. Nuxt 4 on Cloudflare Workers (D1 + R2).

```sh
nvm use && pnpm install
cp .env.example .env    # set NUXT_BETTER_AUTH_SECRET
pnpm dev                # http://localhost:3000
curl -X POST localhost:3000/_nitro/tasks/db:seed
```

Stack, commands, decisions and conventions are in [CLAUDE.md](CLAUDE.md).
