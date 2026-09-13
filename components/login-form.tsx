"use client"

import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field"
import { GalleryVerticalEndIcon, ShieldCheckIcon } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form>
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
            <h1 className="text-xl font-bold">Welcome to Finance Tracker.</h1>
          </div>
          <Field className="grid gap-4">
            <Button
              variant="outline"
              type="button"
              className="border-neutral-200 bg-white text-neutral-950 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:border-neutral-400 focus-visible:ring-neutral-400/50 dark:border-neutral-200 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 dark:hover:text-neutral-950"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Login with Google
            </Button>
            <FieldDescription className="flex items-center justify-center gap-2 text-center text-white/70">
              <ShieldCheckIcon className="size-4" />
              Secure sign-in with Google
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
