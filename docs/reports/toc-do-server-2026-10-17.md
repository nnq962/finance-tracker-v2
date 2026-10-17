# Rà soát tốc độ phía server — 2026-10-17

Chỉ đọc và đo; không sửa code, không ghi vào DB nào, không đổi cấu hình hay restart container, không commit.

## Tóm tắt

1. **Truy vấn DB không phải thủ phạm.** Mỗi truy vấn của trang chạy dưới 0,3 ms với người dùng thường và dưới 20 ms với người dùng rất nặng (30.000 giao dịch). Độ trễ vòng DB khoảng 0,04 ms nên chuỗi truy vấn nối tiếp cũng không đáng kể. Cả bảy trang đều chỉ tốn 30–110 ms trên dev.
2. **Thủ phạm số 1: kiểm tra thu hồi phiên Firebase.** Nó chạy ở mọi trang và mọi server action, và tốn khoảng **0,25–0,3 s** mỗi lần. Dev bỏ qua bước này (`notRevoked = Promise.resolve(true)`) nên con số dev đẹp hơn production rất nhiều. Trong layout, bước này còn chặn cả khung giao diện.
3. **Thủ phạm số 2: tunnel cloudflared hay rớt kết nối QUIC.** Trong 24 giờ qua có 14 đợt rớt, có đợt kéo dài gần một giờ. Độ trễ từ máy chủ tới biên Cloudflare dao động 0,2–1,4 s mà trang gốc chỉ mất 4 ms.
4. Phần còn lại (truy vấn lặp, lấy thừa, thiếu index) có thật nhưng nhỏ ở quy mô hiện tại. Xếp vào "làm khi có dịp".

**Không đo được:** EXPLAIN trên DB production bị bộ phân quyền của phiên chặn ("Production Reads"), nên mọi nhận định về dữ liệu thật dựa trên DB dev (rất nhỏ) và một DB tạm tổng hợp (xem mục 3). Cần người dùng cho phép nếu muốn đối chiếu với số liệu production (kích thước bảng, số giao dịch của người dùng nặng nhất).

---

## 1. Mỗi trang lấy gì ở server

Số truy vấn là ước tính từ code (đếm qua `pg_stat_database` bị nhiễu vì phiên khác cùng dùng DB dev). "Vòng" là độ sâu nối tiếp.

Layout `(main)/layout.tsx` chạy mỗi lần tải cứng: `requireSession()` (chờ đủ cả kiểm tra thu hồi, một lượt gọi Google) rồi `needsOnboarding` (1 truy vấn, nối tiếp sau đó). Nó **không** làm việc nặng khi chuyển trang mềm, vì layout không render lại.

Theo tài liệu Next trong `node_modules`, layout và page render song song. Vì vậy page bắt đầu truy vấn ngay, không chờ layout. Nhưng `loading.tsx` nằm *trong* layout, nên khung chờ chỉ gửi đi được khi layout xong, tức sau kiểm tra thu hồi (mục 2.2).

| Trang | Dữ liệu (hàm) | Truy vấn ≈ | Vòng | Lấy thừa / lặp |
|---|---|---|---|---|
| overview | `getAccounts`, `getDebts`, `getContacts`, giao dịch 6 tháng + `getDebtPaymentsInRange`, `getCategoryGroups` (cache), `getMissionState`, `getPlanState`, `getBudgetOverview` | ~34 | 3–4 | Xem dưới. Giao dịch 6 tháng cho biểu đồ, gửi xuống client chỉ còn tổng. |
| transactions | giao dịch tháng + trả nợ, `getAccounts`, `getCategoryGroups`, `getBudgetOverview` | ~26 | 3–4 | `getBudgetOverview` chạy trọn vẹn chỉ để vẽ dòng hạn mức. |
| budget (tài khoản, hũ) | `getAccounts`, `getRecentTransactionsByAccount`, `getCategoryGroups` | ~9 | 2 | `getRecentTransactionsByAccount` quét **toàn bộ lịch sử** của người dùng (xem mục 3). |
| debts | `getAccounts`, `getContacts`, `getDebts` | ~7 | 2 | `getDebts` đọc mọi khoản vay kèm mọi lần trả (chủ ý: mở sheet tức thì). |
| settings | `getNotificationState`, `getCategoryGroups`, `getPlanState`, `getUserDataSummary`, `getBudgetOverview`; admin thêm `getAdminData` + `getBroadcastScreenData` | ~30 | 3–4 | `getBudgetOverview` đầy đủ chỉ để hiện tóm tắt hạn mức. Admin: gọi Firebase `getUsers` nối tiếp sau DB, 1 lượt gọi mỗi 100 người dùng. |

