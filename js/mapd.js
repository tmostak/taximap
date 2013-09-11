// Events:
// mapdreload:       tell MapD to reload
// pointmapreload:   tell PointMap to reload
// geocodeend:       geocoding service is ready

var BBOX = {
  WORLD: "-19313026.92,-6523983.06,14187182.33,12002425.38",
  US: "-13888497.96,2817023.96,-7450902.94,6340356.62"
};

function buildURI(params) {
  var uri = '';
  for (key in params) 
    uri += key + '=' + params[key] + '&';
  return encodeURI(uri.substring(0, uri.length - 1));
};

var MapD = {
  map: null,
  host: "http://192.168.1.90:8080/",
  table: "tweets",
//  timestart: (new Date('4/15/2013 12:00:00 AM GMT-0400').getTime()/1000).toFixed(0),
//  timeend: (new Date('4/16/2013 12:00:00 AM GMT-0400').getTime()/1000).toFixed(0),
  timestart: null,
  timeend: null,
  queryTerms: [],
  datastart: null,
  dataend: null,
  services: {
    pointmap: null,
    geotrends: null,
    topktokens: null, 
    tweets: null,
    graph: null
  },

  init: function(map, pointmap, geotrends, topktokens, tweets, graph) {
    this.map = map;
    this.services.pointmap = pointmap;
    this.services.geotrends = geotrends;
    this.services.topktokens = topktokens;
    this.services.tweets = tweets;
    this.services.graph = graph;
    this.map.events.register('moveend', this, this.reload);
    $(document).on('mapdreload', $.proxy(this.reload, this));
  },

  start: function() {
    $.getJSON(this.services.tweets.getTimeRangeURL()).done($.proxy(this.setDataTimeRange, this));
  },

  startCheck: function() {
    if (this.datastart != null && this.dataend != null) {
      this.timestart = this.datastart;
      this.timeend = this.dataend;
      this.reload();
    }
  },

  reload: function() {
    console.log('in reload');
    //this.services.geotrends.reload();
    this.services.topktokens.reload();
    this.services.tweets.reload();
    this.services.graph.reload();
  },

  reloadByGraph: function(start, end) {
    console.log('in reloadByGraph');
    var oldStart = this.timestart;
    var oldEnd = this.timeend;
    this.timestart = start;
    this.timeend = end;
    //this.services.geotrends.reload();
    this.services.topktokens.reload();
    this.services.tweets.reload();
    this.services.pointmap.reload();
    this.timestart = oldStart;
    this.timeend = oldEnd;
  },

  setDataStart: function(json) {
    this.datastart = json.results[0].time;
    this.startCheck();
  },

  setDataEnd: function(json) {
    this.dataend = json.results[0].time;
    this.startCheck();
  },


  setDataTimeRange: function(json) {
    this.datastart = json.results[0].min;
    this.dataend = json.results[0].max;
    this.startCheck();
  },


  setQueryTerms: function(queryTerms) {
    this.queryTerms = queryTerms.trim().split(" ").filter(function(d) {return d});
  },

  parseQueryTerms: function(queryTerms) { 
    var array = queryTerms.slice(0);
    for (i in array) {
      array[i] = "'" + array[i] + "'";
    }
    var whereTerms = array.join(" or tweet_text ilike ");
    whereTerms = "(tweet_text ilike " + whereTerms + ") ";
    return whereTerms;
  },

  getWhere: function(options) {
    var where = "";
    var timestart = this.timestart;
    var timeend = this.timeend;
    var queryTerms = this.queryTerms;
    if (options) {
      if (options.time) {
        timestart = options.time.timestart;
        timeend = options.time.timeend;
      }
      if ("queryTerms" in options)
        queryTerms = options.queryTerms;
    }

    if (timestart)
      where += "time >= " + timestart + " and ";
    if (timeend)
      where += "time <= " + timeend + " and ";
    if (queryTerms.length) {
      queryTerms = this.parseQueryTerms(queryTerms);
      where += queryTerms + " and ";
    }
    if (where)
      where = " where " + where.substr(0, where.length-5);
    console.log(where);
    return where;
  },
};

