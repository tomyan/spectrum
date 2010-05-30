
TESTS=spectrum_tests_suite

src/spectrum.js: src/spectrum.src.js
	perl -e 'undef $$/; $$_ = <STDIN>; s{rule{(.*?)}x}{$$a=$$1;$$a =~ s{//.*?$$}{}gm; $$a =~ s/\s+//gs; $$a =~ s/\\h/[ \\t]/g; $$a =~ s{/}{\\/}g; "/$$a/g"}sge; print' < src/spectrum.src.js > src/spectrum.js


test: src/spectrum.js ext/litmus.js/ext/pkg.js/src/pkg.js
	ext/litmus.js/bin/litmus -I spectrum:src -I spectrum_tests:tests $(TESTS)

ext/litmus.js/ext/pkg.js/src/pkg.js:
	git submodule init && \
	git submodule update && \
	cd ext/litmus.js && \
	make
