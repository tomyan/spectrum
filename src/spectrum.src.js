/**
 * @fileoverview This file contains the main implementation of the Spectrum JavaScript
 *               template engine.
 *
 * @author Richard Hodgson
 * @author Thomas Yandell
 */

(function () {
    // this gets its own scope to stop it interfering with potential optimisation of code
    // in the main parser scope. It's also to avoid having too much stuff in the scope of the
    // compiled code (hence the cryptic names)
    function _spectrumCompileTemplate (_spectrumTemplateCode) {
        var code;
        try {
            code = eval(_spectrumTemplateCode);
        }
        catch (e) {
            var sys = require('sys');
            sys.debug('TODO handle this compilation error better: ' + sys.inspect(e));
            throw e;
        }
        return code;
    }
    
    pkg.define('spectrum', ['swipe_httpclient', 'promise'], function (http, promise) {
        var ns  = {},
            ast = {};

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
            var proto = child.prototype,
                p     = function () {};
            p.prototype = parent.prototype;
            child.prototype = new p();
            for (var i in proto) {
                if (proto.hasOwnProperty(i)) {
                    child.prototype[i] = proto[i];
                }
            }
            child.base = parent;
        }

        function quote (str) {
            if (typeof str === 'undefined') return 'undefined';
            // TODO optimise
            str = str.replace(/\"/g, "\\\"");
            str = str.replace(/\r\n|\n|\r/g, '\\n" + \n"');
            return '"' + str + '"';
        };

        var View = function (params) {
            this._content = '';
            this.params = params;
        };

        View.prototype.output = function () {
            for (var i = 0, l = arguments.length; i < l; i++) {
                this._content += arguments[i];
            }
        };

        View.prototype.content = function () {
            var content = this._content;
            this._content = '';
            return content;
        }

        var ParseError = function (message) {
            this.message = message;
        };

        ast.Container = function () {
            this.subnodes = [];
        };

        ast.Container.prototype.generateContentFunction = function () {
            return 'function(){' + this.renderSubnodes() + 'return this.content();}';
        };

        ast.Container.prototype.renderSubnodes = function () {
            return this.subnodes.map(function (node) {
                return node.render();
            }).join('');
        };

        ast.Container.prototype.lastSubnode = function () {
            return this.subnodes[this.subnodes.length - 1];
        };

        var Root = ast.Root = function () {
            arguments.callee.base.apply(this, arguments);
            this.methods = [];
            this.methodsByName = {}
        };

        extend(ast.Root, ast.Container);

        Root.prototype.generate = function () {
            var generated = '(function(){var viewClass=function(){arguments.callee.base.apply(this,arguments);};'
                 + 'viewClass.prototype.render=' + this.generateContentFunction('render') + ';'
                 + this.generateMethods()
                 + 'return viewClass;})()';
            return generated;
        };

        Root.prototype.generateMethods = function () {
            return this.methods.map(function (method) {
                return method.generate();
            }).join('');
        };

        Root.prototype.compile = function () {
            var templateClass = _spectrumCompileTemplate(this.generate());
            extend(templateClass, View);
            return templateClass;
        };

        Root.prototype.addMethod = function (method) {
            if (method.name in this.methodsByName) {
                throw new ParseError('duplicate method "' + method.name + '"');
            }
            this.methods.push(method);
            this.methodsByName[method.name] = method
        };

        ast.Method = function (parent) {
            arguments.callee.base.apply(this, arguments);
            this.parent = parent;
            this.preNameWhitespace = '';
            this.name = '';
            this.preArgListWhitespace = '';
            this.argList = '';
            this.postArgListWhitespace = '';
        };

        extend(ast.Method, ast.Container);

        ast.Method.prototype.generate = function () {
            return 'viewClass.prototype.' + this.name + '=function' + (this.argList || '()') + '{' +
                   this.renderSubnodes() +
                   '};';
        };

        ast.Method.prototype.render = function () {
            return '';
        };

        ast.Content = function (text) {
            this.text = text;
        };

        ast.Content.prototype.render = function () {
            return ';this.output(' + quote(this.text) + ');';
        };

        ast.ExpressionTag = function (code) {
            this.code = code;
        };

        ast.ExpressionTag.prototype.render = function () {
            return 'this.output(' + this.code + ');';
        };

        ast.CodeBlock = function (code) {
            this.code = code;
        };

        ast.CodeBlock.prototype.render = function () {
            return this.code;
        };

        ast.CodeLines = function (code) {
            this.code = code;
        };    

        ast.CodeLines.prototype.render = function () {
            return this.code;
        };

        // contexts
        var i = 0,
            topLevelContext      = i++,
            endOfInputContext    = i++,
            expressionTagContext = i++,
            codeBlockContext     = i++,
            codeLinesContext     = i++,
            methodContext        = i++;
        delete i;

        // rules - these are converted into RegExps by removing comments and whitespace, escaping forward slashes,
        // adding \h for horizontal whitespace ([ \t]) and adding the "g" modifier - see the Makefile
        // for example rule{ hello \h* }x is converted to /hello[ \t]*/g
        var topLevelRule = rule{
                ([\S\s]*?)   // content
                (?:          // any of...
                    (<)%(=)?      // the start of an expression tag or code tag
                |   (\n|^)\h*(:)  // the beginning of a code line
                |   <~(\w+)       // the beginning of a block tag
                |   </~(\w+)>     // the end of a block tag
                |   $             // end of the string
                )
            }x,
            expressionTagRule = rule{
                ([\S\s]*?)        // the expression
                %>                // the closing tag
            }x,
            codeBlockRule = rule{
                ([\S\s]*?)        // the code
                %>                // the closing tag            
            }x,
            codeLineRule = rule{
                (.*?(?:\n|$))     // the rest of the line (including trailing newline)
                (\h*:)?           // possibly the start of another code line
            }x,
            methodRule = rule{
                (\s+)(\w+)        // pre whitespace and name
                (\s*)             // initial whitespace
                (?:
                    (\([^\)]*?\))     // bracketed argument list
                )?                    // ...possibly
                (\s*)>            // maybe some whitespace and the end of the opening <~method> tag
            }x;

        var Template = function () {};

        Template.prototype.setAst = function (ast) {
            this._ast = ast;
        };

        Template.prototype.compile = function () {
            this._templateClass = this._ast.compile();
        };

        Template.prototype.createInstance = function (params) {
            return new this._templateClass(params);
        };

        var Parser = ns.Parser = function () {};

        Parser.prototype.templateForContent = function (content) {
            var template = new Template();
            template.setAst(this.parse(content));
            template.compile();
            return template;
        };

        Parser.prototype.parse = function (content) {
            var root = new ast.Root(),
                context  = topLevelContext,
                position,
                newPosition,
                res,
                tokenStart = 0,
                stack = [root],
                tagStack = [],
                node;

            try {
                SUCCESS: while (true) {
                    position = newPosition || 0;
                    switch (context) {

                        case topLevelContext:
                            topLevelRule.lastIndex = position;
                            res = topLevelRule.exec(content);
                            if (res === null) {
                                throw new ParseError('could not match template');
                            }
                            newPosition = topLevelRule.lastIndex;

                            if (res[1].length > 0 || res[4] && res[4].length > 0) {
                                stack[stack.length - 1].subnodes.push(new ast.Content(res[1] + (res[4] ? res[4] : '')));
                            }
                            if (res[2] && res[3]) { // expression tag start
                                tokenStart = newPosition - 3;
                                context = expressionTagContext;
                            }
                            else if (res[2]) { // code block start
                                tokenStart = newPosition - 2;
                                context = codeBlockContext;
                            }
                            else if (res[5]) { // code line start
                                tokenStart = newPosition - 1;
                                context = codeLinesContext;                  
                            }
                            else if (res[6]) { // block tag start
                                tokenStart = newPosition - (res[6].length + 2);
                                if (res[6] === 'method') {
                                    context = methodContext;
                                }
                                else {
                                    throw new ParseError('unknown block tag <~' + res[5] + '...');
                                }
                            }
                            else if (res[7]) { // block tag end
                                tokenStart = newPosition - (res[7].length + 3);
                                if (tagStack.length === 0 || tagStack[tagStack.length - 1] !== res[7]) {
                                    throw new ParseError('closing </~' + res[7] + '> without corresponding opening tag');
                                }
                                stack.pop();
                                tagStack.pop();
                            }
                            else {
                                context = endOfInputContext;
                            }

                            break;

                        case expressionTagContext:
                            // TODO escaping of value resulting from expression
                            expressionTagRule.lastIndex = position;
                            res = expressionTagRule.exec(content);
                            if (res === null) {
                                throw new ParseError('cannot find end of expression tag "=>"');
                            }
                            newPosition = expressionTagRule.lastIndex;
                            if (res[1].search(/\S/) === -1) {
                                throw new ParseError("empty expression tag");
                            }
                            stack[stack.length - 1].subnodes.push(new ast.ExpressionTag(res[1]));
                            // TODO return to suitable context for current container (maybe not needed if topLevelContext can handle being in a container)
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

                        case codeLinesContext:
                            codeLineRule.lastIndex = position;
                            res = codeLineRule.exec(content);
                            if (res === null) {
                                throw new ParseError('cannot parse code line');
                            }
                            newPosition = codeLineRule.lastIndex;
                            
                            var lastSubnode = stack[stack.length - 1].lastSubnode();
                            if (lastSubnode && (lastSubnode instanceof ast.CodeLines)) {
                                lastSubnode.code += res[1];
                            }
                            else {
                                stack[stack.length - 1].subnodes.push(new ast.CodeLines(res[1]));
                            }

                            if (res[2]) { // if we have the start of a continuing code line
                                tokenStart--;
                                break;
                            }

                            context = topLevelContext;
                            break;

                        case methodContext:
                            methodRule.lastIndex = position;
                            res = methodRule.exec(content);
                            if (res === null) {
                                throw new ParseError('malformed/unfinished <~method ... > start tag');
                            }
                            newPosition = methodRule.lastIndex;

                            node = new ast.Method(stack[stack.length - 1]);
                            node.preNameWhitespace     = res[1];
                            node.name                  = res[2];
                            node.preArgListWhitespace  = res[3];
                            node.argList               = res[4];
                            node.postArgListWhitespace = res[5];
            
                            root.addMethod(node);
                            stack[stack.length - 1].subnodes.push(node);
                            tagStack.push('method');
                            stack.push(node);

                            context = topLevelContext;

                            break;

                        case endOfInputContext:
                            while (stack.length > 1) {
                                node = stack.pop;
                                // if we have implicitly closed tags, add exceptions to this exception for them here
                                throw new ParseError('unclosed method tag');
                            }    
                            if (! stack.shift()) {
                                throw new Error('no template on container stack');
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
                    var character = tokenStart - beginningOfErrorLine;
                    character++; // make it 1 based
                    throw e.message + " at line " + line + ", character " + character;
                }
                else {
                    throw e;
                }
            }

            return root;
        };
        
        var Spectrum = function (root) {
            this.root   = root;
            this.parser = new Parser();
        };
        
        Spectrum.prototype.templateReader = function (path) {
            var loadedPromise = new promise.Promise(),
                processor = this;
            pkg.load('fs-promise').then(
                function (fs) {
                    fs.readFile(processor.root + path, 'utf8').then(
                        function (content) {
                            loadedPromise.resolve(content);
                        },
                        function (err) {
                            loadedPromise.reject(new Error('could not load template: ' + err.message));
                        }
                    );
                },
                function () {
                    var client = new http.Client();
                    client.get(processor.root + path).then(function (response) {
                        loadedPromise.resolve(response.content());                    
                    });
                }
            );
            return loadedPromise;
        };
        
        Spectrum.prototype.loadTemplate = function (path) {
            var parser = this.parser;
            return this.templateReader(path).then(function (content) {
                return parser.templateForContent(content);
            });
        };
        
        Spectrum.prototype.render = function (templatePath, params) {
            return this.loadTemplate(templatePath).then(
                function (template) {
                    var view = template.createInstance(params);
                    return view.render();
                }
            );
        }
        
        Spectrum.Parser = Parser;
        Spectrum.ast = ast;
        
        return Spectrum;
    });
})();
