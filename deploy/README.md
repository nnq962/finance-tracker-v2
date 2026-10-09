# Triển khai (self-host)

App chạy bằng Docker Compose trên máy chủ ở nhà, ra Internet qua Cloudflare
Tunnel. Không mở port nào trên router.

```
finance.nnqlab.dev → Cloudflare → Tunnel → web (Next.js) → postgres
```

| File | Vai trò |
|---|---|
| `compose.yaml` | Postgres + migration (dùng chung dev/prod) |
| `compose.prod.yaml` | `web` (Next.js), `worker`, `ollama` (LLM nội bộ) + `cloudflared` |
| `compose.dev.yaml` | Dev: mở Postgres ở `127.0.0.1:5432`, thêm DB `finance_test` |
| `scripts/deploy.sh` | Pull → build → migrate → khởi động lại |
| `scripts/db.sh` | Lệnh `npm run db:*` cho dev |
| `scripts/backup.sh`, `restore.sh` | Sao lưu / khôi phục production |

## Dev và production trên cùng một máy

Hai môi trường tách hẳn nhau:

| | Dev | Production |
|---|---|---|
| Thư mục code | Thư mục bạn đang code | Một bản clone riêng, ví dụ `~/apps/finance-tracker` |
| Docker project | `finance-dev` | `finance` |
| Cấu hình | `deploy/.env.dev` (tự tạo) | `deploy/.env` (tự điền) |
| Database | `finance-dev_pgdata` | `finance_pgdata` |
| Truy cập | `cd web && npm run dev` → `localhost:3000` | `127.0.0.1:3010` và qua Tunnel |

Production chạy từ **bản clone riêng** để việc đang code dở (file chưa commit,
nhánh khác) không bao giờ lọt lên bản đang chạy.

## Lần đầu dựng production

```sh
git clone https://github.com/nnq962/finance-tracker-v2.git ~/apps/finance-tracker
cd ~/apps/finance-tracker
git switch postgres                      # sau khi merge thì dùng main
cp deploy/.env.example deploy/.env
chmod 600 deploy/.env
```

Điền `deploy/.env`:

- `POSTGRES_PASSWORD`, `APP_DB_PASSWORD`: tạo bằng `openssl rand -hex 24`.
  **Đổi mật khẩu sau khi database đã tạo sẽ không có tác dụng** — chúng chỉ
  được dùng lần khởi tạo đầu tiên.
- `NEXT_PUBLIC_FIREBASE_*`: chép từ `web/.env.local`, riêng
  `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=finance.nnqlab.dev`.
- `FIREBASE_CREDENTIALS_FILE`: đường dẫn tuyệt đối tới file JSON service account
  (cùng file `GOOGLE_APPLICATION_CREDENTIALS` trong `web/.env.local`).
- `CLOUDFLARE_TUNNEL_TOKEN`: xem phần Tunnel; có thể để trống lúc đầu.

Rồi chạy:

```sh
deploy/scripts/deploy.sh
```

Mở `http://127.0.0.1:3010` để kiểm tra trước khi mở ra Internet.

## Ollama (LLM nội bộ)

Service `ollama` chạy model `gemma4:e4b` trên GPU (khoảng 5GB VRAM), không mở
port: chỉ các service trong mạng compose gọi được, qua `http://ollama:11434`.
Cần NVIDIA Container Toolkit trên máy chủ.

Model nằm trong volume `finance-ollama`, volume này nằm ngoài compose nên
`down -v` không xoá model. `deploy.sh` chỉ tải model khi chưa có. Muốn đổi model
thì đặt `OLLAMA_MODEL` trong `deploy/.env` (web cũng đọc biến này để gọi đúng
model), rồi xoá model cũ:

```sh
docker exec finance-ollama-1 ollama list
docker exec finance-ollama-1 ollama rm <model-cũ>
```

## Gói Pro, payOS và quản trị

