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

    ast.Content = function () {

    };

    // contexts
    var i = 0,
        topLevelContext = i++;

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
            tokenStart = 0,
            stack = [template];

        return template;
    };

    return ns;
});
