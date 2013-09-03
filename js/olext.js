OpenLayers.Label = OpenLayers.Class({

initialize: function (lon, lat, label, alt, parent, search) {
        this.lonlat = new OpenLayers.LonLat(lon, lat);
	this.label = label;
        this.alt = alt;
        this.parent = parent;
        this.search = search;
	this.icon = new function () {};
	this.icon.moveTo = function (px) {
	    this.div.style.left = px.x + "px";
	    this.div.style.top = px.y + "px";
	};
	this.icon.div = document.createElement('div');
	this.icon.div.className = 'label';
        this.icon.div.title = this.alt;
        this.icon.div.innerHTML = this.label;
	this.events = new OpenLayers.Events(this, this.icon.div);
        this.events.register('mouseover', this, this.onMouseOver);
        this.events.register('mouseout', this, this.onMouseOut);
        this.events.register('click', this, this.onClick);
    },

    destroy: function () {
        for (i in this.controls) 
            controls[i].destroy();
        this.icon.div.parentNode.removeChild(this.icon.div);
	this.events.destroy();
	this.events = null;
    },

    draw: function (px) {
	this.icon.moveTo(px);
	this.drawn = true;
        return this.icon.div;
    },

    erase: function () {
        this.destroy();
    },

    moveTo: function (px) {
        this.icon.moveTo(px);
	this.lonlat = this.map.getLonLatFromLayerPx(px);
    },

    isDrawn: function () {
        return this.drawn;
    },

    onMouseOver: function () {},

    onMouseOut: function () {},

    onClick: function () {
        if (!this.search) return;
        this.search.val(this.label);
        $(this.search.get(0).form).submit();
    },

    addTo: function (layer) {
        if (layer.CLASS_NAME == "OpenLayers.Layer.Markers") {
            layer.addMarker(this);
            $(this.icon.div).css('margin-left', -$(this.icon.div).width()/2 + 'px');
            $(this.icon.div).css('margin-top', -$(this.icon.div).height()/2 + 'px');
            return this;
        }
    },

    getIcon: function () {
        return this.icon.div;
    },

    CLASS_NAME: "OpenLayers.Label"
});

OpenLayers.Layer.Vector.prototype.addControl = function(control) {
    this.map.addControl(control);
    control.activate();
    if (!this.controls) {
        this.controls = []
    }
    this.controls.push(control);
}

// Hacks because MapD only accepts image width of 16-px increment
OpenLayers.Layer.Grid.prototype.setTileSize = function (size) {
    if (this.singleTile) {
        size = this.map.getSize();
        var curWidth = parseInt(size.w * this.ratio);
        var targetWidth = curWidth + (16 - (curWidth % 16));
        this.newRatio = targetWidth / size.w; 
        size.h = parseInt(Math.round(size.h * this.newRatio));
        size.w = parseInt(Math.round(size.w * this.newRatio));
    }
    OpenLayers.Layer.HTTPRequest.prototype.setTileSize.apply(this, [size]);
};

OpenLayers.Layer.Grid.prototype.initSingleTile = function (bounds) {
    this.events.triggerEvent("retile");

    //determine new tile bounds
    var center = bounds.getCenterLonLat();
    var tileWidth = bounds.getWidth() * this.newRatio;
    var tileHeight = bounds.getHeight() * this.newRatio;
    
    var tileBounds =
    new OpenLayers.Bounds(center.lon - (tileWidth / 2),
                          center.lat - (tileHeight / 2),
                          center.lon + (tileWidth / 2),
                          center.lat + (tileHeight / 2));

    var px = this.map.getLayerPxFromLonLat({
        lon:tileBounds.left,
        lat:tileBounds.top
    });

    if (!this.grid.length) {
        this.grid[0] = [];
    }

    var tile = this.grid[0][0];
    if (!tile) {
        tile = this.addTile(tileBounds, px);

        this.addTileMonitoringHooks(tile);
        tile.draw();
        this.grid[0][0] = tile;
    } else {
        tile.moveTo(tileBounds, px);
    }

    //remove all but our single tile
    this.removeExcessTiles(1, 1);

    // store the resolution of the grid
    this.gridResolution = this.getServerResolution();
};
