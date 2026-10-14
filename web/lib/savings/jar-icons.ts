import {
  BabyIcon,
  BikeIcon,
  CameraIcon,
  CarFrontIcon,
  GamepadIcon,
  GemIcon,
  GiftIcon,
  GraduationCapIcon,
  GuitarIcon,
  HeartPulseIcon,
  HouseIcon,
  LaptopIcon,
  PiggyBankIcon,
  PlaneIcon,
  RefrigeratorIcon,
  ShirtIcon,
  SmartphoneIcon,
  SofaIcon,
  TvIcon,
  WatchIcon,
  type LucideIcon,
} from "lucide-react"

import type { CategoryColorName } from "@/lib/categories/category-colors"

/**
 * What a savings jar is for: its icon, the name it suggests and its colour
 * (a jar has no colour of its own; it follows the icon). The first seven are
 * the creation form's grid, the rest under "Tất cả". Ids are stored, so they
 * only ever gain entries.
 */
export const jarIcons = [
  { id: "bike", label: "Xe máy", icon: BikeIcon, tone: "orange" },
  { id: "phone", label: "Điện thoại", icon: SmartphoneIcon, tone: "blue" },
  { id: "tv", label: "Ti vi", icon: TvIcon, tone: "violet" },
  { id: "laptop", label: "Laptop", icon: LaptopIcon, tone: "slate" },
  { id: "trip", label: "Du lịch", icon: PlaneIcon, tone: "cyan" },
  { id: "home", label: "Nhà", icon: HouseIcon, tone: "emerald" },
  { id: "gift", label: "Quà", icon: GiftIcon, tone: "rose" },
  { id: "camera", label: "Máy ảnh", icon: CameraIcon, tone: "amber" },
  { id: "car", label: "Ô tô", icon: CarFrontIcon, tone: "blue" },
  { id: "fridge", label: "Tủ lạnh", icon: RefrigeratorIcon, tone: "cyan" },
  { id: "sofa", label: "Nội thất", icon: SofaIcon, tone: "amber" },
  { id: "watch", label: "Đồng hồ", icon: WatchIcon, tone: "slate" },
  { id: "game", label: "Máy chơi game", icon: GamepadIcon, tone: "violet" },
  { id: "guitar", label: "Nhạc cụ", icon: GuitarIcon, tone: "orange" },
  { id: "clothes", label: "Quần áo", icon: ShirtIcon, tone: "pink" },
  { id: "ring", label: "Cưới", icon: GemIcon, tone: "pink" },
  { id: "baby", label: "Em bé", icon: BabyIcon, tone: "rose" },
  { id: "study", label: "Học tập", icon: GraduationCapIcon, tone: "emerald" },
  { id: "health", label: "Sức khoẻ", icon: HeartPulseIcon, tone: "rose" },
  { id: "other", label: "Khác", icon: PiggyBankIcon, tone: "lime" },
] as const satisfies readonly { id: string; label: string; icon: LucideIcon; tone: CategoryColorName }[]

export type JarIconId = (typeof jarIcons)[number]["id"]

const byId = new Map<string, (typeof jarIcons)[number]>(jarIcons.map((item) => [item.id, item]))

/** A jar's icon; one no longer known shows as a piggy bank. */
export function getJarIcon(id: string | undefined) {
  return byId.get(id ?? "") ?? byId.get("other")!
}

export function isJarIconId(id: string): id is JarIconId {
  return byId.has(id)
}
