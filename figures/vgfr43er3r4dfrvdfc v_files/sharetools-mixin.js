/**
 * Functions that will be used in both sharetools and show all modal
 *
 * <p><b>Require Path:</b> shared/sharetools/views/sharetools-mixin</p>
 *
 * @module Shared
 * @submodule Shared.ShareTools
 * @namespace ShareTools
 * @class View
 * @constructor
 * @extends foundation/views/base-view
 *
**/

define([
    'jquery/nyt',
    'underscore/nyt',
    'foundation/views/base-view',
    'shared/sharetools/templates',
    'shared/ad/views/ads',
    'shared/sharetools/views/email',
    'shared/modal/views/modal',
    'shared/sharetools/instances/cross-platform-save',
    'foundation/models/page-storage',
    'foundation/hosts',
    'foundation/models/user-data',
    'shared/sharetools/helpers/sharetools-config',
    'shared/sharetools/instances/short-url'
], function ($, _, BaseView, Templates, Ads, EmailModal, Modal, xps, pageStorage, hosts, userData, config, shortUrl) {
    'use strict';

    var ShareToolsMixin = {

        /**
         * A method that extracts from the data attributes on the share tools parent div
         * builds out generated options from data attrs or uses defaults from config
         *
         * @private
         * @method getDataAttrs
         * @type {Function}
        **/
        getDataAttrs: function (showAll, customDataAttr) {
            var share, i, len;
            var dataAttrs = customDataAttr || this.$el.data();
            var shareArr = (dataAttrs.shares || config.common[showAll ? 'defaultShowAllShares' : 'defaultActiveShares']).split(',');
            var tools = [];
            var hasAd = config.common.hasAd;

            // Magazine, T-magazine, ApOnline and Reuters articles will not have reprints for licensing reasons
            if ( showAll && (config.common.defaultUrl.indexOf('aponline') > -1 || config.common.defaultUrl.indexOf('reuters') > -1 || config.common.defaultUrl.indexOf('magazine') > -1 || config.common.defaultUrl.indexOf('t-magazine') > -1 )) {
                shareArr = _.without(shareArr, 'reprints|Reprints');
            }

            for (i = 0, len = shareArr.length; i < len; i += 1) {

                //shares split by a pipe get a different display name
                if (shareArr[i].indexOf('|') > 0) {
                    share = shareArr[i].split('|');
                    tools.push({type: share[0], label: share[1]});

                //all other shares get default labels
                } else {
                    if (shareArr[i] === 'ad') {
                        hasAd = true;
                    } else {
                        tools.push({type: shareArr[i], label: shareArr[i]});
                    }
                }
            }

            config.tools.reprints.urlParameters.publicationDate = dataAttrs.publishDate;

            return _.extend({}, {
                inlineTools: tools,
                ad: hasAd,
                url: config.common.defaultUrl,
                title: config.common.defaultTitle,
                description: config.common.defaultDescription
                }, dataAttrs);
        },

        /**
         * Sets up all default configuration values.
         *
         * @private
         * @method setUpConfigOptions
         */
        setUpConfigOptions: function () {
            config.common.defaultTitle = this.pageManager.getMeta('og:title') || document.title;
            config.common.defaultDescription = this.pageManager.getMeta('description') || '';
        },

        /**
         * Checks to see if the sharetools are in a mobile-mode
         *
         * @private
         * @method isMobileSharetools
         */
        isMobileSharetools: function () {
            return this.pageManager.getCurrentBreakpoint() < 1000;
        },

        /**
         * Opens a mail to link of the story
         *
         * @private
         * @method openMailToLink
         */
        openMailToLink: function () {
            var br = '%0A%0A';
            var title = encodeURIComponent(this.settings.title);
            var description = encodeURIComponent(this.settings.description);
            var url = encodeURIComponent(this.settings.url);

            var subject = 'NYTimes.com: ' + title;
            var body = 'From The New York Times:' + br + title + br + description + br + url;

            window.location = 'mailto:?subject=' + subject + '&body=' + body;
        },

        /**
         * Handles shortened URL sharing options
         *
         * @method handleShortUrlShareAction
         * @private
        **/
        handleShortUrlShareAction: function (shareObj, urlOverride) {
            var url, w, shortUrlWithoutTracking;
            var view = this;
            var shareUrl = (urlOverride || this.settings.url);
            var anchor = this.createAnchor(shareUrl);

            // For iOS open share window with URL already set to try to bypass
            // problem of new window not getting its location set. See WP-10006
            if (/(?:iPad|iPhone)/.test(navigator.userAgent)) {
                shortUrlWithoutTracking = $('#masthead').find('.story-short-url').text() || this.pageManager.getCanonical() || shareUrl;
                url = shareObj.postUrl + '?url=' + encodeURIComponent(shortUrlWithoutTracking) + '&text=' + encodeURIComponent(document.title);
                window.open(url, shareObj.label + 'Share', 'toolbar=0,status=0,height=' + shareObj.height + ',width=' + shareObj.width + ',scrollbars=yes,resizable=yes');
                return;
            }

            w = window.open('', shareObj.label + 'Share', 'toolbar=0,status=0,height=' + shareObj.height + ',width=' + shareObj.width + ',scrollbars=yes,resizable=yes');

            //HACK: Bypass adding the smid param for iOS < 8 to avoid the request for a short url that causes new tab to not navigate. See WP-5442
            //add the appropriate query parameter
            if (shareObj.smid && !this.pageManager.isMobile()) {
                anchor.search += (anchor.search.indexOf('?') === 0) ? '&' : '?';
                anchor.search += 'smid=' + shareObj.smid;
                shareUrl = anchor.href;
            }

            url = shortUrl.requestUrl(shareUrl) || '';

            //if the short url is already available
            if (url) {
                this.shortUrlRedirect(url, shareObj, w);

            //wait for the response
            } else {
                this.listenToOnce(shortUrl, 'add', function () {
                    var model = shortUrl.findWhere({url: shareUrl});
                    if (model) {
                        view.shortUrlRedirect(model.get('shortUrl'), shareObj, w);
                    }
                });
            }

            // listenToOnce is not getting invoked in iPad
            // It seems like the iPad stops executing the JS in the parent window once the popup is opened.
            // Fix specific to iPad device and safari browser
            if (navigator.userAgent.match(/iPad/i) && navigator.userAgent.match(/Safari/i)) {
                this.shortUrlRedirect($('#masthead').find('.story-short-url').text(), shareObj, w);
            }
        },

        /**
         * Builds the Url to redirect for share functions that use the shortUrl
         *
         * @method shortUrlRedirect
         * @private
         */
        shortUrlRedirect: function (url, shareObj, w) {
            var paramValue, shortUrlWithParams, trackingParam;
            var parameters = [];
            var urlData = _.extend({}, this.settings);

            if (shareObj.shareParameters && urlData) {

                // ABTEST: WP-4447 hack for sharetools - remove when done
                trackingParam = this.getTrackingParam();
                if (trackingParam) {
                    shareObj.shareParameters.smv = trackingParam;
                    urlData.smv = null;
                }

                // End ABTEST

                $.each(shareObj.shareParameters, function (paramName, paramKey) { // walk through parameters
                    paramValue = (paramName === 'url') ? url : urlData[paramName];
                    if (paramValue) {
                        parameters.push(paramKey + '=' + encodeURIComponent(paramValue));
                    } else if (paramValue === null) { // ABTEST: WP-4447
                        parameters.push(paramKey);
                    }
                    // End ABTEST
                });
            }
            parameters = parameters.join('&');
            shortUrlWithParams = shareObj.postUrl + this.paramChar(shareObj.postUrl) + parameters;

            this.shoveUrlToNewWindow(shortUrlWithParams, w);
        },

        /**
         * Shove URL to recently opened window
         *
         * @method shoveUrlToNewWindow
         * @private
        **/
        shoveUrlToNewWindow: function (shortUrl, w) {
            w.document.location = shortUrl;
            w.document.close();
        },

        /**
         * Callback for items successfully saved.  Utilizes localstorage to determine which modal to show
         *
         * @method itemSaved
         * @private
        **/
        itemSaved: function () {
            if (pageStorage.get('sharetools_hasSaves') !== true) {
                this.firstTimeSaveModal();
                pageStorage.set('sharetools_hasSaves', true);
            } else {
                this.growlSaveModal();
            }
        },

        /**
         * Creates a growl on the page to let the user the article has been saved.
         *
         * @method growlSaveModal
         * @private
        **/
        growlSaveModal: function () {
            var growl = new Modal({
                id: 'save-item-growl-modal',
                modalTitle: '<i class="icon"></i>Saved',
                tailDirection: 'centered',
                openCallback: function () {
                    window.setTimeout(this.removeFromPage, 2000);
                }
            }).addToPage();

            //the callbacks don't fully register before calling open.
            _.defer(growl.open);
        },

        /**
         * Creates a new modal on the page to let the user know how to access
         * their saved items.
         *
         * @method firstTimeSaveModal
         * @private
        **/
        firstTimeSaveModal: function () {
            var modal = new Modal({
                id: 'save-item-modal',
                modalTitle: '<i class="icon"></i>Saved',
                modalContent: Templates.savemodal({link: hosts.www + '/saved'}),
                hasOverlay: true,
                hasCloseButton: true,
                tailDirection: 'centered',
                closeCallback: function () {
                    this.removeFromPage();
                }
            }).addToPage();

            //the callbacks don't fully register before calling open.
            _.defer(modal.open);
        },

        /**
         * Makes a request to the Reading List API if the user is logged in, and if
         * the user hasn't previously saved this article
         *
         * @method saveAction
         * @private
        **/
        saveAction: function () {
            var found = xps.where({url: this.settings.url});

            if (!userData.isLoggedIn()) {
                // fire tracking event
                this.trackingTrigger('loginmodal-open', {
                    'module': 'LogIn',
                    'action': 'Click',
                    'region': 'ToolsMenu',
                    'eventName': 'ArticleTool-save'
                });

                // Allow the log in modal event to trigger
                return true;
            } else if (found.length === 0) {
                this.subscribeOnce(xps, 'nyt:xps-saved', this.itemSaved);
                xps.save(this.settings.url);
            } else {
                this.growlSaveModal();
            }
        },

        /**
         * Utility to determine whether to prefix URL parameters with a ? or &
         *
         * @method paramChar
         * @private
        **/
        paramChar: function (string) {
            return string.indexOf('?') !== -1 ? '&' : '?';
        },

        /**
         * Method to build URL for sharing options
         *
         * @method buildUrl
         * @private
        **/
        buildUrl: function (shareName, data) {
            var paramValue, ricoUrl, anchor;
            var options = config.tools[shareName];
            var parameters = [];
            var postUrl = options.postUrl;
            var urlData = _.extend({}, data || this.settings);

            // AB Testing Sharetools - remove when done
            var trackingParam = this.getTrackingParam();
            if (trackingParam) {
                options.urlParameters = options.urlParameters || {};
                options.urlParameters[trackingParam] = null;
            }

            //check if a rico url is available
            ricoUrl = shortUrl.getRicoUrl(urlData.url);
            if (ricoUrl && shareName !== 'email') {
                urlData.url = ricoUrl;
            }

            //add the appropriate query parameter
            anchor = this.createAnchor(urlData.url);
            if (options.smid) {
                anchor.search += (anchor.search.indexOf('?') === 0) ? '&' : '?';
                anchor.search += 'smid=' + options.smid;
                urlData.url = anchor.href;
            }

            if (options.shareParameters && urlData) {
                $.each(options.shareParameters, function (paramName, paramKey) { // walk through parameters
                    paramValue = urlData[paramName];
                    parameters.push(paramKey + '=' + encodeURIComponent(paramValue));
                });
            }

            if (options.urlParameters) {
                $.each(options.urlParameters, function (paramName, paramValue) {
                    if (paramValue !== null) {
                        parameters.push(paramName + '=' + encodeURIComponent(paramValue));
                    } else {  // ABTEST WP-4447
                        parameters.push(paramName);
                    }
                });
            }

            parameters = parameters.join('&');
            postUrl = postUrl + this.paramChar(postUrl) + parameters;

            return postUrl;
        },

        /**
         * Method to do window.open with sharetool specific options
         *
         * @method popupShareAction
         * @private
        **/
        popupShareAction: function (shareName, data) {
            var options = config.tools[shareName];
            var width = options.width ? options.width : config.common.defaultWidth;
            var height = options.height ? options.height : config.common.defaultHeight;
            var url = this.buildUrl(shareName, data);
            window.open(url, shareName + 'Share', 'toolbar=0,status=0,height=' + height + ',width=' + width + ',scrollbars=yes,resizable=yes');
        },

        /**
         * ABTEST :WP-4447 Method to add tracking requirements to abtest
         *
         * @method getTrackingParam
         * @private
        **/
        getTrackingParam: function () {
            var userVariant = this.isUserVariant('articleSharetools');
            var trackingParamAB = 'smv' + userVariant;

            if (typeof userVariant === 'string') {
                return trackingParamAB;
            }
        }
    };

    return ShareToolsMixin;
});
