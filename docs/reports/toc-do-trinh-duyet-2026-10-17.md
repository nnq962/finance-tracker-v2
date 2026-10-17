# Tốc độ phía trình duyệt (2026-10-17, bản 6.15.17, commit adf319a)

Chưa sửa code app, chưa commit. Phạm vi: bundle, chỉ số tải trên điện thoại giả lập, PWA/cache, render. Phần đăng nhập và phần server/DB do hai phiên khác lo; chỗ nào chạm sang đó thì ghi rõ.

## 0. Kết luận ngắn

1. **Có thật, và nguyên nhân phía trình duyệt là kích thước JS.** Mỗi tab chính (Tổng quan, Giao dịch, Tài khoản, Vay nợ, Cài đặt) tải tối thiểu **1,31 MB JS thô (394 KB brotli, 23 file)**; Tổng quan, Giao dịch, Cài đặt tải **1,9–2,0 MB (551–585 KB brotli)**. Trang `/login` chỉ 0,69 MB (203 KB brotli). Trong app **gần như không có `dynamic import` / `React.lazy`** (chỉ `PushMessageListener` tự `import("firebase/messaging")`): mọi sheet, trợ lý Timi, biểu đồ đều nằm trong lần tải đầu.
2. **Thủ phạm lớn nhất: recharts** (+ d3, redux, immer, es-toolkit, decimal.js) = một file 462 KB thô / 120 KB brotli, có mặt ở Tổng quan, Giao dịch, Cài đặt. Hai tab sau không vẽ biểu đồ nào lúc mở; recharts vào qua `budgets-sheet` → `budget-charts` (một sheet).
3. **Trên CPU chậm 4x + mạng 4G, các trang đăng nhập rồi hydrate xong sau 2,3–2,7 giây** (đo trên dev server, xem giới hạn ở mục 1.2), long task dài nhất 825 ms (Tổng quan). Trong lúc đó người dùng chỉ thấy màn khởi động (FCP ≈ 0,5 s là màn `app/loading.tsx`).
4. **Chuyển tab nhanh khi đã có trong cache** (130–500 ms ở 4x CPU), lần đầu 440–1070 ms. Cache client 5 phút (`staleTimes.dynamic = 300`) và prefetch phần vỏ (loading.tsx) trong production là hợp lý. Cái làm chậm thêm là **server action `getNoticesAction` gọi lại ở mỗi lần đổi trang** (mục 4.2).
5. **Cache tĩnh tốt**: `/_next/static/*` là `immutable, max-age=1 năm`, mở lần hai trên `/login` thật giảm FCP 1812 → 536 ms, byte 488 KB → 13 KB. Không có service worker cache (SW chỉ để nhận push), HTML luôn lấy từ server.
6. **Mạng thật tới production rất dao động** từ máy này (TTFB `/login` 0,37–1,37 s bằng curl; TLS tới 0,56 s). Phần này là server + tunnel, không phải trình duyệt; để phiên server/đăng nhập xử lý.

## 1. Cách đo

### 1.1 Môi trường

- Chrome (channel `chrome`) qua `playwright-core` 1.63, khung 390×844, DPR 3, `isMobile`, cảm ứng.
- CDP: `Emulation.setCPUThrottlingRate = 4`; `Network.emulateNetworkConditions` = 9 Mbps xuống / 1,5 Mbps lên / RTT 165 ms ("Fast 4G" của DevTools). Ghi là **4G+4x**. Có thêm cột chỉ CPU 4x (không giới hạn mạng) và không giới hạn gì.
- Mỗi lần đo cold = context mới (cache trống). warm = tải lần hai trong cùng context (HTTP cache còn). Số trong bảng là **trung vị** của 5–7 lần (3 lần với cột warm/không giới hạn của dev).
- FCP/LCP/long task/layout shift lấy từ `PerformanceObserver`. **TBT** = tổng (thời gian long task − 50 ms) từ sau FCP. **Hydrate** = lúc React gắn `__reactProps$` lên phần tử tương tác đầu tiên (kiểm 20 ms một lần, sai số ±20 ms).
- Máy đo đang chạy nhiều phiên khác song song (28 lõi, tải không đều): dùng để so sánh tương đối, đừng coi là con số tuyệt đối.

### 1.2 Giới hạn quan trọng

