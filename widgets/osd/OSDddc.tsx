import Gtk from "gi://Gtk?version=4.0"
import Gdk from "gi://Gdk?version=4.0"
import { Astal } from "ags/gtk4"
import app from "ags/gtk4/app"
import { timeout } from "ags/time"
import { Accessor, createState } from "gnim"

import { mappedScreens } from "@utils/BrightnessDDC"

export default function OSD(monitor: Gdk.Monitor) {
    const [visible, setVisible] = createState(false)
    const [icon, setIcon] = createState("")
    const [value, setValue] = createState(0)

    let count = 0
    function show(v: any, icon: string) {
        setVisible(true)
        setValue(v)
        setIcon(icon)
        count++
        timeout(2000, () => {
            count--
            if (count === 0) setVisible(false)
        })
    }

    for (const screen of mappedScreens) {
        screen.connect("notify::ddc", () =>
            show(screen.ddc,  "display-brightness-symbolic")
        )
    }

    return (
        <window
            gdkmonitor={monitor}
            class="OSDd"
            namespace="osd"
            application={app}
            layer={Astal.Layer.OVERLAY}
            keymode={Astal.Keymode.ON_DEMAND}
            anchor={Astal.WindowAnchor.BOTTOM}
        >
            <box
                class="OSD"
                orientation={Gtk.Orientation.VERTICAL}
                widthRequest={200}
                heightRequest={200}
                spacing={10}
            >
            <levelbar
                valign={Gtk.Align.CENTER}
                value={value(v => Math.min(v, 1))}
            />
            <image iconName={icon} pixelSize={68}/>
            <label label={value(v => typeof v == 'number' ? `${Math.floor(v * 100)}%` : v)} />
            </box>
        </window>
    )
}