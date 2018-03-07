(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define('AutoProgress', factory) :
	(global.AutoProgress = factory());
}(this, (function () { 'use strict';

// POLYFILLS

// forEach polyfill
// Credit to https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.io/#x15.4.4.18
if (!Array.prototype.forEach) {

  Array.prototype.forEach = function (callback /*, thisArg*/) {

    var T, k;

    if (this == null) {
      throw new TypeError('this is null or not defined');
    }

    // 1. Let O be the result of calling toObject() passing the
    // |this| value as the argument.
    var O = Object(this);

    // 2. Let lenValue be the result of calling the Get() internal
    // method of O with the argument "length".
    // 3. Let len be toUint32(lenValue).
    var len = O.length >>> 0;

    // 4. If isCallable(callback) is false, throw a TypeError exception.
    // See: http://es5.github.com/#x9.11
    if (typeof callback !== 'function') {
      throw new TypeError(callback + ' is not a function');
    }

    // 5. If thisArg was supplied, let T be thisArg; else let
    // T be undefined.
    if (arguments.length > 1) {
      T = arguments[1];
    }

    // 6. Let k be 0.
    k = 0;

    // 7. Repeat while k < len.
    while (k < len) {

      var kValue;

      // a. Let Pk be ToString(k).
      //    This is implicit for LHS operands of the in operator.
      // b. Let kPresent be the result of calling the HasProperty
      //    internal method of O with argument Pk.
      //    This step can be combined with c.
      // c. If kPresent is true, then
      if (k in O) {

        // i. Let kValue be the result of calling the Get internal
        // method of O with argument Pk.
        kValue = O[k];

        // ii. Call the Call internal method of callback with T as
        // the this value and argument list containing kValue, k, and O.
        callback.call(T, kValue, k, O);
      }
      // d. Increase k by 1.
      k++;
    }
    // 8. return undefined.
  };
}

// Event construcor polyfill for IE
// Credit to mikemaccana https://stackoverflow.com/a/26596324
(function () {
  if (typeof window.CustomEvent === "function" || typeof window.Event === 'function') return false; //If not IE

  function CustomEvent(event, params) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  }

  CustomEvent.prototype = window.Event.prototype;

  window.Event = CustomEvent;
})();

// Array includes polyfill
// Taken from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes#Polyfill
// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function value(searchElement, fromIndex) {

      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      // 1. Let O be ? ToObject(this value).
      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If len is 0, return false.
      if (len === 0) {
        return false;
      }

      // 4. Let n be ? ToInteger(fromIndex).
      //    (If fromIndex is undefined, this step produces the value 0.)
      var n = fromIndex | 0;

      // 5. If n ≥ 0, then
      //  a. Let k be n.
      // 6. Else n < 0,
      //  a. Let k be len + n.
      //  b. If k < 0, let k be 0.
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      function sameValueZero(x, y) {
        return x === y || typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y);
      }

      // 7. Repeat, while k < len
      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)).
        // b. If SameValueZero(searchElement, elementK) is true, return true.
        if (sameValueZero(o[k], searchElement)) {
          return true;
        }
        // c. Increase k by 1.
        k++;
      }

      // 8. Return false
      return false;
    }
  });
}

// HELPERS

// Calculates the totla percenatge from the list of trackers
function calcTotalPercent(arr) {
  var wSum = 0;
  var sum = 0;
  arr.forEach(function (e) {
    var w = e.weight || 1;
    sum += w * e.getProgress();
    wSum += w;
  });
  return sum / wSum;
}

// Creates array from NodeList
function toArray(l) {
  return Array.prototype.slice.call(l);
}

// Replaces a method in an existing object
// that first call the specified function then
// the original function. (And then the callback with return)
function injectMethod(obj, oldFnName, fn) {
  var fnScope = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

  if (!obj[oldFnName]) throw 'Old function does not exist!';

  if (fnScope === null) fnScope = obj;

  var callbackFunc;
  var retObj = {
    callback: function callback(_callback) {
      callbackFunc = _callback;
    }
  };

  var oldFn = obj[oldFnName];
  obj[oldFnName] = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    fn.apply(fnScope, args);
    var ret = oldFn.apply(obj, args);
    if (callbackFunc) {
      var r = callbackFunc.call(fnScope, ret);
      if (r && r !== null) ret = r;
    }
    return ret;
  };

  return retObj;
}

// CLASS TEMPLATES

// EventTarget implementation
// Credit to naomik https://stackoverflow.com/a/24216547

function Emitter() {
  this.eventTarget = document.createDocumentFragment();
}
Emitter.prototype.addEventListener = function (type, listener, useCapture, wantsUntrusted) {
  return this.eventTarget.addEventListener(type, listener, useCapture, wantsUntrusted);
};
Emitter.prototype.dispatchEvent = function (event) {
  //Handle property style event handlers
  var m = 'on' + event.type;
  if (this[m]) this[m](event);

  return this.eventTarget.dispatchEvent(event);
};
Emitter.prototype.removeEventListener = function (type, listener, useCapture) {
  return this.eventTarget.removeEventListener(type, listener, useCapture);
};
// var Emitter = {
//   eventTarget: document.createDocumentFragment()
// }
//
// Emitter.addEventListener = (function(self){return function (type, listener, useCapture, wantsUntrusted) {
//   return self.eventTarget.addEventListener(type, listener, useCapture, wantsUntrusted)
// }}(Emitter))
//
// Emitter.dispatchEvent = (function(self){return function () {
//   //Handle property style event handlers
//   var m = 'on' + event.type
//   if (self[m]) self[m](event)
//
//   return self.eventTarget.dispatchEvent(event)
// }}(Emitter))
//
// Emitter.removeEventListener = (function(self){return function () {
//   return self.eventTarget.removeEventListener(type, listener, useCapture)
// }}(Emitter))
// function Emitter() {
//   var eventTarget = document.createDocumentFragment()
//
//   this.addEventListener = function (type, listener, useCapture, wantsUntrusted) {
//     return eventTarget.addEventListener(type, listener, useCapture, wantsUntrusted)
//   }
//
//   this.dispatchEvent = (event) => {
//     //Handle property style event handlers
//     var m = 'on' + event.type
//     if (this[m]) this[m](event)
//
//     return eventTarget.dispatchEvent(event)
//   }
//
//   this.removeEventListener = function (type, listener, useCapture) {
//     return eventTarget.removeEventListener(type, listener, useCapture)
//   }
// }

// All the basic functionality required for trackers
// Inherits Emitter
function Tracker() {
  Emitter.call(this);

  // Properies
  this.total = 0;
  this.done = 0;
  this.weight = 1;
  this.waiting = false;

  this.options = {
    waitAfterStart: 100
  };
  this.progressEvent = new Event('progress');
  this.activeTimer = null;
}
Tracker.prototype = Object.create(Emitter.prototype);
// Called when an element is finished
Tracker.prototype.handleElement = function () {
  if (this.total == 0 || this.done == this.total) return;

  this.done++;
  this.dispatchEvent(this.progressEvent);
};
Tracker.prototype.getProgress = function () {
  if (this.total === 0) {
    if (this.waiting) return 0;else return 100;
  }
  return this.done / this.total * 100;
};
// (Re)Start the tracker. Sets the tasks total and done to 0
// if reset is true. Otherwise does nothing by deafult.
Tracker.prototype.start = function () {
  var _this2 = this;

  var reset = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

  if (reset) {
    this.total = 0;
    this.done = 0;
  }

  // If a timer is already going clear it
  if (this.activeTimer !== null) clearTimeout(this.activeTimer);

  this.waiting = true;
  this.activeTimer = setTimeout(function () {
    _this2.waiting = false;
    if (_this2.search) _this2.search();
    if (_this2.total == 0) _this2.dispatchEvent(_this2.progressEvent);
    _this2.activeTimer = null;
  }, this.options.waitAfterStart);
};

// function Tracker() {
//   Emitter.call(this)
//
//   // Properies
//   this.total = 0
//   this.done = 0
//   this.weight = 1
//   this.waiting = false
//
//   this.options = {
//     waitAfterStart: 100
//   }
//
//   // Events
//   var progressEvent = new Event('progress')
//
//   // Called when an element is finished
//   this.handleElement = () => {
//     if (this.total == 0 || this.done == this.total) return
//
//     this.done++
//     this.dispatchEvent(progressEvent)
//   }
//
//   // Returns the current progress
//   this.getProgress = () => {
//     if (this.total === 0) {
//       if (this.waiting) return 0
//       else return 100
//     }
//     return this.done / this.total * 100
//   }
//
//   // The active wait timer. Only one can run at a time
//   var activeTimer = null
//   // (Re)Start the tracker. Sets the tasks total and done to 0
//   // if reset is true. Otherwise does nothing by deafult.
//   this.start = (reset = true) => {
//     if (reset) {
//       this.total = 0
//       this.done = 0
//     }
//
//     // If a timer is already going clear it
//     if (activeTimer !== null) clearTimeout(activeTimer)
//
//     this.waiting = true
//     activeTimer = setTimeout(() => {
//       this.waiting = false
//       if (this.search) this.search()
//       if (this.total == 0) this.dispatchEvent(progressEvent)
//       activeTimer = null
//     }, this.options.waitAfterStart);
//   }
// }

// TRACKERS
//  AJAX
//  XHR - Tracks XMLHttpRequests
function XHRTracker() {
  Tracker.call(this);

  var _this = this;
  var oldXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function () {
    var xhr = new oldXHR();

    injectMethod(xhr, 'send', function () {
      return _this.total++;
    });

    xhr.addEventListener('load', function (e) {
      return _this.handleElement();
    });
    xhr.addEventListener('error', function (e) {
      return _this.handleElement();
    });

    return xhr;
  };
}
XHRTracker.prototype = Object.create(Tracker.prototype);

//  Fetch - Tracks fetch requests
function FetchTracker() {
  Tracker.call(this);

  injectMethod(window, 'fetch', function () {
    this.total++;
  }, this).callback(function (ret) {
    var _this3 = this;

    return ret.then(function (res) {
      _this3.handleElement();
      return res;
    });
  });
}
FetchTracker.prototype = Object.create(Tracker.prototype);

// DOM Tracking - Tracks DOM elements
function DocumentTracker() {
  var _this4 = this;

  Tracker.call(this);

  this.trackedElements = [];

  // List of element selector functions
  this.elements = [
  // Images
  function () {
    toArray(document.querySelectorAll('img')).forEach(function (e) {
      if (e.complete || _this4.trackedElements.includes(e)) return;

      _this4.total++;
      e.addEventListener('load', function () {
        return _this4.handleElement();
      });
      e.addEventListener('error', function () {
        return _this4.handleElement();
      });

      _this4.trackedElements.push(e);
    });
  },
  // Media
  function () {
    toArray(document.querySelectorAll('audio')).concat(toArray(document.querySelectorAll('video'))).forEach(function (el) {
      if (el.readyState < 2 || _this4.trackedElements.includes(e)) return;

      _this4.total++;
      if (el.preload == 'auto' || el.autoplay) {
        el.addEventListener('canplay', function () {
          return _this4.handleElement();
        });
        el.addEventListener('error', function () {
          return _this4.handleElement();
        });
      } else {
        _this4.handleElement();
      }

      _this4.trackedElements.push(e);
    });
  }];

  document.onreadystatechange = function (ev) {
    // When the DOM loaded start
    if (document.readyState == 'interactive') {
      _this4.search();
      // +1 For the rest of the document that might need loading
      _this4.total++;
    }
    // When the whole document loaded
    else if (document.readyState == 'complete') _this4.handleElement();
  };
}
DocumentTracker.prototype = Object.create(Tracker.prototype);
DocumentTracker.prototype.search = function () {
  var _this5 = this;

  this.elements.forEach(function (e) {
    return e(_this5.handleElement);
  });
};

