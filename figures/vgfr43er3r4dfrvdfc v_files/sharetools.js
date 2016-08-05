/**
 * Creates new share tools module on the page
 *
 * <p><b>Require Path:</b> shared/sharetools/views/sharetools</p>
 *
 * @module Shared
 * @submodule Shared.ShareTools
 * @namespace ShareTools
 * @class View
 * @constructor
 * @extends foundation/views/base-view
 *
**/

/**
@example
    $('.sharetools').not('.sharetools-init').each(function () {
          new ShareToolsView({ el: this });
    });
**/

define([
    'jquery/nyt',
    'underscore/nyt',
    'foundation/views/base-view',
    'shared/sharetools/templates',
    'shared/sharetools/views/email',
    'shared/sharetools/views/showall',
    'shared/sharetools/instances/cross-platform-save',
    'foundation/models/user-data',
    'shared/sharetools/helpers/sharetools-config',
    'shared/sharetools/helpers/sharetools-mixin'
], function ($, _, BaseView, template, EmailModal, ShowAllModal, xps, userData, config, ShareToolsMixin) {
    'use strict';

    var ShareToolsView = BaseView.registerView('sharetools').extend(

        // Using a Backbone Mixin to import messenger methods into this view
        _.extend({}, ShareToolsMixin, {

            /**
             * An object whose key-value pairs represent dom events and their handlers
             *
             * @private
             * @property events
             * @type {Object}
            **/
            events: {
                'click .sharetool': 'handleShareAction'
            },

            /**
             * The object that holds all configurable data for the show all modal
             * @private
             * @property showAllModalData
             * @type {Object}
            **/
            defaultModalData: {
                shares: 'facebook|Share,email|Email,twitter|Tweet,linkedin|LinkedIn,google|Google+,reddit|Reddit,save|Save,reprints|Reprints,print|Print,ad'
            },

            /**
             * Initializes the Share Tools view
             *
             * @private
             * @method initialize
            **/
            initialize: function (options) {

                //Failsafe so sharetools can't be initialized more than once.
                if (this.$el.length === 0 || this.$el.hasClass('sharetools-init')) {
                    return;
                }

                //share tools settings
                this.settings = _.extend({}, this.getDataAttrs(), options);

                //show all modal
                this.modalSettings = _.extend({}, options.showAllModalSettings);
                this.modalData = _.extend({}, this.$el.data(), this.defaultModalData, options.showAllModalData);

                this.$el.addClass('sharetools');

                this.setUpConfigOptions();
                this.render();

                this.trackingBaseData = {
                    'module': 'ShareTools',
                    'version': this.$el.data('content-type') || 'Content',
                    'action': 'click',
                    'contentCollection': this.pageManager.getMeta('article:section'),
                    'pgtype': this.pageManager.getMeta('PT')
                };
            },

            /**
             * Renders the Share Tools view
             *
             * @priveleged
             * @method render
            **/
            render: function () {
                var adPosition;
                var $ad = this.$el.find('.sharetools-inline-article-ad');
                var html = template.shareTools({shares: this.settings.inlineTools, config: config.tools});

                // register element as initialized so it isn't re-initialized later
                this.$el.addClass('sharetools-init');

                // insert before the ad so as not to cause problems with the skip to link.
                if ($ad.length > 0) {
                    $(html).insertBefore(this.$el.find('.sharetools-inline-article-ad'));

                // custom modules might not have an ad
                } else {
                    this.$el.append(html);
                }

                // handle whether ads are shown in inline tool space
                if (this.settings.ad) {

                    // Decides which Sharetools ad to show based on current viewport size
                    if (this.pageManager.getCurrentBreakpoint() <= 1020) {
                        adPosition = 'Position1';
                    } else {
                        adPosition = 'Frame4A';
                    }

                    this.$el.find('.sharetools-inline-article-ad').attr('id', adPosition);

                    this.broadcast('nyt:ads-new-placement', adPosition);
                }

                return this;
            },

            /**
             * Handles the action of engaging a share tool option
             *
             * @method handleShareAction
             * @private
            **/
            handleShareAction: function (e) {
                var $el = $(e.target);
                var share = $el.data('share') || $el.parent().data('share');
                var shareType = config.tools[share].postType === 'popup' ? 'popup' : share;

                var trackingData = this.trackingBaseData;
                if ($el.parents('.video-player-region').size() > 0) {
                    trackingData.region = 'video-player-region';
                } else if ($el.parents('#main').size() > 0) {
                    trackingData.region = 'Body';
                } else if ($el.parents('#masthead').size() > 0) {
                    trackingData.region = 'TopBar';
                }

                if (share === 'show-all') {
                    trackingData.eventName = 'Share-ShowAll';
                } else if (share === 'save' || share === 'reprints' || share === 'print') {
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
                    case 'save':
                        this.saveAction();
                        break;
                    case 'popup':
                        if (share === 'twitter') {
                            this.handleShortUrlShareAction(config.tools[share]);
                        } else {
                            this.popupShareAction(share);
                        }
                        break;
                    case 'embed':
                        // Embed opens showall modal
                        // Stop propagation to prevent close on click
                        e.stopPropagation();
                        this.$('.show-all-sharetool a').trigger('click');
                        this.$body.find('.show-all-sharetool-modal #embed-input').select();
                        break;
                    case 'show-all':
                        new ShowAllModal(this.modalSettings, this.modalData);
                        break;
                    // no default
                }
            },

            /**
             * Adds a CSS class to the showall sharetool
             * when it is an an active state.
             *
             * @private
             * @method changeActiveState
             */
            changeActiveState: function () {
                if (!this.$('.show-all-sharetool').hasClass('active')) {
                    this.$('.show-all-sharetool').addClass('active');
                } else {
                    this.$('.show-all-sharetool').removeClass('active');
                }
            }
        })
    );

    return ShareToolsView;
});