Tất cả trang đều gọi `loadWithSession`, tức truy vấn song song với kiểm tra thu hồi. Thiết kế này đúng. Không có truy vấn N+1 theo từng dòng.

**Lặp trong một yêu cầu:**
- `getBudgetOverview` gọi `spendingByGroupAndMonth` hai lần (6 tháng và hũ). Mỗi lần gọi `feesAndInterest`, rồi `getDebtPaymentsInRange`, rồi `getDebts` (2 truy vấn). Tổng ~17 truy vấn, trong đó khoảng 8 đọc lại cùng dữ liệu nợ.
- `getAccounts` luôn chạy thêm `getLinkedAccountIds` (3 truy vấn nối tiếp sau truy vấn tài khoản). Truy vấn "mọi chuyển khoản của người dùng" không có chặn thời gian (mục 3, Q2). Chỉ trang tài khoản cần cờ `linked`, nhưng overview, transactions, debts và settings đều trả giá.
- Trang overview đọc `getDebts` ít nhất 3 lần (trực tiếp và qua hai nhánh của `getBudgetOverview`).

**Khung chờ:** cả 5 trang đều có `loading.tsx` riêng khớp bố cục. Bố cục chuyển trang mềm tức thì nhờ `staleTimes.dynamic: 300` (client giữ 5 phút).

## 2. Số đo

### 2.1 TTFB trên dev (http://localhost:3000, đăng nhập `/api/dev/login`)

Mỗi giá trị là trung vị của 6–10 lần, máy rảnh. Dev chạy `next dev`, không phải build production. TTFB dev đo **khung** (layout trả về ngay vì dev không kiểm tra thu hồi), còn **tổng** mới là lúc dữ liệu xong.

| Trang | TTFB | Tổng | HTML thô | HTML gzip |
|---|---|---|---|---|
| overview | 0,05 s | 0,10 s | 297 KB | 40 KB |
| transactions | 0,05 s | 0,08 s | 416 KB | 45 KB |
| budget | 0,03 s | 0,065 s | 208 KB | 31 KB |
| debts | 0,03 s | 0,047 s | 186 KB | 28 KB |
| settings (dev là admin) | 0,05 s | **0,31 s** | 252 KB | 32 KB |

Settings chậm gấp 3–6 lần vì tài khoản dev nằm trong `ADMIN_EMAILS`. `getAdminData` gọi Firebase `auth.getUsers` qua mạng thật, tốn ~0,25 s. Đây là cách đo gián tiếp tốt nhất về giá của một lượt gọi Firebase (khớp mục 2.2). Dữ liệu dev rất nhỏ (96 giao dịch, 2 người dùng).

### 2.2 Kiểm tra thu hồi phiên (chỉ có ở production)

`verifySessionCookie(cookie, true)` cuối cùng gọi `identitytoolkit.googleapis.com` (`accounts:lookup`). Từ máy chủ, một yêu cầu POST bị từ chối (không xác thực, chỉ đo hạ tầng) có TTFB:

- 0,28 s với kết nối mới (kết nối 20 ms, TLS 65 ms, còn lại là phía Google);
- ~0,21–0,31 s khi dùng lại kết nối.