var GeoTrends = {
  mapd: MapD,
  binWidthPx: 96,
  binHeightPx: 96,
  params: {
    request: "GetGeoTrends",
    sql: null,
    bbox: null,
    timestart: null,
    timeend: null,
    xbins: 16,
    ybins: 16,
    tbins: 2,
    stoptable: "long_stop"
  },
  GRIDSIZE_SMALL: 64,
  GRIDSIZE_MEDIUM: 96,
  GRIDSIZE_LARGE: 128,

  getGridSize: function() {
    var size = [this.binWidthPx, this.binHeightPx]
    return size;
  },

  setGridSize: function(size) {
    this.binWidthPx = size;
    this.binHeightPx = size;
  },

  alignBBOX: function() {
    var map = this.mapd.map;
    var bbox = map.getExtent().toBBOX().split(',');
    var viewPortSize = map.getSize(); // in pixels
    var resolution = map.getResolution(); // meters per pixel
    var binWidth = this.binWidthPx * resolution;
    var binHeight = this.binHeightPx * resolution;
    var bboxLeft = Math.floor(bbox[0] / binWidth) * binWidth;
    var bboxRight = Math.ceil(bbox[2] / binWidth) * binWidth;
    var bboxBottom = Math.floor(bbox[1] / binWidth) * binHeight;
    var bboxTop = Math.ceil(bbox[3] / binWidth) * binHeight;
    this.params.bbox = [bboxLeft, bboxBottom, bboxRight, bboxTop].join();
    this.params.xbins = Math.round((bboxRight - bboxLeft) / binWidth);
    this.params.ybins = Math.round((bboxTop - bboxBottom) / binHeight);
  },

  getURL: function() {
    this.params.sql = "select goog_x, goog_y, time, tweet_text from " + this.mapd.table;
    this.params.sql += this.mapd.getWhere();
    this.params.timestart = this.mapd.timestart;
    this.params.timeend = this.mapd.timeend;
    this.alignBBOX();
    var url = this.mapd.host + '?' + buildURI(this.params);
    return url;
  },

  reload: function() {
    $.getJSON(this.getURL()).done($.proxy(onTrends, this, this.mapd.queryTerms));
  } 
};

var TopKTokens = {
  mapd: MapD,
  params: {
    request: "GetTopKTokens",
    sql: null,
    bbox: null,
    k: 20,
    stoptable: "long_stop"
  },

  getURL: function() {
    this.params.sql = "select tweet_text from " + this.mapd.table;
    this.params.sql += this.mapd.getWhere();
    this.params.bbox = this.mapd.map.getExtent().toBBOX();
    var url = this.mapd.host + '?' + buildURI(this.params);
    return url;
  },

  reload: function() {
    $.getJSON(this.getURL()).done(function(json) {console.log(json)});
  }
};

var PointMap = {
  mapd: MapD,
  wms: null,
  params: {
    request: "GetMap",
    sql: null,
    bbox: null,
    width: null,
    height: null,
    layers: "point",
    r: 0,
    g: 0,
    b: 100,
    radius: 1,
    format: "image/png",
    transparent: true
  },

  init: function(wms) {
    this.wms = wms;
    this.wms.events.register('retile', this, this.setWMSParams);
    $(document).on('pointmapreload', $.proxy(this.reload, this));
  },

  setWMSParams: function() {
    this.wms.params = OpenLayers.Util.extend(this.wms.params, this.getParams());
  },

  getParams: function() {
    this.params.sql = "select goog_x, goog_y, tweet_text from " + this.mapd.table;
    this.params.sql += this.mapd.getWhere();
    return this.params;
  },

  reload: function() {
    this.wms.mergeNewParams(this.getParams());
  }
};

