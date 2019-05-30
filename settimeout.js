let period = 60 * 1000 * 60 * 2
let startTime = new Date().getTime()
let count = 0
let end = new Date().getTime() + period
let interval = 1000
let currentInterval = interval
function sleep(delay) {
  let start = new Date().getTime()
  while (new Date().getTime() - start < delay) {
    continue
  }
}
function loop() {
  count++
  // 代码执行所消耗的时间
  let offset = new Date().getTime() - (startTime + count * interval)
  // 得到下一次循环所消耗的时间
  sleep(300)

  currentInterval = interval - offset
  console.log('代码执行时间：' + offset, '下次循环间隔' + currentInterval)
  setTimeout(loop, currentInterval)
}
function setInterval(callback, interval) {
  let timer
  const now = Date.now
  let startTime = now()
  let endTime = startTime
  const loop = () => {
    timer = window.requestAnimationFrame(loop)
    endTime = now()
    if (endTime - startTime >= interval) {
      startTime = endTime = now()
      callback(timer)
    }
  }
  timer = window.requestAnimationFrame(loop)
  return timer
}

let a = 0
setInterval(timer => {
  console.log(1)
  a++
  if (a === 3) cancelAnimationFrame(timer)
}, 1000)
setTimeout(loop, currentInterval)