Hệ quả:
- Mỗi trang production mất **tối thiểu ~0,3 s** dù truy vấn xong trong 50 ms (`loadWithSession` chờ `Promise.all([notRevoked, data])`).
- Mỗi server action (`requireSession`) chờ ~0,3 s trước khi bắt đầu ghi.
- Tải cứng: layout chờ cùng lượt kiểm tra đó trước khi trả về, nên **khung và khung chờ không gửi được trong ~0,3 s đầu**, dù page đã song song.
- Mỗi lần token truy cập hết hạn (~1 giờ) có thêm ~0,1 s lấy token (`oauth2.googleapis.com` TTFB ~0,1 s).

### 2.3 Tunnel và biên Cloudflare (đo từ chính máy chủ này)

| Đường | Kết quả |
|---|---|
| `http://127.0.0.1:3010/login` hoặc `/` | TTFB **3–7 ms**, ổn định |
| `https://timi.nnqlab.dev/login` hoặc `/` | TTFB **0,2–1,4 s**, trung vị ~0,35 s |
| `https://timi.nnqlab.dev/_next/static/...` (HIT ở biên, 1 KB) | TTFB 0,30–1,46 s |

- Tệp tĩnh đã cache ở biên cũng có TTFB y hệt trang động ⇒ độ trễ nằm ở **đường mạng từ máy này tới biên Cloudflare (SIN/HKG)**, không phải ở Timi hay đoạn tunnel→origin. Kết nối TCP lúc nhanh 20–55 ms, lúc chậm 210 ms, và cả TTFB nhân lên cùng lúc (ví dụ cùng URL `/login`: 0,21 s rồi 1,42 s).
- Đây là số đo từ máy chủ nhà, không phải điện thoại người dùng. Nó chỉ chứng minh đường ra Internet của nhà có lúc kém, không đo được thứ điện thoại thấy.
- IPv6 không dùng được trên máy này (`ping`/`curl -6` mất gói 100%); cloudflared dùng IPv4 nên không ảnh hưởng.

**Log cloudflared (24 giờ, đọc bằng `docker logs --tail`; `--since` của Docker ở đây trả 0 dòng):**

- 14 đợt lỗi, ~278 dòng ERR/WRN, gồm `failed to accept QUIC stream: timeout: no recent network activity`, `datagram manager error`, `Failed to dial a quic connection`. Cả 118 kết nối đăng ký đều dùng `protocol=quic`.
- Các đợt kéo dài: 13:07–13:56 UTC (16/10), 16:23–16:52, 07:08–08:53 UTC (17/10), gần nhất 11:38–11:45 UTC (18:38 giờ Việt Nam). Mỗi đợt tunnel tự nối lại và đổi nơi giữa HKG và SIN.
- Tunnel dev còn tệ hơn (852 dòng lỗi trong 2.000 dòng gần nhất).
- cloudflared đang chạy 2026.9.3, bản mới là 2026.10.0 (image `cloudflare/cloudflared:latest` nhưng không tự cập nhật vì `--no-autoupdate`).
- Ngày 7/10 từng có ~3.470 lỗi DNS (`lookup ... argotunnel.com on 127.0.0.11:53`) rồi tunnel tự tắt.

**Web container:** `docker logs finance-web-1` chỉ có 9 dòng, không có log yêu cầu nào, và một lỗi `Failed to find Server Action ... older or newer deployment` (khách giữ tab cũ qua một lần deploy; đã có cơ chế `stale-deploy`). Hiện **không có cách nào biết thời gian phục vụ thật trên production**.

### 2.4 Tài nguyên

`docker stats`: web 102 MB / 0,6% CPU; postgres prod 42 MB / 1,4%; postgres dev 45 MB; worker 34 MB; cloudflared 23 MB. Máy 28 lõi, RAM 64 GB (còn trống ~40 GB trong cache), tải 0,4. Không có áp lực tài nguyên. Máy còn chạy Frigate NVR (110 GB nhận vào, 1,8 GB RAM) và Ollama. Chưa có bằng chứng chúng chen băng thông ra Internet; đáng kiểm tra nếu muốn truy nguyên các đợt rớt QUIC.

