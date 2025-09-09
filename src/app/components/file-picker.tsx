import { Upload } from "lucide-preact";
import type { ComponentProps } from "preact";
import { useRef } from "preact/hooks";

type Props = ComponentProps<"input"> & {
    width: number,
    height: number,
    caption?: string
}
export default function FilePicker({ width, height, caption, ...props}: Props) {
    const fileRef = useRef<HTMLInputElement>(null)

    return <>
        <div
            onClick={() => fileRef.current?.click()}
            style={{ "--height": `${height}px`, "--width": `${width}px` }}
            class="w-[var(--width)] h-[var(--height)] bg-background-secondary text-text-secondary select-none flex flex-col justify-center items-center gap-3 border-primary border-dotted border-4 cursor-pointer"
        >
            <Upload size={Math.round(Math.min(height, width) / 3)} />
            <span>{caption ?? "Upload file here..."}</span>
        </div>
        <input {...props} hidden ref={fileRef} type="file" />
    </>
}