import { App, Astal, Gdk, Gtk } from "astal/gtk3"
import { timeout } from "astal/time"
import Variable from "astal/variable"

import style from "./style.scss"

App.start({
    instanceName: "OSD",
    gtkTheme: "adw-gtk3-dark",
    css: /* css */`
        window.OSD box.OSD {
            border-radius: 6px;
            background-color: rgba(8, 8, 8, 0.4);
            padding: 13px;
            margin: 13px;
            margin-bottom: 50px;
            min-width: 6rem;
        }

        window.OSD icon {
            font-size: 5rem;
        }

        window.OSD label {
            font-size: 1.1rem;
        }

        window.OSD levelbar trough {
            margin: 1 .6rem;
            min-width: 5rem;
        }

        window.OSD levelbar block {
            padding: 6px;
            border-radius: 4px;
        }`
    ,
    main: (icon: string, value: string) => {
        
        interface OnScreenProgressProps {
            visible: Variable<boolean>;
            value: Variable<number>;           // value between 0 and 1
            icon: Variable<string>;            // dynamic icon name
        }

        function OnScreenProgress({ visible, value, icon }: OnScreenProgressProps)  {
            let count = 0

            return (
                <revealer
                    setup={(self) => {
                            visible.set(true)
                            count++
                            timeout(2000, () => {
                                count--
                                if (count === 0) visible.set(false)
                                    App.quit()
                            })
                        }
                    }
                    revealChild={visible()} // TODO
                    transitionType={Gtk.RevealerTransitionType.SLIDE_UP}
                >
                    <box 
                        className="OSD"
                        vertical
                        widthRequest={200}
                        heightRequest={200}
                        spacing={10}
                    >
                        <icon icon={icon()} />
                        <levelbar valign={Gtk.Align.CENTER} value={value()} />
                        <label label={value(v => `${Math.floor(v * 100)}%`)} />
                    </box>
                </revealer>
            )
            
        }
        
        function OSD(monitor: Gdk.Monitor, value: number, icon: string) {
            const visible = Variable(false)
            const vValue = Variable(value);
            const vIcon = Variable(icon);

            print(vValue())
            
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
                        <OnScreenProgress 
                            visible={visible} 
                            value={vValue}
                            icon={vIcon} />
                    </eventbox>
                </window>
            )
        }

        App.get_monitors().map(monitor => OSD(monitor, Number(value), icon))
    }
})