### 2.5 Cấu hình khác (chỉ xem)

- **Pool DB:** `pg.Pool({ max: 10 })`, không `idleTimeoutMillis`, `connectionTimeoutMillis` hay `statement_timeout`. Mặc định pg đóng kết nối rảnh sau 10 s. Đo: mở 10 kết nối mới tốn ~8–11 ms, nên đây không phải vấn đề. Postgres ở cùng mạng Docker (`postgres:5432`). Khuyến nghị đặt thêm timeout chỉ để an toàn.
- **Next standalone**, `compress: true` mặc định (origin trả gzip; Cloudflare chuyển sang brotli cho người dùng), HTTP/2 và `alt-svc h3` ở biên. HTML `private, no-store` (đúng). `/_next/static/*` là `public, max-age=31536000, immutable` và Cloudflare trả `HIT`. Logo `/institutions/*` cache 30 ngày + stale-while-revalidate. Cache tĩnh ổn.
- **Tổng JS** của build (mọi chunk, gzip) ~857 KB; phần tải lần đầu thuộc phiên phía trình duyệt, không đo ở đây.
- `proxy.ts` chạy mỗi yêu cầu nhưng chỉ kiểm tra host/cookie, không đáng kể.
- Container web `read_only` với `/app/.next/cache` là tmpfs; `unstable_cache` của `getCategoryGroups` (3.600 s + tag) hoạt động tốt (không thấy truy vấn danh mục trong lần gọi thứ hai).

## 3. Truy vấn và index

### 3.1 DB dev (96 giao dịch)

Mọi truy vấn trang chủ: planning 0,02–2,2 ms, thực thi 0,003–0,25 ms. Truy vấn lớn nhất là giao dịch theo tháng với 8 phép nối (planning ~2 ms, thực thi 0,25 ms). Dữ liệu quá nhỏ nên planner chọn quét tuần tự, không kết luận được về index.

### 3.2 DB tạm tổng hợp (container tạm `postgres:18-alpine` trên tmpfs, đã xoá; không đụng DB thật)

Nạp `db/schema.sql`, 51 người dùng, 78.000 giao dịch: một người dùng nặng `u0` (30.000 giao dịch trong 3 năm, gồm 2.000 chuyển khoản) và 50 người dùng thường (~960 mỗi người). Đây là mô phỏng, không phải dữ liệu thật.

| Truy vấn | Người dùng thường | Người dùng nặng | Ghi chú |
|---|---|---|---|
| Q1 `getAccounts` | 0,09 ms | 0,09 ms | tốt |
| Q2 chuyển khoản không chặn ngày (`getLinkedAccountIds`) | 0,09 ms | **3,9 ms** | quét cả lịch sử (`Seq Scan`, 2.000 dòng); tăng tuyến tính, chạy ở mọi trang |
| Q3 giao dịch 1 tháng (8 phép nối) | 0,45 ms | 1,4 ms | dùng `transactions_user_occurred_idx`; planning ~2,2 ms (cao nhất) |
| Q3b giao dịch 6 tháng (overview) | 0,44 ms | 2,7 ms | tốt |
| Q4 trả nợ trong khoảng | 0,17 ms | 0,17 ms | điều kiện là biểu thức `(paid_at + paid_time) AT TIME ZONE` ⇒ không dùng index theo ngày; quét theo `user_id` ở `debt_payments_debt_idx`, đủ nhanh vì ít |
| Q5 `getRecentTransactionsByAccount` | 0,7 ms | **18,5 ms** | duyệt hết 30.000 dòng (nhánh `account_id` là `Seq Scan` 4 ms) rồi xếp hạng bằng window |
| Q6 chi theo nhóm × tháng (6 tháng) | 0,5 ms | 3,8 ms | tốt |
| Q7 `min(occurred_at)` | 0,02 ms | 0,02 ms | index-only backward scan |
| Q8 `getMissionState` | 0,06 ms | 2,7 ms | `EXISTS ... kind='transfer'` quét `Seq Scan` (người dùng nặng) |
| Q9 `getUserDataSummary` | 0,16 ms | 3,2 ms | đếm toàn bộ 30.000 dòng (`count(*)`) |
| Q10, Q11 | <0,1 ms | <0,1 ms | tốt |

