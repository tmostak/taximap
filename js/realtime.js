

 function project (pos){
      var point= map.getViewPortPxFromLonLat(new OpenLayers.LonLat(pos[0], pos[1]));
      return [point.x, point.y];
    }

var RealTimeOverlay = {
   svg: null,
   overlay: null,
   g: null,
   projection: null,
   data: null,

   init: function() {
     this.overlay = new OpenLayers.Layer.Vector("tweets");
     this.overlay.afterAdd = $.proxy(function() {
      var div = d3.selectAll("#" + this.overlay.div.id);
      div.selectAll("svg").remove();
      this.svg = div.append("svg").attr("class", "happy");
      this.g = this.svg.append("g");
780780
      this.reset();

     }, this);
     map.addLayer(this.overlay);
     map.events.register("moveend", map, $.proxy(this.reset,this));

    },

   addCsvData: function() {
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
        .delay(5000)
        .duration(500)
        .attr("r",5)
        .style("opacity", 1.0)
        .transition()
        .duration(2000)
        .attr("r",3)
        .style("opacity", 0.0);
        
     });

   },

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
   reset: function() {
     var size = map.getSize();
     console.log("size: ");
     console.log(size);

     this.svg.attr("width", size.w)
       .attr("height", size.h);
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
   }
       

    
    
        
}
    


    
