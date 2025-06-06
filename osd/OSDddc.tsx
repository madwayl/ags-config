import { App, Astal, Gdk, Gtk } from "astal/gtk3"
import { timeout } from "astal/time"
import Variable from "astal/variable"
import { mappedScreen } from "./ddcutil"


type OnScreenProgressProps = {
    visible: Variable<boolean>;
};

function OnScreenProgress( {visible}: OnScreenProgressProps) {

    const iconName = Variable("")
    const value = Variable(0)

    let count = 0
    function show(v: any, icon: string) {
        visible.set(true)
        value.set(v)
        iconName.set(icon)
        count++
        timeout(2000, () => {
            count--
            if (count === 0) visible.set(false)
        })
    }

    return (
        <revealer
            setup={(self) => {
                for (const busNum of mappedScreen) {
                    self.hook(busNum, "notify::ddc", () => {
                        show(busNum.ddc,  "display-brightness-symbolic")
                    })
                }

            }}
            revealChild={visible()}
            transitionType={Gtk.RevealerTransitionType.SLIDE_UP}
        >
            <box 
                className="OSD"
                vertical
                widthRequest={200}
                heightRequest={200}
                spacing={10}
            >
                <icon icon={iconName()} />
                <levelbar valign={Gtk.Align.CENTER} value={value()} />
                <label label={value(v => typeof v !== 'number' ? 'muted' : `${Math.floor(v * 100)}%`)} />
            </box>
        </revealer>
    )
}

export default function OSD(monitor: Gdk.Monitor) {
    const visible = Variable(false)

    return (
        <window
            gdkmonitor={monitor}
            className="OSD"
            namespace="osd"
            application={App}
            layer={Astal.Layer.OVERLAY}
            keymode={Astal.Keymode.ON_DEMAND}
            anchor={Astal.WindowAnchor.BOTTOM}
        >
            <eventbox onClick={() => visible.set(false)}>
                <OnScreenProgress visible={visible} />
            </eventbox>
        </window>
    )
}