Tổng chi phí DB của một lần tải overview cho người dùng nặng ước tính 15–30 ms thực thi + vài ms planning; còn ~34 truy vấn × 0,04 ms độ trễ vòng. Tức nhỏ hơn nhiều so với 0,3 s kiểm tra thu hồi.

### 3.3 Index so với truy vấn hay chạy

Có sẵn và đang dùng tốt: `transactions_user_occurred_idx (user_id, occurred_at DESC)` (mọi truy vấn theo tháng, `min`), `accounts_user_created_idx`, `debts_user_recorded_idx`, `debt_payments_debt_idx (user_id, debt_id, paid_at, paid_time)`, `category_*_idx`, `subscriptions_user_id_ends_at_idx`, `budgets_user_group_idx`, khoá chính `(user_id, ...)` ở `ai_usage`, `mission_rewards`, `notice_reads`.

Khoảng trống (chỉ đáng làm khi dữ liệu lớn):
1. Không có chỉ mục để tìm nhanh "chuyển khoản của người dùng" hay "giao dịch của một tài khoản theo thời gian". Các chỉ mục `transactions_account_idx`, `from_account_idx` và `to_account_idx` chỉ có cột tài khoản (không có `occurred_at`), nên Q5 phải đọc hết lịch sử.
2. `debt_payments` không có chỉ mục `(user_id, paid_at)`, và điều kiện thời gian viết bằng biểu thức. Số khoản trả nợ vài trăm nên chưa vấn đề.
3. `getUserDataSummary` đếm `count(*)` toàn bộ; chỉ chạy ở trang cài đặt và chỉ cần khi mở màn "xoá dữ liệu".

## 4. Nguyên nhân, xếp theo mức ảnh hưởng

| # | Nguyên nhân | Ảnh hưởng ước tính | Bằng chứng |
|---|---|---|---|
| 1 | Kiểm tra thu hồi phiên Firebase chặn mỗi trang, mỗi action, và khung ở layout | **+0,25–0,3 s mỗi yêu cầu**; hơn 80% thời gian server của trang trên production | Mục 2.2; settings admin dev 0,31 s so với 0,05–0,1 s |
| 2 | Tunnel QUIC rớt và đường tới biên Cloudflare dao động | **Chậm 0,2–1,4 s ngẫu nhiên; có đợt hỏng nhiều phút** | Mục 2.3: 14 đợt/24 giờ; TTFB origin 4 ms |
| 3 | Không có số đo thời gian phục vụ thật trên production | Không tự gây chậm nhưng làm mù mọi tối ưu | Log web trống |
| 4 | Truy vấn lặp và quét toàn lịch sử (`getBudgetOverview` ~17 truy vấn, `getLinkedAccountIds`, `getRecentTransactionsByAccount`) | Hiện <5 ms; người dùng nặng 20–30 ms; sẽ tăng tuyến tính theo lịch sử | Mục 3.2 |
| 5 | Settings của admin gọi Firebase `getUsers` nối tiếp sau DB | Admin: song song với kiểm tra thu hồi nên không cộng thêm trên production, nhưng tăng theo số người dùng | Mục 2.1 |

## 5. Đề xuất

Thứ tự theo lợi ích trên rủi ro. Mục 1 và 2 chồng lấn với phiên đăng nhập: cần thống nhất với phiên đó trước khi ai sửa `lib/auth/session.ts`.

