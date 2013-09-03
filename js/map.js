$(document).ready(function() {init()});

var map;
var vectors;
var markers;
var words;
var baseLayer;

function init()
{ 
  map = new OpenLayers.Map('map', {projection: "EPSG:900913"});
  baseLayer = new OpenLayers.Layer.Google("Google Maps", {numZoomLevels: 20});
  map.addLayer(baseLayer);

  var extent = new OpenLayers.Bounds(BBOX.US.split(','));  
  map.zoomToExtent(extent);
  pointLayer = new OpenLayers.Layer.WMS("Point Maps", PointMap.mapd.host, PointMap.getParams(), {singleTile: true, ratio: 1});
  map.addLayer(pointLayer);

  MapD.init(map, PointMap, GeoTrends, TopKTokens, Tweets, Chart);
  Tweets.init($('div#tweets'));
  PointMap.init(pointLayer);
  Search.init(map, $('form#search'), $('input#termsInput'), $('input#locationInput'));
  Settings.init($('button#gridSmall'), $('button#gridMedium'), $('button#gridLarge'));
  Chart.init($('div#chart'));
  MapD.start();
  baseLayer.display(false);
  pointLayer.display(false);
}

function onTrends(filterWords, json) 
{
  console.log('in onTrends');
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
  baseLayer.display(false);
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
