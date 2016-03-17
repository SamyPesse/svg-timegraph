# svg-timegraph

Easy to use Node.JS/Browserify library to render time graph into SVG.

#### Example

<img src="https://rawgit.com/SamyPesse/svg-timegraph/master/example.svg" alt="Example SVG">

#### How to use it?

```
$ npm install svg-timegraph
```

Generate a time-graph using:

```js
var SVGTimeGraph = require('svg-timegraph');

var output = SVGTimeGraph(
    // List of data series
    [
        {
            title: "Visits",
            color: "#1d7fb3",
            points: [
                {
                    value: 200,
                    date: new Date(2015, 06, 10)
                },
                {
                    value: 100,
                    date: new Date(2015, 06, 11)
                },
                {
                    value: 230,
                    date: new Date(2015, 06, 12)
                },
                {
                    value: 600,
                    date: new Date(2015, 06, 13)
                }
            ]
        }
    ],

    //
    {
        // Size of the SVG
        width: 800,
        height: 300,

        // Minimum value for the Y axe
        // if null, it will be extracted from data
        minValue: null,

        // Radius  of point
        pointRadius: 4,

        // Stroke width
        lineWidth: 1,

        // Color for axe
        axeColor: '#eee',

        // Text styling
        textColor: '#aaa',
        textFontSize: 10,
        textFontFamily: 'helvetica'
    }
);
```

Use the `autoFill` option when a time serie is incomplete:

```js
var SVGTimeGraph = require('svg-timegraph');

var output = SVGTimeGraph(
    // List of data series
    [
        {
            title: "Visits",
            color: "#1d7fb3",
            points: [
                {
                    value: 200,
                    date: new Date(2015, 06, 10)
                },
                {
                    value: 100,
                    date: new Date(2015, 06, 11)
                },
                {
                    value: 600,
                    date: new Date(2015, 06, 13)
                }
            ]
        }
    ],

    //
    {
        // Activate the auto-fill
        autoFill: true,

        // Value to use for missing data
        // Default is 0
        autoFillValue: 0,

        // Interval of the time serie in ms
        // Points that are not in the interval will be ignored
        autoFillInterval: 1000 * 60 * 60 * 24,

        // By default, autoFill completes the serie from the minimum date
        // to the maximum date of the series
        // Override this behavior by setting the two following options

        // Default to minimum date of the series
        autoFillStartTime: new Date(2015, 06, 07),
        // Default to maximum date of the series
        autoFillEndTime: new Date(2015, 06, 14)

        // Other options...
    }
);
```
