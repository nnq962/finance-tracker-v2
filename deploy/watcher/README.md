# Bot canh gác Timi

Chạy trên một máy khác server nhà (máy `finance-dev`, 2026-10-18), báo vào bot Telegram của admin
(`@timi_ops_bot`). Mỗi phút gọi `/api/health` của Timi qua Cloudflare và nói lỗi ở đâu:

| Phản hồi | Nghĩa |
|---|---|
| 200 `{"status":"ok"}` | Timi chạy bình thường (chậm hơn 3 giây ba lần liền thì báo chậm) |
| 503 `{"status":"database"}` | Database không trả lời |
| 502, 504, 520–524 | Tunnel còn nhưng app web không trả lời |
| 530 / lỗi 1033 | Cloudflare mất server nhà: mất điện, mất mạng, hoặc cloudflared dừng |
| Không gọi được | Kiểm tra mạng của chính máy này trước, để không báo nhầm |

Trang lỗi của Cloudflare (530, 502…) hai phút liền thì báo. Không có phản hồi nào (không gọi được tới Cloudflare, quá 15 giây) thì phút đó thử lại thêm hai lần, cách 5 giây, và ba phút liền như vậy mới báo (2026-10-18: đường mạng của máy canh gác tới Cloudflare hay mất gói vào buổi tối, trong khi Timi vẫn chạy). Lỗi kéo dài thì nhắc mỗi 30 phút, chạy lại thì báo đã lỗi bao lâu. Lúc
`SUMMARY_AT` (mặc định 21:00) gọi `/api/ops/summary` để Timi gửi tóm tắt ngày. Trong chat: `/status`,
`/summary`, `/help`. Chỉ trả lời chat của admin (`TELEGRAM_CHAT_ID`).

Cài:

```bash
cp .env.example .env   # điền token, chat id, OPS_SECRET (giống deploy/.env của server nhà)
docker compose up -d --build
docker compose logs -f
```

Các tin khác (người dùng mới, mua Pro, deploy, backup, lỗi server) do chính Timi gửi
(`web/lib/ops`, `deploy/scripts/notify.sh`).