### 5.1 Nhớ kết quả kiểm tra thu hồi trong bộ nhớ vài chục giây
- Lưu `uid + băm cookie → notRevoked` trong `Map` của tiến trình (TTL 30–60 s), và gộp các lượt gọi đang chờ (in-flight) cùng khoá.
- **Lợi ích:** bỏ ~0,25–0,3 s khỏi hầu hết trang và server action (chỉ lượt đầu mỗi TTL còn chờ). Lớn nhất trong báo cáo này.
- **Rủi ro:** phiên bị thu hồi vẫn được dùng thêm tối đa TTL giây (cookie Firebase vốn sống nhiều ngày; chỉ ảnh hưởng đăng xuất toàn bộ hoặc khoá tài khoản). Sau khi người dùng bấm đăng xuất trong chính app, xoá mục tương ứng. Cần test cho nhánh thu hồi. Bộ nhớ tiến trình bị mất khi deploy, vô hại.

### 5.2 Layout không chờ kiểm tra thu hồi
- Layout đọc người dùng đã xác minh chữ ký (cục bộ, không mạng) và để `loadWithSession` ở từng trang chặn việc trả dữ liệu như hiện nay. Hoặc đặt kiểm tra trong một con bọc `Suspense`.
- **Lợi ích:** với tải cứng (mở PWA, làm mới), khung và `loading.tsx` ra sau ~50 ms thay vì ~0,3 s. Nếu làm 5.1 thì lợi ích còn khoảng một nửa số lần.
- **Rủi ro:** thấp nhưng phải bảo đảm trang nào trong `(main)` cũng dùng `loadWithSession`. Trang `design` dùng `requireAdmin` (qua `requireSession`), nên vẫn được bảo vệ. Một phiên bị thu hồi có thể thấy khung giao diện trống (không dữ liệu) trước khi bị chuyển hướng.

### 5.3 Chuyển cloudflared sang HTTP/2 và cập nhật bản
- Thêm `--protocol http2` vào lệnh chạy tunnel (`deploy/compose.prod.yaml`, và cả `compose.dev-tunnel.yaml`), đồng thời kéo bản 2026.10.0.
- **Lợi ích:** loại bỏ lỗi hàng loạt kiểu "no recent network activity" của QUIC/UDP trên đường nhà (14 đợt/24 giờ); các đợt kéo dài vài chục phút là thời gian người dùng thấy trang treo hoặc lỗi.
- **Rủi ro:** thấp. Tunnel khởi động lại vài giây khi áp dụng (người dùng gặp lỗi ngắn một lần). HTTP/2 qua TCP có thể chậm hơn chút khi mạng đang tốt; nên chạy thử rồi so sánh số lỗi trong log sau 24 giờ. Việc đổi cấu hình và restart phải do chủ hệ thống làm, báo cáo này không thực hiện.

### 5.4 Thêm đo đạc phía server
- Ghi một dòng log mỗi yêu cầu trang chậm (hoặc header `Server-Timing`) gồm thời gian kiểm tra thu hồi, tổng truy vấn và tổng render. Dùng `console.info` có ngưỡng (ví dụ >300 ms) để log không phình.
- **Lợi ích:** biết thật thay vì suy luận từ dev; xác nhận 5.1 và 5.3 có hiệu quả.
- **Rủi ro:** rất thấp, nhớ không ghi dữ liệu người dùng vào log.

### 5.5 Gọn `getBudgetOverview` (không đổi hành vi)
- Dùng `cache()` của React để gộp `getDebts`/`getDebtPaymentsInRange` trong một yêu cầu; gộp hai lần `spendingByGroupAndMonth` thành một truy vấn có cột `savings`; dùng bản "chỉ tóm tắt" cho transactions và settings thay vì tính cả bảng chi tiết.
- **Lợi ích:** giảm ~34 xuống ~15 truy vấn ở overview. Với dữ liệu hiện nay tiết kiệm <5 ms ⇒ gần như không thấy được, trừ khi người dùng có hàng chục nghìn giao dịch.
- **Rủi ro:** trung bình. Logic hạn mức vừa sửa nhiều lần (commit `930aec8`, nhiều hiệu chỉnh), nên cần test kỹ. **Chưa nên làm trước 5.1–5.4.**