var Tweets = 
{
  mapd: MapD,
  viewDiv: null,
  params: {
    request: "GetFeatureInfo",
    sql: null,
    bbox: null,
  },

  init: function(viewDiv) {
    this.viewDiv = viewDiv;
  },

  getTimeRangeURL: function() {
    this.params.sql = "select min(time), max(time) from " + this.mapd.table;
    this.params.bbox = this.mapd.map.getExtent().toBBOX();
    var url = this.mapd.host + '?' + buildURI(this.params);
    return url;
  },

  getURL: function(options) {
    this.params.sql = "select goog_x, goog_y, time, sender_name, tweet_text from " + this.mapd.table;
    this.params.sql += this.mapd.getWhere(options);
    this.params.sql += " order by time desc limit 20";
    this.params.bbox = this.mapd.map.getExtent().toBBOX();
    var url = this.mapd.host + '?' + buildURI(this.params);
    return url;
  },

  reload: function() {
    $.getJSON(this.getURL()).done($.proxy(this.onTweets, this));
  },

  onTweets: function(json) {
    console.log('in onTweets');
    this.viewDiv.empty();
    if (json == null) return;
    var results = json.results;
    for (i in results)
    {
      var result = results[i];
      if (!result || !result.tweet_text)
        continue;
      this.add(result);
    }
  },

  add: function(tweet) {
    var user = tweet.sender_name;
    var text = tweet.tweet_text;
    tweet.time = tweet.time - 4 * 60 * 60; // hack: original data set is ahead by 4 hours.
    var time = new Date(tweet.time * 1000);
    var x = tweet.goog_x;
    var y = tweet.goog_y;
    
    var container = $('<li></li>').addClass("tweet-container").appendTo(this.viewDiv);
    var header = $('<div></div>').addClass("tweet-header").appendTo(container);
    var content = $('<p></p>').addClass("tweet-content").appendTo(container);
    var profile = $('<a></a>').addClass("tweet-profile").appendTo(header);
    content.html(twttr.txt.autoLink(text));
    profile.html(user);
    profile.attr('href', 'https://twitter.com/' + user);

    var urls = twttr.txt.extractUrls(text);
    var hashtags = twttr.txt.extractHashtags(text);
    var users = twttr.txt.extractMentions(text);
    container.data({tweet: tweet, urls: urls, hashtags: hashtags, users: users});
    container.mouseenter(this.onMouseEnter);
    container.mouseleave(this.onMouseLeave);
  },

  addPopup: function(x, y, html) {
    var popupLatLon = new OpenLayers.LonLat(x, y);
    var popupSize = new OpenLayers.Size(50, 50);
    var popup = new OpenLayers.Popup.Anchored(null, popupLatLon, popupSize, html);
    this.mapd.map.addPopup(popup);
    popup.updateSize();
    console.log(popup);
  },

  // this points to <li> container 
  onMouseEnter: function() {
    var tweet = $(this).data('tweet');
    var user = tweet.sender_name;
    var x = tweet.goog_x;
    var y = tweet.goog_y;
    var label = new OpenLayers.Label(x, y, user, null, null, null);
    label.addTo(markers);
    $(label.getIcon()).addClass('label-user');
    $(this).data('label', label);
  },

  // this points to <li> container 
  onMouseLeave: function() {
    $(this).data('label').erase();
  },
};

var GeoCoder = {
  map: null,
  _geocoder: new google.maps.Geocoder(),
  address: null,
  status: null,

  setMap: function(map) {
    this.map = map;
  },

  geocode: function(address) {
    this.address = address;
    this._geocoder.geocode({'address': address}, $.proxy(this.onGeoCoding, this));
  },

  onGeoCoding: function(data, status) {
    console.log('in onGeoCoding');
    this.status = status;
    if (status != google.maps.GeocoderStatus.OK) {
      this.bbox = null;
      console.log('Geocoding service failed:', status);
      return;
    }
    if (data.length != 1)  {
      console.log('Geocoding service returned', data.length);
    }
    var viewport = data[0].geometry.viewport;
    var ne = viewport.getNorthEast();
    var sw = viewport.getSouthWest();
    var bounds = new OpenLayers.Bounds(sw.lng(), sw.lat(), ne.lng(), ne.lat());
    var proj = new OpenLayers.Projection("EPSG:4326");
    bounds.transform(proj, this.map.getProjectionObject());
    $(document).trigger({type: 'geocodeend', bounds: bounds});
  }
}

var Search = {
  geocoder: GeoCoder,
  mapd: MapD,
  map: null,
  form: null,
  termsInput: null,
  locationInput: null,
  terms: '',
  location: '',
  locationChanged: false,

  init: function(map, form, termsInput, locationInput) {
    this.map = map;
    this.form = form;
    this.termsInput = termsInput;
    this.locationInput = locationInput;
    this.geocoder.setMap(this.map);
    this.form.submit($.proxy(this.onSearch, this));
    $(document).on('geocodeend', $.proxy(this.onGeoCodeEnd, this));
    this.map.events.register('moveend', this, this.onMapMove);
  },
 
  onSearch: function() {
    console.log('in onSearch');
    var terms = this.termsInput.val();
    var location = this.locationInput.val();
    this.locationChanged = this.location != location;
    this.terms = terms;
    this.mapd.setQueryTerms(this.terms);

    if (this.locationChanged) {
      this.location = location;
      this.geocoder.geocode(this.location);
      return false;
    }
    $(document).trigger({type: 'mapdreload'});
    $(document).trigger({type: 'pointmapreload'});
    return false;
  },

  onGeoCodeEnd: function(event) {
    console.log('in onGeoCodeEnd');
    var bounds = event.bounds;
    this.map.zoomToExtent(bounds);
  },

  onMapMove: function() 
  {
    console.log('in onMapMove');
    if (this.locationChanged)
      this.locationChanged = false;
    else {
      this.location = "";
      this.locationInput.val("");
    }
  },
}

