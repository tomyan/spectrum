
/**
 * @fileoverview This file contains the main implementation of the Spectrum JavaScript
 *               template engine.
 *
 * @author Thomas Yandell
 * @author Richard Hodgson
 */

// this gets its own scope to stop it interfering with potential optimisation of code
// in the main parser scope. It's also to avoid having too much stuff in the scope of the
// compiled code (hence the cryptic names)
function _spectrumCompileTemplate (_spectrumTemplateCode) {
    return eval(_spectrumTemplateCode);
}
    
var ast = {};

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
    str = str.replace(/([\\\"])/g, '\\$1');
    str = str.replace(/\r\n|\n|\r/g, '\\n" + \n"');
    return '"' + str + '"';
};

var View = function (proto, args) {
    this._proto = proto;
    this._content = '';
    this.args = args;
};

View.prototype._callNext = function (proto, args) {
    var child = this._proto;
    while (child.base !== proto) {
        child = child.base;
    }
    return child._main.apply(this, args);
};

View.prototype.escape = function (text) {
    if (text === null || typeof(text) === 'undefined') {
        return '';
    }
    else if (typeof(text) !== 'string') {
        text = text.toString();
    }
    return text.replace(/[<>&\"]/g, function (char) {
        return '&' + (char === '<' ? 'lt' : char === '>' ? 'gt' : char === '&' ? 'amp' : 'quot') + ';';
    });
};

View.prototype.render = function () {
    var child = this._proto;
    while (child.base !== View) {
        child = child.base;
    }
    return child._main.apply(this, arguments);
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
    return 'function(){' + this.renderSubnodes() + '\n}';
};

ast.Container.prototype.renderSubnodes = function () {
    return this.subnodes.map((node) => node.render()).join('');
};

ast.Container.prototype.lastSubnode = function () {
    return this.subnodes[this.subnodes.length - 1];
};

var Root = ast.Root = function () {
    arguments.callee.base.apply(this, arguments);
    this.methods = [];
    this.methodsByName = {};
    this.parentPath = null;
};

extend(ast.Root, ast.Container);

Root.prototype.generate = function () {
    var generated = '(function(){var viewClass=function(){arguments.callee.base.apply(this,arguments);'
         + (this.initBlock ? this.initBlock.code : '')
         + '};(function(){'
         + 'function next(view){Array.prototype.shift.call(arguments)._callNext(viewClass,arguments)};'
         + 'viewClass._main=' + this.generateContentFunction() + ';'
         + this.generateMethods()
         + (this.beginBlock ? this.beginBlock.code : '')
         + '\n}).apply(viewClass.prototype);return viewClass;})()';
    return generated;
};

Root.prototype.generateMethods = function () {
    return this.methods.map((method) => method.generate()).join('');
};

Root.prototype.compile = function (parent) {
    var templateClass = _spectrumCompileTemplate(this.generate());
    extend(templateClass, parent);
    return templateClass;
};

Root.prototype.addMethod = function (method) {
    if (method.name in this.methodsByName) {
        throw new ParseError('duplicate method "' + method.name + '"');
    }
    this.methods.push(method);
    this.methodsByName[method.name] = method
};

Root.prototype.setInheritDirective = function (node) {
    if (this.inheritDirective) {
        throw new Error('only one <~inherit ... /> directive allowed per template');
    }
    this.parentPath = node.path;
    this.inheritDirective = node;
};

Root.prototype.setBeginBlock = function (node) {
    if (this.beginBlock) {
        throw new Error('only one <~begin> ... </~begin> block allowed per template');
    }
    this.beginBlock = node;
};

Root.prototype.setInitBlock = function (node) {
    if (this.initBlock) {
        throw new Error('only one <~init> ... </~init> block allowed per template');
    }
    this.initBlock = node;
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
           '\n};';
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

ast.InheritDirective = function () {
    this.prePathWhitespace = '';
    this.path = '';
    this.postPathWhitespace = '';
};

ast.InheritDirective.prototype.render = function () {
    return '';
};

ast.InitBlock = function (code) {
    this.code = code;
};

ast.InitBlock.prototype.render = function () {
    return '';
};

ast.BeginBlock = function (code) {
    this.code = code;
};

ast.BeginBlock.prototype.render = function () {
    return '';
};

ast.ExpressionTag = function (code) {
    this.code = code;
};

ast.ExpressionTag.prototype.render = function () {
    return 'this.output(this.escape(' + this.code + '));';
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
    topLevelContext         = i++,
    endOfInputContext       = i++,
    expressionTagContext    = i++,
    codeBlockContext        = i++,
    codeLinesContext        = i++,
    methodContext           = i++,
    inheritDirectiveContext = i++,
    initBlockContext        = i++,
    beginBlockContext       = i++;
delete i;

var topLevelRule = /([\S\s]*?)(?:(<)%(=)?|(\n|^)[ \t]*(:)|<~(\w+)|<\/~(\w+)>|$)/g,
    expressionTagRule = /([\S\s]*?)%>/g,
    codeBlockRule = /([\S\s]*?)%>/g,
    codeLineRule = /(.*?(?:\n|$))([ \t]*:)?/g,
    methodRule = /(\s+)(\w+)(\s*)(?:(\([^\)]*?\)))?(\s*)>/g,
    inheritDirectiveRule = /(\s+)(?:none|\"(\S+?)\")(\s*)\/>/g,
    initBlockRule = />([\S\s]*?)<\/~init>/g,
    beginBlockRule = />([\S\s]*?)<\/~begin>/g;

var Template = function (templateRoot, path) {
    this._templateRoot = templateRoot;
    this._path = path;
};

Template.prototype.setAst = function (ast) {
    this._ast = ast;
};

Template.prototype.compile = function (content) {
    var template = this;
    var ast = this.parse(content);
    return this.getParentTemplate(ast).then(function (parent) {
        template.templateClass = ast.compile(parent);
        return template;
    });
};

Template.prototype.render = function (args) {
    var view = this.createInstance(args);
    view.render();
    return view.content();
};


Template.prototype.getParentTemplate = function (ast) {
    return new Promise((resolve, reject) => {
        var path = ast.parentPath;
        if (! path && this._path !== '/base.spv') {
            path = '/base.spv';
        }
        if (path) {
            this._templateRoot.loadTemplate(path).then(function (template) {
                resolve(template.templateClass);
            }, function (err) {
                reject(err);
            });
        }
        else {
            resolve(View);
        }
    });
};

Template.prototype.createInstance = function (args) {
    return new this.templateClass(this.templateClass, args);
};

Template.prototype.parse = function (content) {
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
                        switch (res[6]) {
                            case 'method':
                                context = methodContext;
                                break;
                            case 'inherit':
                                if (stack.length > 1) {
                                    throw new ParseError('<~inherit "..." /> must be at the top level, not in a block');
                                }
                                context = inheritDirectiveContext;
                                break;
                            case 'init':
                                if (stack.length > 1) {
                                    throw new ParseError('<~init> ... </~init> must be at the top level, not in another block');
                                }
                                context = initBlockContext;
                                break;
                            case 'begin':
                                if (stack.length > 1) {
                                    throw new ParseError('<~begin> ... </~begin> must be at the top level, not in another block');
                                }
                                context = beginBlockContext;
                                break;
                            default:
                                throw new ParseError('unknown block tag <~' + res[6] + '...');
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

                case inheritDirectiveContext:
                    inheritDirectiveRule.lastIndex = position;
                    res = inheritDirectiveRule.exec(content);
                    if (res === null) {
                        throw new ParseError('malformed/unfinished <~inherit ... /> directive');
                    }
                    newPosition = inheritDirectiveRule.lastIndex;

                    node = new ast.InheritDirective(stack[stack.length - 1]);
                    node.prePathWhitespace = res[1];
                    node.path = res[2];
                    node.postPathWhitespace = res[3];
                    root.setInheritDirective(node);
                    stack[stack.length - 1].subnodes.push(node);

                    context = topLevelContext;

                    break;

                case initBlockContext:
                    initBlockRule.lastIndex = position;
                    res = initBlockRule.exec(content);
                    if (res === null) {
                        throw new ParseError('malformed/unfinished <~init> ... </~init> block')
                    }
                    newPosition = initBlockRule.lastIndex;

                    node = new ast.InitBlock(res[1]);
                    stack[stack.length - 1].subnodes.push(node);
                    stack[stack.length - 1].setInitBlock(node);

                    context = topLevelContext;

                    break;
                
                case beginBlockContext:
                    beginBlockRule.lastIndex = position;
                    res = beginBlockRule.exec(content);
                    if (res === null) {
                        throw new ParseError('malformed/unfinished <~begin> ... </~begin> block')
                    }
                    newPosition = beginBlockRule.lastIndex;

                    node = new ast.BeginBlock(res[1]);
                    node.code = res[1];
                    stack[stack.length - 1].subnodes.push(node);
                    stack[stack.length - 1].setBeginBlock(node);

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
            throw new Error(e.message + " at line " + line + ", character " + character);
        }
        else {
            throw e;
        }
    }

    return root;
};

/**
 * @public
 * @class
 * @description
 */
var TemplateRoot = function (renderer, sourceRoot) {
    /**
     * @private
     * @description Where the templates reside
     */
    this.sourceRoot = sourceRoot;
    this._renderer = renderer;
    this._templatePromises = {};
    this._templateExistsPromises = {};
};

TemplateRoot.prototype.loadTemplate = function (path) {
    if (this._templatePromises[path]) {
        return this._templatePromises[path];
    }
    var templateRoot = this;
    return this.readTemplate(path).then(function (content) {
        var template = new Template(templateRoot, path);
        return templateRoot._templatePromises[path] = template.compile(content);
    });
};

TemplateRoot.prototype.readTemplateNode = function (path) {
    const fs = require('fs');
    return new Promise((resolve, reject) => {
        fs.readFile(this.sourceRoot + path, 'utf8', (err, content) => {
            if (err && err.errno === process.ENOENT) {
                resolve(null);
            }
            else if (err) {
                reject(new Error('could not load template: ' + err));
            }
            else {
                resolve(content);
            }
        });
    });
}

TemplateRoot.prototype.readTemplate = function (path) {
    if ((typeof process !== 'undefined') && (process.release.name === 'node')) {
        return this.readTemplateNode(path);
    }
    else {
        throw new Error('dynamic browser template loading not supported by spectrum yet')
    }
};

var Renderer = exports.Renderer = function (sourceRoot) {
    
    /**
     * @private
     * @type TemplateRoot
     * @description The default root to render with
     */
    this.defaultTemplateRoot = new TemplateRoot(this, sourceRoot);
    
    /**
     * @private
     * @description Index of template roots
     */
    this.roots = {};
    this.roots[sourceRoot] = this.defaultTemplateRoot;    
};

Renderer.prototype.render = function (templatePath, args) {
    return this.loadTemplate(templatePath).then(function (template) {
        return template.render(args);
    });
};

Renderer.prototype.loadTemplate = function (templatePath) {
    return this.defaultTemplateRoot.loadTemplate(templatePath);
};

exports.ast = ast;
exports.TemplateRoot = TemplateRoot;
exports.Template = Template;
