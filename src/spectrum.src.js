/**
 * @fileoverview This file contains the main implementation of the Spectrum JavaScript
 *               template engine.
 *
 * @author Thomas Yandell
 */

pkg.define('spectrum', function () {
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

    ast.Container = function () {
        this.subnodes = [];
    };

    ast.Template = function () {
        arguments.callee.base.apply(this, arguments);
    };

    extend(ast.Template, ast.Container);

    ast.Content = function (text) {
        this.text = text;
    };

    // contexts
    var i = 0,
        topLevelContext   = i++,
        endOfInputContext = i++;

    // rules
    var topLevelRule = m{
            ([\S\s]*?)  # content
            (?:
                $       # end of the string
            )
        }x;

    var Parser = ns.Parser = function () {

    };

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
                            throw new Error('could not match template');
                        }
                        newPosition = topLevelRule.lastIndex;

                        if (res[1].length > 0) {
                            stack[stack.length - 1].subnodes.push(new ast.Content(res[1]));
                        }

                        context = endOfInputContext;
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
            // TODO
            throw e;
        }

        return template;
    };

    return ns;
});
