import Gtk from "gi://Gtk?version=4.0"
import Gdk from "gi://Gdk?version=4.0"
import { Astal } from "ags/gtk4"
import app from "ags/gtk4/app"
import { timeout } from "ags/time"
import { Accessor, createState } from "gnim"
import AstalWp from "gi://AstalWp?version=0.1"
import Brightness from "@utils/Brightness"

export default function OSD(monitor: Gdk.Monitor) {
    const brightness = Brightness.get_default()
    const wp = AstalWp.get_default()!
    const microphone = wp.get_default_microphone()
    const speaker = wp.get_default_speaker()

    const [visible, setVisible] = createState(false)
    const [icon, setIcon] = createState("")
    const [value, setValue] = createState(0)

    let count = 0
    function show(v: number, icon: string) {
        setVisible(true)
        setValue(v)
        setIcon(icon)
        count++
        timeout(2000, () => {
            count--
            if (count === 0) setVisible(false)
        })
    }

    brightness.connect("notify::screen", () =>
        show(brightness.screen, "display-brightness-symbolic")
    )

    speaker.connect("notify::volume", () =>
        show(speaker.volume, speaker.volumeIcon)
    )

    speaker.connect("notify::mute", () => {
        if (speaker.mute)
            show('muted', "audio-volume-muted-symbolic")
        else
            show(speaker.volume, speaker.volumeIcon)
    })

    microphone.connect("notify::volume", () =>
        show(microphone.volume, microphone.volumeIcon)
    )

    microphone.connect("notify::mute", () => {
        if (microphone.mute)
            show('muted', "microphone-sensitivity-muted-symbolic")
        else
            show(microphone.volume, microphone.volumeIcon)
    })

    wp.connect("node-added", () =>
        wp.get_nodes()?.forEach((node) => {
            if (node.name === "Spotify") {
                node.connect("notify::volume", () =>
                    show(node.volume, "spotify")
                )
            }
        })
    )

    return (
        <window
            gdkmonitor={monitor}
            class="OSD"
            namespace="osd"
            visible={visible}
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