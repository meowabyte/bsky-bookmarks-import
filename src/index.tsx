import '@fontsource-variable/inter';
import "./app/global.css"

import { hydrate } from "preact"
import App from "./app/page"

hydrate(<App />, document.body)