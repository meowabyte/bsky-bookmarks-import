import type { ComponentProps } from "preact"
import { cn } from "../helpers"

type Props = Omit<ComponentProps<"input">, "class" | "className"> & {
    title?: string
    className?: string
}

export default function Input({ title, className, ...inputProps }: Props) {
    return <div class="flex flex-col gap-2 w-full">
        {title &&
            <label class="font-bold text-xs sm:text-sm text-text-secondary">{title}</label>
        }
        <input {...inputProps} class={cn(className, "bg-background-secondary p-3 sm:p-2 text-sm sm:text-base rounded-lg outline-none border-transparent border-2 focus:border-primary w-full min-h-[44px]")}  />
    </div>
}
