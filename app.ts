import app from "ags/gtk4/app"
// import style from "./style.scss"

import requestHandler from "./requestHandler"
import { compileScss } from "@common/cssHotReload"

// import Bar from "@widgets/Bar"
import OSD from "@widgets/osd/OSD"
import OSDddc from "@widgets/osd/OSDddc"

app.start({
	css: compileScss(),
	requestHandler,
	main() {
		app.get_monitors().map(OSD)
		app.get_monitors().slice(1).map(OSDddc)
	},
})
