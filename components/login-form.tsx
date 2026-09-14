"use client"

import { useState } from "react"
import { cn } from "cn"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
} from "@/components/ui/field"
import {
  getAuthErrorMessage,
  signInWithGoogle,
  syncServerSession,
} from "@/lib/firebase/auth"
import {
  GalleryVerticalEndIcon,
  LoaderCircleIcon,
  ShieldCheckIcon,
} from "lucide-react"

export function LoginForm({
  className,
  redirectTo = "/overview",
  ...props
}: React.ComponentProps<"div"> & { redirectTo?: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    try {
      const credential = await signInWithGoogle()
      await syncServerSession(credential.user)
      toast.success("Đăng nhập thành công.")
      router.replace(redirectTo)
      router.refresh()
    } catch (error) {
      toast.error(getAuthErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center text-white">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEndIcon className="size-6" />
              </div>
              <span className="sr-only">Finance Tracker.</span>
            </a>
            <h1 className="text-xl font-bold">
              Chào mừng đến với Finance Tracker.
            </h1>
          </div>
          <Field className="grid gap-4">
            <Button
              variant="outline"
              type="submit"
              disabled={isLoading}
              className="border-neutral-200 bg-white text-neutral-950 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:border-neutral-400 focus-visible:ring-neutral-400/50 dark:border-neutral-200 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 dark:hover:text-neutral-950"
            >
              {isLoading ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
              )}
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập bằng Google"}
            </Button>
            <FieldDescription className="flex items-center justify-center gap-2 text-center text-white/70">
              <ShieldCheckIcon className="size-4" />
              Đăng nhập an toàn với Google
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
