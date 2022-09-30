const rccLoader = require('../src/loader')

rccLoader.compile('./style.scss', __dirname, {
  exports: { $cn: true, style: false }
})

// to see the magic, run on terminal: npm run example