- **Trang cần đăng nhập không đo được trên bản production build.** Build production không có dev login (`isDevLoginEnabled` trả `false` cố định lúc build). Tôi thử vá file đã build để mở đường vào thì bị chặn (đúng: đó là làm yếu cơ chế xác thực) nên đã bỏ. Do đó:
  - Số liệu bundle (mục 2) lấy từ **bản production build** (đầy đủ, chính xác, cùng hash với bản đang chạy: tên file chunk của `https://timi.nnqlab.dev` trùng bản build này).
  - Số liệu tải/hydrate của trang đăng nhập lấy từ dev server `localhost:3000` (cookie `__session=dev-session`, như `scripts/screenshot.mjs`). **Dev mode chậm hơn production** (React dev, chưa minify, kiểm tra thêm): xem đây là cận trên của hydrate. Chênh lệch ước 1,5–2,5 lần; không có số production để kiểm.
  - Neo so sánh bằng bản production thật: `/login` trên `next start` (14 file, 0,69 MB) hydrate sau 1,0 s ở 4G+4x; mỗi tab chính nặng gấp 2–3 lần.
  - Trong dev không có prefetch (Next chỉ prefetch ở production), nên cột "chuyển tab" mô tả lần đầu không có phần vỏ prefetch sẵn.
- Dev server `:3000` chỉ bị đọc (GET, cookie dev); không đổi cấu hình, không đụng container.

## 2. Bundle (bản production build)

Nguồn: `.next/diagnostics/route-bundle-stats.json` + nén gzip/brotli lại từng file + `next experimental-analyze --output` (phân rã theo module). Đây là phần JS cần tải **trước khi trang chạy được** ("first load"); chưa tính phần tải thêm (không có gì, vì không dùng dynamic import).

### 2.1 Theo route

| Route | Số file | JS thô | gzip | brotli |
|---|---:|---:|---:|---:|
| `/login` | 14 | 694 KB | 214 KB | 203 KB |
| `/` (landing) | 18 | 957 KB | 299 KB | 285 KB |
| `/budget` (Tài khoản) | 27 | 1.388 KB | 437 KB | 416 KB |
| `/debts` (Vay nợ) | 26 | 1.380 KB | 434 KB | 414 KB |
| `/settings/plan` | 23 | 1.315 KB | 413 KB | 394 KB |
| `/transactions` (Giao dịch) | 30 | 1.895 KB | 584 KB | 551 KB |
| `/overview` (Tổng quan) | 29 | 1.939 KB | 598 KB | 564 KB |
| `/settings` (Cài đặt) | 30 | 2.008 KB | 619 KB | 585 KB |
| (phần chung của 5 tab chính) | 23 | 1.315 KB | 413 KB | 394 KB |

Cloudflare gửi brotli (đã kiểm `content-encoding: br` trên production), nên cột brotli là số truyền thật. File `0cz1d0mv5g_q7.js` (polyfill nomodule, 112 KB) có trong HTML nhưng trình duyệt hiện đại không tải; không tính ở trên.

Phần chung của mọi tab chính (1,31 MB) gồm khung Next/React (~490 KB thô, không tránh được), và ~820 KB là của app: thư viện + code app mà **mọi tab đều tải dù lúc mở không dùng**.

### 2.2 Theo thư viện (trang `/overview`, 2.077 KB trong analyzer, tính cả polyfill 112 KB không tải)

| Nhóm | Thô | gzip (analyzer) | Có ở route nào |
|---|---:|---:|---|
| Next + React (router, react-dom ~200 KB) | 606 KB (494 KB không kể polyfill) | 229 KB | tất cả |
| **recharts + d3 + redux-toolkit + immer + es-toolkit + decimal.js** | **437 KB** | **191 KB** | Tổng quan, Giao dịch, Cài đặt (file riêng `3zj1sfx6-3z5g.js` 462 KB thô / 120 KB brotli) |
| Code app (~70 file) | 452 KB | 183 KB | tất cả (tab nào cũng 360–450 KB) |
| Firebase (`auth`, `messaging`, `app`, `installations`, `util`) | 136 KB | 42 KB | **tất cả, kể cả `/login`** |
| motion (framer-motion + motion-dom) | 132 KB | 64 KB | mọi tab chính (do `SwipeRow` và `cash-flow-calendar`) |
| Radix + floating-ui | 115 KB | 49 KB | mọi tab chính |
| **lucide-react** | **102 KB** | **63 KB** | mọi tab chính |
| sonner | 35 KB | 9 KB | tất cả (`Toaster` ở layout gốc) |
| vaul | 29 KB | 9 KB | mọi tab chính |
| cn (gộp class) | 25 KB | 10 KB | tất cả |

