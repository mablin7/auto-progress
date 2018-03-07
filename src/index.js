import './polyfills.js'
import { toArray, injectMethod, calcTotalPercent } from './utils.js'

// CLASS TEMPLATES

// EventTarget implementation
// Credit to naomik https://stackoverflow.com/a/24216547

function Emitter() {
  this.eventTarget = document.createDocumentFragment()
}

Emitter.prototype.addEventListener = function (type, listener, useCapture, wantsUntrusted) {
  return this.eventTarget.addEventListener(type, listener, useCapture, wantsUntrusted)
}

Emitter.prototype.dispatchEvent = function (event) {
  //Handle property style event handlers
  var m = 'on' + event.type
  if (this[m]) this[m](event)

  return this.eventTarget.dispatchEvent(event)
}

Emitter.prototype.removeEventListener = function (type, listener, useCapture) {
  return this.eventTarget.removeEventListener(type, listener, useCapture)
}

// All the basic functionality required for trackers
// Inherits Emitter
function Tracker() {
  Emitter.call(this)

  // Properies
  this.total = 0
  this.done = 0
  this.weight = 1
  this.waiting = false

  this.options = {
    waitAfterStart: 100
  }
  this.progressEvent = new Event('progress')
  this.activeTimer = null
}
Tracker.prototype = Object.create(Emitter.prototype)

// Called when an element is finished
Tracker.prototype.handleElement = function () {
  if (this.total == 0 || this.done == this.total) return

  this.done++
  this.dispatchEvent(this.progressEvent)
}

Tracker.prototype.getProgress = function () {
  if (this.total === 0) {
    if (this.waiting) return 0
    else return 100
  }
  return this.done / this.total * 100
}

// (Re)Start the tracker. Sets the tasks total and done to 0
// if reset is true. Otherwise does nothing by deafult.
Tracker.prototype.start = function (reset = false) {
  if (reset) {
    this.total = 0
    this.done = 0
  }

  // If a timer is already going clear it
  if (this.activeTimer !== null) clearTimeout(this.activeTimer)

  this.waiting = true
  this.activeTimer = setTimeout(() => {
    this.waiting = false
    if (this.search) this.search()
    if (this.total == 0) this.dispatchEvent(this.progressEvent)
    this.activeTimer = null
  }, this.options.waitAfterStart)
}

// TRACKERS
//  AJAX
//  XHR - Tracks XMLHttpRequests
function XHRTracker() {
  Tracker.call(this)

  var _this = this
  var oldXHR = window.XMLHttpRequest
  window.XMLHttpRequest = function () {
    var xhr = new oldXHR()

    injectMethod(xhr, 'send', () => _this.total++)

    xhr.addEventListener('load', e => _this.handleElement())
    xhr.addEventListener('error', e => _this.handleElement())

    return xhr
  }
}
XHRTracker.prototype = Object.create(Tracker.prototype)

//  Fetch - Tracks fetch requests
function FetchTracker() {
  Tracker.call(this)

  injectMethod(window, 'fetch', function () {
    this.total++
  }, this)
  .callback(function (ret) {
    return ret.then(res => {
      this.handleElement()
      return res
    })
  })
}
FetchTracker.prototype = Object.create(Tracker.prototype)

// DOM Tracking - Tracks DOM elements
function DocumentTracker() {
  Tracker.call(this)

  this.trackedElements = []

  // List of element selector functions
  this.elements = [
    // Images
    () => {
      var list = toArray(document.querySelectorAll('img'))
      for (var i in list) {
        var e = list[i]
        if (e.complete || this.trackedElements.includes(e)) return

        this.total++
        e.addEventListener('load', () => this.handleElement())
        e.addEventListener('error', () => this.handleElement())

        this.trackedElements.push(e)
      }
    },
    // Media
    () => {
      var list = toArray(document.querySelectorAll('audio'))
        .concat(toArray(document.querySelectorAll('video')))
      for (var i in list) {
        var el = list[i]
        if (el.readyState < 2 || this.trackedElements.includes(e)) return

        this.total++
        if (el.preload == 'auto' || el.autoplay) {
          el.addEventListener('canplay', () => this.handleElement())
          el.addEventListener('error', () => this.handleElement())
        } else {
          this.handleElement()
        }

        this.trackedElements.push(e)
      }
    }
  ]

  document.onreadystatechange = ev => {
    // When the DOM loaded start
    if (document.readyState == 'interactive') {
      this.search()
      // +1 For the rest of the document that might need loading
      this.total++
    }
    // When the whole document loaded
    else if (document.readyState == 'complete')
      this.handleElement()
  }
}
DocumentTracker.prototype = Object.create(Tracker.prototype)

