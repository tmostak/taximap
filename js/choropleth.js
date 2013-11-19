

 function project (pos){
      var point= map.getViewPortPxFromLonLat(new OpenLayers.LonLat(pos[0], pos[1])
        .transform("EPSG:4326", "EPSG:900913"));
      return [point.x, point.y];
    }

var joinParams = {
    "countries": {jointable: "country_data", joinvar: "name", joinattrs: "pst045212,iso_a2", pop_var: "pst045212", map_key: "ISO2", data_key: "iso_a2", data_col: "country"},
    "states": {jointable: "state_data", joinvar: "name", joinattrs: "pst045212", pop_var: "pst045212", map_key: "abbr", data_key: "label", data_col: "state"},
    "counties": {jointable: "county_data", joinvar: "name", joinattrs: "pst045212,fips", pop_var: "pst045212", map_key: "id", data_key: "fips", data_col: "county"}
};

var Choropleth = {
  active: false,
  mapd: MapD,
  svg: null,
  overlay: null,
  g: null,
  projection: null,
  data: null,
  path: null,
  minTweets: 4000,
  colorScale: null,
  features: null,
  percents: false,
  //data_col: "state",
  opacity: 0.7,
  geoData: null,
  curJoinParams: null,
  params: {
    request: "GroupByToken",
    sql: null,
    sort: "false",
    jointable: "state_data",
    joinvar: "name",
    joinattrs: "pst045212",
    k: 5000 
  },
    
    

   init: function(geoChoice) {

     $("#polyMinSlider").slider({
        min: 0,
        max: 30000,
        value: this.minTweets,
        stop: $.proxy(function(e, ui) {
          this.minTweets = ui.value;
          this.draw();
        }, this)
     });
     $("#polyMinOpt").hide();

     $("#polyMenu").click($.proxy(function(e) {
        var menu
        var choice = this.getMenuItemClicked(e.target);
        //console.log(choice);
        this.setMenuItem(choice);
        
      }, this));



     this.overlay = new OpenLayers.Layer.Vector("tweets");
     //this.overlay.setZIndex(0);
     this.overlay.afterAdd = $.proxy(function() {
      //console.log("After add!");
      var div = d3.selectAll("#" + this.overlay.div.id);
      div.selectAll("svg").remove();
      this.svg = div.append("svg").attr("class", "choropleth");
      this.g = this.svg.append("g");
      this.path = d3.geo.path().projection(project);
      this.colorScale = d3.scale.quantize().range(["rgb(255,255,229)","rgb(255,247,188)", "rgb(254,227,145)", "rgb(254,196,79)", "rgb(254,153,41)", "rgb(236,112,20)", "rgb(204,76,2)", "rgb(140,45,4)"]);
      /*this.colorScale = d3.scale.quantize()
                         .range(["rgb(237,248,233)", "rgb(186,228,179)",
                          "rgb(116,196,118)", "rgb(49,163,84)","rgb(0,109,44)"]);*/
      //this.addGeoData(filename);
      this.setMenuItem(geoChoice);
      this.reset();

     }, this);
     map.addLayer(this.overlay);
     map.events.register("moveend", map, $.proxy(this.reset,this));

    },

   setMenuItem: function(choice) {
       //debugger;
       if (choice != this.geoData) {
         this.geoData = choice;
         var choiceDiv = "#poly" + choice;
         $("#polyMenu span.checkmark").css("visibility", "hidden");
         $(choiceDiv + " .checkmark").css("visibility","visible");
           switch (choice) {
             case "Country":
                this.addGeoData("countries.json");
                break;
             case "State":
                this.addGeoData("states.json");
                break;
             case "County":
                this.addGeoData("counties.json");
                break;
            }
         }
         this.reload();

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
   getUrl: function(options) {
      var numQueryTerms = this.mapd.queryTerms.length;
      if (numQueryTerms > 0) {
           if (options == undefined || options == null) 
             options = {splitQuery: true};
           else
              options.splitQuery = true;
    }
      var query = this.mapd.getWhere(options);

      this.params.sql = "select " + this.curJoinParams.data_col;
      //console.log("query terms: " + numQueryTerms);

      if (numQueryTerms > 0) {
          this.params.sql += "," + query[0] + " from " + this.mapd.table + query[1]; 
          this.percents = true;
          $("#polyMinOpt").show();
      }
      else {
          this.params.sql += " from " + this.mapd.table + query; 
          this.percents = false;
          $("#polyMinOpt").hide();
      }
   
      //this.params.bbox = this.mapd.map.getExtent().toBBOX();
      var url = this.mapd.host + '?' + buildURI(this.params);
      return url;
    },
   
    activate: function() {
      this.active = true;
      this.features = this.g.selectAll("path")
        .style("opacity", 0.7);
      //$(this.svg).show();
      this.reload();
    },

    deactivate: function() {
      this.active = false;
      this.features = this.g.selectAll("path")
        .style("opacity", 0.0);
      //$(this.svg).hide();
    },

    reload: function(options) {
      if (this.active)
        $.getJSON(this.getUrl(options)).done($.proxy(this.onLoad, this));
    },
    
    onLoad: function(dataset) {
      //console.log(dataset);
      this.data = dataset.results;
      /*
      if ('percents' in dataset) {
      this.data = $.map(dataset.tokens, function(e1, idx) {
          if (e1 != "") 
              return {"label": e1, "val":dataset.percents[idx] < -0.8 ? null : dataset.percents[idx]};
      });
    }
    else if ('zScores' in dataset) {
      this.data = $.map(dataset.tokens, function(e1, idx) {
          if (e1 != "") 
              return {"label": e1, "val":dataset.zScores[idx]};
      });
    }
    else {
      this.data = $.map(dataset.tokens, function(e1, idx) {
          if (e1 != "") 
              return {"label": e1, "val":dataset.counts[idx]};
      });
    }
     */

      var g = this.g;
      var data = this.data;
      var numVals = data.length;
      var curJoinParams = this.curJoinParams;
      if (this.percents == false) {
        for (var i = 0; i < numVals; i++)
            data[i].y /= data[i][curJoinParams.pop_var];
      }
      /*
        this.colorScale.domain([
          d3.min(this.data, function(d) {
              return d.y}),
          d3.max(this.data, function(d) {return d.y})
        ]);
      }
      else {
        this.colorScale.domain([
          d3.min(this.data, function(d) {
              if (d.n >= minTweets)
              return d.y}),
          d3.max(this.data, function(d) {
              if (d.n >= minTweets)
                return d.y}),
        ]);
      }
      */

      var numFeatures = this.features[0].length;
      //console.log("numFeatures: " + numFeatures);
      //console.log("numVals: " + numVals);

      var wasFound = 0;
      var notFound = 0;
      for (var f = 0; f < numFeatures; f++) {
        var joined = false;
        var key = "";
            if (this.params.jointable == "county_data") {
                key = this.features[0][f].__data__.id;
                /*key = (this.features[0][f].__data__.id).toString();
                //console.log(key.length);
                if (key.length < 5)
                    key = "0" + key;
                */
            }
            else
                key = this.features[0][f].__data__.properties[curJoinParams.map_key];
            //console.log("key: " + key);
            //console.log(this.features[0][f].__data__.properties);
            //console.log(data[0]);
            for (var i = 0; i < numVals; i++) {
              var found = false;
              if (data[i][curJoinParams.data_key] == key) {
               this.features[0][f].__data__.properties.y = data[i].y;
               this.features[0][f].__data__.properties.n = data[i].n;
               wasFound++;

               //console.log(this.features[0][f].__data__);
               found = true;
               break;
              }
            }
            if (!found) {
              notFound++;
              this.features[0][f].__data__.properties.y = null;
              this.features[0][f].__data__.properties.n = null;
            }
        }
        //console.log("Found: " + wasFound);
        //console.log("Not found: " + notFound);
        this.draw();
        $(this).trigger('loadend');
        //setTimeout($.proxy(function() {$(this).trigger('loadend'); console.log('yeah');}, this),100);
        //setTimeout($.proxy(function() {$(this).trigger('loadend'); console.log('yeah');}, this),100);
    },

    draw: function() {
      var minTweets = this.minTweets;
      var isCounty = this.params.jointable == "county_data";
      if (this.percents == false) {
        this.colorScale.domain([
          d3.min(this.features[0], function(d) {
              //if (d.__data__.properties.y >= minTweets)
                return d.__data__.properties.y;}),
          d3.max(this.features[0], function(d) {
              //if (d.__data__.properties.y >= minTweets)
                return d.__data__.properties.y;})
        ]);
      }
      else {
        this.colorScale.domain([
          d3.min(this.features[0], function(d) {
              if (d.__data__.properties.n >= minTweets)
              return d.__data__.properties.y}),
          d3.max(this.features[0], function(d) {
              if (d.__data__.properties.n >= minTweets)
                return d.__data__.properties.y}),
        ]);
      }
      var g = this.g;
      var colorScale = this.colorScale;
      var opacity= this.opacity;
      if (this.percents == true) {
        this.features = g.selectAll("path")
          .style("fill", function(d) {
            return(colorScale(d.properties.y));
          })
          .style("fill-opacity", function(d) {
            if (d.properties.n != null && d.properties.n >= minTweets)
              return opacity;
            else
              return 0.0;
          })
          .style("stroke-width", function() {
            if (isCounty)
                return 0.5;
            return 1.5;
          });
       }
      else {
        this.features = g.selectAll("path")
          .style("fill", function(d) {
            return(colorScale(d.properties.y));
          })
          .style("fill-opacity",opacity)
          .style("stroke-width", function() {
            if (isCounty)
                return 0.5;
            return 1.5;
          });


      }
    },

   addGeoData: function(filename) {
      //console.log(filename);
      //debugger;
      //this.g = "";
      d3.select("g").remove();
      this.g = this.svg.append("g");
      var g = this.g;
      var path = this.path;
      var file = "data/" + filename;
      var fileParts = filename.split('.');
      this.curJoinParams = joinParams[fileParts[0]];
      this.params.jointable = this.curJoinParams.jointable;
      this.params.joinvar = this.curJoinParams.joinvar;
      this.params.joinattrs = this.curJoinParams.joinattrs;
      //console.log(this.curJoinParams);
      if (filename == "counties.json") {
        d3.json(file, function(error,json) {
          Choropleth.features = g.selectAll("path")
            .data(topojson.feature(json, json.objects.counties).features)
            .enter().append("path")
            .attr("d",path)

          if (Choropleth.active == false)
            Choropleth.deactivate();
          //Choropleth.feature = g.append("path")
          //  .datum(topojson.mesh(us))
          //  .attr("d", path);
        });
      }
      else {
        d3.json(file, function(error,json) {
          Choropleth.features = g.selectAll("path")
            .data(json.features)
            .enter().append("path")
            .attr("d",path)

          if (Choropleth.active == false)
            Choropleth.deactivate();
        });
      }
   },

   reset: function() {
     var size = map.getSize();
     //console.log("size: ");
     //console.log(size);

     this.svg.attr("width", size.w)
       .attr("height", size.h);
     
     if (this.features != null) {
      //console.log("not null");
      this.features.attr("d", this.path);
    }


     /*
     if (this.data != null) {
       var g = this.g;
       var data = this.data;
       g.selectAll("circle")
         .data(data)
         .attr("cx",function(d){
            return project([d.x, d.y])[0];
          })
         .attr("cy",function(d){
            return project([d.x, d.y])[1];
          });
      }
      */
   }
}
    


    
