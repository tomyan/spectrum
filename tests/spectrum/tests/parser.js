
pkg.define('spectrum_tests_parser', ['litmus', 'spectrum'], function (litmus, spectrum) {
    return new litmus.Test('spectrum parser', function () {
        this.plan(14);

        this.ok(spectrum.Parser, 'load the spectrum parser');

        var parser = new spectrum.Parser();

        var ast = parser.parse(
		    'Hello World!\n'
		);

        // content

        this.isa(ast, spectrum.ast.Template, 'root node is a Template');
		this.ok(ast.subnodes.length == 1 && ast.subnodes[0], 'parsed single content node');
		this.isa(ast.subnodes[0], spectrum.ast.Content, 'content node type');
		this.is(ast.subnodes[0].text, 'Hello World!\n', 'text in content node');

        ast = parser.parse('');
        this.is(ast.subnodes.length, 0, 'empty template generates empty ast');

        // expression tags

       ast = parser.parse("<= an\nexpression =>");
       this.is(ast.subnodes.length, 1, 'single expression tag returns one node');
       this.isa(ast.subnodes[0], spectrum.ast.ExpressionTag, 'got single expression tag');
       this.is(ast.subnodes[0].code, ' an\nexpression ', 'contents of expression tag');

       ast = parser.parse("<=exp1=><=exp2=>");
       this.is(ast.subnodes.length, 2, 'adjacent expression tags do not run together');
       this.isa(ast.subnodes[0], spectrum.ast.ExpressionTag, 'first adjacent expression tag type');
       this.is(ast.subnodes[0].code, 'exp1', 'first adjacent expression tag code');
       this.isa(ast.subnodes[1], spectrum.ast.ExpressionTag, 'second adjacent expression tag type');
       this.is(ast.subnodes[1].code, 'exp2', 'second adjacent expression tag code');
    });
});
