
pkg.define('spectrum_tests_processor', ['litmus', 'spectrum'], function (litmus, spectrum) {
    return new litmus.Test('spectrum template processor', function () {
        this.plan(2);

        var processor = new spectrum.Processor(__dirname + '/../../root'),
            test = this;

        function testTemplate (path, params, output, message) {
            test.async(message, function (handle) {
                processor.loadTemplate(path).then(
                    function (template) {
                        var view = template.createInstance(params);
                        test.is(view.render(), output, message);
                        handle.finish();
                    },
                    function (err) {
                        throw err;
                    }
                );
            });
        }

        testTemplate(
            '/content.spv',
            {},
            'template containing simple content\n',
            'run template with simple content'
        );

        testTemplate(
            '/content-with-params.spv',
            { 'aParam' : 'hello' },
            'Content with "hello".\n',
            'run template with view parameter'
        );
    });
});

