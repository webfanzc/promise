/**
 * 判断传入参数是否为function
 * @param {any} variable 要判断的参数
 * @returns {Boolean} 返回一个布尔值 true为函数 false不是函数
 */
const isFunction = variable => typeof variable === 'function'
class MyPromise {
  /**
   * @param {function} executor 处理Promise的handler 传入一个函数 函数有两个参数分别处* 理fulfilled和reject状态
   */
  constructor(executor) {
    this.state = 'pending'
    this.value = undefined
    this.reason = undefined
    this.onResolvedCallbacks = []
    this.onRejectedCallbacks = []
    /**
     * promise的resolve函数 处理成功的状态
     * @param {any} value promise的值
     */
    let resolve = value => {
      if (this.state === 'pending') {
        this.state = 'fulfilled'
        this.value = value
        this.onResolvedCallbacks.forEach(fn => fn(value))
      }
    }
    /**
     * promise的reject函数 处理拒绝的状态
     * @param {any} reason promise被拒绝的原因
     */
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
  then(onFulfilled, onRejected) {
    onFulfilled = isFunction(onFulfilled) ? onFulfilled : value => value
    onRejected = isFunction(onRejected)
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
}).catch(err => {
  throw new Error(err)
})
setTimeout(function() {
  console.log(1)
}, 0)
new Promise(function(resolve) {
  console.log(2)
  for (var i = 0; i < 10000; i++) {
    i == 9999 && resolve()
  }
  console.log(3)
}).then(function() {
  console.log(4)
})
console.log(5)
MyPromise.all([promise3, promise4])
  .then(function(values) {
    console.log(values, ',+++)')
  })
  .finally(() => {
    console.log('finally', '')
  })
  .catch(err => {
    console.log('err', err)
  })
Promise.all([promise3, promise4])
  .then(function(values) {
    console.log(values, '+')
  })
  .finally(() => {
    console.log('finally222', '')
  })
  .catch(err => {
    console.log('err222', err)
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
