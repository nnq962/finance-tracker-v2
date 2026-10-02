# Database

PostgreSQL 18, chạy bằng Docker. Thư mục này là nguồn chuẩn của schema, dùng
chung cho Next.js và backend Python.

```
db/
├── migrations/   # Thay đổi schema, áp dụng lần lượt theo tên file (thời gian)
└── schema.sql    # TỰ SINH sau mỗi lần migrate — đọc để xem toàn bộ schema, không sửa tay
```

Cấu hình Docker và script nằm ở `deploy/`. Kết nối từ Next.js ở `web/lib/db/`.

## Lệnh thường dùng

Chạy trong thư mục `web/`:

```sh
npm run db:up                # Bật Postgres + áp migration (lần đầu tự tạo mật khẩu)
npm run db:down              # Tắt Postgres, dữ liệu vẫn giữ
npm run db:new -- add_budgets   # Tạo file migration mới
npm run db:migrate           # Áp migration còn thiếu + sinh lại web/lib/db/types.ts
npm run db:rollback          # Huỷ migration gần nhất
npm run db:status            # Xem migration nào đã/chưa áp
npm run db:psql              # Mở cửa sổ gõ SQL
npm run db:types             # Sinh lại web/lib/db/types.ts từ database
```

Lần đầu `npm run db:up` sẽ:

1. Tạo `deploy/.env.dev` với mật khẩu ngẫu nhiên (không commit file này).
2. Khởi động Postgres ở `127.0.0.1:5432`, tạo 2 database: `finance` (dev) và
   `finance_test` (integration test, xoá thoải mái).
3. Thêm `DATABASE_URL` vào `web/.env.local` để Next.js kết nối.

## Viết migration

Mỗi file có hai phần, theo định dạng của [dbmate](https://github.com/amacneil/dbmate):

```sql
-- migrate:up
ALTER TABLE accounts ADD COLUMN color text;

-- migrate:down
ALTER TABLE accounts DROP COLUMN color;
```

- Không sửa migration đã áp ở nơi khác (server, máy khác); tạo migration mới.
- Sau khi migrate, `web/lib/db/types.ts` được sinh lại để TypeScript biết cột mới.
- Commit cả file migration lẫn `db/schema.sql` và `web/lib/db/types.ts`.

## Quy ước schema

- Tiền: `bigint`, số nguyên VND, giới hạn `0..999 999 999 999 999`.
- ID: `uuid` (`uuidv7()`, tăng dần theo thời gian); người dùng: Firebase UID.
- Bảng nào cũng có `user_id`. Khoá ngoại dạng `(user_id, ...)` đảm bảo một
  dòng chỉ trỏ tới dữ liệu **của cùng người dùng**.
- Tên tài khoản/hạng mục không chép vào giao dịch; đọc qua `JOIN`.
- Ràng buộc nghiệp vụ nằm trong database: số dư không âm, giao dịch chuyển
  khoản phải có tài khoản nguồn/đích khác nhau, hạng mục phải cùng loại
  thu/chi với giao dịch...
- Cột `snake_case` trong SQL, `camelCase` trong TypeScript.

## Quyền truy cập

| Role | Dùng cho | Quyền |
|---|---|---|
| `finance` | Migration, backup | Chủ sở hữu schema |
| `finance_app` | Next.js (`DATABASE_URL`) | Chỉ đọc/ghi dòng, không tạo/xoá bảng |

## Xem dữ liệu bằng giao diện

Dùng DBeaver hoặc Beekeeper Studio, kết nối `127.0.0.1:5432`, database
`finance`, user `finance`, mật khẩu `POSTGRES_PASSWORD` trong `deploy/.env.dev`.

## Backup (production)

Chạy trong bản clone production (xem `deploy/README.md`).

```sh
deploy/scripts/backup.sh                     # → deploy/backups/finance-<thời gian>.dump
deploy/scripts/restore.sh <file.dump>        # khôi phục (hỏi xác nhận)
```

Nhớ chép bản backup ra ngoài máy chủ (ổ khác, NAS, cloud).
