import { Bookmark } from "lucide-preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { cn } from "./helpers";
import Form from "./components/form";

export default function Page() {
    const teaserRef = useRef<HTMLDivElement>(null)
    const bookmarkRef = useRef<HTMLDivElement>(null)

    const [showHint, setShowHint] = useState(false)
    const [showForm, setShowForm] = useState(false)


    // Disable hint
    useEffect(() => {
        const timeout = setTimeout(() => setShowHint(true), 100)
        const onBodyClick = () => {
            clearTimeout(timeout)
            setShowHint(false)
        }

        document.addEventListener("mousedown", onBodyClick)
        return () => {
            clearTimeout(timeout)
            document.removeEventListener("mousedown", onBodyClick)
        }
    }, [])

    // On click
    useEffect(() => {
        if (!bookmarkRef.current) return;

        const startTransition = () => {
            const transition = bookmarkRef.current!.animate([
                { scale: 1 },
                { scale: 7, opacity: 0 }
            ], {
                duration: 400,
                easing: "ease-out",
                fill: "forwards",
            })

            transition.addEventListener("finish", () => setShowForm(true), { once: true })
        }

        bookmarkRef.current.addEventListener("click", startTransition, { once: true })
        return () => {
            if (!bookmarkRef.current) return;
            bookmarkRef.current.removeEventListener("click", startTransition)
        }
    }, [bookmarkRef.current])


    if (showForm) return <Form />
    return <div ref={teaserRef} class="teaser-container text-center flex flex-col items-center gap-3">
        <div ref={bookmarkRef} class="cursor-pointer self-center"><Bookmark size={64} /></div>
        <span class={cn("text-text-secondary", showHint ? "transition-opacity duration-700" : "opacity-0")}>(click to start importing)</span>
    </div>
}
