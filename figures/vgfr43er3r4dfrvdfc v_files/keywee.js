(function(name){
    var path = window.location.pathname;	
    var fnv32a = function(str){
	var FNV1_32A_INIT = 0x811c9dc5;
	var hval = FNV1_32A_INIT;
	for ( var i = 0; i < str.length; ++i )
	{
	    hval ^= str.charCodeAt(i);
	    hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
	}
	return hval >>> 0;
    }
    var roundToTwo = function(num) {    
	return +(Math.round(num + "e+2")  + "e-2");
    }
    var slugifyString = function(text)
    {
	return text.toString().toLowerCase()
	    .replace(/\s+/g, '-')           // Replace spaces with -
	    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
	    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
	    .replace(/^-+/, '')             // Trim - from start of text
	    .replace(/-+$/, '');            // Trim - from end of text
    }
    var objectValues = function(object){
	var data_array = new Array;
	for(var o in object) {
	    if(object.hasOwnProperty(o)){
		data_array.push(object[o]);
	    }
	}
	return data_array;
    }
    var product_id = fnv32a(path);
    var category = null;
    var section = null;
    var latest_old_visit = null;
    var customizations = {};

    var sendPvEvent = function(){
	if(fbq){
	    fbq('track', 'ViewContent', {
		content_category: category,
		content_ids: [product_id],
		content_type: 'product',
		value: 1.00,
		currency: 'USD'
	    });		
	}	
    }
    var sendCheckoutEvent = function(){
	if(fbq){
	    fbq('track', 'AddToCart', {
		content_ids: [product_id],
		content_type: 'product',
		value: 1.00,
		currency: 'USD'
	    });		
	}
    }
    var sendPurchaseEvent = function(){
	if(fbq){
	    fbq('track', 'Purchase', {
		content_ids: [product_id],
		content_type: 'product',
		value: 1.00,
		currency: 'USD'
	    });		
	}
    }
    var sendKeyweeEvent = function(event_data){
	if(fbq){
	    fbq('trackCustom', 'KeyweeCE1',event_data);
	}
    };    
    var date_str = function(date) {
	var yyyy = date.getFullYear().toString();
	var mm = (date.getMonth()+1).toString(); // getMonth() is zero-based
	var dd  = date.getDate().toString();
	return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]); // padding
    };
    var first_load_time = new Date();
    var last_time_spent_on_page = 0;
    var today_str = date_str(first_load_time);
    var last_30_days_date_str = date_str(new Date(new Date().setDate(first_load_time.getDate()-30)));
    var last_180_days_date_str = date_str(new Date(new Date().setDate(first_load_time.getDate()-180)));    
    var first_month_date_str = date_str(new Date(first_load_time.getFullYear(), first_load_time.getMonth(), 1));
    var current_visited_article = document.title;
    var is_keywee_article = window.location.href.indexOf("kwp_4=")  > 0;
    var max_vertical_position = 0;
    var previous_vertical_postion = null;
    var getKeyweeHistory = function(){
	if(localStorage && localStorage.keyweeHistory){
	    return JSON.parse(localStorage.keyweeHistory);
	}
	else {
	    return {};
	}
    }
    var setKeyweeHistory = function(history){
	if(localStorage){
	    localStorage.keyweeHistory =  JSON.stringify(history);
	}
    }
    var getDailyData = function(date){
	var history = getKeyweeHistory()
	var data = history[date]
	return data || {date: date}
    }
    var setDailyData = function(date,data){
	var history = getKeyweeHistory();
	history[date] = data;
	setKeyweeHistory(history);
    }
    var updateData = function(forced_date){
	var daily_data = getDailyData(forced_date || today_str);
	var category_data;
	var current_time_spent_on_page = roundToTwo((new Date() - first_load_time) / 60000);
	if(!daily_data.categories){
	    daily_data.categories = {};
	}
	if(!daily_data.categories[category]){
	    daily_data.categories[category] = {
		articles_read: 0,
		keywee_articles_read: 0,
		time_spent: 0,
		category: category,
	    };
	}
	category_data = daily_data.categories[category];
	if(category_data.last_visited_article != current_visited_article){
	    category_data.articles_read++;
	    if(is_keywee_article){
		category_data.keywee_articles_read++;
	    }
	    category_data.last_visited_article = current_visited_article;
	}
	category_data.time_spent = category_data.time_spent - last_time_spent_on_page + current_time_spent_on_page;
	last_time_spent_on_page = current_time_spent_on_page;
	setDailyData(forced_date || today_str,daily_data);
	return daily_data;
    }
    var getDatesBetween = function(keywee_history,min_date,max_date){
	return Object.keys(keywee_history).filter(function(historical_date){		
	    return (historical_date >= min_date) && (!max_date || historical_date <= max_date)
	})
    };
    var getDataBetweensDates = function(min_date,max_date){
	var keywee_history = getKeyweeHistory();
	return getDatesBetween(keywee_history,min_date,max_date).map(function(date){
	    return keywee_history[date];
	})
    }
    var getLatestOldVisit = function(){
	var oldest_visit_date = null;
	if(localStorage && localStorage.keywee_oldest_visit_date){
	    oldest_visit_date = localStorage.keywee_oldest_visit_date;
	}	    
	return oldest_visit_date;
    };
    var setLatestOldVisit = function(){
	var keywee_history = getKeyweeHistory();
	var older_dates = getDatesBetween(keywee_history,last_180_days_date_str,last_30_days_date_str);	    
	var oldest_visit_date = getLatestOldVisit();	    
	if(oldest_visit_date < last_180_days_date_str){
	    oldest_visit_date = null;
	}	    
	if(older_dates.length > 0){
	    oldest_visit_date = older_dates.sort()[older_dates.length - 1];
	}
	if(localStorage){
	    if(oldest_visit_date){
		localStorage.keywee_oldest_visit_date = oldest_visit_date;
	    }
	    else{
		localStorage.removeItem("keywee_oldest_visit_date")
	    }
	}
	return oldest_visit_date;
    }
    var cleanOldData = function(forced_date){
	var earliest_allowed_date = last_30_days_date_str;
	var recent_data;
	var updated_history = {};
	if(first_month_date_str < earliest_allowed_date){
	    earliest_allowed_date = first_month_date_str;
	}
	if(forced_date){
	    earliest_allowed_date = forced_date;
	}
	recent_data = getDataBetweensDates(earliest_allowed_date);		
	recent_data.forEach(function(historical_data){
	    updated_history[historical_data.date] = historical_data
	});
	setKeyweeHistory(updated_history);
	
    }
    var getEventToSend = function(){
	var data_last_30d = getDataBetweensDates(last_30_days_date_str);
	var data_this_month = getDataBetweensDates(first_month_date_str);
	var extract_categories_data = function(rows){
	    if(rows.length == 1){
		return objectValues(rows[0].categories);
	    }	    
	    return  rows.reduce(function(all,row){
		return all.concat(objectValues(row.categories));
	    },[]);
	}
	var sum_rows_by = function(rows,field){
	    if(rows.length == 1){
		return rows[0][field];
	    }
	    return rows.reduce(function(sum,row){
		return sum + row[field];
	    },0);
	};
	var first_letters = function(field){
	    return field.split("_").map(function(word){
		return word[0];
	    }).join("");
	};
	var normalized_category = slugifyString(category);
	var aggregative_fields = ["articles_read","keywee_articles_read","time_spent"];
	var flat_categories_data_30d = extract_categories_data(data_last_30d);
	var flat_categories_data_this_month = extract_categories_data(data_this_month);		    
	var flat_current_category_30d = flat_categories_data_30d.filter(function(row){
	    return row.category == category;
	})
	var flat_current_category_this_month = flat_categories_data_this_month.filter(function(row){
	    return row.category == category;
	});
	var num_of_active_days_30d = data_last_30d.length;
	var num_of_active_days_cal_month = data_this_month.length;
	var vertical_location = getVerticalLocPercentage();
	if(vertical_location > max_vertical_position){		
	    max_vertical_position = vertical_location;
	}
	var steps = {
	    tsop: [2,5,10],
	    lop: [20,50,75,90],
	    noad30: [3,5,10],
	    ar30d: [3,5,10],
	    ts30d: [10,30,60,180]
	}
	var event = {
	    category: category,
	    section: section,
	    tsop: last_time_spent_on_page,
	    lop: max_vertical_position,
	    noad30: num_of_active_days_30d,
	    noadic30: flat_current_category_30d.length,
	    nodaiccm: flat_current_category_this_month.length,
	    nodacm: num_of_active_days_cal_month,	   	    
	}
	if(latest_old_visit){
	    event.lov = latest_old_visit;
	}
	if(latest_old_visit && num_of_active_days_30d >= 2){
	    event.core = 1;
	}
	event["cat-"+normalized_category] = 1;
	aggregative_fields.forEach(function(field){
	    var field_short = first_letters(field);
	    var field_name_30d = field_short + "30d";
	    var field_name_last_month = field_short + "cm";
	    var field_name_in_cat_30d = field_short + "ic30d";
	    var field_name_in_cat_last_month = field_short + "iccm";
	    var fields_and_data = [
		[field_name_30d,flat_categories_data_30d],
		[field_name_last_month,flat_categories_data_this_month],
		[field_name_in_cat_30d,flat_current_category_30d],
		[field_name_in_cat_last_month,flat_current_category_this_month],
	    ]
	    fields_and_data.forEach(function(field_and_data){
		var field_name = field_and_data[0];
		var data = field_and_data[1];
		var sum =  sum_rows_by(data,field);
		event[field_name] = roundToTwo(sum);
	    });
	});	
	Object.keys(steps).forEach(function(metric){
	    var metric_steps = steps[metric];
	    var limit = 0;
	    for (var i = metric_steps.length - 1; i >=  0; i--) {
		limit = metric_steps[i - 1]
		if(event[metric] >= limit){
		    event["met-"+metric+"_gr"+ limit] = 1
		    break;
		}
	    }
	});
	return event;
    }
    var getVerticalLocPercentage = function(){
	var article_container_height = null;
	var wintop = window.pageYOffset || document.documentElement.scrollTop;	    
	var body = document.body;
	var html = document.documentElement;	   
	var docheight = Math.max(body.scrollHeight,body.offsetHeight,html.clientHeight, html.scrollHeight,html.offsetHeight);
	var winheight = window.innerHeight;
	if(customizations.getArticleContainerHeight){
	    article_container_height = customizations.getArticleContainerHeight();
	}
	if(article_container_height){
	    docheight = article_container_height;
	}
	return roundToTwo(Math.min(100,(wintop/(docheight-winheight))*100));	
    }    
    var sendUpdatedEvent = function(){
	var current_vertical_location = getVerticalLocPercentage();
	var event = null;
	var postion_changed = current_vertical_location != previous_vertical_postion;
	var current_time_spent_on_page = roundToTwo((new Date() - first_load_time) / 60000);
	var too_much_tsop = current_time_spent_on_page > 30;
	if(postion_changed && ! too_much_tsop){
	    updateData();	
	    event = getEventToSend();
 	    sendKeyweeEvent(event);
	    previous_vertical_postion = current_vertical_location;
	}
    }

    var init = function(options){
	try {
	    customizations = options
	    setLatestOldVisit();
	    if(customizations.getCategory){
		category = customizations.getCategory();
	    }
	    if(customizations.getSection){
		section = customizations.getSection();
	    }
	    if(customizations.checkoutEventListener){
		customizations.checkoutEventListener(sendCheckoutEvent);
	    }
	    if(customizations.purchaseEventListener){
		customizations.purchaseEventListener(sendPurchaseEvent);
	    }
 	    latest_old_visit = getLatestOldVisit();
	    if(category){
		sendPvEvent();
		cleanOldData();
		sendUpdatedEvent();
		setInterval(sendUpdatedEvent,30000);	
	    }
	}
	catch (e) {
	    console.log("Exception:" + e);
	}
    }
    var Keywee = {};   
    window[name] = Keywee;
    Keywee.getKeyweeHistory = getKeyweeHistory
    Keywee.updateData = updateData;
    Keywee.today_str = today_str;
    Keywee.getEventToSend = getEventToSend;
    Keywee.cleanOldData = cleanOldData;
    Keywee.sendKeyweeEvent = sendKeyweeEvent;
    Keywee.sendUpdatedEvent = sendUpdatedEvent;
    Keywee.getLatestOldVisit = getLatestOldVisit;
    Keywee.setLatestOldVisit = setLatestOldVisit;
    Keywee.init = init;
    return Keywee;    
})("Keywee");

