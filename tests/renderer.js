var litmus   = require('litmus'),
    Spectrum = require('../lib/spectrum');

exports.test = new litmus.Test('Spectrum renderer', function () {
    this.plan(8);
    
    var spectrum = new Spectrum.Renderer(__dirname + '/root');
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
    
    this.ok(Spectrum.errors, 'Spectrum exports errors lookup');
    this.ok(Spectrum.errors.couldNotReadTemplate, 'Spectrum has an error code for a missing template');
    
    this.async('test missing template', function (handle) {
        var test = this;
        spectrum.loadTemplate('does-not-exist.spv').then(
            function () {
                test.fail("Loading a missing template should reject the returned promise");
                handle.finish();
            },
            function (e) {
                test.pass("Loading a missing template rejects the returned promise");
                
                test.ok(e.message, "Error has a message");
                test.ok(e.type, "Error has a type");
                test.is(
                    e.type,
                    Spectrum.errors.couldNotReadTemplate,
                    "Error type matches error lookup for missing templates"
                );
                
                handle.finish();
            }
        );
    });
});