Người dùng mua Pro trong Cài đặt → Gói của bạn: app tạo đơn trên payOS, người
dùng quét QR trên trang của payOS, payOS gọi webhook và Pro được cấp ngay.
Admin vẫn cấp, thu hồi bằng tay được trong Cài đặt → Quản trị. Đặt trong
`deploy/.env`:

```sh
ADMIN_EMAILS=email-admin@example.com   # email Google đã xác minh, cách nhau bằng dấu phẩy
PAYOS_CLIENT_ID=...                    # my.payos.vn → Kênh thanh toán
PAYOS_API_KEY=...
PAYOS_CHECKSUM_KEY=...
GROQ_API_KEY=...                       # console.groq.com → API Keys; nhận dạng giọng nói bằng Whisper
GEMINI_API_KEY=...                     # aistudio.google.com → Get API key; trợ lý AI dùng Gemini
```

Thiếu `GROQ_API_KEY` thì trợ lý AI dùng nhận dạng giọng nói của trình duyệt như cũ.
Thiếu `GEMINI_API_KEY` thì trợ lý AI dùng gemma trên Ollama; có key mà Gemini lỗi
thì cũng tự chuyển sang gemma. `GEMINI_MODEL` đổi model (mặc định `gemini-3.5-flash-lite`).

Thiếu một trong ba khoá payOS thì nút thanh toán tắt, màn hình Gói ghi "Liên hệ
quản trị viên". Webhook của kênh thanh toán trên payOS trỏ về
`https://finance.nnqlab.dev/api/payos/webhook`. Giá và hạn mức AI nằm trong
`web/lib/plans/plans.ts`.

## Cloudflare Tunnel

Có hai cách, chọn một:

**A. Tunnel riêng cho app (khuyên dùng)** — chạy `cloudflared` trong Compose:

1. Cloudflare Zero Trust → Networks → Tunnels → *Create a tunnel* →
   Cloudflared, đặt tên (ví dụ `finance`).
2. Chép token (chuỗi sau `--token`) vào `CLOUDFLARE_TUNNEL_TOKEN` trong
   `deploy/.env`. Bỏ qua bước cài connector mà Cloudflare gợi ý.
3. *Public Hostname*: `finance.nnqlab.dev` → Service `HTTP` → `web:3000`.
4. Chạy lại `deploy/scripts/deploy.sh`.

**B. Dùng tunnel `cloudflared` đã có sẵn trên máy**: thêm public hostname
`finance.nnqlab.dev` → `http://127.0.0.1:3010`, để trống `CLOUDFLARE_TUNNEL_TOKEN`.

## Tunnel cho dev server (thử trên điện thoại)

Mỗi máy dev có tunnel và tên miền riêng, trỏ vào dev server của máy đó (`npm run dev`,
cổng 3000), tách khỏi tunnel production: máy nhà là `finance-dev-home.nnqlab.dev` (tunnel
`finance-dev-home`), server còn lại là `finance-dev.nnqlab.dev` (tunnel `finance-dev`). Không
chạy một tunnel trên hai máy: Cloudflare chia request ngẫu nhiên cho các máy đang nối vào
nó. Tunnel chạy luôn trong Docker (`deploy/compose.dev-tunnel.yaml`, tự bật lại cả sau khi
khởi động máy); chỉ cần dev server đang chạy là thử được, không thì trang báo 502.

Trong `web/`: `npm run tunnel` bật (hoặc kiểm tra) tunnel, `npm run tunnel -- stop` tắt,
`npm run tunnel -- logs` xem log. Trên điện thoại mở một lần
`https://<DEV_TUNNEL_HOST>/api/dev/login?key=<DEV_TUNNEL_KEY>&next=/overview`; trình duyệt
giữ khoá trong cookie 90 ngày.

Ai cũng mở được địa chỉ này, nhưng chỉ người có khoá mới đăng nhập được người dùng dev.
Trong `web/.env.local` của mỗi máy: `DEV_TUNNEL_ID` (id tunnel của máy), `DEV_TUNNEL_HOST`
(tên miền của nó), `DEV_TUNNEL_KEY` (từ 32 ký tự) và `DEV_LOGIN=1`. Đổi khoá là đăng xuất
mọi máy.

