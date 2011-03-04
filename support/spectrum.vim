" Vim syntax file
" Language:     spectrum.js
" Maintainer:   Tom Yandell <tom+deleteme@yandell.me.uk>
" URL:          http://use.no.de/spectrum/spectrum.vim
" Last Change:  2011 March 3

" For version 5.x: Clear all syntax items
" For version 6.x: Quit when a syntax file was already loaded
if version < 600
  syntax clear
elseif exists("b:current_syntax")
  finish
endif

if !exists("main_syntax")
  let main_syntax = 'spectrum'
endif

if version < 600
  so <sfile>:p:h/html.vim
  syn include @JavaScript <sfile>:p:h/javascript.vim
else
  runtime! syntax/html.vim
  unlet b:current_syntax
  syn include @JavaScript syntax/javascript.vim
endif

syn cluster htmlPreproc add=SpectrumJavaScriptInsideHtmlTags

syn region SpectrumJavaScriptInsideHtmlTags keepend matchgroup=Delimiter start=+<%=\=?+ skip=+".*%>.*"+ end=+%>+ contains=@JavaScript
syn region SpectrumJavaScriptInsideHtmlTags keepend matchgroup=Delimiter start=+<\~begin>+ skip=+".*</\~begin>.*"+ end=+</\~begin>+ contains=@JavaScript
syn region SpectrumJavaScriptInsideHtmlTags keepend matchgroup=Delimiter start=+<\~init>+ skip=+".*</\~init>.*"+ end=+</\~init>+ contains=@JavaScript
syn region SpectrumJavaScriptLine matchgroup=Delimiter start="^[\t ]*:" end="$" contains=@JavaScript

let b:current_syntax = "spectrum"


