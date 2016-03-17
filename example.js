var SVGGraph = require('./lib');
var fs = require('fs');

var now = 1438441036156;

var svg = SVGGraph([
    {
        title: 'Visits',
        points: [
            {
                value: 500,
                date: now-1000
            },
            {
                value: 300,
                date: now-900
            },
            {
                value: 200,
                date: now-800
            },
            {
                value: 600,
                date: now-700
            },
            {
                value: 1700,
                date: now-600
            },
            {
                value: 800,
                date: now-500
            },
            {
                value: 500,
                date: now-400
            },
            {
                value: 100,
                date: now-300
            }
        ]
    },
    {
        title: 'Downloads',
        color: '#1d7fb3',
        points: [
            {
                value: 100,
                date: now-1000
            },
            {
                value: 1000,
                date: now-900
            },
            {
                value: 5000,
                date: now-800
            },
            {
                value: 1400,
                date: now-700
            },
            {
                value: 4500,
                date: now-600
            },
            {
                value: 30,
                date: now-500
            },
            {
                value: 40,
                date: now-400
            },
            {
                value: 0,
                date: now-300
            }
        ]
    }
], {
    width: 796,
    height: 200,
    minValue: 0
});

var svg_autoFill = SVGGraph([
    {
        title: 'Visits',
        points: [
            {
                value: 500,
                date: now-1000
            },
            {
                value: 300,
                date: now-900
            },
            {
                value: 600,
                date: now-700
            },
            {
                value: 1000,
                date: now-600
            },
            {
                value: 500,
                date: now-400
            },
            {
                value: 100,
                date: now-300
            }
        ]
    },
    {
        title: 'Downloads',
        color: '#1d7fb3',
        points: [
            {
                value: 1000,
                date: now-900
            },
            {
                value: 250,
                date: now-800
            },
            {
                value: 500,
                date: now-700
            },
            {
                value: 250,
                date: now-600
            },
            {
                value: 40,
                date: now-400
            }
        ]
    }
], {
    width: 796,
    height: 200,
    minValue: 0,
    autoFill: true,
    autoFillInterval: 100
});

fs.writeFileSync('example.svg', svg);
fs.writeFileSync('example-autoFill.svg', svg_autoFill);
