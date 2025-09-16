import { LucideMessageSquareWarning } from "lucide-preact"
import type { ReactNode } from "react-dom/src"

type Props = {
    children: ReactNode
}

export default function Warning({ children }: Props) {
    return <div class="flex flex-row gap-2 sm:gap-3 bg-background-secondary p-3 sm:p-5 rounded-lg">
        <LucideMessageSquareWarning color="rgb(223, 188, 0)" class="place-self-start flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 mt-0.5" />
        <div class="text-sm sm:text-base">{children}</div>
    </div>
}
