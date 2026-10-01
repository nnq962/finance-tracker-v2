# Triển khai (self-host)

App chạy bằng Docker Compose trên máy chủ ở nhà, ra Internet qua Cloudflare
Tunnel. Không mở port nào trên router.

```
finance.nnqlab.dev → Cloudflare → Tunnel → web (Next.js) → postgres
```

| File | Vai trò |
|---|---|
| `compose.yaml` | Postgres + migration (dùng chung dev/prod) |
| `compose.prod.yaml` | `web` (Next.js) + `cloudflared` |
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
| Truy cập | `npm run dev` → `localhost:3000` | `127.0.0.1:3010` và qua Tunnel |

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
- `NEXT_PUBLIC_FIREBASE_*`: chép từ `.env.local`, riêng
  `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=finance.nnqlab.dev`.
- `FIREBASE_CREDENTIALS_FILE`: đường dẫn tuyệt đối tới file JSON service account
  (cùng file `GOOGLE_APPLICATION_CREDENTIALS` trong `.env.local`).
- `CLOUDFLARE_TUNNEL_TOKEN`: xem phần Tunnel; có thể để trống lúc đầu.

Rồi chạy:

```sh
deploy/scripts/deploy.sh
```

Mở `http://127.0.0.1:3010` để kiểm tra trước khi mở ra Internet.

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