DocumentTracker.prototype.search = function () {
  for (var i in this.elements) this.elements[i]()
}

// The main thing
function AutoProgress() {
  Emitter.call(this)

  this.options = {}
  this.defaultOptions = {
    restartOnPopstate: true,
    fallbackHashChange: true,
    restartCooldown: 1000
  }

  this.totalProgress = 0
  this.trackers = []

  this.canRestart = true
  this.restartCooldown = 1000

  this.events = {
    progress: new Event('progress'),
    finished: new Event('finished')
  }

  // Create all the trackers
  this.addTracker(XHRTracker)
  if (window.fetch && typeof window.fetch == 'function')
    this.addTracker(FetchTracker)
  this.addTracker(DocumentTracker)

  this.setOptions(this.defaultOptions)
}
AutoProgress.prototype = Object.create(Tracker.prototype)

AutoProgress.prototype.updateProgress = function () {
  if (this.totalProgress == 100) return

  this.totalProgress = calcTotalPercent(this.trackers)
  this.dispatchEvent(this.events.progress)
  if (this.totalProgress == 100) {
    this.dispatchEvent(this.events.finished)
  }
}

AutoProgress.prototype.addTracker = function (tracker) {
  var t = new tracker()
  t.start(false)

  this.trackers.push(t)
  this.updateProgress()

  t.addEventListener('progress', () => this.updateProgress())
}

AutoProgress.prototype.restart = function () {
  if (this.canRestart) {
    this.totalProgress = 0
    for (var i in this.trackers)
      this.trackers[i].start(true)
    this.updateProgress()

    if (this.restartCooldown != 0) {
      this.canRestart = false
      setTimeout(() => {
        this.canRestart = true
      }, this.restartCooldown)
    }
  }
}

AutoProgress.prototype.getProgress = function () {
  return this.totalProgress
}
AutoProgress.prototype.setLoadTimeout = function (timeout) {
  setTimeout(() => {
    if (this.totalProgress != 100) {
      this.totalProgress = 100
      this.dispatchEvent(this.events.progress)
      this.dispatchEvent(this.events.finished)
    }
  }, timeout)
}

AutoProgress.prototype.setOption = function (name, value) {
  if (name == 'restartCooldown' && !isNaN(value) && value > 0) {
    this.restartCooldown = value
  }
  else if (name == 'restartOnPopstate' && window.history && value !== this.options[name]) {
    this.options[name] = value
    if (value) {
      var fn = () => {
        if (this.options.restartOnPopstate) this.restart()
      }

      injectMethod(window.history, 'pushState', fn, this)
      injectMethod(window.history, 'replaceState', fn, this)

      window.addEventListener('popstate', () => this.restart())
    }
    else window.offEventListener('popstate', () => this.restart())
  }
  else if (name == 'restartOnHashChange' || (!window.history && name == 'fallbackHashChange')) {
    if (value === this.options[name]) return

    this.options[name] = value
    if (value) window.addEventListener('hashchange', () => this.restart())
    else window.offEventListener('hashchange', this.restart)
  }
  else {
    for (var t in this.trackers) {
      if (this.trackers[t].options && this.trackers[t].options[name])
        this.trackers[t].options[name] = value
    }
  }
}

AutoProgress.prototype.setOptions = function (options) {
  for (var o in options)
    this.setOption(o, options[o])
}

export default new AutoProgress()
