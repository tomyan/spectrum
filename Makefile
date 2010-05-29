
TESTS=spectrum_tests_suite

test: ext/litmus.js/ext/pkg.js/src/pkg.js
	ext/litmus.js/bin/litmus -I spectrum:src -I spectrum_tests:tests $(TESTS)

ext/litmus.js/ext/pkg.js/src/pkg.js:
	git submodule init && \
	git submodule update && \
	cd ext/litmus.js && \
	make