### 5.6 Bỏ `getLinkedAccountIds` khỏi `getAccounts`
- Chỉ tính cờ `linked` ở trang tài khoản, hoặc tính bằng một truy vấn `EXISTS` trong chính truy vấn tài khoản.
- **Lợi ích:** bỏ 3 truy vấn và một vòng nối tiếp ở mọi trang; tránh quét lịch sử chuyển khoản (3,9 ms với 2.000 chuyển khoản, tăng dần).
- **Rủi ro:** thấp, nhưng `Account.linked` đang được nhiều nơi dùng. Cần xem lại từng nơi xoá/khoá tài khoản.

### 5.7 Index và truy vấn cho tài khoản
- Thêm `transactions (account_id, occurred_at DESC)` (và tương tự cho `from_account_id`, `to_account_id`) rồi viết lại `getRecentTransactionsByAccount` bằng `LATERAL ... LIMIT 5` theo từng tài khoản.
- **Lợi ích:** 18 ms → khoảng 1 ms cho người dùng rất nặng; trang tài khoản. Hiện không đáng kể.
- **Rủi ro:** thấp (thêm index chậm ghi một chút); chỉ làm khi có người dùng thật gần mức đó.

### 5.8 Settings quản trị
- Tải `getAdminData` khi mở màn "Quản trị" (hoặc dùng `Promise.all` cho các lô 100 người dùng của `getUsers`).
- **Lợi ích:** admin không phải gánh gọi Firebase theo số người dùng. Hiện không thấy rõ trên production vì chạy song song với kiểm tra thu hồi.
- **Rủi ro:** thấp; chỉ ảnh hưởng quản trị viên.

### 5.9 Pool DB
- Thêm `connectionTimeoutMillis`, `idleTimeoutMillis` và `statement_timeout` an toàn.
- **Lợi ích:** về hiệu năng gần như 0 (đo: mở 10 kết nối mới ~8–11 ms); chủ yếu tránh treo vô hạn khi DB lỗi.
- **Rủi ro:** thấp; đặt timeout quá ngắn làm hỏng báo cáo nặng.

## 6. Việc cần người dùng quyết

- Cho phép EXPLAIN/đếm bảng chỉ đọc trên DB production (không in dữ liệu người dùng) để thay số liệu tổng hợp ở mục 3.2 bằng số thật.
- Có áp dụng 5.3 (đổi giao thức tunnel) không; cần quyền restart container.
- Phối hợp 5.1 và 5.2 với phiên đăng nhập, vì cùng sửa `lib/auth/session.ts`.

## Phụ lục: cách đo

- Dev: `curl -b jar -w '%{time_starttransfer} %{time_total}'` sau khi đăng nhập `/api/dev/login?next=/overview`; mỗi trang 6–10 lần, loại các lần nhiễu do phiên khác biên dịch lại.
- Biên Cloudflare: `curl -4` tới `https://timi.nnqlab.dev` và `http://127.0.0.1:3010`. Đo từ máy chủ, không phải từ điện thoại.
- Google: `curl` POST không xác thực tới `identitytoolkit.googleapis.com/.../accounts:lookup` (chỉ đo hạ tầng, trả 403).
- EXPLAIN: `EXPLAIN (ANALYZE, BUFFERS)` trên `finance-dev-postgres-1` (chỉ đọc); DB tạm tổng hợp dùng container `postgres:18-alpine` riêng trên tmpfs, đã xoá sau khi đo.
- Số truy vấn mỗi trang: đọc code; đếm qua `pg_stat_database` bị bỏ vì nhiễu.
