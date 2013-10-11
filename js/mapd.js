// Events:
// heatmapreload:    tell HeatMap to reload
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
  host: "http://mapd.csail.mit.edu:8080/",
  //host: "http://www.velocidy.net:7000/",
  table: "tweets",
  timestart: null,
  timeend: null,
  queryTerms: [],
  user: null,
  datastart: null,
  dataend: null,
  linkButton: null,
  services: {
    pointmap: null,
    heatmap: null,
    geotrends: null,
    topktokens: null, 
    tweets: null,
    graph: null,
    search: null,
    settings: null,
    tweetclick: null,
    animation: null
  },



  init: function(map, pointmap, heatmap, geotrends, topktokens, tweets, graph, search, settings, tweetclick, animation) {
  
    //$("#dataDisplayBarchart").click(function() {console.log($(this).attr("id"));});  
    if (window.location.search == "?local")
        this.host = "http://sirubu.velocidy.net:8080";
      
    this.map = map;
    
    $("#clipboard-share").click(function() {
        var link = MapD.writeLink(false);
        console.log(link);
        $("#link-dialog").html(link).dialog({width: 900});
    });

    $("#twitter-share").on('click', $.proxy(this.sendTweet, this));
    $("#facebook-share").on('click', $.proxy(this.facebookShare, this));
        
    this.services.pointmap = pointmap;
    this.services.heatmap = heatmap;
    this.services.geotrends = geotrends;
    this.services.topktokens = topktokens;
    this.services.tweets = tweets;
    this.services.graph = graph;
    this.services.search = search;
    this.services.settings = settings;
    this.services.tweetclick = tweetclick;
    this.services.animation = animation;
    this.map.events.register('moveend', this, this.reload);

    $(".olControlZoomPanel").css("top",17);

    
    $(document).on('mapdreload', $.proxy(this.reload, this));
  },

  facebookShare: function() {
    var link = this.writeLink(true);
    console.log(link);
    var countLinkUrl= "http://mapd.csail.mit.edu/tweetmap";
    var message = "Check out this interactive tweetmap I made with GPU-powered mapD!"; 
    window.open(
        'https://www.facebook.com/sharer/sharer.php?u=' + link, 'facebook-share-dialog', 'width=626,height=436');
    },
        

  sendTweet: function() {
    var link = this.writeLink(true);
    console.log(link);
    var countLinkUrl= "http://mapd.csail.mit.edu/tweetmap";
    var message = "Check out this interactive tweetmap I made with GPU-powered mapD!"; 
    window.open("https://twitter.com/share?" +
        "url=" + link +
        "&counturl=" + encodeURIComponent(countLinkUrl) +
        "&text=" + encodeURIComponent(message) +
        "&hashtags=" + encodeURIComponent('tweetmap,mapD') +
        "&via=" + encodeURIComponent('datarefined'),
        "twitter", "width=500,height=300");
    },
  start: function() {
    $.getJSON(this.services.tweets.getTimeRangeURL()).done($.proxy(this.setDataTimeRange, this));
  },

  startCheck: function() {
    if (this.datastart != null && this.dataend != null) {
      this.timeend = Math.round((this.dataend-this.datastart)*.99 + this.datastart);
      this.timestart = Math.max(this.dataend - 43200,  Math.round((this.dataend-this.datastart)*.5 + this.datastart));

      

      var mapParams = {extent: new OpenLayers.Bounds(BBOX.WORLD.split(',')), pointOn: 1, heatOn: 0, dataDisplay: "Cloud", dataSource: "Words", dataMode: "Counts",  dataLocked: 0, t0: this.timestart, t1: this.timeend};
      mapParams = this.readLink(mapParams);
      console.log(mapParams);
      this.timestart = mapParams.t0;
      this.timeend = mapParams.t1;
      if ("what" in mapParams) {
        this.services.search.termsInput.val(params.what);
        $('#termsInput').trigger('input');
      } if ("who" in mapParams) {
        this.services.search.userInput.val(params.who);
        $('#userInput').trigger('input');
      }
      this.services.topktokens.setMenuItem("Display", mapParams.dataDisplay, false);
      this.services.topktokens.setMenuItem("Source", mapParams.dataSource, false);
      this.services.topktokens.setMenuItem("Mode", mapParams.dataMode, false);

      //this.services.topktokens.displayMode = mapParams.dataMode;
      /*
      if (mapParams.dataMode == "cloud")
        $("#cloudDisplay").prop('checked', 'checked');
      else 
        $("#barDisplay").prop('checked', 'checked');
      $("#displayMode").buttonset("refresh");
      */
      /*
      switch (mapParams.dataSource) {
        case "words":
          this.services.topktokens.dataSource = "words";
          $('#dataWords').prop('checked', 'checked');
          break;
        case "users":
          this.services.topktokens.dataSource = "users";
          $('#dataUsers').prop('checked', 'checked');
          break;
        case "geo":
          this.services.topktokens.dataSource = "geo";
          $('#dataGeo').prop('checked', 'checked');
          break;
        case "origin":
          this.services.topktokens.dataSource = "origin";
          $('#dataOrigin').prop('checked', 'checked');
      }
       $('#dataSource').buttonset("refresh");
       */

      /*
      if (mapParams.dataLocked == 1)
        this.services.topktokens.lockClickFunction(); 
      */
      if ("cx" in mapParams) {
        this.map.setCenter(new OpenLayers.LonLat(mapParams.cx, mapParams.cy));
        this.map.zoomTo(mapParams.zoom);
      }
      else {
        this.map.zoomToExtent(mapParams.extent);
      }
      this.services.search.form.submit();
      console.log("Point: " + mapParams.pointOn);
      console.log("Heat: " + mapParams.heatOn);
      if (mapParams.pointOn == 1)
        this.services.settings.pointButtonFunction();
      if (mapParams.heatOn == 1)
        this.services.settings.heatButtonFunction();

      //pointLayer.setVisibility(mapParams.pointOn);
      //heatLayer.setVisibility(mapParams.heatOn);
      //Settings.init(pointLayer, heatLayer, $('button#pointButton'), $('button#heatButton'));

      /*
      this.reloadByGraph(this.timestart, this.timeend);
      if (!linkRead)
        this.reload();
      */
    }
  },
  writeLink: function(fullEncode) {
    var url = document.URL.split('?')[0] + "?";
    //var mapExtent = this.map.getExtent().toBBOX().split(',');
    var center = map.getCenter();
    //var uriParams = {t0: this.timestart, t1: this.timeend, x0: mapExtent[0], y0: mapExtent[1], x1: mapExtent[2], y1: mapExtent[3]};
    var uriParams = {t0: this.timestart, t1: this.timeend, cx: center.lon, cy: center.lat, zoom: map.getZoom()};

    var what = this.services.search.termsInput.val();
    if (what != "") 
      uriParams.what = what;
    var who = this.services.search.userInput.val();
    if (who != "") 
      uriParams.who = who;
    uriParams.pointOn = pointLayer.getVisibility() == true ? 1 : 0; 
    uriParams.heatOn = heatLayer.getVisibility() == true ? 1 : 0; 
    uriParams.dataDisplay = this.services.topktokens.displaySetting;
    uriParams.dataSource = this.services.topktokens.sourceSetting;
    uriParams.dataMode = this.services.topktokens.modeSetting;
    uriParams.dataLocked = this.services.topktokens.locked == true ? 1 : 0;
   
    var uri = buildURI(uriParams);
    if (fullEncode)
        url += encodeURIComponent(uri);
    else 
        url += uri;
    //url = encodeURI(url);

    //console.log(url);
    return url;

  },

  readLink: function(mapParams) {
    if (window.location.search.substr(0,1) == "?") {
      console.log("params");
      params = this.getURIJson();
      console.log(params);
      for (var attr in params)
        mapParams[attr] =  params[attr];
    }
    return mapParams;
  },

  getURIJson: function() {
    var queryString = location.search.substring(1);
    var obj = {}
    var pairs = queryString.split('&');
    for(i in pairs){
      var split = pairs[i].split('=');
      obj[decodeURIComponent(split[0])] = decodeURIComponent(split[1]);
    }
    return obj;

    /*JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}', function(key, value) { return key===""?value:decodeURIComponent(value) }):{};
    return search; */
  },

  reload: function() {
    //console.log('in reload');
    this.services.geotrends.reload();
    this.services.topktokens.reload();
    this.services.tweets.reload();
    this.services.graph.reload();
  },

  reloadByGraph: function(start, end) {
    //console.log('in reloadByGraph');
    //var oldStart = this.timestart;
    //var oldEnd = this.timeend;
    this.timestart = start;
    this.timeend = end;
    if (this.services.animation.isAnimating()) { // only need to refresh point and heatmaps in this case - done by stopFunc
      this.services.animation.stopFunc();
    }
    else {
      this.services.geotrends.reload();
      this.services.topktokens.reload();
      this.services.tweets.reload();
      this.services.pointmap.reload();
      this.services.heatmap.reload();
    }
    //this.timestart = oldStart;
    //this.timeend = oldEnd;
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


  setUser: function(user) {
    this.user = user;
  },

  setQueryTerms: function(queryTerms) {
    this.queryTerms = queryTerms.trim().split(" ").filter(function(d) {return d});
  },

  parseQueryTerms: function(queryTerms) { 
    console.log(queryTerms);
    if (queryTerms[0] == "multilanguage:") {
        var query = "tweet_text ilike 'coffee' or tweet_text ilike 'café' or tweet_text ilike 'caffè' or tweet_text ilike 'kaffe' or tweet_text ilike 'kaffe' or tweet_text ilike 'кофе' or tweet_text ilike 'kahve' or tweet_text ilike 'قهوة' or tweet_text ilike '咖啡' or tweet_text ilike '커피' or tweet_text ilike 'コーヒー' or tweet_text ilike 'kopi'";
	return query;
    }
    else if (queryTerms[0] == "origin:") {
        var query = "(origin ilike '" + queryTerms[1] + "')";
        return query;
    }
    else if (queryTerms[0] == "country:") {
        console.log("country");
        var term = "";
        for (var q = 1; q < queryTerms.length; q++) 
            term += queryTerms[q] + " ";
        term = term.substr(0, term.length - 1);
        var query = "(country ilike '" + term + "')";
        return query;
    }
    else {
        var array = queryTerms.slice(0);
        for (i in array) {
          array[i] = "'" + array[i].replace("'", "''").replace(/["]/g, '').replace("&", "") + "'";
        }
        var whereTerms = array.join(" and tweet_text ilike ");
        whereTerms = "(tweet_text ilike " + whereTerms + ") ";
    }
    return whereTerms;
  },

  getTermsAndUserQuery: function (queryTerms, user ) {
    var query = ""; 
    if (queryTerms.length) {
      queryTerms = this.parseQueryTerms(queryTerms);
      query += queryTerms + " and ";
    }
    if (user)
      query += "sender_name ilike '" + user + "' and ";
    return query;
  },

  getTimeQuery: function (timestart, timeend) {
    var query = "";
    if (timestart)
      query += "time >= " + timestart + " and ";
    if (timeend)
      query += "time <= " + timeend + " and ";
    return query;
  },

  getWhere: function(options) {
    var timestart = this.timestart;
    var timeend = this.timeend;
    var user = this.user;
    var splitQuery = false; // don't split query into two parts 
    var queryTerms = this.queryTerms;
    if (options) {
      if (options.time) {
        timestart = options.time.timestart;
        timeend = options.time.timeend;
      }
      if ("queryTerms" in options)
        queryTerms = options.queryTerms;
      if ("user" in options) {
        user = options.user;
      }
      if ("splitQuery" in options) 
        splitQuery = options.splitQuery;
    }
    
      if (splitQuery) {
        var queryArray = new Array(2);
        queryArray[0] = this.getTermsAndUserQuery(queryTerms, user);
        if (queryArray[0])
          queryArray[0] = queryArray[0].substr(0, queryArray[0].length-5);
        queryArray[1] = this.getTimeQuery(timestart, timeend);
        if (queryArray[1])
          queryArray[1] = " where " + queryArray[1].substr(0, queryArray[1].length-5);
        return queryArray;

      }
      else {
        var whereQuery = this.getTimeQuery(timestart, timeend) + this.getTermsAndUserQuery(queryTerms, user);
        if (whereQuery)
          whereQuery = " where " + whereQuery.substr(0, whereQuery.length-5);
        return whereQuery;
      }
  }
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
    //stoptable: "multistop"
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
    //$.getJSON(this.getURL()).done($.proxy(onTrends, this, this.mapd.queryTerms));
  } 
};

var TopKTokens = {
  mapd: MapD,
  displayDiv: null, 
  defaultCloudK: 30,
  defaultChartK: 15,
  displaySetting: null,
  sourceSetting: null,
  modeSetting: null,
  settingDict: {Display: 'displaySetting', Source: 'sourceSetting', Mode: 'modeSetting'},
  locked: false,
  tokens: [],
  params: {
    request: "GroupByToken",
    sql: null,
    bbox: null,
    k: 30,
    stoptable: "multistop",
    sort: "true",
    tokens: []
  },

  init: function(displayDiv) {
    this.displayDiv = displayDiv;
    $(".drop-menu").click($.proxy(function(e) {
      var menu;
      var choice = this.getMenuItemClicked(e.target);
      if ($(e.currentTarget).hasClass("display-menu")) {
        menu="Display";
      }
      else if ($(e.currentTarget).hasClass("source-menu")) {
        menu="Source";
      }
      else if ($(e.currentTarget).hasClass("mode-menu")) {
        menu="Mode";
      }
      this.setMenuItem(menu, choice, true);
    }
    , this));  

    $("#lock").button({
        text:false,
        icons: {
            primary: "ui-icon-unlocked"
        }
    })
    .click($.proxy(this.lockClickFunction, this));
    
    /*
     
    $('input[name="displayMode"]').change($.proxy(function (event) {
       this.displayMode = event.target.value;
       if (this.displayMode == "cloud")
            $(this.displayDiv).click($.proxy(this.addClickedWord, this)); 
        else
            $(this.displayDiv).off('click');

       this.reload();
    }, this));

    $('input[name="dataSource"]').change($.proxy(function (event) {
       this.dataSource = event.target.value;
       if (this.locked)
         this.lockClickFunction(true);

       this.reload();
    }, this));

    $('input[name="dataNums"]').change($.proxy(function (event) {
       this.dataNums = event.target.value;
       this.reload();
    }, this));


    $('input[name="cloudSource"]').change($.proxy(function (radio) {
        console.log($(radio).val());
        //console.log($(this));
        //console.log($(radio).val());
    }, this, $('input[name="cloudSource"]')));
    */
    //$(this.displayDiv).click($.proxy(this.addClickedWord, this)); 

  },
  
  getMenuItemClicked: function(target) {
    if (target.localName != "span")
        innerText = target.firstChild.innerText;
    else {
        if (target.className == "checkmark")
            innerText = target.parentElement.firstChild.innerText;
        else
            innerText = target.innerText;
            
    }
    return innerText;
  },

  setMenuItem: function(menu, choice, reload) {   
    var menuDiv = "#data" + menu;
    var dropdownDiv = menuDiv + "Dropdown";
    var choiceDiv = menuDiv + choice;
    console.log(menuDiv);
    console.log(choiceDiv);
    $(dropdownDiv + " span.checkmark").css("visibility", "hidden");
    $(choiceDiv + " .checkmark").css("visibility","visible");
    $(menuDiv + " span.menu-text").text(choice);
    this[this.settingDict[menu]] = choice;
    console.log ("aaaaa " + this[this.settingDict[menu]]);
    console.log($(dropdownDiv));
    $(dropdownDiv).removeClass('dropdown-open');
    if (choice == "Cloud")
      $(this.displayDiv).click($.proxy(this.addClickedWord, this)); 
    else if (choice == "Barchart")
      $(this.displayDiv).off('click');

    if (reload)
      this.reload();
  },

  lockClickFunction: function (preventReload) {  
        var options;
        var lock = $("#lock");
        if (lock.text() === "unlocked") {
            options = {
                label: "locked",
                icons: {
                    primary: "ui-icon-locked"
                }
            };
            this.locked = true;
            //this.params.sort = "false";
        } 
        else {
            options = {
                label: "unlocked",
                icons: {
                    primary: "ui-icon-unlocked"
                }
            };
            this.locked = false;
            //this.params.sort = "true";
            if (preventReload != true)
                this.reload();
        }
        $("#lock").button("option",options);
    },

  getURL: function(options) {
    var numQueryTerms = this.mapd.queryTerms.length;
    /*
    if (numQueryTerms > 0) { // hack - doesnt work for who
      //$("#dataPercents").attr('disabled', false);
    }
    else
      $("#dataPercents").attr('disabled', true);
    */
    //$("#dataNums").buttonset("refresh");
    /*
    if (this.dataNums == "percents") { 
      if (options == undefined || options == null) 
        options = {splitQuery: true};
      else
        options.splitQuery = true;
    }
    */

    var query = this.mapd.getWhere(options);
    console.log("query: " + query);

    this.params.stoptable = "";
    console.log(this.sourceSetting);
    if (this.sourceSetting == "Words") {
        this.params.sql = "select tweet_text";
        this.params.stoptable = "multistop";
    }
    else if (this.sourceSetting == "Users") {
        this.params.sql = "select sender_name";
    }
    else if (this.sourceSetting == "Countries") {
        this.params.sql = "select country";
    }
    else if (this.sourceSetting == "OS-App") {
        this.params.sql = "select origin";
    }
   

    //if (this.dataNums == "percents") 
    //  this.params.sql += "," + query[0] + " from " + this.mapd.table + query[1]; 
    //else
      this.params.sql += " from " + this.mapd.table + query; 

    if (this.displaySetting == "Cloud")
        this.params.k = this.defaultCloudK + numQueryTerms;
    else
        this.params.k = this.defaultChartK ;

    if (this.locked) {
        this.params.tokens = this.tokens;
        this.params.sort = "false";
    }
    else {
        this.params.sort = "true";
        this.params.tokens = [];
    }
    console.log("Sql: " + this.params.sql);
    this.params.bbox = this.mapd.map.getExtent().toBBOX();
    var url = this.mapd.host + '?' + buildURI(this.params);
    return url;
  },
  barClickCallback: function(token) {
    
    if (this.sourceSetting == "Words") {
      this.mapd.services.search.termsInput.val(this.mapd.services.search.termsInput.val() + " " + token);
      $('#termsInput').trigger('input');
    }
    else if (this.sourceSetting == "Users") {
      this.mapd.services.search.userInput.val(token);
      $('#userInput').trigger('input');
      this.setMenuItem("Source", "Words", false);
    }
    else if (this.sourceSetting == "Countries") {
      this.mapd.services.search.termsInput.val("country: " + token);
      $('termsInput').trigger('input');
      this.setMenuItem("Source", "Words", false);
    }
    else if (this.sourceSetting == "OS-App") {
      this.mapd.services.search.termsInput.val("origin: " + token);
      $('termsInput').trigger('input');
      this.setMenuItem("Source", "Words", false);
    }

    this.mapd.services.search.form.submit();
  },


  addClickedWord: function(event) {
    console.log(event);
    //var token = event.originalEvent.srcElement.innerText;
    var token = event.target.innerHTML;
    //console.log("circle cloud token: " + token);
    if (token.substring(0,5) != "<span") {
      //console.log(this.mapd);
      if (this.sourceSetting == "Words") {
        this.mapd.services.search.termsInput.val(this.mapd.services.search.termsInput.val() + " " + token);
        $('#termsInput').trigger('input');
      }
      else if (this.sourceSetting == "Users") {
        this.mapd.services.search.userInput.val(token);
        $('#userInput').trigger('input');
        this.setMenuItem("Source", "Words", false);
      }
    else if (this.sourceSetting == "Country") {
      this.mapd.services.search.termsInput.val("country: " + token);
      $('termsInput').trigger('input');
      this.setMenuItem("Source", "Words", false);
    }
    else if (this.dataSource == "OS-App") {
      this.mapd.services.search.termsInput.val("origin: " + token);
      $('termsInput').trigger('input');
      this.setMenuItem("Source", "Words", false);
    }
    this.mapd.services.search.form.submit();

    }
  },

  reload: function(options) {
    $.getJSON(this.getURL(options)).done($.proxy(this.onLoad, this));
  },
  onLoad: function(json) {
    this.displayDiv.empty();
    var n =json.n;
    var numQueryTerms = this.mapd.queryTerms.length;
    this.tokens = json.tokens;
    if (this.displaySetting == "Cloud") {
        //var tokens = json.tokens; 
        var counts = json.counts; 

        var numResultsToExclude = 0;
        if (this.sourceSetting == "Words")
          numResultsToExclude = numQueryTerms; 
        var numTokens = this.tokens.length;
        var wordArray = new Array(numTokens - numResultsToExclude);
        var percentFactor = 100.0 / n;
        //console.log("numqueryterms");
        //console.log(numResultsToExclude);
        var tokenRatio = 1.0 / counts[2 + numResultsToExclude];
        for (var t = numResultsToExclude; t < numTokens; t++) {
          //$('<li>' + tokens[i] + '</li>').appendTo(cloud);
            var percent = counts[t] * percentFactor;
            var textPercent = "%" + percent.toFixed(3);
            wordArray[t - numResultsToExclude] = {text: this.tokens[t], html: {title: textPercent},  weight: Math.max(Math.min(40, Math.round(counts[t]* tokenRatio * 30.0)), 4)};
        }
        //console.log(wordArray);
        this.displayDiv.jQCloud(wordArray);
        //console.log("clouddiv");
        //console.log(this.cloudDiv);
    }
    else {
        BarChart.init(this.displayDiv, $.proxy(this.barClickCallback, this));
        var numResultsToExclude = 0;
        if (this.sourceSetting == "Words")
          numResultsToExclude = numQueryTerms; 
        console.log("num results to exclude: " + numResultsToExclude);
        BarChart.addData(json, numResultsToExclude, this.dataNums);
    }
        var label = (this.sourceSetting == "Words") ? "# Words: " : ((this.sourceSetting == "Users") ? "# Tweets: " : "# Tweets: ");
        $('#numTokensText').text(label + numberWithCommas(n));
        console.log("triggering loadend");
        $(this).trigger('loadend');

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
    //console.log("retile");
    //this.wms.params = OpenLayers.Util.extend(this.wms.params, this.getParams());
  },

  getParams: function(options) {
    this.params.sql = "select goog_x, goog_y, tweet_text from " + this.mapd.table;
    this.params.sql += this.mapd.getWhere(options);
    //console.log(this.params.sql);
    return this.params;
  },

  reload: function(options) {
    this.wms.mergeNewParams(this.getParams(options));
  }
};

var HeatMap = {
  mapd: MapD,
  wms: null,
  params: {
    request: "GetMap",
    sql: null,
    bbox: null,
    width: null,
    height: null,
    layers: "heatmap",
    maxval: "auto", 
    min: 0.2,
    blur: 28,
    colorramp: "green_red",
    format: "image/png",
    transparent: true
  },

  init: function(wms) {
    this.wms = wms;
    this.wms.events.register('retile', this, this.setWMSParams);
    $(document).on('heatmapreload', $.proxy(this.reload, this));
  },

  setWMSParams: function() {
    //this.wms.params = OpenLayers.Util.extend(this.wms.params, this.getParams());
  },

  getParams: function(options) {
    if (options == undefined || options == null) 
      options = {splitQuery: true};
    else
      options.splitQuery = true;

    //this.params.sql = "select goog_x, goog_y from " + this.mapd.table;
    this.params.sql = "select goog_x, goog_y"; //from " + this.mapd.table;
    //var queryArray = this.mapd.getWhere({splitQuery: true});
    var queryArray = this.mapd.getWhere(options);
    if (queryArray[0])
      this.params.sql += "," + queryArray[0];
    this.params.sql += " from " + this.mapd.table + queryArray[1];

    if (options.heatMax != undefined && options.heatMax != null) 
      this.params.maxval = options.heatMax;
    else
      this.params.maxval = "auto"; 

    //console.log("FINAL");
    //console.log(this.params.sql);
    return this.params;
  },

  reload: function(options) {
    this.wms.mergeNewParams(this.getParams(options));
  }
};

/*
var GetNearestTweet = {
  mapd: MapD,
*/
var TweetClick = 
{
  mapd: MapD,
  pixelTolerance: 5,
  params: {
    request: "GetFeatureInfo",
    sql: null,
    bbox: null,
  },
  clickControl: null,
  popup: null,

  init:function() {
    /*
    OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
      defaultHandlerOptions: {
        'single': true,
         'double': false,
         'pixelTolerance': 0,
         'stopSingle': false,
         'stopDouble': false
        },
        initialize: function (options) {
          this.handlerOptions = OpenLayers.Util.extend( {}, this.defaultHandlerOptions
          );
          this.handler = new OpenLayers.Handler.Click(
              this, {
                  'click': this.trigger
                }, this.handlerOptions
            );
        },
      trigger: function(e) {
          console.log('at click');
          if (mapd.services.settings.pointOn) {
            $.getJSON(this.getURL()).done($.proxy(this.onTweet,this));
          }
        }


    });
    */
    /*
    this.clickControl = new OpenLayers.Control.Click();
    map.addControl(this.clickControl);
    this.clickControl.activate();
    */
    },

      handleClick: function(e) {
        //console.log("handleclick");
        $.getJSON(this.getURL(e)).done($.proxy(this.onTweet,this));
      },

        
      getURL: function(e) {
        this.params.sql = "select goog_x, goog_y, time, sender_name, tweet_text from " + this.mapd.table;
        this.params.sql += this.mapd.getWhere();
        var lonlat = this.mapd.map.getLonLatFromPixel(e.xy);
        //console.log(lonlat);
        this.params.sql += " ORDER BY orddist(point(goog_x,goog_y), point(" + lonlat.lon +"," + lonlat.lat + ")) LIMIT 1";
        //console.log(this.params.sql);
        var pointBuffer = this.mapd.map.resolution * this.pixelTolerance;
        //console.log("pointbuffer");
        //console.log(pointBuffer);

        this.params.bbox = (lonlat.lon-pointBuffer).toString() + "," + (lonlat.lat-pointBuffer).toString() +"," + (lonlat.lon+pointBuffer).toString() + "," + (lonlat.lat+pointBuffer).toString(); 
        var url = this.mapd.host + '?' + buildURI(this.params);
        //console.log(url);
        return url;
      },

      onTweet: function(json) {
        //console.log("ontweet");
        //console.log(json);
        if (json != null) {
            var tweet = json.results[0];
            this.addPopup(tweet.goog_x, tweet.goog_y, tweet);
        }
      },


      addPopup: function(x, y, tweet) {
        //var popupLatLon = new OpenLayers.LonLat(x, y);
        //var popupSize = new OpenLayers.Size(50, 50);
        //var popup = new OpenLayers.Popup.Anchored(null, popupLatLon, popupSize, html);
        //var html = "<p>" + tweet.tweet_text + "<\p>";
        var container = $('<div></div>').addClass("tweet-popup");
        //var container = $('<div></div>').addClass("tweet-container");
        var header = $('<div></div>').addClass("tweet-header").appendTo(container);
        $('<div style="clear: both;"></div>');
        var content = $('<p></p>').addClass("tweet-content").appendTo(container);
        var profile = $('<a></a>').addClass("popup-profile").appendTo(header);
        //var profile = $('<a></a>').addClass("tweet-profile").appendTo(header);
        var time = new Date(tweet.time * 1000);
        var timeText = $('<div></div>').addClass("popup-time").appendTo(header);
        timeText.html(time.toLocaleString());
        content.html(twttr.txt.autoLink(tweet.tweet_text, {targetBlank: true}));
        profile.html(tweet.sender_name);
        profile.attr('href', 'https://twitter.com/' + tweet.sender_name);
        profile.attr('target', '_none');

        if (this.popup != null)
          this.popup.destroy();

        this.popup = new OpenLayers.Popup.FramedCloud("tweet",
         new OpenLayers.LonLat(x, y),
         //new OpenLayers.Size(300,150),
         null,
         container.html(), 
         null,
         true);

        this.mapd.map.addPopup(this.popup);
        this.popup.updateSize();

        $('.popup-profile, .username').click( $.proxy(function(e) {
          var userName = $(e.target).html();
          //console.log($(this).html());
          this.mapd.services.search.termsInput.val("");
          this.mapd.services.search.userInput.val(userName);
          $('#userInput').trigger('input');
          this.mapd.services.search.form.submit();
        }, this));

      }



    }



var Tweets = 
{
  mapd: MapD,
  sortDiv: null,  
  viewDiv: null,
  params: {
    request: "GetFeatureInfo",
    sql: null,
    bbox: null,
  },
  defaultPointStyle: null,
  tempPointStyle: null,
  pointStyleMap: null,
  mouseOverFeatureControl: null,
  selectFeatureControl: null,
  sortDesc: null,
  topOffset: null,
  bottomOffset: null,
  startRecordSpan:null,
  endRecordSpan:null,
  startRecord: 0,
  endRecord: 1,
  scrollTop:0,

init: function(sortDiv, viewDiv) {
    //console.log("SortDiv: " + sortDiv);
    //console.log(viewDiv);
    this.sortDiv = sortDiv;
    this.viewDiv = viewDiv;
    this.defaultPointStyle = new OpenLayers.Style({
    'fillColor': '#C00',
    'fillOpacity': 0.0,
    //'strokeColor': '#000',
    'strokeWidth': 0,
    'pointRadius': 0 
    });
    this.tempPointStyle = new OpenLayers.Style({
    'fillColor': '#C00',
    //'externalGraphic': 'img/twitter-bird.png', 
    'externalGraphic': 'img/target.png', 
    'strokeColor': '#000',
    'fillOpacity': 1.0,
    'strokeWidth': 1,
    'pointRadius': 15 
    });


    this.selectedPointStyle = new OpenLayers.Style({
      //graphicName: "star",
      pointRadius: 5,
      fillOpacity: 1.0,
      strokeColor: "#000",
      fillColor: '#FD4E01'
      //fillColor: '${selectColor}'
    });
    
    this.pointStyleMap = new OpenLayers.StyleMap({
    'default': this.defaultPointStyle,
    'temporary': this.tempPointStyle,
    'select': this.selectedPointStyle
    });

    this.sortDesc = true;

    $("<div id='sortPref'>Showing results <span id='startRecord'></span>-<span id='endRecord'></span> of <span id='resultsCount'></span> - Sort by <a href='javascript:void(0)' id='oldSort'>Oldest</a> <a href='javascript:void(0)' id='newSort'>Newest</a></div>").appendTo(this.sortDiv);
    $('#oldSort').click($.proxy(this.oldSortFunc, this));
    $('#newSort').click($.proxy(this.newSortFunc, this));
    this.viewDiv.scroll($.proxy(this.onScrollFunc,this));
    this.startRecordSpan = $("#startRecord");
    this.endRecordSpan = $("#endRecord");


  },

    onScrollFunc: function() {
      this.topOffset = this.viewDiv.offset().top + 1;
      this.bottomOffset = this.topOffset + this.viewDiv.height() - 1; 
        var oldScrollTop = this.scrollTop;
        this.scrollTop = this.viewDiv.scrollTop();
        var containers = $('.tweet-container');
        var numContainers = containers.length;
        var scrollDown = this.scrollTop >= oldScrollTop ? true : false;
        //console.log(scrollDown);
        if (scrollDown) {
            for (var record = this.startRecord; record < numContainers; record++) {
                //console.log (record + " " + containers.eq(record).offset().top);
                if (containers.eq(record).offset().top >= this.topOffset) {
                    this.startRecord = record; 
                    break;
                }
            }
            for (var record = this.endRecord; record < numContainers; record++) {
                //console.log (record + " " + containers.eq(record).offset().top);
                if (containers.eq(record).offset().top >= this.bottomOffset) {
                    this.endRecord = record - 1; 
                    break;
                }
            }
        }
        else {
            for (var record = this.startRecord; record >= 0 ; record--) {
                //console.log (record + " " + containers.eq(record).offset().top);
                var containerOffset = containers.eq(record).offset().top;
                if (containerOffset <= this.topOffset) {
                    if (containerOffset < this.topOffset)
                        this.startRecord = record + 1;
                    else
                        this.startRecord = record; 
                    break;
                }
            }
            for (var record = this.endRecord; record >= 0 ; record--) {
                //console.log (record + " " + containers.eq(record).offset().top);
                var containerOffset = containers.eq(record).offset().top;
                if (containerOffset <= this.bottomOffset) {
                    if (containerOffset < this.bottomOffset)
                        this.endRecord = record;
                    else
                        this.endRecord = record; 
                    break;
                }
            }
        }

        this.startRecordSpan.html(this.startRecord+1);
        this.endRecordSpan.html(this.endRecord+1);



        /*
        for (var offset = 0; offset < numContainers; offset++) {
            if (this.startRecord - offset) 


        console.log("Length " + numContainers);
        for (var i = 0; i < numContainers; i++) {
            //console.log("i: " + i + " " +  containers.eq(i).offset().top);
            console.log(this.topOffset);
            if (containers.eq(i).offset().top > this.topOffset) {
                this.startRecord = i; 
                this.startRecordSpan.html(i+1);
                break;
            }
        }
        */
    },


  oldSortFunc: function () { 
    if (this.sortDesc == true) {
        this.sortDesc = false;
        this.reload();
        $(this.viewDiv).scrollTop(0);
        
      }
   },
   newSortFunc: function () { 
      if (this.sortDesc == false) {
        this.sortDesc = true;
        this.reload();
        $(this.viewDiv).scrollTop(0);
      }
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
    this.params.sql += " order by time " + (this.sortDesc == true ? "desc" : "") +  " limit 100";
    this.params.bbox = this.mapd.map.getExtent().toBBOX();
    var url = this.mapd.host + '?' + buildURI(this.params);
    return url;
  },

  reload: function() {
    $.getJSON(this.getURL()).done($.proxy(this.onTweets, this));
  },
  //oldSortFunc :function () { 
  //    console.log("oldsort");
  //    if (this.sortDesc == true) {
  //      console.log ("old sorting");
  //      this.sortDesc = false;
  //      this.reload();
  //    }
  // },
   
  onTweets: function(json) {
    //console.log('in onTweets');
    this.viewDiv.empty();
    if (this.sortDesc) {
      $("#newSort").addClass("link-visited");
      $("#oldSort").removeClass("link-visited");
    }
    else {
      $("#oldSort").addClass("link-visited");
      $("#newSort").removeClass("link-visited");
    }

    //$('#oldSort').click($.proxy(this.oldSortFunc, this));
    var container = $('').appendTo(this.viewDiv);

    if (json == null) return;
    if (vectors) map.removeLayer(vectors);
    vectors = new OpenLayers.Layer.Vector("Vector Layer", {'displayInLayerSwitcher': false});
    vectors.styleMap = this.pointStyleMap;
    this.mouseOverFeatureControl = new OpenLayers.Control.SelectFeature (vectors, 
      { hover: false,
        renderIntent: "temporary"
        /* eventListeners: { 
          featurehighlighted: this.onPointHover,
          featureunhighlighted: this.offPointHover
      }
      */
    });
    map.addControl(this.mouseOverFeatureControl);
    this.mouseOverFeatureControl.activate();

    this.selectFeatureControl = new OpenLayers.Control.SelectFeature (vectors, 
      {
        //renderIntent: "select"
      });

    map.addControl(this.selectFeatureControl);
    this.selectFeatureControl.activate();

    map.addLayer(vectors);
    vectors.setZIndex(Number(pointLayer.getZIndex()) + 1);
    if (markers) map.removeLayer(markers);
    markers = new OpenLayers.Layer.Markers("Markers Layer", {'displayInLayerSwitcher': false});
    map.addLayer(markers);
    markers.setZIndex(Number(vectors.getZIndex()) + 1);

    var n = json.n;
    $("#resultsCount").html(numberWithCommas(n));
    this.topOffset = this.viewDiv.offset().top + 1;
    this.bottomOffset = this.topOffset + this.viewDiv.height(); 

    var results = json.results;
    for (i in results)
    {
      var result = results[i];
      if (!result || !result.tweet_text)
        continue;
      this.add(result, i);
    }
    $('.tweet-profile, .username').click( $.proxy(function(e) {
      var userName = $(e.target).html();
      //console.log($(this).html());
      this.mapd.services.search.termsInput.val("");
      this.mapd.services.search.userInput.val(userName);
      $('#userInput').trigger('input');
      this.mapd.services.search.form.submit();
    }, this));
    this.scrollTop = 0;
    this.onScrollFunc();
    /*
    this.startRecordSpan.html(this.startRecord + 1);
    this.endRecordSpan.html(this.endRecord + 1);
    */

  },

  add: function(tweet, index) {
    var user = tweet.sender_name;
    var text = tweet.tweet_text;
    //tweet.time = tweet.time - 4 * 60 * 60; // hack: original data set is ahead by 4 hours.
    var time = new Date(tweet.time * 1000);
    var x = tweet.goog_x;
    var y = tweet.goog_y;
    
    var container = $('<li></li>').addClass("tweet-container").appendTo(this.viewDiv);
    var header = $('<div></div>').addClass("tweet-header").appendTo(container);
    var content = $('<p></p>').addClass("tweet-content").appendTo(container);
    var profile = $('<a></a>').addClass("tweet-profile").appendTo(header);
    var timeText = $('<div></div>').addClass("tweet-time").appendTo(header);
    timeText.html(time.toLocaleString());
    content.html(twttr.txt.autoLink(text, {targetBlank: true}));
    profile.html(user);
    profile.attr('href', 'https://twitter.com/' + user);
    profile.attr('target', '_none');

    var urls = twttr.txt.extractUrls(text);
    var hashtags = twttr.txt.extractHashtags(text);
    var users = twttr.txt.extractMentions(text);
    //console.log(hashtags)
    //console.log(urls)
    //console.log(users)
    var selectColor = this.getRandomColor(); 
    container.data({tweet: tweet, urls: urls, hashtags: hashtags, users: users, selectColor: selectColor});
    container.mouseenter($.proxy(this.onMouseEnter,this, container));
    container.mouseleave($.proxy(this.onMouseLeave,this, container));
    container.click($.proxy(this.onClick,this,container));
    //container.mouseup($.proxy(this.onUnClick,this,container));
    this.addPoint(x,y,index, selectColor);

  },
 

  onPointHover: function(e) {
    $(".tweet-container").eq(e.feature.data.index).addClass("container-hover");
    //$(".tweet-container").eq(e.feature.data.index).addClass("tweet-container > hover");
  },
  offPointHover: function(e) {
      $(".tweet-container").eq(e.feature.data.index).removeClass("container-hover");
  },

  addPopup: function(x, y, html) {
    var popupLatLon = new OpenLayers.LonLat(x, y);
    var popupSize = new OpenLayers.Size(50, 50);
    var popup = new OpenLayers.Popup.Anchored(null, popupLatLon, popupSize, html);
    this.mapd.map.addPopup(popup);
    popup.updateSize();
    //console.log(popup);
  },

  addPoint: function(x,y,index, selectColor) {
    var point = new OpenLayers.Geometry.Point(x,y);
    var featurePoint = new OpenLayers.Feature.Vector(point, {index: index, selectColor: selectColor});
    vectors.addFeatures([featurePoint]);
  }, 

  getRandomColor: function() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ )
      color += letters[Math.round(Math.random() * 15)];
      return color;
  },

  onClick: function(container) {
    var index = $(container).index();
    if (OpenLayers.Util.indexOf(vectors.selectedFeatures,vectors.features[index]) == -1)
      this.selectFeatureControl.select(vectors.features[index]);
    else
      this.selectFeatureControl.unselect(vectors.features[index]);
  },

  // this points to <li> container 
  onMouseEnter: function(container) {
    //console.log(this);
    var index = $(container).index();
    this.mouseOverFeatureControl.highlight(vectors.features[index]);
    /*
    var tweet = $(container).data('tweet');
    console.log(tweet);
    var user = tweet.sender_name;
    var x = tweet.goog_x;
    var y = tweet.goog_y;
    var label = new OpenLayers.Label(x, y, user, null, null, null);
    label.addTo(markers);
    $(label.getIcon()).addClass('label-user');
    $(container).data('label', label);
    */
  },

  // this points to <li> container 
  onMouseLeave: function(container) {
    var index = $(container).index();
    //if (OpenLayers.Util.indexOf(vectors.selectedFeatures,vectors.features[index]) == -1)
    if (OpenLayers.Util.indexOf(vectors.selectedFeatures,vectors.features[index]) == -1)
      this.mouseOverFeatureControl.unhighlight(vectors.features[index]);
    else {
      // need to reselect element
      this.selectFeatureControl.select(vectors.features[index]);
    }
    //$(container).data('label').erase();
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
    //console.log('in onGeoCoding');
    this.status = status;
    if (status != google.maps.GeocoderStatus.OK) {
      this.bbox = null;
      //console.log('Geocoding service failed:', status);
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
  userInput: null,
  locationInput: null,
  terms: '',
  user: '',
  location: '',
  locationChanged: false,
  io: null,

  init: function(map, form, termsInput, userInput, locationInput) {
    $(document).on('propertychange keyup input paste', 'input.search-input', function() {
      var io = $(this).val().length ? 1: 0;

      $(this).next('.iconClear').stop().fadeTo(300,io);
      }).on('click', '.iconClear', function() {
        $(this).delay(300).fadeTo(300,0).prev('input').val('');

        Search.form.submit();
      });

    this.map = map;
    this.form = form;
    this.termsInput = termsInput;
    this.userInput = userInput;
    this.locationInput = locationInput;
    this.geocoder.setMap(this.map);
    this.form.submit($.proxy(this.onSearch, this));
    $(document).on('geocodeend', $.proxy(this.onGeoCodeEnd, this));
    this.map.events.register('moveend', this, this.onMapMove);
  },
 
  onSearch: function() {

    var terms = this.termsInput.val();
    if ($("#userInput").val().length > 0) {
      mapd.services.topktokens.setMenuItem("Source", "Users", false);
    }
    if (terms.substring(0,9) == "country:") {
      mapd.services.topktokens.setMenuItem("Source", "Words", false);
    }

    if (terms.substring(0,8) == "origin:") { 
      mapd.services.topktokens.setMenuItem("Source", "Words", false);
    }

    var location = this.locationInput.val();
    this.locationChanged = this.location != location;
    this.terms = terms;
    this.user = this.userInput.val();
    this.mapd.setQueryTerms(this.terms);
    this.mapd.setUser(this.user);

    if (this.locationChanged) {
      this.location = location;
      this.geocoder.geocode(this.location);
      return false;
    }
    $(document).trigger({type: 'mapdreload'});
    $(document).trigger({type: 'pointmapreload'});
    $(document).trigger({type: 'heatmapreload'});
    return false;
  },

  onGeoCodeEnd: function(event) {
    //console.log('in onGeoCodeEnd');
    var bounds = event.bounds;
    this.map.zoomToExtent(bounds);
  },

  onMapMove: function() 
  {
    //console.log('in onMapMove');
    if (this.locationChanged)
      this.locationChanged = false;
    else {
      this.location = "";
      this.locationInput.val("");
    }
  },
}

var Animation = {
  mapd: MapD,
  pointLayer: null,
  heatLayer: null,
  wordGraph: null,
  heatMax: null,
  //pointMap: null,
  //heatMap: null,
  playPauseButton: null,
  stopButton: null,
  playing: false,
  numFrames: 60.0,
  animStart: null,
  animEnd: null,
  frameStep: null,
  frameWidth: null,
  numLayersLoaded: 0,
  formerGraphLockedState: false,
  formerGraphDisplayMode: "cloud",

  init: function(pointLayer, heatLayer, wordGraph, playPauseButton, stopButton) {
    this.pointLayer = pointLayer;
    this.heatLayer = heatLayer;
    this.wordGraph = wordGraph;
    this.pointLayer.events.register("loadend", this, this.layerLoadEnd);
    this.heatLayer.events.register("loadend", this, this.layerLoadEnd);
    //$(this.wordGraph).bind('loadend', this, this.layerLoadEnd);
    //$("#numTokensText").bind('loadend', this, this.layerLoadEnd);
    $(this.wordGraph).on('loadend', $.proxy(this.layerLoadEnd, this));
    this.playPauseButton = playPauseButton;
    this.stopButton = stopButton;
    $(this.playPauseButton).click($.proxy(this.playFunc, this));
    $(this.stopButton).click($.proxy(this.stopFunc, this));
  },

  layerLoadEnd: function () {
    console.log(this.numLayersLoaded);
    if (this.playing == true) {
      var numLayersVisible = this.mapd.services.settings.getNumLayersVisible() + 1; //1 is for 
      this.numLayersLoaded++;
      if (this.numLayersLoaded >= numLayersVisible) {
          this.numLayersLoaded = 0;
          this.animFunc();
      }
    }
  },

  isAnimating: function() {
    return (this.animStart != null);
  },

  animFunc: function() {
     if (this.frameEnd < this.animEnd) {
        var options = {time: {timestart: Math.floor(this.frameStart), timeend: Math.floor(this.frameEnd)}, heatMax: this.heatMax}; 
       var graphOptions = {time: {timestart: Math.floor(this.frameStart), timeend: Math.floor(this.frameEnd)}, heatMax: this.heatMax}; 
      //console.log (this.frameStart + "-" + this.frameEnd);
      this.frameStart += this.frameStep;
      this.frameEnd += this.frameStep;
      this.mapd.services.graph.chart.setBrushExtent([this.frameStart * 1000, this.frameEnd * 1000]);
      this.mapd.services.pointmap.reload(options);
      this.mapd.services.heatmap.reload(options);
      this.wordGraph.reload(graphOptions);
    }
    else {
      this.stopFunc();
    }
  },


  playFunc: function () {
    //console.log("play");
    if (this.playing == false) {
      this.playing = true;
      this.playPauseButton.removeClass("play-icon").addClass("pause-icon");
      if (this.animStart == null) { // won't trigger if paused
        this.animStart = this.mapd.datastart;
        this.animEnd = this.mapd.dataend;
        this.frameStep = (this.animEnd - this.animStart) / this.numFrames;
        //this.frameWidth = this.frameStep * 4.0;
        this.frameWidth = this.mapd.timeend - this.mapd.timestart;
        this.frameStart = this.animStart;
        this.frameEnd = this.animStart + this.frameWidth;
        this.heatMax = parseFloat($.cookie('max_value')) * 10.0;
        console.log(this.heatMax);
        this.formerGraphLockedState = this.wordGraph.locked;
        this.wordGraph.locked = true;
        //this.wordGraph.params.sort = "false";
        this.formerGraphDisplayMode = this.wordGraph.displaySetting;

        this.wordGraph.setMenuItem("Display", "Chart", false);
        if (this.formerGraphLockedState == false) {
            this.wordGraph.lockClickFunction();
        }
        /*****
        $("#barDisplay").prop('checked', 'checked');
        $("#cloudDisplay").attr('disabled', true);
        $("#displayMode").buttonset("refresh");
        ******/
      }
      this.animFunc();

    }
    else {
      this.playing = false;
      this.playPauseButton.removeClass("pause-icon").addClass("play-icon");
    }
  },

  stopFunc: function() {
    //console.log("stop");
    if (this.animStart != null) { //meaning its stopped or playing
      this.animStart = null;
      this.animEnd = null;
      this.animStep = null;
      this.numLayersLoaded = 0;
      this.playing = false;
      this.playPauseButton.removeClass("pause-icon").addClass("play-icon");
      //this.playPauseButton.attr("id", "play-icon");
      this.mapd.services.graph.chart.setBrushExtent([this.mapd.timestart * 1000, this.mapd.timeend * 1000]);
      this.mapd.services.pointmap.reload();
      this.mapd.services.heatmap.reload();
      //this.wordGraph.locked = this.formerGraphLockedState;
      this.wordGraph.setMenuItem("Display", this.formerGraphDisplayMode, false);
      if (this.formerGraphLockedState != this.wordGraph.locked) {
        this.wordGraph.lockClickFunction(true);
      }
      this.wordGraph.reload();
    }
  }
}

var Settings = {
  pointLayer: null,
  heatLayer: null,
  pointOn: null,
  heatOn: null,
  pointButton: null,
  heatButton: null,

  init: function(pointLayer, heatLayer, pointButton, heatButton) {
    this.pointLayer = pointLayer;
    this.heatLayer = heatLayer;
    this.pointButton = pointButton;
    this.heatButton = heatButton;
    this.pointOn = pointLayer.getVisibility();
    this.heatOn = heatLayer.getVisibility();
    console.log("settings point: " + this.pointOn);
    console.log("settings heat: " + this.heatOn);
    if (this.pointOn)
      this.pointButton.addClass("pointButtonOnImg");
    else
      this.pointButton.addClass("pointButtonOffImg");
    if (this.heatOn)
      this.heatButton.addClass("heatButtonOnImg");
    else
      this.heatButton.addClass("heatButtonOffImg");

   $(this.pointButton).hover($.proxy(function() {this.pointButton.addClass("pointButtonHoverImg");}, this), $.proxy(function () {this.pointButton.removeClass("pointButtonHoverImg");}, this));
   $(this.heatButton).hover($.proxy(function() {this.heatButton.addClass("heatButtonHoverImg");}, this), $.proxy(function () {this.heatButton.removeClass("heatButtonHoverImg");}, this));

    $(this.pointButton).click($.proxy(this.pointButtonFunction, this));
    $(this.heatButton).click($.proxy(this.heatButtonFunction, this));
    
    /*
    $(this.pointButton).click($.proxy(function() {
    this.pointLayer.setVisibility(!this.pointOn);
    this.pointOn = !this.pointOn;
    this.pointButton.toggleClass("pointButtonOffImg").toggleClass("pointButtonOnImg");
    }, this));
    $(this.heatButton).click($.proxy(function() {
      this.heatLayer.setVisibility(!this.heatOn);
      this.heatOn = !this.heatOn;
      this.heatButton.toggleClass("heatButtonOffImg").toggleClass("heatButtonOnImg");
    }, this));
    */
  },
  pointButtonFunction: function() {
    this.pointLayer.setVisibility(!this.pointOn);
    this.pointOn = !this.pointOn;
    this.pointButton.toggleClass("pointButtonOffImg").toggleClass("pointButtonOnImg");
  },
  heatButtonFunction: function() {
    this.heatLayer.setVisibility(!this.heatOn);
    this.heatOn = !this.heatOn;
    this.heatButton.toggleClass("heatButtonOffImg").toggleClass("heatButtonOnImg");
  },

  getNumLayersVisible: function() {
    //return (pointLayer.getVisibility() + heatLayer.getVisiblity());
    return (this.pointOn + this.heatOn);
  }
}
  /*
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
      this.geotrends.reload();
    }
  }
  */


//}

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
    this.params.sql = "select time ";
    if (options == undefined || options == null) 
      options = {splitQuery: true};
    else
      options.splitQuery = true;
    var queryArray = this.getWhere(options);
    if (queryArray[0])
      this.params.sql += "," + queryArray[0];
    this.params.sql += " from " + this.mapd.table + queryArray[1];
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
    var options = {queryTerms: this.mapd.queryTerms, user: this.mapd.user, time: {timestart: this.mapd.datastart, timeend: this.mapd.dataend }};
    $.getJSON(this.getURL(options)).done($.proxy(this.onChart, this, this.mapd.timestart, this.mapd.timeend, this.mapd.queryTerms, true));
  },

  drawChart: function() {
    //console.log('in drawChart', this);
  },

  onChart: function(frameStart, frameEnd, queryTerms, clear, json) {
    //console.log('in onChart', queryTerms);
    queryTerms = queryTerms.join(" ")
    if (clear) {
      this.seriesId = 0;
      this.queryTerms = [];
      this.chart.removeAll();
    }
    this.queryTerms.push(queryTerms);
    var series = [];
    if ("y" in json) { // means we have percent
      for (i in json.x) {
        var time  = json.x[i];
        var percent = json.y[i] * 100.0;
        if (json.count[i] > 0)
          series.push({date: new Date(time * 1000), value: percent});
      }
    }
    else {
      for (i in json.x) {
        var time  = json.x[i];
        //time = time - 4 * 60 * 60; // hack: original data set is ahead by 4 hours.
        var count = json.count[i];
        series.push({date: new Date(time * 1000), value: count});
      }
    }
    this.chart.addSeries(this.seriesId, queryTerms, series, frameStart, frameEnd);
    this.seriesId += 1;
  },

  onZoom: function() {
    var start = (this.chart.brush.extent()[0]/ 1000).toFixed(0);
    var end = (this.chart.brush.extent()[1] / 1000).toFixed(0);
    this.mapd.reloadByGraph(start, end);
  },

  onCompare: function(terms) {
    var queryTerms = terms.trim().split(" ").filter(function(d) {return d});
    // for now, time range always corresponds to entire data range
    var options = {queryTerms: queryTerms, user: this.mapd.user,  time: {timestart: this.mapd.datastart, timeend: this.mapd.dataend }};
    $.getJSON(this.getURL(options)).done($.proxy(this.onChart, this, this.mapd.timestart, this.mapd.timeend, queryTerms, false));
  }
}
