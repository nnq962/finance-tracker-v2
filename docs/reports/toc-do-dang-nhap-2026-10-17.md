# Tốc độ đăng nhập Timi (2026-10-17)

Phạm vi: đường đăng nhập từ trang `/login` tới khi vào `/overview`. Chỉ đọc và đo, không sửa code, không đụng dữ liệu production, không đổi cấu hình.

Máy đo: chính server nhà (VN). Tới Cloudflare ping ổn định 55 ms (HKG/SIN). Chrome (Playwright, channel chrome) và curl chạy trên máy này, nên số "production" là số đo từ máy này qua Cloudflare, không phải từ điện thoại của người dùng.

## 1. Kết luận ngắn

1. **Chậm là thật, nhưng chủ yếu không nằm ở code.** Origin trả `/login` trong khoảng 6 ms. Qua Cloudflare thì khoảng 40% yêu cầu mới mất 1,1–7 giây tới byte đầu, kể cả file tĩnh `robots.txt` do edge Cloudflare tự trả (không đi qua tunnel hay Next). Tức là độ trễ nằm ở đoạn client ↔ edge Cloudflare (bắt tay TLS), không phải ở app.
2. **Phần thuộc về app, theo mức ảnh hưởng:**
   - Bấm nút Google phải đợi Firebase dựng iframe (gapi, `/__/auth/iframe`, `iframe.js`, `getProjectConfig`) rồi mới mở popup. Các file `/__/auth/*` đi vòng qua rewrite của Next và tunnel, có lần mất 10–18 giây.
   - Mỗi lần mở app (tải trang cứng) trình duyệt lại gọi `POST /api/auth/session`, là cú gọi nặng nhất của đường đăng nhập.
   - Mỗi request đã đăng nhập đợi thêm một vòng gọi mạng sang Google để kiểm tra phiên bị thu hồi chưa (khoảng 0,3 s).
   - `POST /api/auth/session` chạy tuần tự các bước có thể chạy song song.
3. **Không phải nguyên nhân:** Google One Tap (không chặn render), font và script trên `/login`, kiểm tra cookie trong `proxy.ts`, truy vấn DB.

## 2. Luồng đăng nhập và waterfall

### 2.1 Mở `/login` (chưa đăng nhập)

| Bước | Làm gì | Mạng | Chặn render? |
|---|---|---|---|
| `proxy.ts` | Đổi host cũ `finance.nnqlab.dev`; trang cần đăng nhập mà thiếu cookie `__session` thì 307 về `/login?next=...` | không | không (chỉ kiểm cookie) |
| `app/login/page.tsx` | `getSessionUser()`: không có cookie thì trả null ngay; có cookie thì kiểm tra Firebase (xem 2.3) | không (khi chưa đăng nhập) | không |
| HTML | Trang động (`cache-control: no-store`), 80 KB thô, nén br | tunnel | có, nhưng chỉ tốn 1 vòng tới origin |
| Trình duyệt | 4 font woff2 preload (80 KB), 2 CSS (36 KB), 14 chunk JS (khoảng 214 KB đã nén, có Firebase Auth) | Cloudflare | JS `defer`, không chặn paint |
| `GoogleOneTap` | `<Script afterInteractive>` tải `accounts.google.com/gsi/client` (khoảng 277 KB), `onReady` đợi `firebaseAuth.authStateReady()` rồi `prompt()` (FedCM) | Google | không |

Đo bằng Chrome: bật hay chặn Google, FCP desktop đều 280–370 ms khi mạng tốt (xem mục 3.3). One Tap không làm chậm lần tải đầu.

### 2.2 Bấm "Tiếp tục với Google" (`login-form.tsx` → `signInWithPopup`)

Tuần tự, thứ tự thời gian:

1. `_initialize` của popup resolver (`index-4NFEPWkC.js`: `AbstractPopupRedirectOperation.execute`): tải `apis.google.com/js/api.js` + `gapi_iframes`, nhúng iframe `https://timi.nnqlab.dev/__/auth/iframe`, tải `iframe.js` (95 KB gzip), gọi `getProjectConfig`. **Popup chỉ mở sau khi xong.**
   - Trên điện thoại hoặc Safari, Firebase làm việc này ngay lúc trang tải (`_shouldInitProactively`). Đo bằng Pixel 7: iframe xong ở 3,5 s, `getProjectConfig` ở 4,3 s, trên mọi trang có `firebaseAuth` (cả `/overview`, vì `AuthSessionGuard` import nó).
   - Trên desktop, việc này xảy ra ngay sau cú bấm đầu tiên.
   - `authDomain` build vào bundle production là `timi.nnqlab.dev`, nên `/__/auth/*` đi qua rewrite trong `next.config.ts` tới `finance-tracker-6329d.firebaseapp.com`, qua tunnel và Next. So với truy cập thẳng Firebase (ổn định 0,18 s): iframe 0,46–1,07 s, handler 0,52–1,44 s, `iframe.js` 0,2–1,5 s, một lần ttfb 10 s và tổng 18 s.
2. Popup mở `/__/auth/handler` (+ `handler.js` 91 KB), cùng đường rewrite. Người dùng chọn tài khoản Google (thời gian người).
3. Firebase client: `accounts:signInWithIdp` rồi `accounts:lookup` (hai cú gọi tuần tự tới `identitytoolkit`, mỗi cú khoảng 0,3 s).
4. `syncServerSession`: `getIdToken()` (cache) rồi `POST /api/auth/session`.
5. `window.location.replace(redirectTo)`: tải cứng `/overview` (2.3).

### 2.3 `POST /api/auth/session` (route.ts) — các bước tuần tự

1. `verifyIdToken(idToken, true)`: ký xác minh cục bộ + **1 vòng `accounts:lookup`** (kiểm thu hồi), khoảng 0,3 s.
2. Nếu đã có cookie phiên: `verifySessionCookie(cookie, true)` — **thêm 1 vòng `accounts:lookup` nữa**, khoảng 0,3 s.
3. `initializeUserWorkspace` → `ensureDefaultCategories`: transaction DB (insert users + select for update + ...), vài ms trên DB cục bộ.
4. `createSessionCookie`: gọi Google, khoảng 0,3–0,5 s (ước lượng).
5. `openPushSession`: transaction DB thứ hai, vài ms.
6. Cộng một vòng tunnel (0,3 s ở mức tốt, tới 1,3 s ở mức xấu).

Tổng ước lượng (chưa đo trực tiếp, xem mục 6): **1,2–1,8 s** server + tunnel trong điều kiện mạng tốt. Các bước 1, 2, 3, 4, 5 độc lập với nhau về dữ liệu, ngoại trừ bước 4 cần token đã xác minh.

### 2.4 Tải `/overview` sau đăng nhập (và mọi request về sau)

- `proxy.ts`: có cookie thì cho qua.
- `app/(main)/layout.tsx`: `await requireSession()` → `getSessionUser()` → `getVerifiedSession()` (xác minh chữ ký cục bộ, khóa công khai Google đã cache) rồi **đợi `notRevoked`** = `verifySessionCookie(cookie, true)` → `accounts:lookup` tới Google, khoảng **0,27–0,4 s**. Sau đó mới `needsOnboarding(uid)` (DB). Hai việc này tuần tự.
- Trang (`loadWithSession`) đã song song hóa kiểm thu hồi với việc đọc dữ liệu, nên không cộng thêm. Nhưng layout chặn dòng stream đầu tiên nên **TTFB mọi trang đã đăng nhập ≥ 1 vòng lookup (~0,3 s)**. Mỗi `requireSession()` trong Server Action và route handler cũng trả thêm đúng khoảng này.
- Không có cache nào cho kết quả kiểm thu hồi: `React.cache` chỉ dedupe trong cùng request.
- **Trình duyệt:** `AuthSessionGuard` đăng ký `onIdTokenChanged`; callback chạy ngay khi khởi động với user hiện tại và **gọi lại `syncServerSession` → `POST /api/auth/session` ở mọi lần tải cứng** (cùng 2 lookup + `createSessionCookie` + 2 transaction DB như 2.3), kèm `syncAccountPushDevice`. Chạy nền, không chặn render, nhưng tranh băng thông và tunnel với chính lần tải đó. Hiệu ứng phụ: cookie phiên được gia hạn mỗi lần mở app (phiên "trượt" 5 ngày).

