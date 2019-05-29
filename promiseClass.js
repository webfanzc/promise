const isFunction = variable => typeof variable === 'function'
class MyPromise {
  constructor(executor) {
    this.state = 'pending'
    this.value = undefined
    this.reason = undefined
    this.onResolvedCallbacks = []
    this.onRejectedCallbacks = []
    let resolve = value => {
      if (this.state === 'pending') {
        this.state = 'fulfilled'
        this.value = value
        this.onResolvedCallbacks.forEach(fn => fn(value))
      }
    }
    let reject = reason => {
      if (this.state === 'pending') {
        this.state = 'rejected'
        this.reason = reason
        this.onRejectedCallbacks.forEach(fn => fn(reason))
      }
    }
    try {
      executor(resolve, reject)
    } catch (err) {
      reject(err)
    }
  }
  then(onFulfilled, onRejected) {
    onFulfilled =
      typeof onFulfilled === 'function' ? onFulfilled : value => value
    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : err => {
            throw err
          }
    let newPromise = new MyPromise((resolve, reject) => {
      if (this.state === 'fulfilled') {
        setTimeout(() => {
          try {
            let arg = onFulfilled(this.value)
            resolvePromise(newPromise, arg, resolve, reject)
          } catch (e) {
            reject(e)
          }
        }, 0)
      }
      if (this.state === 'rejected') {
        setTimeout(() => {
          try {
            let arg = onRejected(this.reason)
            resolvePromise(newPromise, arg, resolve, reject)
          } catch (e) {
            reject(e)
          }
        }, 0)
      }
      if (this.state === 'pending') {
        this.onResolvedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let arg = onFulfilled(this.value)
              resolvePromise(newPromise, arg, resolve, reject)
            } catch (e) {
              reject(e)
            }
          }, 0)
        })
        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let arg = onRejected(this.reason)
              resolvePromise(newPromise, arg, resolve, reject)
            } catch (e) {
              reject(e)
            }
          }, 0)
        })
      }
    })
    return newPromise
  }
  catch(fn) {
    return this.then(null, fn)
  }
  static resolve(value) {
    return value instanceof MyPromise || (value && isFunction(value.then))
      ? value
      : new MyPromise(resolve => resolve(value))
  }
  static reject(value) {
    return new MyPromise((resolve, reject) => reject(value))
  }
  static race(promises) {
    return new MyPromise((resolve, reject) => {
      for (let p of promises) {
        // 只要有一个实例率先改变状态，新的MyPromise的状态就跟着改变
        this.resolve(p).then(res => {
          resolve(res)
        }, reject)
      }
    })
  }
  //all方法(获取所有的promise，都执行then，把结果放到数组，一起返回)
  static all(promises) {
    let newPromise
    return new MyPromise((resolve, reject) => {
      let values = [],
        count = promises.length
      for (let i in promises) {
        // 数组参数如果不是MyPromise实例，先调用MyPromise.resolve
        this.resolve(promises[i]).then(res => {
          values[i] = res
          // 所有状态都变成fulfilled时返回的MyPromise状态就变成fulfilled
          --count < 1 && resolve(values)
        }, reject)
      }
    })
  }
  finally(cb) {
    return this.then(
      value => MyPromise.resolve(cb()).then(() => value),
      reason =>
        MyPromise.resolve(cb()).then(() => {
          throw reason
        })
    )
  }
}
function resolvePromise(promise, arg, resolve, reject) {
  if (arg === promise) {
    return reject(new TypeError('Chaining cycle detected for promise'))
  }
  let called
  if (arg != null && (typeof arg === 'object' || typeof arg === 'function')) {
    try {
      let then = arg.then
      if (typeof then === 'function') {
        then.call(
          arg,
          onResolve => {
            if (called) return
            called = true
            resolvePromise(promise, onResolve, resolve, reject)
          },
          err => {
            if (called) return
            called = true
            reject(err)
          }
        )
      } else {
        resolve(arg)
      }
    } catch (e) {
      if (called) return
      called = true
      reject(e)
    }
  } else {
    resolve(arg)
  }
}
let p = new MyPromise((resolve, reject) => {
  reject(100)
})
p.then(res => {
  console.log('success', res)
}).catch(err => {
  console.log('catch', err)
})
p.then(
  res => {
    console.log('success2', res)
  },
  err => {
    console.log(err)
  }
)
var promise1 = MyPromise.resolve(3)
var promise2 = 42
var promise3 = new MyPromise((resolve, reject) => {
  setTimeout(resolve, 1001, 'foo')
})
var promise4 = new MyPromise((resolve, reject) => {
  setTimeout(reject, 1000, 'foo2')
}).then(res => {
  return promise1
})

MyPromise.all([promise3, promise4])
  .then(function(values) {
    console.log(values, ',+++)')
  })
  .catch(err => {
    console.log('err', err)
  })
  .finally(() => {
    console.log('finally', '')
  })
MyPromise.deferred = MyPromise.defer = () => {
  let dfd = {}
  dfd.promise = new MyPromise(function(resolve, reject) {
    dfd.resolve = resolve
    dfd.reject = reject
  })
  return dfd
}
module.exports = MyPromise
