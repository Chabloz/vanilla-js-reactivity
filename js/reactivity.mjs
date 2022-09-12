const tracked = new Map();
const doItNextTick = new Map();
let currentReactiveCode = false;

function callNextTick() {
  try {
    for (const [fn, value] of doItNextTick) {
      fn(value);
    }
  } finally { doItNextTick.clear() }
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
  return new Proxy({value}, handlerRef);
}

export function watch(refs, fn, lazy = true) {
  if (!Array.isArray(refs)) refs = [refs];
  for (const ref of refs) {
    if (!tracked.has(ref)) {
      tracked.set(ref, new Set());
    }
    tracked.get(ref).add(fn);
  }
  if (!lazy) fn();
  return () => {
    for (const ref of refs) unwatch(ref, fn);
  }
}

function unwatch(ref, fn) {
  if (!tracked.has(ref)) return;
  tracked.get(ref).delete(fn);
}

export function reactive(fn) {
  const reactiveFn = () => {
    currentReactiveCode = reactiveFn;
    fn();
    currentReactiveCode = false;
  }
  reactiveFn();
  return () => unreactive(reactiveFn);
}

function unreactive(fn) {
  for (const [ref, set] of tracked) set.delete(fn);
}

export function computed(fn) {
  const theRef = ref(0);
  reactive(() => theRef.value = fn());
  return theRef;
}


export function nextTick() {
  return new Promise(resolve => resolve());
}
