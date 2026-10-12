This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Google sign-in (optional)

Students can use everything without an account. To show the **Sign in with Google** button:

1. Google Cloud Console → APIs & Services → Credentials → **Create credentials → OAuth client ID** → type *Web application*.
2. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (add your production URL too).
3. Put the values in `.env.local`:
   ```
   AUTH_SECRET=<openssl rand -base64 32>
   AUTH_GOOGLE_ID=<client id>
   AUTH_GOOGLE_SECRET=<client secret>
   ```
4. Restart `next dev`. The button hides itself while `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` are empty.

Sessions are JWT cookies (no database). Only Google is accepted as a provider (`src/auth.ts`).

## Instructor pages (/whoami)

`/whoami` — create and edit C++ problems. Set `ADMIN_KEY` in `.env.local`; without it the admin is open in `next dev` and locked in production. Problem folder format: `problems/README.md`.

## Deploy

The judge compiles C++ on the server, so it needs a host that can run a real process (VPS, Fly.io, Railway, Render, a lab box). Serverless hosts like Vercel cannot run `clang++`.

### Docker (any host)

```bash
docker build -t chill335 .
docker run -d --name chill335 -p 3000:3000 \
  -e ADMIN_KEY=... \
  -e AUTH_SECRET=... \
  -e AUTH_GOOGLE_ID=... \
  -e AUTH_GOOGLE_SECRET=... \
  -e AUTH_URL=https://your.domain \
  -v $(pwd)/problems:/app/problems \
  chill335
```

The `-v` mount keeps `problems/` editable on the host: add or edit a folder and it is live on the next request, no rebuild. Put HTTPS in front with Caddy (`your.domain { reverse_proxy localhost:3000 }`) or your host's built-in TLS.

### Without Docker

```bash
apt install clang     # or any C++17 compiler; set CXX if not clang++
npm ci && npm run build && npm start
```

### Env vars

| var | required | notes |
| --- | --- | --- |
| `ADMIN_KEY` | yes in prod | login for `/whoami` |
| `AUTH_SECRET` | for Google | `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | for Google | from Google Cloud Console |
| `AUTH_URL` | for Google, prod | public URL, e.g. `https://cs335.example.edu` |
| `CXX`, `CXXFLAGS` | no | judge compiler override |

Google OAuth client must list `https://your.domain` as an origin and `https://your.domain/api/auth/callback/google` as a redirect URI.
