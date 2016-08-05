/**
 * A config object for share tools
 *
 * <p><b>Require Path:</b> shared/sharetools/sharetools-config</p>
 *
 * @module Shared
 * @submodule Shared.ShareTools
 * @namespace ShareTools
**/
define([
], function () {
    'use strict';

    var config = {};

    config.common = {
        mainClassName: 'shareTools',
        itemClassName: 'shareToolsItem',
        defaultActiveShares: 'email,facebook,twitter,save,show-all|more,ad',
        defaultShowAllShares: 'facebook|Share,email|Email,twitter|Tweet,linkedin|LinkedIn,google|Google+,reddit|Reddit,save|Save,reprints|Reprints,print|Print,ad',
        defaultUrl: window.location.href.replace( /#.*/, '' ),
        defaultTitle: document.title,
        defaultDescription: '',
        defaultAdPosition: 'Frame4A',
        defaultOverlayAdPosition: 'Frame6A',
        defaultWidth: 600,
        defaultHeight: 450,
        defaultTransition: 'fade',
        labelSpecialChar: '|',
        hasAd: false,
        loadedAdPositions: [],
        shortUrlApi: 'http://www.nytimes.com/svc/bitly/shorten.jsonp',
        emailThisUrl: 'https://www.nytimes.com/mem/email-this.html?url=',
        count: 0
    };

    config.tools = {
        facebook: {
            active: true,
            onShowAll: true,
            label: 'Facebook',
            postUrl: 'http://www.facebook.com/sharer.php',
            postType: 'popup',
            shareParameters: {
                url: 'u'
            },
            smid: 'fb-share',
            width: 655,
            height: 430
        },
        twitter: {
            active: true,
            onShowAll: true,
            label: 'Twitter',
            postUrl: 'https://twitter.com/share',
            postType: 'popup',
            shareParameters: {
                url: 'url',
                title: 'text',
                via: 'via'
            },
            smid: 'tw-share',
            width: 600,
            height: 450
        },
        google: {
            active: true,
            onShowAll: true,
            label: 'Google+',
            postUrl: 'https://plus.google.com/share',
            postType: 'popup',
            shareParameters: {
                url: 'url'
            },
            urlParameters: {
                hl: 'en-US'
            },
            smid: 'go-share',
            width: 600,
            height: 600
        },
        tumblr: {
            active: true,
            onShowAll: true,
            label: 'Tumblr',
            postUrl: 'http://www.tumblr.com/share/link',
            postType: 'popup',
            shareParameters: {
                url: 'url',
                title: 'name',
                description: 'description'
            },
            smid: 'tu-share',
            width: 560
        },
        linkedin: {
            active: true,
            onShowAll: true,
            label: 'Linkedin',
            postUrl: 'http://www.linkedin.com/shareArticle',
            postType: 'popup',
            shareParameters: {
                url: 'url',
                title: 'title',
                description: 'summary'
            },
            urlParameters: {
                mini: 'true',
                source: 'The New York Times'
            },
            smid: 'li-share',
            width: 750,
            height: 450
        },
        reddit: {
            active: true,
            onShowAll: true,
            label: 'Reddit',
            postUrl: 'http://www.reddit.com/submit',
            postType: 'popup',
            shareParameters: {
                url: 'url',
                title: 'title'
            },
            smid: 're-share',
            width: 854,
            height: 550
        },
        email: {
            loginModalText: 'Log in to email',
            active: true,
            onShowAll: true,
            label: 'Email',
            loginRequired: true
        },
        permalink: {
            active: true,
            onShowAll: true,
            label: 'Permalink',
            postUrl: 'http://www.nytimes.com/export_html/common/new_article_post.html',
            postType: 'popup',
            shareParameters: {
                url: 'url',
                title: 'title',
                description: 'summary'
            },
            smid: 'pl-share',
            width: 460,
            height: 380,
            loginRequired: false
        },
        'show-all': {
            active: true,
            onShowAll: false,
            label: 'Show All'
        },
        reprints: {
            active: true,
            onShowAll: false,
            label: 'Reprints',
            postUrl: 'https://s100.copyright.com/AppDispatchServlet',
            postType: 'popup',
            shareParameters: {
                url: 'contentID'
            },
            urlParameters: {
                publisherName: 'The New York Times',
                publication: 'nytimes.com',
                token: '',
                orderBeanReset: 'true',
                postType: '',
                wordCount: '',
                title: document.title,
                publicationDate: '',
                author: ''
            }
        },
        save: {
            loginModalText: 'Log in to save',
            active: true,
            onShowAll: false,
            label: 'Save',
            postUrl: config.common.defaultUrl.replace(/\?.*/, ''),
            loginRequired: true
        },
        print: {
            active: true,
            onShowAll: false,
            label: 'Print',
            postUrl: config.common.defaultUrl,
            postType: 'link',
            urlParameters: {
                pagewanted: 'print'
            }
        },
        ad: {
            active: true,
            onShowAll: false,
            label: 'Advertisement'
        },
        embed: {
            active: true,
            onShowAll: true,
            label: 'Embed',
            loginRequired: false
        },
        pinterest: {
            active: true,
            onShowAll: true,
            label: 'Pinterest',
            postUrl: 'https://www.pinterest.com/pin/create/button/',
            postType: 'popup',
            shareParameters: {
                url: 'url',
                media: 'media',
                description: 'description'
            },
            smid: 'pin-share',
            width: 600,
            height: 450,
            loginRequired: false
        }
    };

    return config;

});
