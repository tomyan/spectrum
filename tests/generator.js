var litmus   = require('litmus'),
    Spectrum = require('../lib/spectrum');

exports.test = new litmus.Test('Spectrum generator', function () {
    this.plan(7);
    
    var test = this;
    function testOutput (content, expected, message) {
        
        test.async('test ouput shortcut', function (handle) {
            
            // mock a template root
            var templateRoot = new Spectrum.TemplateRoot(undefined, __dirname + '/root');
            templateRoot.loadTemplate('/base.spv').then(function () {
                
                var template = new Spectrum.Template(templateRoot);
                template.compile(content).then(function (compiledTemplate) {
                                
                    var view = compiledTemplate.createInstance();
                    
                    test.is(compiledTemplate.render([]), expected, message);
                    handle.resolve();
                });
                
            });
        });
    }
    
    testOutput(
        '<~inherit none />Hello World!\n',
        'Hello World!\n',
        'simple content'
    );

    testOutput(
        '1 + 1 = <%= 1 + 1 %>!',
        '1 + 1 = 2!',
        'expression tag generates output'
    );

    testOutput(
        '1 <% for (var i = 2; i < 5; i++) { %><%= i %> <% } %>5',
        '1 2 3 4 5',
        'block tags, with js constructs running across them'
    );

    testOutput(
        ': for (var i = 0; i < 3; i++) {\n' +
        '* <%= i %>\n' +
        ': }',
        '* 0\n* 1\n* 2\n',
        'code lines'
    );

    testOutput(
        'method output before is: "<% this.testMethod() %>"\n' +
        '<~method testMethod>test output</~method>\n' +
        'method output after is: "<% this.testMethod() %>"',
        'method output before is: "test output"\n\nmethod output after is: "test output"',
        'method calls before and after definition'
    );

    testOutput(
        'method output before is: "<% this.testMethod(0, 1) %>"\n' +
        '<~method testMethod(a, b)>test <%= a + b %></~method>\n' +
        'method output after is: "<% this.testMethod(2, 3) %>"',
        'method output before is: "test 1"\n\nmethod output after is: "test 5"',
        'method calls before and after definitiion with argument'
    );

    testOutput(
        '\\/',
        '\\/',
        'test that a back slash followed by a forward slash outputs that (bug)'
    );
    /*
    TODO not sure this is relevant anymore
    // test template forgets previous rendering

    var template = parser.templateForContent('content'),
        view     = template.createInstance();

    view.render();
    this.is(view.render(), 'content', 'second rendering only has single copy of content');
    */
});
