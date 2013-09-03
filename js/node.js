var mPerKm = 1000;
var sPerHour = 60 * 60;

function AddMethods(ctor, props, isStatic) {
  var obj = isStatic? ctor: ctor.prototype;
  for (var key in props) {
    Object.defineProperty(obj, key, {
      value: props[key],
      enumerable: false
    });
  }
  return ctor;
};

function Node(x, y, score, before, after)
{
  var key = x + '.' + y;
  if (Node.instances[key])
    return Node.instances[key];
  Node.instances[key] = this;
  this.x = x;
  this.y = y;
  this.score = score;
  this.before = before;
  this.after = after;
  this.key = key;
  this.neighbors = [];
  this.WKT = null;
}

Node = AddMethods(Node, {
  instances: {},

  eq: function(node) {
    return (this.x == node.x && this.y == node.y);
  },

  toString: function() {
    return 'Node ' + this.x + ',' + this.y;
  },

  getNeighbors: function() {
    if (this.neighbors.length)
      return this.neighbors;
    if (this.x > 0)
      this.neighbors.push(new Node(this.x-1, this.y));
    if (this.y > 0)
      this.neighbors.push(new Node(this.x, this.y-1));
    if (this.x < Node.numBinX-1)
      this.neighbors.push(new Node(this.x+1, this.y));
    if (this.y < Node.numBinY-1)
      this.neighbors.push(new Node(this.x, this.y+1));
    return this.neighbors;
  },

  getWKT: function() {
    if (this.WKT)
      return this.WKT;
    var left = Node.bounds[0] + Node.xGridSize * this.x;
    var right = Node.bounds[0] + Node.xGridSize * (this.x + 1);
    var bottom = Node.bounds[1] + Node.yGridSize * this.y;
    var top = Node.bounds[1] + Node.yGridSize * (this.y + 1);
    this.WKT = 'POLYGON((';
    this.WKT += left + ' ' + top + ', ';
    this.WKT += right + ' ' + top + ', ';
    this.WKT += right + ' ' + bottom + ', ';
    this.WKT += left + ' ' + bottom + ', ';
    this.WKT += left + ' ' + top + '))';
    return this.WKT;
  },

  getCenter: function() {
    return {x:Node.bounds[0] + Node.xGridSize * (this.x + 0.5), y:Node.bounds[1] + Node.yGridSize * (this.y + 0.5)};
  }
});

Node = AddMethods(Node, {
  // unit: count per hour
  normalizeCount: function(raw)  {
    var count = raw / (Node.tStepSize) * sPerHour;
    if (!count) console.log(count, raw, Node.tStepSize);
    return count;
  },

  // given a list of nodes, return clusters of neighboring nodes
  formCluster: function(nodes) {
    var clusters = [];
    var remainingNodes = $.extend(true, [], nodes);
  
    while (remainingNodes.length) {
      var node = remainingNodes.pop();
      var cluster = [node];
      var neighbors = node.getNeighbors();

      while (neighbors.length) {
        var neighbor = neighbors.pop();
        var index = $.inArray(neighbor, remainingNodes);
        if (index != -1) {
          remainingNodes.splice(index, 1);
          cluster.push(neighbor);
          neighbors.push.apply(neighbors, neighbor.getNeighbors());
        }
      }
      clusters.push(cluster);
    }
    return clusters;
  },

  drawPolygon: function(cluster) {
    var reader = new jsts.io.WKTReader();
    var blob = reader.read(cluster[0].getWKT());
    for (var i = 1; i <cluster.length; i++) {
      var node = reader.read(cluster[i].getWKT());
      blob = blob.union(node);
    }
    return blob;
 },   
}, true);

