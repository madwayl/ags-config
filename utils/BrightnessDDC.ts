import GLib from "gi://GLib";
import GObject, { register, getter, setter } from "gnim/gobject"
import { monitorFile, readFile, readFileAsync } from "ags/file"
import { exec, execAsync } from "ags/process"

const output = exec("ddcutil detect").split('\n')

type ddcMonitors = [number, string];
let screens: ddcMonitors[]  = []

for (let i = 0; i < output.length; i++) {
    // print('start loop', i, output[i + 1]);

    if (output[i].startsWith("Display")) {
        const bus = output[i + 1]?.split('-')[1];
        const model = output[i + 5]?.split(':')[1].trim()
        screens.push([Number(bus), model]);
        i =  i+9
    }
}

@register({ GTypeName: "BrightnessDDC" })
class BrightnessDDC extends GObject.Object  {
    declare $signals: GObject.Object.SignalSignatures & {
        "notify::ddc": () => void
        "notify::kbd": () => void
    }

    static instance: BrightnessDDC
    static get_default() {
        if (!this.instance)
            this.instance = new BrightnessDDC()

        return this.instance
    }

    #screen = 0
    #busNum = 0
    #model = ''

    @getter(Number)
    get ddc() { return this.#screen }

    @setter(Number)
    set ddc(percent) {
        // print(`[BrightnessDDC-SETTER] Attempting to set screen_ddc to: ${percent} for bus: ${this.busName}`);

        if (percent < 0) percent = 0

        if (percent > 1) percent = 1

        execAsync(`ddcutil --sleep-multiplier=0.01 --skip-ddc-checks --bus=${this.#busNum} setvcp 10 ${percent}`).then(() => {

            // this.#screen = Number(exec(`ddcutil --sleep-multiplier=0.01 --skip-ddc-checks --bus=${this.#busNum} getvcp 10 | grep -oP 'current value =\s*\K\d+`)) / 100

            this.#screen = percent

            this.notify("ddc")
        })

    }

    constructor( busNum: number = 10, model: string  = "LEN - Lenovo Group Limited") {
        super()

        this.#busNum = busNum
        this.#model = model

        const runtimeDir = GLib.getenv("XDG_RUNTIME_DIR")
        
        // print(`${runtimeDir}/brightness/${busName}`)
        
        monitorFile(`${runtimeDir}/brightness/${busNum}`, async f => {
            const v = await readFileAsync(f)
            this.#screen = Number(v) / 100
            this.notify("ddc")
        })
    }
}

export const mappedScreens = screens.map(busNum => new BrightnessDDC(busNum[0], busNum[1]))