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
                value: 300,
                date: now-1000
            },
            {
                value: 100,
                date: now-600
            },
                {
                value: 200,
                date: now-500
            },
                {
                value: 600,
                date: now-400
            },
                {
                value: 800,
                date: now-300
            },
                {
                value: 800,
                date: now-200
            },
                {
                value: 900,
                date: now-100
            },
                {
                value: 4000,
                date: now
            }
        ]
    }
], {
    width: 796,
    height: 200
});

//console.log(svg);
fs.writeFileSync('test.svg', svg);