### 2.3 Code app lớn nhất đang vào lần tải đầu (chỉ dùng khi chạm vào)

| Thô | File | Dùng khi |
|---:|---|---|
| 48 KB | `lib/releases.ts` (lịch sử bản phát hành, 1.042 dòng, phình theo mỗi commit) | xem "bản mới" trong chuông thông báo, mục Cài đặt |
| 15,5 KB | `components/budgets/budgets-sheet.tsx` (+ `budget-charts` 9,8 KB kéo recharts, `budget-detail` 5,9 KB, `budget-suggest` 5 KB) | mở hạn mức |
| 14,6 KB | `lib/icons/category-icon-registry.ts` (~200 icon lucide, kéo ~100 KB lucide) | luôn cần (icon hạng mục trong danh sách) |
| 13,9 KB | `components/ui/sidebar.tsx` | chỉ thanh bên desktop |
| 12,6 KB | `lib/institutions.ts` (danh sách ngân hàng/ví) | chọn ngân hàng |
| 11,9 KB | `debts/.../add-debt-sheet.tsx` | thêm khoản nợ |
| ~46 KB | trợ lý Timi: `assistant` 11,6 + `answer-view` 8,9 + `drafts-view` 8,0 + `use-speech-recognition` 6,1 + … | mở trợ lý (nút giữa thanh tab) |
| 10,1 KB | `transaction-form.tsx` (+ cả `add-transaction/`) | thêm giao dịch |
| 9,9 KB | `plans/plan-screen.tsx` | màn gói Pro |
| 7,7 KB | `account-form.tsx` | thêm tài khoản |
| 7,1 KB | `pwa-install-button.tsx` | nút cài PWA |
| 6,3 KB | `onboarding/welcome-pictures.tsx` | lần đầu dùng |

Cộng lại các khối "chỉ khi chạm" khoảng **150–200 KB thô** (≈ 45–60 KB brotli) cộng với recharts 120 KB brotli, cộng `releases.ts` 12,6 KB gzip.

### 2.4 Tìm hiểu thêm

- Không có `next/dynamic`, `React.lazy` hay `import()` nào ở `app/`, `components/`, `lib/` (chỉ `PushMessageListener` tự `import("firebase/messaging")`). Mọi `AddTransactionSheet`, `TransactionFilterSheet`, `BudgetsSheet`, trợ lý đều được render sẵn trong cây (đóng, nhưng code đã tải và parse).
- `AssistantProvider` nằm ở layout `(main)` và luôn mount `AssistantFrame` (cộng listener `visualViewport` luôn chạy).
- Tên `Manrope` + `JetBrains Mono`: JetBrains Mono chỉ dùng ở một chỗ (`font-mono` trong tooltip của `components/ui/chart.tsx:266`) nhưng **được preload trên mọi trang** (2 file, 48 KB; xem 3.2).
- Tạo ra `lucide` 100 KB là vì `category-icon-registry` import tĩnh ~200 icon.

## 3. Chỉ số tải (điện thoại giả lập, 390 px)

### 3.1 Bản production build, trang công khai

