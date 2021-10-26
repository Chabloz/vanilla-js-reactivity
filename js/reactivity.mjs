const tracked = new Map();
const doItNextTick = new Map();
let currentReactiveCode = false;

function callNextTick() {
  for (const [fn, value] of doItNextTick) {
    fn(value);
  }
  doItNextTick.clear();
}

const handlerRef = {
  get: (target, property, reciever) => {
    if (currentReactiveCode) {
      if (!tracked.has(reciever)) tracked.set(reciever, new Set());
      tracked.get(reciever).add(currentReactiveCode);
    }
    return Reflect.get(target, property);
  },
  set: (target, property, value, reciever) => {
    target.value = value;
    if (!tracked.has(reciever)) return true;
    for (const fn of tracked.get(reciever)) {
      doItNextTick.set(fn, value);
    };
    queueMicrotask(callNextTick);
    return true;
  }
};

export function ref(value) {
  return new Proxy({value: value}, handlerRef);
}

export function watch(ref, fn, lazy = true) {
  if (!tracked.has(ref)) {
    tracked.set(ref, new Set());
  }
  tracked.get(ref).add(fn);
  if (!lazy) fn(ref.value);
}

export function reactive(fn) {
  currentReactiveCode = fn;
  fn();
  currentReactiveCode = false;
}

export function computed(fn) {
  let theRef = ref(0);
  reactive(() => theRef.value = fn());
  return theRef;
}