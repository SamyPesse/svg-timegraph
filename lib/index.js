var Svg = require('svg-builder');
var _ = require('lodash');
var moment = require('moment');


var Graph = function(series, opts) {
    this.opts = _.defaults(opts || {}, {
        // Graph size
        width: 796,
        height: 200,

        // Points minimum
        minValue: null,

        // Auto-fill options
        autoFill: false,
        autoFillValue: 0,
        autoFillInterval: null,
        autoFillStartTime: null,
        autoFillEndTime: null,

        // Styling
        padding: 10,
        pointRadius: 4,
        lineWidth: 1,

        axeColor: '#eee',
        axeMarkerWidth: 10,
        axeMarkerHeight: 10,

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

    if (series.length == 0) throw 'Need at least one serie';

    series = _.map(series, function(serie, i) {
        if (!serie.points || serie.points.length == 0) throw 'Need a list of points';

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

    // Auto-fill
    if (that.opts.autoFill) {
        if (!that.opts.autoFillInterval) throw 'Need an interval to use autoFill';

        // Set autoFill times to timestamps if provided
        if (that.opts.autoFillStartTime) {
            that.opts.autoFillStartTime = new Date(that.opts.autoFillStartTime).getTime();
        }
        if (that.opts.autoFillEndTime) {
            that.opts.autoFillEndTime = new Date(that.opts.autoFillEndTime).getTime();
        }
        // Set start and end time depending on options
        that.dateMin = that.opts.autoFillStartTime || that.dateMin;
        that.dateMax = that.opts.autoFillEndTime || that.dateMax;

        // Set endTime to construct serie
        var serieEndTime = that.opts.autoFillEndTime? that.dateMax : that.dateMax + that.opts.autoFillInterval;

        // Set valueMin and valueMax
        that.valueMin = Math.min(that.valueMin, that.opts.autoFillValue);
        that.valueMax = Math.max(that.valueMax, that.opts.autoFillValue);

        // Fill series
        series = _.map(series, function(serie, i) {
            // Index in the serie
            var serieI = 0;
            var serieLength = serie.points.length;

            // Fill current serie with existing points or with autoFillValue
            serie.points = _.map(_.range(that.dateMin, serieEndTime, that.opts.autoFillInterval), function(time) {
                var data = null;

                if (serieI < serieLength) data = serie.points[serieI];
                if (data && data.date === time) {
                    serieI++;
                    return data;
                }
                else {
                    return {
                        value: that.opts.autoFillValue,
                        date: time
                    };
                }
            });

            return serie;
        });
    }

    if (this.valueMax == this.valueMin) this.valueMax = this.valueMin + 1;

    this.wPerMS = this.opts.width/(this.dateMax - this.dateMin);
    this.hPerValue = this.opts.height/(this.valueMax - this.valueMin);

    // Calcul axes sizes
    this.axeYWidth = this.valueMax.toFixed(0).length * this.opts.textFontSize * 1.5 + that.opts.axeMarkerWidth;
    this.axeYInterval = ((this.valueMax - this.valueMin) * this.hPerValue) / (this.opts.textFontSize * 4);

    this.axeXHeight = this.opts.textFontSize * 3;
    this.axeXInterval = ((this.dateMax - this.dateMin) * this.wPerMS) / (this.opts.textFontSize * 10);

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


Graph.prototype.drawAxeY = function() {
    var that = this;

    // Draw Y axe

    // Calcul perfect value per interval (1, 10, 100, 1000, ...)
    var valuePerInterval = optimalTickStep(this.valueMax - this.valueMin, this.axeYInterval);

    _.each(_.range(this.axeYInterval + 1), function(i) {
        var value = i * valuePerInterval;
        var y = that.opts.height - (that.axeXHeight + (value * that.innerHPerValue));

        // Don't draw point if is too high
        if (y < that.opts.padding) return;

        that.svg.text({
            'x': that.innerX - (2*that.opts.axeMarkerWidth),
            'y': y + (that.opts.textFontSize / 2),
            'font-family': that.opts.textFontFamily,
            'font-size': that.opts.textFontSize,
            'text-anchor': 'end',
            'fill': that.opts.textColor
        }, value.toString());

        that.svg.line({
            'x1': that.innerX - that.opts.axeMarkerWidth,
            'y1': y,
            'x2': that.innerX,
            'y2': y,
            'stroke': that.opts.axeColor,
            'stroke-width': that.opts.lineWidth
        });
    });
};

Graph.prototype.drawAxeX = function() {
    var that = this;

    // Calcul perfect date per interval (day, week, month, year)
    var valuePerInterval = _.chain([
        {
            format: 'YYYY',
            interval: 100*365*24*60*60*1000
        },
        {
            format: 'YYYY',
            interval: 10*365*24*60*60*1000
        },
        {
            format: 'YYYY',
            interval: 365*24*60*60*1000
        },
        {
            format: 'DD/MM',
            interval: 30*24*60*60*1000
        },
        {
            format: 'DD/MM',
            interval: 7*24*60*60*1000
        },
        {
            format: 'DD/MM',
            interval: 1*24*60*60*1000
        },
        {
            format: 'H',
            interval: 60*60*1000
        },
        {
            format: 'H:mm',
            interval: 60*1000
        },
        {
            format: 'H:mm:ss',
            interval: 1*1000
        },
        {
            format: 'SSSS',
            interval: 100
        },
        {
            format: 'SSSS',
            interval: 10
        },
        {
            format: 'SSSS',
            interval: 1
        }
    ])
    .reverse()
    .map(function(interval) {
        var count = (that.dateMax - that.dateMin)/interval.interval;
        if (count <= 1) return null;
        return { count: count, interval: interval };
    })
    .compact()
    .sortBy('count')
    .first()
    .value()
    .interval;

    _.each(_.range(this.axeXInterval), function(i) {
        var value = i * valuePerInterval.interval;
        var date = new Date(that.dateMin + value);

        var x = that.axeYWidth + (value * that.innerWPerMS);

        that.svg.text({
            'x': x,
            'y': that.opts.height - that.opts.padding,
            'font-family': that.opts.textFontFamily,
            'font-size': that.opts.textFontSize,
            'fill': that.opts.textColor,
            'text-anchor': 'middle'
        }, moment(date).format(valuePerInterval.format));
    });
};


Graph.prototype.drawAxes = function() {
    this.drawAxeY();
    this.drawAxeX();
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
                'y1': that.innerY + that.innerHeight,
                'x2': pos.x,
                'y2': that.opts.padding,
                'stroke': that.opts.axeColor,
                'stroke-width': that.opts.lineWidth
            });

            if (last) {
                that.svg.line({
                    'x1': nextPos.x,
                    'y1': that.innerY + that.innerHeight,
                    'x2': nextPos.x,
                    'y2': that.opts.padding,
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
            'cy': pos.y,
            'class': 'serie-point',
            'data-value': point.value,
            'data-timestamp': Number(point.date),
            'date-serie': serieI
        });

        if (last) {
            that.svg.circle({
                'r': that.opts.pointRadius,
                'fill': serie.color,
                'stroke-width': that.opts.lineWidth,
                'stroke': '#FFFFFF',
                'cx': nextPos.x,
                'cy': nextPos.y,
                'class': 'serie-point',
                'data-value': nextPoint.value,
                'data-timestamp': Number(nextPoint.date),
                'date-serie': serieI
            });
        }
    });
};


// Draw everything and output svg as a string
Graph.prototype.render = function() {
    this.drawAxes();
    _.each(this.series, this.drawSerie, this);

    var svg = this.svg.render();
    svg = svg.replace('height="'+this.opts.height+'" width="'+this.opts.width+'"', 'viewBox="0 0 '+this.opts.width+' '+this.opts.height+'" preserveAspectRatio="xMidYMid meet"');

    return svg;
};

// Computes the optimal tick step for the Y axis
// We assume: range = Math.abs(upper - lower)
// i.e: range should not be negative
function optimalTickStep(range, maxTicks) {
    var minimum = range / maxTicks;
    var magnitude = Math.pow(10, Math.floor(Math.log(minimum) / Math.log(10)));
    var residual = minimum / magnitude;

    // Tick is an amplified magnitude
    // depending on the residual
    if (residual > 5) {
        return 10 * magnitude;
    } else if (residual > 2) {
        return 5 * magnitude;
    } else if (residual > 1) {
        return 2 * magnitude;
    }
    return magnitude;
}

module.exports = function(series, opts) {
    var graph = new Graph(series, opts);
    return graph.render();
};
