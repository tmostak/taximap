$(document).ready(function() {init()});

var map;
var vectors;
var markers;
var words;
var pointLayer;
var heatLayer;
var baseLayers;
var clickControl;

function init()
{ 
  //map = new OpenLayers.Map('map', { controls: [new OpenLayers.Control.Navigation(), new OpenLayers.Control.Zoom(), new OpenLayers.Control.LayerSwitcher({'ascending':true})], projection: "EPSG:900913", maxResolution: 156543.0339, numZoomLevels:24});
  //$("#termsInput").css("margin-left", "4px");
  //var extent = new OpenLayers.Bounds(BBOX.WORLD.split(','));  
  var extent = new OpenLayers.Bounds(BBOX.BOSTON.split(','));  
  map = new OpenLayers.Map('map', { controls: [new OpenLayers.Control.Navigation(), new OpenLayers.Control.ZoomPanel(), new OpenLayers.Control.KeyboardDefaults(), new OpenLayers.Control.ScaleLine(), /* new OpenLayers.Control.LayerSwitcher({'ascending':true})*/], projection: "EPSG:900913", restrictedExtent: extent,  maxResolution: 156543.0339,  numZoomLevels:24});

  //var darkStyle = [ { featureType: "all", elementType: "all", stylers: [ {visibility: "simplified" }, /*{hue: "#333"},*/ {saturation: -50}, {lightness: -50} ] } ];
  //var darkBlueStyle = [ { featureType: "all", elementType: "all", stylers: [ {visibility: "on" }, {hue: "#00c3ff"}, {saturation: -62}, {lightness: -83}, {gamma: 0.27} ] } ];
  var darkBlueStyle = [ { featureType: "all", elementType: "all", stylers: [ {visibility: "on" }, {saturation: -62}, {hue: "#00c3ff"}, {"gamma": 0.27}, {lightness: -65} ] } ];
  var darkMap = new OpenLayers.Layer.Google("Dark", {type: 'styled'}, {isBaseLayer:true});
  var styledMapOptions = {
    name: "Dark Map"
  };
  var styledMapType = new google.maps.StyledMapType(darkBlueStyle,styledMapOptions);

  baseLayers = new Array( darkMap, new OpenLayers.Layer.Google("Google Roadmap", {type: google.maps.MapTypeId.ROADMAP}, {isBaseLayer:true}), new OpenLayers.Layer.Google("Google Topo", {type: google.maps.MapTypeId.TERRAIN}, {isBaseLayer:true}), new OpenLayers.Layer.Google("Google Hybrid", {type: google.maps.MapTypeId.HYBRID}, {isBaseLayer: true}), new OpenLayers.Layer.OSM("OpenStreeMap"),  new OpenLayers.Layer.OSM("Blank","data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=") /* new OpenLayers.Layer("Blank", {isBaseLayer: true},*/ );

  map.addLayers(baseLayers);

  darkMap.mapObject.mapTypes.set('styled',styledMapType);
  darkMap.mapObject.setMapTypeId('styled');

  //baseLayer = new OpenLayers.Layer.Google("Google Maps", {numZoomLevels: 20});
  //map.addLayer(baseLayer);

  map.zoomToExtent(extent);
  BaseMap.init();
  MapD.init(map, PointMap, HeatMap, GeoTrends,/* TopKTokens, */ Tweets, Chart, Search, Settings, TweetClick, Animation, Choropleth/*, RealTimeOverlay*/);
  Choropleth.init("block_groups");
  pointLayer = new OpenLayers.Layer.WMS("Point Map", PointMap.mapd.host, PointMap.getParams(), {singleTile: true, ratio: 1.0, "displayInLayerSwitcher": false, removeBackBufferDelay:0});
  heatLayer = new OpenLayers.Layer.WMS("Heat Map", HeatMap.mapd.host, HeatMap.getParams(), {singleTile: true, opacity: 0.55, ratio: 1.0, "displayInLayerSwitcher": false});
  pointLayer.setVisibility(false);
  heatLayer.setVisibility(false);
  map.addLayer(heatLayer);
  map.addLayer(pointLayer);

  Tweets.init($('div#sortOrder'), $('div#tweets'));
  TweetClick.init();
  //TopKTokens.init($('div#cloud'));
  PointMap.init(pointLayer);
  HeatMap.init(heatLayer);
  Search.init(map, $('form#search'), $('id#zoom'), $('#curLoc'), $('input#termsInput'), $('input#userInput'), $('#locationSelect'), $('input#locationInput'), $('input#langInput'), $('input#zoomInput'), $('input#originInput'));
  Settings.init(pointLayer, heatLayer, $('button#basemapButton'), $('button#pointButton'), $('button#heatButton'), $('button#polyButton'));
  //Settings.init($('button#gridSmall'), $('button#gridMedium'), $('button#gridLarge'));
  Chart.init($('div#chart'));
  Animation.init(pointLayer, heatLayer, TopKTokens, Choropleth, $('.play-pause'), $('.stop'));
  //RealTimeOverlay.init();
  //RealTimeOverlay.addData();
  MapD.start();
  //baseLayer.display(false);
  //pointLayer.display(true);
  //heatLayer.display(false);

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

          //console.log('at click');
          if (MapD.services.settings.pointOn) {
            MapD.services.tweetclick.handleClick(e);
            //console.log(e);
            //$.getJSON(this.getURL()).done($.proxy(this.onTweet,this));
          }
        
        }
    });

    clickControl = new OpenLayers.Control.Click();
    map.addControl(clickControl);
    //console.log(clickControl);
    clickControl.activate();



}

