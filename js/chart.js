function buildURI(params) {
  var uri = '';
  for (key in params) 
    uri += key + '=' + params[key] + '&';
  return encodeURI(uri.substring(0, uri.length - 1));
}

var LineChart = 
{
  x: null,
  y: null,
  brushExtent: null,
  width: null,
  height: null,
  margin: null,
  xAxis: null,
  yAxis: null,
  series: [],
  zoom: null,
  zoomScale: 1.0,
  zoomXTranslate: 0,
  prevZoomScale: null,
  prevZoomXTranslate: null,
  prevXDomain: null,
  brush: null,
  chartHeight: null,
  svg: null,
  path: null,
  elems: {
    container: null,
    svg: null,
    info: null,
    settingsDiv: null,
    animDiv: null,
    optionsDiv: null,
    compareDiv: null,
    detailsDiv: null
  },
  color: ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#3b3eac", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300"],
  colorUsed: {},
  lastZoomTime: 0,
  zoomDelay: 200,
  zoomCallback: function() {},
  formatDate: d3.time.format("%b %e, %Y %I:%M %p"),


  init: function(container, chartHeight, zoomCallback, compareCallback) {
    this.elems.container = container;
    this.zoomCallback = zoomCallback;
    this.compareCallback = compareCallback;
    this.chartHeight = chartHeight;
    
    this.margin = {top: 25, right: 80, bottom: 25, left: 25};
        //width = 400 - this.margin.left - this.margin.right,
        var cont =  $($(this.elems.container).get(0));
        //console.log("Chart width: " + cont.width());
        this.width = cont.width() - this.margin.left - this.margin.right;
        //this.width = cont.width() - cont.offset().left - this.margin.left - this.margin.right;
         this.height = this.chartHeight - this.margin.top - this.margin.bottom;

    this.x = d3.time.scale().range([0, this.width]);
    this.y = d3.scale.linear().range([this.height, 0]);

    this.brush =d3.svg.brush()
      .x(this.x)
      //.on("brushstart", $.proxy(this.brushdown, this))
      //.on("brush", $.proxy(this.brushed, this))
      .on("brushend", $.proxy(this.brushdown, this));

    this.xAxis = d3.svg.axis()
        .scale(this.x)
        .orient("bottom")
        .tickPadding(6);

    this.yAxis = d3.svg.axis()
        .scale(this.y)
        .orient("left")
        .tickSize(-this.width)
        .tickPadding(6)
        .ticks(6);

    this.zoom = d3.behavior.zoom()
        .scaleExtent([1, 16])
        .on("zoom", $.proxy(this.onZoom, this));

    this.elems.svg = this.elems.container
        .attr("class", "chart")
         .append("svg")
        .attr("width", this.width + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .attr("class", "linechart")
       .append("g")
         .attr("transform", "translate(" + 60 + "," + this.margin.top + ")");

    this.svg = $(".linechart");
    this.elems.svg.append("g")
        .attr("class", "y axis");

    this.elems.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")");

    this.elems.svg.append("clipPath")
        .attr("id", "clip")
      .append("rect")
        .attr("class", "rect-clip")
        .attr("x", this.x(0))
        .attr("y", this.y(1))
        .attr("width", this.x(1) - this.x(0))
        .attr("height", this.y(0) - this.y(1));

    var self = this;
    this.pane = this.elems.svg.append("rect")
        .attr("class", "pane")
        .attr("width", this.width)
        .attr("height", this.height);

    this.pane.on("mousemove", function() { return self.mousemove(self, this) })
        .on("mouseout", function() { return self.mouseout(self, this) })
        .call(this.zoom);

    this.elems.info = this.elems.container.select("svg").append("g")
        .attr("class", "info")
        //.attr("transform", "translate(" + this.margin.left + "," + (this.margin.top - 5) + ")");
        .attr("transform", "translate(" + 60 + "," + (this.margin.top - 5) + ")");
    
    this.elems.info.append("text")
        .attr("class", "date");

    this.elems.optionsDiv = container.append("div")
        .attr("class", "chart-options")
        .attr("height", (this.margin.top + this.height))
       .style("top", this.margin.top + "px")
       .style("left", (this.margin.left + this.width + 10) + "px")

    var resetButton = this.elems.optionsDiv.append("div")
        .attr("class", "sprites reset")
        .attr("title", "reset")
        .on("click", $.proxy(this.reset, this));

//     var trends = this.elems.optionsDiv.append("div")
//         .attr("class", "sprites trends")
//         .attr("title", "trends")
//        .style("this.margin-top", "5px")
    this.elems.settingsDiv = container.append("div").attr("class", "chart-settings");
    this.elems.animDiv = this.elems.settingsDiv.append("div").attr("id", "animControls");
    //$("#animControls").css("margin-left", this.margin.left + 34);
    this.elems.animDiv.html("<button class='play-pause anim-input play-icon' type='button' title='Play/Pause'></button><button class='stop anim-input stop-icon' type='button' title='Stop'></button>");
    this.elems.compareDiv = this.elems.settingsDiv.append("div")
        .attr("class", "chart-compare");

    var form =  this.elems.compareDiv.append("form")
        .on("submit", $.proxy(this.compare, this));

    var compareInput = form.append("input")
        .attr("class", "compare-input")
        .attr("type", "text")
        .attr("placeholder", " Compare");

    this.elems.detailsDiv = this.elems.settingsDiv.append("div")
        .attr("class", "chart-details");

  },

  updateSize: function() {
    //console.log("updating");
    var cont =  $($(this.elems.container).get(0));
    this.width = cont.width() - this.margin.left - this.margin.right;
    //console.log("width: " + this.width);
    this.height = this.chartHeight - this.margin.top - this.margin.bottom;
    //this.svg.remove();

    this.x = d3.time.scale().range([0, this.width - 39]);
    this.y = d3.scale.linear().range([this.height, 0]);

    this.xAxis = d3.svg.axis()
        .scale(this.x)
        .orient("bottom")
        .tickPadding(6);

    this.yAxis = d3.svg.axis()
        .scale(this.y)
        .orient("left")
        .tickSize(-this.width)
        .tickPadding(6)
        .ticks(6);

    this.elems.svg = this.elems.container
        .attr("class", "chart")
         .append("svg")
        .attr("width", this.width + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .attr("class", "linechart")
       .append("g")
         .attr("transform", "translate(" + 60 + "," + this.margin.top + ")");

    this.svg = $(".linechart");
    this.elems.svg.append("g")
        .attr("class", "y axis");

    this.elems.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")");

    this.elems.svg.append("clipPath")
        .attr("id", "clip")
      .append("rect")
        .attr("class", "rect-clip")
        .attr("x", this.x(0))
        .attr("y", this.y(1))
        .attr("width", this.x(1) - this.x(0))
        .attr("height", this.y(0) - this.y(1));

    var self = this;
    this.pane = this.elems.svg.append("rect")
        .attr("class", "pane")
        .attr("width", this.width)
        .attr("height", this.height);

    this.pane.on("mousemove", function() { return self.mousemove(self, this) })
        .on("mouseout", function() { return self.mouseout(self, this) })
        .call(this.zoom);

    this.elems.info = this.elems.container.select("svg").append("g")
        .attr("class", "info")
        //.attr("transform", "translate(" + this.margin.left + "," + (this.margin.top - 5) + ")");
        .attr("transform", "translate(" + 60 + "," + (this.margin.top - 5) + ")");
    
    this.elems.info.append("text")
        .attr("class", "date");
    this.draw();
    /*
    this.svg
        .attr("width", this.width + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
    */
    /*
    this.elems.svg
        .attr("width", this.width + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
    */
  },

  brushed: function() {
    //console.log("brushed");
  },

  brushdown: function() {
    //console.log("brushdown");
    var brushChanged = (+this.brush.extent()[0] != +this.brushExtent[0] || +this.brush.extent()[1] != +this.brushExtent[1]);
    if (brushChanged)
        this.zoomCallback();

    //console.log(this.brush.extent());
  },


  setBrushExtent: function(extent) {
    //console.log(extent);
    this.brushExtent = extent;
    this.brush.extent(this.brushExtent);
    this.redrawBrush();
  },


  onLineChartJson: function(id, json) {
    //console.log("hi");
    var data = [];
    if (y in json) { // means we have percent
        for (i in json.x) {
          var time = json.x[i];
          //time = time - 4 * 60 * 60; // hack: original data set is ahead by 4 hours.
          var percent = json.percent[i];
          if (json.count[i] > 0)
              data.push({date: new Date(time * 1000), value: count});
        }
    }
    else {
        for (i in json.x) {
          var time = json.x[i];
          //time = time - 4 * 60 * 60; // hack: original data set is ahead by 4 hours.
          var count = json.count[i];
          data.push({date: new Date(time * 1000), value: count});
        }
    }
    this.addSeries(id, id, data);
  },

  getXDomain: function() {
    //jvar xDomain = [this.series.xDomain[0], this.series.xDomain[1]];
    var xDomain = [d3.min(this.series, function(s) { return s.xDomain[0] }), 
                   d3.max(this.series, function(s) { return s.xDomain[1]})];
    console.log(xDomain);
    xDomain[1] = new Date(xDomain[1].getTime() + 60 *30000);
    console.log(xDomain);
    return xDomain;
  },

  getYDomain: function() {
    var yDomain = [d3.min(this.series, function(s) { return s.yDomain[0] }), 
                   d3.max(this.series, function(s) { return s.yDomain[1] })];
    return yDomain;
  },

  getXRange: function() {
    var range = this.x.range();
    return [this.x.invert(range[0]), this.x.invert(range[1])];
  },

  addSeries: function(id, name, data, frameStart, frameEnd) {
    var self = this;
    var xDomain = d3.extent(data, function(d) { return d.date; });
    //var xDomain = [frameStart*1000, frameEnd*1000]; 
    var yDomain = d3.extent(data, function(d) { return d.value; });
    
    var line = d3.svg.line()
        .interpolate("monotone")
        .x(function(d) { return self.x(d.date); })
        .y(function(d) { return self.y(d.value); });

    var color = this.color.filter(function(color) { return !(color in self.colorUsed); })[0];
    this.colorUsed[color] = true;
    this.series.push({id: id, name: name, xDomain: xDomain, yDomain: yDomain, data: data, line: line, color: color});
    /*
    if (this.prevXDomain != null) {
        this.x.domain(this.prevXDomain);
    }
    else {
        this.x.domain(this.getXDomain());
    }
    */
    console.log("X domain");
    this.x.domain(this.getXDomain());
    this.y.domain(this.getYDomain());
    this.zoom.x(this.x);   
    if (this.prevZoomScale != null) {
        this.zoom.scale(this.prevZoomScale);
        this.zoom.translate([this.prevZoomXTranslate, 0]);
    }

        


    //var zoomScale = (this.x.domain()[1]-this.x.domain()[0])/(frameEnd*1000-frameStart*1000);
    //var zoomXTranslate = (this.x.domain()[0] - frameStart*1000) / (this.x.domain()[1]-this.x.domain()[0]) * this.width;
    //this.zoom.scale(zoomScale);
    //this.zoom.translate([zoomXTranslate, 0]);


    if (this.brushExtent == null) {
        this.brushExtent = [frameStart*1000, frameEnd*1000];
      /*
      this.b0 = this.x.domain()[0];
      this.b1 = new Date(this.b0.getTime() + 86400 * 3 * 1000);
      */


      this.brush.extent(this.brushExtent);
      //console.log("brush");
      //console.log(this.brush.extent());

      this.elems.svg.append("g")
        .attr("class", "brush")
        .call(this.brush)
        .attr("transform", "translate(0,0)")
        .selectAll("rect")
        .attr("y", 0)
        .attr("height",this.height);
    }

    this.elems.svg.insert("path", "rect.pane")
        .attr("class", "line")
        .attr("id", "line" + id)
        .attr("clip-path", "url(#clip)")
       .style("stroke", color)
        .data([data]);

    var focus = this.elems.svg.insert("g", "rect.pane")
        .attr("class", "focus")
        .attr("id", "focus" + id)
       .style("display", "none");

    focus.append("circle")
        .attr("r", 4.5);
    
    var legend = this.elems.info.append("g")
        .attr("class", "legend")
        .attr("id", "legend" + id)
       .style("display","none");
    
    legend.append("circle")
        .attr("r", 6)
        .attr("fill", color);
    
    legend.append("text")
        .attr("x", 12)
        .attr("y", 4);

    name = name || "All tweets";

    detailMouseOver = function() {
      d3.select(this).select(".detail").select("span").classed("hover", true);
      d3.select(this).select(".detail").select("div").classed("hover", true);
    }
    
    detailMouseOut = function() {
      d3.select(this).select(".detail").select("span").classed("hover", false);
      d3.select(this).select(".detail").select("div").classed("hover", false);
    }

    var detail = this.elems.detailsDiv
      .append("li")
        .attr("class", "detail-container")
        .attr("id", "detail-container" + id)
        .on("mouseover", detailMouseOver)
        .on("mouseout", detailMouseOut);

    var content = detail.append("div")
        .attr("class", "detail")
        .attr("id", "detail" + id)

    content.append("span")
        .attr("class", "detail-legend")
       .style("background", color);

    content.append("div")
        .attr("class", "detail-text")
        .html("<i>" + name + "</i>");

    if (this.series.length != 1) {
      //console.log("series: " + this.series.length);
       
      detail.append("div")
          .attr("class", "sprites remove zoom75")
          .attr("id", "remove" + id)
          .attr("title", "remove")
          .data([id])
          .on("click", $.proxy(this.removeSeries, this, id));
    }
    
    this.resetInfo();
    this.draw();
  },
  
  draw: function() {
    //console.log('in draw', this);
    var svg = this.elems.svg;
    svg.select("g.x.axis").call(this.xAxis);
    svg.select("g.y.axis").call(this.yAxis);
    this.series.forEach(function(d) {svg.select("path.line#line" + d.id).attr("d", d.line)});
    this.prevXDomain = this.x.domain().slice(0);
  },

  redrawBrush: function() {
    this.elems.svg.select(".brush").call(this.brush);
  },

  onZoom: function() {
    var self = this;
    this.prevZoomScale = this.zoom.scale();
    this.prevZoomXTranslate = this.zoom.translate()[0];
    /*
    var viewChanged = (+this.x.domain()[0] != +this.prevXDomain[0] || 
                       +this.x.domain()[1] != +this.prevXDomain[1]);
    this.brush.extent([this.b0, this.b1]);
    this.draw();
    if (viewChanged) {
      var now = new Date();
      this.lastZoomTime = now;
      setTimeout(function() {
	if (self.lastZoomTime == now)
          self.zoomCallback();
      }, this.zoomDelay);
    }
    */
  },

  resetLegends: function() 
  {
    var dateBBOX = this.elems.info.select("text.date").node().getBBox();
    var legends = this.elems.info.selectAll("g.legend");
    var offsetX = dateBBOX.x + dateBBOX.width + 12;
    var offsetY = dateBBOX.y + dateBBOX.height/2;
    var legendWidths = legends[0].map(function(d) { 
	var radius = +d3.select(d).select("circle").attr("r");
	return (d.getBBox().width + radius);
    });
    var legendOffsets = legendWidths.map(function(d, i) {
	return legendWidths.slice(0, i+1).reduce(function(a, b) {
	    return a + b;
	});
    });
    legendOffsets.unshift(0);
    legendOffsets.pop();
    legends
	.data(legendOffsets)
        .attr("transform", function(d) {return "translate(" + (offsetX + d) + "," + offsetY + ")"});
  },

  resetInfo: function() {
    var range = this.formatDate(this.getXRange()[0]) + " - " + this.formatDate(this.getXRange()[1]);
    this.elems.info.select("text.date").text(range);
    this.elems.info.selectAll("g.legend").select("text").text("");
  },
  
  reset: function() {
    var self = this;
    var viewChanged = (+this.x.domain()[0] != +this.getXDomain()[0] || 
                       +this.x.domain()[1] != +this.getXDomain()[1]);

    d3.transition().duration(750).tween("zoom", function() {
      function getTime(date) {return +date;}
      var ix = d3.interpolate(self.x.domain().map(getTime), self.getXDomain().map(getTime));
      return function(t) {
        self.zoom.x(self.x.domain(ix(t)));
        self.resetInfo();
        self.draw();
      };
    });
    if (viewChanged)
      this.zoomCallback();
  },

  resetY: function() {
    var self = this;
    var viewChanged = (+this.y.domain()[0] != +this.getYDomain()[0] || 
                       +this.y.domain()[1] != +this.getYDomain()[1]);

    d3.transition().duration(750).tween("zoom", function() {
      var iy = d3.interpolate(self.y.domain(), self.getYDomain());
      return function(t) {
        self.zoom.y(self.y.domain(iy(t)));
        self.draw();
      };
    });
  },

  mouseout: function(self) {
    var series = self.series;
    self.elems.svg.selectAll("g.focus").style("display", "none");
    self.elems.info.selectAll("g.legend").style("display", "none");
    self.resetInfo();
      
  },

  mousemove: function(self, elem) {
    self.elems.svg.selectAll("g.focus").style("display", null);
    self.elems.info.selectAll("g.legend").style("display", null);
    self.elems.info.style("display", null);
    var x0 = self.x.invert(d3.mouse(elem)[0]);
    var svg = self.elems.svg;
    var series = self.series;
    var formatDate = d3.time.format("%b %e, %Y %I:%M %p"),
        bisectDate = d3.bisector(function(d) { return d.date; }).left;
    var date;
    self.series.forEach(function(s, i) {
      var data = svg.select("path.line#line" + s.id).data()[0],
             t = bisectDate(data, x0, 1),
            d0 = data[t - 1],
            d1 = data[t] || d0,
             d = x0 - d0.date > d1.date - x0 ? d1 : d0;
      date = d.date;
      svg.select("g.focus#focus" + s.id)
          .attr("transform", "translate(" + self.x(d.date) + "," + self.y(d.value) + ")");
      self.elems.info.select("g.legend#legend" + s.id).select("text").text(d.value);
    });
    if (date) self.elems.info.select("text.date").text(formatDate(date));
    self.resetLegends();
  },

  compare: function() {
    d3.event.preventDefault();
    var terms = this.elems.compareDiv.select("form").select(".compare-input")
        .property("value");
    this.elems.compareDiv.select("form").select(".compare-input")
        .property("value", "");
    this.compareCallback(terms);
  },

  removeSeries: function(id) {
    var self = this;
    var series = this.series.filter(function(s) { return (id == s.id); })[0]
    if (!series) return;
    delete this.colorUsed[series.color];
    this.series.map(function(s, i) { if (id == s.id) self.series.splice(i, 1); });
    this.elems.svg.select("path.line#line" + id).data([]).exit().remove();
    this.elems.svg.select("g.focus#focus" + id).data([]).exit().remove();
    this.elems.info.select("g.legend#legend" + id).data([]).exit().remove();
    this.elems.detailsDiv.select("li.detail-container#detail-container" + id).data([]).exit().remove();
    this.draw();
  },

  removeAll: function() {
    this.series = [];
    this.colorUsed = {}; 
    this.lastZoomTime = 0;
    this.elems.svg.selectAll("path.line").data([]).exit().remove();
    this.elems.svg.selectAll("g.focus").data([]).exit().remove();
    this.elems.info.selectAll("g.legend").data([]).exit().remove();
    this.elems.detailsDiv.selectAll("li.detail-container").data([]).exit().remove();
  }
}

