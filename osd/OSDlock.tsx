import { App, Astal, Gdk, Gtk } from "astal/gtk3"
import { timeout } from "astal/time"
import Variable from "astal/variable"
import LockKeys from "./lockkeys"

type IndicatorProps = {
    visible: Variable<boolean>;
};

function Indicator( {visible}: IndicatorProps) {
    const lockKeys = LockKeys.get_default()

    const icon = Variable("")
    const status = Variable("")

    let count = 0
    function show(s: string, i: string) {
        visible.set(true)
        status.set(s)
        icon.set(i)
        count++
        timeout(2000, () => {
            count--
            if (count === 0) visible.set(false)
        })
    }

    return (
        <revealer
            setup={(self) => {

                self.hook(lockKeys, "notify::capslock", () => {
                    print('lock')
                        if (lockKeys.capslockOn)
                            show("CapsLock ON", "󰌎")
                        else    
                            show("CapsLock OFF", "󰌎")
                    }
                )

            }}
            revealChild={visible()}
            transitionType={Gtk.RevealerTransitionType.SLIDE_UP}
        >
            <box 
                className="OSD"
                vertical
                widthRequest={200}
                heightRequest={200}
                spacing={1}
                marginBottom={0}
            >
                <label className="indicator" label={icon()} css="font-family: 'Font Awesome 6 Free', sans-serif; font-size: 123px;"/>
                <label label={status()} css="font-size: 18px;"/>
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
            anchor={Astal.WindowAnchor.BOTTOM | Astal.WindowAnchor.RIGHT}
        >
            <eventbox onClick={() => visible.set(false)}>
                <Indicator visible={visible} />
            </eventbox>
        </window>
    )
}