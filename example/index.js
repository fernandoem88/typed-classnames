const rccLoader = require('../dist/loader')

rccLoader.compile('./style.scss', __dirname, { exports: { rcc: true } })


// to see the magic, run on terminal: node ./example/index.js