Ngoài ra: `GET /api/auth/session` (dùng khi trang khôi phục từ bfcache hoặc ẩn quá 60 s) cũng đợi cùng một vòng lookup trong khi trang bị che bằng màn hình loading.

## 3. Số đo

### 3.1 Origin (container `finance-web-1`, `http://127.0.0.1:3010`)

```
curl -s -o /dev/null -w "ttfb=%{time_starttransfer}\n" http://127.0.0.1:3010/login   # 30 lần
```

- `/login`: ttfb 3,8–8,8 ms (trung vị khoảng 4,9 ms); `/`: 2,4–3 ms; `/overview` chưa đăng nhập (307): 0,6–1,2 ms.
- Chrome vào `http://127.0.0.1:3010/login`: ttfb 7–8 ms, FCP khoảng 50 ms, load 58–70 ms.
- `/__/auth/iframe.js` qua rewrite cục bộ (chưa tính tunnel): 58–60 ms ttfb (so với 180 ms thẳng Firebase).

→ Origin và code render không phải điểm nghẽn.

### 3.2 Production qua Cloudflare (`https://timi.nnqlab.dev`)

```
curl -s -o /dev/null -w "dns=%{time_namelookup} conn=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\n" https://timi.nnqlab.dev/login
for i in $(seq 30); do curl -s -o /dev/null -w "%{time_starttransfer}\n" https://timi.nnqlab.dev/login; sleep 0.3; done | sort -n
for i in $(seq 30); do curl -s -o /dev/null -w "%{time_starttransfer}\n" https://timi.nnqlab.dev/robots.txt; sleep 0.3; done | sort -n
```

| Yêu cầu (kết nối mới, 30 lần) | ≤ 0,42 s | 1,07–1,54 s | ≥ 2,6 s |
|---|---|---|---|
| `/login` (động, qua tunnel) | 17 | 10 | 3 (2,78 / 2,80 / 5,91 s) |
| `/robots.txt` (edge Cloudflare cache, **không qua tunnel**) | 17 (gồm 1 lần kết nối lỗi) | 8 | 5 (tới 7,6 s) |

Hai phân phối giống hệt nhau. File tĩnh không đi qua tunnel cũng chậm y vậy, nên độ trễ nằm ở đoạn máy này ↔ edge Cloudflare, không phải tunnel, Next hay DB.

Phân tích thêm (curl `-4`, 25 lần, in `dns conn tls ttfb remote_ip`):

| IP Cloudflare | conn | tls xong | ttfb |
|---|---|---|---|
| `104.21.44.164` | 0,02 s | 0,07 s | 0,22 s |
| `172.67.201.92` | 0,06–0,22 s | 0,23–1,52 s | 0,37–6,96 s |

Ngoài ra IPv6 từ máy này không dùng được: `curl -6 https://timi.nnqlab.dev/robots.txt` thất bại cả 25 lần (conn=0), trong khi DNS vẫn trả địa chỉ AAAA. Trình duyệt phải thử IPv6 rồi lùi về IPv4 (Happy Eyeballs), có thể là một phần của các đợt chậm khoảng 1 s; chưa xác minh riêng điều này. Ghi chú: kiểm tra xem điện thoại người dùng có đang ở mạng có IPv6 hỏng không.

Hai IP anycast cùng domain bị ISP định tuyến khác nhau; IP `172.67.201.92` chậm hơn nhiều và cho kết quả thất thường. Header `cf-ray` cho thấy edge nhảy giữa HKG, SIN, NRT và một lần DEN (Denver):

```
for i in $(seq 14); do curl -s -m 15 -o /dev/null -D - -w "T %{time_starttransfer} %{remote_ip}\n" https://timi.nnqlab.dev/robots.txt | awk '/^cf-ray/{r=$2} /^T /{print $2,$3,r}'; done
```

