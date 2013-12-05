
now = 0
last = 0

 function pointProject (pos){
      var point= map.getViewPortPxFromLonLat(new OpenLayers.LonLat(pos[0], pos[1]));
      //console.log(point);
      return [point.x, point.y];
    }

var RealTimeOverlay = {
   svg: null,
   overlay: null,
   g: null,
   projection: null,
   data: null,
   circles: null,

   init: function() {
     this.overlay = new OpenLayers.Layer.Vector("tweets");
     this.overlay.afterAdd = $.proxy(function() {
      var div = d3.selectAll("#" + this.overlay.div.id);
      div.selectAll("svg").remove();
      this.svg = div.append("svg").attr("class", "realtime");
      this.g = this.svg.append("g");
780780
      this.reset();

     }, this);
     map.addLayer(this.overlay);
     map.events.register("moveend", map, $.proxy(this.reset,this));


    },

   addData: function(data) {
      //console.log(data);
      //this.data = data;
      last = now;
      now = new Date().getTime();
      var diff = now -last;
      //console.log("Display delay: " + diff);
      var svg = this.svg;
      var g = this.g;
      g.selectAll("circle")
      .data(data, function(d) {return d.id;})
      .enter()
       .append("circle")
       .attr("r", 2)
        .style("fill","white")
      .transition()
       .delay(function() {return Math.round(Math.random() * timeUpdateInterval);})
       //.delay(function() {return Math.round(Math.random() * 3200);})
       .attr("cx",function(d){
          return pointProject([d.goog_x, d.goog_y])[0];
        })
       .attr("cy",function(d){
          return pointProject([d.goog_x, d.goog_y])[1];
        })
       .attr("r", 2) 
        .style("fill","red")
       .style("opacity", 0.7)
        .transition()
        //.delay(5000)
        .duration(1000)
        .attr("r",0)
        .style("opacity", 0.0);

        g.selectAll("circle")
        .data(data, function(d) {return d.id;})
        .exit()
        .remove();
     },
    

  removeData: function() {
    this.g.selectAll("circle")
    .data([])
    .exit()
    .transition()
    .duration(800)
    .attr("r",0)
    .attr("fill", "58FCD0")
    .style("opacity", 0.0)
    .remove();
  },



   addCsvData: function() {
      var svg = this.svg;
      var g = this.g;
      d3.csv("js/test.csv", function(data) {
       //console.log(data);
       RealTimeOverlay.data = data;
       g.selectAll("circle")
       .data(data)
       .enter()
       .append("circle")
       .attr("cx",function(d){
          return pointProject([d.x, d.y])[0];
        })
       .attr("cy",function(d){
          return pointProject([d.x, d.y])[1];
        })
       .attr("r", 0)
       .style("fill","white")
       .style("opacity", 0.6);

       g.selectAll("circle")
        .data(data)
        .transition()
        .delay(1000)
        .duration(500)
        .attr("r",5)
        .style("opacity", 1.0)
        .transition()
        .duration(2000)
        .attr("r",3)
        .style("opacity", 0.0);
        
     });

   },
   /*
   addData: function(dataset) {
      var svg = this.svg;
      var g = this.g;
      d3.csv("js/test.csv", function(data) {
       console.log("happy: ");
       console.log(data);
       RealTimeOverlay.data = data;
       g.selectAll("circle")
       .data(data)
       .enter()
       .append("circle")
       .attr("cx",function(d){
          return project([d.x, d.y])[0];
        })
       .attr("cy",function(d){
          return project([d.x, d.y])[1];
        })
       .attr("r", 0)
       .style("fill","white")
       .style("opacity", 0.6);

       g.selectAll("circle")
        .data(data)
        .transition()
        .duration(500)
        .attr("r",5)
        .style("opacity", 1.0)
        .transition()
        .duration(2000)
        .attr("r",3)
        .style("opacity", 0.0);
        
     });

   },
   */
   reset: function() {
     var size = map.getSize();
     //console.log("size: ");
     //console.log(size);

     this.svg.attr("width", size.w)
       .attr("height", size.h);
     //if (this.data != null) {
     this.g.selectAll("circle")
     .attr("cx",function(d){
        //console.log(d.goog_x);
        return project([d.goog_x, d.goog_y])[0];
      })
     .attr("cy",function(d){
        return project([d.goog_x, d.goog_y])[1];
          });
       //var data = this.data;
       /*
       g.selectAll("circle")
         .data()
         .update()
         */
      //}
   }
       

    
    
        
}
    


    
