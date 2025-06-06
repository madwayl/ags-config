import { App } from "astal/gtk3"
import style from "./style.scss"
import OSD from "./osd/OSD"
import OSDddc from "./osd/OSDddc"
import OSDlock from "./osd/OSDlock"

App.start({
    css: style,
    main() {
        App.get_monitors().map(OSD);
        OSDddc(App.get_monitors()[1]);
        App.get_monitors().map(OSDlock);
    },
})
