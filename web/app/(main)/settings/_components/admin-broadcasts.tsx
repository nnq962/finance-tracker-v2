"use client"

import * as React from "react"
import { MegaphoneIcon, PencilLineIcon, SendIcon, SmartphoneIcon } from "lucide-react"
import { toast } from "sonner"

import { ActionSheet } from "@/components/app/action-sheet"
import { FormSection } from "@/components/app/form-section"
import { PageSheet, PageSheetFooter, usePageSheetScreen } from "@/components/app/page-sheet"
import { PushBanner } from "@/components/app/push-banner"
import { RequiredMark } from "@/components/forms/required-mark"
import { groupCaptionClassName, SettingsGroup, SettingsRow } from "@/components/settings-list"
import { TimiIcon } from "@/components/timi-icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  createBroadcastAction,
  getBroadcastScreenAction,
  revokeBroadcastAction,
  sendTestBroadcastAction,
} from "@/lib/broadcasts/actions"
import {
  BROADCAST_BODY_MAX,
  BROADCAST_TITLE_MAX,
  broadcastAudienceLabels,
  broadcastAudiences,
  broadcastChannelLabels,
  broadcastDestinations,
  type BroadcastAudience,
  type BroadcastChannel,
  type BroadcastItem,
  type BroadcastOpens,
  type BroadcastScreenData,
} from "@/lib/broadcasts/types"
import { formatShortDate, formatTime, toDateKey } from "@/lib/format-date"
import { cn } from "@/lib/utils"

/** "14/10 · 09:30", in Vietnam time. */
const momentOf = (iso: string) => `${formatShortDate(toDateKey(iso))} · ${formatTime(iso)}`

const destinationLabel = (opens: BroadcastOpens) => broadcastDestinations.find((item) => item.value === opens)?.label ?? ""

/** What the row says on its right: set for later, going out, taken back, or how many read it. */
function rowValue(item: BroadcastItem) {
  if (item.status === "scheduled") return <Badge variant="transfer">Đã hẹn</Badge>
  if (item.status === "sending") return "Đang gửi…"
  if (item.status === "revoked") return "Đã thu hồi"
  return item.channel === "push" ? `${item.devices.sent} máy` : `${item.read}/${item.people} đã đọc`
}

/**
 * The admin's "Tin từ Timi": those set for later, those sent with how they
 * went, each opening its detail on a screen of the sheet, and the sheet to
 * write a new one. `onChange` keeps the settings row's count in step.
 */
export function AdminBroadcasts({
  initial,
  onChange,
}: {
  initial: BroadcastScreenData
  onChange: (data: BroadcastScreenData) => void
}) {
  const [data, setData] = React.useState(initial)
  const [composeOpen, setComposeOpen] = React.useState(false)
  const [detailId, setDetailId] = React.useState<string | null>(null)
  const detail = data.items.find((item) => item.id === detailId)

  const reload = React.useCallback(async () => {
    const result = await getBroadcastScreenAction()
    if (!result.success) {
      toast.error(result.error)
      return
    }
    setData(result.data)
    onChange(result.data)
  }, [onChange])

  // Pushes go out after the page loaded: read how they stand on opening.
  React.useEffect(() => {
    let current = true
    getBroadcastScreenAction().then((result) => {
      if (!current || !result.success) return
      setData(result.data)
      onChange(result.data)
    })
    return () => {
      current = false
    }
  }, [onChange])

  if (detail) {
    return (
      <BroadcastDetail
        item={detail}
        reach={data.reach[detail.audience]}
        onBack={() => setDetailId(null)}
        onRevoked={async () => {
          setDetailId(null)
          await reload()
        }}
      />
    )
  }

  const row = (item: BroadcastItem) => (
    <SettingsRow
      key={item.id}
      icon={MegaphoneIcon}
      tone={item.status === "scheduled" ? "transfer" : "neutral"}
      muted={item.status === "revoked"}
      title={item.title}
      description={`${item.status === "scheduled" ? "Hẹn " : ""}${momentOf(item.sendAt)} · ${broadcastChannelLabels[item.channel]}`}
      value={rowValue(item)}
      onClick={() => setDetailId(item.id)}
    />
  )
  const scheduled = data.items.filter((item) => item.status === "scheduled")
  const sent = data.items.filter((item) => item.status !== "scheduled")

  return (
    <div className="flex flex-1 flex-col">
      <div className="space-y-6 pb-4">
        {scheduled.length > 0 ? <SettingsGroup title="Đã hẹn">{scheduled.map(row)}</SettingsGroup> : null}
        <SettingsGroup title="Đã gửi">
          {sent.length > 0 ? sent.map(row) : <SettingsRow title="Chưa gửi thông báo nào" />}
        </SettingsGroup>
      </div>
      <PageSheetFooter>
        <Button type="button" className="w-full" onClick={() => setComposeOpen(true)}>
          <PencilLineIcon />
          Soạn thông báo
        </Button>
      </PageSheetFooter>

      <PageSheet title="Soạn thông báo" open={composeOpen} onOpenChange={setComposeOpen}>
        <ComposeForm
          reach={data.reach}
          onDone={async () => {
            setComposeOpen(false)
            await reload()
          }}
        />
      </PageSheet>
    </div>
  )
}

