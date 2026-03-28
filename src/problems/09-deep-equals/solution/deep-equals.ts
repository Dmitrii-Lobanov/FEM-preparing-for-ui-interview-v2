const getType = (value: any) => {
  if (value == null) {
    return `${value}`
  }
  return (Object.getPrototypeOf(value)?.constructor?.name ?? 'object').toLowerCase()
}

export function deepEquals(a: any, b: any, store = new Map<any, Set<any>>()): boolean {
  if (a === b) {
    return true
  }
  if (store.has(a) && store.get(a)!.has(b)) {
    return true
  }
  const [typeA, typeB] = [getType(a), getType(b)]
  if (typeA !== typeB) return false
  if (typeA === 'object' || typeA === 'array') {
    const [keysA, keysB] = [Object.keys(a), Object.keys(b)]
    if (keysA.length !== keysB.length) return false
    if (!store.has(a)) store.set(a, new Set())
    store.get(a)!.add(b)
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key) || !deepEquals(a[key], b[key], store)) {
        return false
      }
    }
    return true
  }
  return a === b
}
