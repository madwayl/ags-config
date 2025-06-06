var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);

// ../../../../usr/share/astal/gjs/gtk3/index.ts
import Astal7 from "gi://Astal?version=3.0";
import Gtk4 from "gi://Gtk?version=3.0";
import Gdk from "gi://Gdk?version=3.0";

// ../../../../usr/share/astal/gjs/variable.ts
import Astal3 from "gi://AstalIO";

// ../../../../usr/share/astal/gjs/binding.ts
var snakeify = (str) => str.replace(/([a-z])([A-Z])/g, "$1_$2").replaceAll("-", "_").toLowerCase();
var kebabify = (str) => str.replace(/([a-z])([A-Z])/g, "$1-$2").replaceAll("_", "-").toLowerCase();
var Binding = class _Binding {
  transformFn = (v) => v;
  #emitter;
  #prop;
  static bind(emitter, prop) {
    return new _Binding(emitter, prop);
  }
  constructor(emitter, prop) {
    this.#emitter = emitter;
    this.#prop = prop && kebabify(prop);
  }
  toString() {
    return `Binding<${this.#emitter}${this.#prop ? `, "${this.#prop}"` : ""}>`;
  }
  as(fn) {
    const bind2 = new _Binding(this.#emitter, this.#prop);
    bind2.transformFn = (v) => fn(this.transformFn(v));
    return bind2;
  }
  get() {
    if (typeof this.#emitter.get === "function")
      return this.transformFn(this.#emitter.get());
    if (typeof this.#prop === "string") {
      const getter = `get_${snakeify(this.#prop)}`;
      if (typeof this.#emitter[getter] === "function")
        return this.transformFn(this.#emitter[getter]());
      return this.transformFn(this.#emitter[this.#prop]);
    }
    throw Error("can not get value of binding");
  }
  subscribe(callback) {
    if (typeof this.#emitter.subscribe === "function") {
      return this.#emitter.subscribe(() => {
        callback(this.get());
      });
    } else if (typeof this.#emitter.connect === "function") {
      const signal = `notify::${this.#prop}`;
      const id = this.#emitter.connect(signal, () => {
        callback(this.get());
      });
      return () => {
        this.#emitter.disconnect(id);
      };
    }
    throw Error(`${this.#emitter} is not bindable`);
  }
};
var { bind } = Binding;
var binding_default = Binding;

// ../../../../usr/share/astal/gjs/time.ts
import Astal from "gi://AstalIO";
var Time = Astal.Time;
function interval(interval2, callback) {
  return Astal.Time.interval(interval2, () => void callback?.());
}
function timeout(timeout2, callback) {
  return Astal.Time.timeout(timeout2, () => void callback?.());
}

// ../../../../usr/share/astal/gjs/process.ts
import Astal2 from "gi://AstalIO";
var Process = Astal2.Process;
function subprocess(argsOrCmd, onOut = print, onErr = printerr) {
  const args = Array.isArray(argsOrCmd) || typeof argsOrCmd === "string";
  const { cmd, err, out } = {
    cmd: args ? argsOrCmd : argsOrCmd.cmd,
    err: args ? onErr : argsOrCmd.err || onErr,
    out: args ? onOut : argsOrCmd.out || onOut
  };
  const proc = Array.isArray(cmd) ? Astal2.Process.subprocessv(cmd) : Astal2.Process.subprocess(cmd);
  proc.connect("stdout", (_, stdout) => out(stdout));
  proc.connect("stderr", (_, stderr) => err(stderr));
  return proc;
}
function exec(cmd) {
  return Array.isArray(cmd) ? Astal2.Process.execv(cmd) : Astal2.Process.exec(cmd);
}
function execAsync(cmd) {
  return new Promise((resolve, reject) => {
    if (Array.isArray(cmd)) {
      Astal2.Process.exec_asyncv(cmd, (_, res) => {
        try {
          resolve(Astal2.Process.exec_asyncv_finish(res));
        } catch (error) {
          reject(error);
        }
      });
    } else {
      Astal2.Process.exec_async(cmd, (_, res) => {
        try {
          resolve(Astal2.Process.exec_finish(res));
        } catch (error) {
          reject(error);
        }
      });
    }
  });
}

// ../../../../usr/share/astal/gjs/variable.ts
var VariableWrapper = class extends Function {
  variable;
  errHandler = console.error;
  _value;
  _poll;
  _watch;
  pollInterval = 1e3;
  pollExec;
  pollTransform;
  pollFn;
  watchTransform;
  watchExec;
  constructor(init) {
    super();
    this._value = init;
    this.variable = new Astal3.VariableBase();
    this.variable.connect("dropped", () => {
      this.stopWatch();
      this.stopPoll();
    });
    this.variable.connect("error", (_, err) => this.errHandler?.(err));
    return new Proxy(this, {
      apply: (target, _, args) => target._call(args[0])
    });
  }
  _call(transform) {
    const b = binding_default.bind(this);
    return transform ? b.as(transform) : b;
  }
  toString() {
    return String(`Variable<${this.get()}>`);
  }
  get() {
    return this._value;
  }
  set(value) {
    if (value !== this._value) {
      this._value = value;
      this.variable.emit("changed");
    }
  }
  startPoll() {
    if (this._poll)
      return;
    if (this.pollFn) {
      this._poll = interval(this.pollInterval, () => {
        const v = this.pollFn(this.get());
        if (v instanceof Promise) {
          v.then((v2) => this.set(v2)).catch((err) => this.variable.emit("error", err));
        } else {
          this.set(v);
        }
      });
    } else if (this.pollExec) {
      this._poll = interval(this.pollInterval, () => {
        execAsync(this.pollExec).then((v) => this.set(this.pollTransform(v, this.get()))).catch((err) => this.variable.emit("error", err));
      });
    }
  }
  startWatch() {
    if (this._watch)
      return;
    this._watch = subprocess({
      cmd: this.watchExec,
      out: (out) => this.set(this.watchTransform(out, this.get())),
      err: (err) => this.variable.emit("error", err)
    });
  }
  stopPoll() {
    this._poll?.cancel();
    delete this._poll;
  }
  stopWatch() {
    this._watch?.kill();
    delete this._watch;
  }
  isPolling() {
    return !!this._poll;
  }
  isWatching() {
    return !!this._watch;
  }
  drop() {
    this.variable.emit("dropped");
  }
  onDropped(callback) {
    this.variable.connect("dropped", callback);
    return this;
  }
  onError(callback) {
    delete this.errHandler;
    this.variable.connect("error", (_, err) => callback(err));
    return this;
  }
  subscribe(callback) {
    const id = this.variable.connect("changed", () => {
      callback(this.get());
    });
    return () => this.variable.disconnect(id);
  }
  poll(interval2, exec2, transform = (out) => out) {
    this.stopPoll();
    this.pollInterval = interval2;
    this.pollTransform = transform;
    if (typeof exec2 === "function") {
      this.pollFn = exec2;
      delete this.pollExec;
    } else {
      this.pollExec = exec2;
      delete this.pollFn;
    }
    this.startPoll();
    return this;
  }
  watch(exec2, transform = (out) => out) {
    this.stopWatch();
    this.watchExec = exec2;
    this.watchTransform = transform;
    this.startWatch();
    return this;
  }
  observe(objs, sigOrFn, callback) {
    const f = typeof sigOrFn === "function" ? sigOrFn : callback ?? (() => this.get());
    const set = (obj, ...args) => this.set(f(obj, ...args));
    if (Array.isArray(objs)) {
      for (const obj of objs) {
        const [o, s] = obj;
        const id = o.connect(s, set);
        this.onDropped(() => o.disconnect(id));
      }
    } else {
      if (typeof sigOrFn === "string") {
        const id = objs.connect(sigOrFn, set);
        this.onDropped(() => objs.disconnect(id));
      }
    }
    return this;
  }
  static derive(deps, fn = (...args) => args) {
    const update = () => fn(...deps.map((d) => d.get()));
    const derived = new Variable(update());
    const unsubs = deps.map((dep) => dep.subscribe(() => derived.set(update())));
    derived.onDropped(() => unsubs.map((unsub) => unsub()));
    return derived;
  }
};
var Variable = new Proxy(VariableWrapper, {
  apply: (_t, _a, args) => new VariableWrapper(args[0])
});
var { derive } = Variable;
var variable_default = Variable;

// ../../../../usr/share/astal/gjs/_astal.ts
var noImplicitDestroy = Symbol("no no implicit destroy");
var setChildren = Symbol("children setter method");
function mergeBindings(array) {
  function getValues(...args) {
    let i = 0;
    return array.map(
      (value) => value instanceof binding_default ? args[i++] : value
    );
  }
  const bindings = array.filter((i) => i instanceof binding_default);
  if (bindings.length === 0)
    return array;
  if (bindings.length === 1)
    return bindings[0].as(getValues);
  return variable_default.derive(bindings, getValues)();
}
function setProp(obj, prop, value) {
  try {
    const setter = `set_${snakeify(prop)}`;
    if (typeof obj[setter] === "function")
      return obj[setter](value);
    return obj[prop] = value;
  } catch (error) {
    console.error(`could not set property "${prop}" on ${obj}:`, error);
  }
}
function hook(widget, object, signalOrCallback, callback) {
  if (typeof object.connect === "function" && callback) {
    const id = object.connect(signalOrCallback, (_, ...args) => {
      return callback(widget, ...args);
    });
    widget.connect("destroy", () => {
      object.disconnect(id);
    });
  } else if (typeof object.subscribe === "function" && typeof signalOrCallback === "function") {
    const unsub = object.subscribe((...args) => {
      signalOrCallback(widget, ...args);
    });
    widget.connect("destroy", unsub);
  }
}
function construct(widget, config) {
  let { setup, child, children = [], ...props } = config;
  if (children instanceof binding_default) {
    children = [children];
  }
  if (child) {
    children.unshift(child);
  }
  for (const [key, value] of Object.entries(props)) {
    if (value === void 0) {
      delete props[key];
    }
  }
  const bindings = Object.keys(props).reduce((acc, prop) => {
    if (props[prop] instanceof binding_default) {
      const binding = props[prop];
      delete props[prop];
      return [...acc, [prop, binding]];
    }
    return acc;
  }, []);
  const onHandlers = Object.keys(props).reduce((acc, key) => {
    if (key.startsWith("on")) {
      const sig = kebabify(key).split("-").slice(1).join("-");
      const handler = props[key];
      delete props[key];
      return [...acc, [sig, handler]];
    }
    return acc;
  }, []);
  const mergedChildren = mergeBindings(children.flat(Infinity));
  if (mergedChildren instanceof binding_default) {
    widget[setChildren](mergedChildren.get());
    widget.connect("destroy", mergedChildren.subscribe((v) => {
      widget[setChildren](v);
    }));
  } else {
    if (mergedChildren.length > 0) {
      widget[setChildren](mergedChildren);
    }
  }
  for (const [signal, callback] of onHandlers) {
    const sig = signal.startsWith("notify") ? signal.replace("-", "::") : signal;
    if (typeof callback === "function") {
      widget.connect(sig, callback);
    } else {
      widget.connect(sig, () => execAsync(callback).then(print).catch(console.error));
    }
  }
  for (const [prop, binding] of bindings) {
    if (prop === "child" || prop === "children") {
      widget.connect("destroy", binding.subscribe((v) => {
        widget[setChildren](v);
      }));
    }
    widget.connect("destroy", binding.subscribe((v) => {
      setProp(widget, prop, v);
    }));
    setProp(widget, prop, binding.get());
  }
  for (const [key, value] of Object.entries(props)) {
    if (value === void 0) {
      delete props[key];
    }
  }
  Object.assign(widget, props);
  setup?.(widget);
  return widget;
}
function isArrowFunction(func) {
  return !Object.hasOwn(func, "prototype");
}
function jsx(ctors2, ctor, { children, ...props }) {
  children ??= [];
  if (!Array.isArray(children))
    children = [children];
  children = children.filter(Boolean);
  if (children.length === 1)
    props.child = children[0];
  else if (children.length > 1)
    props.children = children;
  if (typeof ctor === "string") {
    if (isArrowFunction(ctors2[ctor]))
      return ctors2[ctor](props);
    return new ctors2[ctor](props);
  }
  if (isArrowFunction(ctor))
    return ctor(props);
  return new ctor(props);
}

// ../../../../usr/share/astal/gjs/gtk3/astalify.ts
import Astal4 from "gi://Astal?version=3.0";
import Gtk from "gi://Gtk?version=3.0";
import GObject from "gi://GObject";
function astalify(cls, clsName = cls.name) {
  class Widget extends cls {
    get css() {
      return Astal4.widget_get_css(this);
    }
    set css(css) {
      Astal4.widget_set_css(this, css);
    }
    get_css() {
      return this.css;
    }
    set_css(css) {
      this.css = css;
    }
    get className() {
      return Astal4.widget_get_class_names(this).join(" ");
    }
    set className(className) {
      Astal4.widget_set_class_names(this, className.split(/\s+/));
    }
    get_class_name() {
      return this.className;
    }
    set_class_name(className) {
      this.className = className;
    }
    get cursor() {
      return Astal4.widget_get_cursor(this);
    }
    set cursor(cursor) {
      Astal4.widget_set_cursor(this, cursor);
    }
    get_cursor() {
      return this.cursor;
    }
    set_cursor(cursor) {
      this.cursor = cursor;
    }
    get clickThrough() {
      return Astal4.widget_get_click_through(this);
    }
    set clickThrough(clickThrough) {
      Astal4.widget_set_click_through(this, clickThrough);
    }
    get_click_through() {
      return this.clickThrough;
    }
    set_click_through(clickThrough) {
      this.clickThrough = clickThrough;
    }
    get noImplicitDestroy() {
      return this[noImplicitDestroy];
    }
    set noImplicitDestroy(value) {
      this[noImplicitDestroy] = value;
    }
    set actionGroup([prefix, group]) {
      this.insert_action_group(prefix, group);
    }
    set_action_group(actionGroup) {
      this.actionGroup = actionGroup;
    }
    getChildren() {
      if (this instanceof Gtk.Bin) {
        return this.get_child() ? [this.get_child()] : [];
      } else if (this instanceof Gtk.Container) {
        return this.get_children();
      }
      return [];
    }
    setChildren(children) {
      children = children.flat(Infinity).map((ch) => ch instanceof Gtk.Widget ? ch : new Gtk.Label({ visible: true, label: String(ch) }));
      if (this instanceof Gtk.Container) {
        for (const ch of children)
          this.add(ch);
      } else {
        throw Error(`can not add children to ${this.constructor.name}`);
      }
    }
    [setChildren](children) {
      if (this instanceof Gtk.Container) {
        for (const ch of this.getChildren()) {
          this.remove(ch);
          if (!children.includes(ch) && !this.noImplicitDestroy)
            ch?.destroy();
        }
      }
      this.setChildren(children);
    }
    toggleClassName(cn, cond = true) {
      Astal4.widget_toggle_class_name(this, cn, cond);
    }
    hook(object, signalOrCallback, callback) {
      hook(this, object, signalOrCallback, callback);
      return this;
    }
    constructor(...params) {
      super();
      const props = params[0] || {};
      props.visible ??= true;
      construct(this, props);
    }
  }
  GObject.registerClass({
    GTypeName: `Astal_${clsName}`,
    Properties: {
      "class-name": GObject.ParamSpec.string(
        "class-name",
        "",
        "",
        GObject.ParamFlags.READWRITE,
        ""
      ),
      "css": GObject.ParamSpec.string(
        "css",
        "",
        "",
        GObject.ParamFlags.READWRITE,
        ""
      ),
      "cursor": GObject.ParamSpec.string(
        "cursor",
        "",
        "",
        GObject.ParamFlags.READWRITE,
        "default"
      ),
      "click-through": GObject.ParamSpec.boolean(
        "click-through",
        "",
        "",
        GObject.ParamFlags.READWRITE,
        false
      ),
      "no-implicit-destroy": GObject.ParamSpec.boolean(
        "no-implicit-destroy",
        "",
        "",
        GObject.ParamFlags.READWRITE,
        false
      )
    }
  }, Widget);
  return Widget;
}

// ../../../../usr/share/astal/gjs/gtk3/app.ts
import Gtk2 from "gi://Gtk?version=3.0";
import Astal5 from "gi://Astal?version=3.0";

// ../../../../usr/share/astal/gjs/overrides.ts
var snakeify2 = (str) => str.replace(/([a-z])([A-Z])/g, "$1_$2").replaceAll("-", "_").toLowerCase();
async function suppress(mod, patch2) {
  return mod.then((m) => patch2(m.default)).catch(() => void 0);
}
function patch(proto, prop) {
  Object.defineProperty(proto, prop, {
    get() {
      return this[`get_${snakeify2(prop)}`]();
    }
  });
}
await suppress(import("gi://AstalApps"), ({ Apps, Application }) => {
  patch(Apps.prototype, "list");
  patch(Application.prototype, "keywords");
  patch(Application.prototype, "categories");
});
await suppress(import("gi://AstalBattery"), ({ UPower }) => {
  patch(UPower.prototype, "devices");
});
await suppress(import("gi://AstalBluetooth"), ({ Adapter, Bluetooth, Device }) => {
  patch(Adapter.prototype, "uuids");
  patch(Bluetooth.prototype, "adapters");
  patch(Bluetooth.prototype, "devices");
  patch(Device.prototype, "uuids");
});
await suppress(import("gi://AstalHyprland"), ({ Hyprland, Monitor, Workspace }) => {
  patch(Hyprland.prototype, "binds");
  patch(Hyprland.prototype, "monitors");
  patch(Hyprland.prototype, "workspaces");
  patch(Hyprland.prototype, "clients");
  patch(Monitor.prototype, "availableModes");
  patch(Monitor.prototype, "available_modes");
  patch(Workspace.prototype, "clients");
});
await suppress(import("gi://AstalMpris"), ({ Mpris, Player }) => {
  patch(Mpris.prototype, "players");
  patch(Player.prototype, "supported_uri_schemes");
  patch(Player.prototype, "supportedUriSchemes");
  patch(Player.prototype, "supported_mime_types");
  patch(Player.prototype, "supportedMimeTypes");
  patch(Player.prototype, "comments");
});
await suppress(import("gi://AstalNetwork"), ({ Wifi }) => {
  patch(Wifi.prototype, "access_points");
  patch(Wifi.prototype, "accessPoints");
});
await suppress(import("gi://AstalNotifd"), ({ Notifd, Notification }) => {
  patch(Notifd.prototype, "notifications");
  patch(Notification.prototype, "actions");
});
await suppress(import("gi://AstalPowerProfiles"), ({ PowerProfiles }) => {
  patch(PowerProfiles.prototype, "actions");
});
await suppress(import("gi://AstalWp"), ({ Wp: Wp2, Audio, Video }) => {
  patch(Wp2.prototype, "endpoints");
  patch(Wp2.prototype, "devices");
  patch(Audio.prototype, "streams");
  patch(Audio.prototype, "recorders");
  patch(Audio.prototype, "microphones");
  patch(Audio.prototype, "speakers");
  patch(Audio.prototype, "devices");
  patch(Video.prototype, "streams");
  patch(Video.prototype, "recorders");
  patch(Video.prototype, "sinks");
  patch(Video.prototype, "sources");
  patch(Video.prototype, "devices");
});

// ../../../../usr/share/astal/gjs/_app.ts
import { setConsoleLogDomain } from "console";
import { exit, programArgs } from "system";
import IO from "gi://AstalIO";
import GObject2 from "gi://GObject";
function mkApp(App) {
  return new class AstalJS extends App {
    static {
      GObject2.registerClass({ GTypeName: "AstalJS" }, this);
    }
    eval(body) {
      return new Promise((res, rej) => {
        try {
          const fn = Function(`return (async function() {
                        ${body.includes(";") ? body : `return ${body};`}
                    })`);
          fn()().then(res).catch(rej);
        } catch (error) {
          rej(error);
        }
      });
    }
    requestHandler;
    vfunc_request(msg, conn) {
      if (typeof this.requestHandler === "function") {
        this.requestHandler(msg, (response) => {
          IO.write_sock(
            conn,
            String(response),
            (_, res) => IO.write_sock_finish(res)
          );
        });
      } else {
        super.vfunc_request(msg, conn);
      }
    }
    apply_css(style, reset = false) {
      super.apply_css(style, reset);
    }
    quit(code) {
      super.quit();
      exit(code ?? 0);
    }
    start({ requestHandler, css, hold, main, client, icons, ...cfg } = {}) {
      const app = this;
      client ??= () => {
        print(`Astal instance "${app.instanceName}" already running`);
        exit(1);
      };
      Object.assign(this, cfg);
      setConsoleLogDomain(app.instanceName);
      this.requestHandler = requestHandler;
      app.connect("activate", () => {
        main?.(...programArgs);
      });
      try {
        app.acquire_socket();
      } catch (error) {
        return client((msg) => IO.send_request(app.instanceName, msg), ...programArgs);
      }
      if (css)
        this.apply_css(css, false);
      if (icons)
        app.add_icons(icons);
      hold ??= true;
      if (hold)
        app.hold();
      app.runAsync([]);
    }
  }();
}

// ../../../../usr/share/astal/gjs/gtk3/app.ts
Gtk2.init(null);
var app_default = mkApp(Astal5.Application);

// ../../../../usr/share/astal/gjs/gtk3/widget.ts
import Astal6 from "gi://Astal?version=3.0";
import Gtk3 from "gi://Gtk?version=3.0";
import GObject3 from "gi://GObject";
function filter(children) {
  return children.flat(Infinity).map((ch) => ch instanceof Gtk3.Widget ? ch : new Gtk3.Label({ visible: true, label: String(ch) }));
}
Object.defineProperty(Astal6.Box.prototype, "children", {
  get() {
    return this.get_children();
  },
  set(v) {
    this.set_children(v);
  }
});
var Box = class extends astalify(Astal6.Box) {
  static {
    GObject3.registerClass({ GTypeName: "Box" }, this);
  }
  constructor(props, ...children) {
    super({ children, ...props });
  }
  setChildren(children) {
    this.set_children(filter(children));
  }
};
var Button = class extends astalify(Astal6.Button) {
  static {
    GObject3.registerClass({ GTypeName: "Button" }, this);
  }
  constructor(props, child) {
    super({ child, ...props });
  }
};
var CenterBox = class extends astalify(Astal6.CenterBox) {
  static {
    GObject3.registerClass({ GTypeName: "CenterBox" }, this);
  }
  constructor(props, ...children) {
    super({ children, ...props });
  }
  setChildren(children) {
    const ch = filter(children);
    this.startWidget = ch[0] || new Gtk3.Box();
    this.centerWidget = ch[1] || new Gtk3.Box();
    this.endWidget = ch[2] || new Gtk3.Box();
  }
};
var CircularProgress = class extends astalify(Astal6.CircularProgress) {
  static {
    GObject3.registerClass({ GTypeName: "CircularProgress" }, this);
  }
  constructor(props, child) {
    super({ child, ...props });
  }
};
var DrawingArea = class extends astalify(Gtk3.DrawingArea) {
  static {
    GObject3.registerClass({ GTypeName: "DrawingArea" }, this);
  }
  constructor(props) {
    super(props);
  }
};
var Entry = class extends astalify(Gtk3.Entry) {
  static {
    GObject3.registerClass({ GTypeName: "Entry" }, this);
  }
  constructor(props) {
    super(props);
  }
};
var EventBox = class extends astalify(Astal6.EventBox) {
  static {
    GObject3.registerClass({ GTypeName: "EventBox" }, this);
  }
  constructor(props, child) {
    super({ child, ...props });
  }
};
var Icon = class extends astalify(Astal6.Icon) {
  static {
    GObject3.registerClass({ GTypeName: "Icon" }, this);
  }
  constructor(props) {
    super(props);
  }
};
var Label = class extends astalify(Astal6.Label) {
  static {
    GObject3.registerClass({ GTypeName: "Label" }, this);
  }
  constructor(props) {
    super(props);
  }
  setChildren(children) {
    this.label = String(children);
  }
};
var LevelBar = class extends astalify(Astal6.LevelBar) {
  static {
    GObject3.registerClass({ GTypeName: "LevelBar" }, this);
  }
  constructor(props) {
    super(props);
  }
};
var MenuButton = class extends astalify(Gtk3.MenuButton) {
  static {
    GObject3.registerClass({ GTypeName: "MenuButton" }, this);
  }
  constructor(props, child) {
    super({ child, ...props });
  }
};
Object.defineProperty(Astal6.Overlay.prototype, "overlays", {
  get() {
    return this.get_overlays();
  },
  set(v) {
    this.set_overlays(v);
  }
});
var Overlay = class extends astalify(Astal6.Overlay) {
  static {
    GObject3.registerClass({ GTypeName: "Overlay" }, this);
  }
  constructor(props, ...children) {
    super({ children, ...props });
  }
  setChildren(children) {
    const [child, ...overlays] = filter(children);
    this.set_child(child);
    this.set_overlays(overlays);
  }
};
var Revealer = class extends astalify(Gtk3.Revealer) {
  static {
    GObject3.registerClass({ GTypeName: "Revealer" }, this);
  }
  constructor(props, child) {
    super({ child, ...props });
  }
};
var Scrollable = class extends astalify(Astal6.Scrollable) {
  static {
    GObject3.registerClass({ GTypeName: "Scrollable" }, this);
  }
  constructor(props, child) {
    super({ child, ...props });
  }
};
var Slider = class extends astalify(Astal6.Slider) {
  static {
    GObject3.registerClass({ GTypeName: "Slider" }, this);
  }
  constructor(props) {
    super(props);
  }
};
var Stack = class extends astalify(Astal6.Stack) {
  static {
    GObject3.registerClass({ GTypeName: "Stack" }, this);
  }
  constructor(props, ...children) {
    super({ children, ...props });
  }
  setChildren(children) {
    this.set_children(filter(children));
  }
};
var Switch = class extends astalify(Gtk3.Switch) {
  static {
    GObject3.registerClass({ GTypeName: "Switch" }, this);
  }
  constructor(props) {
    super(props);
  }
};
var Window = class extends astalify(Astal6.Window) {
  static {
    GObject3.registerClass({ GTypeName: "Window" }, this);
  }
  constructor(props, child) {
    super({ child, ...props });
  }
};

// sass:/home/madwayl/.config/ags/style.scss
var style_default = "window.OSD box.OSD {\n  border-radius: 6px;\n  background-color: @theme_bg_color;\n  padding: 13px;\n  margin: 13px;\n  margin-bottom: 50px;\n  min-width: 6rem;\n  background-color: rgba(8, 8, 8, 0.4);\n}\nwindow.OSD icon {\n  font-size: 5rem;\n}\nwindow.OSD label {\n  font-size: 1.1rem;\n}\nwindow.OSD levelbar trough {\n  margin: 1px 0.6rem;\n  min-width: 5rem;\n}\nwindow.OSD levelbar block {\n  padding: 6px;\n  border-radius: 4px;\n}";

// ../../../../usr/share/astal/gjs/gobject.ts
import GObject4 from "gi://GObject";
import { default as default2 } from "gi://GLib?version=2.0";
var meta = Symbol("meta");
var priv = Symbol("priv");
var { ParamSpec, ParamFlags } = GObject4;
var kebabify2 = (str) => str.replace(/([a-z])([A-Z])/g, "$1-$2").replaceAll("_", "-").toLowerCase();
function register(options = {}) {
  return function(cls) {
    const t = options.Template;
    if (typeof t === "string" && !t.startsWith("resource://") && !t.startsWith("file://")) {
      options.Template = new TextEncoder().encode(t);
    }
    GObject4.registerClass({
      Signals: { ...cls[meta]?.Signals },
      Properties: { ...cls[meta]?.Properties },
      ...options
    }, cls);
    delete cls[meta];
  };
}
function property(declaration = Object) {
  return function(target, prop, desc) {
    target.constructor[meta] ??= {};
    target.constructor[meta].Properties ??= {};
    const name = kebabify2(prop);
    if (!desc) {
      Object.defineProperty(target, prop, {
        get() {
          return this[priv]?.[prop] ?? defaultValue(declaration);
        },
        set(v) {
          if (v !== this[prop]) {
            this[priv] ??= {};
            this[priv][prop] = v;
            this.notify(name);
          }
        }
      });
      Object.defineProperty(target, `set_${name.replace("-", "_")}`, {
        value(v) {
          this[prop] = v;
        }
      });
      Object.defineProperty(target, `get_${name.replace("-", "_")}`, {
        value() {
          return this[prop];
        }
      });
      target.constructor[meta].Properties[kebabify2(prop)] = pspec(name, ParamFlags.READWRITE, declaration);
    } else {
      let flags = 0;
      if (desc.get) flags |= ParamFlags.READABLE;
      if (desc.set) flags |= ParamFlags.WRITABLE;
      target.constructor[meta].Properties[kebabify2(prop)] = pspec(name, flags, declaration);
    }
  };
}
function pspec(name, flags, declaration) {
  if (declaration instanceof ParamSpec)
    return declaration;
  switch (declaration) {
    case String:
      return ParamSpec.string(name, "", "", flags, "");
    case Number:
      return ParamSpec.double(name, "", "", flags, -Number.MAX_VALUE, Number.MAX_VALUE, 0);
    case Boolean:
      return ParamSpec.boolean(name, "", "", flags, false);
    case Object:
      return ParamSpec.jsobject(name, "", "", flags);
    default:
      return ParamSpec.object(name, "", "", flags, declaration.$gtype);
  }
}
function defaultValue(declaration) {
  if (declaration instanceof ParamSpec)
    return declaration.get_default_value();
  switch (declaration) {
    case String:
      return "";
    case Number:
      return 0;
    case Boolean:
      return false;
    case Object:
    default:
      return null;
  }
}

// ../../../../usr/share/astal/gjs/file.ts
import Astal8 from "gi://AstalIO";
import Gio from "gi://Gio?version=2.0";
function readFileAsync(path) {
  return new Promise((resolve, reject) => {
    Astal8.read_file_async(path, (_, res) => {
      try {
        resolve(Astal8.read_file_finish(res) || "");
      } catch (error) {
        reject(error);
      }
    });
  });
}
function monitorFile(path, callback) {
  return Astal8.monitor_file(path, (file, event) => {
    callback(file, event);
  });
}

// osd/backlight.ts
var get = (args) => Number(exec(`brightnessctl ${args}`));
var screen = exec(`bash -c "ls -w1 /sys/class/backlight | head -1"`);
var _screenMax, _screen;
var Brightness = class extends GObject4.Object {
  constructor() {
    super();
    // Screen backlight
    __privateAdd(this, _screenMax, get("max"));
    __privateAdd(this, _screen, get("get") / (get("max") || 1));
    __publicField(this, "manufacturer", "Chimei Innolux Corporation");
    __publicField(this, "model", "0x15E7");
    monitorFile(`/sys/class/backlight/${screen}/brightness`, async (f) => {
      const v = await readFileAsync(f);
      __privateSet(this, _screen, Number(v) / __privateGet(this, _screenMax));
      this.notify("screen");
    });
  }
  static get_default() {
    if (!this.instance)
      this.instance = new Brightness();
    return this.instance;
  }
  get screen() {
    return __privateGet(this, _screen);
  }
  set screen(percent) {
    if (percent < 0)
      percent = 0;
    if (percent > 1)
      percent = 1;
    execAsync(`brightnessctl set ${Math.floor(percent * 100)}% -q`).then(() => {
      __privateSet(this, _screen, percent);
      this.notify("screen");
    });
  }
};
_screenMax = new WeakMap();
_screen = new WeakMap();
__publicField(Brightness, "instance");
__decorateClass([
  property(Number)
], Brightness.prototype, "screen", 1);
Brightness = __decorateClass([
  register({ GTypeName: "Brightness" })
], Brightness);

// osd/ddcutil.ts
import GLib from "gi://GLib";
var output = exec("ddcutil detect").split("\n");
var screens = [];
for (let i = 0; i < output.length; i++) {
  if (output[i].startsWith("Display")) {
    const bus = output[i + 1]?.split("-")[1];
    const model = output[i + 5]?.split(":")[1].trim();
    screens.push([Number(bus), model]);
    i = i + 9;
  }
}
var _ddc;
var BrightnessDDC = class extends GObject4.Object {
  constructor(busName = 10, model = "LEN - Lenovo Group Limited") {
    super();
    __privateAdd(this, _ddc, 1);
    __publicField(this, "busName", 10);
    __publicField(this, "model", "LEN - Lenovo Group Limited");
    this.busName = busName;
    this.model = model;
    const runtimeDir = GLib.getenv("XDG_RUNTIME_DIR");
    monitorFile(`${runtimeDir}/brightness/${busName}`, async (f) => {
      const v = await readFileAsync(f);
      __privateSet(this, _ddc, Number(v) / 100);
      this.notify("ddc");
    });
  }
  static get_default() {
    if (!this.instance)
      this.instance = new BrightnessDDC();
    return this.instance;
  }
  get ddc() {
    return __privateGet(this, _ddc);
  }
  set ddc(percent) {
    print(`[BrightnessDDC-SETTER] Attempting to set screen_ddc to: ${percent} for bus: ${this.busName}`);
    execAsync(`ddcutil --sleep-multiplier=0.01 --skip-ddc-checks --bus=${this.busName} setvcp 10 ${percent}`).then(() => {
      __privateSet(this, _ddc, Number(exec(`ddcutil --sleep-multiplier=0.01 --skip-ddc-checks --bus=${this.busName} getvcp 10 | grep -oP 'current value =s*Kd+`)) / 100);
      this.notify("ddc");
    });
  }
};
_ddc = new WeakMap();
__publicField(BrightnessDDC, "instance");
__decorateClass([
  property(Number)
], BrightnessDDC.prototype, "ddc", 1);
BrightnessDDC = __decorateClass([
  register({ GTypeName: "BrightnessDDC" })
], BrightnessDDC);
var mappedScreen = screens.map((busNum) => new BrightnessDDC(busNum[0], busNum[1]));

// osd/OSD.tsx
import Battery from "gi://AstalBattery";
import Wp from "gi://AstalWp";

// ../../../../usr/share/astal/gjs/gtk3/jsx-runtime.ts
function jsx2(ctor, props) {
  return jsx(ctors, ctor, props);
}
var ctors = {
  box: Box,
  button: Button,
  centerbox: CenterBox,
  circularprogress: CircularProgress,
  drawingarea: DrawingArea,
  entry: Entry,
  eventbox: EventBox,
  // TODO: fixed
  // TODO: flowbox
  icon: Icon,
  label: Label,
  levelbar: LevelBar,
  // TODO: listbox
  menubutton: MenuButton,
  overlay: Overlay,
  revealer: Revealer,
  scrollable: Scrollable,
  slider: Slider,
  stack: Stack,
  switch: Switch,
  window: Window
};
var jsxs = jsx2;

// osd/OSD.tsx
function OnScreenProgress({ visible, monitorType }) {
  const brightness = Brightness.get_default();
  const brightnessDDC = BrightnessDDC.get_default();
  const speaker = Wp.get_default().get_default_speaker();
  const battery = Battery.get_default();
  const iconName = variable_default("");
  const value = variable_default(0);
  let count = 0;
  function show(v, icon) {
    visible.set(true);
    value.set(v);
    iconName.set(icon);
    count++;
    timeout(2e3, () => {
      count--;
      if (count === 0) visible.set(false);
    });
  }
  return /* @__PURE__ */ jsx2(
    "revealer",
    {
      setup: (self) => {
        self.hook(
          brightness,
          "notify::screen",
          () => {
            show(brightness.screen, "display-brightness-symbolic");
            if (monitorType().get() != brightness.model)
              visible.set(false);
          }
        );
        self.hook(
          brightness,
          "notify::capslock",
          () => {
            if (brightness.capslockOn)
              show("CapsLock ON", "go-top-symbolic");
            else
              show("CapsLock OFF", "go-top-symbolic");
          }
        );
        if (speaker) {
          self.hook(
            speaker,
            "notify::volume",
            () => show(speaker.volume, speaker.volumeIcon)
          );
          self.hook(speaker, "notify::mute", () => {
            if (speaker.mute)
              show("muted", "audio-volume-muted-symbolic");
            else
              show(speaker.volume, speaker.volumeIcon);
          });
        }
        if (battery) {
          self.hook(battery, "notify::percentage", () => {
            if (battery.battery_level == 3 || battery.battery_level == 5)
              show(battery.percentage, battery.batteryIconName);
          });
        }
      },
      revealChild: visible(),
      transitionType: Gtk4.RevealerTransitionType.SLIDE_UP,
      children: /* @__PURE__ */ jsxs(
        "box",
        {
          className: "OSD",
          vertical: true,
          widthRequest: 200,
          heightRequest: 200,
          spacing: 10,
          children: [
            /* @__PURE__ */ jsx2("icon", { icon: iconName() }),
            /* @__PURE__ */ jsx2("levelbar", { valign: Gtk4.Align.CENTER, value: value() }),
            /* @__PURE__ */ jsx2("label", { label: value((v) => typeof v == "number" ? `${Math.floor(v * 100)}%` : v) })
          ]
        }
      )
    }
  );
}
function OSD(monitor) {
  const visible = variable_default(false);
  const monitorType = variable_default(monitor.model);
  return /* @__PURE__ */ jsx2(
    "window",
    {
      gdkmonitor: monitor,
      className: "OSD",
      namespace: "osd",
      application: app_default,
      layer: Astal7.Layer.OVERLAY,
      keymode: Astal7.Keymode.ON_DEMAND,
      anchor: Astal7.WindowAnchor.BOTTOM,
      children: /* @__PURE__ */ jsx2("eventbox", { onClick: () => visible.set(false), children: /* @__PURE__ */ jsx2(OnScreenProgress, { visible, monitorType }) })
    }
  );
}

// osd/OSDddc.tsx
function OnScreenProgress2({ visible }) {
  const iconName = variable_default("");
  const value = variable_default(0);
  let count = 0;
  function show(v, icon) {
    visible.set(true);
    value.set(v);
    iconName.set(icon);
    count++;
    timeout(2e3, () => {
      count--;
      if (count === 0) visible.set(false);
    });
  }
  return /* @__PURE__ */ jsx2(
    "revealer",
    {
      setup: (self) => {
        for (const busNum of mappedScreen) {
          self.hook(busNum, "notify::ddc", () => {
            show(busNum.ddc, "display-brightness-symbolic");
          });
        }
      },
      revealChild: visible(),
      transitionType: Gtk4.RevealerTransitionType.SLIDE_UP,
      children: /* @__PURE__ */ jsxs(
        "box",
        {
          className: "OSD",
          vertical: true,
          widthRequest: 200,
          heightRequest: 200,
          spacing: 10,
          children: [
            /* @__PURE__ */ jsx2("icon", { icon: iconName() }),
            /* @__PURE__ */ jsx2("levelbar", { valign: Gtk4.Align.CENTER, value: value() }),
            /* @__PURE__ */ jsx2("label", { label: value((v) => typeof v !== "number" ? "muted" : `${Math.floor(v * 100)}%`) })
          ]
        }
      )
    }
  );
}
function OSD2(monitor) {
  const visible = variable_default(false);
  return /* @__PURE__ */ jsx2(
    "window",
    {
      gdkmonitor: monitor,
      className: "OSD",
      namespace: "osd",
      application: app_default,
      layer: Astal7.Layer.OVERLAY,
      keymode: Astal7.Keymode.ON_DEMAND,
      anchor: Astal7.WindowAnchor.BOTTOM,
      children: /* @__PURE__ */ jsx2("eventbox", { onClick: () => visible.set(false), children: /* @__PURE__ */ jsx2(OnScreenProgress2, { visible }) })
    }
  );
}

// osd/lockkeys.ts
var get2 = (args) => Number(exec(`brightnessctl ${args}`));
var capslock = exec(`bash -c "ls -w1 /sys/class/leds | grep '::capslock$' | head -1"`);
var _capslockMax, _capslock;
var LockKeys = class extends GObject4.Object {
  constructor() {
    super();
    // Capslock
    __privateAdd(this, _capslockMax, get2(`--device ${capslock} max`));
    __privateAdd(this, _capslock, get2(`--device ${capslock} get`));
    __publicField(this, "capslockOn", false);
    monitorFile(`/sys/class/leds/${capslock}/brightness`, async (f) => {
      const v = await readFileAsync(f);
      __privateSet(this, _capslock, Number(v));
      print(__privateGet(this, _capslock));
      this.capslockOn = __privateGet(this, _capslock) == 1;
      this.notify("capslock");
    });
  }
  static get_default() {
    if (!this.instance)
      this.instance = new LockKeys();
    return this.instance;
  }
  get capslock() {
    return __privateGet(this, _capslock);
  }
  set capslock(value) {
    if (value < 0 || value > __privateGet(this, _capslockMax)) return;
    execAsync(`brightnessctl -d ${capslock} set ${Math.floor(value * 100)}% -q`).then(() => {
      __privateSet(this, _capslock, value);
      this.notify("capslock");
    });
  }
};
_capslockMax = new WeakMap();
_capslock = new WeakMap();
__publicField(LockKeys, "instance");
__decorateClass([
  property(Number)
], LockKeys.prototype, "capslock", 1);
LockKeys = __decorateClass([
  register({ GTypeName: "LockKeys" })
], LockKeys);

// osd/OSDlock.tsx
function Indicator({ visible }) {
  const lockKeys = LockKeys.get_default();
  const icon = variable_default("");
  const status = variable_default("");
  let count = 0;
  function show(s, i) {
    visible.set(true);
    status.set(s);
    icon.set(i);
    count++;
    timeout(2e3, () => {
      count--;
      if (count === 0) visible.set(false);
    });
  }
  return /* @__PURE__ */ jsx2(
    "revealer",
    {
      setup: (self) => {
        self.hook(
          lockKeys,
          "notify::capslock",
          () => {
            print("lock");
            if (lockKeys.capslockOn)
              show("CapsLock ON", "\u{F030E}");
            else
              show("CapsLock OFF", "\u{F030E}");
          }
        );
      },
      revealChild: visible(),
      transitionType: Gtk4.RevealerTransitionType.SLIDE_UP,
      children: /* @__PURE__ */ jsxs(
        "box",
        {
          className: "OSD",
          vertical: true,
          widthRequest: 200,
          heightRequest: 200,
          spacing: 1,
          marginBottom: 0,
          children: [
            /* @__PURE__ */ jsx2("label", { className: "indicator", label: icon(), css: "font-family: 'Font Awesome 6 Free', sans-serif; font-size: 123px;" }),
            /* @__PURE__ */ jsx2("label", { label: status(), css: "font-size: 18px;" })
          ]
        }
      )
    }
  );
}
function OSD3(monitor) {
  const visible = variable_default(false);
  return /* @__PURE__ */ jsx2(
    "window",
    {
      gdkmonitor: monitor,
      className: "OSD",
      namespace: "osd",
      application: app_default,
      layer: Astal7.Layer.OVERLAY,
      keymode: Astal7.Keymode.ON_DEMAND,
      anchor: Astal7.WindowAnchor.BOTTOM | Astal7.WindowAnchor.RIGHT,
      children: /* @__PURE__ */ jsx2("eventbox", { onClick: () => visible.set(false), children: /* @__PURE__ */ jsx2(Indicator, { visible }) })
    }
  );
}

// app.ts
app_default.start({
  css: style_default,
  main() {
    app_default.get_monitors().map(OSD);
    OSD2(app_default.get_monitors()[1]);
    app_default.get_monitors().map(OSD3);
  }
});
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vdXNyL3NoYXJlL2FzdGFsL2dqcy9ndGszL2luZGV4LnRzIiwgIi4uLy4uLy4uLy4uL3Vzci9zaGFyZS9hc3RhbC9nanMvdmFyaWFibGUudHMiLCAiLi4vLi4vLi4vLi4vdXNyL3NoYXJlL2FzdGFsL2dqcy9iaW5kaW5nLnRzIiwgIi4uLy4uLy4uLy4uL3Vzci9zaGFyZS9hc3RhbC9nanMvdGltZS50cyIsICIuLi8uLi8uLi8uLi91c3Ivc2hhcmUvYXN0YWwvZ2pzL3Byb2Nlc3MudHMiLCAiLi4vLi4vLi4vLi4vdXNyL3NoYXJlL2FzdGFsL2dqcy9fYXN0YWwudHMiLCAiLi4vLi4vLi4vLi4vdXNyL3NoYXJlL2FzdGFsL2dqcy9ndGszL2FzdGFsaWZ5LnRzIiwgIi4uLy4uLy4uLy4uL3Vzci9zaGFyZS9hc3RhbC9nanMvZ3RrMy9hcHAudHMiLCAiLi4vLi4vLi4vLi4vdXNyL3NoYXJlL2FzdGFsL2dqcy9vdmVycmlkZXMudHMiLCAiLi4vLi4vLi4vLi4vdXNyL3NoYXJlL2FzdGFsL2dqcy9fYXBwLnRzIiwgIi4uLy4uLy4uLy4uL3Vzci9zaGFyZS9hc3RhbC9nanMvZ3RrMy93aWRnZXQudHMiLCAic2FzczovaG9tZS9tYWR3YXlsLy5jb25maWcvYWdzL3N0eWxlLnNjc3MiLCAiLi4vLi4vLi4vLi4vdXNyL3NoYXJlL2FzdGFsL2dqcy9nb2JqZWN0LnRzIiwgIi4uLy4uLy4uLy4uL3Vzci9zaGFyZS9hc3RhbC9nanMvZmlsZS50cyIsICJvc2QvYmFja2xpZ2h0LnRzIiwgIm9zZC9kZGN1dGlsLnRzIiwgIm9zZC9PU0QudHN4IiwgIi4uLy4uLy4uLy4uL3Vzci9zaGFyZS9hc3RhbC9nanMvZ3RrMy9qc3gtcnVudGltZS50cyIsICJvc2QvT1NEZGRjLnRzeCIsICJvc2QvbG9ja2tleXMudHMiLCAib3NkL09TRGxvY2sudHN4IiwgImFwcC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IEFzdGFsIGZyb20gXCJnaTovL0FzdGFsP3ZlcnNpb249My4wXCJcbmltcG9ydCBHdGsgZnJvbSBcImdpOi8vR3RrP3ZlcnNpb249My4wXCJcbmltcG9ydCBHZGsgZnJvbSBcImdpOi8vR2RrP3ZlcnNpb249My4wXCJcbmltcG9ydCBhc3RhbGlmeSwgeyB0eXBlIENvbnN0cnVjdFByb3BzLCB0eXBlIEJpbmRhYmxlUHJvcHMgfSBmcm9tIFwiLi9hc3RhbGlmeS5qc1wiXG5cbmV4cG9ydCB7IEFzdGFsLCBHdGssIEdkayB9XG5leHBvcnQgeyBkZWZhdWx0IGFzIEFwcCB9IGZyb20gXCIuL2FwcC5qc1wiXG5leHBvcnQgeyBhc3RhbGlmeSwgQ29uc3RydWN0UHJvcHMsIEJpbmRhYmxlUHJvcHMgfVxuZXhwb3J0ICogYXMgV2lkZ2V0IGZyb20gXCIuL3dpZGdldC5qc1wiXG5leHBvcnQgeyBob29rIH0gZnJvbSBcIi4uL19hc3RhbFwiXG4iLCAiaW1wb3J0IEFzdGFsIGZyb20gXCJnaTovL0FzdGFsSU9cIlxuaW1wb3J0IEJpbmRpbmcsIHsgdHlwZSBDb25uZWN0YWJsZSwgdHlwZSBTdWJzY3JpYmFibGUgfSBmcm9tIFwiLi9iaW5kaW5nLmpzXCJcbmltcG9ydCB7IGludGVydmFsIH0gZnJvbSBcIi4vdGltZS5qc1wiXG5pbXBvcnQgeyBleGVjQXN5bmMsIHN1YnByb2Nlc3MgfSBmcm9tIFwiLi9wcm9jZXNzLmpzXCJcblxuY2xhc3MgVmFyaWFibGVXcmFwcGVyPFQ+IGV4dGVuZHMgRnVuY3Rpb24ge1xuICAgIHByaXZhdGUgdmFyaWFibGUhOiBBc3RhbC5WYXJpYWJsZUJhc2VcbiAgICBwcml2YXRlIGVyckhhbmRsZXI/ID0gY29uc29sZS5lcnJvclxuXG4gICAgcHJpdmF0ZSBfdmFsdWU6IFRcbiAgICBwcml2YXRlIF9wb2xsPzogQXN0YWwuVGltZVxuICAgIHByaXZhdGUgX3dhdGNoPzogQXN0YWwuUHJvY2Vzc1xuXG4gICAgcHJpdmF0ZSBwb2xsSW50ZXJ2YWwgPSAxMDAwXG4gICAgcHJpdmF0ZSBwb2xsRXhlYz86IHN0cmluZ1tdIHwgc3RyaW5nXG4gICAgcHJpdmF0ZSBwb2xsVHJhbnNmb3JtPzogKHN0ZG91dDogc3RyaW5nLCBwcmV2OiBUKSA9PiBUXG4gICAgcHJpdmF0ZSBwb2xsRm4/OiAocHJldjogVCkgPT4gVCB8IFByb21pc2U8VD5cblxuICAgIHByaXZhdGUgd2F0Y2hUcmFuc2Zvcm0/OiAoc3Rkb3V0OiBzdHJpbmcsIHByZXY6IFQpID0+IFRcbiAgICBwcml2YXRlIHdhdGNoRXhlYz86IHN0cmluZ1tdIHwgc3RyaW5nXG5cbiAgICBjb25zdHJ1Y3Rvcihpbml0OiBUKSB7XG4gICAgICAgIHN1cGVyKClcbiAgICAgICAgdGhpcy5fdmFsdWUgPSBpbml0XG4gICAgICAgIHRoaXMudmFyaWFibGUgPSBuZXcgQXN0YWwuVmFyaWFibGVCYXNlKClcbiAgICAgICAgdGhpcy52YXJpYWJsZS5jb25uZWN0KFwiZHJvcHBlZFwiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0b3BXYXRjaCgpXG4gICAgICAgICAgICB0aGlzLnN0b3BQb2xsKClcbiAgICAgICAgfSlcbiAgICAgICAgdGhpcy52YXJpYWJsZS5jb25uZWN0KFwiZXJyb3JcIiwgKF8sIGVycikgPT4gdGhpcy5lcnJIYW5kbGVyPy4oZXJyKSlcbiAgICAgICAgcmV0dXJuIG5ldyBQcm94eSh0aGlzLCB7XG4gICAgICAgICAgICBhcHBseTogKHRhcmdldCwgXywgYXJncykgPT4gdGFyZ2V0Ll9jYWxsKGFyZ3NbMF0pLFxuICAgICAgICB9KVxuICAgIH1cblxuICAgIHByaXZhdGUgX2NhbGw8UiA9IFQ+KHRyYW5zZm9ybT86ICh2YWx1ZTogVCkgPT4gUik6IEJpbmRpbmc8Uj4ge1xuICAgICAgICBjb25zdCBiID0gQmluZGluZy5iaW5kKHRoaXMpXG4gICAgICAgIHJldHVybiB0cmFuc2Zvcm0gPyBiLmFzKHRyYW5zZm9ybSkgOiBiIGFzIHVua25vd24gYXMgQmluZGluZzxSPlxuICAgIH1cblxuICAgIHRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gU3RyaW5nKGBWYXJpYWJsZTwke3RoaXMuZ2V0KCl9PmApXG4gICAgfVxuXG4gICAgZ2V0KCk6IFQgeyByZXR1cm4gdGhpcy5fdmFsdWUgfVxuICAgIHNldCh2YWx1ZTogVCkge1xuICAgICAgICBpZiAodmFsdWUgIT09IHRoaXMuX3ZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlXG4gICAgICAgICAgICB0aGlzLnZhcmlhYmxlLmVtaXQoXCJjaGFuZ2VkXCIpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGFydFBvbGwoKSB7XG4gICAgICAgIGlmICh0aGlzLl9wb2xsKVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgaWYgKHRoaXMucG9sbEZuKSB7XG4gICAgICAgICAgICB0aGlzLl9wb2xsID0gaW50ZXJ2YWwodGhpcy5wb2xsSW50ZXJ2YWwsICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB2ID0gdGhpcy5wb2xsRm4hKHRoaXMuZ2V0KCkpXG4gICAgICAgICAgICAgICAgaWYgKHYgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHYudGhlbih2ID0+IHRoaXMuc2V0KHYpKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB0aGlzLnZhcmlhYmxlLmVtaXQoXCJlcnJvclwiLCBlcnIpKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KHYpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnBvbGxFeGVjKSB7XG4gICAgICAgICAgICB0aGlzLl9wb2xsID0gaW50ZXJ2YWwodGhpcy5wb2xsSW50ZXJ2YWwsICgpID0+IHtcbiAgICAgICAgICAgICAgICBleGVjQXN5bmModGhpcy5wb2xsRXhlYyEpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKHYgPT4gdGhpcy5zZXQodGhpcy5wb2xsVHJhbnNmb3JtISh2LCB0aGlzLmdldCgpKSkpXG4gICAgICAgICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gdGhpcy52YXJpYWJsZS5lbWl0KFwiZXJyb3JcIiwgZXJyKSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGFydFdhdGNoKCkge1xuICAgICAgICBpZiAodGhpcy5fd2F0Y2gpXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICB0aGlzLl93YXRjaCA9IHN1YnByb2Nlc3Moe1xuICAgICAgICAgICAgY21kOiB0aGlzLndhdGNoRXhlYyEsXG4gICAgICAgICAgICBvdXQ6IG91dCA9PiB0aGlzLnNldCh0aGlzLndhdGNoVHJhbnNmb3JtIShvdXQsIHRoaXMuZ2V0KCkpKSxcbiAgICAgICAgICAgIGVycjogZXJyID0+IHRoaXMudmFyaWFibGUuZW1pdChcImVycm9yXCIsIGVyciksXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgc3RvcFBvbGwoKSB7XG4gICAgICAgIHRoaXMuX3BvbGw/LmNhbmNlbCgpXG4gICAgICAgIGRlbGV0ZSB0aGlzLl9wb2xsXG4gICAgfVxuXG4gICAgc3RvcFdhdGNoKCkge1xuICAgICAgICB0aGlzLl93YXRjaD8ua2lsbCgpXG4gICAgICAgIGRlbGV0ZSB0aGlzLl93YXRjaFxuICAgIH1cblxuICAgIGlzUG9sbGluZygpIHsgcmV0dXJuICEhdGhpcy5fcG9sbCB9XG4gICAgaXNXYXRjaGluZygpIHsgcmV0dXJuICEhdGhpcy5fd2F0Y2ggfVxuXG4gICAgZHJvcCgpIHtcbiAgICAgICAgdGhpcy52YXJpYWJsZS5lbWl0KFwiZHJvcHBlZFwiKVxuICAgIH1cblxuICAgIG9uRHJvcHBlZChjYWxsYmFjazogKCkgPT4gdm9pZCkge1xuICAgICAgICB0aGlzLnZhcmlhYmxlLmNvbm5lY3QoXCJkcm9wcGVkXCIsIGNhbGxiYWNrKVxuICAgICAgICByZXR1cm4gdGhpcyBhcyB1bmtub3duIGFzIFZhcmlhYmxlPFQ+XG4gICAgfVxuXG4gICAgb25FcnJvcihjYWxsYmFjazogKGVycjogc3RyaW5nKSA9PiB2b2lkKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmVyckhhbmRsZXJcbiAgICAgICAgdGhpcy52YXJpYWJsZS5jb25uZWN0KFwiZXJyb3JcIiwgKF8sIGVycikgPT4gY2FsbGJhY2soZXJyKSlcbiAgICAgICAgcmV0dXJuIHRoaXMgYXMgdW5rbm93biBhcyBWYXJpYWJsZTxUPlxuICAgIH1cblxuICAgIHN1YnNjcmliZShjYWxsYmFjazogKHZhbHVlOiBUKSA9PiB2b2lkKSB7XG4gICAgICAgIGNvbnN0IGlkID0gdGhpcy52YXJpYWJsZS5jb25uZWN0KFwiY2hhbmdlZFwiLCAoKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLmdldCgpKVxuICAgICAgICB9KVxuICAgICAgICByZXR1cm4gKCkgPT4gdGhpcy52YXJpYWJsZS5kaXNjb25uZWN0KGlkKVxuICAgIH1cblxuICAgIHBvbGwoXG4gICAgICAgIGludGVydmFsOiBudW1iZXIsXG4gICAgICAgIGV4ZWM6IHN0cmluZyB8IHN0cmluZ1tdLFxuICAgICAgICB0cmFuc2Zvcm0/OiAoc3Rkb3V0OiBzdHJpbmcsIHByZXY6IFQpID0+IFRcbiAgICApOiBWYXJpYWJsZTxUPlxuXG4gICAgcG9sbChcbiAgICAgICAgaW50ZXJ2YWw6IG51bWJlcixcbiAgICAgICAgY2FsbGJhY2s6IChwcmV2OiBUKSA9PiBUIHwgUHJvbWlzZTxUPlxuICAgICk6IFZhcmlhYmxlPFQ+XG5cbiAgICBwb2xsKFxuICAgICAgICBpbnRlcnZhbDogbnVtYmVyLFxuICAgICAgICBleGVjOiBzdHJpbmcgfCBzdHJpbmdbXSB8ICgocHJldjogVCkgPT4gVCB8IFByb21pc2U8VD4pLFxuICAgICAgICB0cmFuc2Zvcm06IChzdGRvdXQ6IHN0cmluZywgcHJldjogVCkgPT4gVCA9IG91dCA9PiBvdXQgYXMgVCxcbiAgICApIHtcbiAgICAgICAgdGhpcy5zdG9wUG9sbCgpXG4gICAgICAgIHRoaXMucG9sbEludGVydmFsID0gaW50ZXJ2YWxcbiAgICAgICAgdGhpcy5wb2xsVHJhbnNmb3JtID0gdHJhbnNmb3JtXG4gICAgICAgIGlmICh0eXBlb2YgZXhlYyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aGlzLnBvbGxGbiA9IGV4ZWNcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnBvbGxFeGVjXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnBvbGxFeGVjID0gZXhlY1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMucG9sbEZuXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdGFydFBvbGwoKVxuICAgICAgICByZXR1cm4gdGhpcyBhcyB1bmtub3duIGFzIFZhcmlhYmxlPFQ+XG4gICAgfVxuXG4gICAgd2F0Y2goXG4gICAgICAgIGV4ZWM6IHN0cmluZyB8IHN0cmluZ1tdLFxuICAgICAgICB0cmFuc2Zvcm06IChzdGRvdXQ6IHN0cmluZywgcHJldjogVCkgPT4gVCA9IG91dCA9PiBvdXQgYXMgVCxcbiAgICApIHtcbiAgICAgICAgdGhpcy5zdG9wV2F0Y2goKVxuICAgICAgICB0aGlzLndhdGNoRXhlYyA9IGV4ZWNcbiAgICAgICAgdGhpcy53YXRjaFRyYW5zZm9ybSA9IHRyYW5zZm9ybVxuICAgICAgICB0aGlzLnN0YXJ0V2F0Y2goKVxuICAgICAgICByZXR1cm4gdGhpcyBhcyB1bmtub3duIGFzIFZhcmlhYmxlPFQ+XG4gICAgfVxuXG4gICAgb2JzZXJ2ZShcbiAgICAgICAgb2JqczogQXJyYXk8W29iajogQ29ubmVjdGFibGUsIHNpZ25hbDogc3RyaW5nXT4sXG4gICAgICAgIGNhbGxiYWNrOiAoLi4uYXJnczogYW55W10pID0+IFQsXG4gICAgKTogVmFyaWFibGU8VD5cblxuICAgIG9ic2VydmUoXG4gICAgICAgIG9iajogQ29ubmVjdGFibGUsXG4gICAgICAgIHNpZ25hbDogc3RyaW5nLFxuICAgICAgICBjYWxsYmFjazogKC4uLmFyZ3M6IGFueVtdKSA9PiBULFxuICAgICk6IFZhcmlhYmxlPFQ+XG5cbiAgICBvYnNlcnZlKFxuICAgICAgICBvYmpzOiBDb25uZWN0YWJsZSB8IEFycmF5PFtvYmo6IENvbm5lY3RhYmxlLCBzaWduYWw6IHN0cmluZ10+LFxuICAgICAgICBzaWdPckZuOiBzdHJpbmcgfCAoKG9iajogQ29ubmVjdGFibGUsIC4uLmFyZ3M6IGFueVtdKSA9PiBUKSxcbiAgICAgICAgY2FsbGJhY2s/OiAob2JqOiBDb25uZWN0YWJsZSwgLi4uYXJnczogYW55W10pID0+IFQsXG4gICAgKSB7XG4gICAgICAgIGNvbnN0IGYgPSB0eXBlb2Ygc2lnT3JGbiA9PT0gXCJmdW5jdGlvblwiID8gc2lnT3JGbiA6IGNhbGxiYWNrID8/ICgoKSA9PiB0aGlzLmdldCgpKVxuICAgICAgICBjb25zdCBzZXQgPSAob2JqOiBDb25uZWN0YWJsZSwgLi4uYXJnczogYW55W10pID0+IHRoaXMuc2V0KGYob2JqLCAuLi5hcmdzKSlcblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvYmpzKSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBvYmogb2Ygb2Jqcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IFtvLCBzXSA9IG9ialxuICAgICAgICAgICAgICAgIGNvbnN0IGlkID0gby5jb25uZWN0KHMsIHNldClcbiAgICAgICAgICAgICAgICB0aGlzLm9uRHJvcHBlZCgoKSA9PiBvLmRpc2Nvbm5lY3QoaWQpKVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBzaWdPckZuID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaWQgPSBvYmpzLmNvbm5lY3Qoc2lnT3JGbiwgc2V0KVxuICAgICAgICAgICAgICAgIHRoaXMub25Ecm9wcGVkKCgpID0+IG9ianMuZGlzY29ubmVjdChpZCkpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcyBhcyB1bmtub3duIGFzIFZhcmlhYmxlPFQ+XG4gICAgfVxuXG4gICAgc3RhdGljIGRlcml2ZTxcbiAgICAgICAgY29uc3QgRGVwcyBleHRlbmRzIEFycmF5PFN1YnNjcmliYWJsZTxhbnk+PixcbiAgICAgICAgQXJncyBleHRlbmRzIHtcbiAgICAgICAgICAgIFtLIGluIGtleW9mIERlcHNdOiBEZXBzW0tdIGV4dGVuZHMgU3Vic2NyaWJhYmxlPGluZmVyIFQ+ID8gVCA6IG5ldmVyXG4gICAgICAgIH0sXG4gICAgICAgIFYgPSBBcmdzLFxuICAgID4oZGVwczogRGVwcywgZm46ICguLi5hcmdzOiBBcmdzKSA9PiBWID0gKC4uLmFyZ3MpID0+IGFyZ3MgYXMgdW5rbm93biBhcyBWKSB7XG4gICAgICAgIGNvbnN0IHVwZGF0ZSA9ICgpID0+IGZuKC4uLmRlcHMubWFwKGQgPT4gZC5nZXQoKSkgYXMgQXJncylcbiAgICAgICAgY29uc3QgZGVyaXZlZCA9IG5ldyBWYXJpYWJsZSh1cGRhdGUoKSlcbiAgICAgICAgY29uc3QgdW5zdWJzID0gZGVwcy5tYXAoZGVwID0+IGRlcC5zdWJzY3JpYmUoKCkgPT4gZGVyaXZlZC5zZXQodXBkYXRlKCkpKSlcbiAgICAgICAgZGVyaXZlZC5vbkRyb3BwZWQoKCkgPT4gdW5zdWJzLm1hcCh1bnN1YiA9PiB1bnN1YigpKSlcbiAgICAgICAgcmV0dXJuIGRlcml2ZWRcbiAgICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVmFyaWFibGU8VD4gZXh0ZW5kcyBPbWl0PFZhcmlhYmxlV3JhcHBlcjxUPiwgXCJiaW5kXCI+IHtcbiAgICA8Uj4odHJhbnNmb3JtOiAodmFsdWU6IFQpID0+IFIpOiBCaW5kaW5nPFI+XG4gICAgKCk6IEJpbmRpbmc8VD5cbn1cblxuZXhwb3J0IGNvbnN0IFZhcmlhYmxlID0gbmV3IFByb3h5KFZhcmlhYmxlV3JhcHBlciBhcyBhbnksIHtcbiAgICBhcHBseTogKF90LCBfYSwgYXJncykgPT4gbmV3IFZhcmlhYmxlV3JhcHBlcihhcmdzWzBdKSxcbn0pIGFzIHtcbiAgICBkZXJpdmU6IHR5cGVvZiBWYXJpYWJsZVdyYXBwZXJbXCJkZXJpdmVcIl1cbiAgICA8VD4oaW5pdDogVCk6IFZhcmlhYmxlPFQ+XG4gICAgbmV3PFQ+KGluaXQ6IFQpOiBWYXJpYWJsZTxUPlxufVxuXG5leHBvcnQgY29uc3QgeyBkZXJpdmUgfSA9IFZhcmlhYmxlXG5leHBvcnQgZGVmYXVsdCBWYXJpYWJsZVxuIiwgImV4cG9ydCBjb25zdCBzbmFrZWlmeSA9IChzdHI6IHN0cmluZykgPT4gc3RyXG4gICAgLnJlcGxhY2UoLyhbYS16XSkoW0EtWl0pL2csIFwiJDFfJDJcIilcbiAgICAucmVwbGFjZUFsbChcIi1cIiwgXCJfXCIpXG4gICAgLnRvTG93ZXJDYXNlKClcblxuZXhwb3J0IGNvbnN0IGtlYmFiaWZ5ID0gKHN0cjogc3RyaW5nKSA9PiBzdHJcbiAgICAucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgXCIkMS0kMlwiKVxuICAgIC5yZXBsYWNlQWxsKFwiX1wiLCBcIi1cIilcbiAgICAudG9Mb3dlckNhc2UoKVxuXG5leHBvcnQgaW50ZXJmYWNlIFN1YnNjcmliYWJsZTxUID0gdW5rbm93bj4ge1xuICAgIHN1YnNjcmliZShjYWxsYmFjazogKHZhbHVlOiBUKSA9PiB2b2lkKTogKCkgPT4gdm9pZFxuICAgIGdldCgpOiBUXG4gICAgW2tleTogc3RyaW5nXTogYW55XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29ubmVjdGFibGUge1xuICAgIGNvbm5lY3Qoc2lnbmFsOiBzdHJpbmcsIGNhbGxiYWNrOiAoLi4uYXJnczogYW55W10pID0+IHVua25vd24pOiBudW1iZXJcbiAgICBkaXNjb25uZWN0KGlkOiBudW1iZXIpOiB2b2lkXG4gICAgW2tleTogc3RyaW5nXTogYW55XG59XG5cbmV4cG9ydCBjbGFzcyBCaW5kaW5nPFZhbHVlPiB7XG4gICAgcHJpdmF0ZSB0cmFuc2Zvcm1GbiA9ICh2OiBhbnkpID0+IHZcblxuICAgICNlbWl0dGVyOiBTdWJzY3JpYmFibGU8VmFsdWU+IHwgQ29ubmVjdGFibGVcbiAgICAjcHJvcD86IHN0cmluZ1xuXG4gICAgc3RhdGljIGJpbmQ8XG4gICAgICAgIFQgZXh0ZW5kcyBDb25uZWN0YWJsZSxcbiAgICAgICAgUCBleHRlbmRzIGtleW9mIFQsXG4gICAgPihvYmplY3Q6IFQsIHByb3BlcnR5OiBQKTogQmluZGluZzxUW1BdPlxuXG4gICAgc3RhdGljIGJpbmQ8VD4ob2JqZWN0OiBTdWJzY3JpYmFibGU8VD4pOiBCaW5kaW5nPFQ+XG5cbiAgICBzdGF0aWMgYmluZChlbWl0dGVyOiBDb25uZWN0YWJsZSB8IFN1YnNjcmliYWJsZSwgcHJvcD86IHN0cmluZykge1xuICAgICAgICByZXR1cm4gbmV3IEJpbmRpbmcoZW1pdHRlciwgcHJvcClcbiAgICB9XG5cbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKGVtaXR0ZXI6IENvbm5lY3RhYmxlIHwgU3Vic2NyaWJhYmxlPFZhbHVlPiwgcHJvcD86IHN0cmluZykge1xuICAgICAgICB0aGlzLiNlbWl0dGVyID0gZW1pdHRlclxuICAgICAgICB0aGlzLiNwcm9wID0gcHJvcCAmJiBrZWJhYmlmeShwcm9wKVxuICAgIH1cblxuICAgIHRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gYEJpbmRpbmc8JHt0aGlzLiNlbWl0dGVyfSR7dGhpcy4jcHJvcCA/IGAsIFwiJHt0aGlzLiNwcm9wfVwiYCA6IFwiXCJ9PmBcbiAgICB9XG5cbiAgICBhczxUPihmbjogKHY6IFZhbHVlKSA9PiBUKTogQmluZGluZzxUPiB7XG4gICAgICAgIGNvbnN0IGJpbmQgPSBuZXcgQmluZGluZyh0aGlzLiNlbWl0dGVyLCB0aGlzLiNwcm9wKVxuICAgICAgICBiaW5kLnRyYW5zZm9ybUZuID0gKHY6IFZhbHVlKSA9PiBmbih0aGlzLnRyYW5zZm9ybUZuKHYpKVxuICAgICAgICByZXR1cm4gYmluZCBhcyB1bmtub3duIGFzIEJpbmRpbmc8VD5cbiAgICB9XG5cbiAgICBnZXQoKTogVmFsdWUge1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMuI2VtaXR0ZXIuZ2V0ID09PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy50cmFuc2Zvcm1Gbih0aGlzLiNlbWl0dGVyLmdldCgpKVxuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy4jcHJvcCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgY29uc3QgZ2V0dGVyID0gYGdldF8ke3NuYWtlaWZ5KHRoaXMuI3Byb3ApfWBcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy4jZW1pdHRlcltnZXR0ZXJdID09PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNmb3JtRm4odGhpcy4jZW1pdHRlcltnZXR0ZXJdKCkpXG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRyYW5zZm9ybUZuKHRoaXMuI2VtaXR0ZXJbdGhpcy4jcHJvcF0pXG4gICAgICAgIH1cblxuICAgICAgICB0aHJvdyBFcnJvcihcImNhbiBub3QgZ2V0IHZhbHVlIG9mIGJpbmRpbmdcIilcbiAgICB9XG5cbiAgICBzdWJzY3JpYmUoY2FsbGJhY2s6ICh2YWx1ZTogVmFsdWUpID0+IHZvaWQpOiAoKSA9PiB2b2lkIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLiNlbWl0dGVyLnN1YnNjcmliZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy4jZW1pdHRlci5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMuZ2V0KCkpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzLiNlbWl0dGVyLmNvbm5lY3QgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgY29uc3Qgc2lnbmFsID0gYG5vdGlmeTo6JHt0aGlzLiNwcm9wfWBcbiAgICAgICAgICAgIGNvbnN0IGlkID0gdGhpcy4jZW1pdHRlci5jb25uZWN0KHNpZ25hbCwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMuZ2V0KCkpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgICAgICAodGhpcy4jZW1pdHRlci5kaXNjb25uZWN0IGFzIENvbm5lY3RhYmxlW1wiZGlzY29ubmVjdFwiXSkoaWQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgRXJyb3IoYCR7dGhpcy4jZW1pdHRlcn0gaXMgbm90IGJpbmRhYmxlYClcbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCB7IGJpbmQgfSA9IEJpbmRpbmdcbmV4cG9ydCBkZWZhdWx0IEJpbmRpbmdcbiIsICJpbXBvcnQgQXN0YWwgZnJvbSBcImdpOi8vQXN0YWxJT1wiXG5cbmV4cG9ydCB0eXBlIFRpbWUgPSBBc3RhbC5UaW1lXG5leHBvcnQgY29uc3QgVGltZSA9IEFzdGFsLlRpbWVcblxuZXhwb3J0IGZ1bmN0aW9uIGludGVydmFsKGludGVydmFsOiBudW1iZXIsIGNhbGxiYWNrPzogKCkgPT4gdm9pZCkge1xuICAgIHJldHVybiBBc3RhbC5UaW1lLmludGVydmFsKGludGVydmFsLCAoKSA9PiB2b2lkIGNhbGxiYWNrPy4oKSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRpbWVvdXQodGltZW91dDogbnVtYmVyLCBjYWxsYmFjaz86ICgpID0+IHZvaWQpIHtcbiAgICByZXR1cm4gQXN0YWwuVGltZS50aW1lb3V0KHRpbWVvdXQsICgpID0+IHZvaWQgY2FsbGJhY2s/LigpKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaWRsZShjYWxsYmFjaz86ICgpID0+IHZvaWQpIHtcbiAgICByZXR1cm4gQXN0YWwuVGltZS5pZGxlKCgpID0+IHZvaWQgY2FsbGJhY2s/LigpKVxufVxuIiwgImltcG9ydCBBc3RhbCBmcm9tIFwiZ2k6Ly9Bc3RhbElPXCJcblxudHlwZSBBcmdzID0ge1xuICAgIGNtZDogc3RyaW5nIHwgc3RyaW5nW11cbiAgICBvdXQ/OiAoc3Rkb3V0OiBzdHJpbmcpID0+IHZvaWRcbiAgICBlcnI/OiAoc3RkZXJyOiBzdHJpbmcpID0+IHZvaWRcbn1cblxuZXhwb3J0IHR5cGUgUHJvY2VzcyA9IEFzdGFsLlByb2Nlc3NcbmV4cG9ydCBjb25zdCBQcm9jZXNzID0gQXN0YWwuUHJvY2Vzc1xuXG5leHBvcnQgZnVuY3Rpb24gc3VicHJvY2VzcyhhcmdzOiBBcmdzKTogQXN0YWwuUHJvY2Vzc1xuXG5leHBvcnQgZnVuY3Rpb24gc3VicHJvY2VzcyhcbiAgICBjbWQ6IHN0cmluZyB8IHN0cmluZ1tdLFxuICAgIG9uT3V0PzogKHN0ZG91dDogc3RyaW5nKSA9PiB2b2lkLFxuICAgIG9uRXJyPzogKHN0ZGVycjogc3RyaW5nKSA9PiB2b2lkLFxuKTogQXN0YWwuUHJvY2Vzc1xuXG5leHBvcnQgZnVuY3Rpb24gc3VicHJvY2VzcyhcbiAgICBhcmdzT3JDbWQ6IEFyZ3MgfCBzdHJpbmcgfCBzdHJpbmdbXSxcbiAgICBvbk91dDogKHN0ZG91dDogc3RyaW5nKSA9PiB2b2lkID0gcHJpbnQsXG4gICAgb25FcnI6IChzdGRlcnI6IHN0cmluZykgPT4gdm9pZCA9IHByaW50ZXJyLFxuKSB7XG4gICAgY29uc3QgYXJncyA9IEFycmF5LmlzQXJyYXkoYXJnc09yQ21kKSB8fCB0eXBlb2YgYXJnc09yQ21kID09PSBcInN0cmluZ1wiXG4gICAgY29uc3QgeyBjbWQsIGVyciwgb3V0IH0gPSB7XG4gICAgICAgIGNtZDogYXJncyA/IGFyZ3NPckNtZCA6IGFyZ3NPckNtZC5jbWQsXG4gICAgICAgIGVycjogYXJncyA/IG9uRXJyIDogYXJnc09yQ21kLmVyciB8fCBvbkVycixcbiAgICAgICAgb3V0OiBhcmdzID8gb25PdXQgOiBhcmdzT3JDbWQub3V0IHx8IG9uT3V0LFxuICAgIH1cblxuICAgIGNvbnN0IHByb2MgPSBBcnJheS5pc0FycmF5KGNtZClcbiAgICAgICAgPyBBc3RhbC5Qcm9jZXNzLnN1YnByb2Nlc3N2KGNtZClcbiAgICAgICAgOiBBc3RhbC5Qcm9jZXNzLnN1YnByb2Nlc3MoY21kKVxuXG4gICAgcHJvYy5jb25uZWN0KFwic3Rkb3V0XCIsIChfLCBzdGRvdXQ6IHN0cmluZykgPT4gb3V0KHN0ZG91dCkpXG4gICAgcHJvYy5jb25uZWN0KFwic3RkZXJyXCIsIChfLCBzdGRlcnI6IHN0cmluZykgPT4gZXJyKHN0ZGVycikpXG4gICAgcmV0dXJuIHByb2Ncbn1cblxuLyoqIEB0aHJvd3Mge0dMaWIuRXJyb3J9IFRocm93cyBzdGRlcnIgKi9cbmV4cG9ydCBmdW5jdGlvbiBleGVjKGNtZDogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheShjbWQpXG4gICAgICAgID8gQXN0YWwuUHJvY2Vzcy5leGVjdihjbWQpXG4gICAgICAgIDogQXN0YWwuUHJvY2Vzcy5leGVjKGNtZClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4ZWNBc3luYyhjbWQ6IHN0cmluZyB8IHN0cmluZ1tdKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjbWQpKSB7XG4gICAgICAgICAgICBBc3RhbC5Qcm9jZXNzLmV4ZWNfYXN5bmN2KGNtZCwgKF8sIHJlcykgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoQXN0YWwuUHJvY2Vzcy5leGVjX2FzeW5jdl9maW5pc2gocmVzKSlcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIEFzdGFsLlByb2Nlc3MuZXhlY19hc3luYyhjbWQsIChfLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKEFzdGFsLlByb2Nlc3MuZXhlY19maW5pc2gocmVzKSlcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH0pXG59XG4iLCAiaW1wb3J0IFZhcmlhYmxlIGZyb20gXCIuL3ZhcmlhYmxlLmpzXCJcbmltcG9ydCB7IGV4ZWNBc3luYyB9IGZyb20gXCIuL3Byb2Nlc3MuanNcIlxuaW1wb3J0IEJpbmRpbmcsIHsgQ29ubmVjdGFibGUsIGtlYmFiaWZ5LCBzbmFrZWlmeSwgU3Vic2NyaWJhYmxlIH0gZnJvbSBcIi4vYmluZGluZy5qc1wiXG5cbmV4cG9ydCBjb25zdCBub0ltcGxpY2l0RGVzdHJveSA9IFN5bWJvbChcIm5vIG5vIGltcGxpY2l0IGRlc3Ryb3lcIilcbmV4cG9ydCBjb25zdCBzZXRDaGlsZHJlbiA9IFN5bWJvbChcImNoaWxkcmVuIHNldHRlciBtZXRob2RcIilcblxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlQmluZGluZ3MoYXJyYXk6IGFueVtdKSB7XG4gICAgZnVuY3Rpb24gZ2V0VmFsdWVzKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgIGxldCBpID0gMFxuICAgICAgICByZXR1cm4gYXJyYXkubWFwKHZhbHVlID0+IHZhbHVlIGluc3RhbmNlb2YgQmluZGluZ1xuICAgICAgICAgICAgPyBhcmdzW2krK11cbiAgICAgICAgICAgIDogdmFsdWUsXG4gICAgICAgIClcbiAgICB9XG5cbiAgICBjb25zdCBiaW5kaW5ncyA9IGFycmF5LmZpbHRlcihpID0+IGkgaW5zdGFuY2VvZiBCaW5kaW5nKVxuXG4gICAgaWYgKGJpbmRpbmdzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgcmV0dXJuIGFycmF5XG5cbiAgICBpZiAoYmluZGluZ3MubGVuZ3RoID09PSAxKVxuICAgICAgICByZXR1cm4gYmluZGluZ3NbMF0uYXMoZ2V0VmFsdWVzKVxuXG4gICAgcmV0dXJuIFZhcmlhYmxlLmRlcml2ZShiaW5kaW5ncywgZ2V0VmFsdWVzKSgpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRQcm9wKG9iajogYW55LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBzZXR0ZXIgPSBgc2V0XyR7c25ha2VpZnkocHJvcCl9YFxuICAgICAgICBpZiAodHlwZW9mIG9ialtzZXR0ZXJdID09PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICByZXR1cm4gb2JqW3NldHRlcl0odmFsdWUpXG5cbiAgICAgICAgcmV0dXJuIChvYmpbcHJvcF0gPSB2YWx1ZSlcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBjb3VsZCBub3Qgc2V0IHByb3BlcnR5IFwiJHtwcm9wfVwiIG9uICR7b2JqfTpgLCBlcnJvcilcbiAgICB9XG59XG5cbmV4cG9ydCB0eXBlIEJpbmRhYmxlUHJvcHM8VD4gPSB7XG4gICAgW0sgaW4ga2V5b2YgVF06IEJpbmRpbmc8VFtLXT4gfCBUW0tdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaG9vazxXaWRnZXQgZXh0ZW5kcyBDb25uZWN0YWJsZT4oXG4gICAgd2lkZ2V0OiBXaWRnZXQsXG4gICAgb2JqZWN0OiBDb25uZWN0YWJsZSB8IFN1YnNjcmliYWJsZSxcbiAgICBzaWduYWxPckNhbGxiYWNrOiBzdHJpbmcgfCAoKHNlbGY6IFdpZGdldCwgLi4uYXJnczogYW55W10pID0+IHZvaWQpLFxuICAgIGNhbGxiYWNrPzogKHNlbGY6IFdpZGdldCwgLi4uYXJnczogYW55W10pID0+IHZvaWQsXG4pIHtcbiAgICBpZiAodHlwZW9mIG9iamVjdC5jb25uZWN0ID09PSBcImZ1bmN0aW9uXCIgJiYgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgaWQgPSBvYmplY3QuY29ubmVjdChzaWduYWxPckNhbGxiYWNrLCAoXzogYW55LCAuLi5hcmdzOiB1bmtub3duW10pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayh3aWRnZXQsIC4uLmFyZ3MpXG4gICAgICAgIH0pXG4gICAgICAgIHdpZGdldC5jb25uZWN0KFwiZGVzdHJveVwiLCAoKSA9PiB7XG4gICAgICAgICAgICAob2JqZWN0LmRpc2Nvbm5lY3QgYXMgQ29ubmVjdGFibGVbXCJkaXNjb25uZWN0XCJdKShpZClcbiAgICAgICAgfSlcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBvYmplY3Quc3Vic2NyaWJlID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIHNpZ25hbE9yQ2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBjb25zdCB1bnN1YiA9IG9iamVjdC5zdWJzY3JpYmUoKC4uLmFyZ3M6IHVua25vd25bXSkgPT4ge1xuICAgICAgICAgICAgc2lnbmFsT3JDYWxsYmFjayh3aWRnZXQsIC4uLmFyZ3MpXG4gICAgICAgIH0pXG4gICAgICAgIHdpZGdldC5jb25uZWN0KFwiZGVzdHJveVwiLCB1bnN1YilcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25zdHJ1Y3Q8V2lkZ2V0IGV4dGVuZHMgQ29ubmVjdGFibGUgJiB7IFtzZXRDaGlsZHJlbl06IChjaGlsZHJlbjogYW55W10pID0+IHZvaWQgfT4od2lkZ2V0OiBXaWRnZXQsIGNvbmZpZzogYW55KSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHByZWZlci1jb25zdFxuICAgIGxldCB7IHNldHVwLCBjaGlsZCwgY2hpbGRyZW4gPSBbXSwgLi4ucHJvcHMgfSA9IGNvbmZpZ1xuXG4gICAgaWYgKGNoaWxkcmVuIGluc3RhbmNlb2YgQmluZGluZykge1xuICAgICAgICBjaGlsZHJlbiA9IFtjaGlsZHJlbl1cbiAgICB9XG5cbiAgICBpZiAoY2hpbGQpIHtcbiAgICAgICAgY2hpbGRyZW4udW5zaGlmdChjaGlsZClcbiAgICB9XG5cbiAgICAvLyByZW1vdmUgdW5kZWZpbmVkIHZhbHVlc1xuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHByb3BzKSkge1xuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZGVsZXRlIHByb3BzW2tleV1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGNvbGxlY3QgYmluZGluZ3NcbiAgICBjb25zdCBiaW5kaW5nczogQXJyYXk8W3N0cmluZywgQmluZGluZzxhbnk+XT4gPSBPYmplY3RcbiAgICAgICAgLmtleXMocHJvcHMpXG4gICAgICAgIC5yZWR1Y2UoKGFjYzogYW55LCBwcm9wKSA9PiB7XG4gICAgICAgICAgICBpZiAocHJvcHNbcHJvcF0gaW5zdGFuY2VvZiBCaW5kaW5nKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYmluZGluZyA9IHByb3BzW3Byb3BdXG4gICAgICAgICAgICAgICAgZGVsZXRlIHByb3BzW3Byb3BdXG4gICAgICAgICAgICAgICAgcmV0dXJuIFsuLi5hY2MsIFtwcm9wLCBiaW5kaW5nXV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhY2NcbiAgICAgICAgfSwgW10pXG5cbiAgICAvLyBjb2xsZWN0IHNpZ25hbCBoYW5kbGVyc1xuICAgIGNvbnN0IG9uSGFuZGxlcnM6IEFycmF5PFtzdHJpbmcsIHN0cmluZyB8ICgoKSA9PiB1bmtub3duKV0+ID0gT2JqZWN0XG4gICAgICAgIC5rZXlzKHByb3BzKVxuICAgICAgICAucmVkdWNlKChhY2M6IGFueSwga2V5KSA9PiB7XG4gICAgICAgICAgICBpZiAoa2V5LnN0YXJ0c1dpdGgoXCJvblwiKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNpZyA9IGtlYmFiaWZ5KGtleSkuc3BsaXQoXCItXCIpLnNsaWNlKDEpLmpvaW4oXCItXCIpXG4gICAgICAgICAgICAgICAgY29uc3QgaGFuZGxlciA9IHByb3BzW2tleV1cbiAgICAgICAgICAgICAgICBkZWxldGUgcHJvcHNba2V5XVxuICAgICAgICAgICAgICAgIHJldHVybiBbLi4uYWNjLCBbc2lnLCBoYW5kbGVyXV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhY2NcbiAgICAgICAgfSwgW10pXG5cbiAgICAvLyBzZXQgY2hpbGRyZW5cbiAgICBjb25zdCBtZXJnZWRDaGlsZHJlbiA9IG1lcmdlQmluZGluZ3MoY2hpbGRyZW4uZmxhdChJbmZpbml0eSkpXG4gICAgaWYgKG1lcmdlZENoaWxkcmVuIGluc3RhbmNlb2YgQmluZGluZykge1xuICAgICAgICB3aWRnZXRbc2V0Q2hpbGRyZW5dKG1lcmdlZENoaWxkcmVuLmdldCgpKVxuICAgICAgICB3aWRnZXQuY29ubmVjdChcImRlc3Ryb3lcIiwgbWVyZ2VkQ2hpbGRyZW4uc3Vic2NyaWJlKCh2KSA9PiB7XG4gICAgICAgICAgICB3aWRnZXRbc2V0Q2hpbGRyZW5dKHYpXG4gICAgICAgIH0pKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChtZXJnZWRDaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB3aWRnZXRbc2V0Q2hpbGRyZW5dKG1lcmdlZENoaWxkcmVuKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gc2V0dXAgc2lnbmFsIGhhbmRsZXJzXG4gICAgZm9yIChjb25zdCBbc2lnbmFsLCBjYWxsYmFja10gb2Ygb25IYW5kbGVycykge1xuICAgICAgICBjb25zdCBzaWcgPSBzaWduYWwuc3RhcnRzV2l0aChcIm5vdGlmeVwiKVxuICAgICAgICAgICAgPyBzaWduYWwucmVwbGFjZShcIi1cIiwgXCI6OlwiKVxuICAgICAgICAgICAgOiBzaWduYWxcblxuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHdpZGdldC5jb25uZWN0KHNpZywgY2FsbGJhY2spXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB3aWRnZXQuY29ubmVjdChzaWcsICgpID0+IGV4ZWNBc3luYyhjYWxsYmFjaylcbiAgICAgICAgICAgICAgICAudGhlbihwcmludCkuY2F0Y2goY29uc29sZS5lcnJvcikpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBzZXR1cCBiaW5kaW5ncyBoYW5kbGVyc1xuICAgIGZvciAoY29uc3QgW3Byb3AsIGJpbmRpbmddIG9mIGJpbmRpbmdzKSB7XG4gICAgICAgIGlmIChwcm9wID09PSBcImNoaWxkXCIgfHwgcHJvcCA9PT0gXCJjaGlsZHJlblwiKSB7XG4gICAgICAgICAgICB3aWRnZXQuY29ubmVjdChcImRlc3Ryb3lcIiwgYmluZGluZy5zdWJzY3JpYmUoKHY6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHdpZGdldFtzZXRDaGlsZHJlbl0odilcbiAgICAgICAgICAgIH0pKVxuICAgICAgICB9XG4gICAgICAgIHdpZGdldC5jb25uZWN0KFwiZGVzdHJveVwiLCBiaW5kaW5nLnN1YnNjcmliZSgodjogYW55KSA9PiB7XG4gICAgICAgICAgICBzZXRQcm9wKHdpZGdldCwgcHJvcCwgdilcbiAgICAgICAgfSkpXG4gICAgICAgIHNldFByb3Aod2lkZ2V0LCBwcm9wLCBiaW5kaW5nLmdldCgpKVxuICAgIH1cblxuICAgIC8vIGZpbHRlciB1bmRlZmluZWQgdmFsdWVzXG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMocHJvcHMpKSB7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBkZWxldGUgcHJvcHNba2V5XVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgT2JqZWN0LmFzc2lnbih3aWRnZXQsIHByb3BzKVxuICAgIHNldHVwPy4od2lkZ2V0KVxuICAgIHJldHVybiB3aWRnZXRcbn1cblxuZnVuY3Rpb24gaXNBcnJvd0Z1bmN0aW9uKGZ1bmM6IGFueSk6IGZ1bmMgaXMgKGFyZ3M6IGFueSkgPT4gYW55IHtcbiAgICByZXR1cm4gIU9iamVjdC5oYXNPd24oZnVuYywgXCJwcm90b3R5cGVcIilcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGpzeChcbiAgICBjdG9yczogUmVjb3JkPHN0cmluZywgeyBuZXcocHJvcHM6IGFueSk6IGFueSB9IHwgKChwcm9wczogYW55KSA9PiBhbnkpPixcbiAgICBjdG9yOiBzdHJpbmcgfCAoKHByb3BzOiBhbnkpID0+IGFueSkgfCB7IG5ldyhwcm9wczogYW55KTogYW55IH0sXG4gICAgeyBjaGlsZHJlbiwgLi4ucHJvcHMgfTogYW55LFxuKSB7XG4gICAgY2hpbGRyZW4gPz89IFtdXG5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoY2hpbGRyZW4pKVxuICAgICAgICBjaGlsZHJlbiA9IFtjaGlsZHJlbl1cblxuICAgIGNoaWxkcmVuID0gY2hpbGRyZW4uZmlsdGVyKEJvb2xlYW4pXG5cbiAgICBpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAxKVxuICAgICAgICBwcm9wcy5jaGlsZCA9IGNoaWxkcmVuWzBdXG4gICAgZWxzZSBpZiAoY2hpbGRyZW4ubGVuZ3RoID4gMSlcbiAgICAgICAgcHJvcHMuY2hpbGRyZW4gPSBjaGlsZHJlblxuXG4gICAgaWYgKHR5cGVvZiBjdG9yID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGlmIChpc0Fycm93RnVuY3Rpb24oY3RvcnNbY3Rvcl0pKVxuICAgICAgICAgICAgcmV0dXJuIGN0b3JzW2N0b3JdKHByb3BzKVxuXG4gICAgICAgIHJldHVybiBuZXcgY3RvcnNbY3Rvcl0ocHJvcHMpXG4gICAgfVxuXG4gICAgaWYgKGlzQXJyb3dGdW5jdGlvbihjdG9yKSlcbiAgICAgICAgcmV0dXJuIGN0b3IocHJvcHMpXG5cbiAgICByZXR1cm4gbmV3IGN0b3IocHJvcHMpXG59XG4iLCAiaW1wb3J0IHsgaG9vaywgbm9JbXBsaWNpdERlc3Ryb3ksIHNldENoaWxkcmVuLCBtZXJnZUJpbmRpbmdzLCB0eXBlIEJpbmRhYmxlUHJvcHMsIGNvbnN0cnVjdCB9IGZyb20gXCIuLi9fYXN0YWwuanNcIlxuaW1wb3J0IEFzdGFsIGZyb20gXCJnaTovL0FzdGFsP3ZlcnNpb249My4wXCJcbmltcG9ydCBHdGsgZnJvbSBcImdpOi8vR3RrP3ZlcnNpb249My4wXCJcbmltcG9ydCBHZGsgZnJvbSBcImdpOi8vR2RrP3ZlcnNpb249My4wXCJcbmltcG9ydCBHT2JqZWN0IGZyb20gXCJnaTovL0dPYmplY3RcIlxuaW1wb3J0IEdpbyBmcm9tIFwiZ2k6Ly9HaW8/dmVyc2lvbj0yLjBcIlxuaW1wb3J0IEJpbmRpbmcsIHsgdHlwZSBDb25uZWN0YWJsZSwgdHlwZSBTdWJzY3JpYmFibGUgfSBmcm9tIFwiLi4vYmluZGluZy5qc1wiXG5cbmV4cG9ydCB7IEJpbmRhYmxlUHJvcHMsIG1lcmdlQmluZGluZ3MgfVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBhc3RhbGlmeTxcbiAgICBDIGV4dGVuZHMgeyBuZXcoLi4uYXJnczogYW55W10pOiBHdGsuV2lkZ2V0IH0sXG4+KGNsczogQywgY2xzTmFtZSA9IGNscy5uYW1lKSB7XG4gICAgY2xhc3MgV2lkZ2V0IGV4dGVuZHMgY2xzIHtcbiAgICAgICAgZ2V0IGNzcygpOiBzdHJpbmcgeyByZXR1cm4gQXN0YWwud2lkZ2V0X2dldF9jc3ModGhpcykgfVxuICAgICAgICBzZXQgY3NzKGNzczogc3RyaW5nKSB7IEFzdGFsLndpZGdldF9zZXRfY3NzKHRoaXMsIGNzcykgfVxuICAgICAgICBnZXRfY3NzKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLmNzcyB9XG4gICAgICAgIHNldF9jc3MoY3NzOiBzdHJpbmcpIHsgdGhpcy5jc3MgPSBjc3MgfVxuXG4gICAgICAgIGdldCBjbGFzc05hbWUoKTogc3RyaW5nIHsgcmV0dXJuIEFzdGFsLndpZGdldF9nZXRfY2xhc3NfbmFtZXModGhpcykuam9pbihcIiBcIikgfVxuICAgICAgICBzZXQgY2xhc3NOYW1lKGNsYXNzTmFtZTogc3RyaW5nKSB7IEFzdGFsLndpZGdldF9zZXRfY2xhc3NfbmFtZXModGhpcywgY2xhc3NOYW1lLnNwbGl0KC9cXHMrLykpIH1cbiAgICAgICAgZ2V0X2NsYXNzX25hbWUoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuY2xhc3NOYW1lIH1cbiAgICAgICAgc2V0X2NsYXNzX25hbWUoY2xhc3NOYW1lOiBzdHJpbmcpIHsgdGhpcy5jbGFzc05hbWUgPSBjbGFzc05hbWUgfVxuXG4gICAgICAgIGdldCBjdXJzb3IoKTogQ3Vyc29yIHsgcmV0dXJuIEFzdGFsLndpZGdldF9nZXRfY3Vyc29yKHRoaXMpIGFzIEN1cnNvciB9XG4gICAgICAgIHNldCBjdXJzb3IoY3Vyc29yOiBDdXJzb3IpIHsgQXN0YWwud2lkZ2V0X3NldF9jdXJzb3IodGhpcywgY3Vyc29yKSB9XG4gICAgICAgIGdldF9jdXJzb3IoKTogQ3Vyc29yIHsgcmV0dXJuIHRoaXMuY3Vyc29yIH1cbiAgICAgICAgc2V0X2N1cnNvcihjdXJzb3I6IEN1cnNvcikgeyB0aGlzLmN1cnNvciA9IGN1cnNvciB9XG5cbiAgICAgICAgZ2V0IGNsaWNrVGhyb3VnaCgpOiBib29sZWFuIHsgcmV0dXJuIEFzdGFsLndpZGdldF9nZXRfY2xpY2tfdGhyb3VnaCh0aGlzKSB9XG4gICAgICAgIHNldCBjbGlja1Rocm91Z2goY2xpY2tUaHJvdWdoOiBib29sZWFuKSB7IEFzdGFsLndpZGdldF9zZXRfY2xpY2tfdGhyb3VnaCh0aGlzLCBjbGlja1Rocm91Z2gpIH1cbiAgICAgICAgZ2V0X2NsaWNrX3Rocm91Z2goKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmNsaWNrVGhyb3VnaCB9XG4gICAgICAgIHNldF9jbGlja190aHJvdWdoKGNsaWNrVGhyb3VnaDogYm9vbGVhbikgeyB0aGlzLmNsaWNrVGhyb3VnaCA9IGNsaWNrVGhyb3VnaCB9XG5cbiAgICAgICAgZGVjbGFyZSBwcml2YXRlIFtub0ltcGxpY2l0RGVzdHJveV06IGJvb2xlYW5cbiAgICAgICAgZ2V0IG5vSW1wbGljaXREZXN0cm95KCk6IGJvb2xlYW4geyByZXR1cm4gdGhpc1tub0ltcGxpY2l0RGVzdHJveV0gfVxuICAgICAgICBzZXQgbm9JbXBsaWNpdERlc3Ryb3kodmFsdWU6IGJvb2xlYW4pIHsgdGhpc1tub0ltcGxpY2l0RGVzdHJveV0gPSB2YWx1ZSB9XG5cbiAgICAgICAgc2V0IGFjdGlvbkdyb3VwKFtwcmVmaXgsIGdyb3VwXTogQWN0aW9uR3JvdXApIHsgdGhpcy5pbnNlcnRfYWN0aW9uX2dyb3VwKHByZWZpeCwgZ3JvdXApIH1cbiAgICAgICAgc2V0X2FjdGlvbl9ncm91cChhY3Rpb25Hcm91cDogQWN0aW9uR3JvdXApIHsgdGhpcy5hY3Rpb25Hcm91cCA9IGFjdGlvbkdyb3VwIH1cblxuICAgICAgICBwcm90ZWN0ZWQgZ2V0Q2hpbGRyZW4oKTogQXJyYXk8R3RrLldpZGdldD4ge1xuICAgICAgICAgICAgaWYgKHRoaXMgaW5zdGFuY2VvZiBHdGsuQmluKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0X2NoaWxkKCkgPyBbdGhpcy5nZXRfY2hpbGQoKSFdIDogW11cbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcyBpbnN0YW5jZW9mIEd0ay5Db250YWluZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRfY2hpbGRyZW4oKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFtdXG4gICAgICAgIH1cblxuICAgICAgICBwcm90ZWN0ZWQgc2V0Q2hpbGRyZW4oY2hpbGRyZW46IGFueVtdKSB7XG4gICAgICAgICAgICBjaGlsZHJlbiA9IGNoaWxkcmVuLmZsYXQoSW5maW5pdHkpLm1hcChjaCA9PiBjaCBpbnN0YW5jZW9mIEd0ay5XaWRnZXRcbiAgICAgICAgICAgICAgICA/IGNoXG4gICAgICAgICAgICAgICAgOiBuZXcgR3RrLkxhYmVsKHsgdmlzaWJsZTogdHJ1ZSwgbGFiZWw6IFN0cmluZyhjaCkgfSkpXG5cbiAgICAgICAgICAgIGlmICh0aGlzIGluc3RhbmNlb2YgR3RrLkNvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2ggb2YgY2hpbGRyZW4pXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkKGNoKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihgY2FuIG5vdCBhZGQgY2hpbGRyZW4gdG8gJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9YClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIFtzZXRDaGlsZHJlbl0oY2hpbGRyZW46IGFueVtdKSB7XG4gICAgICAgICAgICAvLyByZW1vdmVcbiAgICAgICAgICAgIGlmICh0aGlzIGluc3RhbmNlb2YgR3RrLkNvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2ggb2YgdGhpcy5nZXRDaGlsZHJlbigpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlKGNoKVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWNoaWxkcmVuLmluY2x1ZGVzKGNoKSAmJiAhdGhpcy5ub0ltcGxpY2l0RGVzdHJveSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoPy5kZXN0cm95KClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGFwcGVuZFxuICAgICAgICAgICAgdGhpcy5zZXRDaGlsZHJlbihjaGlsZHJlbilcbiAgICAgICAgfVxuXG4gICAgICAgIHRvZ2dsZUNsYXNzTmFtZShjbjogc3RyaW5nLCBjb25kID0gdHJ1ZSkge1xuICAgICAgICAgICAgQXN0YWwud2lkZ2V0X3RvZ2dsZV9jbGFzc19uYW1lKHRoaXMsIGNuLCBjb25kKVxuICAgICAgICB9XG5cbiAgICAgICAgaG9vayhcbiAgICAgICAgICAgIG9iamVjdDogQ29ubmVjdGFibGUsXG4gICAgICAgICAgICBzaWduYWw6IHN0cmluZyxcbiAgICAgICAgICAgIGNhbGxiYWNrOiAoc2VsZjogdGhpcywgLi4uYXJnczogYW55W10pID0+IHZvaWQsXG4gICAgICAgICk6IHRoaXNcbiAgICAgICAgaG9vayhcbiAgICAgICAgICAgIG9iamVjdDogU3Vic2NyaWJhYmxlLFxuICAgICAgICAgICAgY2FsbGJhY2s6IChzZWxmOiB0aGlzLCAuLi5hcmdzOiBhbnlbXSkgPT4gdm9pZCxcbiAgICAgICAgKTogdGhpc1xuICAgICAgICBob29rKFxuICAgICAgICAgICAgb2JqZWN0OiBDb25uZWN0YWJsZSB8IFN1YnNjcmliYWJsZSxcbiAgICAgICAgICAgIHNpZ25hbE9yQ2FsbGJhY2s6IHN0cmluZyB8ICgoc2VsZjogdGhpcywgLi4uYXJnczogYW55W10pID0+IHZvaWQpLFxuICAgICAgICAgICAgY2FsbGJhY2s/OiAoc2VsZjogdGhpcywgLi4uYXJnczogYW55W10pID0+IHZvaWQsXG4gICAgICAgICkge1xuICAgICAgICAgICAgaG9vayh0aGlzLCBvYmplY3QsIHNpZ25hbE9yQ2FsbGJhY2ssIGNhbGxiYWNrKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0cnVjdG9yKC4uLnBhcmFtczogYW55W10pIHtcbiAgICAgICAgICAgIHN1cGVyKClcbiAgICAgICAgICAgIGNvbnN0IHByb3BzID0gcGFyYW1zWzBdIHx8IHt9XG4gICAgICAgICAgICBwcm9wcy52aXNpYmxlID8/PSB0cnVlXG4gICAgICAgICAgICBjb25zdHJ1Y3QodGhpcywgcHJvcHMpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBHT2JqZWN0LnJlZ2lzdGVyQ2xhc3Moe1xuICAgICAgICBHVHlwZU5hbWU6IGBBc3RhbF8ke2Nsc05hbWV9YCxcbiAgICAgICAgUHJvcGVydGllczoge1xuICAgICAgICAgICAgXCJjbGFzcy1uYW1lXCI6IEdPYmplY3QuUGFyYW1TcGVjLnN0cmluZyhcbiAgICAgICAgICAgICAgICBcImNsYXNzLW5hbWVcIiwgXCJcIiwgXCJcIiwgR09iamVjdC5QYXJhbUZsYWdzLlJFQURXUklURSwgXCJcIixcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBcImNzc1wiOiBHT2JqZWN0LlBhcmFtU3BlYy5zdHJpbmcoXG4gICAgICAgICAgICAgICAgXCJjc3NcIiwgXCJcIiwgXCJcIiwgR09iamVjdC5QYXJhbUZsYWdzLlJFQURXUklURSwgXCJcIixcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBcImN1cnNvclwiOiBHT2JqZWN0LlBhcmFtU3BlYy5zdHJpbmcoXG4gICAgICAgICAgICAgICAgXCJjdXJzb3JcIiwgXCJcIiwgXCJcIiwgR09iamVjdC5QYXJhbUZsYWdzLlJFQURXUklURSwgXCJkZWZhdWx0XCIsXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgXCJjbGljay10aHJvdWdoXCI6IEdPYmplY3QuUGFyYW1TcGVjLmJvb2xlYW4oXG4gICAgICAgICAgICAgICAgXCJjbGljay10aHJvdWdoXCIsIFwiXCIsIFwiXCIsIEdPYmplY3QuUGFyYW1GbGFncy5SRUFEV1JJVEUsIGZhbHNlLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIFwibm8taW1wbGljaXQtZGVzdHJveVwiOiBHT2JqZWN0LlBhcmFtU3BlYy5ib29sZWFuKFxuICAgICAgICAgICAgICAgIFwibm8taW1wbGljaXQtZGVzdHJveVwiLCBcIlwiLCBcIlwiLCBHT2JqZWN0LlBhcmFtRmxhZ3MuUkVBRFdSSVRFLCBmYWxzZSxcbiAgICAgICAgICAgICksXG4gICAgICAgIH0sXG4gICAgfSwgV2lkZ2V0KVxuXG4gICAgcmV0dXJuIFdpZGdldFxufVxuXG50eXBlIFNpZ0hhbmRsZXI8XG4gICAgVyBleHRlbmRzIEluc3RhbmNlVHlwZTx0eXBlb2YgR3RrLldpZGdldD4sXG4gICAgQXJncyBleHRlbmRzIEFycmF5PHVua25vd24+LFxuPiA9ICgoc2VsZjogVywgLi4uYXJnczogQXJncykgPT4gdW5rbm93bikgfCBzdHJpbmcgfCBzdHJpbmdbXVxuXG5leHBvcnQgdHlwZSBCaW5kYWJsZUNoaWxkID0gR3RrLldpZGdldCB8IEJpbmRpbmc8R3RrLldpZGdldD5cblxuZXhwb3J0IHR5cGUgQ29uc3RydWN0UHJvcHM8XG4gICAgU2VsZiBleHRlbmRzIEluc3RhbmNlVHlwZTx0eXBlb2YgR3RrLldpZGdldD4sXG4gICAgUHJvcHMgZXh0ZW5kcyBHdGsuV2lkZ2V0LkNvbnN0cnVjdG9yUHJvcHMsXG4gICAgU2lnbmFscyBleHRlbmRzIFJlY29yZDxgb24ke3N0cmluZ31gLCBBcnJheTx1bmtub3duPj4gPSBSZWNvcmQ8YG9uJHtzdHJpbmd9YCwgYW55W10+LFxuPiA9IFBhcnRpYWw8e1xuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgY2FuJ3QgYXNzaWduIHRvIHVua25vd24sIGJ1dCBpdCB3b3JrcyBhcyBleHBlY3RlZCB0aG91Z2hcbiAgICBbUyBpbiBrZXlvZiBTaWduYWxzXTogU2lnSGFuZGxlcjxTZWxmLCBTaWduYWxzW1NdPlxufT4gJiBQYXJ0aWFsPHtcbiAgICBbS2V5IGluIGBvbiR7c3RyaW5nfWBdOiBTaWdIYW5kbGVyPFNlbGYsIGFueVtdPlxufT4gJiBCaW5kYWJsZVByb3BzPFBhcnRpYWw8UHJvcHMgJiB7XG4gICAgY2xhc3NOYW1lPzogc3RyaW5nXG4gICAgY3NzPzogc3RyaW5nXG4gICAgY3Vyc29yPzogc3RyaW5nXG4gICAgY2xpY2tUaHJvdWdoPzogYm9vbGVhblxuICAgIGFjdGlvbkdyb3VwPzogQWN0aW9uR3JvdXBcbn0+PiAmIFBhcnRpYWw8e1xuICAgIG9uRGVzdHJveTogKHNlbGY6IFNlbGYpID0+IHVua25vd25cbiAgICBvbkRyYXc6IChzZWxmOiBTZWxmKSA9PiB1bmtub3duXG4gICAgb25LZXlQcmVzc0V2ZW50OiAoc2VsZjogU2VsZiwgZXZlbnQ6IEdkay5FdmVudCkgPT4gdW5rbm93blxuICAgIG9uS2V5UmVsZWFzZUV2ZW50OiAoc2VsZjogU2VsZiwgZXZlbnQ6IEdkay5FdmVudCkgPT4gdW5rbm93blxuICAgIG9uQnV0dG9uUHJlc3NFdmVudDogKHNlbGY6IFNlbGYsIGV2ZW50OiBHZGsuRXZlbnQpID0+IHVua25vd25cbiAgICBvbkJ1dHRvblJlbGVhc2VFdmVudDogKHNlbGY6IFNlbGYsIGV2ZW50OiBHZGsuRXZlbnQpID0+IHVua25vd25cbiAgICBvblJlYWxpemU6IChzZWxmOiBTZWxmKSA9PiB1bmtub3duXG4gICAgc2V0dXA6IChzZWxmOiBTZWxmKSA9PiB2b2lkXG59PlxuXG50eXBlIEN1cnNvciA9XG4gICAgfCBcImRlZmF1bHRcIlxuICAgIHwgXCJoZWxwXCJcbiAgICB8IFwicG9pbnRlclwiXG4gICAgfCBcImNvbnRleHQtbWVudVwiXG4gICAgfCBcInByb2dyZXNzXCJcbiAgICB8IFwid2FpdFwiXG4gICAgfCBcImNlbGxcIlxuICAgIHwgXCJjcm9zc2hhaXJcIlxuICAgIHwgXCJ0ZXh0XCJcbiAgICB8IFwidmVydGljYWwtdGV4dFwiXG4gICAgfCBcImFsaWFzXCJcbiAgICB8IFwiY29weVwiXG4gICAgfCBcIm5vLWRyb3BcIlxuICAgIHwgXCJtb3ZlXCJcbiAgICB8IFwibm90LWFsbG93ZWRcIlxuICAgIHwgXCJncmFiXCJcbiAgICB8IFwiZ3JhYmJpbmdcIlxuICAgIHwgXCJhbGwtc2Nyb2xsXCJcbiAgICB8IFwiY29sLXJlc2l6ZVwiXG4gICAgfCBcInJvdy1yZXNpemVcIlxuICAgIHwgXCJuLXJlc2l6ZVwiXG4gICAgfCBcImUtcmVzaXplXCJcbiAgICB8IFwicy1yZXNpemVcIlxuICAgIHwgXCJ3LXJlc2l6ZVwiXG4gICAgfCBcIm5lLXJlc2l6ZVwiXG4gICAgfCBcIm53LXJlc2l6ZVwiXG4gICAgfCBcInN3LXJlc2l6ZVwiXG4gICAgfCBcInNlLXJlc2l6ZVwiXG4gICAgfCBcImV3LXJlc2l6ZVwiXG4gICAgfCBcIm5zLXJlc2l6ZVwiXG4gICAgfCBcIm5lc3ctcmVzaXplXCJcbiAgICB8IFwibndzZS1yZXNpemVcIlxuICAgIHwgXCJ6b29tLWluXCJcbiAgICB8IFwiem9vbS1vdXRcIlxuXG50eXBlIEFjdGlvbkdyb3VwID0gW3ByZWZpeDogc3RyaW5nLCBhY3Rpb25Hcm91cDogR2lvLkFjdGlvbkdyb3VwXVxuIiwgImltcG9ydCBHdGsgZnJvbSBcImdpOi8vR3RrP3ZlcnNpb249My4wXCJcbmltcG9ydCBBc3RhbCBmcm9tIFwiZ2k6Ly9Bc3RhbD92ZXJzaW9uPTMuMFwiXG5pbXBvcnQgeyBta0FwcCB9IGZyb20gXCIuLi9fYXBwXCJcblxuR3RrLmluaXQobnVsbClcblxuZXhwb3J0IGRlZmF1bHQgbWtBcHAoQXN0YWwuQXBwbGljYXRpb24pXG4iLCAiLyoqXG4gKiBXb3JrYXJvdW5kIGZvciBcIkNhbid0IGNvbnZlcnQgbm9uLW51bGwgcG9pbnRlciB0byBKUyB2YWx1ZSBcIlxuICovXG5cbmV4cG9ydCB7IH1cblxuY29uc3Qgc25ha2VpZnkgPSAoc3RyOiBzdHJpbmcpID0+IHN0clxuICAgIC5yZXBsYWNlKC8oW2Etel0pKFtBLVpdKS9nLCBcIiQxXyQyXCIpXG4gICAgLnJlcGxhY2VBbGwoXCItXCIsIFwiX1wiKVxuICAgIC50b0xvd2VyQ2FzZSgpXG5cbmFzeW5jIGZ1bmN0aW9uIHN1cHByZXNzPFQ+KG1vZDogUHJvbWlzZTx7IGRlZmF1bHQ6IFQgfT4sIHBhdGNoOiAobTogVCkgPT4gdm9pZCkge1xuICAgIHJldHVybiBtb2QudGhlbihtID0+IHBhdGNoKG0uZGVmYXVsdCkpLmNhdGNoKCgpID0+IHZvaWQgMClcbn1cblxuZnVuY3Rpb24gcGF0Y2g8UCBleHRlbmRzIG9iamVjdD4ocHJvdG86IFAsIHByb3A6IEV4dHJhY3Q8a2V5b2YgUCwgc3RyaW5nPikge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgcHJvcCwge1xuICAgICAgICBnZXQoKSB7IHJldHVybiB0aGlzW2BnZXRfJHtzbmFrZWlmeShwcm9wKX1gXSgpIH0sXG4gICAgfSlcbn1cblxuYXdhaXQgc3VwcHJlc3MoaW1wb3J0KFwiZ2k6Ly9Bc3RhbEFwcHNcIiksICh7IEFwcHMsIEFwcGxpY2F0aW9uIH0pID0+IHtcbiAgICBwYXRjaChBcHBzLnByb3RvdHlwZSwgXCJsaXN0XCIpXG4gICAgcGF0Y2goQXBwbGljYXRpb24ucHJvdG90eXBlLCBcImtleXdvcmRzXCIpXG4gICAgcGF0Y2goQXBwbGljYXRpb24ucHJvdG90eXBlLCBcImNhdGVnb3JpZXNcIilcbn0pXG5cbmF3YWl0IHN1cHByZXNzKGltcG9ydChcImdpOi8vQXN0YWxCYXR0ZXJ5XCIpLCAoeyBVUG93ZXIgfSkgPT4ge1xuICAgIHBhdGNoKFVQb3dlci5wcm90b3R5cGUsIFwiZGV2aWNlc1wiKVxufSlcblxuYXdhaXQgc3VwcHJlc3MoaW1wb3J0KFwiZ2k6Ly9Bc3RhbEJsdWV0b290aFwiKSwgKHsgQWRhcHRlciwgQmx1ZXRvb3RoLCBEZXZpY2UgfSkgPT4ge1xuICAgIHBhdGNoKEFkYXB0ZXIucHJvdG90eXBlLCBcInV1aWRzXCIpXG4gICAgcGF0Y2goQmx1ZXRvb3RoLnByb3RvdHlwZSwgXCJhZGFwdGVyc1wiKVxuICAgIHBhdGNoKEJsdWV0b290aC5wcm90b3R5cGUsIFwiZGV2aWNlc1wiKVxuICAgIHBhdGNoKERldmljZS5wcm90b3R5cGUsIFwidXVpZHNcIilcbn0pXG5cbmF3YWl0IHN1cHByZXNzKGltcG9ydChcImdpOi8vQXN0YWxIeXBybGFuZFwiKSwgKHsgSHlwcmxhbmQsIE1vbml0b3IsIFdvcmtzcGFjZSB9KSA9PiB7XG4gICAgcGF0Y2goSHlwcmxhbmQucHJvdG90eXBlLCBcImJpbmRzXCIpXG4gICAgcGF0Y2goSHlwcmxhbmQucHJvdG90eXBlLCBcIm1vbml0b3JzXCIpXG4gICAgcGF0Y2goSHlwcmxhbmQucHJvdG90eXBlLCBcIndvcmtzcGFjZXNcIilcbiAgICBwYXRjaChIeXBybGFuZC5wcm90b3R5cGUsIFwiY2xpZW50c1wiKVxuICAgIHBhdGNoKE1vbml0b3IucHJvdG90eXBlLCBcImF2YWlsYWJsZU1vZGVzXCIpXG4gICAgcGF0Y2goTW9uaXRvci5wcm90b3R5cGUsIFwiYXZhaWxhYmxlX21vZGVzXCIpXG4gICAgcGF0Y2goV29ya3NwYWNlLnByb3RvdHlwZSwgXCJjbGllbnRzXCIpXG59KVxuXG5hd2FpdCBzdXBwcmVzcyhpbXBvcnQoXCJnaTovL0FzdGFsTXByaXNcIiksICh7IE1wcmlzLCBQbGF5ZXIgfSkgPT4ge1xuICAgIHBhdGNoKE1wcmlzLnByb3RvdHlwZSwgXCJwbGF5ZXJzXCIpXG4gICAgcGF0Y2goUGxheWVyLnByb3RvdHlwZSwgXCJzdXBwb3J0ZWRfdXJpX3NjaGVtZXNcIilcbiAgICBwYXRjaChQbGF5ZXIucHJvdG90eXBlLCBcInN1cHBvcnRlZFVyaVNjaGVtZXNcIilcbiAgICBwYXRjaChQbGF5ZXIucHJvdG90eXBlLCBcInN1cHBvcnRlZF9taW1lX3R5cGVzXCIpXG4gICAgcGF0Y2goUGxheWVyLnByb3RvdHlwZSwgXCJzdXBwb3J0ZWRNaW1lVHlwZXNcIilcbiAgICBwYXRjaChQbGF5ZXIucHJvdG90eXBlLCBcImNvbW1lbnRzXCIpXG59KVxuXG5hd2FpdCBzdXBwcmVzcyhpbXBvcnQoXCJnaTovL0FzdGFsTmV0d29ya1wiKSwgKHsgV2lmaSB9KSA9PiB7XG4gICAgcGF0Y2goV2lmaS5wcm90b3R5cGUsIFwiYWNjZXNzX3BvaW50c1wiKVxuICAgIHBhdGNoKFdpZmkucHJvdG90eXBlLCBcImFjY2Vzc1BvaW50c1wiKVxufSlcblxuYXdhaXQgc3VwcHJlc3MoaW1wb3J0KFwiZ2k6Ly9Bc3RhbE5vdGlmZFwiKSwgKHsgTm90aWZkLCBOb3RpZmljYXRpb24gfSkgPT4ge1xuICAgIHBhdGNoKE5vdGlmZC5wcm90b3R5cGUsIFwibm90aWZpY2F0aW9uc1wiKVxuICAgIHBhdGNoKE5vdGlmaWNhdGlvbi5wcm90b3R5cGUsIFwiYWN0aW9uc1wiKVxufSlcblxuYXdhaXQgc3VwcHJlc3MoaW1wb3J0KFwiZ2k6Ly9Bc3RhbFBvd2VyUHJvZmlsZXNcIiksICh7IFBvd2VyUHJvZmlsZXMgfSkgPT4ge1xuICAgIHBhdGNoKFBvd2VyUHJvZmlsZXMucHJvdG90eXBlLCBcImFjdGlvbnNcIilcbn0pXG5cbmF3YWl0IHN1cHByZXNzKGltcG9ydChcImdpOi8vQXN0YWxXcFwiKSwgKHsgV3AsIEF1ZGlvLCBWaWRlbyB9KSA9PiB7XG4gICAgcGF0Y2goV3AucHJvdG90eXBlLCBcImVuZHBvaW50c1wiKVxuICAgIHBhdGNoKFdwLnByb3RvdHlwZSwgXCJkZXZpY2VzXCIpXG4gICAgcGF0Y2goQXVkaW8ucHJvdG90eXBlLCBcInN0cmVhbXNcIilcbiAgICBwYXRjaChBdWRpby5wcm90b3R5cGUsIFwicmVjb3JkZXJzXCIpXG4gICAgcGF0Y2goQXVkaW8ucHJvdG90eXBlLCBcIm1pY3JvcGhvbmVzXCIpXG4gICAgcGF0Y2goQXVkaW8ucHJvdG90eXBlLCBcInNwZWFrZXJzXCIpXG4gICAgcGF0Y2goQXVkaW8ucHJvdG90eXBlLCBcImRldmljZXNcIilcbiAgICBwYXRjaChWaWRlby5wcm90b3R5cGUsIFwic3RyZWFtc1wiKVxuICAgIHBhdGNoKFZpZGVvLnByb3RvdHlwZSwgXCJyZWNvcmRlcnNcIilcbiAgICBwYXRjaChWaWRlby5wcm90b3R5cGUsIFwic2lua3NcIilcbiAgICBwYXRjaChWaWRlby5wcm90b3R5cGUsIFwic291cmNlc1wiKVxuICAgIHBhdGNoKFZpZGVvLnByb3RvdHlwZSwgXCJkZXZpY2VzXCIpXG59KVxuIiwgImltcG9ydCBcIi4vb3ZlcnJpZGVzLmpzXCJcbmltcG9ydCB7IHNldENvbnNvbGVMb2dEb21haW4gfSBmcm9tIFwiY29uc29sZVwiXG5pbXBvcnQgeyBleGl0LCBwcm9ncmFtQXJncyB9IGZyb20gXCJzeXN0ZW1cIlxuaW1wb3J0IElPIGZyb20gXCJnaTovL0FzdGFsSU9cIlxuaW1wb3J0IEdPYmplY3QgZnJvbSBcImdpOi8vR09iamVjdFwiXG5pbXBvcnQgR2lvIGZyb20gXCJnaTovL0dpbz92ZXJzaW9uPTIuMFwiXG5pbXBvcnQgdHlwZSBBc3RhbDMgZnJvbSBcImdpOi8vQXN0YWw/dmVyc2lvbj0zLjBcIlxuaW1wb3J0IHR5cGUgQXN0YWw0IGZyb20gXCJnaTovL0FzdGFsP3ZlcnNpb249NC4wXCJcblxudHlwZSBDb25maWcgPSBQYXJ0aWFsPHtcbiAgICBpbnN0YW5jZU5hbWU6IHN0cmluZ1xuICAgIGNzczogc3RyaW5nXG4gICAgaWNvbnM6IHN0cmluZ1xuICAgIGd0a1RoZW1lOiBzdHJpbmdcbiAgICBpY29uVGhlbWU6IHN0cmluZ1xuICAgIGN1cnNvclRoZW1lOiBzdHJpbmdcbiAgICBob2xkOiBib29sZWFuXG4gICAgcmVxdWVzdEhhbmRsZXIocmVxdWVzdDogc3RyaW5nLCByZXM6IChyZXNwb25zZTogYW55KSA9PiB2b2lkKTogdm9pZFxuICAgIG1haW4oLi4uYXJnczogc3RyaW5nW10pOiB2b2lkXG4gICAgY2xpZW50KG1lc3NhZ2U6IChtc2c6IHN0cmluZykgPT4gc3RyaW5nLCAuLi5hcmdzOiBzdHJpbmdbXSk6IHZvaWRcbn0+XG5cbmludGVyZmFjZSBBc3RhbDNKUyBleHRlbmRzIEFzdGFsMy5BcHBsaWNhdGlvbiB7XG4gICAgZXZhbChib2R5OiBzdHJpbmcpOiBQcm9taXNlPGFueT5cbiAgICByZXF1ZXN0SGFuZGxlcjogQ29uZmlnW1wicmVxdWVzdEhhbmRsZXJcIl1cbiAgICBhcHBseV9jc3Moc3R5bGU6IHN0cmluZywgcmVzZXQ/OiBib29sZWFuKTogdm9pZFxuICAgIHF1aXQoY29kZT86IG51bWJlcik6IHZvaWRcbiAgICBzdGFydChjb25maWc/OiBDb25maWcpOiB2b2lkXG59XG5cbmludGVyZmFjZSBBc3RhbDRKUyBleHRlbmRzIEFzdGFsNC5BcHBsaWNhdGlvbiB7XG4gICAgZXZhbChib2R5OiBzdHJpbmcpOiBQcm9taXNlPGFueT5cbiAgICByZXF1ZXN0SGFuZGxlcj86IENvbmZpZ1tcInJlcXVlc3RIYW5kbGVyXCJdXG4gICAgYXBwbHlfY3NzKHN0eWxlOiBzdHJpbmcsIHJlc2V0PzogYm9vbGVhbik6IHZvaWRcbiAgICBxdWl0KGNvZGU/OiBudW1iZXIpOiB2b2lkXG4gICAgc3RhcnQoY29uZmlnPzogQ29uZmlnKTogdm9pZFxufVxuXG50eXBlIEFwcDMgPSB0eXBlb2YgQXN0YWwzLkFwcGxpY2F0aW9uXG50eXBlIEFwcDQgPSB0eXBlb2YgQXN0YWw0LkFwcGxpY2F0aW9uXG5cbmV4cG9ydCBmdW5jdGlvbiBta0FwcDxBcHAgZXh0ZW5kcyBBcHAzPihBcHA6IEFwcCk6IEFzdGFsM0pTXG5leHBvcnQgZnVuY3Rpb24gbWtBcHA8QXBwIGV4dGVuZHMgQXBwND4oQXBwOiBBcHApOiBBc3RhbDRKU1xuXG5leHBvcnQgZnVuY3Rpb24gbWtBcHAoQXBwOiBBcHAzIHwgQXBwNCkge1xuICAgIHJldHVybiBuZXcgKGNsYXNzIEFzdGFsSlMgZXh0ZW5kcyBBcHAge1xuICAgICAgICBzdGF0aWMgeyBHT2JqZWN0LnJlZ2lzdGVyQ2xhc3MoeyBHVHlwZU5hbWU6IFwiQXN0YWxKU1wiIH0sIHRoaXMgYXMgYW55KSB9XG5cbiAgICAgICAgZXZhbChib2R5OiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZuID0gRnVuY3Rpb24oYHJldHVybiAoYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAke2JvZHkuaW5jbHVkZXMoXCI7XCIpID8gYm9keSA6IGByZXR1cm4gJHtib2R5fTtgfVxuICAgICAgICAgICAgICAgICAgICB9KWApXG4gICAgICAgICAgICAgICAgICAgIGZuKCkoKS50aGVuKHJlcykuY2F0Y2gocmVqKVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlaihlcnJvcilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgcmVxdWVzdEhhbmRsZXI/OiBDb25maWdbXCJyZXF1ZXN0SGFuZGxlclwiXVxuXG4gICAgICAgIHZmdW5jX3JlcXVlc3QobXNnOiBzdHJpbmcsIGNvbm46IEdpby5Tb2NrZXRDb25uZWN0aW9uKTogdm9pZCB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMucmVxdWVzdEhhbmRsZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdEhhbmRsZXIobXNnLCAocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgSU8ud3JpdGVfc29jayhjb25uLCBTdHJpbmcocmVzcG9uc2UpLCAoXywgcmVzKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgSU8ud3JpdGVfc29ja19maW5pc2gocmVzKSxcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN1cGVyLnZmdW5jX3JlcXVlc3QobXNnLCBjb25uKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYXBwbHlfY3NzKHN0eWxlOiBzdHJpbmcsIHJlc2V0ID0gZmFsc2UpIHtcbiAgICAgICAgICAgIHN1cGVyLmFwcGx5X2NzcyhzdHlsZSwgcmVzZXQpXG4gICAgICAgIH1cblxuICAgICAgICBxdWl0KGNvZGU/OiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgICAgIHN1cGVyLnF1aXQoKVxuICAgICAgICAgICAgZXhpdChjb2RlID8/IDApXG4gICAgICAgIH1cblxuICAgICAgICBzdGFydCh7IHJlcXVlc3RIYW5kbGVyLCBjc3MsIGhvbGQsIG1haW4sIGNsaWVudCwgaWNvbnMsIC4uLmNmZyB9OiBDb25maWcgPSB7fSkge1xuICAgICAgICAgICAgY29uc3QgYXBwID0gdGhpcyBhcyB1bmtub3duIGFzIEluc3RhbmNlVHlwZTxBcHAzIHwgQXBwND5cblxuICAgICAgICAgICAgY2xpZW50ID8/PSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcHJpbnQoYEFzdGFsIGluc3RhbmNlIFwiJHthcHAuaW5zdGFuY2VOYW1lfVwiIGFscmVhZHkgcnVubmluZ2ApXG4gICAgICAgICAgICAgICAgZXhpdCgxKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKHRoaXMsIGNmZylcbiAgICAgICAgICAgIHNldENvbnNvbGVMb2dEb21haW4oYXBwLmluc3RhbmNlTmFtZSlcblxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SGFuZGxlciA9IHJlcXVlc3RIYW5kbGVyXG4gICAgICAgICAgICBhcHAuY29ubmVjdChcImFjdGl2YXRlXCIsICgpID0+IHtcbiAgICAgICAgICAgICAgICBtYWluPy4oLi4ucHJvZ3JhbUFyZ3MpXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGFwcC5hY3F1aXJlX3NvY2tldCgpXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjbGllbnQobXNnID0+IElPLnNlbmRfcmVxdWVzdChhcHAuaW5zdGFuY2VOYW1lLCBtc2cpISwgLi4ucHJvZ3JhbUFyZ3MpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjc3MpXG4gICAgICAgICAgICAgICAgdGhpcy5hcHBseV9jc3MoY3NzLCBmYWxzZSlcblxuICAgICAgICAgICAgaWYgKGljb25zKVxuICAgICAgICAgICAgICAgIGFwcC5hZGRfaWNvbnMoaWNvbnMpXG5cbiAgICAgICAgICAgIGhvbGQgPz89IHRydWVcbiAgICAgICAgICAgIGlmIChob2xkKVxuICAgICAgICAgICAgICAgIGFwcC5ob2xkKClcblxuICAgICAgICAgICAgYXBwLnJ1bkFzeW5jKFtdKVxuICAgICAgICB9XG4gICAgfSlcbn1cbiIsICIvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG5pbXBvcnQgQXN0YWwgZnJvbSBcImdpOi8vQXN0YWw/dmVyc2lvbj0zLjBcIlxuaW1wb3J0IEd0ayBmcm9tIFwiZ2k6Ly9HdGs/dmVyc2lvbj0zLjBcIlxuaW1wb3J0IEdPYmplY3QgZnJvbSBcImdpOi8vR09iamVjdFwiXG5pbXBvcnQgYXN0YWxpZnksIHsgdHlwZSBDb25zdHJ1Y3RQcm9wcywgdHlwZSBCaW5kYWJsZUNoaWxkIH0gZnJvbSBcIi4vYXN0YWxpZnkuanNcIlxuXG5mdW5jdGlvbiBmaWx0ZXIoY2hpbGRyZW46IGFueVtdKSB7XG4gICAgcmV0dXJuIGNoaWxkcmVuLmZsYXQoSW5maW5pdHkpLm1hcChjaCA9PiBjaCBpbnN0YW5jZW9mIEd0ay5XaWRnZXRcbiAgICAgICAgPyBjaFxuICAgICAgICA6IG5ldyBHdGsuTGFiZWwoeyB2aXNpYmxlOiB0cnVlLCBsYWJlbDogU3RyaW5nKGNoKSB9KSlcbn1cblxuLy8gQm94XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQXN0YWwuQm94LnByb3RvdHlwZSwgXCJjaGlsZHJlblwiLCB7XG4gICAgZ2V0KCkgeyByZXR1cm4gdGhpcy5nZXRfY2hpbGRyZW4oKSB9LFxuICAgIHNldCh2KSB7IHRoaXMuc2V0X2NoaWxkcmVuKHYpIH0sXG59KVxuXG5leHBvcnQgdHlwZSBCb3hQcm9wcyA9IENvbnN0cnVjdFByb3BzPEJveCwgQXN0YWwuQm94LkNvbnN0cnVjdG9yUHJvcHM+XG5leHBvcnQgY2xhc3MgQm94IGV4dGVuZHMgYXN0YWxpZnkoQXN0YWwuQm94KSB7XG4gICAgc3RhdGljIHsgR09iamVjdC5yZWdpc3RlckNsYXNzKHsgR1R5cGVOYW1lOiBcIkJveFwiIH0sIHRoaXMpIH1cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IEJveFByb3BzLCAuLi5jaGlsZHJlbjogQXJyYXk8QmluZGFibGVDaGlsZD4pIHsgc3VwZXIoeyBjaGlsZHJlbiwgLi4ucHJvcHMgfSBhcyBhbnkpIH1cbiAgICBwcm90ZWN0ZWQgc2V0Q2hpbGRyZW4oY2hpbGRyZW46IGFueVtdKTogdm9pZCB7IHRoaXMuc2V0X2NoaWxkcmVuKGZpbHRlcihjaGlsZHJlbikpIH1cbn1cblxuLy8gQnV0dG9uXG5leHBvcnQgdHlwZSBCdXR0b25Qcm9wcyA9IENvbnN0cnVjdFByb3BzPEJ1dHRvbiwgQXN0YWwuQnV0dG9uLkNvbnN0cnVjdG9yUHJvcHMsIHtcbiAgICBvbkNsaWNrZWQ6IFtdXG4gICAgb25DbGljazogW2V2ZW50OiBBc3RhbC5DbGlja0V2ZW50XVxuICAgIG9uQ2xpY2tSZWxlYXNlOiBbZXZlbnQ6IEFzdGFsLkNsaWNrRXZlbnRdXG4gICAgb25Ib3ZlcjogW2V2ZW50OiBBc3RhbC5Ib3ZlckV2ZW50XVxuICAgIG9uSG92ZXJMb3N0OiBbZXZlbnQ6IEFzdGFsLkhvdmVyRXZlbnRdXG4gICAgb25TY3JvbGw6IFtldmVudDogQXN0YWwuU2Nyb2xsRXZlbnRdXG59PlxuZXhwb3J0IGNsYXNzIEJ1dHRvbiBleHRlbmRzIGFzdGFsaWZ5KEFzdGFsLkJ1dHRvbikge1xuICAgIHN0YXRpYyB7IEdPYmplY3QucmVnaXN0ZXJDbGFzcyh7IEdUeXBlTmFtZTogXCJCdXR0b25cIiB9LCB0aGlzKSB9XG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBCdXR0b25Qcm9wcywgY2hpbGQ/OiBCaW5kYWJsZUNoaWxkKSB7IHN1cGVyKHsgY2hpbGQsIC4uLnByb3BzIH0gYXMgYW55KSB9XG59XG5cbi8vIENlbnRlckJveFxuZXhwb3J0IHR5cGUgQ2VudGVyQm94UHJvcHMgPSBDb25zdHJ1Y3RQcm9wczxDZW50ZXJCb3gsIEFzdGFsLkNlbnRlckJveC5Db25zdHJ1Y3RvclByb3BzPlxuZXhwb3J0IGNsYXNzIENlbnRlckJveCBleHRlbmRzIGFzdGFsaWZ5KEFzdGFsLkNlbnRlckJveCkge1xuICAgIHN0YXRpYyB7IEdPYmplY3QucmVnaXN0ZXJDbGFzcyh7IEdUeXBlTmFtZTogXCJDZW50ZXJCb3hcIiB9LCB0aGlzKSB9XG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBDZW50ZXJCb3hQcm9wcywgLi4uY2hpbGRyZW46IEFycmF5PEJpbmRhYmxlQ2hpbGQ+KSB7IHN1cGVyKHsgY2hpbGRyZW4sIC4uLnByb3BzIH0gYXMgYW55KSB9XG4gICAgcHJvdGVjdGVkIHNldENoaWxkcmVuKGNoaWxkcmVuOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICBjb25zdCBjaCA9IGZpbHRlcihjaGlsZHJlbilcbiAgICAgICAgdGhpcy5zdGFydFdpZGdldCA9IGNoWzBdIHx8IG5ldyBHdGsuQm94XG4gICAgICAgIHRoaXMuY2VudGVyV2lkZ2V0ID0gY2hbMV0gfHwgbmV3IEd0ay5Cb3hcbiAgICAgICAgdGhpcy5lbmRXaWRnZXQgPSBjaFsyXSB8fCBuZXcgR3RrLkJveFxuICAgIH1cbn1cblxuLy8gQ2lyY3VsYXJQcm9ncmVzc1xuZXhwb3J0IHR5cGUgQ2lyY3VsYXJQcm9ncmVzc1Byb3BzID0gQ29uc3RydWN0UHJvcHM8Q2lyY3VsYXJQcm9ncmVzcywgQXN0YWwuQ2lyY3VsYXJQcm9ncmVzcy5Db25zdHJ1Y3RvclByb3BzPlxuZXhwb3J0IGNsYXNzIENpcmN1bGFyUHJvZ3Jlc3MgZXh0ZW5kcyBhc3RhbGlmeShBc3RhbC5DaXJjdWxhclByb2dyZXNzKSB7XG4gICAgc3RhdGljIHsgR09iamVjdC5yZWdpc3RlckNsYXNzKHsgR1R5cGVOYW1lOiBcIkNpcmN1bGFyUHJvZ3Jlc3NcIiB9LCB0aGlzKSB9XG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBDaXJjdWxhclByb2dyZXNzUHJvcHMsIGNoaWxkPzogQmluZGFibGVDaGlsZCkgeyBzdXBlcih7IGNoaWxkLCAuLi5wcm9wcyB9IGFzIGFueSkgfVxufVxuXG4vLyBEcmF3aW5nQXJlYVxuZXhwb3J0IHR5cGUgRHJhd2luZ0FyZWFQcm9wcyA9IENvbnN0cnVjdFByb3BzPERyYXdpbmdBcmVhLCBHdGsuRHJhd2luZ0FyZWEuQ29uc3RydWN0b3JQcm9wcywge1xuICAgIG9uRHJhdzogW2NyOiBhbnldIC8vIFRPRE86IGNhaXJvIHR5cGVzXG59PlxuZXhwb3J0IGNsYXNzIERyYXdpbmdBcmVhIGV4dGVuZHMgYXN0YWxpZnkoR3RrLkRyYXdpbmdBcmVhKSB7XG4gICAgc3RhdGljIHsgR09iamVjdC5yZWdpc3RlckNsYXNzKHsgR1R5cGVOYW1lOiBcIkRyYXdpbmdBcmVhXCIgfSwgdGhpcykgfVxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogRHJhd2luZ0FyZWFQcm9wcykgeyBzdXBlcihwcm9wcyBhcyBhbnkpIH1cbn1cblxuLy8gRW50cnlcbmV4cG9ydCB0eXBlIEVudHJ5UHJvcHMgPSBDb25zdHJ1Y3RQcm9wczxFbnRyeSwgR3RrLkVudHJ5LkNvbnN0cnVjdG9yUHJvcHMsIHtcbiAgICBvbkNoYW5nZWQ6IFtdXG4gICAgb25BY3RpdmF0ZTogW11cbn0+XG5leHBvcnQgY2xhc3MgRW50cnkgZXh0ZW5kcyBhc3RhbGlmeShHdGsuRW50cnkpIHtcbiAgICBzdGF0aWMgeyBHT2JqZWN0LnJlZ2lzdGVyQ2xhc3MoeyBHVHlwZU5hbWU6IFwiRW50cnlcIiB9LCB0aGlzKSB9XG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBFbnRyeVByb3BzKSB7IHN1cGVyKHByb3BzIGFzIGFueSkgfVxufVxuXG4vLyBFdmVudEJveFxuZXhwb3J0IHR5cGUgRXZlbnRCb3hQcm9wcyA9IENvbnN0cnVjdFByb3BzPEV2ZW50Qm94LCBBc3RhbC5FdmVudEJveC5Db25zdHJ1Y3RvclByb3BzLCB7XG4gICAgb25DbGljazogW2V2ZW50OiBBc3RhbC5DbGlja0V2ZW50XVxuICAgIG9uQ2xpY2tSZWxlYXNlOiBbZXZlbnQ6IEFzdGFsLkNsaWNrRXZlbnRdXG4gICAgb25Ib3ZlcjogW2V2ZW50OiBBc3RhbC5Ib3ZlckV2ZW50XVxuICAgIG9uSG92ZXJMb3N0OiBbZXZlbnQ6IEFzdGFsLkhvdmVyRXZlbnRdXG4gICAgb25TY3JvbGw6IFtldmVudDogQXN0YWwuU2Nyb2xsRXZlbnRdXG59PlxuZXhwb3J0IGNsYXNzIEV2ZW50Qm94IGV4dGVuZHMgYXN0YWxpZnkoQXN0YWwuRXZlbnRCb3gpIHtcbiAgICBzdGF0aWMgeyBHT2JqZWN0LnJlZ2lzdGVyQ2xhc3MoeyBHVHlwZU5hbWU6IFwiRXZlbnRCb3hcIiB9LCB0aGlzKSB9XG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBFdmVudEJveFByb3BzLCBjaGlsZD86IEJpbmRhYmxlQ2hpbGQpIHsgc3VwZXIoeyBjaGlsZCwgLi4ucHJvcHMgfSBhcyBhbnkpIH1cbn1cblxuLy8gLy8gVE9ETzogRml4ZWRcbi8vIC8vIFRPRE86IEZsb3dCb3hcbi8vXG4vLyBJY29uXG5leHBvcnQgdHlwZSBJY29uUHJvcHMgPSBDb25zdHJ1Y3RQcm9wczxJY29uLCBBc3RhbC5JY29uLkNvbnN0cnVjdG9yUHJvcHM+XG5leHBvcnQgY2xhc3MgSWNvbiBleHRlbmRzIGFzdGFsaWZ5KEFzdGFsLkljb24pIHtcbiAgICBzdGF0aWMgeyBHT2JqZWN0LnJlZ2lzdGVyQ2xhc3MoeyBHVHlwZU5hbWU6IFwiSWNvblwiIH0sIHRoaXMpIH1cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IEljb25Qcm9wcykgeyBzdXBlcihwcm9wcyBhcyBhbnkpIH1cbn1cblxuLy8gTGFiZWxcbmV4cG9ydCB0eXBlIExhYmVsUHJvcHMgPSBDb25zdHJ1Y3RQcm9wczxMYWJlbCwgQXN0YWwuTGFiZWwuQ29uc3RydWN0b3JQcm9wcz5cbmV4cG9ydCBjbGFzcyBMYWJlbCBleHRlbmRzIGFzdGFsaWZ5KEFzdGFsLkxhYmVsKSB7XG4gICAgc3RhdGljIHsgR09iamVjdC5yZWdpc3RlckNsYXNzKHsgR1R5cGVOYW1lOiBcIkxhYmVsXCIgfSwgdGhpcykgfVxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogTGFiZWxQcm9wcykgeyBzdXBlcihwcm9wcyBhcyBhbnkpIH1cbiAgICBwcm90ZWN0ZWQgc2V0Q2hpbGRyZW4oY2hpbGRyZW46IGFueVtdKTogdm9pZCB7IHRoaXMubGFiZWwgPSBTdHJpbmcoY2hpbGRyZW4pIH1cbn1cblxuLy8gTGV2ZWxCYXJcbmV4cG9ydCB0eXBlIExldmVsQmFyUHJvcHMgPSBDb25zdHJ1Y3RQcm9wczxMZXZlbEJhciwgQXN0YWwuTGV2ZWxCYXIuQ29uc3RydWN0b3JQcm9wcz5cbmV4cG9ydCBjbGFzcyBMZXZlbEJhciBleHRlbmRzIGFzdGFsaWZ5KEFzdGFsLkxldmVsQmFyKSB7XG4gICAgc3RhdGljIHsgR09iamVjdC5yZWdpc3RlckNsYXNzKHsgR1R5cGVOYW1lOiBcIkxldmVsQmFyXCIgfSwgdGhpcykgfVxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogTGV2ZWxCYXJQcm9wcykgeyBzdXBlcihwcm9wcyBhcyBhbnkpIH1cbn1cblxuLy8gVE9ETzogTGlzdEJveFxuXG4vLyBNZW51QnV0dG9uXG5leHBvcnQgdHlwZSBNZW51QnV0dG9uUHJvcHMgPSBDb25zdHJ1Y3RQcm9wczxNZW51QnV0dG9uLCBHdGsuTWVudUJ1dHRvbi5Db25zdHJ1Y3RvclByb3BzPlxuZXhwb3J0IGNsYXNzIE1lbnVCdXR0b24gZXh0ZW5kcyBhc3RhbGlmeShHdGsuTWVudUJ1dHRvbikge1xuICAgIHN0YXRpYyB7IEdPYmplY3QucmVnaXN0ZXJDbGFzcyh7IEdUeXBlTmFtZTogXCJNZW51QnV0dG9uXCIgfSwgdGhpcykgfVxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogTWVudUJ1dHRvblByb3BzLCBjaGlsZD86IEJpbmRhYmxlQ2hpbGQpIHsgc3VwZXIoeyBjaGlsZCwgLi4ucHJvcHMgfSBhcyBhbnkpIH1cbn1cblxuLy8gT3ZlcmxheVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KEFzdGFsLk92ZXJsYXkucHJvdG90eXBlLCBcIm92ZXJsYXlzXCIsIHtcbiAgICBnZXQoKSB7IHJldHVybiB0aGlzLmdldF9vdmVybGF5cygpIH0sXG4gICAgc2V0KHYpIHsgdGhpcy5zZXRfb3ZlcmxheXModikgfSxcbn0pXG5cbmV4cG9ydCB0eXBlIE92ZXJsYXlQcm9wcyA9IENvbnN0cnVjdFByb3BzPE92ZXJsYXksIEFzdGFsLk92ZXJsYXkuQ29uc3RydWN0b3JQcm9wcz5cbmV4cG9ydCBjbGFzcyBPdmVybGF5IGV4dGVuZHMgYXN0YWxpZnkoQXN0YWwuT3ZlcmxheSkge1xuICAgIHN0YXRpYyB7IEdPYmplY3QucmVnaXN0ZXJDbGFzcyh7IEdUeXBlTmFtZTogXCJPdmVybGF5XCIgfSwgdGhpcykgfVxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogT3ZlcmxheVByb3BzLCAuLi5jaGlsZHJlbjogQXJyYXk8QmluZGFibGVDaGlsZD4pIHsgc3VwZXIoeyBjaGlsZHJlbiwgLi4ucHJvcHMgfSBhcyBhbnkpIH1cbiAgICBwcm90ZWN0ZWQgc2V0Q2hpbGRyZW4oY2hpbGRyZW46IGFueVtdKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IFtjaGlsZCwgLi4ub3ZlcmxheXNdID0gZmlsdGVyKGNoaWxkcmVuKVxuICAgICAgICB0aGlzLnNldF9jaGlsZChjaGlsZClcbiAgICAgICAgdGhpcy5zZXRfb3ZlcmxheXMob3ZlcmxheXMpXG4gICAgfVxufVxuXG4vLyBSZXZlYWxlclxuZXhwb3J0IHR5cGUgUmV2ZWFsZXJQcm9wcyA9IENvbnN0cnVjdFByb3BzPFJldmVhbGVyLCBHdGsuUmV2ZWFsZXIuQ29uc3RydWN0b3JQcm9wcz5cbmV4cG9ydCBjbGFzcyBSZXZlYWxlciBleHRlbmRzIGFzdGFsaWZ5KEd0ay5SZXZlYWxlcikge1xuICAgIHN0YXRpYyB7IEdPYmplY3QucmVnaXN0ZXJDbGFzcyh7IEdUeXBlTmFtZTogXCJSZXZlYWxlclwiIH0sIHRoaXMpIH1cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IFJldmVhbGVyUHJvcHMsIGNoaWxkPzogQmluZGFibGVDaGlsZCkgeyBzdXBlcih7IGNoaWxkLCAuLi5wcm9wcyB9IGFzIGFueSkgfVxufVxuXG4vLyBTY3JvbGxhYmxlXG5leHBvcnQgdHlwZSBTY3JvbGxhYmxlUHJvcHMgPSBDb25zdHJ1Y3RQcm9wczxTY3JvbGxhYmxlLCBBc3RhbC5TY3JvbGxhYmxlLkNvbnN0cnVjdG9yUHJvcHM+XG5leHBvcnQgY2xhc3MgU2Nyb2xsYWJsZSBleHRlbmRzIGFzdGFsaWZ5KEFzdGFsLlNjcm9sbGFibGUpIHtcbiAgICBzdGF0aWMgeyBHT2JqZWN0LnJlZ2lzdGVyQ2xhc3MoeyBHVHlwZU5hbWU6IFwiU2Nyb2xsYWJsZVwiIH0sIHRoaXMpIH1cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IFNjcm9sbGFibGVQcm9wcywgY2hpbGQ/OiBCaW5kYWJsZUNoaWxkKSB7IHN1cGVyKHsgY2hpbGQsIC4uLnByb3BzIH0gYXMgYW55KSB9XG59XG5cbi8vIFNsaWRlclxuZXhwb3J0IHR5cGUgU2xpZGVyUHJvcHMgPSBDb25zdHJ1Y3RQcm9wczxTbGlkZXIsIEFzdGFsLlNsaWRlci5Db25zdHJ1Y3RvclByb3BzLCB7XG4gICAgb25EcmFnZ2VkOiBbXVxufT5cbmV4cG9ydCBjbGFzcyBTbGlkZXIgZXh0ZW5kcyBhc3RhbGlmeShBc3RhbC5TbGlkZXIpIHtcbiAgICBzdGF0aWMgeyBHT2JqZWN0LnJlZ2lzdGVyQ2xhc3MoeyBHVHlwZU5hbWU6IFwiU2xpZGVyXCIgfSwgdGhpcykgfVxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogU2xpZGVyUHJvcHMpIHsgc3VwZXIocHJvcHMgYXMgYW55KSB9XG59XG5cbi8vIFN0YWNrXG5leHBvcnQgdHlwZSBTdGFja1Byb3BzID0gQ29uc3RydWN0UHJvcHM8U3RhY2ssIEFzdGFsLlN0YWNrLkNvbnN0cnVjdG9yUHJvcHM+XG5leHBvcnQgY2xhc3MgU3RhY2sgZXh0ZW5kcyBhc3RhbGlmeShBc3RhbC5TdGFjaykge1xuICAgIHN0YXRpYyB7IEdPYmplY3QucmVnaXN0ZXJDbGFzcyh7IEdUeXBlTmFtZTogXCJTdGFja1wiIH0sIHRoaXMpIH1cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IFN0YWNrUHJvcHMsIC4uLmNoaWxkcmVuOiBBcnJheTxCaW5kYWJsZUNoaWxkPikgeyBzdXBlcih7IGNoaWxkcmVuLCAuLi5wcm9wcyB9IGFzIGFueSkgfVxuICAgIHByb3RlY3RlZCBzZXRDaGlsZHJlbihjaGlsZHJlbjogYW55W10pOiB2b2lkIHsgdGhpcy5zZXRfY2hpbGRyZW4oZmlsdGVyKGNoaWxkcmVuKSkgfVxufVxuXG4vLyBTd2l0Y2hcbmV4cG9ydCB0eXBlIFN3aXRjaFByb3BzID0gQ29uc3RydWN0UHJvcHM8U3dpdGNoLCBHdGsuU3dpdGNoLkNvbnN0cnVjdG9yUHJvcHM+XG5leHBvcnQgY2xhc3MgU3dpdGNoIGV4dGVuZHMgYXN0YWxpZnkoR3RrLlN3aXRjaCkge1xuICAgIHN0YXRpYyB7IEdPYmplY3QucmVnaXN0ZXJDbGFzcyh7IEdUeXBlTmFtZTogXCJTd2l0Y2hcIiB9LCB0aGlzKSB9XG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBTd2l0Y2hQcm9wcykgeyBzdXBlcihwcm9wcyBhcyBhbnkpIH1cbn1cblxuLy8gV2luZG93XG5leHBvcnQgdHlwZSBXaW5kb3dQcm9wcyA9IENvbnN0cnVjdFByb3BzPFdpbmRvdywgQXN0YWwuV2luZG93LkNvbnN0cnVjdG9yUHJvcHM+XG5leHBvcnQgY2xhc3MgV2luZG93IGV4dGVuZHMgYXN0YWxpZnkoQXN0YWwuV2luZG93KSB7XG4gICAgc3RhdGljIHsgR09iamVjdC5yZWdpc3RlckNsYXNzKHsgR1R5cGVOYW1lOiBcIldpbmRvd1wiIH0sIHRoaXMpIH1cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IFdpbmRvd1Byb3BzLCBjaGlsZD86IEJpbmRhYmxlQ2hpbGQpIHsgc3VwZXIoeyBjaGlsZCwgLi4ucHJvcHMgfSBhcyBhbnkpIH1cbn1cbiIsICJ3aW5kb3cuT1NEIGJveC5PU0Qge1xuICBib3JkZXItcmFkaXVzOiA2cHg7XG4gIGJhY2tncm91bmQtY29sb3I6IEB0aGVtZV9iZ19jb2xvcjtcbiAgcGFkZGluZzogMTNweDtcbiAgbWFyZ2luOiAxM3B4O1xuICBtYXJnaW4tYm90dG9tOiA1MHB4O1xuICBtaW4td2lkdGg6IDZyZW07XG4gIGJhY2tncm91bmQtY29sb3I6IHJnYmEoOCwgOCwgOCwgMC40KTtcbn1cbndpbmRvdy5PU0QgaWNvbiB7XG4gIGZvbnQtc2l6ZTogNXJlbTtcbn1cbndpbmRvdy5PU0QgbGFiZWwge1xuICBmb250LXNpemU6IDEuMXJlbTtcbn1cbndpbmRvdy5PU0QgbGV2ZWxiYXIgdHJvdWdoIHtcbiAgbWFyZ2luOiAxcHggMC42cmVtO1xuICBtaW4td2lkdGg6IDVyZW07XG59XG53aW5kb3cuT1NEIGxldmVsYmFyIGJsb2NrIHtcbiAgcGFkZGluZzogNnB4O1xuICBib3JkZXItcmFkaXVzOiA0cHg7XG59IiwgImltcG9ydCBHT2JqZWN0IGZyb20gXCJnaTovL0dPYmplY3RcIlxuXG5leHBvcnQgeyBkZWZhdWx0IGFzIEdMaWIgfSBmcm9tIFwiZ2k6Ly9HTGliP3ZlcnNpb249Mi4wXCJcbmV4cG9ydCB7IEdPYmplY3QsIEdPYmplY3QgYXMgZGVmYXVsdCB9XG5cbmNvbnN0IG1ldGEgPSBTeW1ib2woXCJtZXRhXCIpXG5jb25zdCBwcml2ID0gU3ltYm9sKFwicHJpdlwiKVxuXG5jb25zdCB7IFBhcmFtU3BlYywgUGFyYW1GbGFncyB9ID0gR09iamVjdFxuXG5jb25zdCBrZWJhYmlmeSA9IChzdHI6IHN0cmluZykgPT4gc3RyXG4gICAgLnJlcGxhY2UoLyhbYS16XSkoW0EtWl0pL2csIFwiJDEtJDJcIilcbiAgICAucmVwbGFjZUFsbChcIl9cIiwgXCItXCIpXG4gICAgLnRvTG93ZXJDYXNlKClcblxudHlwZSBTaWduYWxEZWNsYXJhdGlvbiA9IHtcbiAgICBmbGFncz86IEdPYmplY3QuU2lnbmFsRmxhZ3NcbiAgICBhY2N1bXVsYXRvcj86IEdPYmplY3QuQWNjdW11bGF0b3JUeXBlXG4gICAgcmV0dXJuX3R5cGU/OiBHT2JqZWN0LkdUeXBlXG4gICAgcGFyYW1fdHlwZXM/OiBBcnJheTxHT2JqZWN0LkdUeXBlPlxufVxuXG50eXBlIFByb3BlcnR5RGVjbGFyYXRpb24gPVxuICAgIHwgSW5zdGFuY2VUeXBlPHR5cGVvZiBHT2JqZWN0LlBhcmFtU3BlYz5cbiAgICB8IHsgJGd0eXBlOiBHT2JqZWN0LkdUeXBlIH1cbiAgICB8IHR5cGVvZiBTdHJpbmdcbiAgICB8IHR5cGVvZiBOdW1iZXJcbiAgICB8IHR5cGVvZiBCb29sZWFuXG4gICAgfCB0eXBlb2YgT2JqZWN0XG5cbnR5cGUgR09iamVjdENvbnN0cnVjdG9yID0ge1xuICAgIFttZXRhXT86IHtcbiAgICAgICAgUHJvcGVydGllcz86IHsgW2tleTogc3RyaW5nXTogR09iamVjdC5QYXJhbVNwZWMgfVxuICAgICAgICBTaWduYWxzPzogeyBba2V5OiBzdHJpbmddOiBHT2JqZWN0LlNpZ25hbERlZmluaXRpb24gfVxuICAgIH1cbiAgICBuZXcoLi4uYXJnczogYW55W10pOiBhbnlcbn1cblxudHlwZSBNZXRhSW5mbyA9IEdPYmplY3QuTWV0YUluZm88bmV2ZXIsIEFycmF5PHsgJGd0eXBlOiBHT2JqZWN0LkdUeXBlIH0+LCBuZXZlcj5cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyKG9wdGlvbnM6IE1ldGFJbmZvID0ge30pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGNsczogR09iamVjdENvbnN0cnVjdG9yKSB7XG4gICAgICAgIGNvbnN0IHQgPSBvcHRpb25zLlRlbXBsYXRlXG4gICAgICAgIGlmICh0eXBlb2YgdCA9PT0gXCJzdHJpbmdcIiAmJiAhdC5zdGFydHNXaXRoKFwicmVzb3VyY2U6Ly9cIikgJiYgIXQuc3RhcnRzV2l0aChcImZpbGU6Ly9cIikpIHtcbiAgICAgICAgICAgIC8vIGFzc3VtZSB4bWwgdGVtcGxhdGVcbiAgICAgICAgICAgIG9wdGlvbnMuVGVtcGxhdGUgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUodClcbiAgICAgICAgfVxuXG4gICAgICAgIEdPYmplY3QucmVnaXN0ZXJDbGFzcyh7XG4gICAgICAgICAgICBTaWduYWxzOiB7IC4uLmNsc1ttZXRhXT8uU2lnbmFscyB9LFxuICAgICAgICAgICAgUHJvcGVydGllczogeyAuLi5jbHNbbWV0YV0/LlByb3BlcnRpZXMgfSxcbiAgICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgIH0sIGNscylcblxuICAgICAgICBkZWxldGUgY2xzW21ldGFdXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJvcGVydHkoZGVjbGFyYXRpb246IFByb3BlcnR5RGVjbGFyYXRpb24gPSBPYmplY3QpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldDogYW55LCBwcm9wOiBhbnksIGRlc2M/OiBQcm9wZXJ0eURlc2NyaXB0b3IpIHtcbiAgICAgICAgdGFyZ2V0LmNvbnN0cnVjdG9yW21ldGFdID8/PSB7fVxuICAgICAgICB0YXJnZXQuY29uc3RydWN0b3JbbWV0YV0uUHJvcGVydGllcyA/Pz0ge31cblxuICAgICAgICBjb25zdCBuYW1lID0ga2ViYWJpZnkocHJvcClcblxuICAgICAgICBpZiAoIWRlc2MpIHtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIHByb3AsIHtcbiAgICAgICAgICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW3ByaXZdPy5bcHJvcF0gPz8gZGVmYXVsdFZhbHVlKGRlY2xhcmF0aW9uKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2V0KHY6IGFueSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodiAhPT0gdGhpc1twcm9wXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1twcml2XSA/Pz0ge31cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbcHJpdl1bcHJvcF0gPSB2XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5vdGlmeShuYW1lKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGBzZXRfJHtuYW1lLnJlcGxhY2UoXCItXCIsIFwiX1wiKX1gLCB7XG4gICAgICAgICAgICAgICAgdmFsdWUodjogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNbcHJvcF0gPSB2XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGBnZXRfJHtuYW1lLnJlcGxhY2UoXCItXCIsIFwiX1wiKX1gLCB7XG4gICAgICAgICAgICAgICAgdmFsdWUoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW3Byb3BdXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIHRhcmdldC5jb25zdHJ1Y3RvclttZXRhXS5Qcm9wZXJ0aWVzW2tlYmFiaWZ5KHByb3ApXSA9IHBzcGVjKG5hbWUsIFBhcmFtRmxhZ3MuUkVBRFdSSVRFLCBkZWNsYXJhdGlvbilcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxldCBmbGFncyA9IDBcbiAgICAgICAgICAgIGlmIChkZXNjLmdldCkgZmxhZ3MgfD0gUGFyYW1GbGFncy5SRUFEQUJMRVxuICAgICAgICAgICAgaWYgKGRlc2Muc2V0KSBmbGFncyB8PSBQYXJhbUZsYWdzLldSSVRBQkxFXG5cbiAgICAgICAgICAgIHRhcmdldC5jb25zdHJ1Y3RvclttZXRhXS5Qcm9wZXJ0aWVzW2tlYmFiaWZ5KHByb3ApXSA9IHBzcGVjKG5hbWUsIGZsYWdzLCBkZWNsYXJhdGlvbilcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNpZ25hbCguLi5wYXJhbXM6IEFycmF5PHsgJGd0eXBlOiBHT2JqZWN0LkdUeXBlIH0gfCB0eXBlb2YgT2JqZWN0Pik6XG4odGFyZ2V0OiBhbnksIHNpZ25hbDogYW55LCBkZXNjPzogUHJvcGVydHlEZXNjcmlwdG9yKSA9PiB2b2lkXG5cbmV4cG9ydCBmdW5jdGlvbiBzaWduYWwoZGVjbGFyYXRpb24/OiBTaWduYWxEZWNsYXJhdGlvbik6XG4odGFyZ2V0OiBhbnksIHNpZ25hbDogYW55LCBkZXNjPzogUHJvcGVydHlEZXNjcmlwdG9yKSA9PiB2b2lkXG5cbmV4cG9ydCBmdW5jdGlvbiBzaWduYWwoXG4gICAgZGVjbGFyYXRpb24/OiBTaWduYWxEZWNsYXJhdGlvbiB8IHsgJGd0eXBlOiBHT2JqZWN0LkdUeXBlIH0gfCB0eXBlb2YgT2JqZWN0LFxuICAgIC4uLnBhcmFtczogQXJyYXk8eyAkZ3R5cGU6IEdPYmplY3QuR1R5cGUgfSB8IHR5cGVvZiBPYmplY3Q+XG4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldDogYW55LCBzaWduYWw6IGFueSwgZGVzYz86IFByb3BlcnR5RGVzY3JpcHRvcikge1xuICAgICAgICB0YXJnZXQuY29uc3RydWN0b3JbbWV0YV0gPz89IHt9XG4gICAgICAgIHRhcmdldC5jb25zdHJ1Y3RvclttZXRhXS5TaWduYWxzID8/PSB7fVxuXG4gICAgICAgIGNvbnN0IG5hbWUgPSBrZWJhYmlmeShzaWduYWwpXG5cbiAgICAgICAgaWYgKGRlY2xhcmF0aW9uIHx8IHBhcmFtcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIFRPRE86IHR5cGUgYXNzZXJ0XG4gICAgICAgICAgICBjb25zdCBhcnIgPSBbZGVjbGFyYXRpb24sIC4uLnBhcmFtc10ubWFwKHYgPT4gdi4kZ3R5cGUpXG4gICAgICAgICAgICB0YXJnZXQuY29uc3RydWN0b3JbbWV0YV0uU2lnbmFsc1tuYW1lXSA9IHtcbiAgICAgICAgICAgICAgICBwYXJhbV90eXBlczogYXJyLFxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGFyZ2V0LmNvbnN0cnVjdG9yW21ldGFdLlNpZ25hbHNbbmFtZV0gPSBkZWNsYXJhdGlvbiB8fCB7XG4gICAgICAgICAgICAgICAgcGFyYW1fdHlwZXM6IFtdLFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFkZXNjKSB7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBzaWduYWwsIHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogZnVuY3Rpb24gKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdChuYW1lLCAuLi5hcmdzKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgb2c6ICgoLi4uYXJnczogYW55W10pID0+IHZvaWQpID0gZGVzYy52YWx1ZVxuICAgICAgICAgICAgZGVzYy52YWx1ZSA9IGZ1bmN0aW9uICguLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3Igbm90IHR5cGVkXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KG5hbWUsIC4uLmFyZ3MpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBgb25fJHtuYW1lLnJlcGxhY2UoXCItXCIsIFwiX1wiKX1gLCB7XG4gICAgICAgICAgICAgICAgdmFsdWU6IGZ1bmN0aW9uICguLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2cuYXBwbHkodGhpcywgYXJncylcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcHNwZWMobmFtZTogc3RyaW5nLCBmbGFnczogbnVtYmVyLCBkZWNsYXJhdGlvbjogUHJvcGVydHlEZWNsYXJhdGlvbikge1xuICAgIGlmIChkZWNsYXJhdGlvbiBpbnN0YW5jZW9mIFBhcmFtU3BlYylcbiAgICAgICAgcmV0dXJuIGRlY2xhcmF0aW9uXG5cbiAgICBzd2l0Y2ggKGRlY2xhcmF0aW9uKSB7XG4gICAgICAgIGNhc2UgU3RyaW5nOlxuICAgICAgICAgICAgcmV0dXJuIFBhcmFtU3BlYy5zdHJpbmcobmFtZSwgXCJcIiwgXCJcIiwgZmxhZ3MsIFwiXCIpXG4gICAgICAgIGNhc2UgTnVtYmVyOlxuICAgICAgICAgICAgcmV0dXJuIFBhcmFtU3BlYy5kb3VibGUobmFtZSwgXCJcIiwgXCJcIiwgZmxhZ3MsIC1OdW1iZXIuTUFYX1ZBTFVFLCBOdW1iZXIuTUFYX1ZBTFVFLCAwKVxuICAgICAgICBjYXNlIEJvb2xlYW46XG4gICAgICAgICAgICByZXR1cm4gUGFyYW1TcGVjLmJvb2xlYW4obmFtZSwgXCJcIiwgXCJcIiwgZmxhZ3MsIGZhbHNlKVxuICAgICAgICBjYXNlIE9iamVjdDpcbiAgICAgICAgICAgIHJldHVybiBQYXJhbVNwZWMuanNvYmplY3QobmFtZSwgXCJcIiwgXCJcIiwgZmxhZ3MpXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIG1pc3N0eXBlZFxuICAgICAgICAgICAgcmV0dXJuIFBhcmFtU3BlYy5vYmplY3QobmFtZSwgXCJcIiwgXCJcIiwgZmxhZ3MsIGRlY2xhcmF0aW9uLiRndHlwZSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRWYWx1ZShkZWNsYXJhdGlvbjogUHJvcGVydHlEZWNsYXJhdGlvbikge1xuICAgIGlmIChkZWNsYXJhdGlvbiBpbnN0YW5jZW9mIFBhcmFtU3BlYylcbiAgICAgICAgcmV0dXJuIGRlY2xhcmF0aW9uLmdldF9kZWZhdWx0X3ZhbHVlKClcblxuICAgIHN3aXRjaCAoZGVjbGFyYXRpb24pIHtcbiAgICAgICAgY2FzZSBTdHJpbmc6XG4gICAgICAgICAgICByZXR1cm4gXCJcIlxuICAgICAgICBjYXNlIE51bWJlcjpcbiAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgIGNhc2UgQm9vbGVhbjpcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICBjYXNlIE9iamVjdDpcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgfVxufVxuIiwgImltcG9ydCBBc3RhbCBmcm9tIFwiZ2k6Ly9Bc3RhbElPXCJcbmltcG9ydCBHaW8gZnJvbSBcImdpOi8vR2lvP3ZlcnNpb249Mi4wXCJcblxuZXhwb3J0IHsgR2lvIH1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRGaWxlKHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIEFzdGFsLnJlYWRfZmlsZShwYXRoKSB8fCBcIlwiXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkRmlsZUFzeW5jKHBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgQXN0YWwucmVhZF9maWxlX2FzeW5jKHBhdGgsIChfLCByZXMpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShBc3RhbC5yZWFkX2ZpbGVfZmluaXNoKHJlcykgfHwgXCJcIilcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUZpbGUocGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBBc3RhbC53cml0ZV9maWxlKHBhdGgsIGNvbnRlbnQpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUZpbGVBc3luYyhwYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIEFzdGFsLndyaXRlX2ZpbGVfYXN5bmMocGF0aCwgY29udGVudCwgKF8sIHJlcykgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKEFzdGFsLndyaXRlX2ZpbGVfZmluaXNoKHJlcykpXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gbW9uaXRvckZpbGUoXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGNhbGxiYWNrOiAoZmlsZTogc3RyaW5nLCBldmVudDogR2lvLkZpbGVNb25pdG9yRXZlbnQpID0+IHZvaWQsXG4pOiBHaW8uRmlsZU1vbml0b3Ige1xuICAgIHJldHVybiBBc3RhbC5tb25pdG9yX2ZpbGUocGF0aCwgKGZpbGU6IHN0cmluZywgZXZlbnQ6IEdpby5GaWxlTW9uaXRvckV2ZW50KSA9PiB7XG4gICAgICAgIGNhbGxiYWNrKGZpbGUsIGV2ZW50KVxuICAgIH0pIVxufVxuIiwgImltcG9ydCBHT2JqZWN0LCB7IHJlZ2lzdGVyLCBwcm9wZXJ0eSB9IGZyb20gXCJhc3RhbC9nb2JqZWN0XCJcbmltcG9ydCB7IG1vbml0b3JGaWxlLCByZWFkRmlsZUFzeW5jIH0gZnJvbSBcImFzdGFsL2ZpbGVcIlxuaW1wb3J0IHsgZXhlYywgZXhlY0FzeW5jIH0gZnJvbSBcImFzdGFsL3Byb2Nlc3NcIlxuXG5jb25zdCBnZXQgPSAoYXJnczogc3RyaW5nKSA9PiBOdW1iZXIoZXhlYyhgYnJpZ2h0bmVzc2N0bCAke2FyZ3N9YCkpXG5jb25zdCBzY3JlZW4gPSBleGVjKGBiYXNoIC1jIFwibHMgLXcxIC9zeXMvY2xhc3MvYmFja2xpZ2h0IHwgaGVhZCAtMVwiYClcblxuQHJlZ2lzdGVyKHsgR1R5cGVOYW1lOiBcIkJyaWdodG5lc3NcIiB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQnJpZ2h0bmVzcyBleHRlbmRzIEdPYmplY3QuT2JqZWN0IHtcbiAgICBzdGF0aWMgaW5zdGFuY2U6IEJyaWdodG5lc3NcbiAgICBzdGF0aWMgZ2V0X2RlZmF1bHQoKSB7XG4gICAgICAgIGlmICghdGhpcy5pbnN0YW5jZSlcbiAgICAgICAgICAgIHRoaXMuaW5zdGFuY2UgPSBuZXcgQnJpZ2h0bmVzcygpXG5cbiAgICAgICAgcmV0dXJuIHRoaXMuaW5zdGFuY2VcbiAgICB9XG5cbiAgICAvLyBTY3JlZW4gYmFja2xpZ2h0XG4gICAgI3NjcmVlbk1heCA9IGdldChcIm1heFwiKVxuICAgICNzY3JlZW4gPSBnZXQoXCJnZXRcIikgLyAoZ2V0KFwibWF4XCIpIHx8IDEpXG4gICAgbWFudWZhY3R1cmVyID0gXCJDaGltZWkgSW5ub2x1eCBDb3Jwb3JhdGlvblwiXG4gICAgbW9kZWwgPVwiMHgxNUU3XCJcblxuICAgIEBwcm9wZXJ0eShOdW1iZXIpXG4gICAgZ2V0IHNjcmVlbigpIHsgcmV0dXJuIHRoaXMuI3NjcmVlbiB9XG5cbiAgICBzZXQgc2NyZWVuKHBlcmNlbnQpIHtcbiAgICAgICAgaWYgKHBlcmNlbnQgPCAwKVxuICAgICAgICAgICAgcGVyY2VudCA9IDBcblxuICAgICAgICBpZiAocGVyY2VudCA+IDEpXG4gICAgICAgICAgICBwZXJjZW50ID0gMVxuXG4gICAgICAgIGV4ZWNBc3luYyhgYnJpZ2h0bmVzc2N0bCBzZXQgJHtNYXRoLmZsb29yKHBlcmNlbnQgKiAxMDApfSUgLXFgKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuI3NjcmVlbiA9IHBlcmNlbnRcbiAgICAgICAgICAgIHRoaXMubm90aWZ5KFwic2NyZWVuXCIpXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKClcbiAgICAgICAgbW9uaXRvckZpbGUoYC9zeXMvY2xhc3MvYmFja2xpZ2h0LyR7c2NyZWVufS9icmlnaHRuZXNzYCwgYXN5bmMgZiA9PiB7XG4gICAgICAgICAgICBjb25zdCB2ID0gYXdhaXQgcmVhZEZpbGVBc3luYyhmKVxuICAgICAgICAgICAgdGhpcy4jc2NyZWVuID0gTnVtYmVyKHYpIC8gdGhpcy4jc2NyZWVuTWF4XG4gICAgICAgICAgICAvLyBwcmludCh0aGlzLiNzY3JlZW4pXG4gICAgICAgICAgICB0aGlzLm5vdGlmeShcInNjcmVlblwiKVxuICAgICAgICB9KVxuICAgIH1cbn0iLCAiaW1wb3J0IEdPYmplY3QsIHsgcmVnaXN0ZXIsIHByb3BlcnR5IH0gZnJvbSBcImFzdGFsL2dvYmplY3RcIlxuaW1wb3J0IEdMaWIgZnJvbSBcImdpOi8vR0xpYlwiO1xuaW1wb3J0IHsgbW9uaXRvckZpbGUsIHJlYWRGaWxlQXN5bmMgfSBmcm9tIFwiYXN0YWwvZmlsZVwiXG5pbXBvcnQgeyBleGVjLCBleGVjQXN5bmMgfSBmcm9tIFwiYXN0YWwvcHJvY2Vzc1wiXG5cbmNvbnN0IG91dHB1dCA9IGV4ZWMoXCJkZGN1dGlsIGRldGVjdFwiKS5zcGxpdCgnXFxuJylcblxudHlwZSBNeVR1cGxlID0gW251bWJlciwgc3RyaW5nXTtcblxubGV0IHNjcmVlbnM6IE15VHVwbGVbXSAgPSBbXVxuXG5mb3IgKGxldCBpID0gMDsgaSA8IG91dHB1dC5sZW5ndGg7IGkrKykge1xuICAgIC8vIHByaW50KCdzdGFydCBsb29wJywgaSwgb3V0cHV0W2kgKyAxXSk7XG5cbiAgICBpZiAob3V0cHV0W2ldLnN0YXJ0c1dpdGgoXCJEaXNwbGF5XCIpKSB7XG4gICAgICAgIGNvbnN0IGJ1cyA9IG91dHB1dFtpICsgMV0/LnNwbGl0KCctJylbMV07XG4gICAgICAgIGNvbnN0IG1vZGVsID0gb3V0cHV0W2kgKyA1XT8uc3BsaXQoJzonKVsxXS50cmltKClcbiAgICAgICAgc2NyZWVucy5wdXNoKFtOdW1iZXIoYnVzKSwgbW9kZWxdKTtcbiAgICAgICAgaSA9ICBpKzlcbiAgICB9XG5cbn1cblxuQHJlZ2lzdGVyKHsgR1R5cGVOYW1lOiBcIkJyaWdodG5lc3NERENcIiB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQnJpZ2h0bmVzc0REQyBleHRlbmRzIEdPYmplY3QuT2JqZWN0ICB7XG4gICAgc3RhdGljIGluc3RhbmNlOiBCcmlnaHRuZXNzRERDXG4gICAgc3RhdGljIGdldF9kZWZhdWx0KCkge1xuICAgICAgICBpZiAoIXRoaXMuaW5zdGFuY2UpXG4gICAgICAgICAgICB0aGlzLmluc3RhbmNlID0gbmV3IEJyaWdodG5lc3NEREMoKVxuXG4gICAgICAgIHJldHVybiB0aGlzLmluc3RhbmNlXG4gICAgfVxuXG4gICAgI2RkYyA9IDFcbiAgICBidXNOYW1lID0gMTBcbiAgICBtb2RlbCA9ICdMRU4gLSBMZW5vdm8gR3JvdXAgTGltaXRlZCdcblxuICAgIEBwcm9wZXJ0eShOdW1iZXIpXG4gICAgZ2V0IGRkYygpIHsgcmV0dXJuIHRoaXMuI2RkYyB9XG5cbiAgICBzZXQgZGRjKHBlcmNlbnQpIHtcbiAgICAgICAgcHJpbnQoYFtCcmlnaHRuZXNzRERDLVNFVFRFUl0gQXR0ZW1wdGluZyB0byBzZXQgc2NyZWVuX2RkYyB0bzogJHtwZXJjZW50fSBmb3IgYnVzOiAke3RoaXMuYnVzTmFtZX1gKTtcblxuICAgICAgICBleGVjQXN5bmMoYGRkY3V0aWwgLS1zbGVlcC1tdWx0aXBsaWVyPTAuMDEgLS1za2lwLWRkYy1jaGVja3MgLS1idXM9JHt0aGlzLmJ1c05hbWV9IHNldHZjcCAxMCAke3BlcmNlbnR9YCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLiNkZGMgPSBOdW1iZXIoZXhlYyhgZGRjdXRpbCAtLXNsZWVwLW11bHRpcGxpZXI9MC4wMSAtLXNraXAtZGRjLWNoZWNrcyAtLWJ1cz0ke3RoaXMuYnVzTmFtZX0gZ2V0dmNwIDEwIHwgZ3JlcCAtb1AgJ2N1cnJlbnQgdmFsdWUgPVxccypcXEtcXGQrYCkpIC8gMTAwXG4gICAgICAgICAgICB0aGlzLm5vdGlmeShcImRkY1wiKVxuICAgICAgICB9KVxuXG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoIGJ1c05hbWU6IG51bWJlciA9IDEwLCBtb2RlbDogc3RyaW5nICA9IFwiTEVOIC0gTGVub3ZvIEdyb3VwIExpbWl0ZWRcIikge1xuICAgICAgICBzdXBlcigpXG4gICAgICAgIHRoaXMuYnVzTmFtZSA9IGJ1c05hbWVcbiAgICAgICAgdGhpcy5tb2RlbCA9IG1vZGVsXG5cbiAgICAgICAgY29uc3QgcnVudGltZURpciA9IEdMaWIuZ2V0ZW52KFwiWERHX1JVTlRJTUVfRElSXCIpXG4gICAgICAgIFxuICAgICAgICAvLyBwcmludChgJHtydW50aW1lRGlyfS9icmlnaHRuZXNzLyR7YnVzTmFtZX1gKVxuICAgICAgICBcbiAgICAgICAgbW9uaXRvckZpbGUoYCR7cnVudGltZURpcn0vYnJpZ2h0bmVzcy8ke2J1c05hbWV9YCwgYXN5bmMgZiA9PiB7XG4gICAgICAgICAgICBjb25zdCB2ID0gYXdhaXQgcmVhZEZpbGVBc3luYyhmKVxuICAgICAgICAgICAgdGhpcy4jZGRjID0gTnVtYmVyKHYpIC8gMTAwXG4gICAgICAgICAgICAvLyBwcmludCh0aGlzLiNkZGMpO1xuICAgICAgICAgICAgdGhpcy5ub3RpZnkoXCJkZGNcIilcbiAgICAgICAgfSlcbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBtYXBwZWRTY3JlZW4gPSBzY3JlZW5zLm1hcChidXNOdW0gPT4gbmV3IEJyaWdodG5lc3NEREMoYnVzTnVtWzBdLCBidXNOdW1bMV0pKSIsICJpbXBvcnQgeyBBcHAsIEFzdGFsLCBHZGssIEd0ayB9IGZyb20gXCJhc3RhbC9ndGszXCJcbmltcG9ydCB7IHRpbWVvdXQgfSBmcm9tIFwiYXN0YWwvdGltZVwiXG5pbXBvcnQgVmFyaWFibGUgZnJvbSBcImFzdGFsL3ZhcmlhYmxlXCJcbmltcG9ydCBCcmlnaHRuZXNzIGZyb20gXCIuL2JhY2tsaWdodFwiXG5pbXBvcnQgQnJpZ2h0bmVzc0REQywgeyBtYXBwZWRTY3JlZW4gfSBmcm9tIFwiLi9kZGN1dGlsXCJcbmltcG9ydCBCYXR0ZXJ5IGZyb20gXCJnaTovL0FzdGFsQmF0dGVyeVwiXG5pbXBvcnQgRGV2aWNlIGZyb20gXCJnaTovL0FzdGFsQmF0dGVyeVwiXG5pbXBvcnQgV3AgZnJvbSBcImdpOi8vQXN0YWxXcFwiXG5cbnR5cGUgT25TY3JlZW5Qcm9ncmVzc1Byb3BzID0ge1xuICAgIHZpc2libGU6IFZhcmlhYmxlPGJvb2xlYW4+O1xuICAgIG1vbml0b3JUeXBlOiBWYXJpYWJsZTxzdHJpbmcgfCBudWxsPjtcbn07XG5cbmZ1bmN0aW9uIE9uU2NyZWVuUHJvZ3Jlc3MoIHt2aXNpYmxlLCBtb25pdG9yVHlwZX06IE9uU2NyZWVuUHJvZ3Jlc3NQcm9wcykge1xuICAgIGNvbnN0IGJyaWdodG5lc3MgPSBCcmlnaHRuZXNzLmdldF9kZWZhdWx0KClcbiAgICBjb25zdCBicmlnaHRuZXNzRERDID0gQnJpZ2h0bmVzc0REQy5nZXRfZGVmYXVsdCgpXG4gICAgY29uc3Qgc3BlYWtlciA9IFdwLmdldF9kZWZhdWx0KCkhLmdldF9kZWZhdWx0X3NwZWFrZXIoKVxuICAgIC8vIGNvbnN0IG1pY3JvcGhvbmUgPSBXcC5nZXRfZGVmYXVsdCgpIS5nZXRfZGVmYXVsdF9taWNyb3Bob25lKClcbiAgICBjb25zdCBiYXR0ZXJ5ID0gQmF0dGVyeS5nZXRfZGVmYXVsdCgpXG5cbiAgICAvLyBmb3IgKGxldCBrZXkgaW4gYmF0dGVyeSkge1xuICAgIC8vIHRyeSB7XG4gICAgLy8gICAgIHByaW50KGAke2tleX06ICR7YmF0dGVyeVtrZXldfWApO1xuICAgIC8vIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyAgICAgcHJpbnQoYCR7a2V5fTogW0Vycm9yIHJlYWRpbmcgcHJvcGVydHldYCk7XG4gICAgLy8gICAgIH1cbiAgICAvLyB9XG5cbiAgICBjb25zdCBpY29uTmFtZSA9IFZhcmlhYmxlKFwiXCIpXG4gICAgY29uc3QgdmFsdWUgPSBWYXJpYWJsZSgwKVxuXG4gICAgbGV0IGNvdW50ID0gMFxuICAgIGZ1bmN0aW9uIHNob3codjogYW55LCBpY29uOiBzdHJpbmcpIHtcbiAgICAgICAgdmlzaWJsZS5zZXQodHJ1ZSlcbiAgICAgICAgdmFsdWUuc2V0KHYpXG4gICAgICAgIGljb25OYW1lLnNldChpY29uKVxuICAgICAgICBjb3VudCsrXG4gICAgICAgIHRpbWVvdXQoMjAwMCwgKCkgPT4ge1xuICAgICAgICAgICAgY291bnQtLVxuICAgICAgICAgICAgaWYgKGNvdW50ID09PSAwKSB2aXNpYmxlLnNldChmYWxzZSlcbiAgICAgICAgfSlcbiAgICAgICAgLy8gcHJpbnQoJ3Nob3dpbmcnLCB2LCB0eXBlb2YgdiwgaWNvbiwgdmlzaWJsZSlcbiAgICB9XG5cblxuICAgIC8vIGZ1bmN0aW9uIGxvZ0FsbFNpZ25hbHMob2JqOiBhbnkpIHtcbiAgICAvLyAvLyBHZXQgdGhlIGxpc3Qgb2Ygc2lnbmFscyBhdmFpbGFibGUgb24gdGhlIG9iamVjdCdzIEdUeXBlXG4gICAgLy8gY29uc3Qgc2lnbmFscyA9IG9iai5saXN0X3NpZ25hbF9pZHNcbiAgICAvLyAgICAgPyBvYmoubGlzdF9zaWduYWxfaWRzKCkubWFwKGlkID0+IG9iai5zaWduYWxfbmFtZShpZCkpXG4gICAgLy8gICAgIDogW11cblxuICAgIC8vIC8vIEZhbGxiYWNrOiBpZiBsaXN0X3NpZ25hbF9pZHMoKSBpc24ndCBhdmFpbGFibGUsIHRyeSBjb21tb24gc2lnbmFscyBtYW51YWxseVxuICAgIC8vIGlmIChzaWduYWxzLmxlbmd0aCA9PT0gMCkge1xuICAgIC8vICAgICBjb25zb2xlLmxvZyhcIk5vIHNpZ25hbHMgZm91bmQgdmlhIGxpc3Rfc2lnbmFsX2lkcygpLCBob29raW5nIGNvbW1vbiBub3RpZnkgc2lnbmFsc1wiKTtcbiAgICAvLyAgICAgb2JqLmNvbm5lY3QoXCJub3RpZnlcIiwgKG9iaiwgcHNwZWMpID0+IHtcbiAgICAvLyAgICAgY29uc29sZS5sb2coYG5vdGlmeTo6JHtwc3BlYy5uYW1lfSBlbWl0dGVkYCk7XG4gICAgLy8gICAgIH0pO1xuICAgIC8vICAgICByZXR1cm47XG4gICAgLy8gfVxuXG4gICAgLy8gZm9yIChjb25zdCBzaWduYWxOYW1lIG9mIHNpZ25hbHMpIHtcbiAgICAvLyAgICAgb2JqLmNvbm5lY3Qoc2lnbmFsTmFtZSwgKC4uLmFyZ3MpID0+IHtcbiAgICAvLyAgICAgY29uc29sZS5sb2coYFNpZ25hbCBlbWl0dGVkOiAke3NpZ25hbE5hbWV9YCwgYXJncyk7XG4gICAgLy8gICAgIH0pO1xuICAgIC8vIH1cbiAgICAvLyB9XG5cbiAgICAvLyBsb2dBbGxTaWduYWxzKGJyaWdodG5lc3NEREMpOyBcblxuICAgIHJldHVybiAoXG4gICAgICAgIDxyZXZlYWxlclxuICAgICAgICAgICAgc2V0dXA9eyhzZWxmKSA9PiB7XG4gICAgICAgICAgICAgICAgc2VsZi5ob29rKGJyaWdodG5lc3MsIFwibm90aWZ5OjpzY3JlZW5cIiwgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2hvdyhicmlnaHRuZXNzLnNjcmVlbiwgXCJkaXNwbGF5LWJyaWdodG5lc3Mtc3ltYm9saWNcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHByaW50KFN0cmluZyhtb25pdG9yVHlwZSgpKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtb25pdG9yVHlwZSgpLmdldCgpICE9IGJyaWdodG5lc3MubW9kZWwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlzaWJsZS5zZXQoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgICAgICBzZWxmLmhvb2soYnJpZ2h0bmVzcywgXCJub3RpZnk6OmNhcHNsb2NrXCIsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChicmlnaHRuZXNzLmNhcHNsb2NrT24pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvdyhcIkNhcHNMb2NrIE9OXCIsIFwiZ28tdG9wLXN5bWJvbGljXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3coXCJDYXBzTG9jayBPRkZcIiwgXCJnby10b3Atc3ltYm9saWNcIilcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICAgIC8vIHNlbGYuaG9vayhicmlnaHRuZXNzLCBcIm5vdGlmeTo6bnVtbG9ja1wiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICBzaG93KGJyaWdodG5lc3MubnVtbG9jaywgXCJ6b29tLW9yaWdpbmFsLXN5bWJvbGljXCIpXG4gICAgICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgICAgICAvLyApXG5cbiAgICAgICAgICAgICAgICAvLyBpZiAoYnJpZ2h0bmVzc0REQykge1xuICAgICAgICAgICAgICAgIC8vICAgICBzZWxmLmhvb2soYnJpZ2h0bmVzc0REQywgXCJub3RpZnk6OmRkY1wiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAgICAgc2hvdyhicmlnaHRuZXNzRERDLmRkYywgXCJkaXNwbGF5LWJyaWdodG5lc3Mtc3ltYm9saWNcIilcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAvLyBwcmludChTdHJpbmcobW9uaXRvclR5cGUoKSkpXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAgICAgaWYgKG1vbml0b3JUeXBlKCkuZ2V0KCkgIT0gYnJpZ2h0bmVzc0REQy5tYW51ZmFjdHVyZXIpXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAgICAgICAgIHZpc2libGUuc2V0KGZhbHNlKVxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vICAgICApXG4gICAgICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICAgICAgLy8gcHJpbnQobWFwcGVkU2NyZWVuKVxuXG4gICAgICAgICAgICAgICAgLy8gZm9yIChjb25zdCBidXNOdW0gb2YgbWFwcGVkU2NyZWVuKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgIHNlbGYuaG9vayhidXNOdW0sIFwibm90aWZ5OjpkZGNcIiwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgc2hvdyhidXNOdW0uZGRjLCAgXCJkaXNwbGF5LWJyaWdodG5lc3Mtc3ltYm9saWNcIilcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIC8vIHZpc2libGUuc2V0KHRydWUpXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAvLyB2YWx1ZS5zZXQoYnVzTnVtLmRkYylcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIC8vIGljb25OYW1lLnNldChcImRpc3BsYXktYnJpZ2h0bmVzcy1zeW1ib2xpY1wiKVxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgLy8gcHJpbnQobW9uaXRvclR5cGUoKS5nZXQoKSwgYnVzTnVtLm1vZGVsKVxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgaWYgKG1vbml0b3JUeXBlKCkuZ2V0KCkgIT0gYnVzTnVtLm1vZGVsKVxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgIHZpc2libGUuc2V0KGZhbHNlKVxuICAgICAgICAgICAgICAgIC8vICAgICB9KVxuICAgICAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgICAgIGlmIChzcGVha2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuaG9vayhzcGVha2VyLCBcIm5vdGlmeTo6dm9sdW1lXCIsICgpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBzaG93KHNwZWFrZXIudm9sdW1lLCBzcGVha2VyLnZvbHVtZUljb24pXG4gICAgICAgICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICAgICAgICBzZWxmLmhvb2soc3BlYWtlciwgXCJub3RpZnk6Om11dGVcIiwgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwZWFrZXIubXV0ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93KCdtdXRlZCcsIFwiYXVkaW8tdm9sdW1lLW11dGVkLXN5bWJvbGljXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvdyhzcGVha2VyLnZvbHVtZSwgc3BlYWtlci52b2x1bWVJY29uKVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChiYXR0ZXJ5KSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuaG9vayhiYXR0ZXJ5LCBcIm5vdGlmeTo6cGVyY2VudGFnZVwiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYmF0dGVyeS5iYXR0ZXJ5X2xldmVsID09IDMgfHwgYmF0dGVyeS5iYXR0ZXJ5X2xldmVsID09IDUpIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3coYmF0dGVyeS5wZXJjZW50YWdlLCBiYXR0ZXJ5LmJhdHRlcnlJY29uTmFtZSlcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICByZXZlYWxDaGlsZD17dmlzaWJsZSgpfVxuICAgICAgICAgICAgdHJhbnNpdGlvblR5cGU9e0d0ay5SZXZlYWxlclRyYW5zaXRpb25UeXBlLlNMSURFX1VQfVxuICAgICAgICA+XG4gICAgICAgICAgICA8Ym94IFxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIk9TRFwiXG4gICAgICAgICAgICAgICAgdmVydGljYWxcbiAgICAgICAgICAgICAgICB3aWR0aFJlcXVlc3Q9ezIwMH1cbiAgICAgICAgICAgICAgICBoZWlnaHRSZXF1ZXN0PXsyMDB9XG4gICAgICAgICAgICAgICAgc3BhY2luZz17MTB9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGljb24gaWNvbj17aWNvbk5hbWUoKX0gLz5cbiAgICAgICAgICAgICAgICA8bGV2ZWxiYXIgdmFsaWduPXtHdGsuQWxpZ24uQ0VOVEVSfSB2YWx1ZT17dmFsdWUoKX0gLz5cbiAgICAgICAgICAgICAgICA8bGFiZWwgbGFiZWw9e3ZhbHVlKHYgPT4gdHlwZW9mIHYgPT0gJ251bWJlcicgPyBgJHtNYXRoLmZsb29yKHYgKiAxMDApfSVgIDogdil9IC8+XG4gICAgICAgICAgICA8L2JveD5cbiAgICAgICAgPC9yZXZlYWxlcj5cbiAgICApXG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIE9TRChtb25pdG9yOiBHZGsuTW9uaXRvcikge1xuICAgIGNvbnN0IHZpc2libGUgPSBWYXJpYWJsZShmYWxzZSlcbiAgICBjb25zdCBtb25pdG9yVHlwZSA9IFZhcmlhYmxlKG1vbml0b3IubW9kZWwpXG4gICAgXG4gICAgLy8gZm9yIChsZXQga2V5IGluIG1vbml0b3IpIHtcbiAgICAvLyB0cnkge1xuICAgIC8vICAgICBwcmludChgJHtrZXl9OiAke21vbml0b3Jba2V5XX1gKTtcbiAgICAvLyB9IGNhdGNoIChlKSB7XG4gICAgLy8gICAgIHByaW50KGAke2tleX06IFtFcnJvciByZWFkaW5nIHByb3BlcnR5XWApO1xuICAgIC8vICAgICB9XG4gICAgLy8gfVxuICAgIC8vIHByaW50KG1vbml0b3IpXG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8d2luZG93XG4gICAgICAgICAgICBnZGttb25pdG9yPXttb25pdG9yfVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwiT1NEXCJcbiAgICAgICAgICAgIG5hbWVzcGFjZT1cIm9zZFwiXG4gICAgICAgICAgICBhcHBsaWNhdGlvbj17QXBwfVxuICAgICAgICAgICAgbGF5ZXI9e0FzdGFsLkxheWVyLk9WRVJMQVl9XG4gICAgICAgICAgICBrZXltb2RlPXtBc3RhbC5LZXltb2RlLk9OX0RFTUFORH1cbiAgICAgICAgICAgIGFuY2hvcj17QXN0YWwuV2luZG93QW5jaG9yLkJPVFRPTX1cbiAgICAgICAgPlxuICAgICAgICAgICAgPGV2ZW50Ym94IG9uQ2xpY2s9eygpID0+IHZpc2libGUuc2V0KGZhbHNlKX0+XG4gICAgICAgICAgICAgICAgPE9uU2NyZWVuUHJvZ3Jlc3MgdmlzaWJsZT17dmlzaWJsZX0gbW9uaXRvclR5cGU9e21vbml0b3JUeXBlfSAvPlxuICAgICAgICAgICAgPC9ldmVudGJveD5cbiAgICAgICAgPC93aW5kb3c+XG4gICAgKVxufSIsICJpbXBvcnQgR3RrIGZyb20gXCJnaTovL0d0az92ZXJzaW9uPTMuMFwiXG5pbXBvcnQgeyB0eXBlIEJpbmRhYmxlQ2hpbGQgfSBmcm9tIFwiLi9hc3RhbGlmeS5qc1wiXG5pbXBvcnQgeyBtZXJnZUJpbmRpbmdzLCBqc3ggYXMgX2pzeCB9IGZyb20gXCIuLi9fYXN0YWwuanNcIlxuaW1wb3J0ICogYXMgV2lkZ2V0IGZyb20gXCIuL3dpZGdldC5qc1wiXG5cbmV4cG9ydCBmdW5jdGlvbiBGcmFnbWVudCh7IGNoaWxkcmVuID0gW10sIGNoaWxkIH06IHtcbiAgICBjaGlsZD86IEJpbmRhYmxlQ2hpbGRcbiAgICBjaGlsZHJlbj86IEFycmF5PEJpbmRhYmxlQ2hpbGQ+XG59KSB7XG4gICAgaWYgKGNoaWxkKSBjaGlsZHJlbi5wdXNoKGNoaWxkKVxuICAgIHJldHVybiBtZXJnZUJpbmRpbmdzKGNoaWxkcmVuKVxufVxuXG5leHBvcnQgZnVuY3Rpb24ganN4KFxuICAgIGN0b3I6IGtleW9mIHR5cGVvZiBjdG9ycyB8IHR5cGVvZiBHdGsuV2lkZ2V0LFxuICAgIHByb3BzOiBhbnksXG4pIHtcbiAgICByZXR1cm4gX2pzeChjdG9ycywgY3RvciBhcyBhbnksIHByb3BzKVxufVxuXG5jb25zdCBjdG9ycyA9IHtcbiAgICBib3g6IFdpZGdldC5Cb3gsXG4gICAgYnV0dG9uOiBXaWRnZXQuQnV0dG9uLFxuICAgIGNlbnRlcmJveDogV2lkZ2V0LkNlbnRlckJveCxcbiAgICBjaXJjdWxhcnByb2dyZXNzOiBXaWRnZXQuQ2lyY3VsYXJQcm9ncmVzcyxcbiAgICBkcmF3aW5nYXJlYTogV2lkZ2V0LkRyYXdpbmdBcmVhLFxuICAgIGVudHJ5OiBXaWRnZXQuRW50cnksXG4gICAgZXZlbnRib3g6IFdpZGdldC5FdmVudEJveCxcbiAgICAvLyBUT0RPOiBmaXhlZFxuICAgIC8vIFRPRE86IGZsb3dib3hcbiAgICBpY29uOiBXaWRnZXQuSWNvbixcbiAgICBsYWJlbDogV2lkZ2V0LkxhYmVsLFxuICAgIGxldmVsYmFyOiBXaWRnZXQuTGV2ZWxCYXIsXG4gICAgLy8gVE9ETzogbGlzdGJveFxuICAgIG1lbnVidXR0b246IFdpZGdldC5NZW51QnV0dG9uLFxuICAgIG92ZXJsYXk6IFdpZGdldC5PdmVybGF5LFxuICAgIHJldmVhbGVyOiBXaWRnZXQuUmV2ZWFsZXIsXG4gICAgc2Nyb2xsYWJsZTogV2lkZ2V0LlNjcm9sbGFibGUsXG4gICAgc2xpZGVyOiBXaWRnZXQuU2xpZGVyLFxuICAgIHN0YWNrOiBXaWRnZXQuU3RhY2ssXG4gICAgc3dpdGNoOiBXaWRnZXQuU3dpdGNoLFxuICAgIHdpbmRvdzogV2lkZ2V0LldpbmRvdyxcbn1cblxuZGVjbGFyZSBnbG9iYWwge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbmFtZXNwYWNlXG4gICAgbmFtZXNwYWNlIEpTWCB7XG4gICAgICAgIHR5cGUgRWxlbWVudCA9IEd0ay5XaWRnZXRcbiAgICAgICAgdHlwZSBFbGVtZW50Q2xhc3MgPSBHdGsuV2lkZ2V0XG4gICAgICAgIGludGVyZmFjZSBJbnRyaW5zaWNFbGVtZW50cyB7XG4gICAgICAgICAgICBib3g6IFdpZGdldC5Cb3hQcm9wc1xuICAgICAgICAgICAgYnV0dG9uOiBXaWRnZXQuQnV0dG9uUHJvcHNcbiAgICAgICAgICAgIGNlbnRlcmJveDogV2lkZ2V0LkNlbnRlckJveFByb3BzXG4gICAgICAgICAgICBjaXJjdWxhcnByb2dyZXNzOiBXaWRnZXQuQ2lyY3VsYXJQcm9ncmVzc1Byb3BzXG4gICAgICAgICAgICBkcmF3aW5nYXJlYTogV2lkZ2V0LkRyYXdpbmdBcmVhUHJvcHNcbiAgICAgICAgICAgIGVudHJ5OiBXaWRnZXQuRW50cnlQcm9wc1xuICAgICAgICAgICAgZXZlbnRib3g6IFdpZGdldC5FdmVudEJveFByb3BzXG4gICAgICAgICAgICAvLyBUT0RPOiBmaXhlZFxuICAgICAgICAgICAgLy8gVE9ETzogZmxvd2JveFxuICAgICAgICAgICAgaWNvbjogV2lkZ2V0Lkljb25Qcm9wc1xuICAgICAgICAgICAgbGFiZWw6IFdpZGdldC5MYWJlbFByb3BzXG4gICAgICAgICAgICBsZXZlbGJhcjogV2lkZ2V0LkxldmVsQmFyUHJvcHNcbiAgICAgICAgICAgIC8vIFRPRE86IGxpc3Rib3hcbiAgICAgICAgICAgIG1lbnVidXR0b246IFdpZGdldC5NZW51QnV0dG9uUHJvcHNcbiAgICAgICAgICAgIG92ZXJsYXk6IFdpZGdldC5PdmVybGF5UHJvcHNcbiAgICAgICAgICAgIHJldmVhbGVyOiBXaWRnZXQuUmV2ZWFsZXJQcm9wc1xuICAgICAgICAgICAgc2Nyb2xsYWJsZTogV2lkZ2V0LlNjcm9sbGFibGVQcm9wc1xuICAgICAgICAgICAgc2xpZGVyOiBXaWRnZXQuU2xpZGVyUHJvcHNcbiAgICAgICAgICAgIHN0YWNrOiBXaWRnZXQuU3RhY2tQcm9wc1xuICAgICAgICAgICAgc3dpdGNoOiBXaWRnZXQuU3dpdGNoUHJvcHNcbiAgICAgICAgICAgIHdpbmRvdzogV2lkZ2V0LldpbmRvd1Byb3BzXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBqc3hzID0ganN4XG4iLCAiaW1wb3J0IHsgQXBwLCBBc3RhbCwgR2RrLCBHdGsgfSBmcm9tIFwiYXN0YWwvZ3RrM1wiXG5pbXBvcnQgeyB0aW1lb3V0IH0gZnJvbSBcImFzdGFsL3RpbWVcIlxuaW1wb3J0IFZhcmlhYmxlIGZyb20gXCJhc3RhbC92YXJpYWJsZVwiXG5pbXBvcnQgeyBtYXBwZWRTY3JlZW4gfSBmcm9tIFwiLi9kZGN1dGlsXCJcblxuXG50eXBlIE9uU2NyZWVuUHJvZ3Jlc3NQcm9wcyA9IHtcbiAgICB2aXNpYmxlOiBWYXJpYWJsZTxib29sZWFuPjtcbn07XG5cbmZ1bmN0aW9uIE9uU2NyZWVuUHJvZ3Jlc3MoIHt2aXNpYmxlfTogT25TY3JlZW5Qcm9ncmVzc1Byb3BzKSB7XG5cbiAgICBjb25zdCBpY29uTmFtZSA9IFZhcmlhYmxlKFwiXCIpXG4gICAgY29uc3QgdmFsdWUgPSBWYXJpYWJsZSgwKVxuXG4gICAgbGV0IGNvdW50ID0gMFxuICAgIGZ1bmN0aW9uIHNob3codjogYW55LCBpY29uOiBzdHJpbmcpIHtcbiAgICAgICAgdmlzaWJsZS5zZXQodHJ1ZSlcbiAgICAgICAgdmFsdWUuc2V0KHYpXG4gICAgICAgIGljb25OYW1lLnNldChpY29uKVxuICAgICAgICBjb3VudCsrXG4gICAgICAgIHRpbWVvdXQoMjAwMCwgKCkgPT4ge1xuICAgICAgICAgICAgY291bnQtLVxuICAgICAgICAgICAgaWYgKGNvdW50ID09PSAwKSB2aXNpYmxlLnNldChmYWxzZSlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8cmV2ZWFsZXJcbiAgICAgICAgICAgIHNldHVwPXsoc2VsZikgPT4ge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgYnVzTnVtIG9mIG1hcHBlZFNjcmVlbikge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmhvb2soYnVzTnVtLCBcIm5vdGlmeTo6ZGRjXCIsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNob3coYnVzTnVtLmRkYywgIFwiZGlzcGxheS1icmlnaHRuZXNzLXN5bWJvbGljXCIpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgcmV2ZWFsQ2hpbGQ9e3Zpc2libGUoKX1cbiAgICAgICAgICAgIHRyYW5zaXRpb25UeXBlPXtHdGsuUmV2ZWFsZXJUcmFuc2l0aW9uVHlwZS5TTElERV9VUH1cbiAgICAgICAgPlxuICAgICAgICAgICAgPGJveCBcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJPU0RcIlxuICAgICAgICAgICAgICAgIHZlcnRpY2FsXG4gICAgICAgICAgICAgICAgd2lkdGhSZXF1ZXN0PXsyMDB9XG4gICAgICAgICAgICAgICAgaGVpZ2h0UmVxdWVzdD17MjAwfVxuICAgICAgICAgICAgICAgIHNwYWNpbmc9ezEwfVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxpY29uIGljb249e2ljb25OYW1lKCl9IC8+XG4gICAgICAgICAgICAgICAgPGxldmVsYmFyIHZhbGlnbj17R3RrLkFsaWduLkNFTlRFUn0gdmFsdWU9e3ZhbHVlKCl9IC8+XG4gICAgICAgICAgICAgICAgPGxhYmVsIGxhYmVsPXt2YWx1ZSh2ID0+IHR5cGVvZiB2ICE9PSAnbnVtYmVyJyA/ICdtdXRlZCcgOiBgJHtNYXRoLmZsb29yKHYgKiAxMDApfSVgKX0gLz5cbiAgICAgICAgICAgIDwvYm94PlxuICAgICAgICA8L3JldmVhbGVyPlxuICAgIClcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gT1NEKG1vbml0b3I6IEdkay5Nb25pdG9yKSB7XG4gICAgY29uc3QgdmlzaWJsZSA9IFZhcmlhYmxlKGZhbHNlKVxuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPHdpbmRvd1xuICAgICAgICAgICAgZ2RrbW9uaXRvcj17bW9uaXRvcn1cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cIk9TRFwiXG4gICAgICAgICAgICBuYW1lc3BhY2U9XCJvc2RcIlxuICAgICAgICAgICAgYXBwbGljYXRpb249e0FwcH1cbiAgICAgICAgICAgIGxheWVyPXtBc3RhbC5MYXllci5PVkVSTEFZfVxuICAgICAgICAgICAga2V5bW9kZT17QXN0YWwuS2V5bW9kZS5PTl9ERU1BTkR9XG4gICAgICAgICAgICBhbmNob3I9e0FzdGFsLldpbmRvd0FuY2hvci5CT1RUT019XG4gICAgICAgID5cbiAgICAgICAgICAgIDxldmVudGJveCBvbkNsaWNrPXsoKSA9PiB2aXNpYmxlLnNldChmYWxzZSl9PlxuICAgICAgICAgICAgICAgIDxPblNjcmVlblByb2dyZXNzIHZpc2libGU9e3Zpc2libGV9IC8+XG4gICAgICAgICAgICA8L2V2ZW50Ym94PlxuICAgICAgICA8L3dpbmRvdz5cbiAgICApXG59IiwgImltcG9ydCBHT2JqZWN0LCB7IHJlZ2lzdGVyLCBwcm9wZXJ0eSB9IGZyb20gXCJhc3RhbC9nb2JqZWN0XCJcbmltcG9ydCB7IG1vbml0b3JGaWxlLCByZWFkRmlsZUFzeW5jIH0gZnJvbSBcImFzdGFsL2ZpbGVcIlxuaW1wb3J0IHsgZXhlYywgZXhlY0FzeW5jIH0gZnJvbSBcImFzdGFsL3Byb2Nlc3NcIlxuXG5cbmNvbnN0IGdldCA9IChhcmdzOiBzdHJpbmcpID0+IE51bWJlcihleGVjKGBicmlnaHRuZXNzY3RsICR7YXJnc31gKSlcbmNvbnN0IGNhcHNsb2NrID0gZXhlYyhgYmFzaCAtYyBcImxzIC13MSAvc3lzL2NsYXNzL2xlZHMgfCBncmVwICc6OmNhcHNsb2NrJCcgfCBoZWFkIC0xXCJgKVxuXG5AcmVnaXN0ZXIoeyBHVHlwZU5hbWU6IFwiTG9ja0tleXNcIiB9KVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTG9ja0tleXMgZXh0ZW5kcyBHT2JqZWN0Lk9iamVjdCB7XG4gICAgc3RhdGljIGluc3RhbmNlOiBMb2NrS2V5c1xuICAgIHN0YXRpYyBnZXRfZGVmYXVsdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmluc3RhbmNlKVxuICAgICAgICAgICAgdGhpcy5pbnN0YW5jZSA9IG5ldyBMb2NrS2V5cygpXG5cbiAgICAgICAgcmV0dXJuIHRoaXMuaW5zdGFuY2VcbiAgICB9XG5cbiAgICAvLyBDYXBzbG9ja1xuICAgICNjYXBzbG9ja01heCA9IGdldChgLS1kZXZpY2UgJHtjYXBzbG9ja30gbWF4YCk7XG4gICAgI2NhcHNsb2NrID0gZ2V0KGAtLWRldmljZSAke2NhcHNsb2NrfSBnZXRgKTtcbiAgICBjYXBzbG9ja09uID0gZmFsc2VcblxuICAgIEBwcm9wZXJ0eShOdW1iZXIpXG4gICAgZ2V0IGNhcHNsb2NrKCkgeyByZXR1cm4gdGhpcy4jY2Fwc2xvY2sgfVxuXG4gICAgc2V0IGNhcHNsb2NrKHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZSA8IDAgfHwgdmFsdWUgPiB0aGlzLiNjYXBzbG9ja01heCkgcmV0dXJuO1xuXG4gICAgICAgIGV4ZWNBc3luYyhgYnJpZ2h0bmVzc2N0bCAtZCAke2NhcHNsb2NrfSBzZXQgJHtNYXRoLmZsb29yKHZhbHVlICogMTAwKX0lIC1xYCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLiNjYXBzbG9jayA9IHZhbHVlXG4gICAgICAgICAgICB0aGlzLm5vdGlmeShcImNhcHNsb2NrXCIpXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKClcbiAgICAgICAgXG4gICAgICAgIG1vbml0b3JGaWxlKGAvc3lzL2NsYXNzL2xlZHMvJHtjYXBzbG9ja30vYnJpZ2h0bmVzc2AsIGFzeW5jIGYgPT4ge1xuICAgICAgICAgICAgY29uc3QgdiA9IGF3YWl0IHJlYWRGaWxlQXN5bmMoZilcbiAgICAgICAgICAgIHRoaXMuI2NhcHNsb2NrID0gTnVtYmVyKHYpXG4gICAgICAgICAgICBwcmludCh0aGlzLiNjYXBzbG9jaykgLy8gPD09IHRoaXMgZG9lc24ndCBnZXQgcHJpbnRlZCBcbiAgICAgICAgICAgIHRoaXMuY2Fwc2xvY2tPbiA9IHRoaXMuI2NhcHNsb2NrID09IDFcbiAgICAgICAgICAgIHRoaXMubm90aWZ5KFwiY2Fwc2xvY2tcIilcbiAgICAgICAgfSlcblxuICAgIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIEFzdGFsLCBHZGssIEd0ayB9IGZyb20gXCJhc3RhbC9ndGszXCJcbmltcG9ydCB7IHRpbWVvdXQgfSBmcm9tIFwiYXN0YWwvdGltZVwiXG5pbXBvcnQgVmFyaWFibGUgZnJvbSBcImFzdGFsL3ZhcmlhYmxlXCJcbmltcG9ydCBMb2NrS2V5cyBmcm9tIFwiLi9sb2Nra2V5c1wiXG5cbnR5cGUgSW5kaWNhdG9yUHJvcHMgPSB7XG4gICAgdmlzaWJsZTogVmFyaWFibGU8Ym9vbGVhbj47XG59O1xuXG5mdW5jdGlvbiBJbmRpY2F0b3IoIHt2aXNpYmxlfTogSW5kaWNhdG9yUHJvcHMpIHtcbiAgICBjb25zdCBsb2NrS2V5cyA9IExvY2tLZXlzLmdldF9kZWZhdWx0KClcblxuICAgIGNvbnN0IGljb24gPSBWYXJpYWJsZShcIlwiKVxuICAgIGNvbnN0IHN0YXR1cyA9IFZhcmlhYmxlKFwiXCIpXG5cbiAgICBsZXQgY291bnQgPSAwXG4gICAgZnVuY3Rpb24gc2hvdyhzOiBzdHJpbmcsIGk6IHN0cmluZykge1xuICAgICAgICB2aXNpYmxlLnNldCh0cnVlKVxuICAgICAgICBzdGF0dXMuc2V0KHMpXG4gICAgICAgIGljb24uc2V0KGkpXG4gICAgICAgIGNvdW50KytcbiAgICAgICAgdGltZW91dCgyMDAwLCAoKSA9PiB7XG4gICAgICAgICAgICBjb3VudC0tXG4gICAgICAgICAgICBpZiAoY291bnQgPT09IDApIHZpc2libGUuc2V0KGZhbHNlKVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICAgIDxyZXZlYWxlclxuICAgICAgICAgICAgc2V0dXA9eyhzZWxmKSA9PiB7XG5cbiAgICAgICAgICAgICAgICBzZWxmLmhvb2sobG9ja0tleXMsIFwibm90aWZ5OjpjYXBzbG9ja1wiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHByaW50KCdsb2NrJylcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsb2NrS2V5cy5jYXBzbG9ja09uKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3coXCJDYXBzTG9jayBPTlwiLCBcIlx1REI4MFx1REYwRVwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93KFwiQ2Fwc0xvY2sgT0ZGXCIsIFwiXHVEQjgwXHVERjBFXCIpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICByZXZlYWxDaGlsZD17dmlzaWJsZSgpfVxuICAgICAgICAgICAgdHJhbnNpdGlvblR5cGU9e0d0ay5SZXZlYWxlclRyYW5zaXRpb25UeXBlLlNMSURFX1VQfVxuICAgICAgICA+XG4gICAgICAgICAgICA8Ym94IFxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIk9TRFwiXG4gICAgICAgICAgICAgICAgdmVydGljYWxcbiAgICAgICAgICAgICAgICB3aWR0aFJlcXVlc3Q9ezIwMH1cbiAgICAgICAgICAgICAgICBoZWlnaHRSZXF1ZXN0PXsyMDB9XG4gICAgICAgICAgICAgICAgc3BhY2luZz17MX1cbiAgICAgICAgICAgICAgICBtYXJnaW5Cb3R0b209ezB9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImluZGljYXRvclwiIGxhYmVsPXtpY29uKCl9IGNzcz1cImZvbnQtZmFtaWx5OiAnRm9udCBBd2Vzb21lIDYgRnJlZScsIHNhbnMtc2VyaWY7IGZvbnQtc2l6ZTogMTIzcHg7XCIvPlxuICAgICAgICAgICAgICAgIDxsYWJlbCBsYWJlbD17c3RhdHVzKCl9IGNzcz1cImZvbnQtc2l6ZTogMThweDtcIi8+XG4gICAgICAgICAgICA8L2JveD5cbiAgICAgICAgPC9yZXZlYWxlcj5cbiAgICApXG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIE9TRChtb25pdG9yOiBHZGsuTW9uaXRvcikge1xuICAgIGNvbnN0IHZpc2libGUgPSBWYXJpYWJsZShmYWxzZSlcblxuICAgIHJldHVybiAoXG4gICAgICAgIDx3aW5kb3dcbiAgICAgICAgICAgIGdka21vbml0b3I9e21vbml0b3J9XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJPU0RcIlxuICAgICAgICAgICAgbmFtZXNwYWNlPVwib3NkXCJcbiAgICAgICAgICAgIGFwcGxpY2F0aW9uPXtBcHB9XG4gICAgICAgICAgICBsYXllcj17QXN0YWwuTGF5ZXIuT1ZFUkxBWX1cbiAgICAgICAgICAgIGtleW1vZGU9e0FzdGFsLktleW1vZGUuT05fREVNQU5EfVxuICAgICAgICAgICAgYW5jaG9yPXtBc3RhbC5XaW5kb3dBbmNob3IuQk9UVE9NIHwgQXN0YWwuV2luZG93QW5jaG9yLlJJR0hUfVxuICAgICAgICA+XG4gICAgICAgICAgICA8ZXZlbnRib3ggb25DbGljaz17KCkgPT4gdmlzaWJsZS5zZXQoZmFsc2UpfT5cbiAgICAgICAgICAgICAgICA8SW5kaWNhdG9yIHZpc2libGU9e3Zpc2libGV9IC8+XG4gICAgICAgICAgICA8L2V2ZW50Ym94PlxuICAgICAgICA8L3dpbmRvdz5cbiAgICApXG59IiwgImltcG9ydCB7IEFwcCB9IGZyb20gXCJhc3RhbC9ndGszXCJcbmltcG9ydCBzdHlsZSBmcm9tIFwiLi9zdHlsZS5zY3NzXCJcbmltcG9ydCBPU0QgZnJvbSBcIi4vb3NkL09TRFwiXG5pbXBvcnQgT1NEZGRjIGZyb20gXCIuL29zZC9PU0RkZGNcIlxuaW1wb3J0IE9TRGxvY2sgZnJvbSBcIi4vb3NkL09TRGxvY2tcIlxuXG5BcHAuc3RhcnQoe1xuICAgIGNzczogc3R5bGUsXG4gICAgbWFpbigpIHtcbiAgICAgICAgQXBwLmdldF9tb25pdG9ycygpLm1hcChPU0QpO1xuICAgICAgICBPU0RkZGMoQXBwLmdldF9tb25pdG9ycygpWzFdKTtcbiAgICAgICAgQXBwLmdldF9tb25pdG9ycygpLm1hcChPU0Rsb2NrKTtcbiAgICB9LFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLE9BQU9BLFlBQVc7QUFDbEIsT0FBT0MsVUFBUztBQUNoQixPQUFPLFNBQVM7OztBQ0ZoQixPQUFPQyxZQUFXOzs7QUNBWCxJQUFNLFdBQVcsQ0FBQyxRQUFnQixJQUNwQyxRQUFRLG1CQUFtQixPQUFPLEVBQ2xDLFdBQVcsS0FBSyxHQUFHLEVBQ25CLFlBQVk7QUFFVixJQUFNLFdBQVcsQ0FBQyxRQUFnQixJQUNwQyxRQUFRLG1CQUFtQixPQUFPLEVBQ2xDLFdBQVcsS0FBSyxHQUFHLEVBQ25CLFlBQVk7QUFjVixJQUFNLFVBQU4sTUFBTSxTQUFlO0FBQUEsRUFDaEIsY0FBYyxDQUFDLE1BQVc7QUFBQSxFQUVsQztBQUFBLEVBQ0E7QUFBQSxFQVNBLE9BQU8sS0FBSyxTQUFxQyxNQUFlO0FBQzVELFdBQU8sSUFBSSxTQUFRLFNBQVMsSUFBSTtBQUFBLEVBQ3BDO0FBQUEsRUFFUSxZQUFZLFNBQTRDLE1BQWU7QUFDM0UsU0FBSyxXQUFXO0FBQ2hCLFNBQUssUUFBUSxRQUFRLFNBQVMsSUFBSTtBQUFBLEVBQ3RDO0FBQUEsRUFFQSxXQUFXO0FBQ1AsV0FBTyxXQUFXLEtBQUssUUFBUSxHQUFHLEtBQUssUUFBUSxNQUFNLEtBQUssS0FBSyxNQUFNLEVBQUU7QUFBQSxFQUMzRTtBQUFBLEVBRUEsR0FBTSxJQUFpQztBQUNuQyxVQUFNQyxRQUFPLElBQUksU0FBUSxLQUFLLFVBQVUsS0FBSyxLQUFLO0FBQ2xELElBQUFBLE1BQUssY0FBYyxDQUFDLE1BQWEsR0FBRyxLQUFLLFlBQVksQ0FBQyxDQUFDO0FBQ3ZE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TUFBTTtBQUFBLE1BQ25CLFNBQVNBLE9BQU0sUUFBUTtBQUFBLE1BQ3ZCLFFBQVFBLE9BQU0sYUFBYSxTQUFTQSxPQUFNLGFBQWE7QUFBQSxNQUV2RCwwQkFBQUgsS0FBQyxjQUFTLFNBQVMsTUFBTSxRQUFRLElBQUksS0FBSyxHQUN0QywwQkFBQUEsS0FBQyxhQUFVLFNBQWtCLEdBQ2pDO0FBQUE7QUFBQSxFQUNKO0FBRVI7OztBQ3ZFQSxZQUFJLE1BQU07QUFBQSxFQUNOLEtBQUs7QUFBQSxFQUNMLE9BQU87QUFDSCxnQkFBSSxhQUFhLEVBQUUsSUFBSSxHQUFHO0FBQzFCLElBQUFJLEtBQU8sWUFBSSxhQUFhLEVBQUUsQ0FBQyxDQUFDO0FBQzVCLGdCQUFJLGFBQWEsRUFBRSxJQUFJQSxJQUFPO0FBQUEsRUFDbEM7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogWyJBc3RhbCIsICJHdGsiLCAiQXN0YWwiLCAiYmluZCIsICJpbnRlcnZhbCIsICJ0aW1lb3V0IiwgIkFzdGFsIiwgIkFzdGFsIiwgInYiLCAiaW50ZXJ2YWwiLCAiZXhlYyIsICJjdG9ycyIsICJBc3RhbCIsICJBc3RhbCIsICJHdGsiLCAiQXN0YWwiLCAic25ha2VpZnkiLCAicGF0Y2giLCAiV3AiLCAiR09iamVjdCIsICJHdGsiLCAiQXN0YWwiLCAiQXN0YWwiLCAiR3RrIiwgIkdPYmplY3QiLCAiR3RrIiwgIkFzdGFsIiwgIkdPYmplY3QiLCAiR09iamVjdCIsICJkZWZhdWx0IiwgIkdPYmplY3QiLCAia2ViYWJpZnkiLCAiQXN0YWwiLCAiQXN0YWwiLCAiQXN0YWwiLCAiR09iamVjdCIsICJHT2JqZWN0IiwgImpzeCIsICJqc3giLCAiR3RrIiwgIkFzdGFsIiwgIk9uU2NyZWVuUHJvZ3Jlc3MiLCAianN4IiwgIkd0ayIsICJPU0QiLCAiQXN0YWwiLCAiZ2V0IiwgIkdPYmplY3QiLCAianN4IiwgIkd0ayIsICJPU0QiLCAiQXN0YWwiLCAiT1NEIl0KfQo=
