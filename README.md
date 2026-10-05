# Finance Tracker

Ứng dụng quản lý tài chính cá nhân, tự host tại `finance.nnqlab.dev`.

```
finance.nnqlab.dev → Cloudflare Tunnel → web (Next.js) → PostgreSQL
                                                         ↑
                                     backend (worker nhắc thông báo)
Firebase: chỉ dùng cho đăng nhập Google (Auth) và thông báo đẩy (FCM)
```

## Các phần của project

| Thư mục | Vai trò | Đọc thêm |
|---|---|---|
| [`web/`](web/) | Giao diện và server Next.js: trang, Server Actions, truy cập database | [`web/README.md`](web/README.md) |
| [`db/`](db/) | Schema PostgreSQL và migration — dùng chung cho web và backend | [`db/README.md`](db/README.md) |
| [`backend/`](backend/) | Python: worker nhắc thông báo, sau này LLM | [`backend/README.md`](backend/README.md) |
| [`deploy/`](deploy/) | Docker Compose, script deploy / backup / database dev | [`deploy/README.md`](deploy/README.md) |
| [`docs/design/`](docs/design/) | Bản thiết kế giao diện (HTML/CSS) | [`docs/design/README.md`](docs/design/README.md) |

## Bắt đầu nhanh (dev)

```sh
cd web
npm install
npm run db:up      # Postgres dev ở 127.0.0.1:5432, tự thêm DATABASE_URL vào web/.env.local
npm run dev        # http://localhost:3000
```

`web/.env.local` cần thêm cấu hình Firebase — xem [`web/README.md`](web/README.md).

### Xem giao diện không cần Google (chỉ dev)

Với `DEV_LOGIN=1` trong `web/.env.local`, mở
`http://localhost:3000/api/dev/login?next=/transactions` để đăng nhập bằng user
`dev-user` của database dev, kèm dữ liệu mẫu khoảng hai tháng (tạo ở lần đầu).
Chỉ hoạt động với `next dev` và request tới localhost; bản build production bỏ qua.

Chụp màn hình một trang (cần dev server đang chạy và Google Chrome):

```sh
node scripts/screenshot.mjs /transactions --device=phone --theme=dark --full
```

## Cập nhật production

Commit và push lên `main`, rồi trên máy chủ:

```sh
cd ~/apps/finance-tracker && deploy/scripts/deploy.sh
```

Dev và production chạy trên cùng máy nhưng tách hẳn (thư mục, database, cấu
hình) — chi tiết trong [`deploy/README.md`](deploy/README.md).