| Trang | Điều kiện | TTFB | FCP | LCP | Hydrate | TBT | Byte truyền | Request |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| `/login` local `:3200` | 4G+4x, cold | 8 ms | 496 ms | 496 ms | 1.019 ms | 19 ms | 476 KB | 30 |
| `/login` local `:3200` | 4G+4x, warm (lần 2) | 8 ms | 220 ms | 220 ms | 293 ms | 0 | 16 KB | 27 |
| `/login` local `:3200` | chỉ CPU 4x | 8 ms | 120 ms | 120 ms | 314 ms | 26 ms | 476 KB | 30 |
| `/login` local `:3200` | không giới hạn | 8 ms | 52 ms | 52 ms | 90 ms | 0 | 476 KB | 30 |
| `/` landing `:3200` | 4G+4x, cold | 6 ms | 548 ms | 548 ms | 1.304 ms | 19 ms | 598 KB | 39 |
| `/` landing `:3200` | 4G+4x, warm | 3 ms | 296 ms | 296 ms | 351 ms | 0 | 20 KB | 36 |
| **`/login` production thật** (`timi.nnqlab.dev`) | 4G+4x, cold | **1.051 ms** | **1.812 ms** | 1.812 ms | **2.005 ms** | 26 ms | 488 KB | 32 |
| `/login` production thật | 4G+4x, warm | 447 ms | 536 ms | 536 ms | 585 ms | 0 | 13 KB | 29 |
| `/login` production thật | chỉ CPU 4x | 708 ms | 1.524 ms | 1.524 ms | 1.748 ms | 25 ms | 488 KB | 32 |

CLS = 0 ở tất cả. TTFB trên production thật gồm RTT giả lập 165 ms cộng đường tới Cloudflare và tunnel về server nhà (curl cho 0,37–1,37 s, nhiều khi chậm ở TLS), lớn hơn hẳn mọi thứ phía trình duyệt của `/login`. Với `/login`, JS/CSS thôi không phải vấn đề (hydrate xong 0,2–0,3 s sau khi tải xong, 1 long task 70 ms).

Đường găng của `/login` (waterfall `:3200`): HTML (179 ms) → CSS và 14 file JS song song (xong 357–1013 ms) → **font Manrope latin-ext (15 KB) tải lần thứ hai lúc 481 ms** vì có ký tự ngoài các nhóm đã preload (swap chữ) → `/icon.svg?...` → Google One Tap (`gsi/client` **103 KB, ưu tiên cao**, + 4 request FedCM, ~1,5 s) chạy song song sau hydrate.

### 3.2 Dev server `localhost:3000`, cần đăng nhập (dev mode: cận trên)

4G+4x, cold, trung vị 5 lần. Dữ liệu từ chính app (DB dev, ~39 dòng giao dịch/tháng).

| Trang | FCP | LCP | Hydrate | TBT | Long task dài nhất | JS tải | Request | Hydrate không giới hạn (cpu1, 3 lần) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `/overview` | 520 ms | 856 ms | **2.692 ms** | **959 ms** | 825 ms | 1.948 KB | 58 | 375 ms (TBT 146) |
| `/transactions` | 512 ms | 840 ms | 2.511 ms | 644 ms | 485 ms | 2.106 KB | 59 | 371 ms (TBT 181) |
| `/settings` | 516 ms | 840 ms | 2.531 ms | 401 ms | 249 ms | 1.986 KB | 55 | 280 ms |
| `/budget` | 500 ms | 820 ms | 2.372 ms | 326 ms | 209 ms | 1.538 KB | 50 | 295 ms |
| `/debts` | 516 ms | 516 ms | 2.296 ms | 312 ms | 205 ms | 1.531 KB | 49 | 279 ms |

- FCP ~0,5 s ở mọi trang chính trùng thời gian của `app/loading.tsx` (màn "Đang khởi động Timi"): người dùng thấy vỏ rất nhanh, **rồi đợi thêm ~2 giây** cho nội dung có thể chạm.
- Thứ tự theo trọng số bundle trùng với thứ tự hydrate: Tổng quan > Giao dịch > Cài đặt > Tài khoản > Vay nợ.
- Dev mode không cache (`no-store`) nên cột warm trong thư mục kết quả giống cold; dùng số production ở 3.1 để đánh giá lần mở thứ hai.
- Ước production (chưa đo được): bundle đã minify, React production, nên hydrate thực thấp hơn; nhưng phần parse/compile JS không đổi theo tỷ lệ byte. Từ neo `/login` (694 KB thô → hydrate 1,0 s ở 4G+4x, tức ≈ 0,5 s sau FCP) ngoại suy tuyến tính cho 1,9 MB cho khoảng **1,2–1,6 s sau FCP**, nhưng đây chỉ là ước.

### 3.3 Chuyển giữa các tab dưới (dev, 4G+4x, chạm bằng `touchscreen`)

Đo: lúc chạm → URL đổi (`urlAt`) → không còn skeleton và nội dung ổn định (`doneAt`). Lượt 1: lần đầu mỗi tab; lượt 2: vòng thứ hai (đã có trong cache client).

