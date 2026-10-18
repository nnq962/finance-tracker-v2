# Sourced by the deploy scripts: `telegram "<html>" [silent]` sends a line to
# the admin's Telegram bot (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID in
# deploy/.env). Nothing happens without them; a failed send never fails the
# script.
telegram() {
  [[ -n "${TELEGRAM_BOT_TOKEN:-}" && -n "${TELEGRAM_CHAT_ID:-}" ]] || return 0
  curl -s -m 10 -o /dev/null "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "parse_mode=HTML" \
    --data-urlencode "disable_web_page_preview=true" \
    --data-urlencode "disable_notification=$([[ "${2:-}" == silent ]] && echo true || echo false)" \
    --data-urlencode "text=$1" || true
}
