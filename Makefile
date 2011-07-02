
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

publish: lib/spectrum.js 
	perl -e '`git status` =~ /working directory clean/ or die "cannot publish without clean working dir\n"' && \
	echo current version is `perl -ne 'print /"version"\s*:\s*"(\d+\.\d+\.\d+)"/' package.json` && \
	perl -e 'print "new version? "' && \
	read new_version && \
	perl -i -pe 's/("version"\s*:\s*")(?:|\d+\.\d+\.\d+)(")/$$1'$$new_version'$$2/' package.json && \
	echo git commit -m 'Version for release' package.json && \
	echo git tag v$$new_version && \
	echo git push --tags && \
	echo npm publish https://github.com/tomyan/spectrum.js/tarball/v$$new_version

clean:
	rm -f lib/spectrum.js

