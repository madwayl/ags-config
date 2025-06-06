import GObject, { register, property } from "astal/gobject"
import { monitorFile, readFileAsync } from "astal/file"
import { exec, execAsync } from "astal/process"


const get = (args: string) => Number(exec(`brightnessctl ${args}`))
const capslock = exec(`bash -c "ls -w1 /sys/class/leds | grep '::capslock$' | head -1"`)

@register({ GTypeName: "LockKeys" })
export default class LockKeys extends GObject.Object {
    static instance: LockKeys
    static get_default() {
        if (!this.instance)
            this.instance = new LockKeys()

        return this.instance
    }

    // Capslock
    #capslockMax = get(`--device ${capslock} max`);
    #capslock = get(`--device ${capslock} get`);
    capslockOn = false

    @property(Number)
    get capslock() { return this.#capslock }

    set capslock(value) {
        if (value < 0 || value > this.#capslockMax) return;

        execAsync(`brightnessctl -d ${capslock} set ${Math.floor(value * 100)}% -q`).then(() => {
            this.#capslock = value
            this.notify("capslock")
        })
    }

    constructor() {
        super()
        
        monitorFile(`/sys/class/leds/${capslock}/brightness`, async f => {
            const v = await readFileAsync(f)
            this.#capslock = Number(v)
            print(this.#capslock) // <== this doesn't get printed 
            this.capslockOn = this.#capslock == 1
            this.notify("capslock")
        })

    }
}
