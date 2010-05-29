/**
 * @fileoverview This file contains the main implementation of the Spectrum JavaScript
 *               template engine.
 *
 * @author Thomas Yandell
 */

pkg.define('spectrum', ['node:sys'], function (sys) {
    var ns  = {},
        ast = ns.ast = {};

   /**
    * @private
    * @function Make a constructor extend another.
    * Makes a subclass by creating a prototype for the child that shares the
    * prototype of the parent. Addionally sets the base property of the child
    * function to point to the parent function (useful for calling
    * `arguments.callee.base.apply(this, arguments)` in the top of the child
    * function to allow use of parent constructor).
    *
    * @param {Function} child
    *   Child constructor.
    * @param {Function} parent
    *   Parent constructor.
    */

    function extend (child, parent) {
        var p = function () {};
        p.prototype = parent.prototype;
        child.prototype = new p();
        child.base = parent;
    }

    var ParseError = function (message) {
        this.message = message;
    };

    ast.Container = function () {
        this.subnodes = [];
    };

    ast.Container.prototype.lastSubnode = function () {
        return this.subnodes[this.subnodes.length - 1];
    };

    ast.Template = function () {
        arguments.callee.base.apply(this, arguments);
    };

    extend(ast.Template, ast.Container);

    ast.Content = function (text) {
        this.text = text;
    };

    ast.ExpressionTag = function (code) {
        this.code = code;
    };

    ast.CodeBlock = function (code) {
        this.code = code;
    };

    // contexts
    var i = 0,
        topLevelContext      = i++,
        endOfInputContext    = i++,
        expressionTagContext = i++,
        codeBlockContext     = i++;
    delete i;

    // rules - these are converted into RegExps but removing comments and whitespace,
    // escaping forward slashes and adding the "g" modifier - see the Makefile
    // for example rule{ hello }x is converted to /hello/g
    var topLevelRule = rule{
            ([\S\s]*?)   // content
            (?:          // any of...
                (<)=         // the start of an expression tag
            |   (<)~js>      // the start of a code block
            |   $            // end of the string
            )
        }x,
        expressionTagRule = rule{
            ([\S\s]*?)   // the expression
            =>           // the closing tag
        }x,
        codeBlockRule = rule{
            ([\S\s]*?)   // the code
            </~js>       // the closing tag            
        }x;

    var Parser = ns.Parser = function () {};

    Parser.prototype.parse = function (content) {
        var template = new ast.Template(),
            context  = topLevelContext,
            position,
            newPosition,
            res,
            tokenStart = 0,
            stack = [template];

        try {
            SUCCESS: while (true) {
                position = newPosition || 0;
                switch (context) {

                    case topLevelContext:
                        topLevelRule.lastIndex = position;
                        res = topLevelRule.exec(content);
                        if (res == null) {
                            throw new ParseError('could not match template');
                        }
                        newPosition = topLevelRule.lastIndex;

                        if (res[1].length > 0) {
                            stack[stack.length - 1].subnodes.push(new ast.Content(res[1]));
                        }
                        if (res[2]) { // expression tag start
                            tokenStart = newPosition - 2;
                            context = expressionTagContext;
                        }
                        else if (res[3]) { // code block start
                            tokenStart = newPosition - 5;
                            context = codeBlockContext;
                        }
                        else {
                            context = endOfInputContext;
                        }

                        break;

                    case expressionTagContext:
                        // TODO escaping of value resulting from expression
                        expressionTagRule.lastIndex = position;
                        res = expressionTagRule.exec(content);
                        if (res == null) {
                            throw new ParseError('cannot find end of expression tag "=>"');
                        }
                        newPosition = expressionTagRule.lastIndex;
                        if (res[1].search(/\S/) === -1) {
                            throw new ParseError("empty expression tag");
                        }
                        stack[stack.length - 1].subnodes.push(new ast.ExpressionTag(res[1]));
                        // TODO return to suitable context for current container
                        context = topLevelContext;
                        break;

                    case codeBlockContext:
                        codeBlockRule.lastIndex = position;
                        res = codeBlockRule.exec(content);
                        if (res === null) {
                            throw new ParseError('cannot find end of code tag "</~js>"');
                        }
                        newPosition = codeBlockRule.lastIndex;

                        var lastSubnode = stack[stack.length - 1].lastSubnode();
                        if (lastSubnode && (lastSubnode instanceof ast.CodeBlock)) {
                            lastSubnode.code += res[1];
                        }
                        else {
                            stack[stack.length - 1].subnodes.push(new ast.CodeBlock(res[1]));
                        }
                        context = topLevelContext;
                        break;

                    case endOfInputContext:
                        if (! stack.shift()) {
                            throw new Error('no template on container stack');
                        }
                        if (stack.length > 0) {
                            throw new Error('TODO error message with containers not closed');
                        }
                        break SUCCESS;

                    default:
                        throw new Error('unknown parse context: \'' + context + '\'');

                }
            }
        }
        catch (e) {
            if (e instanceof ParseError) {
                var lineRegex = /[^\n\r\f]*?(?:\015\012|\012|\015)/g;
                var beginningOfErrorLine = 0;
                lineRegex.lastIndex = 0;
                var line = 1;
                while (lineRegex.exec(content)) {
                    if (lineRegex.lastIndex <= tokenStart) {
                        line++;
                        beginningOfErrorLine = lineRegex.lastIndex;
                    }
                    else {
                        break;
                    }
                }
                //line += this.lineOffset;
                var character = tokenStart - beginningOfErrorLine;
                character++; // make it 1 based
                throw e.message + " at line " + line + ", character " + character;
            }
            else {
                throw e;
            }
        }

        return template;
    };

    return ns;
});