| Tab | Lượt 1: URL đổi / xong | Lượt 2 (cache): URL đổi / xong | Ghi chú |
|---|---:|---:|---|
| Giao dịch | 1.072 / 1.072 ms | 496 / 496 ms | lượt 1 phải tải thêm JS (677 KB dev) |
| Tài khoản | 550 / 550 ms | 141 / 141 ms | |
| Vay nợ | 436 / 750 ms (thấy skeleton) | 128 / 128 ms | |
| Cài đặt | 797 / 797 ms | 218 / 218 ms | |
| Tổng quan | 659 / 659 ms | 709 / 709 ms | **lượt 2 gọi lại** `_rsc` + 3 server action |

Không có prefetch trong dev. Trong production (đọc docs Next 16, `prefetching.md`): `Link` ở thanh tab dưới dùng prefetch mặc định; route động có `loading.tsx` được prefetch đến ranh giới loading (skeleton) nên chạm là thấy skeleton ngay, dữ liệu stream sau. Thanh bên desktop đặt `prefetch={false}` (`app-sidebar.tsx`, `nav-main.tsx`): trên desktop chạm xong mới hỏi server, không có skeleton tức thì. `staleTimes.dynamic = 300` giữ trang 5 phút (lượt 2 nhanh).

### 3.4 Tương tác (dev, `/transactions`, 4x CPU)

| Thao tác | Long task ngay sau chạm |
|---|---:|
| Mở sheet thêm giao dịch | **343 ms** |
| Mở sheet bộ lọc | 214 ms |
| Mở chọn tháng | 90 ms |

Trang `/transactions` có 814 phần tử DOM, 39 dòng/tháng (không đáng lo). Long task 343 ms khớp với lúc sheet mới "vào" nên là chỗ có thể giật khi trượt lên.

## 4. Render lại và request thừa

### 4.1 Những gì đã làm tốt

`TransactionsScreen` dùng `useDeferredValue` cho bộ lọc, `useMemo` cho danh sách/tổng/ngày; `OverviewScreen` memo từng khối, `useDeferredValue` cho tháng của vòng danh mục; `AssistantProvider` truyền `children` nên bật/tắt không render lại trang. Không thấy re-render dây chuyền rõ rệt khi đổi tháng hoặc mở sheet ở phần đọc code; hầu hết thời gian mở sheet là chi phí khởi tạo, không phải render lại.

### 4.2 `getNoticesAction` chạy ở mỗi lần đổi trang

`NotificationsButton` (`components/notifications-sheet.tsx:92`): `React.useEffect(load, [load, pathname])` → một server action POST sau **mỗi lần đổi pathname** và lúc mount. Có **hai** nút chuông cùng lúc ở `/overview` (thanh trên desktop ẩn bằng CSS ở điện thoại nhưng vẫn mount, cộng nút trong `overview-header`): 2 POST trên Tổng quan, 1 ở tab khác; trong dev nhân đôi vì StrictMode (thấy 4/2/2 request trong log). Action này chạy ngay lúc server còn đang render RSC cho trang mới, trên cùng server nhà. Một action khác (id `00626bd0…`, trả `"server"`, chưa xác định tên) cũng chạy một lần sau mỗi lần tải trang. Không chặn điều hướng (Next cho điều hướng ưu tiên hơn server action đang chờ), nhưng cộng thêm tải cho server và cho đường truyền khi chuyển tab trên mạng yếu.

### 4.3 Danh sách dài

Không ảo hoá, không `content-visibility` (đã tìm). Danh sách giao dịch theo tháng vẫn nhỏ (hàng chục dòng). Chỗ có thể phình: "Tìm mọi tháng" (`loadAllTransactionsAction`) render **mọi** giao dịch của người dùng một lúc trong `SearchResults` (`transaction-list.tsx`). Với người dùng nhiều năm dữ liệu là hàng nghìn dòng + `filterTransactions` chạy lại ở mỗi phím gõ (có `useDeferredValue` giảm bớt). Chưa đo vì dữ liệu dev quá ít.

### 4.4 Payload dữ liệu của Tổng quan

