# Finance Tracker — web

The Next.js app (UI and server). Commands below run from this `web/` folder.
See the [project README](../README.md) for how the parts fit together.

## Getting Started

Data lives in PostgreSQL (see [`db/README.md`](../db/README.md)); Firebase is used
only for Google sign-in (Auth) and push notifications (FCM). Start the local
database first; it also adds `DATABASE_URL` to `web/.env.local`:

```bash
npm run db:up
```

Copy `.env.example` to `.env.local` (both in `web/`) and provide both the Firebase Web app
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

Then run the development server and open [http://localhost:3000](http://localhost:3000):

```bash
npm run dev
```

## Production

The app runs on a home server with Docker Compose behind a Cloudflare Tunnel;
setup, deploys, backups and the DNS cutover are in
[`deploy/README.md`](../deploy/README.md).

`next.config.ts` rewrites Firebase's OAuth helper at `/__/auth/*` to the
project's `firebaseapp.com` domain, so production can set
`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=finance.nnqlab.dev` and keep its own domain
visible to Google Sign-In. That requires:

1. `finance.nnqlab.dev` in Firebase Authentication's authorized domains.
2. `https://finance.nnqlab.dev/__/auth/handler` in the authorized redirect URIs
   of the Google OAuth web client for this Firebase project.

Next.js embeds `NEXT_PUBLIC_*` values at build time, so changing them needs a
rebuild (`deploy/scripts/deploy.sh`). Keep the Firebase-provided
`<project-id>.firebaseapp.com` auth domain in `.env.local` for local development.

## Debt tracking

`/debts` reads the authenticated user's data from PostgreSQL. It does not seed
the sample contacts or debts.

- `contacts`: contact details and fixed avatar initials.
- `debts`: loan principal and interest terms; the paid total and status are
  derived from `debt_payments`, which stores individual collections/repayments.
- `transactions` rows with `debt_id`: the original loan cash movement.
- `debt_operations`: request fingerprints for retry deduplication.

Server Actions validate the session and input. Database transactions atomically
update the debt/payment and account balances, locking the affected rows. The
recording mode is stored as `recording_mode`: `cash-flow` or `opening`. Only cash-flow loans require an account and create
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
one; deleting reverses the impact. Payments are stored only in debt history. Negative
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
and reverses their effects on other accounts in one database transaction.
Deletion is rejected if a related balance would become invalid.

Integration checks run against the local `finance_test` database (never the dev
data) with isolated users that are removed afterwards:

```bash
node scripts/test-db-schema.cjs
node scripts/test-debts-integration.cjs
node scripts/test-categories-integration.cjs
node scripts/test-notifications-integration.cjs
```


## Cài đặt thông báo và thiết bị

Backend Python dùng uv và Docker nằm ở [`backend/`](../backend/README.md),
được tổ chức để mở rộng API, worker thông báo và dịch vụ LLM/STT tự host.
Hiện có API health local và worker nhắc độc lập chạy mỗi 10 phút; xem hướng dẫn
credentials, index, chạy xem trước và cài systemd service/timer trong README backend.

Trong Settings → Thông báo, gạt switch để tự lưu bật/tắt lời nhắc.
Chọn giờ và phút nhắc rồi bấm **Lưu** để lưu cả hai trong một lần; danh sách phút cách nhau 10 phút.
Múi giờ được cố định là Việt Nam (`Asia/Ho_Chi_Minh`),
không cần người dùng chọn. Khi gạt switch bật,
trình duyệt được yêu cầu cấp quyền và đăng ký thiết bị; switch chỉ bật sau khi
hoàn tất. Nếu quyền đã bị chặn, switch giữ tắt và hướng dẫn bật quyền trong
cài đặt trình duyệt/PWA. Quay lại app sẽ kiểm tra quyền lại. Có thể dùng **Kết nối
thiết bị này** để đăng ký nhận thông báo ngay cả khi lời nhắc tắt. Trên iPhone/iPad, đăng ký từ PWA
đã thêm vào Màn hình chính. Server lưu lịch đến hạn trong PostgreSQL.

> **Tạm dừng:** worker Python gửi nhắc vẫn đọc Firestore nên đang tạm dừng,
> sẽ được chuyển sang PostgreSQL sau. Trong thời gian này lời nhắc không được gửi.

Khi bật lời nhắc hoặc đổi giờ, server tính `nextReminderAt` theo
`Asia/Ho_Chi_Minh` và lưu vào cột `next_reminder_at` (`timestamptz`). Nếu giờ nhắc hôm nay
đã qua, lịch chuyển sang ngày mai; đúng thời điểm nhắc thì lịch đến hạn ngay.
Tắt lời nhắc xoá lịch. Lưu lại cùng cài đặt giữ lịch hiện có; cài đặt chưa có
lịch sẽ được khởi tạo khi lưu. Client không được quyết định lịch nhắc.

Kiểm tra tính lịch, không cần credentials:

```sh
node scripts/test-notification-schedule.cjs
```

Dữ liệu nằm trong PostgreSQL:

- `notification_settings`: bật/tắt, giờ nhắc, múi giờ, `next_reminder_at`.
- `push_devices`: id là `sha256(fid)`, FID đăng ký FCM, tên thiết bị, browser.
  Một tài khoản có nhiều thiết bị; mỗi đăng ký FCM chỉ thuộc một tài khoản.
- `notification_browsers`: liên kết thiết bị của trình duyệt với tài khoản và
  nonce phiên. Cookie HttpOnly giữ browser ID và nonce.

Đăng ký được đồng bộ khi mở app, quay lại cửa sổ và khi FCM thay đổi đăng ký.
Đăng ký tự động không hiện hộp xin quyền; chỉ tiếp tục nếu quyền đã được cấp
và tài khoản bật lời nhắc hoặc thiết bị đã được lưu. Tắt lời nhắc giữ thiết bị
để có thể bật lại/gửi thử; lịch gửi sau này phải kiểm tra `notificationsEnabled`.
Logout gỡ thiết bị của trình duyệt hiện tại và huỷ đăng ký FCM tại máy, các máy
khác vẫn được giữ. Đổi tài khoản chuyển liên kết bằng transaction. Nonce phiên
ngăn callback cũ gắn lại thiết bị sau logout/đổi tài khoản.

Kiểm tra không gửi thông báo thật:

```sh
node scripts/test-push-notifications.cjs
```

Kiểm tra tích hợp trên database `finance_test` (người dùng/thiết bị giả, tự dọn):

```sh
node scripts/test-notifications-integration.cjs
```

Settings chỉ hiển thị cài đặt lời nhắc và thiết bị nhận thông báo; giao diện gửi
thử đã được gỡ. Kết quả đăng ký, lưu cài đặt và lỗi hiển thị bằng toast.

Kiểm tra trên thiết bị: chọn giờ/phút nhắc rồi tải lại; đăng nhập cùng tài khoản
trên hai máy và đăng ký cả hai; logout một máy để kiểm tra máy còn lại vẫn giữ
đăng ký; đăng nhập tài khoản khác trên máy vừa logout để kiểm tra liên kết mới.
