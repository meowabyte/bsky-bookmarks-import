import { Upload } from "lucide-preact";
import type { ComponentProps } from "preact";
import { useRef } from "preact/hooks";

type Props = ComponentProps<"input"> & {
    caption?: string
}
export default function FilePicker({ caption, ...props}: Props) {
    const fileRef = useRef<HTMLInputElement>(null)

    return <>
        <div
            onClick={() => fileRef.current?.click()}
            class="w-full max-w-xs sm:w-[200px] h-[150px] sm:h-[200px] bg-background-secondary text-text-secondary select-none flex flex-col justify-center items-center gap-3 border-primary border-dotted border-4 cursor-pointer mx-auto"
        >
            <Upload size={48} class="sm:w-16 sm:h-16" />
            <span class="text-xs sm:text-sm text-center px-2">{caption ?? "Upload file here..."}</span>
        </div>
        <input {...props} hidden ref={fileRef} type="file" />
    </>
}
