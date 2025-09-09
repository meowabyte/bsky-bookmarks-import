import type { BunPlugin } from "bun";

import { readFile } from "fs/promises";
import { minify } from "@minify-html/node"


export default {
    name: "Minify HTML",
    target: "browser",
    setup: function (build: Bun.PluginBuilder): void | Promise<void> {
        if (!build.config.minify) return;

        build.onLoad(
            { filter: /\.html$/ },
            async ({ path }) => ({
                loader: "html",
                contents: minify(
                    await readFile(path),
                    {}
                )
            })
        )
    },
} satisfies BunPlugin