// function DocumentTracker() {
//   Tracker.call(this)
//
//   var trackedElements = []
//
//   // List of element selector functions
//   var elements = [
//     // Images
//     (handleElement) => {
//       toArray(document.querySelectorAll('img'))
//         .forEach(e => {
//           if (e.complete || trackedElements.includes(e)) return
//
//           this.total++
//           e.addEventListener('load', handleElement)
//           e.addEventListener('error', handleElement)
//
//           trackedElements.push(e)
//         })
//     },
//     // Media
//     (handleElement) => {
//       toArray(document.querySelectorAll('audio'))
//         .concat(toArray(document.querySelectorAll('video')))
//         .forEach(el => {
//           if (el.readyState < 2 || trackedElements.includes(e)) return
//
//           this.total++
//           if (el.preload == 'auto' || el.autoplay) {
//             el.addEventListener('canplay', handleElement)
//             el.addEventListener('error', handleElement)
//           } else {
//             handleElement()
//           }
//
//           trackedElements.push(e)
//         })
//     }
//   ]
//
//   // On start look for the elements
//   this.search = () => {
//     elements.forEach(e => e(this.handleElement))
//   }
//
//   document.onreadystatechange = ev => {
//     // When the DOM loaded start
//     if (document.readyState == 'interactive') {
//       this.search()
//       // +1 For the rest of the document that might need loading
//       this.total++
//     }
//     // When the whole document loaded
//     else if (document.readyState == 'complete')
//       this.handleElement()
//   }
// }

// The main thing
function AutoProgress() {
  Emitter.call(this);

  this.options = {};
  this.defaultOptions = {
    restartOnPopstate: true,
    fallbackHashChange: true,
    restartCooldown: 1000
  };

  this.totalProgress = 0;
  this.trackers = [];

  this.canRestart = true;
  this.restartCooldown = 1000;

  this.events = {
    progress: new Event('progress'),
    finished: new Event('finished')

    // Create all the trackers
  };this.addTracker(XHRTracker);
  if (window.fetch && typeof window.fetch == 'function') this.addTracker(FetchTracker);
  this.addTracker(DocumentTracker);

  this.setOptions(this.defaultOptions);
}
AutoProgress.prototype = Object.create(Tracker.prototype);

AutoProgress.prototype.updateProgress = function () {
  if (this.totalProgress == 100) return;

  this.totalProgress = calcTotalPercent(this.trackers);
  this.dispatchEvent(this.events.progress);
  if (this.totalProgress == 100) {
    this.dispatchEvent(this.events.finished);
  }
};
AutoProgress.prototype.addTracker = function (tracker) {
  var _this6 = this;

  var t = new tracker();
  t.start(false);

  this.trackers.push(t);
  this.updateProgress();

  t.addEventListener('progress', function () {
    return _this6.updateProgress();
  });
};
AutoProgress.prototype.restart = function () {
  var _this7 = this;

  if (this.canRestart) {
    this.totalProgress = 0;
    this.trackers.forEach(function (e) {
      return e.start(true);
    });
    this.updateProgress();

    if (this.restartCooldown != 0) {
      this.canRestart = false;
      setTimeout(function () {
        _this7.canRestart = true;
      }, this.restartCooldown);
    }
  }
};
AutoProgress.prototype.getProgress = function () {
  return this.totalProgress;
};
AutoProgress.prototype.setLoadTimeout = function (timeout) {
  var _this8 = this;

  setTimeout(function () {
    if (_this8.totalProgress != 100) {
      _this8.totalProgress = 100;
      _this8.dispatchEvent(_this8.events.progress);
      _this8.dispatchEvent(_this8.events.finished);
    }
  }, timeout);
};
AutoProgress.prototype.setOption = function (name, value) {
  var _this9 = this;

  if (name == 'restartCooldown' && !isNaN(value) && value > 0) {
    this.restartCooldown = value;
  } else if (name == 'restartOnPopstate' && window.history && value !== this.options[name]) {
    this.options[name] = value;
    if (value) {
      var fn = function fn() {
        if (_this9.options.restartOnPopstate) _this9.restart();
      };

      injectMethod(window.history, 'pushState', fn, this);
      injectMethod(window.history, 'replaceState', fn, this);

      window.addEventListener('popstate', function () {
        return _this9.restart();
      });
    } else window.offEventListener('popstate', function () {
      return _this9.restart();
    });
  } else if (name == 'restartOnHashChange' || !window.history && name == 'fallbackHashChange') {
    if (value === this.options[name]) return;

    this.options[name] = value;
    if (value) window.addEventListener('hashchange', function () {
      return _this9.restart();
    });else window.offEventListener('hashchange', this.restart);
  } else {
    for (var t in this.trackers) {
      if (this.trackers[t].options && this.trackers[t].options[name]) this.trackers[t].options[name] = value;
    }
  }
};
AutoProgress.prototype.setOptions = function (options) {
  for (var o in options) {
    this.setOption(o, options[o]);
  }
};

// function AutoProgress() {
//   Emitter.call(this)
//
//   var options = {}
//   var defaultOptions = {
//     restartOnPopstate: true,
//     fallbackHashChange: true,
//     restartCooldown: 1000
//   }
//
//   var totalProgress = 0
//   var trackers = []
//
//   var events = {
//     progress: new Event('progress'),
//     finished: new Event('finished')
//   }
//
//   // Update the progress
//   var updateProgress = () => {
//     if (totalProgress == 100) return
//
//     totalProgress = calcTotalPercent(trackers)
//     this.dispatchEvent(events.progress)
//     if (totalProgress == 100) {
//       this.dispatchEvent(events.finished)
//     }
//   }
//
//   // Adds a new tracker
//   var addTracker = (tracker) => {
//     var t = new tracker()
//     t.start(false)
//
//     trackers.push(t)
//     updateProgress()
//
//     t.addEventListener('progress', updateProgress)
//
//     return t
//   }
//
//   // Create all the trackers
//   addTracker(XHRTracker)
//   if (window.fetch && typeof window.fetch == 'function')
//     addTracker(FetchTracker)
//   addTracker(DocumentTracker)
//
//   // Make sure it doesn't reset too many times too quickly
//   var canRestart = true
//   var restartCooldown = 1000
//   this.restart = () => {
//     if (canRestart) {
//       totalProgress = 0
//       trackers.forEach(e => e.start(true))
//       updateProgress()
//
//       if (restartCooldown != 0) {
//         canRestart = false
//         setTimeout(function () {
//           canRestart = true
//         }, restartCooldown)
//       }
//     }
//   }
//
//   // Public getter for the progress
//   this.getProgress = function () {
//     return totalProgress
//   }
//
//   // Set a timeout if the page is loading for too long
//   this.setLoadTimeout = (timeout = 3000) => {
//     setTimeout(() => {
//       if (totalProgress != 100) {
//         totalProgress = 100
//         this.dispatchEvent(events.progress)
//         this.dispatchEvent(events.finished)
//       }
//     }, timeout)
//   }
//
//   // Set the options
//   // Decided to go with this instead of having a constructor
//   // and options as parameters. Can ensure single instance this way
//   this.setOption = (name, value) => {
//     if (name == 'restartCooldown' && !isNaN(value) && value > 0) {
//       restartCooldown = value
//     }
//     else if (name == 'restartOnPopstate' && window.history && value !== options[name]) {
//       options[name] = value
//       if (value) {
//         var fn = () => {
//           if (options.restartOnPopstate) this.restart()
//         }
//
//         injectMethod(window.history, 'pushState', fn, this)
//         injectMethod(window.history, 'replaceState', fn, this)
//
//         window.addEventListener('popstate', this.restart)
//       }
//       else window.offEventListener('popstate', this.restart)
//     }
//     else if (name == 'restartOnHashChange' || (!window.history && name == 'fallbackHashChange')) {
//       if (value === options[name]) return
//
//       options[name] = value
//       if (value) window.addEventListener('hashchange', this.restart)
//       else window.offEventListener('hashchange', this.restart)
//     }
//     else {
//       for (var t in this.trackers) {
//         if (this.trackers[t].options && this.trackers[t].options[name])
//           this.trackers[t].options[name] = value
//       }
//     }
//   }
//
//   // Same as setOption except can do multiple setting at once
//   this.setOptions = (options) => {
//     for (var o in options)
//       this.setOption(o, options[o])
//   }
//
//   this.setOptions(defaultOptions)
// }

var index = new AutoProgress();

