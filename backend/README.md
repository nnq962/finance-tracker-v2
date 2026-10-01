# Finance Backend

Backend Python 3.12 dùng uv, có thể mở rộng cho API, worker thông báo,
LLM và STT tự host. Đây là project độc lập trong repo Next.js.

Hiện có FastAPI với `GET /health`, CLI và worker nhắc thông báo độc lập.
LLM/STT chưa triển khai. Khởi động API không đọc Firestore, không gửi FCM
và không cần credentials; worker cần credentials để đọc lịch và gửi FCM.

## Tổ chức code

```text
src/finance_backend/
├── cli.py
├── api/
│   ├── app.py
│   └── routes/health.py
├── integrations/
│   └── firebase.py
└── workers/reminders.py
```

- `api/`: HTTP endpoints, tổ chức route theo tính năng.
- `workers/`: job nền chạy bằng tiến trình riêng, bắt đầu với nhắc thông báo.
- `integrations/`: adapter Firebase; có thể thêm client tới dịch vụ LLM/STT.
- `cli.py`: entrypoint; lệnh `serve` chạy API, `reminders` chạy worker.

Worker chạy độc lập với API để không nhân bản lịch khi tăng số API worker.
LLM/STT có thể chạy trong container/process riêng, với adapter gọi nội bộ;
không cần đóng model và dependency GPU vào image API hiện tại.

## Chạy local

Từ gốc repo:

```sh
cd backend
uv sync --locked
uv run --locked finance-backend serve
```

API chỉ lắng nghe trên `http://127.0.0.1:8000`, tài liệu ở `/docs`.
Dừng bằng Ctrl+C; đổi cổng bằng `serve --port 8001`.

Chạy phát triển:

```sh
uv run --locked uvicorn finance_backend.api.app:app --host 127.0.0.1 --port 8000 --reload
```

Kiểm tra:

```sh
uv run --locked ruff check .
uv run --locked ruff format --check .
uv run --locked pytest tests -q
```

Commit `uv.lock`. Thêm dependency bằng `uv add <package>` hoặc
`uv add --dev <package>`. Không cần `requirements.txt`.

## Firebase credentials

Lưu service account JSON trong `backend/credentials/` (đã Git ignore),
hoặc ngoài repo; tạo `.env` và sửa đường dẫn tuyệt đối:

```sh
cp .env.example .env
uv run --locked --env-file .env finance-backend serve
```

Adapter dùng Application Default Credentials với
`GOOGLE_APPLICATION_CREDENTIALS`. Chọn credentials của project
`finance-tracker-6329d` với quyền IAM cần thiết. Project không tự đọc
`.env.local` của Next.js. Firebase chỉ khởi tạo khi adapter được gọi.

## Docker

Build context là `backend/`:

```sh
cd backend
docker compose up --build -d
docker compose ps
docker compose logs -f api
docker compose down
```

Compose publish cổng trên localhost, chạy non-root, filesystem chỉ đọc,
`/tmp` là tmpfs, có healthcheck và tự khởi động lại. Healthcheck kiểm tra API,
không kiểm tra Firebase hoặc dịch vụ model. Không cần Tunnel cho job chủ động
gọi Firebase.

Build/run riêng, có credentials được mount chỉ đọc khi cần:

```sh
docker build -t finance-backend:local .
docker run --rm --init \
  --name finance-backend \
  --read-only --tmpfs /tmp:size=64m,mode=1777 \
  --cap-drop ALL --security-opt no-new-privileges:true \
  -p 127.0.0.1:8000:8000 \
  -e GOOGLE_CLOUD_PROJECT=finance-tracker-6329d \
  -e GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/firebase-admin.json \
  --mount type=bind,src=/absolute/path/to/firebase-admin.json,dst=/run/secrets/firebase-admin.json,readonly \
  finance-backend:local
```

Credentials phải đọc được bởi UID/GID `10001`. Dockerfile không copy file
credentials hoặc `.env`; build context chỉ gồm metadata, lockfile, README và
source. Runtime không chứa uv hoặc dependency phát triển. Model weights nên
lưu ngoài repo/image và mount vào dịch vụ model ở bước triển khai LLM/STT.

