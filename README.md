This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Copy `.env.example` to `.env.local` and provide both the Firebase Web app
configuration and Firebase Admin credentials. The Admin credentials are used
only on the server to verify ID tokens and create HTTP-only session cookies.
On Google-managed hosting, Application Default Credentials may be used instead.

For local development, keep the service-account JSON in the ignored
`backend/credentials/` directory or outside the repository, and point
Application Default Credentials to its absolute path:

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


## Cài đặt thông báo và thiết bị

Backend Python dùng uv và Docker nằm ở [`backend/`](backend/README.md),
được tổ chức để mở rộng API, worker thông báo và dịch vụ LLM/STT tự host.
Hiện có API health local và worker nhắc độc lập chạy mỗi 10 phút; xem hướng dẫn
credentials, index, chạy xem trước và cài systemd service/timer trong README backend.

Trong Settings → Thông báo, gạt switch để tự lưu bật/tắt lời nhắc.
Giờ nhắc tự lưu khi chọn giờ/phút trong Select; danh sách phút cách nhau 10 phút.
Múi giờ được cố định là Việt Nam (`Asia/Ho_Chi_Minh`),
không cần người dùng chọn. Khi gạt switch bật,
trình duyệt được yêu cầu cấp quyền và đăng ký thiết bị; switch chỉ bật sau khi
hoàn tất. Nếu quyền đã bị chặn, switch giữ tắt và hướng dẫn bật quyền trong
cài đặt trình duyệt/PWA. Quay lại app sẽ kiểm tra quyền lại. Có thể dùng **Kết nối
thiết bị này** để đăng ký nhận thông báo ngay cả khi lời nhắc tắt. Trên iPhone/iPad, đăng ký từ PWA
đã thêm vào Màn hình chính. Server lưu lịch đến hạn; Python worker gửi tự động
khi được vận hành trên server cá nhân với credentials và index phù hợp.

Khi bật lời nhắc hoặc đổi giờ, server tính `nextReminderAt` theo
`Asia/Ho_Chi_Minh` và lưu dưới dạng Firestore Timestamp. Nếu giờ nhắc hôm nay
đã qua, lịch chuyển sang ngày mai; đúng thời điểm nhắc thì lịch đến hạn ngay.
Tắt lời nhắc xóa trường `nextReminderAt`. Lưu lại cùng cài đặt giữ lịch hiện có;
cài đặt cũ chưa có lịch sẽ được khởi tạo khi lưu. Client không được quyết định
`nextReminderAt`. Các cài đặt đã bật nhưng chưa được lưu lại chưa được backfill.
Worker chạy mỗi 10 phút; kết quả gửi theo thiết bị được lưu trong
`users/{uid}/notificationLogs/{YYYY-MM-DD}`. Việc khởi chạy worker là riêng với
web, không tự xảy ra khi chạy `next dev` hoặc deploy Vercel.

Kiểm tra tính lịch, không cần credentials:

```sh
node scripts/test-notification-schedule.cjs
```

Dữ liệu nằm trong Firestore `(default)` và chỉ được đọc/ghi qua Firebase Admin:

- `users/{uid}/notificationSettings/default`: `notificationsEnabled`,
  `dailyReminderTime`, `timeZone`, `nextReminderAt` (khi bật lời nhắc), `updatedAt`.
- `users/{uid}/pushDevices/{sha256(fid)}`: FID đăng ký FCM, tên thiết bị,
  browser ID và thời điểm tạo/cập nhật. Một tài khoản có nhiều thiết bị.
- `notificationBrowsers/{browserId}`: liên kết thiết bị của trình duyệt với
  tài khoản và nonce phiên. Cookie HttpOnly giữ browser ID và nonce.
- `pushInstallations/{sha256(fid)}`: chủ sở hữu hiện tại của đăng ký FCM.

Đăng ký được đồng bộ khi mở app, quay lại cửa sổ và khi FCM thay đổi đăng ký.
Đăng ký tự động không hiện hộp xin quyền; chỉ tiếp tục nếu quyền đã được cấp
và tài khoản bật lời nhắc hoặc thiết bị đã được lưu. Tắt lời nhắc giữ thiết bị
để có thể bật lại/gửi thử; lịch gửi sau này phải kiểm tra `notificationsEnabled`.
Logout gỡ thiết bị của trình duyệt hiện tại và huỷ đăng ký FCM tại máy, các máy
khác vẫn được giữ. Đổi tài khoản chuyển liên kết bằng transaction. Nonce phiên
ngăn callback cũ gắn lại thiết bị sau logout/đổi tài khoản.

Không cần mở quyền ghi Firestore cho client hoặc thêm biến môi trường mới.

Kiểm tra không gửi thông báo thật:

```sh
node scripts/test-push-notifications.cjs
```

Kiểm tra tích hợp Firestore với credentials trong `.env.local` (tạo dữ liệu
người dùng/thiết bị giả trong namespace ngẫu nhiên rồi dọn trong `finally`):

```sh
NOTIFICATION_TEST_LIVE=1 node scripts/test-notifications-integration.cjs
```

Settings chỉ hiển thị cài đặt lời nhắc và thiết bị nhận thông báo; giao diện gửi
thử đã được gỡ. Kết quả đăng ký, lưu cài đặt và lỗi hiển thị bằng toast.

Kiểm tra trên thiết bị: chọn giờ/phút nhắc rồi tải lại; đăng nhập cùng tài khoản
trên hai máy và đăng ký cả hai; logout một máy để kiểm tra máy còn lại vẫn giữ
đăng ký; đăng nhập tài khoản khác trên máy vừa logout để kiểm tra liên kết mới.