function BroadcastDetail({
  item,
  reach,
  onBack,
  onRevoked,
}: {
  item: BroadcastItem
  /** Its audience now, for one still set for later. */
  reach: BroadcastScreenData["reach"][BroadcastAudience]
  onBack: () => void
  onRevoked: () => void
}) {
  usePageSheetScreen({ title: item.status === "scheduled" ? "Đã hẹn gửi" : "Đã gửi", onBack })
  const [confirm, setConfirm] = React.useState(false)
  const scheduled = item.status === "scheduled"
  const pushes = item.channel !== "bell"
  const inBell = item.channel !== "push"
  const people = scheduled ? reach.people : item.people
  const { devices } = item

  return (
    <div className="space-y-6">
      <SettingsGroup title="Nội dung">
        <SettingsRow title={item.title} description={item.body} fullDescription />
        <SettingsRow title="Khi chạm mở" value={destinationLabel(item.opens)} />
      </SettingsGroup>

      <SettingsGroup title={scheduled ? "Sẽ gửi" : "Kết quả"}>
        <SettingsRow title={scheduled ? "Lúc" : "Gửi lúc"} value={momentOf(item.sendAt)} />
        <SettingsRow title="Kênh" value={broadcastChannelLabels[item.channel]} />
        <SettingsRow title="Người nhận" description={broadcastAudienceLabels[item.audience]} value={`${people} người`} />
        {pushes && !scheduled ? (
          <SettingsRow
            title="Thông báo đẩy"
            description={
              devices.pending > 0 && item.status === "sending"
                ? "Đang gửi…"
                : [devices.failed ? `${devices.failed} lỗi` : null, devices.removed ? `${devices.removed} máy đã gỡ` : null]
                    .filter(Boolean)
                    .join(" · ") || "Tới đủ mọi máy"
            }
            value={`${devices.sent}/${devices.total} máy`}
          />
        ) : null}
        {pushes && scheduled ? <SettingsRow title="Thông báo đẩy" value={`${reach.devices} máy`} /> : null}
        {inBell && (item.status === "sent" || item.status === "sending") ? (
          <SettingsRow
            title="Đã đọc"
            value={`${item.read} người · ${item.people ? Math.round((item.read / item.people) * 100) : 0}%`}
          />
        ) : null}
      </SettingsGroup>

      {item.status === "revoked" ? (
        <p className="px-4 text-xs text-muted-foreground">
          Đã thu hồi {item.revokedAt ? momentOf(item.revokedAt) : ""}: tin không còn trong chuông của ai.
        </p>
      ) : (
        <SettingsGroup
          footer={
            scheduled
              ? "Huỷ thì tin không được gửi."
              : inBell
                ? "Thu hồi thì tin biến khỏi chuông của mọi người. Thông báo đẩy đã tới máy thì không gỡ được."
                : "Thông báo đẩy đã tới máy thì không gỡ được."
          }
        >
          <SettingsRow destructive title={scheduled ? "Huỷ hẹn gửi" : "Thu hồi"} onClick={() => setConfirm(true)} />
        </SettingsGroup>
      )}

      <ActionSheet
        open={confirm}
        onOpenChange={setConfirm}
        title={
          scheduled
            ? `Huỷ hẹn gửi “${item.title}”?`
            : `Thu hồi “${item.title}”? Tin biến khỏi chuông của mọi người; thông báo đẩy đã tới máy thì vẫn còn.`
        }
        options={[{ value: "go", label: scheduled ? "Huỷ hẹn gửi" : "Thu hồi", destructive: true }]}
        onSelect={async () => {
          const result = await revokeBroadcastAction(item.id)
          if (!result.success) {
            toast.error(result.error)
            return
          }
          toast.success(result.data === "cancelled" ? "Đã huỷ hẹn gửi" : "Đã thu hồi")
          onRevoked()
        }}
      />
    </div>
  )
}

