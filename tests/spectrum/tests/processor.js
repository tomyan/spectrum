
pkg.define('spectrum_tests_processor', ['litmus', 'spectrum'], function (litmus, Spectrum) {
    return new litmus.Test('spectrum template processor', function () {
        this.plan(2);
        
        var spectrum = new Spectrum(__dirname + '/../../root');
            test = this;
        
        function testTemplate (path, params, output, message) {
            test.async('render shortcut', function (handle) {
                spectrum.render(path, params).then(
                    function (rendered) {
                        test.is(rendered, output, message);
                        handle.finish();
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

