import { LucideMessageSquareWarning } from "lucide-preact"
import type { ReactNode } from "react-dom/src"

type Props = {
    children: ReactNode
}

export default function Warning({ children }: Props) {
    return <div class="flex flex-row gap-3 bg-background-secondary p-5">
        <LucideMessageSquareWarning color="rgb(223, 188, 0)" class="place-self-center" />
        <div>{children}</div>
    </div>
}