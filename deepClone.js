function isObject(obj) {
  return (typeof obj === 'object' || typeof obj === 'function') && obj != null
}
function deepClone(source, hash = new WeakMap()) {
  if (!isObject(source)) return source
  if (hash.has(source)) return hash.get(source)

  let target = Array.isArray(source) ? [...source] : { ...source }
  hash.set(source, target)

  Reflect.ownKeys(target).forEach(key => {
    // 改动 2
    if (isObject(source[key])) {
      target[key] = deepClone(source[key], hash)
    } else {
      target[key] = source[key]
    }
  })
  return target
}
function cloneDeep3(source, uniqueList) {
  if (!isObject(source)) return source
  if (!uniqueList) uniqueList = [] // 新增代码，初始化数组

  var target = Array.isArray(source) ? [] : {}

  // ============= 新增代码
  // 数据已经存在，返回保存的数据
  var uniqueData = find(uniqueList, source)
  if (uniqueData) {
    return uniqueData.target
  }
  uniqueList.push({
    source: source,
    target: target,
  })
  // =============

  for (var key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (isObject(source[key])) {
        target[key] = cloneDeep3(source[key], uniqueList) // 新增代码，传入数组
      } else {
        target[key] = source[key]
      }
    }
  }
  return target
}

// 新增方法，用于查找
function find(arr, item) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i].source === item) {
      return arr[i]
    }
  }
  return null
}
const obj = {
  s: 1,
  b: {
    d: 2,
    c: 3,
  },
  a: {
    nihao: 'ma',
  },
  r: Symbol('hello'),
}
obj.c = obj.b
obj.e = obj.a
obj.b.c = obj.c
obj.b.d = obj.b
obj.b.e = obj.b.c
const c = deepClone(obj)
c.s = 3
c.b.c = 1
console.log(c, obj)
