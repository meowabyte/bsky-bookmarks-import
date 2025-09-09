import { ArrowLeft, ArrowRight, Loader2 } from "lucide-preact"
import { useCallback, useEffect, useMemo, useState } from "preact/hooks"
import Input from "./input"
import { Agent, CredentialSession } from "@atproto/api"
import FilePicker from "./file-picker"
import type { ChangeEvent } from "react-dom/src"
import Warning from "./warning"

type AuthData = {
    username: string,
    password: string
}

type FlowProps = {
    setCanBack: (v: boolean) => void,
    setCanContinue: (v: boolean) => void,
    setAuthData: (v: AuthData) => void,
    authData: AuthData,
    onBack: (force?: boolean) => void,
    onNext: (force?: boolean) => void
}

const session = new CredentialSession(new URL("https://bsky.social"))
const agent = new Agent(session)

function Login({ setCanContinue, setAuthData }: FlowProps) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    useEffect(() => {
        const canContinue =
            username.length > 0 &&
            password.length > 0

        setCanContinue(canContinue)
        if (canContinue)
            setAuthData({ username, password })
    }, [username, password])

    return <div className="flex flex-col gap-8">
        <div class="flex flex-col">
            <h1>First we need to login!</h1>
            <span>Just so we'll be able to import them on right account!</span>
            <Warning><b>Do not worry!</b> Everything is done locally, no one has access to any of data you put here!</Warning>
        </div>
        <div class="flex flex-col gap-4">
            <Input onInput={e => setUsername(e.currentTarget.value)} title="Username" />
            <div class="flex flex-col">
                <Input onInput={e => setPassword(e.currentTarget.value)} type="password" title="App Password" />
                <a target="_blank" href="https://bsky.app/settings/app-passwords" class="text-text-secondary">Create App Password</a>
            </div>
        </div>
    </div>
}

function AuthCheck({ authData, setCanBack, onBack, onNext }: FlowProps) {
    useEffect(() => {
        const tryLogin = async () => {
            await session.login({
                identifier: authData.username,
                password: authData.password
            })
            .then(() => { onNext(true) })
            .catch(() => {
                alert("Could not login! Is login/password valid?")
                onBack(true)
            })
        }

        setCanBack(false)
        tryLogin()
    }, [])

    return <Loader2 size={48} class="animate-spin place-self-center" />
}

function Bookmarks({ setCanBack, setCanContinue }: FlowProps) {
    const [importing, setImporting] = useState(false)

    useEffect(() => {
        setCanBack(false)
        setCanContinue(false)
    }, [])

    const startImport = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.currentTarget.files?.[0]
        if (!file || file.type !== "application/json") {
            alert("Invalid file type! It should be a valid .json file!")
            return
        }

        const posts = await file.text()
            .then(t => JSON.parse(t).posts)
        
        if (!posts || !Array.isArray(posts)) {
            alert("Invalid json file! No posts found!")
            return
        }

        const validPosts: { [k in "cid" | "uri"]: string }[] =
            posts.filter(p => typeof p.cid === "string" && typeof p.uri === "string")

        try {
            setImporting(true)
            for (const p of validPosts) await agent.app.bsky.bookmark.createBookmark(p)
            alert("Done! Thank you for using this tool! <3\nby meowabyte")
            location.href = "https://bsky.app/saved"
        }
        catch(e) {
            setImporting(false)
            alert("Could not import bookmarks! Check console for more info")
            console.error(e)
        }
    }, [])

    return <div class="flex flex-col gap-5 items-center">
        <h2>{importing ? "Importing bookmarks..." : `Welcome, ${session.session?.handle}!`}</h2>
        {importing
            ? <Loader2 size={48} class="animate-spin" />
            : <FilePicker
                width={200} height={200}
                caption="Select backup file"
                accept="application/json"
                onChange={startImport}
            />
        }
    </div>
}

const FORM_FLOW = [Login, AuthCheck, Bookmarks]
export default function Form() {
    const [formState, setFormState] = useState(0)
    const [authData, setAuthData] = useState<AuthData>({
        username: "",
        password: ""
    })

    const [canBack, setCanBack] = useState(false)
    const [canContinue, setCanContinue] = useState(false)
    const allowBack = useMemo(() => canBack && formState > 0, [canBack, formState])
    const allowNext = useMemo(() => canContinue && formState < FORM_FLOW.length - 1, [canContinue, formState])

    const onBack = useCallback((force?: boolean) => {
        if (!allowBack && !force) return;
        setFormState(s => s - 1)
        setCanBack(true)
    }, [allowBack])
    
    const onNext = useCallback((force?: boolean) => {
        if (!allowNext && !force) return;
        setFormState(s => s + 1)
        setCanContinue(false)
    }, [allowNext])

    if (formState > FORM_FLOW.length - 1 || formState < 0) return;
    
    const CurrentFlow = FORM_FLOW[formState]!
    return <div class="fixed inset-1/2 -translate-1/2 w-1/2 h-1/2 flex flex-col gap-5">
        <CurrentFlow
            setCanBack={setCanBack}
            setCanContinue={setCanContinue}
            setAuthData={setAuthData}
            authData={authData}
            onBack={onBack}
            onNext={onNext}
        />
        <div class="flex flex-row gap-2 justify-end">
            <button onClick={() => onBack()} disabled={!allowBack}><ArrowLeft /> Back</button>
            <button onClick={() => onNext()} disabled={!allowNext}>Next <ArrowRight /></button>
        </div>
    </div>
}