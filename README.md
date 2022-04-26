# codemirror-blade-mode
Laravel blade syntax highlight mode for codemirror library

## Base usage
```javascript
import CodeMirror from "codemirror";

import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/addon/display/fullscreen';

import blade from './codemirror-blade-mode/mode.js';


blade(CodeMirror);

const editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
    mode : {name: "blade", base: "htmlmixed"},
    theme: "default",
    lineNumbers: true
});
editor.on('change', () => editor.save());

```
Then you will get something like:
![Example code highlight](example.jpg)



https://codemirror.net/LICENSE
MIT License

Copyright (C) 2017 by Marijn Haverbeke <marijnh@gmail.com> and others

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