return index;

})));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbInNyYy9wb2x5ZmlsbHMuanMiLCJzcmMvdXRpbHMuanMiLCJzcmMvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gUE9MWUZJTExTXHJcblxyXG4vLyBmb3JFYWNoIHBvbHlmaWxsXHJcbi8vIENyZWRpdCB0byBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9mb3JFYWNoXHJcbi8vIFByb2R1Y3Rpb24gc3RlcHMgb2YgRUNNQS0yNjIsIEVkaXRpb24gNSwgMTUuNC40LjE4XHJcbi8vIFJlZmVyZW5jZTogaHR0cDovL2VzNS5naXRodWIuaW8vI3gxNS40LjQuMThcclxuaWYgKCFBcnJheS5wcm90b3R5cGUuZm9yRWFjaCkge1xyXG5cclxuICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uKGNhbGxiYWNrLyosIHRoaXNBcmcqLykge1xyXG5cclxuICAgIHZhciBULCBrO1xyXG5cclxuICAgIGlmICh0aGlzID09IG51bGwpIHtcclxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigndGhpcyBpcyBudWxsIG9yIG5vdCBkZWZpbmVkJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gMS4gTGV0IE8gYmUgdGhlIHJlc3VsdCBvZiBjYWxsaW5nIHRvT2JqZWN0KCkgcGFzc2luZyB0aGVcclxuICAgIC8vIHx0aGlzfCB2YWx1ZSBhcyB0aGUgYXJndW1lbnQuXHJcbiAgICB2YXIgTyA9IE9iamVjdCh0aGlzKTtcclxuXHJcbiAgICAvLyAyLiBMZXQgbGVuVmFsdWUgYmUgdGhlIHJlc3VsdCBvZiBjYWxsaW5nIHRoZSBHZXQoKSBpbnRlcm5hbFxyXG4gICAgLy8gbWV0aG9kIG9mIE8gd2l0aCB0aGUgYXJndW1lbnQgXCJsZW5ndGhcIi5cclxuICAgIC8vIDMuIExldCBsZW4gYmUgdG9VaW50MzIobGVuVmFsdWUpLlxyXG4gICAgdmFyIGxlbiA9IE8ubGVuZ3RoID4+PiAwO1xyXG5cclxuICAgIC8vIDQuIElmIGlzQ2FsbGFibGUoY2FsbGJhY2spIGlzIGZhbHNlLCB0aHJvdyBhIFR5cGVFcnJvciBleGNlcHRpb24uXHJcbiAgICAvLyBTZWU6IGh0dHA6Ly9lczUuZ2l0aHViLmNvbS8jeDkuMTFcclxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihjYWxsYmFjayArICcgaXMgbm90IGEgZnVuY3Rpb24nKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyA1LiBJZiB0aGlzQXJnIHdhcyBzdXBwbGllZCwgbGV0IFQgYmUgdGhpc0FyZzsgZWxzZSBsZXRcclxuICAgIC8vIFQgYmUgdW5kZWZpbmVkLlxyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgIFQgPSBhcmd1bWVudHNbMV07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gNi4gTGV0IGsgYmUgMC5cclxuICAgIGsgPSAwO1xyXG5cclxuICAgIC8vIDcuIFJlcGVhdCB3aGlsZSBrIDwgbGVuLlxyXG4gICAgd2hpbGUgKGsgPCBsZW4pIHtcclxuXHJcbiAgICAgIHZhciBrVmFsdWU7XHJcblxyXG4gICAgICAvLyBhLiBMZXQgUGsgYmUgVG9TdHJpbmcoaykuXHJcbiAgICAgIC8vICAgIFRoaXMgaXMgaW1wbGljaXQgZm9yIExIUyBvcGVyYW5kcyBvZiB0aGUgaW4gb3BlcmF0b3IuXHJcbiAgICAgIC8vIGIuIExldCBrUHJlc2VudCBiZSB0aGUgcmVzdWx0IG9mIGNhbGxpbmcgdGhlIEhhc1Byb3BlcnR5XHJcbiAgICAgIC8vICAgIGludGVybmFsIG1ldGhvZCBvZiBPIHdpdGggYXJndW1lbnQgUGsuXHJcbiAgICAgIC8vICAgIFRoaXMgc3RlcCBjYW4gYmUgY29tYmluZWQgd2l0aCBjLlxyXG4gICAgICAvLyBjLiBJZiBrUHJlc2VudCBpcyB0cnVlLCB0aGVuXHJcbiAgICAgIGlmIChrIGluIE8pIHtcclxuXHJcbiAgICAgICAgLy8gaS4gTGV0IGtWYWx1ZSBiZSB0aGUgcmVzdWx0IG9mIGNhbGxpbmcgdGhlIEdldCBpbnRlcm5hbFxyXG4gICAgICAgIC8vIG1ldGhvZCBvZiBPIHdpdGggYXJndW1lbnQgUGsuXHJcbiAgICAgICAga1ZhbHVlID0gT1trXTtcclxuXHJcbiAgICAgICAgLy8gaWkuIENhbGwgdGhlIENhbGwgaW50ZXJuYWwgbWV0aG9kIG9mIGNhbGxiYWNrIHdpdGggVCBhc1xyXG4gICAgICAgIC8vIHRoZSB0aGlzIHZhbHVlIGFuZCBhcmd1bWVudCBsaXN0IGNvbnRhaW5pbmcga1ZhbHVlLCBrLCBhbmQgTy5cclxuICAgICAgICBjYWxsYmFjay5jYWxsKFQsIGtWYWx1ZSwgaywgTyk7XHJcbiAgICAgIH1cclxuICAgICAgLy8gZC4gSW5jcmVhc2UgayBieSAxLlxyXG4gICAgICBrKys7XHJcbiAgICB9XHJcbiAgICAvLyA4LiByZXR1cm4gdW5kZWZpbmVkLlxyXG4gIH07XHJcbn1cclxuXHJcbi8vIEV2ZW50IGNvbnN0cnVjb3IgcG9seWZpbGwgZm9yIElFXHJcbi8vIENyZWRpdCB0byBtaWtlbWFjY2FuYSBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjY1OTYzMjRcclxuKGZ1bmN0aW9uICgpIHtcclxuICBpZiAoIHR5cGVvZiB3aW5kb3cuQ3VzdG9tRXZlbnQgPT09IFwiZnVuY3Rpb25cIiB8fCB0eXBlb2Ygd2luZG93LkV2ZW50ID09PSAnZnVuY3Rpb24nKSByZXR1cm4gZmFsc2U7IC8vSWYgbm90IElFXHJcblxyXG4gIGZ1bmN0aW9uIEN1c3RvbUV2ZW50ICggZXZlbnQsIHBhcmFtcyApIHtcclxuICAgIHBhcmFtcyA9IHBhcmFtcyB8fCB7IGJ1YmJsZXM6IGZhbHNlLCBjYW5jZWxhYmxlOiBmYWxzZSwgZGV0YWlsOiB1bmRlZmluZWQgfTtcclxuICAgIHZhciBldnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCggJ0N1c3RvbUV2ZW50JyApO1xyXG4gICAgZXZ0LmluaXRDdXN0b21FdmVudCggZXZlbnQsIHBhcmFtcy5idWJibGVzLCBwYXJhbXMuY2FuY2VsYWJsZSwgcGFyYW1zLmRldGFpbCApO1xyXG4gICAgcmV0dXJuIGV2dDtcclxuICAgfVxyXG5cclxuICBDdXN0b21FdmVudC5wcm90b3R5cGUgPSB3aW5kb3cuRXZlbnQucHJvdG90eXBlO1xyXG5cclxuICB3aW5kb3cuRXZlbnQgPSBDdXN0b21FdmVudDtcclxufSkoKTtcclxuXHJcblxyXG4vLyBBcnJheSBpbmNsdWRlcyBwb2x5ZmlsbFxyXG4vLyBUYWtlbiBmcm9tIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2luY2x1ZGVzI1BvbHlmaWxsXHJcbi8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLWFycmF5LnByb3RvdHlwZS5pbmNsdWRlc1xyXG5pZiAoIUFycmF5LnByb3RvdHlwZS5pbmNsdWRlcykge1xyXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShBcnJheS5wcm90b3R5cGUsICdpbmNsdWRlcycsIHtcclxuICAgIHZhbHVlOiBmdW5jdGlvbihzZWFyY2hFbGVtZW50LCBmcm9tSW5kZXgpIHtcclxuXHJcbiAgICAgIGlmICh0aGlzID09IG51bGwpIHtcclxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcInRoaXNcIiBpcyBudWxsIG9yIG5vdCBkZWZpbmVkJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIDEuIExldCBPIGJlID8gVG9PYmplY3QodGhpcyB2YWx1ZSkuXHJcbiAgICAgIHZhciBvID0gT2JqZWN0KHRoaXMpO1xyXG5cclxuICAgICAgLy8gMi4gTGV0IGxlbiBiZSA/IFRvTGVuZ3RoKD8gR2V0KE8sIFwibGVuZ3RoXCIpKS5cclxuICAgICAgdmFyIGxlbiA9IG8ubGVuZ3RoID4+PiAwO1xyXG5cclxuICAgICAgLy8gMy4gSWYgbGVuIGlzIDAsIHJldHVybiBmYWxzZS5cclxuICAgICAgaWYgKGxlbiA9PT0gMCkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gNC4gTGV0IG4gYmUgPyBUb0ludGVnZXIoZnJvbUluZGV4KS5cclxuICAgICAgLy8gICAgKElmIGZyb21JbmRleCBpcyB1bmRlZmluZWQsIHRoaXMgc3RlcCBwcm9kdWNlcyB0aGUgdmFsdWUgMC4pXHJcbiAgICAgIHZhciBuID0gZnJvbUluZGV4IHwgMDtcclxuXHJcbiAgICAgIC8vIDUuIElmIG4g4omlIDAsIHRoZW5cclxuICAgICAgLy8gIGEuIExldCBrIGJlIG4uXHJcbiAgICAgIC8vIDYuIEVsc2UgbiA8IDAsXHJcbiAgICAgIC8vICBhLiBMZXQgayBiZSBsZW4gKyBuLlxyXG4gICAgICAvLyAgYi4gSWYgayA8IDAsIGxldCBrIGJlIDAuXHJcbiAgICAgIHZhciBrID0gTWF0aC5tYXgobiA+PSAwID8gbiA6IGxlbiAtIE1hdGguYWJzKG4pLCAwKTtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIHNhbWVWYWx1ZVplcm8oeCwgeSkge1xyXG4gICAgICAgIHJldHVybiB4ID09PSB5IHx8ICh0eXBlb2YgeCA9PT0gJ251bWJlcicgJiYgdHlwZW9mIHkgPT09ICdudW1iZXInICYmIGlzTmFOKHgpICYmIGlzTmFOKHkpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gNy4gUmVwZWF0LCB3aGlsZSBrIDwgbGVuXHJcbiAgICAgIHdoaWxlIChrIDwgbGVuKSB7XHJcbiAgICAgICAgLy8gYS4gTGV0IGVsZW1lbnRLIGJlIHRoZSByZXN1bHQgb2YgPyBHZXQoTywgISBUb1N0cmluZyhrKSkuXHJcbiAgICAgICAgLy8gYi4gSWYgU2FtZVZhbHVlWmVybyhzZWFyY2hFbGVtZW50LCBlbGVtZW50SykgaXMgdHJ1ZSwgcmV0dXJuIHRydWUuXHJcbiAgICAgICAgaWYgKHNhbWVWYWx1ZVplcm8ob1trXSwgc2VhcmNoRWxlbWVudCkpIHtcclxuICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBjLiBJbmNyZWFzZSBrIGJ5IDEuXHJcbiAgICAgICAgaysrO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyA4LiBSZXR1cm4gZmFsc2VcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcbiIsIi8vIEhFTFBFUlNcclxuXHJcbi8vIENhbGN1bGF0ZXMgdGhlIHRvdGxhIHBlcmNlbmF0Z2UgZnJvbSB0aGUgbGlzdCBvZiB0cmFja2Vyc1xyXG5leHBvcnQgZnVuY3Rpb24gY2FsY1RvdGFsUGVyY2VudChhcnIpIHtcclxuICB2YXIgd1N1bSA9IDBcclxuICB2YXIgc3VtID0gMFxyXG4gIGFyci5mb3JFYWNoKGZ1bmN0aW9uIChlKSB7XHJcbiAgICB2YXIgdyA9IGUud2VpZ2h0IHx8IDFcclxuICAgIHN1bSArPSB3ICogZS5nZXRQcm9ncmVzcygpXHJcbiAgICB3U3VtICs9IHdcclxuICB9KVxyXG4gIHJldHVybiBzdW0gLyB3U3VtXHJcbn1cclxuXHJcbi8vIENyZWF0ZXMgYXJyYXkgZnJvbSBOb2RlTGlzdFxyXG5leHBvcnQgZnVuY3Rpb24gdG9BcnJheShsKSB7XHJcbiAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGwpXHJcbn1cclxuXHJcbi8vIFJlcGxhY2VzIGEgbWV0aG9kIGluIGFuIGV4aXN0aW5nIG9iamVjdFxyXG4vLyB0aGF0IGZpcnN0IGNhbGwgdGhlIHNwZWNpZmllZCBmdW5jdGlvbiB0aGVuXHJcbi8vIHRoZSBvcmlnaW5hbCBmdW5jdGlvbi4gKEFuZCB0aGVuIHRoZSBjYWxsYmFjayB3aXRoIHJldHVybilcclxuZXhwb3J0IGZ1bmN0aW9uIGluamVjdE1ldGhvZChvYmosIG9sZEZuTmFtZSwgZm4sIGZuU2NvcGUgPSBudWxsKSB7XHJcbiAgaWYgKCFvYmpbb2xkRm5OYW1lXSkgdGhyb3cgJ09sZCBmdW5jdGlvbiBkb2VzIG5vdCBleGlzdCEnXHJcblxyXG4gIGlmIChmblNjb3BlID09PSBudWxsKSBmblNjb3BlID0gb2JqXHJcblxyXG4gIHZhciBjYWxsYmFja0Z1bmNcclxuICB2YXIgcmV0T2JqID0ge1xyXG4gICAgY2FsbGJhY2s6IGNhbGxiYWNrID0+IHtcclxuICAgICAgY2FsbGJhY2tGdW5jID0gY2FsbGJhY2tcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHZhciBvbGRGbiA9IG9ialtvbGRGbk5hbWVdXHJcbiAgb2JqW29sZEZuTmFtZV0gPSAoLi4uYXJncykgPT4ge1xyXG4gICAgZm4uYXBwbHkoZm5TY29wZSwgYXJncylcclxuICAgIHZhciByZXQgPSBvbGRGbi5hcHBseShvYmosIGFyZ3MpXHJcbiAgICBpZiAoY2FsbGJhY2tGdW5jKSB7XHJcbiAgICAgIHZhciByID0gY2FsbGJhY2tGdW5jLmNhbGwoZm5TY29wZSwgcmV0KVxyXG4gICAgICBpZiAociAmJiByICE9PSBudWxsKSByZXQgPSByXHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmV0XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcmV0T2JqXHJcbn1cclxuIiwiaW1wb3J0ICcuL3BvbHlmaWxscy5qcydcclxuaW1wb3J0IHsgdG9BcnJheSwgaW5qZWN0TWV0aG9kLCBjYWxjVG90YWxQZXJjZW50IH0gZnJvbSAnLi91dGlscy5qcydcclxuXHJcbi8vIENMQVNTIFRFTVBMQVRFU1xyXG5cclxuLy8gRXZlbnRUYXJnZXQgaW1wbGVtZW50YXRpb25cclxuLy8gQ3JlZGl0IHRvIG5hb21payBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjQyMTY1NDdcclxuXHJcbmZ1bmN0aW9uIEVtaXR0ZXIoKSB7XHJcbiAgdGhpcy5ldmVudFRhcmdldCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKVxyXG59XHJcbkVtaXR0ZXIucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUsIHdhbnRzVW50cnVzdGVkKSB7XHJcbiAgcmV0dXJuIHRoaXMuZXZlbnRUYXJnZXQuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSwgd2FudHNVbnRydXN0ZWQpXHJcbn1cclxuRW1pdHRlci5wcm90b3R5cGUuZGlzcGF0Y2hFdmVudCA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gIC8vSGFuZGxlIHByb3BlcnR5IHN0eWxlIGV2ZW50IGhhbmRsZXJzXHJcbiAgdmFyIG0gPSAnb24nICsgZXZlbnQudHlwZVxyXG4gIGlmICh0aGlzW21dKSB0aGlzW21dKGV2ZW50KVxyXG5cclxuICByZXR1cm4gdGhpcy5ldmVudFRhcmdldC5kaXNwYXRjaEV2ZW50KGV2ZW50KVxyXG59XHJcbkVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpIHtcclxuICByZXR1cm4gdGhpcy5ldmVudFRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKVxyXG59XHJcbi8vIHZhciBFbWl0dGVyID0ge1xyXG4vLyAgIGV2ZW50VGFyZ2V0OiBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KClcclxuLy8gfVxyXG4vL1xyXG4vLyBFbWl0dGVyLmFkZEV2ZW50TGlzdGVuZXIgPSAoZnVuY3Rpb24oc2VsZil7cmV0dXJuIGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSwgd2FudHNVbnRydXN0ZWQpIHtcclxuLy8gICByZXR1cm4gc2VsZi5ldmVudFRhcmdldC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlLCB3YW50c1VudHJ1c3RlZClcclxuLy8gfX0oRW1pdHRlcikpXHJcbi8vXHJcbi8vIEVtaXR0ZXIuZGlzcGF0Y2hFdmVudCA9IChmdW5jdGlvbihzZWxmKXtyZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4vLyAgIC8vSGFuZGxlIHByb3BlcnR5IHN0eWxlIGV2ZW50IGhhbmRsZXJzXHJcbi8vICAgdmFyIG0gPSAnb24nICsgZXZlbnQudHlwZVxyXG4vLyAgIGlmIChzZWxmW21dKSBzZWxmW21dKGV2ZW50KVxyXG4vL1xyXG4vLyAgIHJldHVybiBzZWxmLmV2ZW50VGFyZ2V0LmRpc3BhdGNoRXZlbnQoZXZlbnQpXHJcbi8vIH19KEVtaXR0ZXIpKVxyXG4vL1xyXG4vLyBFbWl0dGVyLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSAoZnVuY3Rpb24oc2VsZil7cmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuLy8gICByZXR1cm4gc2VsZi5ldmVudFRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKVxyXG4vLyB9fShFbWl0dGVyKSlcclxuLy8gZnVuY3Rpb24gRW1pdHRlcigpIHtcclxuLy8gICB2YXIgZXZlbnRUYXJnZXQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KClcclxuLy9cclxuLy8gICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUsIHdhbnRzVW50cnVzdGVkKSB7XHJcbi8vICAgICByZXR1cm4gZXZlbnRUYXJnZXQuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSwgd2FudHNVbnRydXN0ZWQpXHJcbi8vICAgfVxyXG4vL1xyXG4vLyAgIHRoaXMuZGlzcGF0Y2hFdmVudCA9IChldmVudCkgPT4ge1xyXG4vLyAgICAgLy9IYW5kbGUgcHJvcGVydHkgc3R5bGUgZXZlbnQgaGFuZGxlcnNcclxuLy8gICAgIHZhciBtID0gJ29uJyArIGV2ZW50LnR5cGVcclxuLy8gICAgIGlmICh0aGlzW21dKSB0aGlzW21dKGV2ZW50KVxyXG4vL1xyXG4vLyAgICAgcmV0dXJuIGV2ZW50VGFyZ2V0LmRpc3BhdGNoRXZlbnQoZXZlbnQpXHJcbi8vICAgfVxyXG4vL1xyXG4vLyAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSkge1xyXG4vLyAgICAgcmV0dXJuIGV2ZW50VGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpXHJcbi8vICAgfVxyXG4vLyB9XHJcblxyXG4vLyBBbGwgdGhlIGJhc2ljIGZ1bmN0aW9uYWxpdHkgcmVxdWlyZWQgZm9yIHRyYWNrZXJzXHJcbi8vIEluaGVyaXRzIEVtaXR0ZXJcclxuZnVuY3Rpb24gVHJhY2tlcigpIHtcclxuICBFbWl0dGVyLmNhbGwodGhpcylcclxuXHJcbiAgLy8gUHJvcGVyaWVzXHJcbiAgdGhpcy50b3RhbCA9IDBcclxuICB0aGlzLmRvbmUgPSAwXHJcbiAgdGhpcy53ZWlnaHQgPSAxXHJcbiAgdGhpcy53YWl0aW5nID0gZmFsc2VcclxuXHJcbiAgdGhpcy5vcHRpb25zID0ge1xyXG4gICAgd2FpdEFmdGVyU3RhcnQ6IDEwMFxyXG4gIH1cclxuICB0aGlzLnByb2dyZXNzRXZlbnQgPSBuZXcgRXZlbnQoJ3Byb2dyZXNzJylcclxuICB0aGlzLmFjdGl2ZVRpbWVyID0gbnVsbFxyXG59XHJcblRyYWNrZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFbWl0dGVyLnByb3RvdHlwZSlcclxuLy8gQ2FsbGVkIHdoZW4gYW4gZWxlbWVudCBpcyBmaW5pc2hlZFxyXG5UcmFja2VyLnByb3RvdHlwZS5oYW5kbGVFbGVtZW50ID0gZnVuY3Rpb24gKCkge1xyXG4gIGlmICh0aGlzLnRvdGFsID09IDAgfHwgdGhpcy5kb25lID09IHRoaXMudG90YWwpIHJldHVyblxyXG5cclxuICB0aGlzLmRvbmUrK1xyXG4gIHRoaXMuZGlzcGF0Y2hFdmVudCh0aGlzLnByb2dyZXNzRXZlbnQpXHJcbn1cclxuVHJhY2tlci5wcm90b3R5cGUuZ2V0UHJvZ3Jlc3MgPSBmdW5jdGlvbiAoKSB7XHJcbiAgaWYgKHRoaXMudG90YWwgPT09IDApIHtcclxuICAgIGlmICh0aGlzLndhaXRpbmcpIHJldHVybiAwXHJcbiAgICBlbHNlIHJldHVybiAxMDBcclxuICB9XHJcbiAgcmV0dXJuIHRoaXMuZG9uZSAvIHRoaXMudG90YWwgKiAxMDBcclxufVxyXG4vLyAoUmUpU3RhcnQgdGhlIHRyYWNrZXIuIFNldHMgdGhlIHRhc2tzIHRvdGFsIGFuZCBkb25lIHRvIDBcclxuLy8gaWYgcmVzZXQgaXMgdHJ1ZS4gT3RoZXJ3aXNlIGRvZXMgbm90aGluZyBieSBkZWFmdWx0LlxyXG5UcmFja2VyLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uIChyZXNldCA9IGZhbHNlKSB7XHJcbiAgaWYgKHJlc2V0KSB7XHJcbiAgICB0aGlzLnRvdGFsID0gMFxyXG4gICAgdGhpcy5kb25lID0gMFxyXG4gIH1cclxuXHJcbiAgLy8gSWYgYSB0aW1lciBpcyBhbHJlYWR5IGdvaW5nIGNsZWFyIGl0XHJcbiAgaWYgKHRoaXMuYWN0aXZlVGltZXIgIT09IG51bGwpIGNsZWFyVGltZW91dCh0aGlzLmFjdGl2ZVRpbWVyKVxyXG5cclxuICB0aGlzLndhaXRpbmcgPSB0cnVlXHJcbiAgdGhpcy5hY3RpdmVUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgdGhpcy53YWl0aW5nID0gZmFsc2VcclxuICAgIGlmICh0aGlzLnNlYXJjaCkgdGhpcy5zZWFyY2goKVxyXG4gICAgaWYgKHRoaXMudG90YWwgPT0gMCkgdGhpcy5kaXNwYXRjaEV2ZW50KHRoaXMucHJvZ3Jlc3NFdmVudClcclxuICAgIHRoaXMuYWN0aXZlVGltZXIgPSBudWxsXHJcbiAgfSwgdGhpcy5vcHRpb25zLndhaXRBZnRlclN0YXJ0KVxyXG59XHJcblxyXG4vLyBmdW5jdGlvbiBUcmFja2VyKCkge1xyXG4vLyAgIEVtaXR0ZXIuY2FsbCh0aGlzKVxyXG4vL1xyXG4vLyAgIC8vIFByb3Blcmllc1xyXG4vLyAgIHRoaXMudG90YWwgPSAwXHJcbi8vICAgdGhpcy5kb25lID0gMFxyXG4vLyAgIHRoaXMud2VpZ2h0ID0gMVxyXG4vLyAgIHRoaXMud2FpdGluZyA9IGZhbHNlXHJcbi8vXHJcbi8vICAgdGhpcy5vcHRpb25zID0ge1xyXG4vLyAgICAgd2FpdEFmdGVyU3RhcnQ6IDEwMFxyXG4vLyAgIH1cclxuLy9cclxuLy8gICAvLyBFdmVudHNcclxuLy8gICB2YXIgcHJvZ3Jlc3NFdmVudCA9IG5ldyBFdmVudCgncHJvZ3Jlc3MnKVxyXG4vL1xyXG4vLyAgIC8vIENhbGxlZCB3aGVuIGFuIGVsZW1lbnQgaXMgZmluaXNoZWRcclxuLy8gICB0aGlzLmhhbmRsZUVsZW1lbnQgPSAoKSA9PiB7XHJcbi8vICAgICBpZiAodGhpcy50b3RhbCA9PSAwIHx8IHRoaXMuZG9uZSA9PSB0aGlzLnRvdGFsKSByZXR1cm5cclxuLy9cclxuLy8gICAgIHRoaXMuZG9uZSsrXHJcbi8vICAgICB0aGlzLmRpc3BhdGNoRXZlbnQocHJvZ3Jlc3NFdmVudClcclxuLy8gICB9XHJcbi8vXHJcbi8vICAgLy8gUmV0dXJucyB0aGUgY3VycmVudCBwcm9ncmVzc1xyXG4vLyAgIHRoaXMuZ2V0UHJvZ3Jlc3MgPSAoKSA9PiB7XHJcbi8vICAgICBpZiAodGhpcy50b3RhbCA9PT0gMCkge1xyXG4vLyAgICAgICBpZiAodGhpcy53YWl0aW5nKSByZXR1cm4gMFxyXG4vLyAgICAgICBlbHNlIHJldHVybiAxMDBcclxuLy8gICAgIH1cclxuLy8gICAgIHJldHVybiB0aGlzLmRvbmUgLyB0aGlzLnRvdGFsICogMTAwXHJcbi8vICAgfVxyXG4vL1xyXG4vLyAgIC8vIFRoZSBhY3RpdmUgd2FpdCB0aW1lci4gT25seSBvbmUgY2FuIHJ1biBhdCBhIHRpbWVcclxuLy8gICB2YXIgYWN0aXZlVGltZXIgPSBudWxsXHJcbi8vICAgLy8gKFJlKVN0YXJ0IHRoZSB0cmFja2VyLiBTZXRzIHRoZSB0YXNrcyB0b3RhbCBhbmQgZG9uZSB0byAwXHJcbi8vICAgLy8gaWYgcmVzZXQgaXMgdHJ1ZS4gT3RoZXJ3aXNlIGRvZXMgbm90aGluZyBieSBkZWFmdWx0LlxyXG4vLyAgIHRoaXMuc3RhcnQgPSAocmVzZXQgPSB0cnVlKSA9PiB7XHJcbi8vICAgICBpZiAocmVzZXQpIHtcclxuLy8gICAgICAgdGhpcy50b3RhbCA9IDBcclxuLy8gICAgICAgdGhpcy5kb25lID0gMFxyXG4vLyAgICAgfVxyXG4vL1xyXG4vLyAgICAgLy8gSWYgYSB0aW1lciBpcyBhbHJlYWR5IGdvaW5nIGNsZWFyIGl0XHJcbi8vICAgICBpZiAoYWN0aXZlVGltZXIgIT09IG51bGwpIGNsZWFyVGltZW91dChhY3RpdmVUaW1lcilcclxuLy9cclxuLy8gICAgIHRoaXMud2FpdGluZyA9IHRydWVcclxuLy8gICAgIGFjdGl2ZVRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbi8vICAgICAgIHRoaXMud2FpdGluZyA9IGZhbHNlXHJcbi8vICAgICAgIGlmICh0aGlzLnNlYXJjaCkgdGhpcy5zZWFyY2goKVxyXG4vLyAgICAgICBpZiAodGhpcy50b3RhbCA9PSAwKSB0aGlzLmRpc3BhdGNoRXZlbnQocHJvZ3Jlc3NFdmVudClcclxuLy8gICAgICAgYWN0aXZlVGltZXIgPSBudWxsXHJcbi8vICAgICB9LCB0aGlzLm9wdGlvbnMud2FpdEFmdGVyU3RhcnQpO1xyXG4vLyAgIH1cclxuLy8gfVxyXG5cclxuLy8gVFJBQ0tFUlNcclxuLy8gIEFKQVhcclxuLy8gIFhIUiAtIFRyYWNrcyBYTUxIdHRwUmVxdWVzdHNcclxuZnVuY3Rpb24gWEhSVHJhY2tlcigpIHtcclxuICBUcmFja2VyLmNhbGwodGhpcylcclxuXHJcbiAgdmFyIF90aGlzID0gdGhpc1xyXG4gIHZhciBvbGRYSFIgPSB3aW5kb3cuWE1MSHR0cFJlcXVlc3RcclxuICB3aW5kb3cuWE1MSHR0cFJlcXVlc3QgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgeGhyID0gbmV3IG9sZFhIUigpXHJcblxyXG4gICAgaW5qZWN0TWV0aG9kKHhociwgJ3NlbmQnLCAoKSA9PiBfdGhpcy50b3RhbCsrKVxyXG5cclxuICAgIHhoci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZSA9PiBfdGhpcy5oYW5kbGVFbGVtZW50KCkpXHJcbiAgICB4aHIuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCBlID0+IF90aGlzLmhhbmRsZUVsZW1lbnQoKSlcclxuXHJcbiAgICByZXR1cm4geGhyXHJcbiAgfVxyXG59XHJcblhIUlRyYWNrZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShUcmFja2VyLnByb3RvdHlwZSlcclxuXHJcbi8vICBGZXRjaCAtIFRyYWNrcyBmZXRjaCByZXF1ZXN0c1xyXG5mdW5jdGlvbiBGZXRjaFRyYWNrZXIoKSB7XHJcbiAgVHJhY2tlci5jYWxsKHRoaXMpXHJcblxyXG4gIGluamVjdE1ldGhvZCh3aW5kb3csICdmZXRjaCcsIGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMudG90YWwrK1xyXG4gIH0sIHRoaXMpXHJcbiAgLmNhbGxiYWNrKGZ1bmN0aW9uIChyZXQpIHtcclxuICAgIHJldHVybiByZXQudGhlbihyZXMgPT4ge1xyXG4gICAgICB0aGlzLmhhbmRsZUVsZW1lbnQoKVxyXG4gICAgICByZXR1cm4gcmVzXHJcbiAgICB9KVxyXG4gIH0pXHJcbn1cclxuRmV0Y2hUcmFja2VyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoVHJhY2tlci5wcm90b3R5cGUpXHJcblxyXG4vLyBET00gVHJhY2tpbmcgLSBUcmFja3MgRE9NIGVsZW1lbnRzXHJcbmZ1bmN0aW9uIERvY3VtZW50VHJhY2tlcigpIHtcclxuICBUcmFja2VyLmNhbGwodGhpcylcclxuXHJcbiAgdGhpcy50cmFja2VkRWxlbWVudHMgPSBbXVxyXG5cclxuICAvLyBMaXN0IG9mIGVsZW1lbnQgc2VsZWN0b3IgZnVuY3Rpb25zXHJcbiAgdGhpcy5lbGVtZW50cyA9IFtcclxuICAgIC8vIEltYWdlc1xyXG4gICAgKCkgPT4ge1xyXG4gICAgICB0b0FycmF5KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2ltZycpKVxyXG4gICAgICAgIC5mb3JFYWNoKGUgPT4ge1xyXG4gICAgICAgICAgaWYgKGUuY29tcGxldGUgfHwgdGhpcy50cmFja2VkRWxlbWVudHMuaW5jbHVkZXMoZSkpIHJldHVyblxyXG5cclxuICAgICAgICAgIHRoaXMudG90YWwrK1xyXG4gICAgICAgICAgZS5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgKCkgPT4gdGhpcy5oYW5kbGVFbGVtZW50KCkpXHJcbiAgICAgICAgICBlLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgKCkgPT4gdGhpcy5oYW5kbGVFbGVtZW50KCkpXHJcblxyXG4gICAgICAgICAgdGhpcy50cmFja2VkRWxlbWVudHMucHVzaChlKVxyXG4gICAgICAgIH0pXHJcbiAgICB9LFxyXG4gICAgLy8gTWVkaWFcclxuICAgICgpID0+IHtcclxuICAgICAgdG9BcnJheShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdhdWRpbycpKVxyXG4gICAgICAgIC5jb25jYXQodG9BcnJheShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCd2aWRlbycpKSlcclxuICAgICAgICAuZm9yRWFjaChlbCA9PiB7XHJcbiAgICAgICAgICBpZiAoZWwucmVhZHlTdGF0ZSA8IDIgfHwgdGhpcy50cmFja2VkRWxlbWVudHMuaW5jbHVkZXMoZSkpIHJldHVyblxyXG5cclxuICAgICAgICAgIHRoaXMudG90YWwrK1xyXG4gICAgICAgICAgaWYgKGVsLnByZWxvYWQgPT0gJ2F1dG8nIHx8IGVsLmF1dG9wbGF5KSB7XHJcbiAgICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NhbnBsYXknLCAoKSA9PiB0aGlzLmhhbmRsZUVsZW1lbnQoKSlcclxuICAgICAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCAoKSA9PiB0aGlzLmhhbmRsZUVsZW1lbnQoKSlcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlRWxlbWVudCgpXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdGhpcy50cmFja2VkRWxlbWVudHMucHVzaChlKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgXVxyXG5cclxuICBkb2N1bWVudC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBldiA9PiB7XHJcbiAgICAvLyBXaGVuIHRoZSBET00gbG9hZGVkIHN0YXJ0XHJcbiAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PSAnaW50ZXJhY3RpdmUnKSB7XHJcbiAgICAgIHRoaXMuc2VhcmNoKClcclxuICAgICAgLy8gKzEgRm9yIHRoZSByZXN0IG9mIHRoZSBkb2N1bWVudCB0aGF0IG1pZ2h0IG5lZWQgbG9hZGluZ1xyXG4gICAgICB0aGlzLnRvdGFsKytcclxuICAgIH1cclxuICAgIC8vIFdoZW4gdGhlIHdob2xlIGRvY3VtZW50IGxvYWRlZFxyXG4gICAgZWxzZSBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PSAnY29tcGxldGUnKVxyXG4gICAgICB0aGlzLmhhbmRsZUVsZW1lbnQoKVxyXG4gIH1cclxufVxyXG5Eb2N1bWVudFRyYWNrZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShUcmFja2VyLnByb3RvdHlwZSlcclxuRG9jdW1lbnRUcmFja2VyLnByb3RvdHlwZS5zZWFyY2ggPSBmdW5jdGlvbiAoKSB7XHJcbiAgdGhpcy5lbGVtZW50cy5mb3JFYWNoKGUgPT4gZSh0aGlzLmhhbmRsZUVsZW1lbnQpKVxyXG59XHJcblxyXG4vLyBmdW5jdGlvbiBEb2N1bWVudFRyYWNrZXIoKSB7XHJcbi8vICAgVHJhY2tlci5jYWxsKHRoaXMpXHJcbi8vXHJcbi8vICAgdmFyIHRyYWNrZWRFbGVtZW50cyA9IFtdXHJcbi8vXHJcbi8vICAgLy8gTGlzdCBvZiBlbGVtZW50IHNlbGVjdG9yIGZ1bmN0aW9uc1xyXG4vLyAgIHZhciBlbGVtZW50cyA9IFtcclxuLy8gICAgIC8vIEltYWdlc1xyXG4vLyAgICAgKGhhbmRsZUVsZW1lbnQpID0+IHtcclxuLy8gICAgICAgdG9BcnJheShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdpbWcnKSlcclxuLy8gICAgICAgICAuZm9yRWFjaChlID0+IHtcclxuLy8gICAgICAgICAgIGlmIChlLmNvbXBsZXRlIHx8IHRyYWNrZWRFbGVtZW50cy5pbmNsdWRlcyhlKSkgcmV0dXJuXHJcbi8vXHJcbi8vICAgICAgICAgICB0aGlzLnRvdGFsKytcclxuLy8gICAgICAgICAgIGUuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGhhbmRsZUVsZW1lbnQpXHJcbi8vICAgICAgICAgICBlLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgaGFuZGxlRWxlbWVudClcclxuLy9cclxuLy8gICAgICAgICAgIHRyYWNrZWRFbGVtZW50cy5wdXNoKGUpXHJcbi8vICAgICAgICAgfSlcclxuLy8gICAgIH0sXHJcbi8vICAgICAvLyBNZWRpYVxyXG4vLyAgICAgKGhhbmRsZUVsZW1lbnQpID0+IHtcclxuLy8gICAgICAgdG9BcnJheShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdhdWRpbycpKVxyXG4vLyAgICAgICAgIC5jb25jYXQodG9BcnJheShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCd2aWRlbycpKSlcclxuLy8gICAgICAgICAuZm9yRWFjaChlbCA9PiB7XHJcbi8vICAgICAgICAgICBpZiAoZWwucmVhZHlTdGF0ZSA8IDIgfHwgdHJhY2tlZEVsZW1lbnRzLmluY2x1ZGVzKGUpKSByZXR1cm5cclxuLy9cclxuLy8gICAgICAgICAgIHRoaXMudG90YWwrK1xyXG4vLyAgICAgICAgICAgaWYgKGVsLnByZWxvYWQgPT0gJ2F1dG8nIHx8IGVsLmF1dG9wbGF5KSB7XHJcbi8vICAgICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NhbnBsYXknLCBoYW5kbGVFbGVtZW50KVxyXG4vLyAgICAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIGhhbmRsZUVsZW1lbnQpXHJcbi8vICAgICAgICAgICB9IGVsc2Uge1xyXG4vLyAgICAgICAgICAgICBoYW5kbGVFbGVtZW50KClcclxuLy8gICAgICAgICAgIH1cclxuLy9cclxuLy8gICAgICAgICAgIHRyYWNrZWRFbGVtZW50cy5wdXNoKGUpXHJcbi8vICAgICAgICAgfSlcclxuLy8gICAgIH1cclxuLy8gICBdXHJcbi8vXHJcbi8vICAgLy8gT24gc3RhcnQgbG9vayBmb3IgdGhlIGVsZW1lbnRzXHJcbi8vICAgdGhpcy5zZWFyY2ggPSAoKSA9PiB7XHJcbi8vICAgICBlbGVtZW50cy5mb3JFYWNoKGUgPT4gZSh0aGlzLmhhbmRsZUVsZW1lbnQpKVxyXG4vLyAgIH1cclxuLy9cclxuLy8gICBkb2N1bWVudC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBldiA9PiB7XHJcbi8vICAgICAvLyBXaGVuIHRoZSBET00gbG9hZGVkIHN0YXJ0XHJcbi8vICAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PSAnaW50ZXJhY3RpdmUnKSB7XHJcbi8vICAgICAgIHRoaXMuc2VhcmNoKClcclxuLy8gICAgICAgLy8gKzEgRm9yIHRoZSByZXN0IG9mIHRoZSBkb2N1bWVudCB0aGF0IG1pZ2h0IG5lZWQgbG9hZGluZ1xyXG4vLyAgICAgICB0aGlzLnRvdGFsKytcclxuLy8gICAgIH1cclxuLy8gICAgIC8vIFdoZW4gdGhlIHdob2xlIGRvY3VtZW50IGxvYWRlZFxyXG4vLyAgICAgZWxzZSBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PSAnY29tcGxldGUnKVxyXG4vLyAgICAgICB0aGlzLmhhbmRsZUVsZW1lbnQoKVxyXG4vLyAgIH1cclxuLy8gfVxyXG5cclxuLy8gVGhlIG1haW4gdGhpbmdcclxuZnVuY3Rpb24gQXV0b1Byb2dyZXNzKCkge1xyXG4gIEVtaXR0ZXIuY2FsbCh0aGlzKVxyXG5cclxuICB0aGlzLm9wdGlvbnMgPSB7fVxyXG4gIHRoaXMuZGVmYXVsdE9wdGlvbnMgPSB7XHJcbiAgICByZXN0YXJ0T25Qb3BzdGF0ZTogdHJ1ZSxcclxuICAgIGZhbGxiYWNrSGFzaENoYW5nZTogdHJ1ZSxcclxuICAgIHJlc3RhcnRDb29sZG93bjogMTAwMFxyXG4gIH1cclxuXHJcbiAgdGhpcy50b3RhbFByb2dyZXNzID0gMFxyXG4gIHRoaXMudHJhY2tlcnMgPSBbXVxyXG5cclxuICB0aGlzLmNhblJlc3RhcnQgPSB0cnVlXHJcbiAgdGhpcy5yZXN0YXJ0Q29vbGRvd24gPSAxMDAwXHJcblxyXG4gIHRoaXMuZXZlbnRzID0ge1xyXG4gICAgcHJvZ3Jlc3M6IG5ldyBFdmVudCgncHJvZ3Jlc3MnKSxcclxuICAgIGZpbmlzaGVkOiBuZXcgRXZlbnQoJ2ZpbmlzaGVkJylcclxuICB9XHJcblxyXG4gIC8vIENyZWF0ZSBhbGwgdGhlIHRyYWNrZXJzXHJcbiAgdGhpcy5hZGRUcmFja2VyKFhIUlRyYWNrZXIpXHJcbiAgaWYgKHdpbmRvdy5mZXRjaCAmJiB0eXBlb2Ygd2luZG93LmZldGNoID09ICdmdW5jdGlvbicpXHJcbiAgICB0aGlzLmFkZFRyYWNrZXIoRmV0Y2hUcmFja2VyKVxyXG4gIHRoaXMuYWRkVHJhY2tlcihEb2N1bWVudFRyYWNrZXIpXHJcblxyXG4gIHRoaXMuc2V0T3B0aW9ucyh0aGlzLmRlZmF1bHRPcHRpb25zKVxyXG59XHJcbkF1dG9Qcm9ncmVzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFRyYWNrZXIucHJvdG90eXBlKVxyXG5cclxuQXV0b1Byb2dyZXNzLnByb3RvdHlwZS51cGRhdGVQcm9ncmVzcyA9IGZ1bmN0aW9uICgpIHtcclxuICBpZiAodGhpcy50b3RhbFByb2dyZXNzID09IDEwMCkgcmV0dXJuXHJcblxyXG4gIHRoaXMudG90YWxQcm9ncmVzcyA9IGNhbGNUb3RhbFBlcmNlbnQodGhpcy50cmFja2VycylcclxuICB0aGlzLmRpc3BhdGNoRXZlbnQodGhpcy5ldmVudHMucHJvZ3Jlc3MpXHJcbiAgaWYgKHRoaXMudG90YWxQcm9ncmVzcyA9PSAxMDApIHtcclxuICAgIHRoaXMuZGlzcGF0Y2hFdmVudCh0aGlzLmV2ZW50cy5maW5pc2hlZClcclxuICB9XHJcbn1cclxuQXV0b1Byb2dyZXNzLnByb3RvdHlwZS5hZGRUcmFja2VyID0gZnVuY3Rpb24gKHRyYWNrZXIpIHtcclxuICB2YXIgdCA9IG5ldyB0cmFja2VyKClcclxuICB0LnN0YXJ0KGZhbHNlKVxyXG5cclxuICB0aGlzLnRyYWNrZXJzLnB1c2godClcclxuICB0aGlzLnVwZGF0ZVByb2dyZXNzKClcclxuXHJcbiAgdC5hZGRFdmVudExpc3RlbmVyKCdwcm9ncmVzcycsICgpID0+IHRoaXMudXBkYXRlUHJvZ3Jlc3MoKSlcclxufVxyXG5BdXRvUHJvZ3Jlc3MucHJvdG90eXBlLnJlc3RhcnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgaWYgKHRoaXMuY2FuUmVzdGFydCkge1xyXG4gICAgdGhpcy50b3RhbFByb2dyZXNzID0gMFxyXG4gICAgdGhpcy50cmFja2Vycy5mb3JFYWNoKGUgPT4gZS5zdGFydCh0cnVlKSlcclxuICAgIHRoaXMudXBkYXRlUHJvZ3Jlc3MoKVxyXG5cclxuICAgIGlmICh0aGlzLnJlc3RhcnRDb29sZG93biAhPSAwKSB7XHJcbiAgICAgIHRoaXMuY2FuUmVzdGFydCA9IGZhbHNlXHJcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuY2FuUmVzdGFydCA9IHRydWVcclxuICAgICAgfSwgdGhpcy5yZXN0YXJ0Q29vbGRvd24pXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbkF1dG9Qcm9ncmVzcy5wcm90b3R5cGUuZ2V0UHJvZ3Jlc3MgPSBmdW5jdGlvbiAoKSB7XHJcbiAgcmV0dXJuIHRoaXMudG90YWxQcm9ncmVzc1xyXG59XHJcbkF1dG9Qcm9ncmVzcy5wcm90b3R5cGUuc2V0TG9hZFRpbWVvdXQgPSBmdW5jdGlvbiAodGltZW91dCkge1xyXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgaWYgKHRoaXMudG90YWxQcm9ncmVzcyAhPSAxMDApIHtcclxuICAgICAgdGhpcy50b3RhbFByb2dyZXNzID0gMTAwXHJcbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCh0aGlzLmV2ZW50cy5wcm9ncmVzcylcclxuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KHRoaXMuZXZlbnRzLmZpbmlzaGVkKVxyXG4gICAgfVxyXG4gIH0sIHRpbWVvdXQpXHJcbn1cclxuQXV0b1Byb2dyZXNzLnByb3RvdHlwZS5zZXRPcHRpb24gPSBmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcclxuICBpZiAobmFtZSA9PSAncmVzdGFydENvb2xkb3duJyAmJiAhaXNOYU4odmFsdWUpICYmIHZhbHVlID4gMCkge1xyXG4gICAgdGhpcy5yZXN0YXJ0Q29vbGRvd24gPSB2YWx1ZVxyXG4gIH1cclxuICBlbHNlIGlmIChuYW1lID09ICdyZXN0YXJ0T25Qb3BzdGF0ZScgJiYgd2luZG93Lmhpc3RvcnkgJiYgdmFsdWUgIT09IHRoaXMub3B0aW9uc1tuYW1lXSkge1xyXG4gICAgdGhpcy5vcHRpb25zW25hbWVdID0gdmFsdWVcclxuICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICB2YXIgZm4gPSAoKSA9PiB7XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5yZXN0YXJ0T25Qb3BzdGF0ZSkgdGhpcy5yZXN0YXJ0KClcclxuICAgICAgfVxyXG5cclxuICAgICAgaW5qZWN0TWV0aG9kKHdpbmRvdy5oaXN0b3J5LCAncHVzaFN0YXRlJywgZm4sIHRoaXMpXHJcbiAgICAgIGluamVjdE1ldGhvZCh3aW5kb3cuaGlzdG9yeSwgJ3JlcGxhY2VTdGF0ZScsIGZuLCB0aGlzKVxyXG5cclxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3BvcHN0YXRlJywgKCkgPT4gdGhpcy5yZXN0YXJ0KCkpXHJcbiAgICB9XHJcbiAgICBlbHNlIHdpbmRvdy5vZmZFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsICgpID0+IHRoaXMucmVzdGFydCgpKVxyXG4gIH1cclxuICBlbHNlIGlmIChuYW1lID09ICdyZXN0YXJ0T25IYXNoQ2hhbmdlJyB8fCAoIXdpbmRvdy5oaXN0b3J5ICYmIG5hbWUgPT0gJ2ZhbGxiYWNrSGFzaENoYW5nZScpKSB7XHJcbiAgICBpZiAodmFsdWUgPT09IHRoaXMub3B0aW9uc1tuYW1lXSkgcmV0dXJuXHJcblxyXG4gICAgdGhpcy5vcHRpb25zW25hbWVdID0gdmFsdWVcclxuICAgIGlmICh2YWx1ZSkgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2hhc2hjaGFuZ2UnLCAoKSA9PiB0aGlzLnJlc3RhcnQoKSlcclxuICAgIGVsc2Ugd2luZG93Lm9mZkV2ZW50TGlzdGVuZXIoJ2hhc2hjaGFuZ2UnLCB0aGlzLnJlc3RhcnQpXHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgZm9yICh2YXIgdCBpbiB0aGlzLnRyYWNrZXJzKSB7XHJcbiAgICAgIGlmICh0aGlzLnRyYWNrZXJzW3RdLm9wdGlvbnMgJiYgdGhpcy50cmFja2Vyc1t0XS5vcHRpb25zW25hbWVdKVxyXG4gICAgICAgIHRoaXMudHJhY2tlcnNbdF0ub3B0aW9uc1tuYW1lXSA9IHZhbHVlXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbkF1dG9Qcm9ncmVzcy5wcm90b3R5cGUuc2V0T3B0aW9ucyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgZm9yICh2YXIgbyBpbiBvcHRpb25zKVxyXG4gICAgdGhpcy5zZXRPcHRpb24obywgb3B0aW9uc1tvXSlcclxufVxyXG5cclxuLy8gZnVuY3Rpb24gQXV0b1Byb2dyZXNzKCkge1xyXG4vLyAgIEVtaXR0ZXIuY2FsbCh0aGlzKVxyXG4vL1xyXG4vLyAgIHZhciBvcHRpb25zID0ge31cclxuLy8gICB2YXIgZGVmYXVsdE9wdGlvbnMgPSB7XHJcbi8vICAgICByZXN0YXJ0T25Qb3BzdGF0ZTogdHJ1ZSxcclxuLy8gICAgIGZhbGxiYWNrSGFzaENoYW5nZTogdHJ1ZSxcclxuLy8gICAgIHJlc3RhcnRDb29sZG93bjogMTAwMFxyXG4vLyAgIH1cclxuLy9cclxuLy8gICB2YXIgdG90YWxQcm9ncmVzcyA9IDBcclxuLy8gICB2YXIgdHJhY2tlcnMgPSBbXVxyXG4vL1xyXG4vLyAgIHZhciBldmVudHMgPSB7XHJcbi8vICAgICBwcm9ncmVzczogbmV3IEV2ZW50KCdwcm9ncmVzcycpLFxyXG4vLyAgICAgZmluaXNoZWQ6IG5ldyBFdmVudCgnZmluaXNoZWQnKVxyXG4vLyAgIH1cclxuLy9cclxuLy8gICAvLyBVcGRhdGUgdGhlIHByb2dyZXNzXHJcbi8vICAgdmFyIHVwZGF0ZVByb2dyZXNzID0gKCkgPT4ge1xyXG4vLyAgICAgaWYgKHRvdGFsUHJvZ3Jlc3MgPT0gMTAwKSByZXR1cm5cclxuLy9cclxuLy8gICAgIHRvdGFsUHJvZ3Jlc3MgPSBjYWxjVG90YWxQZXJjZW50KHRyYWNrZXJzKVxyXG4vLyAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KGV2ZW50cy5wcm9ncmVzcylcclxuLy8gICAgIGlmICh0b3RhbFByb2dyZXNzID09IDEwMCkge1xyXG4vLyAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoZXZlbnRzLmZpbmlzaGVkKVxyXG4vLyAgICAgfVxyXG4vLyAgIH1cclxuLy9cclxuLy8gICAvLyBBZGRzIGEgbmV3IHRyYWNrZXJcclxuLy8gICB2YXIgYWRkVHJhY2tlciA9ICh0cmFja2VyKSA9PiB7XHJcbi8vICAgICB2YXIgdCA9IG5ldyB0cmFja2VyKClcclxuLy8gICAgIHQuc3RhcnQoZmFsc2UpXHJcbi8vXHJcbi8vICAgICB0cmFja2Vycy5wdXNoKHQpXHJcbi8vICAgICB1cGRhdGVQcm9ncmVzcygpXHJcbi8vXHJcbi8vICAgICB0LmFkZEV2ZW50TGlzdGVuZXIoJ3Byb2dyZXNzJywgdXBkYXRlUHJvZ3Jlc3MpXHJcbi8vXHJcbi8vICAgICByZXR1cm4gdFxyXG4vLyAgIH1cclxuLy9cclxuLy8gICAvLyBDcmVhdGUgYWxsIHRoZSB0cmFja2Vyc1xyXG4vLyAgIGFkZFRyYWNrZXIoWEhSVHJhY2tlcilcclxuLy8gICBpZiAod2luZG93LmZldGNoICYmIHR5cGVvZiB3aW5kb3cuZmV0Y2ggPT0gJ2Z1bmN0aW9uJylcclxuLy8gICAgIGFkZFRyYWNrZXIoRmV0Y2hUcmFja2VyKVxyXG4vLyAgIGFkZFRyYWNrZXIoRG9jdW1lbnRUcmFja2VyKVxyXG4vL1xyXG4vLyAgIC8vIE1ha2Ugc3VyZSBpdCBkb2Vzbid0IHJlc2V0IHRvbyBtYW55IHRpbWVzIHRvbyBxdWlja2x5XHJcbi8vICAgdmFyIGNhblJlc3RhcnQgPSB0cnVlXHJcbi8vICAgdmFyIHJlc3RhcnRDb29sZG93biA9IDEwMDBcclxuLy8gICB0aGlzLnJlc3RhcnQgPSAoKSA9PiB7XHJcbi8vICAgICBpZiAoY2FuUmVzdGFydCkge1xyXG4vLyAgICAgICB0b3RhbFByb2dyZXNzID0gMFxyXG4vLyAgICAgICB0cmFja2Vycy5mb3JFYWNoKGUgPT4gZS5zdGFydCh0cnVlKSlcclxuLy8gICAgICAgdXBkYXRlUHJvZ3Jlc3MoKVxyXG4vL1xyXG4vLyAgICAgICBpZiAocmVzdGFydENvb2xkb3duICE9IDApIHtcclxuLy8gICAgICAgICBjYW5SZXN0YXJ0ID0gZmFsc2VcclxuLy8gICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuLy8gICAgICAgICAgIGNhblJlc3RhcnQgPSB0cnVlXHJcbi8vICAgICAgICAgfSwgcmVzdGFydENvb2xkb3duKVxyXG4vLyAgICAgICB9XHJcbi8vICAgICB9XHJcbi8vICAgfVxyXG4vL1xyXG4vLyAgIC8vIFB1YmxpYyBnZXR0ZXIgZm9yIHRoZSBwcm9ncmVzc1xyXG4vLyAgIHRoaXMuZ2V0UHJvZ3Jlc3MgPSBmdW5jdGlvbiAoKSB7XHJcbi8vICAgICByZXR1cm4gdG90YWxQcm9ncmVzc1xyXG4vLyAgIH1cclxuLy9cclxuLy8gICAvLyBTZXQgYSB0aW1lb3V0IGlmIHRoZSBwYWdlIGlzIGxvYWRpbmcgZm9yIHRvbyBsb25nXHJcbi8vICAgdGhpcy5zZXRMb2FkVGltZW91dCA9ICh0aW1lb3V0ID0gMzAwMCkgPT4ge1xyXG4vLyAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbi8vICAgICAgIGlmICh0b3RhbFByb2dyZXNzICE9IDEwMCkge1xyXG4vLyAgICAgICAgIHRvdGFsUHJvZ3Jlc3MgPSAxMDBcclxuLy8gICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoZXZlbnRzLnByb2dyZXNzKVxyXG4vLyAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChldmVudHMuZmluaXNoZWQpXHJcbi8vICAgICAgIH1cclxuLy8gICAgIH0sIHRpbWVvdXQpXHJcbi8vICAgfVxyXG4vL1xyXG4vLyAgIC8vIFNldCB0aGUgb3B0aW9uc1xyXG4vLyAgIC8vIERlY2lkZWQgdG8gZ28gd2l0aCB0aGlzIGluc3RlYWQgb2YgaGF2aW5nIGEgY29uc3RydWN0b3JcclxuLy8gICAvLyBhbmQgb3B0aW9ucyBhcyBwYXJhbWV0ZXJzLiBDYW4gZW5zdXJlIHNpbmdsZSBpbnN0YW5jZSB0aGlzIHdheVxyXG4vLyAgIHRoaXMuc2V0T3B0aW9uID0gKG5hbWUsIHZhbHVlKSA9PiB7XHJcbi8vICAgICBpZiAobmFtZSA9PSAncmVzdGFydENvb2xkb3duJyAmJiAhaXNOYU4odmFsdWUpICYmIHZhbHVlID4gMCkge1xyXG4vLyAgICAgICByZXN0YXJ0Q29vbGRvd24gPSB2YWx1ZVxyXG4vLyAgICAgfVxyXG4vLyAgICAgZWxzZSBpZiAobmFtZSA9PSAncmVzdGFydE9uUG9wc3RhdGUnICYmIHdpbmRvdy5oaXN0b3J5ICYmIHZhbHVlICE9PSBvcHRpb25zW25hbWVdKSB7XHJcbi8vICAgICAgIG9wdGlvbnNbbmFtZV0gPSB2YWx1ZVxyXG4vLyAgICAgICBpZiAodmFsdWUpIHtcclxuLy8gICAgICAgICB2YXIgZm4gPSAoKSA9PiB7XHJcbi8vICAgICAgICAgICBpZiAob3B0aW9ucy5yZXN0YXJ0T25Qb3BzdGF0ZSkgdGhpcy5yZXN0YXJ0KClcclxuLy8gICAgICAgICB9XHJcbi8vXHJcbi8vICAgICAgICAgaW5qZWN0TWV0aG9kKHdpbmRvdy5oaXN0b3J5LCAncHVzaFN0YXRlJywgZm4sIHRoaXMpXHJcbi8vICAgICAgICAgaW5qZWN0TWV0aG9kKHdpbmRvdy5oaXN0b3J5LCAncmVwbGFjZVN0YXRlJywgZm4sIHRoaXMpXHJcbi8vXHJcbi8vICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3BvcHN0YXRlJywgdGhpcy5yZXN0YXJ0KVxyXG4vLyAgICAgICB9XHJcbi8vICAgICAgIGVsc2Ugd2luZG93Lm9mZkV2ZW50TGlzdGVuZXIoJ3BvcHN0YXRlJywgdGhpcy5yZXN0YXJ0KVxyXG4vLyAgICAgfVxyXG4vLyAgICAgZWxzZSBpZiAobmFtZSA9PSAncmVzdGFydE9uSGFzaENoYW5nZScgfHwgKCF3aW5kb3cuaGlzdG9yeSAmJiBuYW1lID09ICdmYWxsYmFja0hhc2hDaGFuZ2UnKSkge1xyXG4vLyAgICAgICBpZiAodmFsdWUgPT09IG9wdGlvbnNbbmFtZV0pIHJldHVyblxyXG4vL1xyXG4vLyAgICAgICBvcHRpb25zW25hbWVdID0gdmFsdWVcclxuLy8gICAgICAgaWYgKHZhbHVlKSB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsIHRoaXMucmVzdGFydClcclxuLy8gICAgICAgZWxzZSB3aW5kb3cub2ZmRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsIHRoaXMucmVzdGFydClcclxuLy8gICAgIH1cclxuLy8gICAgIGVsc2Uge1xyXG4vLyAgICAgICBmb3IgKHZhciB0IGluIHRoaXMudHJhY2tlcnMpIHtcclxuLy8gICAgICAgICBpZiAodGhpcy50cmFja2Vyc1t0XS5vcHRpb25zICYmIHRoaXMudHJhY2tlcnNbdF0ub3B0aW9uc1tuYW1lXSlcclxuLy8gICAgICAgICAgIHRoaXMudHJhY2tlcnNbdF0ub3B0aW9uc1tuYW1lXSA9IHZhbHVlXHJcbi8vICAgICAgIH1cclxuLy8gICAgIH1cclxuLy8gICB9XHJcbi8vXHJcbi8vICAgLy8gU2FtZSBhcyBzZXRPcHRpb24gZXhjZXB0IGNhbiBkbyBtdWx0aXBsZSBzZXR0aW5nIGF0IG9uY2VcclxuLy8gICB0aGlzLnNldE9wdGlvbnMgPSAob3B0aW9ucykgPT4ge1xyXG4vLyAgICAgZm9yICh2YXIgbyBpbiBvcHRpb25zKVxyXG4vLyAgICAgICB0aGlzLnNldE9wdGlvbihvLCBvcHRpb25zW29dKVxyXG4vLyAgIH1cclxuLy9cclxuLy8gICB0aGlzLnNldE9wdGlvbnMoZGVmYXVsdE9wdGlvbnMpXHJcbi8vIH1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IG5ldyBBdXRvUHJvZ3Jlc3MoKVxyXG4iXSwibmFtZXMiOlsiQXJyYXkiLCJwcm90b3R5cGUiLCJmb3JFYWNoIiwiY2FsbGJhY2siLCJUIiwiayIsIlR5cGVFcnJvciIsIk8iLCJPYmplY3QiLCJsZW4iLCJsZW5ndGgiLCJhcmd1bWVudHMiLCJrVmFsdWUiLCJjYWxsIiwid2luZG93IiwiQ3VzdG9tRXZlbnQiLCJFdmVudCIsImV2ZW50IiwicGFyYW1zIiwiYnViYmxlcyIsImNhbmNlbGFibGUiLCJkZXRhaWwiLCJ1bmRlZmluZWQiLCJldnQiLCJkb2N1bWVudCIsImNyZWF0ZUV2ZW50IiwiaW5pdEN1c3RvbUV2ZW50IiwiaW5jbHVkZXMiLCJkZWZpbmVQcm9wZXJ0eSIsInNlYXJjaEVsZW1lbnQiLCJmcm9tSW5kZXgiLCJvIiwibiIsIk1hdGgiLCJtYXgiLCJhYnMiLCJzYW1lVmFsdWVaZXJvIiwieCIsInkiLCJpc05hTiIsImNhbGNUb3RhbFBlcmNlbnQiLCJhcnIiLCJ3U3VtIiwic3VtIiwiZSIsInciLCJ3ZWlnaHQiLCJnZXRQcm9ncmVzcyIsInRvQXJyYXkiLCJsIiwic2xpY2UiLCJpbmplY3RNZXRob2QiLCJvYmoiLCJvbGRGbk5hbWUiLCJmbiIsImZuU2NvcGUiLCJjYWxsYmFja0Z1bmMiLCJyZXRPYmoiLCJvbGRGbiIsImFyZ3MiLCJhcHBseSIsInJldCIsInIiLCJFbWl0dGVyIiwiZXZlbnRUYXJnZXQiLCJjcmVhdGVEb2N1bWVudEZyYWdtZW50IiwiYWRkRXZlbnRMaXN0ZW5lciIsInR5cGUiLCJsaXN0ZW5lciIsInVzZUNhcHR1cmUiLCJ3YW50c1VudHJ1c3RlZCIsImRpc3BhdGNoRXZlbnQiLCJtIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsIlRyYWNrZXIiLCJ0b3RhbCIsImRvbmUiLCJ3YWl0aW5nIiwib3B0aW9ucyIsInByb2dyZXNzRXZlbnQiLCJhY3RpdmVUaW1lciIsImNyZWF0ZSIsImhhbmRsZUVsZW1lbnQiLCJzdGFydCIsInJlc2V0IiwiY2xlYXJUaW1lb3V0Iiwic2V0VGltZW91dCIsInNlYXJjaCIsIndhaXRBZnRlclN0YXJ0IiwiWEhSVHJhY2tlciIsIl90aGlzIiwib2xkWEhSIiwiWE1MSHR0cFJlcXVlc3QiLCJ4aHIiLCJGZXRjaFRyYWNrZXIiLCJ0aGVuIiwicmVzIiwiRG9jdW1lbnRUcmFja2VyIiwidHJhY2tlZEVsZW1lbnRzIiwiZWxlbWVudHMiLCJxdWVyeVNlbGVjdG9yQWxsIiwiY29tcGxldGUiLCJwdXNoIiwiY29uY2F0IiwiZWwiLCJyZWFkeVN0YXRlIiwicHJlbG9hZCIsImF1dG9wbGF5Iiwib25yZWFkeXN0YXRlY2hhbmdlIiwiQXV0b1Byb2dyZXNzIiwiZGVmYXVsdE9wdGlvbnMiLCJ0b3RhbFByb2dyZXNzIiwidHJhY2tlcnMiLCJjYW5SZXN0YXJ0IiwicmVzdGFydENvb2xkb3duIiwiZXZlbnRzIiwiYWRkVHJhY2tlciIsImZldGNoIiwic2V0T3B0aW9ucyIsInVwZGF0ZVByb2dyZXNzIiwicHJvZ3Jlc3MiLCJmaW5pc2hlZCIsInRyYWNrZXIiLCJ0IiwicmVzdGFydCIsInNldExvYWRUaW1lb3V0IiwidGltZW91dCIsInNldE9wdGlvbiIsIm5hbWUiLCJ2YWx1ZSIsImhpc3RvcnkiLCJyZXN0YXJ0T25Qb3BzdGF0ZSIsIm9mZkV2ZW50TGlzdGVuZXIiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7Ozs7QUFNQSxJQUFJLENBQUNBLE1BQU1DLFNBQU4sQ0FBZ0JDLE9BQXJCLEVBQThCOztRQUV0QkQsU0FBTixDQUFnQkMsT0FBaEIsR0FBMEIsVUFBU0MsUUFBVCxnQkFBZ0M7O1FBRXBEQyxDQUFKLEVBQU9DLENBQVA7O1FBRUksUUFBUSxJQUFaLEVBQWtCO1lBQ1YsSUFBSUMsU0FBSixDQUFjLDZCQUFkLENBQU47Ozs7O1FBS0VDLElBQUlDLE9BQU8sSUFBUCxDQUFSOzs7OztRQUtJQyxNQUFNRixFQUFFRyxNQUFGLEtBQWEsQ0FBdkI7Ozs7UUFJSSxPQUFPUCxRQUFQLEtB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
