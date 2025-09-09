import { build as bunBuild, Glob, serve, type BuildArtifact, type Server } from "bun"
import { dirname, join } from "path"

import { renderToStringAsync } from "preact-render-to-string"
import { h } from "preact"
import { writeFile } from "fs/promises"
import { rm } from "fs/promises"
import minifyHtml from "./plugins/minifyHtml"
import { watch as watchFs } from "fs"
import tailwindPlugin from "bun-plugin-tailwind"

const ROOT_PATH = join(import.meta.dir, "..")
const ENTRYPOINT_PATH = join(ROOT_PATH, "src", "index.html")
const OUT_PATH = join(ROOT_PATH, "out")

const IS_DEV = typeof process.env.DEV === "string" || process.argv.includes("--dev"),
    IS_PROD = !IS_DEV

const reloadDevServer = (() => {
    let devServer: Server;

    return () => {
        const serveFunc = devServer
            ? devServer.reload.bind(devServer)
            : serve
        
        const files = new Glob("**/*").scanSync({
            cwd: OUT_PATH,
            onlyFiles: true
        })

        devServer = serveFunc({
            routes: Array.from(files)
                .reduce<Record<string, Response>>((o, f) => {
                    const p = join(OUT_PATH, f),
                        pathname = `/${f}`

                    o[pathname] = new Response(Bun.file(p))
                    if (pathname.endsWith("/index.html"))
                        o[dirname(pathname)] = new Response(Bun.file(p))

                    return o
                }, {}),

            development: IS_DEV
        })

        return devServer
    }
})()

const prerender = async (entry: BuildArtifact) => {
    console.time("Prerendering page")

    const appPath = "../src/app/page",
        App = await (async () => {
            // Remove app cache
            const entryDir = dirname(ENTRYPOINT_PATH)
            Object.entries(require.cache).forEach(([k, f]) => {
                if (!f?.path || !f.path.startsWith(entryDir)) return;
                delete require.cache[k]
            })

            return import(appPath)
                .then(m => m.default)
        })()
        
    const [ text, prerenderedBody ] = await Promise.all([
        entry.text(),
        renderToStringAsync(h(App, {}))
    ])

    await writeFile(
        entry.path,
        text.replace(
            /(<body[^>]*>)([^<]*<\/body>)?/ms,
            (_, s, e) => `${s}${prerenderedBody}${e ?? ""}`
        )
    )

    console.timeEnd("Prerendering page")
}

const build = async () => {
    console.time("Building")
    
    await rm(OUT_PATH, { force: true, recursive: true })
    const result = await bunBuild({
        entrypoints: [ ENTRYPOINT_PATH ],
        outdir: OUT_PATH,
        target: "browser",
        
        plugins: [
            minifyHtml,
            tailwindPlugin
        ],

        sourcemap: IS_DEV ? "linked" : "none",
        minify: IS_PROD,
        drop: IS_DEV ? [] : [
            "console.log",
            "console.info",
            "console.warn"
        ]
    })

    console.timeEnd("Building")
    
    const entry = result.outputs.find(
        ({ path, kind }) =>
            path.endsWith(".html") && kind === "entry-point"
    )

    if (entry) await prerender(entry)
    else console.warn("No entrypoint html found! Not prerendering")

    console.log("Done!")
}


const watch = () => {
    let debounced = false

    const changeDetected = async (
        o:
        | { firstRun: true }
        | { firstRun: false, fileChanged: string | null }
    ) => {
        if (debounced) return;
        debounced = true;

        if (!o.firstRun) {
            console.clear()
            console.log(`Detected change!${o.fileChanged ? ` (${o.fileChanged})` : ""} Rebuilding...`)
        }

        await build()
        
        const { url } = reloadDevServer()
        console.log(`Serving at ${url}`)

        setTimeout(() => { debounced = false }, 300)
        console.log("Waiting for changes...")
    }

    changeDetected({ firstRun: true })
    watchFs(
        dirname(ENTRYPOINT_PATH),
        { recursive: true },
        (_, f) => changeDetected({
            firstRun: false,
            fileChanged: f
        })
    )
}

if (IS_DEV) watch()
else build()