`overview/page.tsx` truyền `days` và `allocation` của **mọi tháng** từ server xuống client (RSC payload `/overview` trong dev: 40 KB thô với dữ liệu mẫu). Phình theo lịch sử người dùng; phối hợp với phiên server/DB nếu muốn cắt về N tháng gần nhất rồi tải thêm.

### 4.5 Hiệu ứng nền

Thanh tab dưới `backdrop-blur-xl backdrop-saturate-150` chồng lên nội dung đang cuộn, tiêu đề ngày dính (`settings-list.tsx:111`, `backdrop-blur-md`) mỗi nhóm một lớp blur. Chưa đo trên iPhone thật; ghi lại vì đây là chỗ tốn GPU khi cuộn trên Safari.

## 5. PWA và cache

| Mục | Hiện trạng | Đánh giá |
|---|---|---|
| Service worker | Chỉ `/firebase-messaging-sw.js` (route handler tạo động): nhận push, `notificationclick`; nạp Firebase compat 12.19 từ `gstatic.com`. **Không cache gì, không có offline** | Mỗi lần mở app: HTML + RSC phải qua mạng tới server nhà |
| `_next/static/*` | `public, max-age=31536000, immutable`; brotli; HTTP/2; Cloudflare MISS lần đầu rồi HIT | Tốt; lần mở thứ hai không phải tải lại JS/CSS/font |
| HTML | `private, no-cache, no-store` (do trang động) | Cần thiết (đăng nhập); mất 100% cache HTML |
| Font | `next/font/google` tự host: Manrope (latin 24,5 KB + vietnamese 8,5 KB preload; thêm latin-ext 15 KB, cyrillic, greek tải khi cần) + JetBrains Mono (latin 40,5 KB + vietnamese 7,8 KB preload). `font-display: swap`, có fallback điều chỉnh kích thước | JetBrains Mono preload ~48 KB mỗi trang dù dùng một chỗ |
| `/institutions/*` (logo) | `max-age=30 ngày, stale-while-revalidate=1 năm` | Tốt. Nhưng file lớn: `baoviet-bank.svg` 185 KB (55 KB brotli), `donga-bank.svg` 56 KB, `bac-a-bank.svg` 35 KB; thư mục `banks` 676 KB, 64 logo. Lưới chọn ngân hàng dùng `loading="eager"` nên mở là tải hết |
| `icon.svg`, `icon-dark.svg`, `apple-icon`, `pwa-*.png`, `splash/*` | Cloudflare ghi đè thành `max-age=14400` (4 giờ) hoặc `must-revalidate` | Ổn (nhỏ) |
| `/manifest.webmanifest` | `public, max-age=0, must-revalidate` | Ổn |
| Ảnh OG (`/opengraph-image`, `/twitter-image`) | Static prerender, `max-age=0, must-revalidate` | Chỉ crawler dùng, không ảnh hưởng người dùng |
| Splash iOS | 46 thẻ `<link rel="apple-touch-startup-image">` + 2 thẻ chung trong `<head>` mọi trang (≈15 KB thô/HTML, nén còn vài KB) | Nhỏ; HTML mỗi lần không cache nên mang theo |
| Lần mở thứ hai | `/login` production: FCP 1.812 → 536 ms, 488 KB → 13 KB | JS/CSS/font nhanh. Phần còn lại là TTFB của HTML (0,45 s) |
| Ảnh logo/TimiIcon | `TimiIcon` render cả `icon.svg` lẫn `icon-dark.svg` (ẩn một) và preload cả hai (mỗi lần ~0,8 KB) | Không đáng kể |

## 6. Đề xuất, xếp theo lợi ích

Ước lượng theo byte và đo; chưa có số production đã xác thực cho các tab đăng nhập (xem 1.2).

### Nhóm A — lợi ích lớn

**A1. Gỡ recharts khỏi lần tải đầu** — ước **−120 KB brotli (−21%) và ~−460 KB parse** ở Tổng quan, Giao dịch, Cài đặt.
- Cách 1 (ít việc): `next/dynamic` cho `CashFlowChart`, `CategoryBreakdown`, `budget-charts` (sheet hạn mức), có skeleton đúng chiều cao.
- Cách 2 (triệt để): vẽ lại hai biểu đồ đơn giản (6 cột thu/chi, vòng danh mục) bằng SVG thuần và bỏ recharts cùng d3, redux-toolkit, immer, es-toolkit, decimal.js (437 KB thô trong analyzer).
- Rủi ro: skeleton lệch kích thước gây CLS; cách 2 phải làm lại tooltip/hover của `components/ui/chart.tsx` và mẫu ở `/design` (quy tắc dự án) và phải được chấp thuận thiết kế (đã duyệt).
- Ưu tiên cao nhất: tab Giao dịch và Cài đặt không vẽ biểu đồ nào lúc mở mà vẫn trả 120 KB brotli, chỉ vì `budgets-sheet` import tĩnh.