Cùng mạng nội bộ với máy dev thì không cần tunnel: thêm địa chỉ LAN của máy vào
`allowedDevOrigins` (`web/next.config.ts`) và `DEV_LAN_HOSTS` (trong `web/.env.local`, cách nhau dấu
phẩy), rồi mở `http://<địa chỉ LAN>:3000/api/dev/login?key=<DEV_TUNNEL_KEY>&next=/overview`.

Dựng cho một máy mới: cài `cloudflared` (bản `cloudflared-linux-amd64` hoặc `-arm64` trên
GitHub, vào `~/.local/bin`), `cloudflared tunnel login` (chọn zone `nnqlab.dev`; nếu trình
duyệt tải về `cert.pem` thì chép nó vào `~/.cloudflared/`), rồi `cloudflared tunnel create
<tên>` (in ra id, file khoá ở `~/.cloudflared/<id>.json`) và `cloudflared tunnel route dns
<tên> <tên miền>`. Ghi id và tên miền vào `web/.env.local`, khởi động lại dev server, chạy
`npm run tunnel`. (Bản ghi `dev.nnqlab.dev` trỏ vào tunnel `finance-dev` nhưng đã có
Cloudflare Access chặn sẵn từ trước, nên không dùng.)

## Chuyển domain sang server (đã làm 2026-10-01)

Domain giữ nguyên nên cấu hình Firebase Auth (authorized domain, OAuth redirect)
không phải đổi.

1. Kiểm tra bản production ở `127.0.0.1:3010`: đăng nhập, thêm giao dịch…
2. Cloudflare DNS: xoá bản ghi `finance` đang trỏ tới Vercel, rồi thêm public
   hostname cho tunnel (Cloudflare tự tạo bản ghi mới).
3. Mở `https://finance.nnqlab.dev`, đăng nhập lại để kiểm tra.
4. Giữ project Vercel vài ngày. Nếu có sự cố, trỏ DNS về Vercel là quay lại bản cũ.

## Cập nhật hằng ngày

```sh
cd ~/apps/finance-tracker && deploy/scripts/deploy.sh
```

Script dừng lại nếu bản clone có thay đổi chưa commit. Migration mới được áp
trước khi app khởi động lại.

## Backup

Mỗi đêm 02:30, cron chạy `deploy/scripts/backup.sh`:

1. `pg_dump` vào `deploy/backups/` (giữ `BACKUP_KEEP` = 14 bản).
2. Chép lên Google Drive qua rclone remote `gdrive-crypt:` — nội dung **đã mã
   hoá**, nằm trong folder `finance-backups` (giữ `BACKUP_REMOTE_DAYS` = 90 ngày).
   Log ở `deploy/backups/backup.log`.

Cấu hình rclone nằm ở `~/.config/rclone/rclone.conf`:

- `gdrive`: Google Drive, quyền `drive.file` (chỉ thấy file rclone tạo), dùng
  OAuth client "Desktop app" riêng trong project Google Cloud.
- `gdrive-crypt`: lớp mã hoá phía trên `gdrive:finance-backups`. Mật khẩu ở
  `~/.config/finance-tracker/backup-encryption.txt` — **phải cất thêm một bản
  ngoài máy này** (trình quản lý mật khẩu), mất là không mở được backup.

```sh
rclone ls gdrive-crypt:                         # liệt kê bản backup trên Drive
rclone copy gdrive-crypt:finance-XXXX.dump .    # tải về (tự giải mã)
deploy/scripts/restore.sh finance-XXXX.dump     # khôi phục (hỏi xác nhận)
```

## Xem log, khởi động lại

```sh
cd ~/apps/finance-tracker/deploy
docker compose -f compose.yaml -f compose.prod.yaml logs -f web
docker compose -f compose.yaml -f compose.prod.yaml restart web
```

Mọi container đặt `restart: unless-stopped`: máy khởi động lại thì app tự chạy lại.