function numberWithCommas(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function onTrends(filterWords, json) 
{
  //console.log('in onTrends');
  var meta = json['meta'];
  var trends = json['trends'];
  var bounds = meta['boundingBoxM'];
  var numBinX = meta['numBinX'];
  var numBinY = meta['numBinY'];
  var xGridSize = (bounds[2] - bounds[0])/numBinX;
  var yGridSize = (bounds[3] - bounds[1])/numBinY;
  var numBinT = meta['numBinT'];
  var timeStart = meta['timeStart'];
  var timeEnd = meta['timeEnd'];
  var tStepSize = (timeEnd - timeStart)/numBinT;

  var wordList = {};
  Node.instances = {};
  Node.bounds = bounds;
  Node.numBinX = numBinX;
  Node.numBinY = numBinY;
  Node.numBinT = numBinT;
  Node.xGridSize = xGridSize;
  Node.yGridSize = yGridSize;
  Node.tStepSize = tStepSize;

  for (var i in trends)
  {
    var trend = trends[i];
    var relX = trend['x'];
    var relY = trend['y'];
    var x = bounds[0] + xGridSize * (relX + 0.5);
    var y = bounds[1] + yGridSize * (relY + 0.5);
    var words = trend['words'];
    var scores = trend['scores'];
    var before = trend['count']['before'];
    var after = trend['count']['after'];
    if (words && Node.normalizeCount(after) > 10)
    {
      var word = '';
      var score = 0.0;
      for (i in words)
      {
        var isFilterWord = filterWords.filter(function(w) {return words[i] == w}).length;
        if (scores[i] > 0.1 && !isFilterWord)
        {
          word = words[i];
          score = scores[i];
          break;
        }
      }
      if (word == '') continue;
      if (!(word in wordList)) wordList[word] = [];
      var node = new Node(relX, relY, score, before, after);
      wordList[word].push(node);
    }
  }

  var clusters = {};
  for (var word in wordList)
  {
    if (wordList[word].length <= 1) continue;
    clusters[word] = Node.formCluster(wordList[word]);
  }
  //console.log(clusters);

  if (vectors) map.removeLayer(vectors);
  if (markers) map.removeLayer(markers);
  vectors = new OpenLayers.Layer.Vector("Vector Layer");
  markers = new OpenLayers.Layer.Markers("Markers Layer");
  map.addLayer(vectors);
  map.addLayer(markers);
  vectors.display(true);
  markers.display(true);
  //baseLayer.display(false);
  //console.log(map);
  var selectStyle = {fillColor: "black", fillOpacity: 0.4, strokeWidth: 0.5, strokeDashstyle: "dot", labelOutlineOpacity: 0.4, labelOutlineColor: "black", fontSize: "14px"};
  var selectFeature = new OpenLayers.Control.SelectFeature(vectors, {hover: true, highlightOnly: true, selectStyle: selectStyle});                
  // TODO: Can add events on features by selectFeature.events.on({'featurehighlighted': func, 'featureunhighlighted':func})
  vectors.addControl(selectFeature);
  markers.setZIndex(Number(vectors.getZIndex()) + 1);

  var parser = new jsts.io.OpenLayersParser();
  var k = 0;
  var done = 0;
  for (var word in wordList)
  {
    if (!clusters[word])
    {
      var node = wordList[word][0];
      var center = node.getCenter();
      var score = node.score.toPrecision(2);
      var normalizedCount = Node.normalizeCount(node.after).toPrecision(2);
      var tag = score + ':' + node.before + ':' + node.after + ':' + normalizedCount;
      var label = new OpenLayers.Label(center.x, center.y, word, tag, null, Search.termsInput);
      label.addTo(markers);
      continue;
    }

    var color = 'hsl(' + Math.floor(k / Object.keys(clusters).length * 360) + ',40% , 40%)';
    var blobStyle = {fillColor: color, fillOpacity: 0.4, strokeWidth: 0.5, strokeDashstyle: "dot", labelOutlineOpacity: 0.4, labelOutlineColor: "black", fontSize: "14px"};
    k++;
    for (var i in clusters[word])
    {
      var blob = Node.drawPolygon(clusters[word][i]);
      blob = parser.write(blob);
      var blobFeature = new OpenLayers.Feature.Vector(blob, {word: word}, blobStyle);
      vectors.addFeatures([blobFeature]);
      var center = blob.getCentroid();
      var label = new OpenLayers.Label(center.x, center.y, word, null, blobFeature, Search.termsInput);
      label.addTo(markers);
    }
  }
}