- Yêu cầu tới `.../dev` mới (kết nối mới): 0,3–0,4 s là sàn (DNS + TCP + TLS + 1 RTT). Kết nối tái dùng: `/robots.txt` (edge cache) 0,13–0,15 s; `/login` động 0,44–0,62 s → chặng edge → tunnel → origin → ngược lại tốn thêm khoảng 0,3–0,45 s mỗi yêu cầu động.
- `GET /api/auth/session` (401, gần như không làm gì): ttfb 0,31–1,33 s trong 5 lần đo. Hoàn toàn là mạng.
- `/overview` chưa đăng nhập: 307 trong 0,30–1,45 s rồi mới tới `/login` (xem mục 4, đề xuất 7).
- Landing `/`: 236 KB thô (24 KB khi nén), ttfb 1,06–1,34 s lúc đo, thấp hơn lần sau (0,42 s với `--compressed`). Header `s-maxage=31536000` nhưng Cloudflare báo `DYNAMIC` (HTML không được Cloudflare cache mặc định).
- Khóa công khai Google và `accounts:lookup` từ server (curl, kết nối mới): `googleapis.com/robot/v1/metadata/x509/securetoken@...` 0,08–0,09 s; `identitytoolkit.googleapis.com/v1/projects/.../accounts:lookup` 0,27–0,29 s ttfb (trả 403 vì không có credential, thật chạy chỉ nặng hơn). Token OAuth endpoint 0,10–0,12 s. **→ mỗi vòng kiểm thu hồi ≥ 0,27 s.**
- Firebase `/__/auth/*` qua first-party rewrite so với trực tiếp:

| Đường dẫn | qua `timi.nnqlab.dev` | thẳng `firebaseapp.com` |
|---|---|---|
| `/__/auth/iframe` | 0,46 / 0,96 / 1,07 s | 0,18–0,57 s |
| `/__/auth/handler` | 0,52 / 0,82 / 1,44 s | 0,18–0,59 s |
| `/__/auth/iframe.js` (gzip 95 KB) | 0,2 / 0,56 / **10,0 s (tổng 18 s)** | 0,17–0,18 s |
| `/__/auth/handler.js` (gzip 91 KB) | 0,19 / 1,34 / 1,48 s | 0,18–0,19 s |

`iframe.js` trả `cf-cache-status: MISS` (có `max-age=14400` nên về sau Cloudflare có thể giữ); còn `/__/auth/iframe` và `/__/auth/handler` (không có phần mở rộng) là `DYNAMIC`, luôn đi tunnel.

### 3.3 Chrome (Playwright), `https://timi.nnqlab.dev/login`, ngữ cảnh mới mỗi lần (cache lạnh), 3 lần

Script: `node loginperf.mjs https://timi.nnqlab.dev <nhãn> <mobile 1|0> <onetap 1|0>` (trong thư mục scratchpad, dùng `playwright-core` có sẵn).

| Kịch bản | ttfb | FCP | load |
|---|---|---|---|
| Điện thoại 390 px, One Tap bật | 689–998 ms | 1268–1796 ms | 1673–2225 ms |
| Desktop, One Tap bật | 924 / 169 / 252 ms | 1044 / 280 / 368 ms | 1471 / 716 / 810 ms |
| Desktop, **chặn** Google | 242 / 188 / 166 ms | 376 / 304 / 276 ms | 795 / 685 / 660 ms |
| Origin cục bộ (không Cloudflare) | 7–8 ms | khoảng 50 ms | 58–70 ms |

- One Tap bật hay tắt cho FCP như nhau (280–370 ms khi mạng tốt); chênh nhau trong 1 lần đo là do mạng (lần đầu 924 ms ttfb).
- Waterfall `/login` trên điện thoại (lần cuối): tất cả tài nguyên bắt đầu ở khoảng 700 ms (sau khi có HTML) và xong ở 1,0–1,5 s; `gsi/client` và `gsi/style` chỉ là preload `link`, không chặn.
- Không có yêu cầu nào tới `identitytoolkit`/`securetoken` trên `/login` khi chưa đăng nhập, ngoài `getProjectConfig` do gapi iframe (mục 2.2).

Yêu cầu mạng thêm trên điện thoại (Pixel 7 emulation) ngay khi tải `/login`, theo mốc thời gian:

