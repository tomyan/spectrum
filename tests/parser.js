'use strict';

const spectrum = require('../lib/spectrum')
const assert = require('chai').assert;

describe('parser', function () {
    
    var template = new spectrum.Template();
    assert.isTrue(typeof template.parse == 'function', 'Template has a parse method');
        
    it('should handle content nodes', function () {        
        const ast = template.parse(
            'Hello World!\n'
        );
        assert.instanceOf(ast, spectrum.ast.Root, 'root node');
        assert.isTrue(ast.subnodes.length == 1 && !! ast.subnodes[0], 'parsed single content node');
        assert.instanceOf(ast.subnodes[0], spectrum.ast.Content, 'content node type');
        assert.equal(ast.subnodes[0].text, 'Hello World!\n', 'text in content node');
    });
    
    it('should handle empty templates', function () {
        const ast = template.parse('');
        assert.equal(ast.subnodes.length, 0, 'empty template generates empty ast');
    });

    it('should handle expression tags', function () {        
        const ast = template.parse("<%= an\nexpression %>");
        assert.equal(ast.subnodes.length, 1, 'single expression tag returns one node');
        assert.instanceOf(ast.subnodes[0], spectrum.ast.ExpressionTag, 'got single expression tag');
        assert.equal(ast.subnodes[0].code, ' an\nexpression ', 'contents of expression tag');
    });
    
    it('should handle consecutive expression tags', function () {
        const ast = template.parse("<%=exp1%><%=exp2%>");
        assert.equal(ast.subnodes.length, 2, 'adjacent expression tags do not run together');
        assert.instanceOf(ast.subnodes[0], spectrum.ast.ExpressionTag, 'first adjacent expression tag type');
        assert.equal(ast.subnodes[0].code, 'exp1', 'first adjacent expression tag code');
        assert.instanceOf(ast.subnodes[1], spectrum.ast.ExpressionTag, 'second adjacent expression tag type');
        assert.equal(ast.subnodes[1].code, 'exp2', 'second adjacent expression tag code');

        assert.throws(
            function () {
                template.parse(
                    "\n" +
                    "   <%= %>\n"
                );
            },
            /empty expression tag.+at line 2, character 4/,
            'catch empty expression tag error at right place on template'
        );
    });

    it('should handle code blocks', function () {        
        const ast = template.parse("<% any old code %>");
        assert.equal(ast.subnodes.length, 1, 'single code tag returns one node');
        assert.instanceOf(ast.subnodes[0], spectrum.ast.CodeBlock, 'got single code tag');
        assert.equal(ast.subnodes[0].code, ' any old code ', 'contents of code tag');
    });
    
    it('should handle adjacent code tags', function () {
        const ast = template.parse("<%code1%><%code2%>");
        assert.equal(ast.subnodes.length, 1, 'adjacent code tags do run together');
        assert.instanceOf(ast.subnodes[0], spectrum.ast.CodeBlock, 'ran together code tag type');
        assert.equal(ast.subnodes[0].code, 'code1code2', 'ran together code tag code');
    });

    it('should handle single code lines', function () {        
        const ast = template.parse(
            "some content\n" +
            ": a line of code\n" +
            "more content\n"
        );

        assert.equal(ast.subnodes.length, 3, 'content followed by code line followed by content has three nodes');

        assert.instanceOf(ast.subnodes[0], spectrum.ast.Content, 'content node type before code line');
        assert.equal(ast.subnodes[0].text, "some content\n", 'text in content node before code line (including trailing newline)');

        assert.instanceOf(ast.subnodes[1], spectrum.ast.CodeLines, 'code lines node correct type');
        assert.equal(ast.subnodes[1].code, " a line of code\n", 'got code line including trailing newline');

        assert.instanceOf(ast.subnodes[2], spectrum.ast.Content, 'content node type after code line');
        assert.equal(ast.subnodes[2].text, "more content\n", 'text in content node after code line');
    });

    it('should handle a single code line with leading whitespace', function () { 
        const ast = template.parse(
            "some content\n" +
            "   :a line of code\n" +
            "more content\n"
        );

        assert.equal(ast.subnodes.length, 3, 'content followed by code line (leading whitespace) followed by content has three nodes');

        assert.instanceOf(ast.subnodes[0], spectrum.ast.Content, 'content node type before code line (leading whitespace)');
        assert.equal(ast.subnodes[0].text, "some content\n", 'text in content node before code line (including trailing newline, but not leading whitespace)');

        assert.instanceOf(ast.subnodes[1], spectrum.ast.CodeLines, 'code lines (with leading whitespace) node correct type');
        assert.equal(ast.subnodes[1].code, "a line of code\n", 'got code line (leading whitespace) including trailing newline');

        assert.instanceOf(ast.subnodes[2], spectrum.ast.Content, 'content node type after code line (leading whitespace)');
        assert.equal(ast.subnodes[2].text, "more content\n", 'text in content node after code line (leading whitespace)');
    });

    it('should handle multiple consecutive code lines', function () {
        const ast = template.parse(
            "...\n" +
            ": a line of code\n" +
            ": that runs into another\n" +
            "...\n"
        );

        assert.equal(ast.subnodes.length, 3, 'content followed by code lines followed by content has three nodes');

        assert.instanceOf(ast.subnodes[0], spectrum.ast.Content, 'content node type before code lines that run together');

        assert.instanceOf(ast.subnodes[1], spectrum.ast.CodeLines, 'code lines node correct type when run together');
        assert.equal(ast.subnodes[1].code, " a line of code\n that runs into another\n", 'got code lines that run together including trailing newline');

        assert.instanceOf(ast.subnodes[2], spectrum.ast.Content, 'content node type after code lines that run together');
    });

    it('should handle multiple consecutive code lines with leading whitespace', function () {
        const ast = template.parse(
            "...\n" +
            "    :a line of code\n" +
            "  :  that runs into another\n" +
            "...\n"
        );

        assert.equal(ast.subnodes.length, 3, 'content followed by code lines (with leading whitespace) followed by content has three nodes');

        assert.instanceOf(ast.subnodes[0], spectrum.ast.Content, 'content node type before code lines (with leading whitespace) that run together');

        assert.instanceOf(ast.subnodes[1], spectrum.ast.CodeLines, 'code lines (with leading whitespace) node correct type when run together');
        assert.equal(ast.subnodes[1].code, "a line of code\n  that runs into another\n", 'got code lines (with leading whitespace) that run together including trailing newline');

        assert.instanceOf(ast.subnodes[2], spectrum.ast.Content, 'content node type after code lines (with leading whitespace) that run together');
    });

    it('should handle a single code line at start and end of file', function () {
        const ast = template.parse(": just code line");

        assert.equal(ast.subnodes.length, 1, 'single code line returns one node');

        assert.instanceOf(ast.subnodes[0], spectrum.ast.CodeLines, 'got a code single code line');
    });
    
    it('should handle a single code line at start and end of file, with leading whitespace', function () {
        const ast = template.parse("    : just code line");

        assert.equal(ast.subnodes.length, 1, 'single code line (with leading whitespace) returns one node');

        assert.instanceOf(ast.subnodes[0], spectrum.ast.CodeLines, 'got a code single code line (with leading whitespace)');
    });

    it('should handle method tags', function () {
        const ast = template.parse("<~method myMethod>method content</~method>");

        assert.equal(ast.subnodes.length, 1, 'method has single method node');

        var methodNode = ast.subnodes[0];
        assert.instanceOf(methodNode, spectrum.ast.Method, 'method creates method node');
        assert.equal(methodNode.argumentList, undefined, 'argument list not defined when not specified');
        assert.equal(methodNode.subnodes.length, 1, 'method has one subnode');
        assert.instanceOf(methodNode.subnodes[0], spectrum.ast.Content, 'content in method is a content node');
        assert.equal(methodNode.subnodes[0].text, 'method content', 'content inside method contains right content');

        assert.throws(
            function () {
                template.parse(" <~method anything>");
            },
            /unclosed method tag.*at line 1, character 2/,
            'error for unclosed method tag'
        );
    });
});
