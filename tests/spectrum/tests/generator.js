
pkg.define('spectrum_tests_generator', ['spectrum'], function (spectrum) {
    return new litmus.Test('spectrum parser', function () {
        this.plan(2);

        var parser = new spectrum.Parser();
    
        var test = this;
        function testOutput (content, expected, message) {
            test.is(parser.templateForContent(content).render(), expected, message);
        }
    
        testOutput(
            'Hello World!\n',
            'Hello World!\n',
            'simple content'
        );
    });
});