```
 740 ms  apis.google.com/js/api.js           (gapi, Firebase khởi tạo sớm)
 778 ms  apis.google.com/.../gapi_iframes
 802 ms  accounts.google.com/gsi/client
 923 ms  google.com/.well-known/web-identity (FedCM)
1210 ms  accounts.google.com/gsi/fedcm.json
1618 ms  accounts.google.com/gsi/fedcm/listaccounts
2283 ms  timi.nnqlab.dev/__/auth/iframe       (qua rewrite + tunnel)
3480 ms  timi.nnqlab.dev/__/auth/iframe.js
4340 ms  www.googleapis.com/.../getProjectConfig
```

Desktop không có chuỗi gapi/iframe này lúc tải trang (chỉ FedCM của One Tap), chỉ có sau cú bấm đầu tiên.

### 3.4 Dev server `http://localhost:3000`

```
curl -c cj.txt "http://localhost:3000/api/dev/login?next=/overview"
curl -b cj.txt -w ... http://localhost:3000/overview   # nhiều lần
```

| Đường | ttfb | tổng |
|---|---|---|
| `/api/auth/session` (cookie dev) | 5–7 ms | 5–7 ms |
| `/overview` | 41–53 ms | 99–126 ms |
| `/transactions` | 35–56 ms | 76–96 ms |
| `/budget`, `/debts` | 27–39 ms | 51–64 ms |
| `/login` | 17–21 ms | 20–25 ms |
| `/overview` không cookie (307) | 1,5–2,9 ms | |

Cookie dev (`dev-session`) **bỏ qua hoàn toàn Firebase** (`getVerifiedSession` trả user giả, `notRevoked = Promise.resolve(true)`), nên dev không đo được chi phí kiểm thu hồi thật. Kết quả này chỉ chứng tỏ phần còn lại của đường request (cookie, DB, render) rất nhẹ; chi phí 0,27–0,4 s của kiểm thu hồi chỉ có ở production, ước tính bằng đo tới endpoint Google ở mục 3.2.

### 3.5 Log

- `docker logs finance-web-1 --since 24h`: 9 dòng, chỉ có khởi động Next và một lỗi `Failed to find Server Action ...` (client cũ sau deploy). Server không ghi thời gian request, nên không có số đo từ log.
- `docker logs finance-cloudflared-1 --since 24h`: một lần `accept stream listener error ... timeout: no recent network activity` lúc 11:45:58Z rồi tự nối lại sau khoảng 2 s tới `sin08/12/15/19` (QUIC). Không có lỗi khác trong 24 giờ. Không phải nguyên nhân thường xuyên.

## 4. Nguyên nhân chậm theo mức ảnh hưởng

| # | Nguyên nhân | Ảnh hưởng | Nằm ở |
|---|---|---|---|
| 1 | Đường client/ISP ↔ edge Cloudflare thất thường: 40% yêu cầu mới ≥ 1,1 s, đuôi tới 7 s; một IP anycast chậm hơn rõ; edge nhảy HKG/SIN/NRT/DEN | Lớn nhất, ảnh hưởng mọi yêu cầu (đăng nhập có ≥ 10 yêu cầu tuần tự) | Hạ tầng/ISP, ngoài code |
| 2 | Firebase phải dựng iframe (gapi + `/__/auth/iframe` + `iframe.js` + `getProjectConfig`) trước khi popup mở; `/__/auth/*` đi vòng rewrite + tunnel, đuôi tới 10–18 s; trên điện thoại làm việc này ở **mọi trang** | 1,5–4 s (tới hàng chục giây khi xui) trước popup; tải thêm khoảng 0,3 MB; chạy cả khi không cần đăng nhập | Code + cấu hình |
| 3 | Kiểm thu hồi phiên bằng 1 vòng `accounts:lookup` ở **mọi** request đã đăng nhập, không cache; layout chặn stream vì nó | +0,27–0,4 s TTFB mỗi trang, Server Action, route API | Code |
| 4 | `POST /api/auth/session` tuần tự (2 lookup + `createSessionCookie` + 2 transaction), và **chạy lại ở mọi lần mở app** qua `onIdTokenChanged` | Đăng nhập: khoảng 1,2–1,8 s; mở app: cú gọi nặng nền, tranh tài nguyên với lần tải | Code |
| 5 | Chuỗi redirect: PWA `start_url=/overview` chưa đăng nhập → 307 → `/login` (2 vòng tunnel) | +0,3–1,4 s lúc đo | Code/cấu hình |
| 6 | One Tap thêm khoảng 277 KB + FedCM trên `/login` và `/` | Không chặn render (đo: FCP như nhau), nhưng thêm yêu cầu | Code |

