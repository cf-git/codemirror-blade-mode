// CodeMirror, copyright (c) by SERHII SHUBIN and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

/**
 * inComment {{-- ... --}}
 * inPrint {{ ...inPrint }} {{{ ...inPrint }}} {!! ...inPrint !!}
 * Directive @...( ...inCondition (...inCondition) function(...inCondition) )
 * Variables $...
 */
export default function ( CodeMirror ) {
    "use strict";

    CodeMirror.defineMode("blade", function () {
        let ch;
        const directives = new RegExp("((@" + ([
                "foreach", "endforeach", "forelse", "endforealse", "while", "endwhile", "continue",
                "if", "else", "elseif", "endif",
                "switch", "endswitch", "case", "break", "default",
                "unless", "endunless", "isset", "endisset", "empty", "endempty",
                "auth",  "endauth",  "guest",  "endguest",
                "production", "endproduction", "env", "endenv",

                "include", "includeWhen", "includeUnless", "includeFirst", "each", "once",
                "push", "endpush", "pushOnce", "endPushOnce", "prepend", "endprepend", "stack",
                "php", "endphp",
                "csrf", "method",
                "enderror", "error",
                "verbatim", "endverbatim",
                "extends", "section", "endsection", "hasSection", "stop", "show", "parent", "yield",
                "selected", "checked", "class", "disabled", "props", "aware", "inject",
            ]).join(')|(@') + "))"),
            operator = /^((\^{2})|([&|]{1,2})|([!~+\-*\/]=?)|([!<>=]=?)|(===))/,
            coalescence = /\?\?/,
            variable = /\$[a-zA-Z]+([a-zA-Z_])?/,
            methodOrFunction = /([a-zA-Z_]+)?\s?\(\)?/,
            propertyName = /[a-zA-Z]([a-zA-Z_]+)/,
            cLikeArrow = /\??->/,
            atom =  new RegExp("((" + [ "true", "false", "null" ].join(")|(") + "))\\b"),
            number = /^\d+(\.\d+)?/;

        const move = function (stream, state) {
            state.prev = stream.peek();
            stream.next();
            return null;
        }

        return {
            version: "1.0.0.2",
            startState: function () {
                return {
                    inCondition: false,
                    inVerbatim: false,

                    inFunction: false,
                    inFunctionLevel: 0,
                    inBracketsLevel: 0,

                    inComment: false,
                    inString: false,
                    inPrint: false,

                    lastAttribute: false,
                    inAttribute: false,
                    inTag: false,

                    prevMatch: false,
                    prev: null,
                };
            },
            token: function ( stream, state ) {
                if (stream.eol()) stream.next();

                // Match Comment
                if (state.inComment) {
                    if (stream.match(/--}}/)) {
                        state.inComment = false;
                        return "comment";
                    }
                    move(stream, state);
                    return "comment";
                }
                if (stream.match(/{{--/)) {
                    state.inComment = true;
                    return "comment";
                }

                if (state.inString) {
                    if ((ch = stream.eat(/./))) {
                        if ((ch[0] === state.inString) && (state.prev !== '\\')) {
                            state.inString = false;
                            return "string";
                        }
                        return "string";
                    }
                }

                if (state.inVerbatim) {
                    if (stream.match("@endverbatim")) {
                        return "directive";
                    }
                    return move(stream, state);
                }

                if (state.inCondition) {
                    // Match string
                    if ((ch = stream.eat('"')) || (ch = stream.eat("'"))) {
                        state.inString = ch;
                        return "string";
                    }
                    if (stream.match(cLikeArrow)) {
                        if (state.prevMatch === 'access') {
                            state.prevMatch = 'arrow';
                        }
                        return 'literal arrow object-access';
                    }
                    if ((state.prevMatch === 'arrow')) {
                        if ((ch = stream.match(methodOrFunction))) {
                            state.prevMatch = 'access';
                            if (ch[0].slice(-1) === '(') {
                                state.inFunction = true;
                                state.inFunctionLevel++;
                            }
                            return 'function method';
                        }
                        if((ch = stream.match(propertyName))) {
                            state.prevMatch = 'access';
                            return "variable property";
                        }
                        state.prevMatch = false;
                    }
                    if ((ch = stream.match(methodOrFunction))) {
                        state.prevMatch = 'access';
                        if (ch[0].slice(-1) === '(') {
                            state.inFunction = true;
                            state.inFunctionLevel++;
                        }
                        return 'function';
                    }
                    if (stream.match(variable)) {
                        state.prevMatch = 'access';
                        return 'variable';
                    }

                    if (state.inPrint && stream.match(state.inPrint)) {
                        state.inPrint = false;
                        state.inCondition = false;
                        return 'print';
                    }

                    if (stream.match(coalescence)) {
                        return 'operator coalescence';
                    }
                    if(stream.match(operator)) {
                        return 'operator';
                    }
                    if (stream.match(atom)) {
                        return 'atom';
                    }
                    if (stream.match(number)) {
                        return 'number';
                    }
                    if (stream.eat('(')) {
                        return 'function';
                    }
                    if (stream.eat(')')) {
                        if (state.inFunctionLevel > 0) {
                            if (!(state.inFunctionLevel--)) state.inFunction = false;
                            return 'function';
                        }
                        state.inCondition = false;
                        return "directive";
                    }
                }

                if (stream.match(/@@[^\b]*\b/) || stream.match(/@{{.*}}/)) {
                    return null;
                }

                if ((ch = stream.match(directives))) {
                    ch = ch[0].trim();
                    if (ch === '@verbatim') {
                        state.inVerbatim = true;
                    }
                    if (ch.indexOf('@end') === 0) {
                        state.inCondition = false;
                        return 'directive'
                    }
                    if (stream.match(/\s*\(/)) {
                        state.inCondition = true;
                    }
                    return 'directive';
                }

                if ((ch = stream.match(/@[a-zA-Z]+\(?/))) {
                    ch = ch[0].trim();
                    if (ch.slice(-1) === '(') {
                        state.inCondition = true;
                    }
                    return 'directive directive-custom';
                }

                if ((ch = stream.match(/({{{)|({!!)|({{)/))) {
                    ch = ch[0].trim();
                    state.inPrint = ({"{{{": "}}}", "{!!": "!!}", "{{": "}}"})[ch];
                    state.inCondition = true;
                    return 'print';
                }

                if (state.inTag) {
                    if (state.prevMatch === 'tag') {
                        state.prevMatch = false;
                        if ((ch = stream.match(/[a-z_\-]+[1-6]?/))) {
                            return 'tag';
                        }
                    }
                    if (state.inAttribute) {
                        if (state.lastAttribute && stream.match(state.inAttribute)) {
                            ch = state.lastAttribute;
                            state.inAttribute = false;
                            state.lastAttribute = false;
                            return ch;
                        }
                        stream.next();
                        return "attribute attribute-value";
                    }
                    if (stream.match(/(data-)[a-z_\-]+=?/)) {
                        state.lastAttribute = "attribute attribute-data";
                        if ((ch = stream.eat(/['"]/))) {
                            state.inAttribute = ch[0];
                        }
                        return state.lastAttribute;
                    }
                    if (stream.match(/(class=?)/)) {
                        state.lastAttribute = "attribute attribute-class";
                        if ((ch = stream.eat(/['"]/))) {
                            state.inAttribute = ch[0];
                        }
                        return state.lastAttribute;
                    }
                    if (stream.match(/(style=?)/)) {
                        state.lastAttribute = "attribute attribute-style";
                        if ((ch = stream.eat(/['"]/))) {
                            state.inAttribute = ch[0];
                        }
                        return state.lastAttribute;
                    }
                    if (stream.match(/(id=?)/)) {
                        state.lastAttribute = "attribute attribute-id";
                        if ((ch = stream.eat(/['"]/))) {
                            state.inAttribute = ch[0];
                        }
                        return state.lastAttribute;
                    }
                    if (stream.match(/([a-zA-Z_\-]+=?)/)) {
                        state.lastAttribute = 'attribute attribute-default';
                        if ((ch = stream.eat(/['"]/))) {
                            state.inAttribute = ch[0];
                        }
                        return state.lastAttribute;
                    }
                    if (state.inTag && stream.match(/\/?>/)) {
                        state.inTag = false;
                        return "tag";
                    }
                }
                if ((ch = stream.match(/<\/?/))) {
                    state.prevMatch = 'tag';
                    state.inTag = true;
                    return 'tag';
                }
                move(stream, state);
            },
        }
    }, "htmlmixed", "clike");

    CodeMirror.defineMIME("text/x-blade", "blade");
}
