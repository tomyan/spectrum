
pkg.define(
    'spectrum_tests_suite',
    ['litmus', 'spectrum_tests_parser'],
    function (litmus, parser) {
        return new litmus.Suite('Spectrum Test Suite', [
            parser
        ]);
    }
);
