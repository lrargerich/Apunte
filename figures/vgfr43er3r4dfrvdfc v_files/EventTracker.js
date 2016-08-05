var NYTD = window.NYTD || {};

//Save the EventTracker instances before being overwritten
if (NYTD.EventTracker && NYTD.EventTracker.getAllInstances) {
    NYTD.PreLoadEventTracker = NYTD.EventTracker;
}

NYTD.EventTracker = (function () {
    'use strict';
    var etHost, clazz;
    var lastEventTime = 0;
    var nextCallbackNum = 0;
    var getMetaTag = function (n,d) {
        var i;
        var m = document.getElementsByTagName('meta');
        for (i = m.length - 1;i >= 0;i--) {
            if (m[i].name === n) {
                return m[i].content;
            }
        }
        return d || '';
    };
    var sourceApp = getMetaTag('sourceApp', 'nyt4'); // default unless ...
    
    etHost = (function () {
       var
         etHost = "et.nytimes.com",
         hosts = ["et.stg.use1.nytimes.com", "et.dev.use1.nytimes.com"];

        if (NYTD !== undefined) {
            // Use the NYTD.env, if available.
            if (NYTD.env !== undefined) {
                if (NYTD.env === "stg" || NYTD.env === "staging") {
                    etHost = hosts[0];
                } else if (NYTD.env === "dev" || NYTD.env === "development") {
                    etHost = hosts[1];
                }
            } else if (NYTD.Host !== undefined && typeof NYTD.Host.getEnv === "function") {
                // Use NYTD.Host.getEnv() function if available.
                if (NYTD.Host.getEnv() === "stg" || NYTD.Host.getEnv() === "staging") {
                   etHost = hosts[0];
                } else if (NYTD.Host.getEnv() === "dev" || NYTD.Host.getEnv() === "development") {
                   etHost = hosts[1];
                }
            } else {
                // Last resource, checks the hostname.
                if (/\.stg\.nytimes\.com$/.test(location.hostname) === true) {
                   etHost = hosts[0];
                } else if (/\.dev\.nytimes\.com$/.test(location.hostname) === true) {
                   etHost = hosts[1];
                }
            }
        }

      // Return the event tracker hostname.
      return etHost;
    })();  

    var buildUrl = function (url, params, useFieldOverwrites) {
        var key, value, qs = '', overwrites = {};

        if(useFieldOverwrites === true && window.NYTD &&
                window.NYTD.hasOwnProperty('AnalyticsOverrides') === true && 
                typeof window.NYTD.AnalyticsOverrides === 'object') {
            overwrites = copyObject(window.NYTD.AnalyticsOverrides);
        }
        
        for (key in params) { 
            if (params.hasOwnProperty(key) === true) {
                value = params[key];

                if(overwrites.hasOwnProperty(key) === true) {
                    value = overwrites[key];
                }

                qs += (qs ? '&' : '') + key + '=' + encodeURIComponent(value);
            }    
        }

        if (qs.length > 0) {
            return url + '?' + qs;
        } else {
            return url;
        }
    };

    var copyObject = function (obj) {
        var key, objCopy;
        if (arguments.length === 2) {
            objCopy = obj;
            obj = arguments[1];
        }
        else {
            objCopy = {};
        }
        for (key in obj) if (obj.hasOwnProperty(key)) {
            objCopy[key] = obj[key];
        }
        return objCopy;
    };

    var stringifyJson = JSON ? JSON.stringify : function (obj) {
        var t = typeof (obj);
        if (t != "object" || obj === null) {
            if (t == "string") obj = '"'+obj+'"';
            return String(obj);
        } else {
            // recurse array or object
            var n, v, json = [], arr = (obj && obj.constructor == Array);
            for (n in obj) if (obj.hasOwnProperty(n)) {
                v = obj[n]; t = typeof(v);
                if (t == "string") v = '"'+v+'"';
                else if (t == "object" && v !== null) v = stringifyJson(v);
                json.push((arr ? "" : '"' + n + '":') + String(v));
            }
            return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
        }
    };

    var extractPageMetaTags = function (obj) {
        var name, content, i;
        var tags = document.getElementsByTagName('meta');
        var whiteListObj = {PT:"", CG:"", SCG:"", byl:"", tom:"", hdl:"", ptime:"", cre:"", articleid:"", channels:"", CN:"", CT:""};
        var errorPageMap = { PST: "Error Page", errorpage: "true" };
        obj = obj || {};
        obj.sourceApp = sourceApp;
        for (i = 0; i < tags.length; i += 1) {
            name = tags[i].getAttribute('name');
            content = tags[i].getAttribute('content');
            if (typeof name === 'string' && typeof content === 'string') {
                if (whiteListObj.hasOwnProperty(name)) {
                    whiteListObj[name] = content;
                }
                if (errorPageMap[name] === content) {
                    obj.errorPage = 'true';
                }
            }
        }
        // augment channels with scg stuff
        if (whiteListObj.CG.toLowerCase() === 'opinion') {
            whiteListObj.channels += whiteListObj.channels === '' ? '' : ';';
            whiteListObj.channels += whiteListObj.CG.toLowerCase(); 
        }
        
        return (obj.pageMetaData = stringifyJson(whiteListObj));
    };

    // Retrieve addtional information.
    var additionalClientData = function (obj) {
        var
            date,
            data;
            
        data = {
            // User language.
            'ul': (function () {
                var
                    ul;
                if (navigator.appName === 'Netscape') {
                    ul = navigator.language;
                } else {
                    ul = navigator.userLanguage;
                }
                return ul;
            }()),
            // Javascript is enabled.
            'js': 'Yes',
            // Javascript version.
            'jv': (function () {
                var
                    agt = navigator.userAgent.toLowerCase(),
                    major = parseInt(navigator.appVersion, 10),
                    mac = (agt.indexOf("mac") != -1),
                    ff = (agt.indexOf("firefox") != -1),
                    ff0 = (agt.indexOf("firefox/0.") != -1),
                    ff10 = (agt.indexOf("firefox/1.0") != -1),
                    ff15 = (agt.indexOf("firefox/1.5") != -1),
                    ff2up = (ff && !ff0 && !ff10 && !ff15),
                    nn = (!ff && (agt.indexOf("mozilla") != -1) && (agt.indexOf("compatible") == -1)),
                    nn4 = (nn && (major === 4)),
                    nn6up = (nn && (major >= 5)),
                    ie = ((agt.indexOf("msie") != -1) && (agt.indexOf("opera") == -1)),
                    ie4 = (ie && (major == 4) && (agt.indexOf("msie 4") != -1)),
                    ie5up = (ie && !ie4),
                    op = (agt.indexOf("opera") != -1),
                    op5 = (agt.indexOf("opera 5") != -1 || agt.indexOf("opera/5") != -1),
                    op6 = (agt.indexOf("opera 6") != -1 || agt.indexOf("opera/6") != -1),
                    op7up = (op && !op5 && !op6),
                    jv = "1.1";

                if (ff2up === true) {
                    jv = "1.7";
                } else if (ff15 === true) {
                    jv = "1.6";
                } else if (ff0 === true || ff10 === true || nn6up === true || op7up === true) {
                    jv = "1.5";
                } else if ((mac === true && ie5up === true) || op6 === true) {
                    jv = "1.4";
                } else if (ie5up === true || nn4 === true || op5 === true) {
                    jv = "1.3";
                } else if (ie4 === true) {
                    jv = "1.2";
                }
                return jv;
            }()),
            // Flash enable is false until detection.
            'fi': 'No'
        };

        // Timezone.
        date = new Date();
        data.tz = date.getTimezoneOffset() / 60 * -1;
        data.bh = date.getHours();

        // Color depth and screen resolution.
        if (typeof(screen) === 'object') {
            // Color depth.
            if (navigator.appName === 'Netscape') {
                data.cd = screen.pixelDepth;
            } else {
                data.cd = screen.colorDepth;
            }

            // Screen resolution.
            data.sr = screen.width + 'x' + screen.height;
        }

        // Browser size.
        if (parseInt(navigator.appVersion, 10) > 3) {
            if ((navigator.appName === "Microsoft Internet Explorer") && document.body) {
                data.bs = document.body.offsetWidth + "x" + document.body.offsetHeight;
            } else if (navigator.appName === "Netscape") {
                data.bs = window.innerWidth + "x" + window.innerHeight;
            }
        }

        // Check if is Java enable.
        if (typeof(navigator.javaEnabled()) === "boolean") {
            data.jo = navigator.javaEnabled() ? "Yes" : "No";
        }

        // Flash detection and version. Latest version is 18, bump highest
        // version to 50 to give it some room to grow. 
        (function () {
            var
                i,
                flash;

            if (window.ActiveXObject) {
                for (i = 50; i > 0; i -= 1) {
                    try {
                        flash = new window.ActiveXObject("ShockwaveFlash.ShockwaveFlash." + i);
                        // Flash enable.
                        data.fi = "Yes";
                        // Flash version.
                        data.fv = i + ".0";
                        break;
                    }
                    catch (e) {}
                }
            } else if (navigator.plugins && navigator.plugins.length) {
                for (i = 0; i < navigator.plugins.length; i += 1) {
                    if (navigator.plugins[i].name.indexOf('Shockwave Flash') != -1) {
                        // Flash enable.
                        data.fi = "Yes";
                        // Flash version.
                        data.fv = navigator.plugins[i].description.split(" ")[2];
                        break;
                    }
                }
            }
        }());

        // Detect the screen orientation.
        if (window.matchMedia) {
            if (window.matchMedia("(orientation: portrait)").matches === true) {
                data.or = 'port';
            } else if (window.matchMedia("(orientation: landscape)").matches === true) {
                data.or = 'land';
            }
        }

        // Return the object.
        obj.additionalClientData = stringifyJson(data);
        return obj;
    };

    clazz = function () {
        var trackNow, agentId, mergeNewData, getBaseUrl;
        var datumId = null;
        var parentDatumId = null;
        var firedFirstEvent = false;
        var firstEventReturned = false;
        var scripts = [];
        var queue = [];
        var newData = [];

        if (this instanceof NYTD.EventTracker === false) {
            return new NYTD.EventTracker();
        }

        getBaseUrl = function () {
            return (document.location.protocol || 'http:') + '//' + etHost + '/';
        };

        trackNow = function (evt, options) {
            var scriptElem, oldScriptElem;
            var callbackNum = nextCallbackNum;
            var useOverwrites = options && options.useFieldOverwrites === true ? true : false;

            nextCallbackNum += 1;

            NYTD.EventTracker['cb' + callbackNum] = function (result) {
                var i;
                delete NYTD.EventTracker['cb' + callbackNum];
                if (result.status && result.status === 'OK') {
                    if (!datumId && options.buffer && !firstEventReturned) {
                        firstEventReturned = true;
                        datumId = result.datumId;
                        for (i = 0; i < queue.length; i += 1) {
                            trackNow(queue[i].evt, queue[i].options);
                        }
                        queue = [];
                    }
                    if (!agentId) {
                        agentId = result.agentId;
                    }
                    if (options.callback) {
                        options.callback(null, result);
                    }
                } else {
                    if (options.callback) {
                        options.callback(new Error('Event tracking failed'), 
                            result);
                    }
                }
            };

            evt = copyObject(evt);
            if (!options.buffer) {
                evt.instant = '1';
            }
            evt.callback = 'NYTD.EventTracker.cb' + callbackNum;
            if (datumId && options.buffer) {
                evt.datumId = datumId;
            }

            if (options.sendMeta) {
                extractPageMetaTags(evt);
            }

            if (options.collectClientData) {
                additionalClientData(evt);
            }

            if (agentId) {
                evt.agentId = agentId;
            }
            if (options.config) {
                options.config.merge(evt);
                if (evt._isNewPageTracker) {
                    delete evt.datumId;
                    datumId = null;
                    firstEventReturned = false;
                    delete evt._isNewPageTracker; // one time only
                }
            }


            scriptElem = document.createElement('script');
            scriptElem.src = buildUrl(getBaseUrl(), evt, useOverwrites);
            document.body.appendChild(scriptElem);

            scripts.push(scriptElem);
            if (scripts.length > 5) {
                oldScriptElem = scripts.shift();
                document.body.removeChild(oldScriptElem);
            }
        };

        mergeNewData = function (target, reset) {
            var newDataItem, i, key;
            if(newData.length > 0) {
                for (i = 0; i < newData.length; i++) {
                    newDataItem = newData[i];
                    for (key in newDataItem) if (newDataItem.hasOwnProperty(key)) {
                        target[key] = newDataItem[key];
                    }
                }
                if (reset) {
                    newData = [];
                }
            }
            return target;
        };

        this.track = function (evt, options) {
            options = options || {};
            if (!options.background) {
                lastEventTime = (new Date()).valueOf();
            }
            
            if(evt.subject !== 'page' && this.getParentDatumId() !== null) {
                evt.parentDatumId = this.getParentDatumId();
            }

            evt.sourceApp = sourceApp;
            evt = mergeNewData(evt, true);
            
            // If this is not a buffered event, fire immediately
            if (!options.buffer) {
                trackNow(evt, options);
            } else if (datumId || firstEventReturned || !firedFirstEvent) {
                firedFirstEvent = true;
                trackNow(evt, options);
            } else {
                queue.push({
                    evt: copyObject(evt),
                    options: copyObject(options)
                });
            }
        };
        
        this.updateData = function (oArg) {
            if(oArg instanceof Array) {
                newData = newData.concat(oArg);
            } else if(typeof oArg === 'object') {
                newData.push(oArg);   
            }
            // if flag to short circuit check here
        };

        this.hasTrackedEventRecently = function () {
            return ((new Date()).valueOf() - lastEventTime) < 960000;
        };

        this.getDatumId = function () {
            return datumId;
        };
        
        this.getParentDatumId = function() {
            if(parentDatumId === null && 
                NYTD.pageEventTracker && NYTD.pageEventTracker.getDatumId() !== null) {
                parentDatumId = NYTD.pageEventTracker.getDatumId();
            }
            return parentDatumId;
        };
        
        this.pixelTrack = function (evt, qs) {
            var imgsrc, validEvt, validQs;
            validEvt = (function (e) {
                var k;
                if (typeof e !== 'object') {
                    return false;
                }
                for (k in e) if (e.hasOwnProperty(k)) {
                    return true;
                }
                return false;
            }(evt));
            validQs = (typeof qs === 'string' && qs !== '');
            if (!validEvt && !validQs) {
                return;
            }
            imgsrc = (document.location.protocol || 'http:') + '//' + etHost +
                    '/pixel';
            if (validEvt) {
                imgsrc = buildUrl(imgsrc, evt);
            }
            if (validQs) {
                imgsrc += ((imgsrc.indexOf('?') === -1 ? '?' : '&') + qs);
            }
            new Image().src = imgsrc;
        };

        this.buildUrl = buildUrl;
        this.mergeNewData = mergeNewData;
        this.getBaseUrl = getBaseUrl;

    };

    clazz.Utils = {
        copyObject: copyObject,
        stringifyJson: stringifyJson
    };

    return clazz;
})();

