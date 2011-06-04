See <a href="http://use.no.de/spectrum">use.no.de/spectrum</a>.

Introduction
============

Spectrum.js is a JavaScript template language targetted at both the server (e.g. node.js) and the client-side. It has a lightweight syntax, using embedded JavaScript for logic rather than inventing yet another language to learn. This "logic-ful" template approach ensures that all of you view logic can live within your views, in contrast to the some recent "logic-less" template" systems. It also borrows heavilly from <a href="http://masonhq.com/">Mason</a> to achieve high levels of reuse within your templates.

Usage
=====

Installation
------------

NPM is recommended for development, although for production you might want to find/build a package for your operating system:

    npm install spectrum

Loading
-------

To load Spectrum.js:

    var spectrum = require('spectrum');

Rendering a Template
--------------------

Create a new template renderer:

    var view = new spectrum.Renderer('/path/to/template/root');

Use this to render a template within the template root:
    
    view.render('/index.spv', { "view" : "data" }).then(function (output) {
        // rendered content is available in the output variable
    });

This page is my initial brain dump on template syntax and interface. This is all subject to change.

Template Syntax
---------------

### Code Lines

Lines of javascript can be mixed with the output by prefixing each line with a ':', e.g.

    : if (validation_error) {
        <p class="error">An error has occurred.</p>
    : }

Multiple lines run together, i.e. this works:

    : if (validation_error)
    : {
        <p class="error">An error has occurred</p>
    : }

### Expression Tags

An expression tag inserts the result of a javascript expression into the output, e.g.

    Hello <%= user.name %>.

### Code Tags

Code tags allow you to insert larger chunks of javascript code.

    <%
        var pi = 3.14159;
    %>

### Suppressed Line Breaks

To suppress a line-break, insert a backslash at the end of a line (or before trailing whitespace on the end of a line), e.g.

    Hello \
    <%= user.name %>

(results in 'Hello Tom' without a line-break).

This is more useful in plain text formats (e.g. plain text email) than html generation.

### Method Definitions

Method definitions are the primary unit of reuse. See below for how they are called.

    <~method name(parameter, list)>
        I am the output of the method_name method.
    </~method>

### Method Calls

Method calls are ordinary javascript method calls:

    The output is <[ this.method_name('blah', 'blah') ]>.

### Inheritance

By default, each template inherits from another template called <code>base.spv</code> in the template root. Rendering starts in the root of this template, with the content from the main template starting where the base template calls <code>next(this)</code>.

#### /base.spv

    <h1><% this.title() %></h1>
    
    <div class="content">
        <% next(this) %>
    </div>

#### /called/template.spv

    <~method title>My Template</~method>
    
    This appears within the content div.

Copyright
---------

This code is an alpha quality prototype. It is not recommended for production applications.

Copyright 2010 British Broadcasting Corporation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

