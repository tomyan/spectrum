
VERSION=dev
TESTS=spectrum_tests_suite
LITMUS_ROOT=ext/litmus.js

release: spectrum-js-$(VERSION).tar.gz

spectrum-js-$(VERSION).tar.gz: build/spectrum-js-$(VERSION)/spectrum.js build/spectrum-js-$(VERSION)/spectrum.debug.js
	cd build && tar czf ../spectrum-js-$(VERSION).tar.gz spectrum-js-$(VERSION)

src/spectrum.js: src/spectrum.src.js
	perl -e 'undef $$/; $$_ = <STDIN>; s{rule{(.*?)}x}{$$a=$$1;$$a =~ s{//.*?$$}{}gm; $$a =~ s/\s+//gs; $$a =~ s/\\h/[ \\t]/g; $$a =~ s{/}{\\/}g; "/$$a/g"}sge; print' < src/spectrum.src.js > src/spectrum.js

test: src/spectrum.js ext/litmus.js/ext/pkg.js/src/pkg.js
	$(LITMUS_ROOT)/bin/litmus -I swipe:ext/swipe.js/src -I spectrum:src -I spectrum_tests:tests $(TESTS)

ext/litmus.js/ext/pkg.js/src/pkg.js:
	git submodule init && \
	git submodule update && \
	cd ext/litmus.js && \
	make

build/spectrum-js-$(VERSION):
	mkdir -p build/spectrum-js-$(VERSION)

build/spectrum-js-$(VERSION)/spectrum.js: build/spectrum-js-$(VERSION)/ src/spectrum.js
	java -jar ext/yuicompressor.jar --type js src/spectrum.js > build/spectrum-js-$(VERSION)/spectrum.js

build/spectrum-js-$(VERSION)/spectrum.debug.js: build/spectrum-js-$(VERSION)/ src/spectrum.js
	cp src/spectrum.js build/spectrum-js-$(VERSION)/spectrum.debug.js

clean:
	rm -rf build spectrum-js-*