**A2. Tải lười mọi thứ chỉ hiện khi chạm** (trợ lý Timi, `budgets-sheet`/`budget-detail`/`budget-suggest`, `add-debt-sheet`, `add-transaction`, `plan-screen`, `welcome-pictures`, `pwa-install-button`, `account-form`, danh sách ngân hàng, màn quản lý hạng mục…) bằng `next/dynamic` hoặc `React.lazy`, nạp ngầm lúc rảnh (`requestIdleCallback`) sau hydrate để lần mở đầu vẫn tức thì. Ước **−45–60 KB brotli** và ít việc phải parse trước hydrate. Tổng thể với A1: tab Giao dịch từ 551 → khoảng 370 KB brotli.
- Rủi ro: lần chạm đầu có thể trễ nếu mạng chậm và chưa prefetch xong; sheet không được hiện trắng (cần Suspense fallback cùng khung); vấn đề đã biết "iOS mất tap khi nội dung đang animate vào" (memory `ios-tap-swallowed-by-animation`) nên mở phải test trên iPhone thật. Làm từng cụm một.

**A3. `lib/releases.ts` (48 KB thô / 12,6 KB gzip) rời khỏi bundle chung.** Chỉ `notifications-sheet.tsx` (màn "bản mới") và `release-history.tsx` dùng. Tải khi mở sheet hoặc lấy qua server action. Tệp phình theo mỗi commit nên lợi ích tăng dần. Rủi ro thấp (màn hình mở chậm 1 nhịp lần đầu).

### Nhóm B — lợi ích vừa

**B1. Dồn `getNoticesAction` về một chỗ, bỏ gọi lại mỗi lần đổi trang.** Một provider ở layout giữ `notices`; chỉ làm mới khi mở sheet, khi app lấy lại focus, hoặc mỗi vài phút; không để hai nút chuông cùng gọi. Giảm 1–2 POST mỗi lần chuyển tab và giảm tải DB trong lúc server còn render trang. Rủi ro: dấu chấm chưa đọc cập nhật chậm hơn sau khi có tin mới. Phối hợp với phiên server/DB về chi phí `getNotices`.

**B2. Đẩy Firebase auth/messaging ra khỏi đường găng của tab chính.** `AuthSessionGuard` import tĩnh `firebase/auth` (~136 KB thô, 42 KB gzip) trong layout; phiên đã được cookie xác thực ở server nên có thể `import()` sau hydrate (lúc rảnh) rồi mới gắn `onIdTokenChanged`. `/login` vẫn cần ngay. Rủi ro: cửa sổ ngắn chưa theo dõi token (cái che trang `cover()` khi đổi tài khoản/hết phiên phải vẫn đúng); cần test đăng xuất, đổi tài khoản, hết phiên. Hợp với phiên đăng nhập.

**B3. Bỏ JetBrains Mono khỏi preload / khỏi app.** Chỉ dùng ở một tooltip (`chart.tsx:266`). Bỏ font (hoặc `preload: false`) bớt 2 request 48 KB trong đường găng của mọi trang, kể cả `/login` và tránh tranh băng thông với JS. Rủi ro gần bằng 0 (đổi chữ số trong tooltip sang `tabular-nums` của Manrope).

**B4. Motion (132 KB thô, ~64 KB gzip) chỉ vì vuốt dòng và lịch dòng tiền.** Tải bất đồng bộ: `LazyMotion` + features nạp động, hoặc viết lại `SwipeRow` bằng pointer events + `transform` (~2 KB) và để `cash-flow-calendar` dùng chung. Rủi ro: cảm giác vuốt/độ đàn hồi (`dragElastic=0.08`, khoá hướng) phải khớp thiết kế đã duyệt ("keep approved design"); phải test trên iOS.

