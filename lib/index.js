var Svg = require('svg-builder');
var _ = require('lodash');


var Graph = function(series, opts) {
    this.opts = _.defaults(opts || {}, {
        width: 796,
        height: 200,

        circleR: 4,
        strokeWidth: 1,

        textColor: '#aaa',
        textFontSize: 10,
        textFontFamily: 'helvetica'
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

    // Calcul axes sizes
    this.axeYWidth = this.valueMax.toFixed(0).length * this.opts.textFontSize * 1.5;
    this.axeXHeight = this.opts.textFontSize * 2;
    this.axeYInterval = ((this.valueMax - this.valueMin) * this.hPerValue) / (this.opts.textFontSize * 4);

    this.innerX = this.axeYWidth;
    this.innerY = this.axeXHeight;
    this.innerWidth = this.opts.width - this.axeYWidth;
    this.innerHeight = this.opts.height - this.axeXHeight;

    this.innerWPerMS = this.innerWidth/(this.dateMax - this.dateMin);
    this.innerHPerValue = this.innerHeight/(this.valueMax - this.valueMin);
    this.series = series;
};

Graph.prototype.fixValue  = function(value) {
    return Number(value.toFixed(0));
};

// Calcul position of a point in the svg
Graph.prototype.getPointPosition = function(point) {
    return {
        x: this.innerX + this.fixValue((point.date - this.dateMin) * this.innerWPerMS),
        y: this.opts.height - (this.innerY + this.fixValue((point.value - this.valueMin) * this.innerHPerValue))
    };
};

// Draw axes
Graph.prototype.drawAxes = function() {
    var that = this;
    /* this.svg.text({
        x: 10,
        y: 20,
        'font-family': this.opts.textFontFamily,
        'font-size': this.opts.textFontSize,
        fill: this.opts.textColor
    }, 'My logo')*/

    // Draw Y axe
    var valuePerInterval = (this.valueMax - this.valueMin) / this.axeYInterval;
    _.each(_.range(this.axeYInterval), function(i) {
        var value = i * valuePerInterval;
        //console.log(value, value * that.hPerValue);

        that.svg.text({
            'x': 10,
            'y': that.opts.height - (that.axeXHeight + value * that.hPerValue),
            'font-family': that.opts.textFontFamily,
            'font-size': that.opts.textFontSize,
            'fill': that.opts.textColor
        }, value.toString());
    });
/*
    this.svg.line({
        'x1': this.innerX - 1,
        'y1': 0,
        'x2': this.innerX - 1,
        'y2': this.opts.height - this.innerY + 1,
        'stroke': this.opts.textColor,
        'stroke-width': 1
    });

    this.svg.line({
        'x1': this.innerX - 1,
        'y1': this.opts.height - this.innerY + 1,
        'x2': this.opts.width,
        'y2': this.opts.height - this.innerY + 1,
        'stroke': this.opts.textColor,
        'stroke-width': 1
    });*/
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
    this.drawAxes();
    _.each(this.series, this.drawSerie, this);

    return this.svg.render();
};

module.exports = function(series, opts) {
    var graph = new Graph(series, opts);
    return graph.render();
};
