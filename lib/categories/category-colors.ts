export const categoryColorOptions = [
  {
    name: "emerald",
    label: "Xanh ngọc",
    dotClassName: "bg-emerald-500",
    iconClassName: "text-emerald-600 dark:text-emerald-400",
    surfaceClassName:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    selectedClassName: "bg-emerald-500 text-white",
  },
  {
    name: "orange",
    label: "Cam",
    dotClassName: "bg-orange-500",
    iconClassName: "text-orange-600 dark:text-orange-400",
    surfaceClassName:
      "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    selectedClassName: "bg-orange-500 text-white",
  },
  {
    name: "blue",
    label: "Xanh dương",
    dotClassName: "bg-blue-500",
    iconClassName: "text-blue-600 dark:text-blue-400",
    surfaceClassName: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    selectedClassName: "bg-blue-500 text-white",
  },
  {
    name: "violet",
    label: "Tím",
    dotClassName: "bg-violet-500",
    iconClassName: "text-violet-600 dark:text-violet-400",
    surfaceClassName:
      "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    selectedClassName: "bg-violet-500 text-white",
  },
  {
    name: "rose",
    label: "Đỏ hồng",
    dotClassName: "bg-rose-500",
    iconClassName: "text-rose-600 dark:text-rose-400",
    surfaceClassName: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    selectedClassName: "bg-rose-500 text-white",
  },
  {
    name: "amber",
    label: "Vàng",
    dotClassName: "bg-amber-500",
    iconClassName: "text-amber-600 dark:text-amber-400",
    surfaceClassName:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    selectedClassName: "bg-amber-500 text-white",
  },
  {
    name: "cyan",
    label: "Xanh cyan",
    dotClassName: "bg-cyan-500",
    iconClassName: "text-cyan-600 dark:text-cyan-400",
    surfaceClassName: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    selectedClassName: "bg-cyan-500 text-white",
  },
  {
    name: "pink",
    label: "Hồng",
    dotClassName: "bg-pink-500",
    iconClassName: "text-pink-600 dark:text-pink-400",
    surfaceClassName: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    selectedClassName: "bg-pink-500 text-white",
  },
  {
    name: "lime",
    label: "Xanh lá",
    dotClassName: "bg-lime-500",
    iconClassName: "text-lime-600 dark:text-lime-400",
    surfaceClassName: "bg-lime-500/10 text-lime-600 dark:text-lime-400",
    selectedClassName: "bg-lime-500 text-white",
  },
  {
    name: "slate",
    label: "Xám",
    dotClassName: "bg-slate-500",
    iconClassName: "text-slate-600 dark:text-slate-400",
    surfaceClassName:
      "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    selectedClassName: "bg-slate-500 text-white",
  },
] as const

export type CategoryColorName = (typeof categoryColorOptions)[number]["name"]

export function getCategoryColor(name: CategoryColorName) {
  return categoryColorOptions.find((color) => color.name === name)!
}
