
lib/spectrum.js: lib/spectrum.src.js
	chmod +w lib/spectrum.js && (perl -e 'undef $$/; $$_ = <STDIN>; s{rule{(.*?)}x}{$$a=$$1;$$a =~ s{//.*?$$}{}gm; $$a =~ s/\s+//gs; $$a =~ s/\\h/[ \\t]/g; $$a =~ s{/}{\\/}g; "/$$a/g"}sge; print' < lib/spectrum.src.js > lib/spectrum.js) && chmod -w lib/spectrum.js

./node_modules/.bin/litmus:
	npm install

test: lib/spectrum.js ./node_modules/.bin/litmus
	./node_modules/.bin/litmus tests/suite.js

release: lib/spectrum.js 
	./node_modules/.bin/usenode-release .