Không phải nguyên nhân: font (`display: swap`, preload 80 KB, không chặn paint), script `/login` (JS đều async/defer), tính toán trong `proxy.ts`, truy vấn DB (vài ms).

## 5. Đề xuất

Mức lợi ích là ước lượng từ số đo ở trên; rủi ro tính theo khả năng hỏng đăng nhập hoặc bảo mật.

| # | Đề xuất | Lợi ích ước lượng | Rủi ro |
|---|---|---|---|
| A | **`POST /api/auth/session` chạy song song và gọn hơn.** Bỏ vòng `verifySessionCookie(current, true)` (dùng `false`: cùng uid đã được `verifyIdToken(..., true)` xác nhận, việc thu hồi áp dụng cho cả hai); khi đang làm mới phiên hiện tại thì bỏ `initializeUserWorkspace`; chạy `ensureDefaultCategories`, `createSessionCookie`, `openPushSession` bằng `Promise.all` | −0,3 s (một lookup) tới −0,5 s trên đăng nhập; làm mới phiên nhẹ hơn nhiều | Thấp. Cần giữ thứ tự: tạo cookie chỉ khi workspace khởi tạo thành công (nếu lỗi workspace vẫn phải trả 503 và không set cookie) |
| B | **Chỉ đồng bộ phiên khi cần**, đừng gọi `POST /api/auth/session` ở mỗi lần tải cứng. Ví dụ: bỏ qua lần callback đầu khi `user.uid === initialUid` và trước đó đã đồng bộ trong N giờ (lưu mốc giờ ở `localStorage`), hoặc cho `GET /api/auth/session` trả hạn cookie rồi chỉ làm mới khi còn dưới 2 ngày | Bỏ 2 lookup + 1 `createSessionCookie` + 2 transaction mỗi lần mở app; ít tranh chấp mạng lúc app khởi động | Trung bình. Hiện cookie "trượt" 5 ngày nhờ cú gọi này; đổi thì phải giữ ý định đó (làm mới theo ngưỡng). Cần thử các trường hợp đổi tài khoản, đăng xuất, token hết hạn |
| C | **Cache kiểm thu hồi theo phiên**, ví dụ Map trong bộ nhớ tiến trình, khóa là băm của cookie, TTL 30–60 s. Đồng thời trong layout dùng `loadWithSession`/chạy `needsOnboarding(uid)` song song với kiểm thu hồi | −0,27–0,4 s TTFB cho mọi trang sau lần đầu trong cửa sổ TTL; ít gọi Google hơn (cũng giảm rủi ro khi Google chậm) | Trung bình về bảo mật: phiên bị thu hồi vẫn dùng được tối đa TTL giây. Với app tài chính cá nhân, 30–60 s thường chấp nhận được nhưng đây là quyết định của chủ sản phẩm. Container chạy một tiến trình nên cache bộ nhớ đủ dùng |
| D | **Tách Firebase popup khỏi mọi trang**: trong `lib/firebase/client.ts` dùng `initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] })` không kèm `popupRedirectResolver`; chỉ truyền `browserPopupRedirectResolver` ở `signInWithPopup` trên `/login`. Trên `/login` có thể khởi tạo trước (`prewarm`) khi mount, để lúc bấm popup mở ngay | Mọi trang trên điện thoại hết gapi/iframe/`getProjectConfig` (3 yêu cầu + khoảng 0,1 MB + CPU); `/login` không còn 1,5–4 s trước popup nếu làm prewarm | Thấp–trung bình: cần thử trên iOS Safari, PWA standalone, Android Chrome; `getRedirectResult` không dùng nên không mất gì |
| E | **Bỏ popup Firebase, dùng thẳng Google Identity Services** (`renderButton` hoặc token client) rồi `signInWithCredential` — code One Tap đã làm đúng cách này | Bỏ toàn bộ đường iframe/handler (`/__/auth/*`, gapi): −1,5–4 s trước popup, −0,3 MB; popup của Google nhẹ hơn; hết phụ thuộc rewrite + tunnel cho đăng nhập | Trung bình–cao: phải viết lại nút, thử kỹ iOS PWA (popup, FedCM, ITP), giữ nguyên thiết kế đã duyệt của nút (CLAUDE.md: hỏi trước khi đổi) |
| F | **Cache `/__/auth/*` ở Cloudflare** (Cache Rule: Edge TTL 4 giờ cho đường dẫn `/__/auth/*`, kể cả `iframe` và `handler` không có đuôi file) | Không cần đổi code; sau lần đầu, các file này không còn đi tunnel, bớt đuôi 10–18 s; chỉ là cấu hình Cloudflare | Thấp, nhưng phải đảm bảo không cache `/__/auth/handler` có tham số (khóa theo query string); xem lại nếu Firebase đổi file |
| G | Đổi `authDomain` về `finance-tracker-6329d.firebaseapp.com` (không rewrite) | `/__/auth/*` ổn định 0,18 s, bỏ cả đường tunnel | Cao: bắt đầu mất tính "first-party", Safari/Chrome có thể chặn lưu trữ bên thứ ba cho iframe, popup có thể lỗi `web-storage-unsupported`; chỉ nên làm nếu D–F không đủ. Không khuyến nghị |
| H | Tránh 307 thừa cho PWA chưa đăng nhập: có thể để `start_url` trỏ `/login` khi chưa có cookie, hoặc chấp nhận (người dùng đã đăng nhập đi thẳng `/overview`) | −1 vòng (0,3–1,4 s) với người chưa đăng nhập | Thấp, lợi ích hẹp |
| I | Giảm One Tap: đổi `strategy="afterInteractive"` thành `lazyOnload` hoặc chỉ nạp sau lần tương tác đầu; cân nhắc bỏ One Tap trên `/` | −277 KB và 3 yêu cầu lúc tải; không đổi FCP đo được | Thấp, nhưng giảm tỉ lệ đăng nhập một chạm nếu nạp muộn |
| J | **Đường tới Cloudflare (nguyên nhân 1):** thử lại đo từ điện thoại người dùng và từ nhà mạng khác; nếu cùng ISP, hỏi nhà mạng về định tuyến tới `172.67.0.0/16`, hoặc cân nhắc Cloudflare Argo Smart Routing (có phí) | Có thể bỏ phần lớn đuôi 1–7 s, lớn hơn tất cả đề xuất trên cộng lại | Không đụng code; phụ thuộc bên ngoài, tốn tiền nếu dùng Argo |

