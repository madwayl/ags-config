import { App, Astal, Gdk, Gtk } from "astal/gtk3"
import { timeout } from "astal/time"
import Variable from "astal/variable"
import Brightness from "./backlight"
import BrightnessDDC, { mappedScreen } from "./ddcutil"
import Battery from "gi://AstalBattery"
import Device from "gi://AstalBattery"
import Wp from "gi://AstalWp"

type OnScreenProgressProps = {
    visible: Variable<boolean>;
    monitorType: Variable<string | null>;
};

function OnScreenProgress( {visible, monitorType}: OnScreenProgressProps) {
    const brightness = Brightness.get_default()
    const brightnessDDC = BrightnessDDC.get_default()
    const speaker = Wp.get_default()!.get_default_speaker()
    // const microphone = Wp.get_default()!.get_default_microphone()
    const battery = Battery.get_default()

    // for (let key in battery) {
    // try {
    //     print(`${key}: ${battery[key]}`);
    // } catch (e) {
    //     print(`${key}: [Error reading property]`);
    //     }
    // }

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
        // print('showing', v, typeof v, icon, visible)
    }


    // function logAllSignals(obj: any) {
    // // Get the list of signals available on the object's GType
    // const signals = obj.list_signal_ids
    //     ? obj.list_signal_ids().map(id => obj.signal_name(id))
    //     : []

    // // Fallback: if list_signal_ids() isn't available, try common signals manually
    // if (signals.length === 0) {
    //     console.log("No signals found via list_signal_ids(), hooking common notify signals");
    //     obj.connect("notify", (obj, pspec) => {
    //     console.log(`notify::${pspec.name} emitted`);
    //     });
    //     return;
    // }

    // for (const signalName of signals) {
    //     obj.connect(signalName, (...args) => {
    //     console.log(`Signal emitted: ${signalName}`, args);
    //     });
    // }
    // }

    // logAllSignals(brightnessDDC); 

    return (
        <revealer
            setup={(self) => {
                self.hook(brightness, "notify::screen", () => {
                        show(brightness.screen, "display-brightness-symbolic")
                        // print(String(monitorType()))
                        if (monitorType().get() != brightness.model)
                            visible.set(false)
                    }
                )

                self.hook(brightness, "notify::capslock", () => {
                        if (brightness.capslockOn)
                            show("CapsLock ON", "go-top-symbolic")
                        else    
                            show("CapsLock OFF", "go-top-symbolic")
                    }
                )

                // self.hook(brightness, "notify::numlock", () => {
                //         show(brightness.numlock, "zoom-original-symbolic")
                //     }
                // )

                // if (brightnessDDC) {
                //     self.hook(brightnessDDC, "notify::ddc", () => {
                //             show(brightnessDDC.ddc, "display-brightness-symbolic")
                //             // print(String(monitorType()))
                //             if (monitorType().get() != brightnessDDC.manufacturer)
                //                 visible.set(false)
                //         }
                //     )
                // }

                // print(mappedScreen)

                // for (const busNum of mappedScreen) {
                //     self.hook(busNum, "notify::ddc", () => {
                //         show(busNum.ddc,  "display-brightness-symbolic")
                //         // visible.set(true)
                //         // value.set(busNum.ddc)
                //         // iconName.set("display-brightness-symbolic")
                //         // print(monitorType().get(), busNum.model)
                //         if (monitorType().get() != busNum.model)
                //             visible.set(false)
                //     })
                // }

                if (speaker) {
                    self.hook(speaker, "notify::volume", () =>
                        show(speaker.volume, speaker.volumeIcon)
                    )

                    self.hook(speaker, "notify::mute", () => {
                        if (speaker.mute)
                            show('muted', "audio-volume-muted-symbolic")
                        else
                            show(speaker.volume, speaker.volumeIcon)
                    })
                }

                if (battery) {
                    self.hook(battery, "notify::percentage", () => {
                        if (battery.battery_level == 3 || battery.battery_level == 5) 
                            show(battery.percentage, battery.batteryIconName)
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
                <label label={value(v => typeof v == 'number' ? `${Math.floor(v * 100)}%` : v)} />
            </box>
        </revealer>
    )
}

export default function OSD(monitor: Gdk.Monitor) {
    const visible = Variable(false)
    const monitorType = Variable(monitor.model)
    
    // for (let key in monitor) {
    // try {
    //     print(`${key}: ${monitor[key]}`);
    // } catch (e) {
    //     print(`${key}: [Error reading property]`);
    //     }
    // }
    // print(monitor)

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
                <OnScreenProgress visible={visible} monitorType={monitorType} />
            </eventbox>
        </window>
    )
}