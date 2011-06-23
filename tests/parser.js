
var litmus   = require('litmus'),
    Spectrum = require('../lib/spectrum');

exports.test = new litmus.Test('Spectrum template parser', function () {
    this.plan(56);
    
    var template = new Spectrum.Template();
    this.ok(typeof template.parse == 'function', 'Template has a parse method');
    
    var ast = template.parse(
        'Hello World!\n'
    );
    
    // content
    
    this.isa(ast, Spectrum.ast.Root, 'root node');
    this.ok(ast.subnodes.length == 1 && ast.subnodes[0], 'parsed single content node');
    this.isa(ast.subnodes[0], Spectrum.ast.Content, 'content node type');
    this.is(ast.subnodes[0].text, 'Hello World!\n', 'text in content node');

    ast = template.parse('');
    this.is(ast.subnodes.length, 0, 'empty template generates empty ast');

    // expression tags

    ast = template.parse("<%= an\nexpression %>");
    this.is(ast.subnodes.length, 1, 'single expression tag returns one node');
    this.isa(ast.subnodes[0], Spectrum.ast.ExpressionTag, 'got single expression tag');
    this.is(ast.subnodes[0].code, ' an\nexpression ', 'contents of expression tag');

    ast = template.parse("<%=exp1%><%=exp2%>");
    this.is(ast.subnodes.length, 2, 'adjacent expression tags do not run together');
    this.isa(ast.subnodes[0], Spectrum.ast.ExpressionTag, 'first adjacent expression tag type');
    this.is(ast.subnodes[0].code, 'exp1', 'first adjacent expression tag code');
    this.isa(ast.subnodes[1], Spectrum.ast.ExpressionTag, 'second adjacent expression tag type');
    this.is(ast.subnodes[1].code, 'exp2', 'second adjacent expression tag code');

    this.throwsOk(
        function () {
            template.parse(
                "\n" +
                "   <%= %>\n"
            );
        },
        /empty expression tag.+at line 2, character 4/,
        'catch empty expression tag error at right place on template'
    );

    // code blocks

    ast = template.parse("<% any old code %>");
    this.is(ast.subnodes.length, 1, 'single code tag returns one node');
    this.isa(ast.subnodes[0], Spectrum.ast.CodeBlock, 'got single code tag');
    this.is(ast.subnodes[0].code, ' any old code ', 'contents of code tag');

    ast = template.parse("<%code1%><%code2%>");
    this.is(ast.subnodes.length, 1, 'adjacent code tags do run together');
    this.isa(ast.subnodes[0], Spectrum.ast.CodeBlock, 'ran together code tag type');
    this.is(ast.subnodes[0].code, 'code1code2', 'ran together code tag code');

    // code lines

    // single code line

    ast = template.parse(
        "some content\n" +
        ": a line of code\n" +
        "more content\n"
    );

    this.is(ast.subnodes.length, 3, 'content followed by code line followed by content has three nodes');

    this.isa(ast.subnodes[0], Spectrum.ast.Content, 'content node type before code line');
    this.is(ast.subnodes[0].text, "some content\n", 'text in content node before code line (including trailing newline)');

    this.isa(ast.subnodes[1], Spectrum.ast.CodeLines, 'code lines node correct type');
    this.is(ast.subnodes[1].code, " a line of code\n", 'got code line including trailing newline');

    this.isa(ast.subnodes[2], Spectrum.ast.Content, 'content node type after code line');
    this.is(ast.subnodes[2].text, "more content\n", 'text in content node after code line');

    // single code line, leading whitespace

    ast = template.parse(
        "some content\n" +
        "   :a line of code\n" +
        "more content\n"
    );

    this.is(ast.subnodes.length, 3, 'content followed by code line (leading whitespace) followed by content has three nodes');

    this.isa(ast.subnodes[0], Spectrum.ast.Content, 'content node type before code line (leading whitespace)');
    this.is(ast.subnodes[0].text, "some content\n", 'text in content node before code line (including trailing newline, but not leading whitespace)');

    this.isa(ast.subnodes[1], Spectrum.ast.CodeLines, 'code lines (with leading whitespace) node correct type');
    this.is(ast.subnodes[1].code, "a line of code\n", 'got code line (leading whitespace) including trailing newline');

    this.isa(ast.subnodes[2], Spectrum.ast.Content, 'content node type after code line (leading whitespace)');
    this.is(ast.subnodes[2].text, "more content\n", 'text in content node after code line (leading whitespace)');

    // multiple consecutive code lines

    ast = template.parse(
        "...\n" +
        ": a line of code\n" +
        ": that runs into another\n" +
        "...\n"
    );

    this.is(ast.subnodes.length, 3, 'content followed by code lines followed by content has three nodes');

    this.isa(ast.subnodes[0], Spectrum.ast.Content, 'content node type before code lines that run together');

    this.isa(ast.subnodes[1], Spectrum.ast.CodeLines, 'code lines node correct type when run together');
    this.is(ast.subnodes[1].code, " a line of code\n that runs into another\n", 'got code lines that run together including trailing newline');

    this.isa(ast.subnodes[2], Spectrum.ast.Content, 'content node type after code lines that run together');

    // multiple consecutive code lines with leading whitespace

    ast = template.parse(
        "...\n" +
        "    :a line of code\n" +
        "  :  that runs into another\n" +
        "...\n"
    );

    this.is(ast.subnodes.length, 3, 'content followed by code lines (with leading whitespace) followed by content has three nodes');

    this.isa(ast.subnodes[0], Spectrum.ast.Content, 'content node type before code lines (with leading whitespace) that run together');

    this.isa(ast.subnodes[1], Spectrum.ast.CodeLines, 'code lines (with leading whitespace) node correct type when run together');
    this.is(ast.subnodes[1].code, "a line of code\n  that runs into another\n", 'got code lines (with leading whitespace) that run together including trailing newline');

    this.isa(ast.subnodes[2], Spectrum.ast.Content, 'content node type after code lines (with leading whitespace) that run together');

    // single code line at start and end of file

    ast = template.parse(": just code line");

    this.is(ast.subnodes.length, 1, 'single code line returns one node');

    this.isa(ast.subnodes[0], Spectrum.ast.CodeLines, 'got a code single code line');

    // single code line at start and end of file, with leading whitespace

    ast = template.parse("    : just code line");

    this.is(ast.subnodes.length, 1, 'single code line (with leading whitespace) returns one node');

    this.isa(ast.subnodes[0], Spectrum.ast.CodeLines, 'got a code single code line (with leading whitespace)');

    // method tags

    ast = template.parse("<~method myMethod>method content</~method>");

    this.is(ast.subnodes.length, 1, 'method has single method node');

    var methodNode = ast.subnodes[0];
    this.isa(methodNode, Spectrum.ast.Method, 'method creates method node');
    this.is(methodNode.argumentList, undefined, 'argument list not defined when not specified');
    this.is(methodNode.subnodes.length, 1, 'method has one subnode');
    this.isa(methodNode.subnodes[0], Spectrum.ast.Content, 'content in method is a content node');
    this.is(methodNode.subnodes[0].text, 'method content', 'content inside method contains right content');

    this.throwsOk(
        function () {
            template.parse(" <~method anything>");
        },
        /unclosed method tag.*at line 1, character 2/,
        'error for unclosed method tag'
    );
});
