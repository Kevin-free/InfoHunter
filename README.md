# MYSTA

## How to run

`cp .env.example .env`

```
pnpm install
pnpm dev
```

## Database

### migration

```Shell
# initial
psql postgresql://postgres:[PASSWORD]@[USER]:[PORT]/[DB] -f migrations/schema.sql

# migration
psql postgresql://postgres:[PASSWORD]@[USER]:[PORT]/[DB] -f migrations/20250324.sql
```
