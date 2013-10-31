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
  colorVar: null,
  //selectedVar: "inc910211",
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
    $(this.vars).each($.proxy(function(index, element) {
      console.log(element.tag);
      if ((element.tag) == "color:") {
        console.log("color!!!!");
        this.colorVar = element.name;
        return true;
      }
      var tag = element.tag.substring(1,element.tag.length-1)      
      var elemArray = tag.split(':');
      if (elemArray[0].substring(0,3) == "pct")
        elemArray[1] = "% " + elemArray[1];
      if (elemArray[0].search("default") != -1) {
        defaultIndex = index;
        this.selectedVar = element.name; 
      }
      $(this.elems.varPicker).append('<option Value="' + element.name +'">'+elemArray[1]+'</option>');

      //console.log(element);
      //console.log(this);
      //console.log(this.elems.varPicker);
    }, this));

    console.log("default index: " + defaultIndex);
    if (defaultIndex != -1) {
      //$("#scatterXVarSelect").val(this.selectedVar);
      //$('option[value=' + this.selectedVar + ']').attr('selected', 'selected');
      //console.log($("#scatterXVarSelect option"));
      //console.log(this.elems.varPicker);
      $(this.elems.varPicker).children().eq(defaultIndex).prop('selected', true);
      //console.log($("#scatterXVarSelect option").eq(defaultIndex).prop('selected', true));
    }

  

      //$(ScatterPlot.elems.varPicker).append('<option Value=' + c.name +'>'+c.tag+'</option>');


    //console.log(this.vars);
  },
    



  addData: function(dataset, numQueryTerms, dataNums) { 
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
    this.data = dataset.results;
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

    this.yScale
      .domain([d3.min(this.data, function(d) {return d.y;}), d3.max(this.data, function(d) {return d.y;})]);


    var xScale = this.xScale;
    var yScale = this.yScale;
    var cScale = this.cScale;


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
      .attr("r", function(d) {
          return (2);
        })
      .style("fill", function(d) {
        return cScale(d[colorVar]);
      })
      .append("svg:title")
      .text(function (d) {
        return d.label; 
      });

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




