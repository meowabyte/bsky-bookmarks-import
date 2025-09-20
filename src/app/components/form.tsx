import { ArrowLeft, ArrowRight, Loader2 } from "lucide-preact";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import Input from "./input";
import { Agent, CredentialSession } from "@atproto/api";
import FilePicker from "./file-picker";
import type { ChangeEvent } from "react-dom/src";
import Warning from "./warning";
import { CompositeDidDocumentResolver, CompositeHandleResolver, DohJsonHandleResolver, PlcDidDocumentResolver, WebDidDocumentResolver, WellKnownHandleResolver } from "@atcute/identity-resolver";

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

const handleResolver = new CompositeHandleResolver({
  strategy: 'race',
  methods: {
    'dns': new DohJsonHandleResolver({ dohUrl: 'https://mozilla.cloudflare-dns.com/dns-query' }),
    'http': new WellKnownHandleResolver()
  }
});
const docResolver = new CompositeDidDocumentResolver({
  methods: {
    plc: new PlcDidDocumentResolver(),
    web: new WebDidDocumentResolver()
  }
});
let session: CredentialSession;
let agent: Agent;

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

    return <div className="flex flex-col gap-8 w-full">
        <div class="flex flex-col gap-2">
            <h1>First we need to login!</h1>
            <span class="text-sm sm:text-base">Just so we'll be able to import them on right account!</span>
            <Warning><b>Do not worry!</b> Everything is done locally, no one has access to any data you put here!</Warning>
        </div>
        <div class="flex flex-col gap-4 w-full">
            <Input onInput={e => setUsername(e.currentTarget.value)} title="Username" />
            <div class="flex flex-col gap-1">
                <Input onInput={e => setPassword(e.currentTarget.value)} type="password" title="App Password" />
                <a target="_blank" href="https://bsky.app/settings/app-passwords" class="text-text-secondary text-sm">Create App Password</a>
            </div>
        </div>
    </div>
}

function AuthCheck({ authData, setCanBack, onBack, onNext }: FlowProps) {
    useEffect(() => {
        const tryLogin = async () => {
            if (!authData.username || !authData.password) {
                alert("Username or password is empty!");
                onBack(true);
                return;
            }
            const did = await handleResolver.resolve(authData.username as `${string}.${string}`);
            if (!did) {
              alert("Could not resolve your handle! Is it correct?");
              onBack(true);
              return;
            }
            const data = await docResolver.resolve(did);
            if (!data.service) {
              alert("Your DID document looks invalid.");
            }
            let endpoint: string | undefined;
            for (const service of data.service ?? []) {
              if (service.type === "AtprotoPersonalDataServer") {
                if (typeof service.serviceEndpoint === "string") {
                  endpoint = service.serviceEndpoint;
                  break;
                }
              }
            }
            if (!endpoint) {
              alert("Could not find Personal Data Server in your DID document.");
              onBack(true);
              return;
            }
            session = new CredentialSession(new URL(endpoint));
            agent = new Agent(session);
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
    const [imported, setImported] = useState(0)
    const [total, setTotal] = useState(0)

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
                .toSorted((a, b) =>
                    new Date(a.indexed_at).getTime() - new Date(b.indexed_at).getTime()
                )
        if (validPosts.length === 0) {
          alert("No valid posts found in the file!");
          return;
        }
        setTotal(validPosts.length)
        setImported(0)

        try {
            setImporting(true)
            const proxiedAgent = agent.withProxy("bsky_appview", "did:web:api.bsky.app")
            for (const p of validPosts) {
              setImported(v => v + 1)
              if (!p.uri.includes("app.bsky.feed.post")) {
                console.warn("Skipping non-post bookmark", p)
                continue
              }
              await proxiedAgent.app.bsky.bookmark.createBookmark({
                cid: p.cid, uri: p.uri
              })
            }
            alert("Done! Thank you for using this tool! <3\nby meowabyte")
            location.href = "https://bsky.app/saved"
        }
        catch(e) {
            setImporting(false)
            alert("Could not import bookmarks! Check console for more info")
            console.error(e)
        }
    }, [])

    return <div class="flex flex-col gap-5 items-center w-full">
      <h2 class="text-center break-words">{importing ? `Importing bookmarks... ${imported}/${total} (${Math.round(100 * imported/total)}%)` : `Welcome, ${session.session?.handle}!`}</h2>
        {importing
            ? <Loader2 size={48} class="animate-spin" />
            : <>
              <FilePicker
                caption="Select backup file"
                accept="application/json"
                onChange={startImport}
                />
              <div class="text-center text-sm sm:text-base">If you don't have a backup file, you can create one <a target="_blank" href="https://bookmarks.bluecanary.dev/export/">here</a>.</div>
            </>
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
    return <div class="form-container">
        <CurrentFlow
            setCanBack={setCanBack}
            setCanContinue={setCanContinue}
            setAuthData={setAuthData}
            authData={authData}
            onBack={onBack}
            onNext={onNext}
        />
        <div class="flex flex-row gap-2 justify-end flex-wrap">
            <button onClick={() => onBack()} disabled={!allowBack}><ArrowLeft /> Back</button>
            <button onClick={() => onNext()} disabled={!allowNext}>Next <ArrowRight /></button>
        </div>
    </div>
}