(function(p,l,o,w,i,n,g){if(!p[i]){p.GlobalSnowplowNamespace=p.GlobalSnowplowNamespace||[];p.GlobalSnowplowNamespace.push(i);p[i]=function(){(p[i].q=p[i].q||[]).push(arguments)};p[i].q=p[i].q||[];n=l.createElement(o);g=l.getElementsByTagName(o)[0];n.async=1;n.src=w;g.parentNode.insertBefore(n,g)}}(window,document,"script","//dc8xl0ndzn2cb.cloudfront.net/sp.js","snowplow"));  
(function() {
 !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','//connect.facebook.net/en_US/fbevents.js');
fbq('init', '100468016962764');
fbq('track', "PageView");
})();
(function() {
    var cookie_domain = '.nytimes.com';
    window.snowplow('newTracker', 'cf', 'p2.keywee.co', {
	appId: '18',
	cookieDomain: cookie_domain
    });
    function setKeyweeAdId(){
	var createCookie = function(name, value, days,domain) {
	    var expires;
	    var cookie;
	    if (days) {
		var date = new Date();
		date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
		expires = "; expires=" + date.toGMTString();
	    }
	    else {
		expires = "";
	    }
	    cookie = name + "=" + value + expires + "; path=/;"
	    if(domain){
		cookie = cookie + " Domain="+domain;
	    }
	      document.cookie = cookie;
	};
	var identifier = 'kwp_4';    
	var cookie_identifier = "keywee." + identifier;
	var url_value_match = new RegExp(identifier + "=([^&#]*)", "i").exec(window.location.href); 
	var ad_id = url_value_match && unescape(url_value_match[1]) || "";
	if(ad_id != ""){
	    createCookie(cookie_identifier,ad_id,30,cookie_domain);
	}
	window.snowplow('setUserIdFromCookie', cookie_identifier)    
    }    
    setKeyweeAdId();
    window.snowplow('enableActivityTracking', 30, 30);
    window.snowplow('trackPageView');
})();   
(function(){
    var getCategory = function(){
	var cat = null;
	var cat_element = document.querySelector('meta[name="CG"]');	    
	if(cat_element){
	    cat = cat_element.getAttribute("content");
	}
	return cat;
    }
    var getSection = function(){
	var section = null;
	var section_element = document.querySelector('meta[property="article:section"]');	    
	if(section_element){
	    section = section_element.getAttribute("content");
	}
	return section;
    }    
    Keywee.init({
	getCategory: getCategory,
	getSection: getSection,
	getArticleContainerHeight: function(){
	    var e = document.querySelector('#story');
	    if(e){
	    var rect = e.getBoundingClientRect();
	    return rect.top + document.body.scrollTop + rect.height;
	    }
	    return 0;
	},
	checkoutEventListener: function(onCheckout){
	    if(window.location.href.indexOf("myaccount.nytimes.com/mem/purchase") > 0){
		onCheckout();
	    }
	},
	purchaseEventListener: function(onPurchase){
	    if(Event && Event.observe){
		Event.observe(document, "NYTD: User Subscription Complete",onPurchase);	    		
	    }
	},
    });
})();