//Now that the real EventTracker is defined, it's time to process events that
//happened before EventTracker is ready. For each instance in the list, create
//an instance of the new class. Instance functions are assigned to the old
//instances.
(function () {
    'use strict';
    var newinstance, instance, instances, func, adapter;
    if (!NYTD.PreLoadEventTracker) {
        return;
    }
    instances = NYTD.PreLoadEventTracker.getAllInstances();
    adapter = function (funcname, context) {
        return function () {
            return context[funcname].apply(context, arguments);
        };
    };
    while (instances.length > 0) {
        newinstance = new NYTD.EventTracker();
        instance = instances.pop();
        instance.processQueue(adapter('track', newinstance));
        for (func in newinstance) {
            if (newinstance.hasOwnProperty(func) &&
                    typeof newinstance[func] === 'function') {
                instance[func] = adapter(func, newinstance);
            }
        }
    }
    delete NYTD.PreLoadEventTracker;
})();

NYTD.EventTracker.Config = function (config) {
    'use strict';
    var etConfig = config || {};
    var _config = etConfig.event || {};
    var _options = etConfig.options || {};
    var utils = NYTD.EventTracker.Utils;
    var processed = {};
    //if value is an object, make sure to stringify it. same applies to
    //function call that returns an object
    var getValue = function (value) {
        return typeof value === 'function' ? value() : value;
    };
    return {
        isSuppressed: function (name) {
            var value = _config[name];
            return value && value.suppress === true;
        },
        //getting a parameter by name, make sure to pass in defVal (default value)
        get: function (name, defVal) {
            var oneConfig, arr, value;
            if ((oneConfig = _config[name])) {
                //config found
                //suppress true (false by default), don't include the value
                if (oneConfig.suppress === true) {
                    return;
                }
                //repeat false (true by default), field will be sent once
                if (oneConfig.repeat === false) {
                    processed[name] = 1;
                }
                if (defVal) {
                    //if overwrite is true (default), try config, then defVal
                    //if overwrite is false, try defVal, then config
                    arr = ((oneConfig.overwrite === false) ?
                            [defVal, oneConfig.value] :
                                [oneConfig.value, defVal]);
                    while (arr.length > 0) {
                        if (typeof (value = getValue(arr.shift())) !== 'undefined') {
                            return value;
                        }
                    }
                }
                else {
                    //no default value, use value from config
                    return getValue(oneConfig.value);
                }
            }
            //the value won't change because no config was found
            //remember this so we don't process it again.
            processed[name] = 1;
            //config of "name" not found, return default value (defVal)
            return getValue(defVal);
        },
        //get a particular set of options by name
        getOptions: function (name) {
            return getValue(_options[name]);
        },
        //get a particular option by name from the general options
        getOption: function (name, defVal) {
            return _options.general && _options.general[name] ? _options.general[name] : defVal;
        },
        //this is where the addition and removal of parameters to/from the event object happens
        merge: function (evt) {
            var name, value;
            for (name in _config) if(_config.hasOwnProperty(name)) {
                //skip if already processed
                if (processed[name]) {
                    continue;
                }
                value = _config[name];
                //remove from evt if suppressed
                if (value && value.suppress === true) {
                    delete evt[name];
                    continue;
                }
                if (typeof (value = this.get(name, evt[name])) !== 'undefined') {
                    evt[name] = value;
                }
            }
        }
    };
};

