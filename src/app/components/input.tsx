import type { ComponentProps } from "preact"
import { cn } from "../helpers"

type Props = Omit<ComponentProps<"input">, "class" | "className"> & {
    title?: string
    className?: string
}

export default function Input({ title, className, ...inputProps }: Props) {
    return <div class="flex flex-col gap-2">
        {title &&
            <label class="font-bold text-xs text-text-secondary">{title}</label>
        }
        <input {...inputProps} class={cn(className, "bg-background-secondary p-2 text-sm rounded-lg outline-none border-primary focus:border-2")}  />
    </div>
}