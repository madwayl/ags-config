import GObject, { register, property } from "astal/gobject"
import GLib from "gi://GLib";
import { monitorFile, readFileAsync } from "astal/file"
import { exec, execAsync } from "astal/process"

const output = exec("ddcutil detect").split('\n')

type MyTuple = [number, string];

let screens: MyTuple[]  = []

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
export default class BrightnessDDC extends GObject.Object  {
    static instance: BrightnessDDC
    static get_default() {
        if (!this.instance)
            this.instance = new BrightnessDDC()

        return this.instance
    }

    #ddc = 1
    busName = 10
    model = 'LEN - Lenovo Group Limited'

    @property(Number)
    get ddc() { return this.#ddc }

    set ddc(percent) {
        print(`[BrightnessDDC-SETTER] Attempting to set screen_ddc to: ${percent} for bus: ${this.busName}`);

        execAsync(`ddcutil --sleep-multiplier=0.01 --skip-ddc-checks --bus=${this.busName} setvcp 10 ${percent}`).then(() => {
            this.#ddc = Number(exec(`ddcutil --sleep-multiplier=0.01 --skip-ddc-checks --bus=${this.busName} getvcp 10 | grep -oP 'current value =\s*\K\d+`)) / 100
            this.notify("ddc")
        })

    }

    constructor( busName: number = 10, model: string  = "LEN - Lenovo Group Limited") {
        super()
        this.busName = busName
        this.model = model

        const runtimeDir = GLib.getenv("XDG_RUNTIME_DIR")
        
        // print(`${runtimeDir}/brightness/${busName}`)
        
        monitorFile(`${runtimeDir}/brightness/${busName}`, async f => {
            const v = await readFileAsync(f)
            this.#ddc = Number(v) / 100
            // print(this.#ddc);
            this.notify("ddc")
        })
    }
}

export const mappedScreen = screens.map(busNum => new BrightnessDDC(busNum[0], busNum[1]))