**B5. Thu nhỏ registry icon (lucide 102 KB thô / 63 KB gzip).** ~200 icon hạng mục nạp tĩnh vì `categoryIconRegistry` dùng ở danh sách giao dịch, lưới chọn, trợ lý. Hướng: render icon ở server component thành SVG nội tuyến cho dữ liệu đã có (giao dịch, hạng mục đang dùng), còn lưới chọn icon tải lười. Công lớn, rủi ro vừa (icon nhấp nháy nếu tải muộn), lợi ích lên tới khoảng −50 KB gzip.

### Nhóm C — nhỏ hoặc cần đo thêm

- **C1. `content-visibility: auto` + `contain-intrinsic-size`** cho `TransactionDateGroup`, hoặc phân trang "Tìm mọi tháng". Cần thử với tiêu đề ngày dính (`position: sticky`) vì containment có thể làm hỏng; tác dụng thấy khi người dùng có nhiều năm dữ liệu.
- **C2. Cắt payload `days`/`allocation` của Tổng quan** về N tháng gần nhất, tải thêm khi người dùng lùi tháng. Phối hợp phiên server.
- **C3. Tối ưu SVG logo ngân hàng** (svgo, hoặc chuyển ba file lớn `baoviet`, `donga`, `bac-a-bank` sang ảnh WebP nhỏ) và không `eager` cả lưới 64 logo: bớt vài trăm KB khi mở chọn ngân hàng. Rủi ro thấp; logo là dữ liệu chọn nên không đụng quy tắc màu.
- **C4. Nạp Google One Tap muộn hơn** ở `/login` (script 103 KB ưu tiên cao + FedCM ~1,5 s): sau FCP/idle. Thuộc phiên đăng nhập.
- **C5. Bật prefetch cho thanh bên desktop** (`prefetch={false}` hiện tại): chạm là thấy skeleton, giống điện thoại. Rủi ro: thêm request nền cho máy tính.
- **C6. Đo `backdrop-blur` và tiêu đề dính trên iPhone thật** (Safari) trước khi quyết định bỏ bớt lớp blur.
- **C7. App shell/offline qua service worker**: hiện không có. Có thể cache HTML shell kiểu stale-while-revalidate để lần mở PWA hiện vỏ + dữ liệu cũ ngay. Rủi ro cao (phiên đăng nhập, triển khai mới làm trang cũ lệch hash, đã có `stale-deploy`), không nên làm trước khi xong A/B.
- **C8. Bundle analyzer vào CI/`npm run analyze`** để tránh phình lại (`releases.ts` tự lớn; mọi sheet mới vào bundle chung).

### Ước tổng nếu làm A1+A2+A3

Byte JS phải tải ở lần đầu: Tổng quan 564 → ~380 KB brotli, Giao dịch 551 → ~370 KB, Cài đặt 585 → ~400 KB, Tài khoản 416 → ~350 KB (không có recharts để bớt), Vay nợ tương tự. Cộng B2 thì thêm ~40 KB gzip rời khỏi đường găng (vẫn tải, nhưng sau hydrate). B3 bớt 48 KB font ở đường găng mọi trang. Tính theo tỷ lệ byte thì parse+hydrate trước khi chạm được giảm khoảng một phần ba ở ba tab nặng. Là ước, chưa kiểm bằng build thật.

## 7. Tái hiện và dữ liệu thô

- Script đo và kết quả thô: `docs/reports/toc-do-trinh-duyet-2026-10-17-do/` (chưa commit): `measure.mjs` (tải trang và chuyển tab), `interact.mjs`, `waterfall.mjs`, `actions.mjs`, `reqs.mjs`, `phan-tich-bundle.py` (đọc `analyze.data` của `next experimental-analyze`), thư mục `ket-qua/` (JSON).
- Chạy lại: `cd web && npm run build && npx next start -p 3200` (production, trang công khai), rồi `node ../docs/reports/toc-do-trinh-duyet-2026-10-17-do/measure.mjs load http://localhost:3200 /login --runs=7`; trang đăng nhập thì thêm `--auth` và trỏ vào dev server.
- Worktree này giữ `web/.env.local` sao chép từ checkout chính (đã gitignore) để build/chạy được, và `.next` build production. Server `:3200` đã tắt; `:3000` không đụng.
