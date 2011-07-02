
TESTS=spectrum_tests_suite
LITMUS_ROOT=ext/litmus.js

lib/spectrum.js: lib/spectrum.src.js
	chmod +w lib/spectrum.js && (perl -e 'undef $$/; $$_ = <STDIN>; s{rule{(.*?)}x}{$$a=$$1;$$a =~ s{//.*?$$}{}gm; $$a =~ s/\s+//gs; $$a =~ s/\\h/[ \\t]/g; $$a =~ s{/}{\\/}g; "/$$a/g"}sge; print' < lib/spectrum.src.js > lib/spectrum.js) && chmod -w lib/spectrum.js

./node_modules/.bin/litmus:
	npm install litmus

test: lib/spectrum.js ./node_modules/.bin/litmus
	./node_modules/.bin/litmus tests/suite.js

ext/litmus.js/ext/pkg.js/src/pkg.js:
	git submodule init && \
	git submodule update && \
	cd ext/litmus.js && \
	make

clean:
	rm -f lib/spectrum.js

