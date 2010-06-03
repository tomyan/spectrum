
pkg.define('spectrum_tests_generator', ['litmus', 'spectrum'], function (litmus, spectrum) {
    return new litmus.Test('spectrum parser', function () {
        this.plan(3);

        var parser = new spectrum.Parser();
    
        var test = this;
        function testOutput (content, expected, message) {
            var template = parser.templateForContent(content),
                view     = template.createInstance();
            test.is(view.render(), expected, message);
        }
    
        testOutput(
            'Hello World!\n',
            'Hello World!\n',
            'simple content'
        );

        testOutput(
            '1 + 1 = <= 1 + 1 =>!',
            '1 + 1 = 2!',
            'expression tag generates output'
        );

        testOutput(
            '1 <~js> for (var i = 2; i < 5; i++) { </~js><= i => <~js> } </~js>5',
            '1 2 3 4 5',
            'block tags, with js constructs running across them'
        );
    });
});
