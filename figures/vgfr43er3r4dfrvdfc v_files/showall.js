/**
 * A base view for a share tool, show all modal
 *
 * <p><b>Require Path:</b> shared/sharetools/views/showall</p>
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
    'shared/modal/views/modal',
    'shared/ad/views/ads',
    'shared/sharetools/templates',
    'shared/sharetools/helpers/sharetools-config',
    'shared/sharetools/helpers/sharetools-mixin',
    'shared/sharetools/views/email',
    'foundation/models/user-data',
    'shared/sharetools/instances/short-url'
], function ($, _, BaseView, Modal, Ad, template, config, SharetoolsMixin, EmailModal, userData, shortUrl) {
    'use strict';

    var ShowAllView = BaseView.extend(

        _.extend({}, SharetoolsMixin, {
            /**
             * An object whose key-value pairs represent dom events and their handlers
             *
             * @private
             * @property events
             * @type {Object}
            **/
            events: {
                'click .sharetool': 'handleLinkClick',
                'click .short-url-input, .text': 'handleInputSelect'
            },

            /**
             * The class name for the showall view
             *
             * @private
             * @property className
             * @type {Function}
            **/
            className: 'show-all-view-container',

            /**
             * The default properties when building the modal
             *
             * @private
             * @property defaultModalSettings
             * @type {Function}
            **/
            defaultModalSettings: {
                id: 'show-all-sharetool-modal',
                modalTitle: 'share this video',
                binding: '.show-all-sharetool',
                tailDirection: 'up',
                hasOverlay: false,
                hasCloseButton: false,
                positionTailSide: false,
                autoPosition: false,
                modalContent: '',
                tailLeftOffset: 0,
                tailTopOffset: 0,
                template: 'showAllSharetoolModal',
                openCallback: function () {
                    this.$target.addClass('active');
                },
                closeCallback: function () {
                    this.$target.removeClass('active');
                    // Destroys modal to avoid multiple instance bugs
                    this.removeFromPage();
                }
            },

            /**
             * An inventory of shares that belong to the article tools grouping
             *
             * @private
             * @property articleTools
             * @type {Object}
            **/
            articleTools: ['save', 'print', 'reprints'],

            /**
             * Initializes the show all view
             *
             * @private
             * @method initialize
             * @param settings {Object} settings used to make a custom modal
             * @param data {Object} data used to make a new instance of the show all modal
            **/
            initialize: function (settings, data) {
                var anchor;

                _.bindAll(this, 'handleShortUrl');

                //set the settings for the show all modal
                this.settings = _.extend({}, this.getDataAttrs(true, data));
                this.modalSettings = _.extend({}, this.defaultModalSettings, settings);

                //smaller viewports receive mobile treatment
                if (this.isMobileSharetools()) {
                    this.modalSettings = _.extend({}, this.modalSettings, {
                        tailDirection: 'centered',
                        hasCloseButton: true,
                        hasOverlay: true,
                        positionTailSide: false,
                        autoPosition: false
                    });
                }

                //configure the use of a nyti.ms url in share tools
                anchor = this.createAnchor(this.settings.url);
                anchor.search += (anchor.search.indexOf('?') === 0) ? '&' : '?';
                anchor.search += 'smid=pl-share';
                this.settings.permalinkUrlWithSmid = anchor.href;

                this.settings.shortUrl = shortUrl.requestUrl(this.settings.permalinkUrlWithSmid) || '';
                if (!this.settings.shortUrl) {
                    this.listenToOnce(shortUrl, 'add', this.handleShortUrl);
                }

                //build the show all modal and add it to the page
                this.render();

                this.trackingBaseData = {
                    'module': 'ShareTools',
                    'action': 'click',
                    'contentCollection': this.pageManager.getMeta('article:section')
                };
            },

            /**
            * Renders a new modal with the supplied settings.
            *
            * @private
            * @method render
            */
            render: function () {
                var adPosition = this.settings.ad ? 'Frame6A' : '';

                //create a new modal
                this.modalSettings.modalContent = template[this.modalSettings.template](this.buildShareHTML());
                this.modalSettings.modalFooter = template.shareToolsModalFooter({
                    toolTypeSponsor: 'Share'
                });
                this.showAllModal = new Modal(this.modalSettings);

                //set the context of the view to the modal
                this.setElement(this.showAllModal.$modal);

                //update the ad position so it can be properly targeted
                this.showAllModal.$modal.find('.show-all-sharetool-modal-ad').attr('id', adPosition);

                //add the modal to the page
                this.showAllModal.addToPage();

                //use the ad framework to render a new ad inside the modal
                if (this.settings.ad && this.pageManager.getCurrentBreakpoint() >= 1000) {
                    new Ad({
                        positions: [adPosition],
                        scope: 'modal',
                        autoconfirm: 0
                    });
                }

                if (this.settings.embedCode) {
                    this.handleEmbedCode();
                }

                if (this.settings.shortUrl) {
                    this.handleShortUrl();
                }
            },

            /**
             * Constructs the HTML for the article and share tool lists
             *
             * @private
             * @method buildShareHTML
             * @return {Object} The html strings for article and share tools
            **/
            buildShareHTML: function () {
                var i, toolsLen, htmlTemplate;
                var tools = this.settings.inlineTools;
                var showAllLinkList = '';
                var showAllToolList = '';

                //loop through each of the shares
                for (i = 0, toolsLen = tools.length; i < toolsLen; i += 1) {

                    //construct the template
                    htmlTemplate = template.showallLinks({
                        shareObj: tools[i],
                        config: config.tools[tools[i].type]
                    });

                    //based on the share type, add the share's html to the appropriate list
                    if (_.indexOf(this.articleTools, tools[i].type) >= 0) {
                        showAllToolList += htmlTemplate;
                    } else {
                        showAllLinkList += htmlTemplate;
                    }
                }

                return {
                    shortUrl: this.settings.shortUrl,
                    showAllLinkList: showAllLinkList,
                    showAllToolList: showAllToolList
                };
            },

            /**
             * Updates the short url for the modal
             *
             * @private
             * @method handleShortUrl
            **/
            handleShortUrl: function () {
                var model = shortUrl.findWhere({url: this.settings.permalinkUrlWithSmid});

                if (model) {
                    this.settings.shortUrl = model.get('shortUrl');
                    this.showAllModal.$modal.find('.short-url-input').val(this.settings.shortUrl);
                }
            },

            /**
             * Updates the embed code for the modal
             *
             * @private
             * @method handleEmbedCode
            **/
            handleEmbedCode: function () {
                if (this.settings.embedCode) {
                    this.showAllModal.$modal.find('.embed-input').val(this.settings.embedCode);
                }
            },

            /**
             * Highlights the bit.ly text
             *
             * @private
             * @method handleInputSelect
            **/
            handleInputSelect: function (e) {
                e.target.select();
            },

            /**
             * Checks to see which link was clicked and executes the correct function.
             *
             * @private
             * @method handleLinkClick
             */
            handleLinkClick: function (e) {
                var $el = $(e.target);
                var share = $el.data('share') || $el.parent().data('share');
                var shareType = config.tools[share].postType === 'popup' ? 'popup' : share;
                var trackingData = {
                    'version': this.settings.contentType || 'Content',
                    'region': 'ToolsMenu'
                };

                this.showAllModal.close();

                if (share === 'save' || share === 'reprints' || share === 'print') {
                    trackingData.module = 'ArticleTools';
                    trackingData.eventName = 'ArticleTool-' + share;
                } else {
                    trackingData.eventName = 'Share-' + share;
                }

                this.trackingTrigger('share-tools-click', trackingData);

                switch (shareType) {
                    case 'email':
                        if (this.isMobileSharetools()) {
                            this.openMailToLink();
                        } else if (userData.isLoggedIn()) {
                            new EmailModal({dataUrl: this.settings.url});
                        }
                        break;
                    case 'popup':
                        if (share === 'twitter') {
                            this.handleShortUrlShareAction(config.tools[share]);
                        } else {
                            this.popupShareAction(share);
                        }
                        break;
                    case 'save':
                        this.saveAction();
                        break;
                    case 'reprints':
                        this.popupShareAction(share);
                        break;
                    case 'print':
                        window.print();
                    // no default
                }
            }
        })
    );

    return ShowAllView;
});
