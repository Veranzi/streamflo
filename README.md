# Streamedu

Next.js 14 + TypeScript rewrite of the Streamflo school directory (originally `streamflo.co.ke`).

## Stack
- **Next.js 14** (App Router)
- **TypeScript** (strict)
- **Tailwind CSS**
- **MySQL** via `mysql2`
- **NextAuth** for authentication
- **Leaflet** for maps

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create MySQL database and import schema
mysql -u root -p < schema.sql

# 3. Copy env file and fill in credentials
cp .env.example .env.local

# 4. Run dev server
npm run dev
```

Visit http://localhost:3000

## Environment variables
See `.env.example`. Required:
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL`

## Project structure
```
streamedu/
├── public/
│   ├── Logo.png
│   ├── data/counties.json
│   └── uploads/           # blog & school images
├── src/
│   ├── app/
│   │   ├── page.tsx              # Homepage
│   │   ├── directory/            # School directory + filters
│   │   ├── login/                # Login page
│   │   ├── register/             # School registration
│   │   ├── blog/                 # Blog listing + [id] view
│   │   ├── profile/[id]/         # School profile
│   │   ├── contact/              # Contact form
│   │   ├── dashboard/            # Institution dashboard
│   │   └── api/                  # API routes
│   │       ├── search/
│   │       ├── auth/[...nextauth]/
│   │       ├── register/
│   │       ├── blog/comments/
│   │       ├── contact/
│   │       └── dashboard/
│   ├── components/               # Reusable UI
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── SchoolCard.tsx
│   │   ├── Map.tsx               # Leaflet wrapper
│   │   ├── HomeSearch.tsx
│   │   ├── WhatsAppFab.tsx
│   │   └── Providers.tsx         # NextAuth SessionProvider
│   └── lib/
│       ├── db.ts                 # MySQL pool
│       ├── auth.ts               # NextAuth config
│       └── types.ts              # TypeScript types
├── schema.sql                    # Database schema
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Features
- School directory with filters (county, curriculum, gender, type, etc.)
- Interactive Leaflet map
- School profile pages with photo galleries
- Blog system with comments
- School registration (free / premium / customized packages)
- Institution dashboard with stats
- NextAuth-based login (institutions, admins)
- Agent referral system
- Contact form
- Responsive (mobile off-canvas nav + filters)
- WhatsApp FAB for support

## AI Tools (EduTena integration)
Streamflo is the **sole public surface** for EduTena's AI tools. Users sign into Streamflo and access:
- `/ai/chat` — CBC chatbot (grades 1–10, Kenyan context)
- `/ai/predict` — Career pathway predictor from a student report card
- `/ai/notes` — Curated CBC notes library
- `/ai/subscribe` — Parent and school subscription plans

Browser traffic never hits EduTena directly. Streamflo proxy routes under [src/app/api/ai/](src/app/api/ai/) forward requests to the EduTena gateway, authenticating with a federated JWT minted from the NextAuth session via [src/lib/edutena.ts](src/lib/edutena.ts).

Run EduTena alongside Streamflo:
```bash
# Terminal 1
cd ../edutena-backend
npm install && npm run dev

# Terminal 2 (this app)
npm run dev
```

Both apps must share `JWT_SECRET` in their env files.

## Migrating from PHP
Legacy `streamflo.co.ke/` PHP app uploads are in `uploads/blog/` and `uploads/schools/<id>/`. Copy these into `streamedu/public/uploads/` so existing images resolve.

If migrating data from the old MySQL DB, the core tables (`schools`, `users`, `blog_posts`, etc.) map directly; re-hash user passwords with bcrypt since the PHP app used a different hash format for admins (`SHA2`).

## Scripts
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm start` — run production build
- `npm run lint` — ESLint
