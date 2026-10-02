# Finance Backend

Backend Python 3.12 dùng uv: API (FastAPI) và worker nhắc thông báo, sau này
thêm LLM/STT tự host. Dữ liệu nằm trong PostgreSQL (schema ở [`db/`](../db/));
Firebase chỉ dùng để gửi thông báo đẩy (FCM).

Hiện production chỉ chạy **worker nhắc thông báo**. Khung API (`GET /health`)
được giữ lại để dùng cho tính năng LLM sau này; nó chưa được deploy, không đọc
database và không cần credentials.

## Tổ chức code

```text
src/finance_backend/
├── cli.py                  # `serve` chạy API, `reminders` chạy worker
├── api/                    # HTTP endpoints, mỗi tính năng một route
├── integrations/
│   ├── postgres.py         # kết nối qua DATABASE_URL
│   └── firebase.py         # Firebase Admin, chỉ dùng FCM
└── workers/
    ├── reminders.py        # worker nhắc thông báo
    └── reminder_messages.* # 50 câu nhắc, chọn ngẫu nhiên mỗi ngày
```

Worker chạy riêng với API để không nhân bản lịch khi tăng số tiến trình API.
LLM/STT sẽ chạy trong container riêng, API gọi nội bộ.

## Worker nhắc thông báo

Mỗi 10 phút (đúng :00, :10, :20…), worker:

1. Tìm người dùng đã bật nhắc và đến giờ (`notification_settings.next_reminder_at`).
2. Mỗi người một lượt cho mỗi ngày đã hẹn (ngày theo giờ Việt Nam của
   `next_reminder_at`, nên lời nhắc 23:55 gửi lúc 00:00 vẫn tính cho hôm
   trước), ghi trong `notification_logs`. Lượt được **giữ chỗ 5 phút** cho
   một worker, nên hai worker không gửi cùng một lượt. Nếu worker bị tắt
   ngay giữa lúc gửi và lúc ghi kết quả, thiết bị đó có thể nhận lại một lần;
   thông báo cùng `tag` nên trình duyệt gộp làm một.
3. Gửi một câu nhắc tới mọi thiết bị còn liên kết (`push_devices`), cùng câu
   cho mọi lần thử lại trong ngày. Kết quả từng thiết bị ở
   `notification_log_devices`.
4. Lỗi tạm thời (FCM bận, mạng): thử lại sau 10 rồi 20 phút, tối đa 3 lần,
   tôn trọng `Retry-After`. Lỗi vĩnh viễn: không thử lại. Đăng ký FCM không
   còn hợp lệ: gỡ thiết bị (chỉ khi đăng ký vẫn y nguyên như lúc gửi).
5. Xong thì hẹn sang ngày hôm sau. Chưa có thiết bị nào thì giữ lịch, để thiết
   bị đăng ký sau vẫn nhận lời nhắc của hôm nay. Lời nhắc trễ quá **2 giờ**
   (worker từng dừng, hết lượt thử lại) thì bỏ qua thay vì gửi muộn.
6. Mỗi ngày một lần (lượt 03:00): xoá nhật ký cũ hơn 90 ngày, mã chống gửi
   trùng của vay nợ (`debt_operations`) cũ hơn 30 ngày và các dòng
   `notification_browsers` không còn thiết bị, không đổi trong 30 ngày.

Kết nối database có giới hạn chờ (kết nối 10 giây, câu lệnh 30 giây, khoá 10
giây) để worker không treo khi database có vấn đề. Khi tắt (deploy), worker
dừng trước người dùng hoặc thiết bị kế tiếp; phần còn lại được lượt sau tiếp
tục.

Mỗi bước là một transaction có khoá dòng (`FOR UPDATE`). Lịch do server web
tính khi lưu cài đặt; client không quyết định được giờ gửi.

### Production

Worker là service `worker` trong [`deploy/compose.prod.yaml`](../deploy/compose.prod.yaml),
được build và khởi động lại cùng app bởi `deploy/scripts/deploy.sh`. Nó dùng
role database `finance_app` và file credentials Firebase (chỉ đọc).

```sh
cd ~/apps/finance-tracker/deploy
docker compose -f compose.yaml -f compose.prod.yaml logs -f worker
```

### Chạy thử ở máy dev

Cần database dev (`npm run db:up` trong `web/`) và credentials Firebase:

```sh
cd backend
export DATABASE_URL="$(grep '^DATABASE_URL=' ../web/.env.local | cut -d= -f2-)"
export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/firebase-admin.json
uv run finance-backend reminders --once --dry-run   # chỉ liệt kê, không gửi/ghi
uv run finance-backend reminders --once             # một lượt thật
```

## API (chưa dùng trên production)

```sh
cd backend
uv sync --locked
uv run --locked finance-backend serve    # http://127.0.0.1:8000, tài liệu ở /docs
```

Hoặc bằng Docker: `docker compose up --build -d` (cổng 127.0.0.1:8000).

## Kiểm tra

Test chạy trên database `finance_test` (tạo bởi `npm run db:up`); FCM luôn
được giả lập, không gửi thông báo thật.

```sh
uv run --locked ruff check .
uv run --locked ruff format --check .
uv run --locked pytest -q
```

Commit `uv.lock`. Thêm dependency bằng `uv add <package>` hoặc
`uv add --dev <package>`.

## Docker image

Build context là `backend/`, `.dockerignore` chỉ cho phép metadata, lockfile,
README và `src/` — credentials và `.env` không bao giờ vào image. Runtime không
chứa uv hay dependency phát triển. Dockerfile dựa trên
[hướng dẫn uv Docker](https://docs.astral.sh/uv/guides/integration/docker/).
