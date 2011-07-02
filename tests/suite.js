
var litmus = require('litmus');

exports.test = new litmus.Suite('Spectrum Test Suite', [
    require('./parser').test,
    require('./renderer').test,
    require('./generator').test
//    require('./templateroot').test
]);
