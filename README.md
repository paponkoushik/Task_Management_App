## Task Orbit

Task Orbit is a Next.js task management app with JWT auth, manager/member roles,
sprint-based kanban boards, comments, story points, and estimates.

## Environment Strategy

Do not commit the real `.env` file.

- Local development uses your local PostgreSQL database.
- Vercel uses Neon PostgreSQL through project environment variables.
- Both environments use the same Prisma schema, migrations, and seed script.

Use `.env.example` as the template for required variables:

```env
DATABASE_URL=""
DIRECT_URL=""
JWT_SECRET=""
```

## Local Development

Your local `.env` should point to local PostgreSQL:

```env
DATABASE_URL="postgresql://postgres:123456@localhost:5432/next_app?schema=public"
DIRECT_URL="postgresql://postgres:123456@localhost:5432/next_app?schema=public"
JWT_SECRET="next-todo-dev-secret"
```

Run locally:

```powershell
npm run dev
```

Useful database commands:

```powershell
npm run db:migrate -- --name your_change
npm run db:seed
npm run db:studio
```

## Vercel Deployment

In Vercel Project Settings -> Environment Variables, set:

- `DATABASE_URL` = Neon pooled URL
- `DIRECT_URL` = Neon unpooled URL
- `JWT_SECRET` = a long random secret

This project is already prepared for Prisma deployment on Vercel:

```json
"vercel-build": "prisma generate && prisma migrate deploy && next build"
```

After the environment variables are set, redeploy the project.

## Remote Database Setup

To apply the Prisma schema to the Neon database:

```powershell
$env:DATABASE_URL="YOUR_POOLED_NEON_URL"
$env:DIRECT_URL="YOUR_UNPOOLED_NEON_URL"
npm run db:deploy
```

To insert the seeded demo users and tasks into Neon:

```powershell
$env:DATABASE_URL="YOUR_POOLED_NEON_URL"
$env:DIRECT_URL="YOUR_UNPOOLED_NEON_URL"
npm run db:seed
```

This means you can keep developing locally with your local PostgreSQL database,
while Vercel uses Neon with the same schema and seed flow.
