var litmus   = require('litmus'),
    Spectrum = require('../lib/spectrum');

exports.test = new litmus.Test('Spectrum renderer', function () {
    this.plan(2);
    
    var spectrum = new Spectrum.Renderer(__dirname + '/root');
        test = this;
    
    function testTemplate (path, params, output, message) {
        test.async('render shortcut', function (handle) {
            spectrum.render(path, params).then(
                function (rendered) {
                    test.is(rendered, output, message);
                    handle.resolve();
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
