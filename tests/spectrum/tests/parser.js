
pkg.define('spectrum_tests_parser', ['litmus', 'spectrum'], function (litmus, spectrum) {
    return new litmus.Test('spectrum parser', function () {
        this.plan(6);

        this.ok(spectrum.Parser, 'load the spectrum parser');

        var parser = new spectrum.Parser();

        var ast = parser.parse(
		    'Hello World!\n'
		);

        this.isa(ast, spectrum.ast.Template, 'root node is a Template');
		this.ok(ast.subnodes.length == 1 && ast.subnodes[0], 'parsed single content node');
		this.isa(ast.subnodes[0], spectrum.ast.Content, 'content node type');
		this.is(ast.subnodes[0].text, 'Hello World!\n', 'text in content node');

        ast = parser.parse('');
        this.is(ast.subnodes.length, 0, 'empty template generates empty ast');


    });
});
