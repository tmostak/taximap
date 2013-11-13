

 function project (pos){
      var point= map.getViewPortPxFromLonLat(new OpenLayers.LonLat(pos[0], pos[1]));
      return [point.x, point.y];
    }

var RealTimeOverlay = {
   svg: null,
   overlay: null,
   g: null,
   projection: null,

   init: function() {
     this.overlay = new OpenLayers.Layer.Vector("tweets");
     this.overlay.afterAdd = $.proxy(function() {
      var div = d3.selectAll("#" + this.overlay.div.id);
      div.selectAll("svg").remove();
      this.svg = div.append("svg").attr("class", "happy");
      this.g = this.svg.append("g");

      this.reset();

     }, this);
     map.addLayer(this.overlay);
    },

   addData: function() {
      var svg = this.svg;
      var g = this.g;
      d3.csv("js/test.csv", function(data) {
       console.log("happy: ");
       console.log(data);
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
       .attr("r", 5)
       .style("fill","white")
       .style("opacity", 0.75);
     });

   },

   reset: function() {
     this.svg.attr("width", 1000)
       .attr("height", 780);
   }
       

    
    
        
}
    


    