Thứ tự gợi ý: **F** (cấu hình, ít rủi ro) → **A** → **D** → **C** (sau khi chủ sản phẩm đồng ý đổi đánh đổi bảo mật) → **B** → **E** nếu vẫn chậm → còn lại tùy chọn. Trong lúc đó nên **J** song song vì nó ảnh hưởng nhiều nhất.

## 6. Giới hạn của lần đo

- Chưa đo được: thời gian thật của `verifySessionCookie(..., true)`, `verifyIdToken(..., true)`, `createSessionCookie` trong tiến trình production. Cần cookie phiên thật hoặc chạy thử bằng tài khoản dịch vụ (đụng dữ liệu production); các con số 0,27–0,5 s là ước lượng từ đo thẳng tới `identitytoolkit.googleapis.com` bằng curl (403 vì không có credential), nên giá trị thật có thể cao hơn một chút.
- Không đăng nhập được bằng Google thật từ script, nên không có waterfall đo trực tiếp từ lúc bấm tới lúc vào `/overview`; mục 2.2–2.3 là ghép từ đo từng chặng và đọc code.
- Số "production" đo từ máy chủ nhà (cùng ISP với tunnel). Điện thoại ở mạng khác có thể không gặp đuôi 1–7 s ở mục 3.2; đáng đo lại từ điện thoại (ví dụ Safari/Chrome Remote Debugging hoặc bật Cloudflare Web Analytics, `beacon.min.js` đã được nạp sẵn).
- Dev server dùng cookie dev nên bỏ qua Firebase hoàn toàn (mục 3.4).
