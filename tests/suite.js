
var litmus = require('litmus');

exports.test = new litmus.Suite('Spectrum Test Suite', [
    require('./parser').test // ,
//    require('./generator').test,
//    require('./processor').test,
//    require('./templateroot').test
]);