var gg = 
{
  host: "http://localhost:3000/",
  params: {
    request: "Graph",
    sql: "select time from gt where time >= 1365998400 and time <= 1366084800",
    bbox: "-16163382.546147,670006.412153,-5176018.353852,8487374.167847",
    histstart: 1366059600,
    histend: 1366074000,
    histbins: 100
  }
}

function zoomcb() {
  //console.log('zoom callback');
}

function test() {
LineChart.init(d3.select("body").select("div#chart"), zoomcb);

gg.params.sql = "select time from gt where time >= 1365998400 and time <= 1366084800 where tweet_text ilike 'obama'"
var url = gg.host + '?' + buildURI(gg.params);
$.getJSON(url).done($.proxy(LineChart.onLineChartJson, LineChart, 1));

gg.params.sql = "select time from gt where time >= 1365998400 and time <= 1366084800 where tweet_text ilike 'prayforboston'"
var url = gg.host + '?' + buildURI(gg.params);
$.getJSON(url).done($.proxy(LineChart.onLineChartJson, LineChart, 2));
  
gg.params.sql = "select time from gt where time >= 1365998400 and time <= 1366084800 where tweet_text ilike 'new york'"
var url = gg.host + '?' + buildURI(gg.params);
$.getJSON(url).done($.proxy(LineChart.onLineChartJson, LineChart, 3));

gg.params.sql = "select time from gt where time >= 1365998400 and time <= 1366084800 where tweet_text ilike 'boston'"
var url = gg.host + '?' + buildURI(gg.params);
$.getJSON(url).done($.proxy(LineChart.onLineChartJson, LineChart, 4));
}
