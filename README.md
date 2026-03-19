This is a [Next.js](https://nextjs.org) project for tracking personal loans with Google sign-in, borrower acknowledgment, and email notifications.

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Add these values to your local `.env`:

```bash
DATABASE_URL="..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Saath Circle <your-email@gmail.com>"
```

For Gmail, use an App Password instead of your normal account password.

Prefer copying from `.env.example` so local and production configuration stay aligned.

## Borrower Email Flow

When a lender creates a new loan, the app:

1. Creates or finds the borrower by email.
2. Stores the loan as `PENDING`.
3. Sends the borrower an email with a sign-in link that returns them to the loan details page so they can acknowledge it.

## Verification

Run these before shipping:

```bash
npm run verify
npm run check:env
```

For deployment and launch:
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md)
- [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md)
- [SMOKE_TEST.md](./SMOKE_TEST.md)