NYTD.pageEventTracker = (function (updateFrequency) {
    'use strict';
    var setUpdateTimeout, timeoutHandle, bgTrackerTrack, evt;
    var utils = NYTD.EventTracker.Utils;
    var tracker = new NYTD.EventTracker();
    var impressions = [];
    var startTime = (new Date()).valueOf();
    var config = new NYTD.EventTracker.Config(NYTD.EventTrackerPageConfig);
    var subject = config.get('subject', 'page');
    var url = config.get('url', document.location.href);
    var referrer = config.get('referrer', document.referrer);
    var assetUrl = config.get('assetUrl', (function (u) {
        return function() {
            var i, link;
            var href = u || document.location.href,
                links = document.getElementsByTagName('link');
            var seenCanonicalOverride = false;
            if(links && links.length > 0) {
                //loop the links and find
                for (i = 0;i < links.length;i++) {
                    link = links[i];
                    if (link) {
                        if (link.rel === 'canonicalOverride') {
                            href = link.href;
                            seenCanonicalOverride = true;
                            break;
                        } else if (!seenCanonicalOverride && link.rel === 'canonical') {
                            href = link.href;
                            break;
                        }
                    }
                }
            }
            return href;
        };
    })(url));
    var baseEvt = {
        subject: subject,
        url: url,
        assetUrl: assetUrl,
        referrer: referrer,
        clientTimeStamp: Date.now(),
        totalTime: 0
    };
    var resetTimeout = function () {
        clearTimeout(timeoutHandle);
        timeoutHandle = 0;
    };
    //need to take datumId, agentId, callback, sourceApp into account (128).
    var maxUrlLen = config.getOption('maxUrlLen', 1872);   //2KB for IE
    var addImpressions = function (myevt) {
        var strLen, result, len;
        if (impressions.length === 0) {
            return;
        }
        result = [];
        len = tracker.buildUrl(tracker.getBaseUrl(), myevt, true).length + 16;
        while(impressions.length > 0) {
            strLen = encodeURIComponent(utils.stringifyJson(impressions[0])).length;
            len += (strLen + 3);
            if (len <= maxUrlLen) {
                result.push(impressions.shift());
            }
            else {
                break;
            }
        }
        if (result.length > 0) {
            myevt.impressions = utils.stringifyJson(result);
        }
    };
    tracker.addModuleImpression = function(module) {
        if (config.isSuppressed('impressions')) {
            return;
        }
        impressions.unshift(module);
        if (module.priority) {
            delete module.priority;
            this.shortCircuit();
        }
    };
    updateFrequency = config.getOption('updateFrequency', 60000);
    bgTrackerTrack = function (isNewPageConfig) {
        var newEvt = tracker.mergeNewData(utils.copyObject(baseEvt), false);
        newEvt.totalTime = (new Date()).valueOf() - startTime;
        addImpressions(newEvt);
        if(isNewPageConfig) {
            newEvt._isNewPageTracker = true
        } 

        tracker.track(newEvt, {
            background: true,
            useFieldOverwrites: true,
            buffer: true,
            callback: setUpdateTimeout,
            config: config
        });
    };
    setUpdateTimeout = function () {
        if (timeoutHandle) {
            resetTimeout();
        }
        timeoutHandle = setTimeout(function () {
            if (!tracker.getDatumId()) {
                setUpdateTimeout();
                return;
            } else if (!tracker.hasTrackedEventRecently()) {
                return;
            }
            timeoutHandle = 0;
            bgTrackerTrack();

        }, updateFrequency);
    };
    evt = tracker.mergeNewData(utils.copyObject(baseEvt), false);
    addImpressions(evt);
    tracker.track(evt, utils.copyObject({
        sendMeta: true,
        useFieldOverwrites: true,
        buffer: true,
        collectClientData: true,
        callback: setUpdateTimeout,
        config: config
    }, config.getOptions('firstcall')));
    
    tracker.shortCircuit = function () {
        if (timeoutHandle) {
            resetTimeout();
        }
        bgTrackerTrack();
    };

    tracker.trackNewPage = function (oConfig) {
        if (!oConfig) {
            return;
        }

        //special override for totaltime
        oConfig.totalTime = {value: 0, repeat: false};
        var eventTrackerPageConfig = {
            event: oConfig
        }

        config = new NYTD.EventTracker.Config(eventTrackerPageConfig);
        if (timeoutHandle) {
            resetTimeout();
        }
        bgTrackerTrack(true);
    }

    return tracker;
})();
