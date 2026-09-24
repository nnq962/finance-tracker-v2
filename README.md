This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Copy `.env.example` to `.env.local` and provide both the Firebase Web app
configuration and Firebase Admin credentials. The Admin credentials are used
only on the server to verify ID tokens and create HTTP-only session cookies.
On Google-managed hosting, Application Default Credentials may be used instead.

For local development, keep the downloaded service-account JSON outside the
repository and point Application Default Credentials to its absolute path:

```bash
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/firebase-admin.json
```

Alternatively, provide the three service-account fields directly and keep the
private key on one line with escaped newlines:

```bash
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-...@your-project-id.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Enable Google as a sign-in provider and add `localhost` to Firebase
Authentication's authorized domains before testing locally.

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

The app is served from `finance.nnqlab.dev`. The rewrite in `vercel.json`
proxies Firebase's OAuth helper at `/__/auth/*` to the project's Firebase
Hosting domain while keeping `finance.nnqlab.dev` visible to Google Sign-In.
Before setting the production auth domain, configure all of the following:

1. Add `finance.nnqlab.dev` to Firebase Authentication's authorized domains.
2. Add `https://finance.nnqlab.dev/__/auth/handler` to the authorized redirect
   URIs of the Google OAuth web client for this Firebase project.
3. Set `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=finance.nnqlab.dev` in Vercel's
   **Production** environment and redeploy. Next.js embeds `NEXT_PUBLIC_*`
   values at build time, so updating the variable alone does not change an
   existing deployment.
4. Verify that `https://finance.nnqlab.dev/__/auth/handler` loads through the
   rewrite, then test Google Sign-In on the deployed app.

Keep the Firebase-provided `<project-id>.firebaseapp.com` auth domain in
`.env.local` for local development. Changing only `authDomain` without the
rewrite and OAuth redirect URI will break Google Sign-In.

## Debt tracking

`/debts` reads the authenticated user's Firestore data. It does not seed the
sample contacts or debts. The Firebase Admin SDK uses the existing `(default)`
Standard database; direct client access remains denied by `firestore.rules`.

- `users/{uid}/contacts`: contact details and fixed avatar initials.
- `users/{uid}/debts`: loan principal, interest terms, paid total, and referenced
  `accountIds`; `payments/{paymentId}` stores individual collections/repayments.
- `users/{uid}/transactions/debt_{debtId}`: the original loan cash movement.
- `users/{uid}/debtOperations`: request fingerprints for retry deduplication.

Server Actions validate the session and input. Firestore transactions atomically
update the debt/payment and account balances. The recording mode is stored as `recordingMode`: `cash-flow` (also the default for
older records) or `opening`. Only cash-flow loans require an account and create
an initial linked cash movement. Opening debts record outstanding principal at
the tracking start date, without changing account balances or creating a
transaction; they can be created without any accounts. Their interest accrues
from that date; importing pre-existing unpaid interest separately is not yet
supported. Do not re-enter payments made before the tracking start date.
The mode cannot be changed after creation, including through Server Actions.
Payments for either mode still affect their selected accounts. Editing/deleting
opening debt principal never affects balances; deleting its payments (including
through account deletion) reverses only their actual account impacts. Lending and
repaying decrease the selected account balance; borrowing and collecting increase
it. Editing a payment reverses its previous account impact and applies the new
one; deleting reverses the impact. Payments are stored only in debt history; legacy payment transactions are hidden and removed when that payment is edited/deleted. Negative
account balances are rejected. Existing archived accounts can be used to correct
old payments, but cannot be selected for new payments or loans.

Initial loan transactions appear as incoming/outgoing cash movements on the
Transactions page, with the `Vay & nợ` group and a link back to `/debts`. They cannot
be edited/deleted through the generic transaction actions. Current transaction
summaries include initial loan cash movements, but exclude repayments/collections; they are not profit/loss accounting.

Loans can be edited or deleted from the detail panel. Editing revalidates existing payments and adjusts the original cash movement and account balances atomically. Direction cannot change once payments exist. Deleting reverses the original movement and every repayment, removes payment history and linked ledgers, and rejects the entire operation if an account would become negative. Both operations are retry-safe.

Interest uses the original principal and elapsed calendar days: 30 days/month or
365 days/year, rounded to whole VND. It stops at full settlement. Payment changes
are replayed chronologically and rejected if any payment would exceed the amount
owed on its date. Contacts with debt history cannot be deleted. Deleting an
account also deletes its related transactions, debts, and payment histories,
and reverses their effects on other accounts in one Firestore transaction.
Deletion is rejected if a related balance would become invalid or the
operation exceeds the safe Firestore transaction size.

To run integration checks against configured Firebase credentials:

```bash
DEBT_TEST_LIVE=1 node scripts/test-debts-integration.cjs
```

The script creates a unique `codex_debt_test_*` namespace, tests persistence,
account balances, linked transactions, validation, retries, concurrent requests,
and ownership isolation, then removes its test records in `finally`. It does not
use or change a real user's records. An interrupted process may require cleaning
up its isolated test namespace.
