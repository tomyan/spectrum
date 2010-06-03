
pkg.define('spectrum_tests_generator', ['litmus', 'spectrum'], function (litmus, spectrum) {
    return new litmus.Test('spectrum parser', function () {
        this.plan(6);

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
            '<~method testMethod>test output</~method>\n' 
            'method output after is: "<% this.testMethod() %>"',
            'method output before is: "test output"\n\nmethod output after is: "test output"',
            'method calls before and after definitiion'
        );

        testOutput(
            'method output before is: "<% this.testMethod(0, 1) %>"\n' +
            '<~method testMethod(a, b)>test <%= a + b %></~method>\n' 
            'method output after is: "<% this.testMethod(2, 3) %>"',
            'method output before is: "test 1"\n\nmethod output after is: "test 5"',
            'method calls before and after definitiion with argument'
        );
    });
});
