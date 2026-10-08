"use client"

import * as React from "react"
import {
  BellRingIcon,
  CalendarDaysIcon,
  InfoIcon,
  PencilIcon,
  TagIcon,
  UtensilsCrossedIcon,
  WalletCardsIcon,
} from "lucide-react"
import { toast } from "sonner"

import { FormSection } from "@/components/app/form-section"
import { IconTile } from "@/components/app/icon-tile"
import { Money } from "@/components/app/money"
import { NoticeBanner } from "@/components/app/notice-banner"
import { PageSheet } from "@/components/app/page-sheet"
import { SettingsGroup, SettingsRow, settingsSeparatorClassName } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

type TitleStyle = "bar" | "large"
type Surface = "plain" | "grouped"

const history = ["05/10", "04/10", "03/10", "02/10", "01/10", "30/09", "29/09", "28/09"]

/**
 * One PageSheet with every part a sheet in the app uses, to review its
 * header and title before the app's sheets move to it. The sheet's own
 * options (a title in the bar or a large one in the content, the button on
 * the right, white or grey, a footer button) switch from inside it, so each
 * change shows on the sheet at once. The list at the end is long enough to
 * scroll, so the content can be seen fading under the bar.
 */
export function PageSheetPlayground() {
  const [titleStyle, setTitleStyle] = React.useState<TitleStyle>("bar")
  const [surface, setSurface] = React.useState<Surface>("grouped")
  const [withAction, setWithAction] = React.useState(true)
  const [withFooter, setWithFooter] = React.useState(true)
  const [kind, setKind] = React.useState("expense")
  const [reminder, setReminder] = React.useState(true)

  return (
    <PageSheet
      title="Chi tiết khoản chi"
      hideTitle={titleStyle === "large"}
      surface={surface}
      className="space-y-6"
      trigger={<Button>Mở sheet mẫu</Button>}
      action={
        withAction ? (
          <Button type="button" variant="secondary" size="icon" aria-label="Sửa" onClick={() => toast("Sửa")}>
            <PencilIcon />
          </Button>
        ) : null
      }
      footer={
        withFooter ? (
          <Button className="w-full" onClick={() => toast.success("Đã lưu")}>
            Lưu thay đổi
          </Button>
        ) : null
      }
    >
      {/* With the title hidden from the bar, the content opens with its own, as the plans do. */}
      {titleStyle === "large" ? (
        <header className="flex flex-col items-center gap-2 pt-2 text-center">
          <h2 className="text-[28px] leading-tight font-semibold tracking-tight text-balance">Chi tiết khoản chi</h2>
          <p className="text-base text-muted-foreground">Tiêu đề lớn nằm trong nội dung</p>
        </header>
      ) : null}

      {/* What the sheet is about, first: the icon, the name and the figure. */}
      <div className="flex flex-col items-center py-2 text-center">
        <IconTile icon={UtensilsCrossedIcon} tone="orange" size="lg" />
        <p className="mt-3 text-muted-foreground">Ăn trưa</p>
        <Money amount={-45_000} sign="always" size="xl" />
      </div>

      <SettingsGroup title="Tuỳ chỉnh sheet mẫu">
        <li className={cn("flex min-h-16 items-center justify-between gap-3 px-4 py-3", settingsSeparatorClassName())}>
          <span className="text-sm font-medium">Tiêu đề</span>
          <ToggleGroup
            type="single"
            variant="segmented"
            size="sm"
            value={titleStyle}
            onValueChange={(value) => value && setTitleStyle(value as TitleStyle)}
            aria-label="Kiểu tiêu đề"
          >
            <ToggleGroupItem value="bar">Trên thanh</ToggleGroupItem>
            <ToggleGroupItem value="large">Lớn</ToggleGroupItem>
          </ToggleGroup>
        </li>
        <li className={cn("flex min-h-16 items-center justify-between gap-3 px-4 py-3", settingsSeparatorClassName())}>
          <span className="text-sm font-medium">Nền</span>
          <ToggleGroup
            type="single"
            variant="segmented"
            size="sm"
            value={surface}
            onValueChange={(value) => value && setSurface(value as Surface)}
            aria-label="Nền sheet"
          >
            <ToggleGroupItem value="grouped">Xám</ToggleGroupItem>
            <ToggleGroupItem value="plain">Trắng</ToggleGroupItem>
          </ToggleGroup>
        </li>
        <SettingsRow
          title="Nút bên phải thanh"
          action={<Switch checked={withAction} onCheckedChange={setWithAction} aria-label="Nút bên phải thanh" />}
        />
        <SettingsRow
          title="Nút ở chân sheet"
          action={<Switch checked={withFooter} onCheckedChange={setWithFooter} aria-label="Nút ở chân sheet" />}
        />
      </SettingsGroup>

      <NoticeBanner tone="info" icon={InfoIcon} title="Thông báo trong sheet">
        Khối NoticeBanner, nền nhạt theo tone.
      </NoticeBanner>

      {/* A form, as in the add and edit sheets: a segmented control, then the fields on one card. */}
      <ToggleGroup
        type="single"
        variant="segmented"
        value={kind}
        onValueChange={(value) => value && setKind(value)}
        aria-label="Loại"
        className="w-full"
      >
        <ToggleGroupItem value="expense">Chi tiêu</ToggleGroupItem>
        <ToggleGroupItem value="income">Thu nhập</ToggleGroupItem>
        <ToggleGroupItem value="transfer">Chuyển khoản</ToggleGroupItem>
      </ToggleGroup>
      <FormSection title="Thông tin" description="Ghi chú hiện ở dòng giao dịch và trong tìm kiếm.">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="ds-sheet-name">Tên</FieldLabel>
            <Input id="ds-sheet-name" defaultValue="Ăn trưa" />
          </Field>
          <Field>
            <FieldLabel htmlFor="ds-sheet-note">Ghi chú</FieldLabel>
            <Textarea id="ds-sheet-note" defaultValue="Cơm văn phòng cùng team" />
          </Field>
        </FieldGroup>
      </FormSection>

      {/* Rows that open something or switch something, as in the detail sheets. */}
      <SettingsGroup title="Chi tiết">
        <SettingsRow icon={WalletCardsIcon} tone="blue" title="Tài khoản" value="Ví MoMo" onClick={() => toast("Chọn tài khoản")} />
        <SettingsRow icon={TagIcon} tone="orange" title="Hạng mục" value="Ăn uống" onClick={() => toast("Chọn hạng mục")} />
        <SettingsRow icon={CalendarDaysIcon} tone="cyan" title="Thời gian" value="06/10 · 12:04" chevron={false} />
        <SettingsRow
          icon={BellRingIcon}
          tone="amber"
          title="Nhắc lại hằng tháng"
          action={<Switch checked={reminder} onCheckedChange={setReminder} aria-label="Nhắc lại hằng tháng" />}
        />
      </SettingsGroup>

      {/* Long enough to scroll, so the rows show how they fade into the bar. */}
      <SettingsGroup title={`Lịch sử · ${history.length}`}>
        {history.map((day) => (
          <SettingsRow
            key={day}
            icon={UtensilsCrossedIcon}
            tone="orange"
            title="Ăn trưa"
            description={day}
            value={<Money amount={-45_000} sign="always" size="sm" />}
            chevron={false}
          />
        ))}
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow title="Xoá khoản chi" destructive onClick={() => toast("Xoá")} />
      </SettingsGroup>
    </PageSheet>
  )
}