/** Tomorrow in Vietnam, "YYYY-MM-DD": where a time set for later starts. */
const tomorrowKey = () => toDateKey(new Date(Date.now() + 86_400_000))

function ComposeForm({ reach, onDone }: { reach: BroadcastScreenData["reach"]; onDone: () => void }) {
  const [title, setTitle] = React.useState("")
  const [body, setBody] = React.useState("")
  const [opens, setOpens] = React.useState<BroadcastOpens>("none")
  const [channel, setChannel] = React.useState<BroadcastChannel>("both")
  const [audience, setAudience] = React.useState<BroadcastAudience>("all")
  const [scheduled, setScheduled] = React.useState(false)
  const [date, setDate] = React.useState(tomorrowKey)
  const [time, setTime] = React.useState("08:00")
  const [confirm, setConfirm] = React.useState(false)
  const [testing, setTesting] = React.useState(false)
  const [sending, setSending] = React.useState(false)
  const target = reach[audience]
  const ready = Boolean(title.trim() && body.trim())
  const when = `${time} ${date.slice(8, 10)}/${date.slice(5, 7)}`
  const draft = () => ({
    title,
    body,
    opens,
    channel,
    audience,
    sendAt: scheduled ? new Date(`${date}T${time}:00+07:00`).toISOString() : null,
  })

  const sendTest = async () => {
    setTesting(true)
    const result = await sendTestBroadcastAction(draft())
    setTesting(false)
    if (result.success) toast.success(`Đã gửi thử tới ${result.data} máy của bạn`)
    else toast.error(result.error)
  }

  const send = async () => {
    setSending(true)
    const result = await createBroadcastAction(draft())
    setSending(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success(
      scheduled ? `Đã hẹn gửi lúc ${when}` : channel === "bell" ? "Đã gửi" : "Đang gửi, xem kết quả trong lịch sử",
    )
    onDone()
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="space-y-6 pb-4">
        <FormSection title="Nội dung">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="broadcast-title">
                Tiêu đề <RequiredMark />
              </FieldLabel>
              <Input
                id="broadcast-title"
                value={title}
                maxLength={BROADCAST_TITLE_MAX}
                placeholder="Hạn mức chi tiêu đã có"
                onChange={(event) => setTitle(event.target.value)}
              />
              <FieldDescription>
                {title.length}/{BROADCAST_TITLE_MAX}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="broadcast-body">
                Nội dung <RequiredMark />
              </FieldLabel>
              <Textarea
                id="broadcast-body"
                value={body}
                maxLength={BROADCAST_BODY_MAX}
                rows={3}
                placeholder="Một hai câu, người dùng đọc ngay trên màn khoá."
                onChange={(event) => setBody(event.target.value)}
              />
              <FieldDescription>
                {body.length}/{BROADCAST_BODY_MAX}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="broadcast-opens">Khi chạm mở</FieldLabel>
              <Select value={opens} onValueChange={(value) => setOpens(value as BroadcastOpens)}>
                <SelectTrigger id="broadcast-opens" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {broadcastDestinations.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </FormSection>

        <section className="space-y-2">
          <h2 className={cn("px-4", groupCaptionClassName)}>Xem trước</h2>
          <div className="space-y-3">
            {channel !== "bell" ? <PushBanner title={title} body={body} /> : null}
            {channel !== "push" ? (
              <SettingsGroup>
                {/* As the bell shows it, unread. */}
                <SettingsRow
                  media={<TimiIcon size={36} className="size-9" />}
                  title={title || "Tiêu đề"}
                  description={body || "Nội dung thông báo"}
                  fullDescription
                  unread
                  value="Vừa xong"
                  chevron={opens !== "none"}
                  onClick={() => undefined}
                />
              </SettingsGroup>
            ) : null}
          </div>
        </section>

        <FormSection title="Gửi">
          <FieldGroup>
            <Field>
              <FieldLabel>Kênh</FieldLabel>
              <Tabs value={channel} onValueChange={(value) => setChannel(value as BroadcastChannel)}>
                <TabsList className="w-full">
                  <TabsTrigger value="both">Cả hai</TabsTrigger>
                  <TabsTrigger value="bell">Chuông</TabsTrigger>
                  <TabsTrigger value="push">Đẩy</TabsTrigger>
                </TabsList>
              </Tabs>
              <FieldDescription>
                {channel === "both"
                  ? "Hiện trong chuông và đẩy tới máy."
                  : channel === "bell"
                    ? "Chỉ hiện trong chuông, không làm máy rung."
                    : "Chỉ đẩy tới máy, không lưu trong chuông."}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="broadcast-audience">Người nhận</FieldLabel>
              <Select value={audience} onValueChange={(value) => setAudience(value as BroadcastAudience)}>
                <SelectTrigger id="broadcast-audience" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {broadcastAudiences.map((key) => (
                      <SelectItem key={key} value={key}>
                        {broadcastAudienceLabels[key]} · {reach[key].people}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                {target.people} người
                {channel !== "bell" ? ` · ${target.devices} máy nhận thông báo đẩy` : ""}
                {channel !== "bell" && target.optedOut ? ` (${target.optedOut} người đã tắt Tin từ Timi)` : ""}
              </FieldDescription>
            </Field>
          </FieldGroup>
        </FormSection>

        <div className="space-y-2">
          <SettingsGroup>
            <SettingsRow
              title="Hẹn giờ gửi"
              action={<Switch aria-label="Hẹn giờ gửi" checked={scheduled} onCheckedChange={setScheduled} />}
            />
          </SettingsGroup>
          {scheduled ? (
            <FormSection>
              <div className="flex gap-3">
                <Field>
                  <FieldLabel htmlFor="broadcast-date">Ngày</FieldLabel>
                  <Input
                    id="broadcast-date"
                    type="date"
                    min={toDateKey(new Date())}
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                </Field>
                <Field className="max-w-32">
                  <FieldLabel htmlFor="broadcast-time">Giờ</FieldLabel>
                  <Input id="broadcast-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
                </Field>
              </div>
            </FormSection>
          ) : null}
        </div>
      </div>

      <PageSheetFooter>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" disabled={!ready || testing} onClick={() => void sendTest()}>
            {testing ? <Spinner /> : <SmartphoneIcon />}
            Gửi thử
          </Button>
          <Button type="button" className="flex-1" disabled={!ready || sending || (scheduled && !(date && time))} onClick={() => setConfirm(true)}>
            {sending ? <Spinner /> : <SendIcon />}
            {scheduled ? `Hẹn gửi ${when}` : `Gửi tới ${target.people} người`}
          </Button>
        </div>
      </PageSheetFooter>

      <ActionSheet
        open={confirm}
        onOpenChange={setConfirm}
        title={`${scheduled ? `Hẹn ${when} gửi` : "Gửi"} “${title.trim()}” tới ${target.people} người${
          channel === "bell"
            ? ", trong chuông của họ?"
            : `? Đẩy tới ${target.devices} máy${target.optedOut ? `, trừ ${target.optedOut} người đã tắt Tin từ Timi` : ""}. Thông báo đẩy đã tới máy thì không thu hồi được.`
        }`}
        options={[{ value: "send", label: scheduled ? `Hẹn gửi ${when}` : `Gửi tới ${target.people} người` }]}
        onSelect={() => void send()}
      />
    </div>
  )
}
