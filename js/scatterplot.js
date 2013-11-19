var ScatterPlot =
{
  topktokens: null,
  xScale: null,
  yScale: null,
  rScale: null,
  cScale: d3.scale.category10(),
  width: null,
  height: null,
  margin: null,
  xAxis: null,
  yAxis: null,
  series: [],
  abbrFormat: null,
  data: null,
  vars: null,
  colorVar: "region",
  selectedVar: "pst045212",
  minTweets: 40000,
  elems: {
    container: null,
    svg: null,
    varPicker: null,
    info: null,
  },

  init: function(topktokens, container) {
    this.topktokens = topktokens;
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
    //this.cScale = d3.scale.category10();
    this.rScale = d3.scale.linear().range([2,5]);

    this.xAxis = d3.svg.axis().scale(this.xScale).orient("bottom").ticks(7);

    this.yAxis = d3.svg.axis().scale(this.yScale).orient("left").ticks(7);
    $(this.elems.varPicker).appendTo($(this.elems.container));
    $(this.elems.varPicker).change(this.topktokens.scatterVarChange);

    //$(this.elems.varPicker).append("<option Value='income'>Income Level</option><option Value='education'>Education Level</option>");

  },

  scatterVarChange: function() {
    //console.log($(this).find("option:selected"));
    //console.log($(this).find("option:selected").get(0).value);
    this.selectedVar = $(this).find("option:selected").get(0).value;
    
  },

  setVars: function(vars) {
    //this.elems.varPicker = $("<select></select>").attr("id", "scatterXVarSelect").appendTo($(this.elems.container));
    this.elems.varPicker = $("<select></select>").attr("id", "scatterXVarSelect");
    //console.log(vars);
    //console.log(this);
    this.vars = $.map(vars.columns, function (c, idx) {
      if (c.tag == "null" || c.tag.search(":") == -1)
        return null;
      return c;
    });
 
    var defaultIndex = -1;
    var defaultVar = null;
    var selectedVarFoundIndex = -1;
    var colorIndex = -1;
    $(this.vars).each($.proxy(function(index, element) {
      console.log(element.tag);
      if ((element.tag) == "color:") {
        console.log("color!!!!");
        this.colorVar = element.name;
        colorIndex = index;
        return true;
      }
      if (element.name == this.selectedVar)
        selectedVarFoundIndex = index;
      var tag = element.tag.substring(1,element.tag.length-1)      
      var elemArray = tag.split(':');
      if (elemArray[0].substring(0,3) == "pct")
        elemArray[1] = "% " + elemArray[1];
      if (elemArray[0].search("default") != -1) {
        defaultIndex = index;
        console.log("default: " + element.name);
        defaultVar = element.name; 
      }
      $(this.elems.varPicker).append('<option Value="' + element.name +'">'+elemArray[1]+'</option>');

      //console.log(element);
      //console.log(this);
      //console.log(this.elems.varPicker);
    }, this));

    console.log("default index: " + defaultIndex);
    console.log("selected index: " + selectedVarFoundIndex);

    if (selectedVarFoundIndex >= 0) {
      if (colorIndex != -1 && colorIndex < selectedVarFoundIndex)
        selectedVarFoundIndex--;
      $(this.elems.varPicker).children().eq(selectedVarFoundIndex).prop('selected', true);
    }
    else if (defaultIndex >= 0) {
      if (colorIndex != -1 && colorIndex < defaultIndex)
        defaultIndex--;
      this.selectedVar = defaultVar;
      console.log("this selected var: " + this.selectedVar);
      $(this.elems.varPicker).children().eq(defaultIndex).prop('selected', true);
    }

      //$(ScatterPlot.elems.varPicker).append('<option Value=' + c.name +'>'+c.tag+'</option>');
  },
    

  getLeastSquares: function (data, xVar, yVar) {
    var sumX = 0;
    var sumY =0;
    var sumXY = 0;
    var sumXX = 0;
    var count = 0;

    var x = 0;
    var y = 0;
    var numVals = data.length;
    if (numVals == 0)
      return 0;
    for (var v = 0; v < numVals; v++) {
      x = data[v][xVar];
      y = data[v][yVar];
      sumX += x;
      sumY += y;
      sumXX += x*x;
      sumXY += x*y;
      count++;
    }

    // y = mx + b
   
    results = {}
    results.m = (count * sumXY - sumX*sumY) / (count*sumXX - sumX * sumX);
    results.b = (sumY / count) - (results.m*sumX)/count;
    return results;

  },

  addData: function(dataset, numQueryTerms, dataNums, update) { 
    var minTweets = this.minTweets;
    this.data = dataset.results;
    if (dataNums == "Percents") {
        this.data = this.data.filter(function(d) {
            if (d.n < minTweets)
                return false;
            return true;
        });
    }


    //d3.select("svg").remove();

    /*
    if (dataNums == "Percents") { 
      this.data = $.map(dataset.tokens, function(e1, idx) {
          if (e1 != "") {
            if (dataset.percents[idx] < 0.0)
              return null;
            return {"label": e1, "x": dataset.inc910211[idx] , "y": dataset.y[idx]};
          }
        }).slice(numQueryTerms);
     this.abbrFormat = d3.format(".2%"); 
    }
    /*
    else if (dataNums == "Trends") {
      this.data = $.map(dataset.tokens, function(e1, idx) {
          if (e1 != "") 
              return {"label": e1, "x": Math.random() * 1000.0, "y":dataset.zScores[idx]};
      }).slice(numQueryTerms);
      this.abbrFormat = d3.format(".2s"); 
    }
    else if (dataNums == "Counts") {
      this.data = $.map(dataset.tokens, function(e1, idx) {
          if (e1 != "") {
            if (dataset.counts[idx] < 1)
              return null;
              return {"label": e1, "x": dataset.inc910211[idx], "y":dataset.y[idx]};
          }
      }).slice(numQueryTerms);
      this.abbrFormat = d3.format(".1s"); 
    }
    console.log(this.data);
    */
    if (dataNums == "Percents") { 
      this.abbrFormat = d3.format(".2%"); 
    }
    else {
      this.abbrFormat = d3.format(".1s"); 
    }
    this.yAxis.tickFormat(this.abbrFormat);
    this.xAxis.tickFormat(d3.format(".2s"));

    var selectedVar = this.selectedVar;
    var colorVar = this.colorVar;
    if (selectedVar == null)
      return null;


    this.xScale
      .domain([d3.min(this.data, function(d) {return d[selectedVar];}), d3.max(this.data, function(d) {return d[selectedVar];})]);

    /*if (dataNums == "Percents") {
        this.yScale.domain([d3.extent(this.data, function(d) {
            if (d.n > minTweets)
                return d.y;
        })]);
   // }*/
        /*this.yScale.domain([d3.extent(this.data, function(d) {
                return d.y;
        })]);*/
    this.yScale
      .domain([d3.min(this.data, function(d) {return d.y;}), d3.max(this.data, function(d) {return d.y;})]);

    if (dataNums == "Percents") { 
        this.rScale
          .domain([d3.min(this.data, function(d) {return d.n;}), d3.max(this.data, function(d) {return d.n;})]);
    }

    var xScale = this.xScale;
    var yScale = this.yScale;
    var rScale = this.rScale;
    var cScale = this.cScale;

    console.log("Selected Var: " +  selectedVar);
    console.log("ColorVar: " +  colorVar);

    if (dataNums == "Percents") {
      this.elems.svg.selectAll("circle")
        .data(this.data)
        .enter()
        .append("circle")
        .attr("cx", function(d) {
            return xScale(d[selectedVar]);
          })
        .attr("cy", function(d) {
            if (d.n > minTweets)
                return yScale(d.y);
          })
        .attr("r", function(d) {
            return rScale(d.n);
          })
        .style("fill", function(d) {
          return cScale(d[colorVar]);
        })
        .append("svg:title")
        .text(function (d) {
          return d.label; 
        });
    }
    else {
      console.log("not percents");
      this.elems.svg.selectAll("circle")
        .data(this.data)
        .enter()
        .append("circle")
        .attr("cx", function(d) {
            return xScale(d[selectedVar]);
          })
        .attr("cy", function(d) {
            return yScale(d.y);
          })
        .attr("r", 2)
        .style("fill", function(d) {
          return cScale(d[colorVar]);
        })
        .append("svg:title")
        .text(function (d) {
          return d.label; 
        });
    }

    var regResults = this.getLeastSquares(this.data, selectedVar, "y");
    console.log("reg results:");
    console.log(regResults);

    var xSubDomain = this.xScale.domain();
    var xMean = xSubDomain[0] + xSubDomain[1] * 0.5;
    xSubDomain[0] = xMean - (xMean - xSubDomain[0]) * 0.95;
    xSubDomain[1] = xMean + (xSubDomain[1] - xMean) * 0.95;

    console.log("x0 = " + xScale(xSubDomain[0]));
    console.log("x1 = " + xScale(xSubDomain[1]));

    var p0 = [xScale(xSubDomain[0]) + 0.5, yScale(regResults.m * xSubDomain[0] + regResults.b) + 0.5]
    var p1 = [xScale(xSubDomain[1]) + 0.5, yScale(regResults.m * xSubDomain[1] + regResults.b) + 0.5]
    console.log(p0);
    console.log(p1);
    
    //console log ("(" + x0 + "," + x1 + ") - (" + y0 + "," + y1 + ")");
    this.elems.svg.append('svg:line')
      .attr('x1', p0[0])
      .attr('y1', p0[1])
      .attr('x2', p1[0])
      .attr('y2', p1[1])
      .attr("stroke-width",2)
      .attr("stroke", "blue");


     console.log("# items: " + this.data.length);
     if (this.data.length < 20) {
        this.elems.svg.selectAll("text")
          .data(this.data)
          .enter()
          .append("text")
          .text(function(d) {
            return d.label;
          })
          .attr("x", function(d) {
            return xScale(d[selectedVar]) + 4;
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