var Settings = {
  geotrends: GeoTrends,
  gridSmall: null,
  gridMedium: null,
  gridLarge: null,

  init: function(gridSmall, gridMedium, gridLarge) {
    this.gridSmall = gridSmall;
    this.gridMedium = gridMedium;
    this.gridLarge = gridLarge;
    this.gridSmall.click(this.geotrends.GRIDSIZE_SMALL, $.proxy(this.onChangeGridSize, this));
    this.gridMedium.click(this.geotrends.GRIDSIZE_MEDIUM, $.proxy(this.onChangeGridSize, this));
    this.gridLarge.click(this.geotrends.GRIDSIZE_LARGE, $.proxy(this.onChangeGridSize, this));
  },

  onChangeGridSize: function(event) {
    console.log('in onChangeGridSize');
    var size = event.data;
    var currentGridSize = this.geotrends.getGridSize();
    if (size != currentGridSize[0]) {
      this.geotrends.setGridSize(size);
      //this.geotrends.reload();
    }
  }
}

var Chart = 
{
  mapd: MapD,
  chart: LineChart,
  viewDiv: null,
  seriesId: 0,
  queryTerms: [],
  params: {
    request: "Graph",
    sql: null,
    bbox: null,
    histstart: null,
    histend: null,
    histbins: 100
  },

  init: function(viewDiv) {
    this.viewDiv = viewDiv;
    this.chart.init(d3.select(this.viewDiv.get(0)), $.proxy(this.onZoom, this), $.proxy(this.onCompare, this));
  },

  getWhere: function(options) {
    return this.mapd.getWhere(options);
  },
  
  getURL: function(options) {
    this.params.sql = "select time from " + this.mapd.table;
    this.params.sql += this.getWhere(options);
    this.params.histstart = this.mapd.timestart > this.mapd.datastart? this.mapd.timestart : this.mapd.datastart;
    this.params.histend = this.mapd.timeend < this.mapd.dataend? this.mapd.timeend : this.mapd.dataend;
    if (options && options.time) {
      this.params.histstart = options.time.timestart;
      this.params.histend = options.time.timeend;
    }
    this.params.bbox = this.mapd.map.getExtent().toBBOX();
    var url = this.mapd.host + '?' + buildURI(this.params);
    return url;
  },

  reload: function() {
    var queryTerms = this.queryTerms.slice(0);
    // for now, time range always corresponds to entire data range
    var options = {queryTerms: this.mapd.queryTerms, 
                   time: {timestart: this.mapd.datastart, timeend: this.mapd.dataend }};
    $.getJSON(this.getURL(options)).done($.proxy(this.onChart, this, this.mapd.queryTerms, true));
  },

  drawChart: function() {
    console.log('in drawChart', this);
  },

  onChart: function(queryTerms, clear, json) {
    console.log('in onChart', queryTerms);
    queryTerms = queryTerms.join(" ")
    if (clear) {
      this.seriesId = 0;
      this.queryTerms = [];
      this.chart.removeAll();
    }
    this.queryTerms.push(queryTerms);
    var series = [];
    for (i in json.x) {
      var time  = json.x[i];
      time = time - 4 * 60 * 60; // hack: original data set is ahead by 4 hours.
      var count = json.count[i];
      series.push({date: new Date(time * 1000), value: count});
    }
    this.chart.addSeries(this.seriesId, queryTerms, series);
    this.seriesId += 1;
  },

  onZoom: function() {
    console.log('in onZoom');
    var range = this.chart.getXRange();
    var start = (range[0].getTime()/1000).toFixed(0);
    var end = (range[1].getTime()/1000).toFixed(0)
    start = +start + 4 * 60 * 60; // hack: original data set is ahead by 4 hours.
    end = +end + 4 * 60 * 60; // hack: original data set is ahead by 4 hours.
    console.log(range, start, end);
    this.mapd.reloadByGraph(start, end);
  },

  onCompare: function(terms) {
    console.log('in onCompare');
    var queryTerms = terms.trim().split(" ").filter(function(d) {return d});
    // for now, time range always corresponds to entire data range
    var options = {queryTerms: queryTerms, time: {timestart: this.mapd.datastart, timeend: this.mapd.dataend }};
    $.getJSON(this.getURL(options)).done($.proxy(this.onChart, this, queryTerms, false));
  }
}
