# Quizvera

A modern Next.js quiz platform with group-based quiz management, participant tracking, translation support, auto-generated question features, and anti-cheating features.

## 🚀 What it is

Quizvera is built as a secure, multi-tenant quiz application for schools, coaching centers, training teams, and remote learning environments. It supports:

- Group and quiz administration
- Quiz participation tracking and answer storage
- Custom user inputs per quiz
- Translation support and source/target language handling
- Anti-cheating detection and monitoring
- Email notifications and password recovery
- MongoDB-backed Prisma schema

## 🧱 Tech Stack

- Next.js 14.2 (App Router)
- React 18
- Tailwind CSS
- Prisma ORM with MongoDB
- NextAuth for authentication
- pnpm package manager

## 📁 Key Project Structure

- `app/` — Next.js app routes, pages, and API handlers
- `components/` — reusable UI components and dialogs
- `lib/` — shared helpers, Prisma client, auth utilities, and actions
- `prisma/schema.prisma` — MongoDB schema models
- `types/` — TypeScript project types

## ⚙️ Features

- Role-based users: `USER`, `ADMIN`, `SUPERADMIN`
- Group creation and admin management
- Quiz creation with questions, options, and translation fields
- Participant quiz answer tracking and custom input storage
- Email sending for notifications and password reset
- Cloudinary image upload support
- Optional AI generation hooks for Gemini/OpenAI

## 🛠️ Prerequisites

- Node.js 20+ (or compatible runtime)
- `pnpm`
- MongoDB database
- (Optional) Cloudinary account for quiz image uploads
- (Optional) Gmail/SMTP credentials for email sending

## 🚀 Local Setup

1. Install dependencies

```bash
pnpm install
```

2. Create a local `.env` file with the required environment variables

3. Generate Prisma client and push schema

```bash
pnpm prisma
```

4. Run the development server

```bash
pnpm dev
```

5. Open the app

```text
http://localhost:3020
```

## 🔐 Environment Variables

Create a `.env` file at the project root and provide values for the following variables:

- `DATABASE_URL` — MongoDB connection string
- `NEXTAUTH_SECRET` — secret for NextAuth sessions
- `NEXTAUTH_URL` — application base URL
- `NEXT_PUBLIC_APP_URL` — public app URL used by client code
- `GOOGLE_CLIENT_ID` — Google provider client ID
- `GOOGLE_CLIENT_SECRET` — Google provider client secret
- `EMAIL_HOST` — SMTP host
- `EMAIL_PORT` — SMTP port
- `EMAIL_USER` — SMTP username
- `EMAIL_PASS` — SMTP password
- `SENDER_NAME` — email sender name
- `SENDER_ADDRESS` — email sender address
- `NEXT_PUBLIC_TRANSLATION_API` — translation API base URL
- `CLOUDINARY_CLOUD_NAME` — Cloudinary cloud name
- `CLOUDINARY_UPLOAD_PRESET` — Cloudinary upload preset
- `CLOUDINARY_API_KEY` — Cloudinary API key
- `CLOUDINARY_API_SECRET` — Cloudinary API secret
- `GEMINI_API_KEY` — Google Gemini API key
- `OPENAI_API_KEY` — OpenAI API key (optional)

## 🧪 Scripts

- `pnpm dev` — start development server on port `3020`
- `pnpm build` — generate Prisma client and build Next.js app
- `pnpm start` — start production server
- `pnpm lint` — run Next.js linter
- `pnpm prisma` — generate Prisma client and push schema to MongoDB
- `pnpm seed` — run seed script (`prisma/seed.mjs`)
- `pnpm reset` — reset Prisma migrations

## 💡 Notes

- Prisma is configured to use MongoDB in `prisma/schema.prisma`
- The app uses `NEXT_PUBLIC` variables for browser-safe configuration
- Authentication and protected routes are implemented under `app/(protected)`

## 📄 License

This project is proprietary.
Refer to the `LICENSE` file for terms and usage restrictions.
