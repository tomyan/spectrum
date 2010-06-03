
pkg.define('spectrum_tests_generator', ['litmus', 'spectrum', 'node:sys'], function (litmus, spectrum, sys) {
    return new litmus.Test('spectrum parser', function () {
        this.plan(1);

        var parser = new spectrum.Parser();
    
        var test = this;
        function testOutput (content, expected, message) {
            var template = parser.templateForContent(content),
                view     = template.createInstance();
            sys.debug(sys.inspect(view.prototype));
            test.is(view.render(), expected, message);
        }
    
        testOutput(
            'Hello World!\n',
            'Hello World!\n',
            'simple content'
        );
    });
});
