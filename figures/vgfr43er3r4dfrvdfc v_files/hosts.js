/*eslint camelcase:0 */
/**
 * Creates a host object that adjusts with each of the different environments
 *
 * <p><b>Require Path:</b> foundation/hosts</p>
 *
 * @module Foundation
 * @class Hosts
 * @static
 **/
define(function () {
    'use strict';
    var secure = window.location.protocol.indexOf('https') === 0;

    var env_deploy_imageHost = 'http://static01.nyt.com';
    var env_deploy_jsHost = 'http://static01.nyt.com';
    var env_deploy_cssHost = 'http://static01.nyt.com';
    var env_deploy_jsonHost = 'http://json8.nytimes.com';
    var env_deploy_imageSecureHost = 'https://static.nytimes.com';
    var env_deploy_jsSecureHost = 'https://static.nytimes.com';
    var env_deploy_cssSecureHost = 'https://static.nytimes.com';
    var env_deploy_jsonSecureHost = 'https://static.nytimes.com';
    var env_deploy_wwwHost = '//www.nytimes.com';
    var env_deploy_internationalHost = '//international.nytimes.com';
    var env_deploy_adxHost = '//www.nytimes.com';
    var env_deploy_authHost = 'https://myaccount.nytimes.com';
    var env_deploy_mtrSvcHost = '//meter-svc.nytimes.com';
    var env_deploy_profileImageHost = '//s3.amazonaws.com/pimage.timespeople.nytimes.com';
    var env_deploy_tagxHost = '//tagx.nytimes.com';
    var env_deploy_msgHost = 'http://www.nytimes.com';
    var env_deploy_msgSocketHost = 'http://core.fabrik.nytimes.com';
    var env_deploy_communityHost = '//www.nytimes.com';
    var env_deploy_dataUniverseHost = 'http://www.nytimes.com';
    var env_deploy_comscorePvcHost = '//www.nytimes.com';
    var env_deploy_s1Host = '//s1.nyt.com';
    var env_deploy_mobileWebHost = '//mobile.nytimes.com';
    var env_deploy_searchHost = '//query.nytimes.com';
    var env_deploy_addHost = 'http://www.nytimes.com';
    var env_deploy_addHostNew = 'http://www.nytimes.com/svc/collections/v1/publish/www.nytimes.com/';
    var env_deploy_realestateHost = 'http://service-nytimes.gabriels.net';
    var env_deploy_realestateBasicSearchHost = 'http://realestate.nytimes.com/JSONSuggestService.aspx';
    var env_deploy_realestateSmartSearchHost = 'http://service-nytimes.gabriels.net/v1.1/SmartSearchResults.aspx';
    var env_deploy_realestateResultsHost = 'http://realestate.nytimes.com';
    var env_deploy_realestatePostAdLinkHost = '//realestateads.nytimes.com/';
    var env_deploy_realestateJsonHost = 'http://nyt-services.gabriels.net';
    var env_deploy_realestateSimilarListingsHost = 'http://nyt-services.gabriels.net/Listings/v1.0/NYT.Listings.svc/getSimilarListings';
    var env_deploy_followApiHost = 'http://www.nytimes.com/svc/pushmobile/follow/v0';
    var env_deploy_followListHost = 'http://s1.nyt.com/messaging/follow';
    var env_deploy_dfpHost = '/29390238/NYT/';
    var env_deploy_scoopToolHost = 'https://cms.em.nytimes.com';
    var env_deploy_personalizationHost = 'http://www.nytimes.com';
    var env_deploy_addSearchHost = 'http://search-add-api.prd.use1.nytimes.com';
    var env_deploy_readingListHost = 'http://reading-list.api.nytimes.com';
    var env_deploy_communityPersonasHost = 'https://ugc-personas.api.nytimes.com';

    var env_ADDCollectionHost = 'https://www.nytimes.com';
    var env_ADXHost = 'https://www.nytimes.com';
    var env_communityApiHost = 'https://www.nytimes.com';
    var env_DUHost = 'https://www.nytimes.com';
    var env_fabrikEndpointsHost = 'https://core.fabrik.nytimes.com';
    var env_followApiHost = 'http://www.nytimes.com';
    var env_marketsApiHost = 'https://markets.on.nytimes.com';
    var env_messagingHost = 'https://www.nytimes.com';
    var env_myaccountHost = 'https://myaccount.nytimes.com';
    var env_personalizationHost = 'https://www.nytimes.com';
    var env_personasApiHost = 'https://ugc-personas.api.nytimes.com';
    var env_profileImageHost = 'https://s3.amazonaws.com/pimage.timespeople.nytimes.com';
    var env_readingListApiHost = 'https://reading-list.api.nytimes.com';
    var env_s1Host = 'https://s1.nyt.com';
    var env_shortenHost = 'https://www.nytimes.com';
    var env_staticHost = 'https://static01.nyt.com';
    var env_tokenHost = 'https://www.nytimes.com';
    var env_userInfoHost = 'https://www.nytimes.com';
    var env_videoApiHost = 'https://www.nytimes.com';
    var env_weatherApiHost = 'https://www.nytimes.com';

    var env_wwwDomain = env_deploy_wwwHost.replace(/^(https?:)?\/\//, '');

    return {
        ADDCollectionHost: env_ADDCollectionHost,
        ADXHost: env_ADXHost,
        communityApiHost: env_communityApiHost,
        DUHost: env_DUHost,
        fabrikEndpointsHost: env_fabrikEndpointsHost,
        followApiHost: env_followApiHost,
        marketsApiHost: env_marketsApiHost,
        messagingHost: env_messagingHost,
        myaccountHost: env_myaccountHost,
        personalizationHost: env_personalizationHost,
        personasApiHost: env_personasApiHost,
        profileImageHost: env_profileImageHost,
        readingListApiHost: env_readingListApiHost,
        s1Host: env_s1Host,
        shortenHost: env_shortenHost,
        staticHost: env_staticHost,
        tokenHost: env_tokenHost,
        userInfoHost: env_userInfoHost,
        videoApiHost: env_videoApiHost,
        weatherApiHost: env_weatherApiHost,

        wwwDomain: env_wwwDomain,

        image: secure ? env_deploy_imageSecureHost : env_deploy_imageHost,
        js: secure ? env_deploy_jsSecureHost : env_deploy_jsHost,
        css: secure ? env_deploy_cssSecureHost : env_deploy_cssHost,
        json: secure ? env_deploy_jsonSecureHost : env_deploy_jsonHost,
        www: env_deploy_wwwHost,
        international: env_deploy_internationalHost,
        adx: env_deploy_adxHost,
        myaccount: env_deploy_authHost,
        meterSvc: env_deploy_mtrSvcHost,
        profileImage: env_deploy_profileImageHost,
        tagx: env_deploy_tagxHost,
        msg: env_deploy_msgHost,
        msgSocket: env_deploy_msgSocketHost,
        community: env_deploy_communityHost,
        du: env_deploy_dataUniverseHost,
        comscorePvc: env_deploy_comscorePvcHost,
        s1: env_deploy_s1Host,
        mobileWeb: env_deploy_mobileWebHost,
        search: env_deploy_searchHost,
        add: env_deploy_addHost,
        addNew: env_deploy_addHostNew,
        realestate: env_deploy_realestateHost,
        realestateBasicSearch: env_deploy_realestateBasicSearchHost,
        realestateSmartSearch: env_deploy_realestateSmartSearchHost,
        realestateResults: env_deploy_realestateResultsHost,
        realestatePostAdLink: env_deploy_realestatePostAdLinkHost,
        realestateJsonHost: env_deploy_realestateJsonHost,
        realestateSimilarListings: env_deploy_realestateSimilarListingsHost,
        followApi: env_deploy_followApiHost,
        followableList: env_deploy_followListHost,
        dfpHost: env_deploy_dfpHost,
        scoopTool: env_deploy_scoopToolHost,
        personalization: env_deploy_personalizationHost,
        addSearchHost: env_deploy_addSearchHost,
        readingListHost: env_deploy_readingListHost,
        communityPersonasHost: env_deploy_communityPersonasHost
    };
});
