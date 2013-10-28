var ScatterPlot =
{
  xScale: null,
  yScale: null,
  rScale: null,
  width: null,
  height: null,
  margin: null,
  xAxis: null,
  yAxis: null,
  series: [],
  abbrFormat: null,
  data: null,
  elems: {
    container: null,
    svg: null,
    varPicker: null,
    info: null,
  },

  init: function(container) {
    this.elems.container = $(container).get(0);
    this.margin = {top: 20, right: 40, bottom: 20, left: 40};
    this.width = $(this.elems.container).width() - this.margin.left - this.margin.right;
     this.height = $(this.elems.container).height() - this.margin.top - this.margin.bottom;
    var svg = d3.select(this.elems.container)
    .attr("class", "scatterplot")
    .append("svg")
    .attr("width", this.width + this.margin.right)
    .attr("height", this.height + this.margin.top + this.margin.bottom)
    .append("g")
      .attr("transform", "translate(" + 50 + "," + this.margin.top + ")");

    this.elems.svg = svg;
    this.xScale = d3.scale.linear().range([0,this.width]);
    this.yScale = d3.scale.linear().range([this.height,0]);
    this.rScale = d3.scale.linear().range([2,5]);

    this.xAxis = d3.svg.axis().scale(this.xScale).orient("bottom").ticks(7);

    this.yAxis = d3.svg.axis().scale(this.yScale).orient("left").ticks(7);

    this.elems.varPicker = $("<select></select>").attr("id", "scatterXVarSelect").appendTo($(this.elems.container));
    $(this.elems.varPicker).append("<option Value='income'>Income Level</option><option Value='education'>Education Level</option>");

  },

  addData: function(dataset, numQueryTerms, dataNums) { 
    if (dataNums == "Percents") { 
      this.data = $.map(dataset.tokens, function(e1, idx) {
          if (e1 != "") {
            if (dataset.percents[idx] < 0.0)
              return null;
            return {"label": e1, "x": Math.random()*1000.0 , "y": (dataset.percents[idx])};
          }
        }).slice(numQueryTerms);
     this.abbrFormat = d3.format(".2%"); 
    }
    else if (dataNums == "Trends") {
      this.data = $.map(dataset.tokens, function(e1, idx) {
          if (e1 != "") 
              return {"label": e1, "x": Math.random() * 1000.0, "y":dataset.zScores[idx]};
      }).slice(numQueryTerms);
      this.abbrFormat = d3.format(".2s"); 
    }
    else {
      this.data = $.map(dataset.tokens, function(e1, idx) {
          if (e1 != "") {
            if (dataset.counts[idx] < 1)
              return null;
              return {"label": e1, "x": Math.random() * 1000.0, "y":dataset.counts[idx]};
          }
      }).slice(numQueryTerms);
      this.abbrFormat = d3.format(".1s"); 
    }
    console.log(this.data);
    this.yAxis.tickFormat(this.abbrFormat);

    this.xScale
      .domain([d3.min(this.data, function(d) {return d.x;}), d3.max(this.data, function(d) {return d.x;})]);

    this.yScale
      .domain([d3.min(this.data, function(d) {return d.y;}), d3.max(this.data, function(d) {return d.y;})]);

    var xScale = this.xScale;
    var yScale = this.yScale;


    this.elems.svg.selectAll("circle")
      .data(this.data)
      .enter()
      .append("circle")
      .attr("cx", function(d) {
          return xScale(d.x);
        })
      .attr("cy", function(d) {
          return yScale(d.y);
        })
      .attr("r", function(d) {
          return (2);
        })
      .append("svg:title")
      .text(function (d) {
        return d.label; 
      });

     console.log("# items: " + this.data.length);
     if (this.data.length < 50) {
        this.elems.svg.selectAll("text")
          .data(this.data)
          .enter()
          .append("text")
          .text(function(d) {
            return d.label;
          })
          .attr("x", function(d) {
            return xScale(d.x) + 4;
          })
          .attr("y", function(d) {
            return yScale(d.y);
          });
      }

     this.elems.svg.append("g")
        .attr("class", "y axis")
        //.attr("transform", "translate(" + this.margin.left + ",0)")
        .call(this.yAxis);
          
     this.elems.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height  +")")
        .call(this.xAxis);
  }
}




