
pkg.define('spectrum_tests_processor', ['litmus', 'spectrum', 'node:sys'], function (litmus, spectrum, sys) {
    return new litmus.Test('spectrum template processor', function () {
        this.plan(1);

        var processor = new spectrum.Processor(__dirname + '/../../root'),
            test = this;

        function testTemplate (path, output, message) {
            test.async(message, function (handle) {
                processor.loadTemplate(path).then(function (template) {
                    var view = template.createInstance();
                    test.is(view.render(), output, message);
                    handle.finish();
                });
            });
        }

        testTemplate('/content.spv', 'template containing simple content\n', 'run template with simple content');
    });
});

