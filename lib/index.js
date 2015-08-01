var Svg = require('svg-builder');
var _ = require('lodash');


var Graph = function(series, opts) {
    this.opts = _.defaults(opts || {}, {
        // Graph size
        width: 796,
        height: 200,

        // Points minimum
        minValue: null,

        // Styling
        pointRadius: 4,
        lineWidth: 1,

        axeColor: '#eee',

        textColor: '#aaa',
        textFontSize: 10,
        textFontFamily: 'helvetica'
    });

    if (_.isNumber(this.opts.minValue)) this.valueMin = this.opts.minValue;

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

        that.dateMin = _.isNumber(that.dateMin)? Math.min(that.dateMin, dateMin) : dateMin;
        that.dateMax = _.isNumber(that.dateMax)? Math.max(that.dateMax, dateMax) : dateMax;
        that.valueMin = _.isNumber(that.valueMin)? Math.min(that.valueMin, valueMin) : valueMin;
        that.valueMax = _.isNumber(that.valueMax)? Math.max(that.valueMax, valueMax) : valueMax;

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
    this.innerWidth = this.opts.width - (2*this.axeYWidth);
    this.innerHeight = this.opts.height - (2*this.axeXHeight);

    this.innerWPerMS = this.innerWidth/(this.dateMax - this.dateMin);
    this.innerHPerValue = this.innerHeight/(this.valueMax - this.valueMin);
    this.series = series;
};

Graph.prototype.fixValue  = function(value) {
    return Number(value.toFixed(0));
};

// Calcul of position from percents
Graph.prototype.position = function(pX, pY) {
    return {
        x: pX*this.opts.width,
        y: this.opts.height * (1 - pY)
    };
};

Graph.prototype.innerPosition = function(pX, pY) {
    return {
        x: this.innerX + pX*this.innerWidth,
        y: this.innerY + (this.innerHeight * (1 - pY))
    };
};

// Calcul position of a point in the svg
Graph.prototype.getPointPosition = function(point) {
    return this.innerPosition(
        (point.date - this.dateMin)/(this.dateMax - this.dateMin),
        (point.value - this.valueMin)/(this.valueMax - this.valueMin)
    );
};

// Draw axes
Graph.prototype.drawAxes = function() {
    var that = this;

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

};

// Draw a serie
Graph.prototype.drawSerie = function(serie, serieI) {
    var that = this;

    _.each(serie.points, function(point, i) {
        var last = i == serie.points.length - 2;
        var nextPoint = serie.points[i + 1];
        if (!nextPoint) return;

        var pos = that.getPointPosition(point);
        var nextPos = that.getPointPosition(nextPoint);

        if (serieI == 0) {
            // Draw vertical axe
            that.svg.line({
                'x1': pos.x,
                'y1': that.innerY,
                'x2': pos.x,
                'y2': that.innerY + that.innerHeight,
                'stroke': that.opts.axeColor,
                'stroke-width': that.opts.lineWidth
            });

            if (last) {
                that.svg.line({
                    'x1': nextPos.x,
                    'y1': that.innerY,
                    'x2': nextPos.x,
                    'y2': that.innerY + that.innerHeight,
                    'stroke': that.opts.axeColor,
                    'stroke-width': that.opts.lineWidth
                });
            }
        }

        that.svg.line({
            'x1': pos.x,
            'y1': pos.y,
            'x2': nextPos.x,
            'y2': nextPos.y,
            'stroke': serie.color,
            'stroke-width': that.opts.lineWidth
        });

        that.svg.circle({
            'r': that.opts.pointRadius,
            'fill': serie.color,
            'stroke-width': that.opts.lineWidth * 2,
            'stroke': '#FFFFFF',
            'cx': pos.x,
            'cy': pos.y
        });

        if (last) {
            that.svg.circle({
                'r': that.opts.pointRadius,
                'fill': serie.color,
                'stroke-width': that.opts.lineWidth,
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
