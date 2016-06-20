'use strict';

const spectrum = require('../lib/spectrum')
const assert = require('chai').assert;

describe('renderer', function () {
    const renderer = new spectrum.Renderer(__dirname + '/root');
    
    function testTemplate (path, params, output) {
        return function () {
            return renderer.render(path, params).then((rendered) => {
                assert.equal(rendered, output);
            });
        };
    }
    it('should be able to run template with simple content', testTemplate(
        '/content.spv',
        {},
        'template containing simple content\n'
    ));

    it('should be able to run template with view parameter', testTemplate(
        '/content-with-params.spv',
        { 'aParam' : 'hello' },
        'Content with "hello".\n'
    ));
});
