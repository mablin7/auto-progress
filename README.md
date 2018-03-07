## **AutoProgress JS**

A JS module that automatically tracks the loading progress of your page.

**Features**
 - Automagically tracks loaded images, media elements, XHRs and fetches
 - Doesn't implement a visual progress bar, you can use whatever you want
 - Super lightweight (5kb minified, 2kb gzipped)
 - No runtime dependencies
 - Theoretically, runs on any browser (>=IE8), thanks to the wonders of Babel and Ctrl+C-Ctrl+V polyfills
 - Great for single page apps

## **Install**

**NPM**

    npm install auto-progress --save

Import it as soon as you can in your script

**Script Tag**
Include before any other script

    <script src="unpkg.com/auto-progress/dist/index.js" />

## Usage
AutoProgress starts immediately after import, and searches for trackable elements on tha page (images, HTML5 media elements, XHRs, fetches).
The module emits events to let you know if something happens. Use the `getProgress` method to get the current progress:

    AutoProgress.onprogress = function () {
		console.log('An element just loaded.');
		// When not using arrow functions or addEventListener this = AutoProgress
		console.log('Total progress: ', this.getProgress());
	};

	AutoProgress.onfinished = function () {
		console.log('Finished loading!');
	};


----------


Of course, it wouldn't be too useful if you could only track the progress once, when the page loads. That's why the progress can be restarted. Manual restart:

    AutoProgress.restart();
By default restart will be called automatically when

 - `pushState` or `replaceState` is called
 - `popstate` (back/forward button pressed) fires
 - If the history API is not supported the hash changes


----------

If it is possible that something might keep your page from loading, you can set up a timeout, which will finish tracking the progress after the given time:

    AutoProgress.setLoadTimeout(3000); // Miliseconds

----------


You can customize the behaviour of the module with the `setOption` and  `setOptions` methods
Avalaible options:

 - `restartOnPopstate`(bool) Enables/disables restarting on popstate or pushState/replaceState. Default: true
 - `fallbackHashChange` (bool) Enables/disables restarting on hash change when history is not supported. Default: true
 - `restartOnHashChange`(bool) Enables/disables always restarting on hash change. Default: false
 - `restartCooldown`(number) Defines how much time has to pass between two restarts .Default: 1000
 - `waitAfterStart`(number) Defines how much time does a tracker wait for elements to track. Default: 100


----------


**Under the hood**, AutoProgress after starting waits a set time for trackable objects to appear. (100ms by default). If it didn't find any elements (images, Ajax requests, etc.) that object type will be reported done. In the case of images and media elements they are only checked once after starting, so if it can't find any at that time, it will report them done until the next restart. XHRs and fetches however are constantly tracked, so if it finds at least one int the given time limit, new ones will be detected even after the time limit has expired.
## Compatibility
Only tested in Firefox 58; Chrome 64; IE 11; and Edge 41
## Possible Future Features

 - Trackable API for custom objects

## License
**MIT**
