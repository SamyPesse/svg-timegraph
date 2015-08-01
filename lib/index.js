var Svg = require('svg-builder');
var _ = require('lodash');


var Graph = function(series, opts) {
    this.opts = _.defaults(opts || {}, {
        width: 796,
        height: 200,

        circleR: 4,
        strokeWidth: 1
    });


    // Create svg builder
    this.svg = Svg.newInstance();
    this.svg.width(opts.width).height(opts.height);

    // Prepare and bind serie
    this.bindSeries(series);
};


// Prepare and valid data points
Graph.prototype.bindSeries = function(series) {
    var that = this;

    if (series.length == 0) throw "Need at least one serie";

    _.map(series, function(serie, i) {
        if (!serie.title) throw "Need a serie title";
        if (!serie.points || serie.points.length == 0) throw "Need a list of points";

        serie.color = serie.color || '#1db34f';
        serie.points = _.chain(serie.points)
            .map(function(point) {
                return {
                    value: point.value,
                    date: (new Date(point.date)).getTime()
                };
            })
            .sortBy('date')
            .value();

        var dateMin = _.min(serie.points, 'date').date;
        var dateMax = _.max(serie.points, 'date').date;
        var valueMin = _.min(serie.points, 'value').value;
        var valueMax = _.max(serie.points, 'value').value;

        that.dateMin = that.dateMin? Math.min(that.dateMin, dateMin) : dateMin;
        that.dateMax = that.dateMax? Math.max(that.dateMax, dateMax) : dateMax;
        that.valueMin = that.valueMin? Math.min(that.valueMin, valueMin) : valueMin;
        that.valueMax = that.valueMax? Math.max(that.valueMax, valueMax) : valueMax;

        return serie;
    });

    this.wPerMS = this.opts.width/(this.dateMax - this.dateMin);
    this.hPerValue = this.opts.height/(this.valueMax - this.valueMin);
    this.series = series;
};

Graph.prototype.fixValue  = function(value) {
    return Number(value.toFixed(0));
};

// Calcul position of a point in the svg
Graph.prototype.getPointPosition = function(point) {
    return {
        x: this.fixValue((point.date - this.dateMin) * this.wPerMS),
        y: this.opts.height - this.fixValue((point.value - this.valueMin) * this.hPerValue)
    };
};

// Draw a serie
Graph.prototype.drawSerie = function(serie) {
    var that = this;

    _.each(serie.points, function(point, i) {
        var last = i == serie.points.length - 2;
        var nextPoint = serie.points[i + 1];
        if (!nextPoint) return;

        var pos = that.getPointPosition(point);
        var nextPos = that.getPointPosition(nextPoint);

        that.svg.line({
            'x1': pos.x,
            'y1': pos.y,
            'x2': nextPos.x,
            'y2': nextPos.y,
            'stroke': serie.color,
            'stroke-width': that.opts.strokeWidth
        });

        that.svg.circle({
            'r': that.opts.circleR,
            'fill': serie.color,
            'stroke-width': that.opts.strokeWidth,
            'stroke': '#FFFFFF',
            'cx': pos.x,
            'cy': pos.y
        });

        if (last) {
            that.svg.circle({
                'r': that.opts.circleR,
                'fill': serie.color,
                'stroke-width': that.opts.strokeWidth,
                'stroke': '#FFFFFF',
                'cx': nextPos.x,
                'cy': nextPos.y
            });
        }
    });
};


// Draw everything and output svg as a string
Graph.prototype.render = function() {
    _.each(this.series, this.drawSerie, this);

    return this.svg.render();
};

module.exports = function(series, opts) {
    var graph = new Graph(series, opts);
    return graph.render();
};