Dockerfile dựa trên [hướng dẫn uv Docker](https://docs.astral.sh/uv/guides/integration/docker/).

## Worker nhắc thông báo

Triển khai index từ gốc repo trước khi chạy (cần Firebase CLI đăng nhập hoặc ADC
có quyền quản lý index). Chờ index hoàn tất xây dựng trong Firebase Console:

```sh
npx -y firebase-tools@latest deploy --only firestore:indexes --project finance-tracker-6329d
```

Worker dùng database `(default)` Standard. Query collection group
`notificationSettings` với `notificationsEnabled == true` và
`nextReminderAt <= now`, sắp xếp theo lịch, phân trang và giới hạn mặc định
100 cài đặt mỗi lượt (`--limit` từ 1 đến 1000). Chỉ xử lý document đúng dạng
`users/{uid}/notificationSettings/default`.

Từ `backend/`, chuẩn bị `.env` và credentials ngoài repo như phần trên.
Chạy xem trước, chỉ đọc Firestore; không ghi log/lịch và không gọi FCM:

```sh
uv run --locked --env-file .env finance-backend reminders --once --dry-run
```

Chạy một lượt gửi thật hoặc tiến trình lâu dài:

```sh
uv run --locked --env-file .env finance-backend reminders --once
uv run --locked --env-file .env finance-backend reminders
```

Tiến trình xử lý ngay khi khởi động, sau đó tại phút `00, 10, 20, 30, 40, 50`.
Không khởi động FastAPI hoặc mở cổng. SIGINT/SIGTERM yêu cầu dừng sau lượt hiện
tại. Khi worker tắt/mất mạng, lịch nằm trong Firestore; khởi động lại xử lý
lời nhắc còn trong ngày, bỏ qua ngày cũ và chuyển sang lần nhắc kế tiếp.

Thiết bị chỉ được gửi khi FID khớp SHA-256 document ID, chủ sở hữu trong
`pushInstallations` và liên kết trong `notificationBrowsers` đều còn khớp.
Kiểm tra lại cài đặt trước mỗi lần gửi. Payload dùng `fid`, notification
title/body, TTL 10 phút và tag theo ngày. Không cần user đang đăng nhập vào web.

Log tại `users/{uid}/notificationLogs/{YYYY-MM-DD}` có lease 5 phút, attempt ID
và kết quả từng thiết bị (`status`, `attempts`, `updatedAt`, `errorCode`,
`retryAt` khi cần). Worker chỉ ghi kết quả/dọn thiết bị/gia hạn khi vẫn sở hữu
lock còn hạn; worker cũ không được ghi đè lượt xử lý mới. Gửi ngoài transaction.
Thiết bị thành công không thử lại. Chỉ lỗi tạm thời (unavailable, internal,
quota, deadline hoặc mất kết nối/timeout) được thử lại, tối đa 3 lần gửi:
đợi ít nhất 10 phút sau lần đầu, 20 phút sau lần thứ hai, đồng thời tôn trọng
`Retry-After` của FCM. Lỗi payload, xác thực hoặc quyền truy cập được ghi `failed`
và không thử lại trong ngày. Lượt gửi đang dang dở do worker chết được phục hồi
sau khi lock hết hạn, vẫn chịu giới hạn số lần gửi.

Có 50 thông điệp trong `src/finance_backend/workers/reminder_messages.json`,
với các trường `id`, `category`, `title`, `body`. Mỗi user/ngày được chọn ngẫu
nhiên một thông điệp (cơ hội bằng nhau, không lọc category) và lưu
`message: {id, category, title, body}` trong log ngay khi nhận lock; mọi thiết bị và lần thử
lại dùng cùng nội dung, kể cả khi danh sách câu nhắc được chỉnh sau đó.

Không có thiết bị hợp lệ thì chờ, chưa đánh dấu đã gửi. Sau khi xử lý xong,
cập nhật lịch tiếp theo nếu cài đặt không đổi.
Đăng ký bị `UnregisteredError` được dọn cùng liên kết, chỉ khi dữ liệu chưa thay
đổi kể từ lần kiểm tra trước khi gửi.

FCM và Firestore không có transaction chung: nếu FCM nhận message nhưng worker
dừng trước khi ghi kết quả, lần thử lại có thể gửi trùng. Tắt thông báo/logout
đúng lúc giữa kiểm tra và gọi FCM cũng có thể còn một message đang gửi.
Tag giúp thay thế thông báo cùng ngày ở trình duyệt hỗ trợ; không bảo đảm
gửi/nhận đúng một lần. FCM chấp nhận gửi không xác nhận thiết bị đã hiển thị.

Thiết lập cũ chưa có `nextReminderAt` không nằm trong query. Lưu lại cài đặt từ
web để khởi tạo lịch; chưa có công cụ backfill trong bước này.

Chạy worker Docker độc lập, không cần API:

```sh
docker compose -f compose.worker.yaml build
docker compose -f compose.worker.yaml run --rm reminders finance-backend reminders --once --dry-run
docker compose -f compose.worker.yaml up -d
docker compose -f compose.worker.yaml logs -f reminders
docker compose -f compose.worker.yaml down
```

Compose đọc `FIREBASE_CREDENTIALS_FILE` từ `.env` và mount chỉ đọc. File phải
đọc được bởi UID `10001`, hoặc đặt `BACKEND_UID`/`BACKEND_GID` theo UID/GID
của chủ file trên host (xem `id -u`, `id -g`), giữ user không phải root.
Worker không dùng healthcheck HTTP của image API.

Credentials có quyền đọc/ghi Firestore chưa chắc có quyền deploy index.
Nếu CLI báo 403, chạy `firebase login` bằng tài khoản có quyền quản lý project
rồi deploy index. Không cần cấp thêm quyền quản lý index cho worker chỉ để chạy lịch.

Kiểm tra Firestore thật bằng namespace giả, FCM luôn mô phỏng (không cần index
vì bài kiểm tra nhắm trực tiếp document giả):

```sh
REMINDER_TEST_LIVE=1 uv run --locked --env-file .env python scripts/check_reminders_integration.py
```

Script dọn dữ liệu trong `finally`; nếu bị kill đột ngột, có thể phải dọn
namespace `codex_reminder_test_*` và liên kết giả còn sót.

## Systemd trên Linux

Bộ cấu hình tại `deploy/systemd/` dùng **user service**, chạy bằng tài khoản
sở hữu repo và credentials, không cần chạy worker bằng root. Chọn systemd
hoặc Docker worker; dừng tiến trình `reminders` trong terminal/container trước
khi bật timer để chỉ có một bộ lịch đang chạy.

### Chuẩn bị Python và môi trường

Cài uv nếu server chưa có, rồi dùng uv cài Python 3.12 và dependency từ lockfile:

```sh
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
cd ~/nnq962/finance-tracker-v2/backend
uv python install 3.12
uv sync --locked --no-dev
```

Nếu `.env` chưa có, copy `.env.example` thành `.env` và sửa
`GOOGLE_APPLICATION_CREDENTIALS` thành đường dẫn tuyệt đối tới key trong
`backend/credentials/` (đã Git ignore) hoặc ngoài repo.
Giữ `GOOGLE_CLOUD_PROJECT=finance-tracker-6329d`; file key phải đọc được bởi chính
tài khoản chạy service. Đặt quyền `chmod 600 .env` và `chmod 600` cho file key.
File `.env` dùng dạng `KEY=value` (không dùng `export`, không tham chiếu `$HOME`
hoặc biến khác trong giá trị); systemd đọc trực tiếp bằng `EnvironmentFile`.
Không cần các biến Docker để chạy systemd.

Chạy xem trước trước khi cài timer:

```sh
uv run --locked --env-file .env finance-backend reminders --once --dry-run
```

`settings=0` là chạy thành công nhưng chưa có lịch đến hạn. Không cần tạo thêm
key nếu credentials hiện tại đã dùng được. Service gọi trực tiếp executable
trong `.venv`; không phụ thuộc activate Conda/venv hay PATH của terminal, và
không tự tải dependency lúc gửi thông báo.

### Cài service và timer

Các đường dẫn trong service mặc định là
`%h/nnq962/finance-tracker-v2/backend` (`%h` là home của tài khoản). Nếu repo ở
vị trí khác, sửa `WorkingDirectory`, `EnvironmentFile` và `ExecStart` trong
file nguồn trước khi cài. Không dùng `sudo systemctl --user`; các lệnh dưới đây
chạy bằng tài khoản sở hữu repo.

```sh
cd ~/nnq962/finance-tracker-v2/backend
mkdir -p ~/.config/systemd/user
install -m 644 deploy/systemd/finance-reminders.service ~/.config/systemd/user/
install -m 644 deploy/systemd/finance-reminders.timer ~/.config/systemd/user/
systemd-analyze --user verify ~/.config/systemd/user/finance-reminders.service ~/.config/systemd/user/finance-reminders.timer
systemctl --user daemon-reload
sudo loginctl enable-linger "$(id -un)"
systemctl --user enable --now finance-reminders.timer
systemctl --user list-timers --all finance-reminders.timer
```

`enable-linger` cho phép user manager chạy khi chưa đăng nhập và tiếp tục chạy
sau logout, đồng thời khởi động khi server boot. Lệnh này có thể yêu cầu quyền
quản trị trên server. Nếu không bật linger, timer phụ thuộc phiên đăng nhập.
Chỉ enable **timer**, service được timer kích hoạt tự động.

Timer gọi `reminders --once` tại phút `00, 10, 20, 30, 40, 50` theo giờ Việt Nam,
với cửa sổ kích hoạt 1 giây. Có một lượt lúc user manager khởi động và một lượt
bù khi timer được bật lại sau khi lỡ mốc (`Persistent=true`); không chạy lại
từng mốc đã lỡ. Worker tự quyết định gửi lịch còn trong ngày và bỏ qua ngày cũ.
Máy tắt/ngủ hoặc mất mạng thì không thể đảm bảo gửi đúng giờ.

Nếu service vẫn đang chạy, timer không tạo thêm một process cùng service.
Service lỗi thoát khác 0 (ví dụ query Firestore thất bại) được khởi động lại
sau 60 giây, tối đa 3 lượt khởi động trong 10 phút; timer tiếp tục kích hoạt
ở các mốc sau. Timeout mỗi lượt 8 phút. Thử lại FCM từng thiết bị vẫn tuân theo
`retryAt` và giới hạn của worker, độc lập với việc systemd khởi động lại process.
Lỗi từng user được worker ghi log; không phải mọi lỗi FCM đều khiến process
thoát khác 0. Xem log để biết kết quả cụ thể.

### Xem log và kiểm tra lúc 20h

```sh
systemctl --user status finance-reminders.timer
systemctl --user status finance-reminders.service
journalctl --user -u finance-reminders.service -n 100 --no-pager
journalctl --user -u finance-reminders.service -f
loginctl show-user "$(id -un)" -p Linger
```

Service là `oneshot`: chạy xong thường có trạng thái `inactive (dead)` và
`status=0/SUCCESS`, đó là bình thường; timer phải ở trạng thái `active (waiting)`.
Kiểm tra cột `NEXT` trong `list-timers`. Log `settings=1` cho biết đã xử lý một
cài đặt đến hạn; chưa xác nhận thiết bị hiển thị thành công. Xem thêm log ngày
trong `users/{uid}/notificationLogs/{YYYY-MM-DD}` để kiểm tra từng thiết bị.

Để kiểm tra lời nhắc 20h, giữ timer bật và server hoạt động/có mạng, bảo đảm
lịch 20h đã được lưu và thiết bị còn liên kết. Nếu đã gửi thành công trong
ngày thì đổi giờ không gửi thêm. Chưa có bài kiểm tra nhận FCM thật trên thiết bị.

Chạy một lượt thủ công bằng cấu hình service (có thể gửi thật nếu có lịch đến hạn):

```sh
systemctl --user start finance-reminders.service
```

Nếu báo `start-limit-hit`, xem và sửa lỗi trong journal, sau đó:

```sh
systemctl --user reset-failed finance-reminders.service
systemctl --user start finance-reminders.service
```

### Cập nhật và dừng

Dừng timer/service trước khi cập nhật dependency hoặc thay đổi vị trí repo:

```sh
systemctl --user stop finance-reminders.timer
systemctl --user stop finance-reminders.service
cd ~/nnq962/finance-tracker-v2/backend
uv sync --locked --no-dev
install -m 644 deploy/systemd/finance-reminders.service ~/.config/systemd/user/
install -m 644 deploy/systemd/finance-reminders.timer ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user start finance-reminders.timer
```

Đổi `.env` được đọc ở lượt service kế tiếp. Đổi JSON thông điệp/code có hiệu lực
ở process kế tiếp; thông điệp đã lưu trong log ngày vẫn được giữ nguyên.
Dừng tự động hoàn toàn:

```sh
systemctl --user disable --now finance-reminders.timer
systemctl --user stop finance-reminders.service
```

Nguồn: [systemd timer](https://github.com/systemd/systemd/blob/main/man/systemd.timer.xml),
[systemd service](https://github.com/systemd/systemd/blob/main/man/systemd.service.xml),
[cài uv](https://docs.astral.sh/uv/getting-started/installation/).
