// bun test src/problems/14-promise/test/promise.test.ts

type PromiseStatus = 'pending' | 'fulfilled' | 'rejected'

const PENDING: PromiseStatus = 'pending'
const FULFILLED: PromiseStatus = 'fulfilled'
const REJECTED: PromiseStatus = 'rejected'

// Step 1: Define types and constants
type Executor<T> = (
  resolve: (value: T | PromiseLike<T>) => void,
  reject: (reason: any) => void,
) => void

type OnFulfilled<T, R> = ((value: T) => R | PromiseLike<R>) | null | undefined

type OnRejected<R> = ((reason: any) => R | PromiseLike<R>) | null | undefined

//  - Handler
type Handler = (
  onFulfilled: (value: any) => void,
  onRejected?: (reason: any) => void,
  resolve: (value: any) => void,
  reject: (reason: any) => void,
) => void

//  - Update MyPromise<T> with types above
// Step 2: Define class fields
//  - handlers, status, value, isResolved
// Step 3: Implement settle, resolve, reject
// Step 4: constructor + Executor
// - Run tests for resolving / rejecting
// Step 5: Implement then<R> and catch
// Step 6: Implement handler execution
// - Run tests for then / catch and chaining
// Step 7: static resolve, static reject
// - Run tests for statics

export class MyPromise<T> {
  value: T | null = null
  status: PromiseStatus = PENDING
  handlers: Handler[] = []
  isResolved: boolean = false

  constructor(executor: Executor<T>) {
    try {
      executor(this.resolve, this.reject)
    } catch (error) {
      this.reject(error)
    }
  }

  then<R = T>(onFulfilled?: OnFulfilled<T, R>, onRejected?: OnRejected<R>): MyPromise<R> {
    const handler: Handler = {
      onFulfilled: typeof onFulfilled === 'function' ? onFulfilled : (v) => v,
      onRejected:
        typeof onRejected === 'function'
          ? onRejected
          : (v) => {
              throw v
            },
      resolve: () => {},
      reject: () => {},
    }

    const promise = new MyPromise<R>((resolve, reject) => {
      handler.resolve = resolve
      handler.reject = reject
    })

    this.handlers.push(handler)

    if (this.status !== PENDING) {
      this.execute()
    }

    return promise
  }

  #settle = (value: T | PromiseLike<T>, status = FULFILLED) => {
    if (this.isResolved) return

    this.isResolved = true

    const update = (value: T) => {
      this.value = value
      this.status = status
      this.execute()
    }

    if (value instanceof MyPromise) {
      value.then(update)
    } else {
      update(value as T)
    }
  }

  execute = () => {
    for (const { onFulfilled, onRejected, resolve, reject } of this.handlers) {
      const handler = this.status === FULFILLED ? onFulfilled : onRejected

      queueMicrotask(() => {
        try {
          const value = handler(this.value)

          if (value instanceof MyPromise) {
            value.then(resolve, reject)
          } else {
            resolve(value)
          }
        } catch (e) {
          reject(e)
        }
      })
    }

    this.handlers = []
  }

  resolve = (value: T | PromiseLike<T>) => {
    this.#settle(value)
  }

  reject = (reason: any): void => {
    this.#settle(reason, REJECTED)
  }

  catch<R = T>(onRejected?: OnRejected<R>): MyPromise<R> {
    return this.then(undefined, onRejected)
  }

  static resolve() {
    throw new Error('Not implemented')
  }

  static reject() {
    throw new Error('Not implemented')
  }
}

// --- Examples ---
// Uncomment to test your implementation:

// --- Step 4: constructor + Executor ---
// const p1 = new MyPromise((resolve: any) => resolve(42))
// console.log(p1) // Expected: MyPromise { status: 'fulfilled', value: 42 }
//
// const p2 = new MyPromise((_: any, reject: any) => reject('error'))
// console.log(p2) // Expected: MyPromise { status: 'rejected', value: 'error' }
//
// const p3 = new MyPromise(() => { throw new Error('oops') })
// console.log(p3) // Expected: MyPromise { status: 'rejected', value: Error: oops }
//
// const p4 = new MyPromise((resolve: any) => { resolve(1); resolve(2) })
// console.log(p4) // Expected: MyPromise { status: 'fulfilled', value: 1 } (settled once)

// --- Step 6: then / catch and chaining ---
// const p5 = new MyPromise((resolve: any) => resolve(42))
// p5.then((v: any) => console.log(v))  // Expected: 42
//
// const p6 = new MyPromise((resolve: any) => resolve(1))
//   .then((v: any) => v + 1)
//   .then((v: any) => console.log(v))   // Expected: 2
//
// const p7 = new MyPromise((_: any, reject: any) => reject('error'))
// p7.catch((e: any) => console.log(e))  // Expected: "error"
//
// new MyPromise((_: any, reject: any) => reject('error'))
//   .catch(() => 'recovered')
//   .then((v: any) => console.log(v))   // Expected: "recovered"
//
// new MyPromise((resolve: any) => resolve(1))
//   .then(() => { throw new Error('handler error') })
//   .catch((e: any) => console.log(e.message))  // Expected: "handler error"

// --- Step 7: static resolve, static reject ---
// MyPromise.resolve(99).then((v: any) => console.log(v))   // Expected: 99
// MyPromise.reject('no').catch((e: any) => console.log(e))  // Expected: "no"
