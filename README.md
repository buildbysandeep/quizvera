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
- Cloudinary upload support with a reusable per-user image library
- Quiz duplication as a new draft, including questions, options, settings, and cover images
- Stable slug routes for quiz details, editor, participant analytics, and public sharing
- Image library management with per-image usage counts and deletion protection
- Dedicated participant results page in My quizzes, with answer review
- Moving a quiz between groups without losing its participant history
- Quiz collaboration with a permanent primary admin and removable shared admins
- Participant history in **My quizzes** and a separate **Shared with me** workspace
- Participant deletion that removes their quiz answers and submitted fields
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
- `AUTH_SECRET` — secret for Auth.js sessions and signed quiz-attempt tokens (use a random value of at least 32 bytes)
- `AUTH_TRUST_HOST` — set to `true` for the configured deployment environment when required
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

## 🧩 Collaboration and schema update

This version adds the MongoDB collections `quiz_collaborators` and `user_images`. Before updating a live deployment, take a database backup, then run:

```bash
pnpm prisma
```

The Prisma command generates the updated client and pushes the additive schema changes. New quizzes receive a URL-safe slug. Existing quizzes need a one-time slug backfill after schema push:

```bash
node prisma/backfill-quiz-slugs.mjs
```

Take a backup before running schema changes on production. Existing quiz images are imported into each owner's personal image library the first time they open the image picker. New uploads are saved to that user's library immediately and can be reused across quizzes. The `/image-library` page shows image usage, and the API blocks permanent deletion while any quiz references the image. First remove an image from every quiz using it; then the unused asset can be deleted from the library.

Quiz collaborators are invited by email and must already have a Quizvera account. The quiz's primary admin is derived from the owner of its group; only that primary admin can add/remove collaborators or move the quiz. The primary admin always remains in the admin list. Duplicating a quiz creates a draft and does not duplicate participation/results.

`My quizzes` now lists only quizzes the signed-in user's account email participated in. Opening a quiz from that list shows their submission and answer review, not the public quiz-taking page. `Shared with me` lists quizzes that another primary admin shared with the account.

### URL conventions

- `/quiz/<slug>` — quiz details and management
- `/quiz/<slug>/edit` — quiz editor
- `/quiz/<slug>/participants` — participant analytics and answer reports
- `/share/quiz/<slug>` — public quiz participation
- `/share/quiz/<slug>/result` — submission confirmation

Database IDs remain internal foreign keys. Legacy links that used `?id=<ObjectId>` or an ObjectId as a quiz path segment are retained as compatibility redirects while old data and bookmarks are migrated.

## 💡 Notes

- Prisma is configured to use MongoDB in `prisma/schema.prisma`
- The app uses `NEXT_PUBLIC` variables for browser-safe configuration
- Authentication and protected routes are implemented under `app/(protected)`
- Participant history lookup matches the registered account email to the email used at quiz participation. The public quiz flow still does not verify participant email ownership.

## 📄 License

This project is proprietary.
Refer to the `LICENSE` file for terms and usage restrictions.
