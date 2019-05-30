# promise
掌握`Promise`大概是每个前端都必不可少的一项技能,Promise的设计初衷就是解决著名的 **回调地狱(callback hell)** 问题   
Promise 是异步编程的一种解决方案，比传统的解决方案 __回调函数和事件__ 更合理和更强大。它由社区最早提出和实现，ES6 将其写进了语言标准，统一了用法，原生提供了Promise对象。  
所谓Promise，简单说就是一个容器，里面保存着某个未来才会结束的事件（通常是一个异步操作）的结果。从语法上说，Promise 是一个对象，从它可以获取异步操作的消息。Promise 提供统一的 API，各种异步操作都可以用同样的方法进行处理。
现如今的面试中手写代码成了一项必不可少的技能,我们今天就是按照[Promise/A+](https://promisesaplus.com/)的规范使用ES6的class来自己实现一个Promise类   
按照A+的规范 一个Promise对象需要有三种状态 分别是` pending fulfilled` 和 `rejected` 代表promise的发送状态 成功状态和拒绝状态 需要有resolve和reject两个函数来处理对应状态 需要有value 和 reason来保存promise的值和失败的原因
有两个对应数组保存promise处理对应状态的回调函数  所以我们的Promise开始应该是这样的
```
/**
 * 判断传入参数是否为function 辅助函数
 * @param {any} variable 要判断的参数
 * @returns {Boolean} 返回一个布尔值 true为函数 false不是函数
 */
const isFunction = variable => typeof variable === 'function'

class MyPromise {
 /**
   * @param {function} executor 处理Promise的handler 传入一个函数 
   函数有两个参数分别处理fulfilled和rejected状态
   */
  constructor(executor) {
    this.state = 'pending' // 当前promise的状态 一旦被更改后将不可再次更改
    this.value = undefined // promise的值
    this.reason = undefined // promise被拒绝的原因
    this.onResolvedCallbacks = [] // 成功回调的队列
    this.onRejectedCallbacks = [] // 失败回调的队列
     /**
     * Promise的resolve函数 处理成功的状态
     * @param {any} value Promise的值
     */
    let resolve = value => {
      if (this.state === 'pending') { // 只有在pending状态下才可以进入resolve 否则不作处理
        this.state = 'fulfilled' // 更改promise状态
        this.value = value 
        this.onResolvedCallbacks.forEach(fn => fn(value)) // 处理回调
      }
    }
   /**
     * Promise的reject函数 处理拒绝的状态
     * @param {any} reason Promise被拒绝的原因
     */
    let reject = reason => {
      if (this.state === 'pending') {
        this.state = 'rejected'
        this.reason = reason
        this.onRejectedCallbacks.forEach(fn => fn(reason))
      }
    }
    try {
      executor(resolve, reject) // 这里为了预防出现错误 使用了try catch
    } catch (err) {
      reject(err)
    }
  }
}
```
这就是一个Promise的雏形 下面我们根据规范来一步一步的完善 Promise必须要有一个then方法来获取成功或者失败的原因 then方法接受两个参数来处理对应状况 即`promise.then(onFulfilled, onRejected)` 这两个参数都是可选的 但是必须是一个函数
```
function resolvePromise(promise, arg, resolve, reject) {
  if (arg === promise) { // 处理循环引用
     return reject(new TypeError('Promise循环引用'));
  }
  let called // 这个变量用来标识promise是否已经resolve 或reject了
  if (arg != null && (typeof arg === 'object' || typeof arg === 'function')) { // 判断上次的返回值是否是一个对象或者函数
    try { // 我们默认他是一个thenable的对象或者函数 如果不是进入catch处理
      let then = arg.then
      if (typeof then === 'function') { // 
        then.call(
          arg,
          onResolve => {
            if (called) return //如果promise已经成功或失败了，则不会再处理了
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
        resolve(arg) //arg不是一个thenable对象，那直接把它当成值resolve就可以了
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
then(onFulfilled, onRejected) {
    // 当没有传入参数或者传入的不是一个函数时 我们直接给一个默认的函数 这是Promise实现值穿透的原理
    onFulfilled = isFunction(onFulfilled) 
      ? onFulfilled 
      : value => value
    onRejected = isFunction(onRejected)
      ? onRejected
      : err => {
          throw err
        }
    // then方法要返回一个新的Promise对象 实现链式调用
    let newPromise = new MyPromise((resolve, reject) => {
      // 成功状态的处理逻辑
      if (this.state === 'fulfilled') {
        setTimeout(() => {
        /* 这里我们只能用setTimeout来实现异步 其实是无法完全达到原生的Promise的效果的
        * (原生的Promise是微任务)但是由于这些是底层控制的 所以我们只能这么实现 稍后也会举例说明这么写的问题在哪里
        */
          try {
            let arg = onFulfilled(this.value)
            resolvePromise(newPromise, arg, resolve, reject)
          } catch (e) {
            reject(e)
          }
        }, 0)
      }
      if (this.state === 'rejected') { // 逻辑类似 就不多做赘述了
        setTimeout(() => {
          try {
            let arg = onRejected(this.reason)
            resolvePromise(newPromise, arg, resolve, reject)
          } catch (e) {
            reject(e)
          }
        }, 0)
      }
      if (this.state === 'pending') { //当处于pending状态下 直接把传入的回调函数推进队列中 等待状态改变后调用
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
```
至此 我们的Promise已经基本可以正常使用了 不过我们还可以再继续的完善一下 Promise还有两个很重要的方法 catch和finally     
catch和finally的实现都很简单 catch其实就是then方法没有传递onFulfilled参数 只处理出现错误的情况 虽然我们可以用then来处理 但是为了代码的清晰和规范 我们最好使用catch来捕获错误 而finally方法其实就是我们不用关心当前Promise的状态 不管处于什么状态 我们都会去执行的一个回调 这里有很多人对finally有一些误解 认为finally是会在Promise的最后来执行 其实并不是这样的 他只是一个用来处理不管我们Promise成功或者失败都会执行的逻辑的方法
```
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
```
这里我们的finally里使用了MyPromise中的静态方法 可能大家都没有看到如何实现的 这里连同resolve reject race 和 all的静态方法的实现也一并贴上
```
static resolve(value) {
// 如果传入参数是一个Promise实例或者一个thenable的参数就直接返回传入参数 否则包装成一个新的Promise返回
    return value instanceof MyPromise || (value && isFunction(value.then)) 
      ? value
      : new MyPromise(resolve => resolve(value))
  }
  static reject(value) {
    return new MyPromise((resolve, reject) => reject(value)) //直接返回一个拒绝状态的Promise对象
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
```
至此我们的Promise就完整的实现了 我们可以使用`promises-aplus-tests`库来测试我们的Promise 具体如何测试大家可以自行的百度一下    
然后就是给大家讲一下文中提到的使用setTimeout来实现的一些和原生Promise有出入的地方和一些要注意的问题    
之所以说使用setTimeout和原生的Promise有差距是因为在底层的实现上 Promise是微任务 而setTimeout是宏任务 这就造成了我们的代码执行顺序上会有不可避免的偏差 例如如下例子
```
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
``` 
在使用原生Promise的情况下 执行完第一个宏任务之后 会立即执行所有微任务 当微任务队列被清空后 才会执行下一个宏任务 所以上面的代码会输出 2 3 5 4 1 而我们使用setTimeout实现时 由于都是宏任务 会按照插入队列的顺序执行 所以这时候会输出 2 3 5 1 4 这就是我们要注意的地方 如果对于宏任务和微任务不太了解 大家可以去看一下这篇文章[这一次，彻底弄懂 JavaScript 执行机制](https://juejin.im/post/59e85eebf265da430d571f89) 不过好在我们只是想通过这个来掌握Promise的实现原理 大家在日常开发中还是使用原生的Promise就好    
另外一个问题就是如果Promise.all这个方法中传入的Promise参数中有自己的catch 那么只有在参数的catch方法中直接返回一个失败状态的promise或者throw一个错误 否则这个promise会显示为成功状态 不会影响Promise.all的执行 并且Promise.all的catch方法无法捕获到错误
所以如果需要使用Promise.all 那么尽量不要给你的参数添加catch 否则可能会达不到你的预期效果   
