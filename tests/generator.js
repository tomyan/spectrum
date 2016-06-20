'use strict';

const spectrum = require('../lib/spectrum')
const assert = require('chai').assert;


describe('output', function() {

    function testOutput (content, expected) {
        return function () {
            var templateRoot = new spectrum.TemplateRoot(undefined, __dirname + '/root');
            return templateRoot.loadTemplate('/base.spv').then(function () {
                
                var template = new spectrum.Template(templateRoot);
                return template.compile(content).then(function (compiledTemplate) {
                    var view = compiledTemplate.createInstance();
                    assert.equal(compiledTemplate.render([]), expected);
                });
            });
        };
    }
    
    it('should output simple content', testOutput(
        '<~inherit none />Hello World!\n',
        'Hello World!\n'
    ));
    
    it('should support inline expressions', testOutput(
        '1 + 1 = <%= 1 + 1 %>!',
        '1 + 1 = 2!'
    ));

    it('should support block tags, with js constructs running across them', testOutput(
        '1 <% for (var i = 2; i < 5; i++) { %><%= i %> <% } %>5',
        '1 2 3 4 5'
    ));

    it('should support code lines', testOutput(
        ': for (var i = 0; i < 3; i++) {\n' +
        '* <%= i %>\n' +
        ': }',
        '* 0\n* 1\n* 2\n',
        'code lines'
    ));

    it('should support method calls before and after definition', testOutput(
        'method output before is: "<% this.testMethod() %>"\n' +
        '<~method testMethod>test output</~method>\n' +
        'method output after is: "<% this.testMethod() %>"',
        'method output before is: "test output"\n\nmethod output after is: "test output"',
        'method calls before and after definition'
    ));

    it('should support method calls before and after definitiion with argument', testOutput(
        'method output before is: "<% this.testMethod(0, 1) %>"\n' +
        '<~method testMethod(a, b)>test <%= a + b %></~method>\n' +
        'method output after is: "<% this.testMethod(2, 3) %>"',
        'method output before is: "test 1"\n\nmethod output after is: "test 5"'
    ));

    it('should support slashes properly', testOutput(
        '\\/',
        '\\/',
        'test that a back slash followed by a forward slash outputs that (bug)'
    ));
});
