
pkg.define(
    'spectrum_tests_suite',
    ['litmus'],
    function (litmus, parser) {
        return new litmus.Suite('Spectrum Test Suite', [
            'spectrum_tests_parser',
            'spectrum_tests_generator',
            'spectrum_tests_processor'
        ]);
    }
);
