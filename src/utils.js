// HELPERS

// Calculates the totla percenatge from the list of trackers
export function calcTotalPercent(arr) {
  var wSum = 0
  var sum = 0
  arr.forEach(function (e) {
    var w = e.weight || 1
    sum += w * e.getProgress()
    wSum += w
  })
  return sum / wSum
}

// Creates array from NodeList
export function toArray(l) {
  return Array.prototype.slice.call(l)
}

// Replaces a method in an existing object
// that first call the specified function then
// the original function. (And then the callback with return)
export function injectMethod(obj, oldFnName, fn, fnScope = null) {
  if (!obj[oldFnName]) throw 'Old function does not exist!'

  if (fnScope === null) fnScope = obj

  var callbackFunc
  var retObj = {
    callback: callback => {
      callbackFunc = callback
    }
  }

  var oldFn = obj[oldFnName]
  obj[oldFnName] = (...args) => {
    fn.apply(fnScope, args)
    var ret = oldFn.apply(obj, args)
    if (callbackFunc) {
      var r = callbackFunc.call(fnScope, ret)
      if (r && r !== null) ret = r
    }
    return ret
  }

  return retObj
}
