import Parser from './parser.js'
import Lexer from './lexer.js'

var lexical = [
	{ lex_type : 'break', lex_reg : /break/ },
	{ lex_type : 'do', lex_reg : /do/ },
	{ lex_type : 'instanceof', lex_reg : /instanceof/ },
	{ lex_type : 'typeof', lex_reg : /typeof/ },
	{ lex_type : 'case', lex_reg : /case/ },
	{ lex_type : 'else', lex_reg : /else/ },
	{ lex_type : 'new', lex_reg : /new/ },
	{ lex_type : 'var', lex_reg : /var/ },
	{ lex_type : 'catch', lex_reg : /catch/ },
	{ lex_type : 'finally', lex_reg : /finally/ },
	{ lex_type : 'return', lex_reg : /return/ },
	{ lex_type : 'void', lex_reg : /void/ },
	{ lex_type : 'continue', lex_reg : /continue/ },
	{ lex_type : 'for', lex_reg : /for/ },
	{ lex_type : 'switch', lex_reg : /switch/ },
	{ lex_type : 'while', lex_reg : /while/ },
	{ lex_type : 'debugger', lex_reg : /debugger/ },
	{ lex_type : 'function', lex_reg : /function/ },
	{ lex_type : 'this', lex_reg : /this/ },
	{ lex_type : 'with', lex_reg : /with/ },
	{ lex_type : 'default', lex_reg : /default/ },
	{ lex_type : 'if', lex_reg : /if/ },
	{ lex_type : 'throw', lex_reg : /throw/ },
	{ lex_type : 'delete', lex_reg : /delete/ },
	{ lex_type : 'in', lex_reg : /in/ },
	{ lex_type : 'try', lex_reg : /try/ },
	{ lex_type : 'class', lex_reg : /class/ },
	{ lex_type : 'enum', lex_reg : /enum/ },
	{ lex_type : 'extends', lex_reg : /extends/ },
	{ lex_type : 'super', lex_reg : /super/ },
	{ lex_type : 'const', lex_reg : /const/ },
	{ lex_type : 'export', lex_reg : /export/ },
	{ lex_type : 'import', lex_reg : /import/ },
	{ lex_type : 'implements', lex_reg : /implements/ },
	{ lex_type : 'let', lex_reg : /let/ },
	{ lex_type : 'private', lex_reg : /private/ },
	{ lex_type : 'public', lex_reg : /public/ },
	{ lex_type : 'interface', lex_reg : /interface/ },
	{ lex_type : 'package', lex_reg : /package/ },
	{ lex_type : 'protected', lex_reg : /protected/ },
	{ lex_type : 'static', lex_reg : /static/ },
	{ lex_type : 'yield', lex_reg : /yield/ },
	{ lex_type : 'get' , lex_reg : /get/ }, //fixme : get is not reserve word
	{ lex_type : 'set' , lex_reg : /set/ }, //fixme : set is not reserve word
    { lex_type : 'NullLiteral', lex_reg : /null/ },
	{ lex_type : 'BooleanLiteral', lex_reg : /(true|false)/ },
	{ lex_type : 'Identifier', lex_reg : /(\$|_|[a-zA-Z])(\$|_|[0-9a-zA-Z])*/ }, //fixme:now not support unicode
	{ lex_type : '{', lex_reg : /\{/ },
	{ lex_type : '}', lex_reg : /\}/ },
	{ lex_type : '(', lex_reg : /\(/ },
	{ lex_type : ')', lex_reg : /\)/ },
	{ lex_type : '[', lex_reg : /\[/ },
	{ lex_type : ']', lex_reg : /\]/ },
	{ lex_type : '.', lex_reg : /\./ },
	{ lex_type : ';', lex_reg : /;/ },
	{ lex_type : ',', lex_reg : /,/ },
	{ lex_type : '<', lex_reg : /</ },
	{ lex_type : '>', lex_reg : />/ },
	{ lex_type : '<=', lex_reg : /<=/ },
	{ lex_type : '>=', lex_reg : />=/ },
	{ lex_type : '==', lex_reg : /==/ },
	{ lex_type : '!=', lex_reg : /!=/ },
	{ lex_type : '===', lex_reg : /===/ },
	{ lex_type : '!==', lex_reg : /!==/ },
	{ lex_type : '+', lex_reg : /\+/ },
	{ lex_type : '-', lex_reg : /-/ },
	{ lex_type : '*', lex_reg : /\*/ },
	{ lex_type : '%', lex_reg : /%/ },
	{ lex_type : '++', lex_reg : /\+\+/ },
	{ lex_type : '--', lex_reg : /--/ },
	{ lex_type : '<<', lex_reg : /<</ },
	{ lex_type : '>>', lex_reg : />>/ },
	{ lex_type : '>>>', lex_reg : />>>/ },
	{ lex_type : '&', lex_reg : /&/ },
	{ lex_type : '|', lex_reg : /|/ },
	{ lex_type : '^', lex_reg : /^/ },
	{ lex_type : '!', lex_reg : /!/ },
	{ lex_type : '~', lex_reg : /~/ },
	{ lex_type : '&&', lex_reg : /&&/ },
	{ lex_type : '||', lex_reg : /||/ },
	{ lex_type : '?', lex_reg : /\?/ },
	{ lex_type : ':', lex_reg : /:/ },
	{ lex_type : '+=', lex_reg : /\+=/ },
	{ lex_type : '-=', lex_reg : /-=/ },
	{ lex_type : '*=', lex_reg : /\*=/ },
	{ lex_type : '%=', lex_reg : /%=/ },
	{ lex_type : '<<=', lex_reg : /<<=/ },
	{ lex_type : '>>=', lex_reg : />>=/ },
	{ lex_type : '>>>=', lex_reg : />>>=/ },
	{ lex_type : '&=', lex_reg : /&=/ },
	{ lex_type : '|=', lex_reg : /|=/ },
	{ lex_type : '^=', lex_reg : /\^=/ },
	{ lex_type : '/', lex_reg : /\// },
	{ lex_type : '/=', lex_reg : /\/=/ },
	{ lex_type : '=' , lex_reg : /=/ },
	{ lex_type : 'NumericLiteral', lex_reg : /((0|[1-9][0-9]*)\.[0-9]*((e|E)(\+|-)?[0-9]+)?|\.[0-9]+((e|E)(\+|-)?[0-9]+)?|(0|[1-9][0-9]*)((e|E)(\+|-)?[0-9]+)?|0(x|X)[0-9a-fA-F]+)/ },
	{ lex_type : 'StringLiteral', lex_reg : /("(\\"|[^"])*?"|'(\'|[^'])*?')/ }, //fixme not support escape sequence
	{ lex_type : 'RegularExpressionLiteral', lex_reg : /\/(\\\/|[^/])*\/g?i?m?s?u?y?/ },
	{ lex_type : "IGNORE", lex_reg : /(\s+|\/\/.*\n|\/\*(\n|.)*?\*\/)/ }
];


function Scope() {
    this.prev = null;
    this.table = {};
    this.type = "";
}

function pushoprs() {
    this.oprs.push.apply(this.oprs,arguments);
    return this;
}

function structnode() {
    this.structname = '';
    this.oprs = [];
    this.pushoprs = pushoprs;
}

function funcnode() {
    this.funcname = '';
    this.scope = new Scope();
    this.params = [];
    this.oprs = [];
    this.runscope = null;
    this.context = null;
    this.prototype = {
        constructor: this,
    }
    this.call = function(_this) {
        this.context = _this;
        var args = [];
        for(var i=1;i<arguments.length;i++) {
            args.push(arguments[i]);
        }
        return runfunc(this,args)
    }
    this.apply = function(_this,paramarr) {
        this.context = _this;
        return runfunc(this,paramarr)
    }
}

function findscope(id,scope) {
    //console.log(scope,id)
    var cur = scope;
    while(cur) {
        if(typeof cur.table == 'object') {
            if(id in cur.table) {
                return cur.table
            }
        } else {
            if(typeof cur.table[id] != 'undefined') {
                return cur.table
            }
        }
        
        cur = cur.prev;
    }
    throw new Error(id+" is not defined");
}

function createSN(name) {
    var sn = new structnode();
    sn.structname = name;
    return sn;
}

var globalfunc = new funcnode();
var globalscope = globalfunc.scope;
var curscope = globalscope;
var curfuncnodes = [];

function genname() {
    var str = 'abcdefghijklmnopqrstuvwsyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var len = str.length;
    var name = '';
    for(var i=0;i<5;i++) {
        name += str[parseInt(Math.random()*len)]
    }
    return "nickfunc_"+name;
}

var grammar = {
	"IdentifierName" : ["Identifier | ReservedWord",[function(a) {
        var sn = new structnode();
        sn.structname = 'id'
        sn.oprs.push(a);
        return sn;
    },function() {

    }]],
	"ReservedWord" : ["break | do | instanceof | typeof | case | else | new | var | catch | finally | return | void | continue | for | switch | while | debugger | function | this | with | default | if | throw | delete | in | try | class | enum | extends | super | const | export | import | NullLiteral | BooleanLiteral",function(a){
        return a;
    }],
	"Literal" : ["NullLiteral | BooleanLiteral | NumericLiteral | StringLiteral | RegularExpressionLiteral",[function(n){
        return createSN('nullliter');
    },function(b) {
        return createSN('boolliter').pushoprs(b);
    },function(num) {
        return createSN('numliter').pushoprs(num);
    },function(str) {
        return createSN('strliter').pushoprs(str.slice(1,str.length-1));
    },function(str) {
        return createSN('regexpliter').pushoprs(str);
    }]],
	"PrimaryExpression" : ["this | Identifier | Literal | ArrayLiteral | ObjectLiteral | '(' Expression ')'",[function(t) {
        return createSN('this');
    },function(id) {
        return createSN('id').pushoprs(id);
    },function(liter) {
        return liter;
    },function(arrliter) {
        return arrliter;
    },function(objliter) {
        return objliter;
    },function(lq,e,rq) {
        return e;
    }]],
	"ArrayLiteral" : ["'[' Elision ? ']' | '[' ElementList ']' | '[' ElementList ',' Elision ? ']'",[function(lq,e,rq) {
        var sn = createSN('arrliter');
        if(e != 'GRAMMAR_EMPTY') {
            for(var i=0;i<e.length;i++) {
                sn.oprs.push(undefined)
            }
        };
        return sn;
    },function(lq,elist,rq) {
        var sn = createSN('arrliter');
        sn.oprs = elist;
        return sn;
    },function(lq,elist,comma,e,rq) {
        var sn = createSN('arrliter');
        sn.oprs = elist;
        if(e != 'GRAMMAR_EMPTY') {
            for(var i=0;i<e.length;i++) {
                sn.oprs.push(undefined)
            }
        }
        return sn;
    }]],
	"ElementList" : ["Elision ? AssignmentExpression | ElementList ',' Elision ? AssignmentExpression",[function(e,ae) {
        var a = [];
        if(e != 'GRAMMAR_EMPTY') {
            for(var i = 0;i<e.length;i++) {
                a.push(undefined)
            }
        }
        a.push(ae)
        return a;
    },function(elist,comma,e,a) {
        if(e != 'GRAMMAR_EMPTY') {
            for(var i = 0;i<e.length;i++) {
                elist.push(undefined)
            }
        }
        elist.push(a)
        return elist; 
    }]],
	"Elision" : ["',' | Elision ','",[function(comma) {
        return [comma]
    },function(e,comma) {
        e.push(comma);
        return e;
    }]],
	"ObjectLiteral" : ["'{' '}' | '{' PropertyNameAndValueList '}' | '{' PropertyNameAndValueList ',' '}'",[function() {
        return createSN('objliter');
    },function(lq,pvlist) {
        var sn = createSN('objliter');
        sn.oprs = pvlist;
        return sn;
    },function(lq,pvlist) {
        var sn = createSN('objliter');
        sn.oprs = pvlist;
        return sn;
    }]],
	"PropertyNameAndValueList" : ["PropertyAssignment | PropertyNameAndValueList ',' PropertyAssignment",[function(pa) {
        return [pa];
    },function(pvlist,comma,pa) {
        pvlist.push(pa);
        return pvlist;
    }]],
	"PropertyAssignment" : ["PropertyName ':' AssignmentExpression | get PropertyName '(' ')' '{' FunctionBody '}' | set PropertyName '(' PropertySetParameterList ')' '{' FunctionBody '}'",[function(p,colon,a) {
        return createSN('propertyassignment').pushoprs(p,a);
    }]],
	"PropertyName" : ["IdentifierName | StringLiteral | NumericLiteral",[function(a) {
        return a;
    },function(str) {
        return createSN('strliter').pushoprs(str.slice(1,str.length-1));
    },function(num) {
        return createSN('numliter').pushoprs(num);
    }]],
	"PropertySetParameterList" : ["Identifier",function(a) {
        return createSN('id').pushoprs(a);
    }],
	"MemberExpression" : ["PrimaryExpression | FunctionExpression | MemberExpression '[' Expression ']' | MemberExpression '.' IdentifierName | new MemberExpression Arguments",[function(pe) {
        return pe;
    },function(fe) {
        return fe;
    },function(me,lq,e,rq) {
        return createSN('memberexp').pushoprs(me,e);
    },function(me,dot,id) {
        return createSN('memberexp').pushoprs(me,id);
    },function(n,me,arg) {
        return createSN('new').pushoprs(me,arg);
    }]],
	"NewExpression" : ["MemberExpression | new NewExpression",[function(me) {
        return me;
    },function(n,ne) {
        return createSN('new').pushoprs(ne);
    }]],
	"CallExpression" : ["MemberExpression Arguments | CallExpression Arguments | CallExpression '[' Expression ']' | CallExpression '.' IdentifierName",[function(me,arg) {
        return createSN('call').pushoprs(me,arg);
    },function(ce,arg) {
        return createSN('call').pushoprs(ce,arg);
    },function(ce,lq,e,rq) {
        return createSN('callgetmember').pushoprs(ce,e);
    },function(ce,dot,id) {
        return createSN('callgetmember').pushoprs(ce,id);
    }]],
	"Arguments" : ["'(' ')' | '(' ArgumentList ')'",[function() {
        return createSN('args');
    },function(lq,arglist,rq) {
        var sn = createSN('args');
        sn.oprs = arglist;
        return sn;
    }]],
	"ArgumentList" : ["AssignmentExpression | ArgumentList ',' AssignmentExpression",[function(ae) {
        return [ae];
    },function(arglist,comma,ae) {
        arglist.push(ae);
        return arglist;
    }]],
	"LeftHandSideExpression" : ["NewExpression | CallExpression",function(a) {
        return a;
    }],
	"PostfixExpression" : ["LeftHandSideExpression | LeftHandSideExpression '++' | LeftHandSideExpression '--'",[function(a) {
        return a;
    },function(a) {
        return createSN('post++').pushoprs(a);
    },function(a) {
        return createSN('post--').pushoprs(a);
    }]],
	"UnaryExpression" : ["PostfixExpression | delete UnaryExpression | void UnaryExpression | typeof UnaryExpression | '++' UnaryExpression | '--' UnaryExpression | '+' UnaryExpression | '-' UnaryExpression | '~' UnaryExpression | '!' UnaryExpression",[function(pe) {
        return pe;
    },function(de,ue) {
        return createSN('delete').pushoprs(ue);
    },function(vo,ue) {
        return createSN('void').pushoprs(ue);
    },function(to,ue) {
        return createSN('typeof').pushoprs(ue);
    },function(prefixadd,ue) {
        return createSN('prefix++').pushoprs(ue);
    },function(prefixminus,ue) {
        return createSN('prefix--').pushoprs(ue);
    },function(positive,ue) {
        return createSN('positive').pushoprs(ue);
    },function(negative,ue) {
        return createSN('negative').pushoprs(ue);
    },function(inverse,ue) {
        return createSN('~').pushoprs(ue);
    },function(not,ue) {
        return createSN('!').pushoprs(ue);
    }]],
	"MultiplicativeExpression" : ["UnaryExpression | MultiplicativeExpression '*' UnaryExpression | MultiplicativeExpression '/' UnaryExpression | MultiplicativeExpression '%' UnaryExpression",[function(ue) {
        return ue;
    },function(me,mul,ue) {
        return createSN('*').pushoprs(me,ue);
    },function(me,div,ue) {
        return createSN('/').pushoprs(me,ue);
    },function(me,mod,ue) {
        return createSN('%').pushoprs(me,ue);
    }]],
	"AdditiveExpression" : ["MultiplicativeExpression | AdditiveExpression '+' MultiplicativeExpression | AdditiveExpression '-' MultiplicativeExpression",[function(me) {
        return me;
    },function(ae,add,me) {
        return createSN('+').pushoprs(ae,me);
    },function(ae,minus,me) {
        return createSN('-').pushoprs(ae,me);
    }]],
	"ShiftExpression" : ["AdditiveExpression | ShiftExpression '<<' AdditiveExpression | ShiftExpression '>>' AdditiveExpression | ShiftExpression '>>>' AdditiveExpression",[function(ae) {
        return ae;
    },function(se,leftshift,ae) {
        return createSN('<<').pushoprs(se,ae);
    },function(se,rightshift,ae) {
        return createSN('>>').pushoprs(se,ae);
    },function(se,rightshift,ae) {
        return createSN('>>>').pushoprs(se,ae);
    }]],
	"RelationalExpression" : ["ShiftExpression | RelationalExpression '<' ShiftExpression | RelationalExpression '>' ShiftExpression | RelationalExpression '<=' ShiftExpression | RelationalExpression '>=' ShiftExpression | RelationalExpression instanceof ShiftExpression | RelationalExpression in ShiftExpression",[function(se) {
        return se;
    },function(re,lt,se) {
        return createSN('<').pushoprs(re,se);
    },function(re,gt,se) {
        return createSN('>').pushoprs(re,se);
    },function(re,lessequal,se) {
        return createSN('<=').pushoprs(re,se);
    },function(re,greatequal,se) {
        return createSN('>=').pushoprs(re,se);
    },function(re,ins,se) {
        return createSN('instanceof').pushoprs(re,se);
    },function(re,i,se) {
        return createSN('in').pushoprs(re,se);
    }]],
	"RelationalExpressionNoIn" : ["ShiftExpression | RelationalExpressionNoIn '<' ShiftExpression | RelationalExpressionNoIn '>' ShiftExpression | RelationalExpressionNoIn '<=' ShiftExpression | RelationalExpressionNoIn '>=' ShiftExpression | RelationalExpressionNoIn instanceof ShiftExpression",[function(se) {
        return se;
    },function(re,lt,se) {
        return createSN('<').pushoprs(re,se);
    },function(re,gt,se) {
        return createSN('>').pushoprs(re,se);
    },function(re,lessequal,se) {
        return createSN('<=').pushoprs(re,se);
    },function(re,greatequal,se) {
        return createSN('>=').pushoprs(re,se);
    },function(re,ins,se) {
        return createSN('instanceof').pushoprs(re,se);
    }]],
	"EqualityExpression" : ["RelationalExpression | EqualityExpression '==' RelationalExpression | EqualityExpression '!=' RelationalExpression | EqualityExpression '===' RelationalExpression | EqualityExpression '!==' RelationalExpression",[function(re) {
        return re;
    },function(ee,equal,re) {
        return createSN('==').pushoprs(ee,re);
    },function(ee,notequal,re) {
        return createSN('!=').pushoprs(ee,re);
    },function(ee,realequal,re) {
        return createSN('===').pushoprs(ee,re);
    },function(ee,notrealequal,re) {
        return createSN('!==').pushoprs(ee,re);
    }]],
	"EqualityExpressionNoIn" : ["RelationalExpressionNoIn | EqualityExpressionNoIn '==' RelationalExpressionNoIn | EqualityExpressionNoIn '!=' RelationalExpressionNoIn | EqualityExpressionNoIn '===' RelationalExpressionNoIn | EqualityExpressionNoIn '!==' RelationalExpressionNoIn",[function(re) {
        return re;
    },function(ee,equal,re) {
        return createSN('==').pushoprs(ee,re);
    },function(ee,notequal,re) {
        return createSN('!=').pushoprs(ee,re);
    },function(ee,realequal,re) {
        return createSN('===').pushoprs(ee,re);
    },function(ee,notrealequal,re) {
        return createSN('!==').pushoprs(ee,re);
    }]],
	"BitwiseANDExpression" : ["EqualityExpression | BitwiseANDExpression '&' EqualityExpression",[function(ee) {
        return ee;
    },function(be,at,ee) {
        return createSN('&').pushoprs(be,ee);
    }]],
	"BitwiseANDExpressionNoIn" : ["EqualityExpressionNoIn | BitwiseANDExpressionNoIn '&' EqualityExpressionNoIn",[function(ee) {
        return ee;
    },function(be,at,ee) {
        return createSN('&').pushoprs(be,ee);
    }]],
	"BitwiseXORExpression" : ["BitwiseANDExpression | BitwiseXORExpression '^' BitwiseANDExpression",[function(be) {
        return be;
    },function(bxe,xor,bae) {
        return createSN('^').pushoprs(bxe,bae);
    }]],
	"BitwiseXORExpressionNoIn" : ["BitwiseANDExpressionNoIn | BitwiseXORExpressionNoIn '^' BitwiseANDExpressionNoIn",[function(be) {
        return be;
    },function(bxe,xor,bae) {
        return createSN('^').pushoprs(bxe,bae);
    }]],
	"BitwiseORExpression" : ["BitwiseXORExpression | BitwiseORExpression '|' BitwiseXORExpression",[function(bxe) {
        return bxe;
    },function(boe,or,bxe) {
        return createSN('|').pushoprs(boe,bxe);
    }]],
	"BitwiseORExpressionNoIn" : ["BitwiseXORExpressionNoIn | BitwiseORExpressionNoIn '|' BitwiseXORExpressionNoIn",[function(bxe) {
        return bxe;
    },function(boe,or,bxe) {
        return createSN('|').pushoprs(boe,bxe);
    }]],
	"LogicalANDExpression" : ["BitwiseORExpression | LogicalANDExpression '&&' BitwiseORExpression",[function(boe) {
        return boe;
    },function(lae,and,boe) {
        return createSN('&&').pushoprs(lae,boe);
    }]],
	"LogicalANDExpressionNoIn" : ["BitwiseORExpressionNoIn | LogicalANDExpressionNoIn '&&' BitwiseORExpressionNoIn",[function(boe) {
        return boe;
    },function(lae,and,boe) {
        return createSN('&&').pushoprs(lae,boe);
    }]],
	"LogicalORExpression" : ["LogicalANDExpression | LogicalORExpression '||' LogicalANDExpression",[function(lae) {
        return lae;
    },function(loe,lor,lae) {
        return createSN('||').pushoprs(loe,lae);
    }]],
	"LogicalORExpressionNoIn" : ["LogicalANDExpressionNoIn | LogicalORExpressionNoIn '||' LogicalANDExpressionNoIn",[function(lae) {
        return lae;
    },function(loe,lor,lae) {
        return createSN('||').pushoprs(loe,lae);
    }]],
	"ConditionalExpression" : ["LogicalORExpression | LogicalORExpression '?' AssignmentExpression ':' AssignmentExpression",[function(loe) {
        return loe;
    },function(loe,question,ae1,m,ae2) {
        return createSN('condexp').pushoprs(loe,ae1,ae2);
    }]],
	"ConditionalExpressionNoIn" : ["LogicalORExpressionNoIn | LogicalORExpressionNoIn '?' AssignmentExpression ':' AssignmentExpressionNoIn",[function(loe) {
        return loe;
    },function(loe,question,ae1,m,ae2) {
        return createSN('condexp').pushoprs(loe,ae1,ae2);
    }]],
	"AssignmentExpression" : ["ConditionalExpression | LeftHandSideExpression '=' AssignmentExpression | LeftHandSideExpression AssignmentOperator AssignmentExpression",[function(ce) {
        return ce;
    },function(le,assign,ae) {
        return createSN('=').pushoprs(le,ae);
    },function(le,assign,ae) {
        return createSN(assign).pushoprs(le,ae);
    }]],
	"AssignmentExpressionNoIn" : ["ConditionalExpressionNoIn | LeftHandSideExpression '=' AssignmentExpressionNoIn | LeftHandSideExpression AssignmentOperator AssignmentExpressionNoIn",[function(ce) {
        return ce;
    },function(le,assign,ae) {
        return createSN('=').pushoprs(le,ae);
    },function(le,assign,ae) {
        return createSN(assign).pushoprs(le,ae);
    }]],
	"AssignmentOperator" : ["'*=' | '/=' | '%=' | '+=' | '-=' | '<<=' | '>>=' | '>>>=' | '&=' | '^=' | '|='",[function() {
        return '*=';
    },function() {
        return '/=';
    },function() {
        return '%='
    },function() {
        return '+='
    },function() {
        return '-='
    },function() {
        return '<<='
    },function() {
        return '>>='
    },function() {
        return '>>>='
    },function() {
        return '&='
    },function() {
        return '^='
    },function() {
        return '|='
    }]],
	"Expression" : ["AssignmentExpression | Expression ',' AssignmentExpression",[function(ae) {
        return createSN('exp').pushoprs(ae);
    },function(e,q,ae) {
        e.oprs.push(ae);
        return e;
    }]],
	"ExpressionNoIn" : ["AssignmentExpressionNoIn | ExpressionNoIn ',' AssignmentExpressionNoIn",[function(ae) {
        return [ae];
    },function(e,ae) {
        e.push(ae);
        return e;
    }]],
	"Statement" : ["Block | VariableStatement | EmptyStatement | ExpressionStatement | IfStatement | IterationStatement | ContinueStatement | BreakStatement | ReturnStatement | WithStatement | LabelledStatement | SwitchStatement | ThrowStatement | TryStatement | DebuggerStatement",
    function(a){
        return a;
    }],
	"Block" : ["'{' StatementList ? '}'",[function(lq,slist,rq){
        if(slist == 'GRAMMAR_EMPTY') {
            return [];
        } else {
            return slist;
        }
    }]],
	"StatementList" : ["Statement | StatementList Statement",[function(s) {
        if(s instanceof Array) {
            return s;
        } else {
            return [s]
        }
    },function(sl,s) {
        sl.push(s);
        return sl;
    }]],
	"VariableStatement" : ["var VariableDeclarationList ';' ?",
	function(s,vlist,q) {
        return vlist;
	}],
	"VariableDeclarationList" : ["VariableDeclaration | VariableDeclarationList ',' VariableDeclaration",[
	function(v) {
		if(v) {
            return [v]
        } else {
            return [];
        }
	},
	function(vlist,q,v) {
        if(v) {
            vlist.push(v);
        }
		return vlist;
	}
	]],
	"VariableDeclarationListNoIn" : ["VariableDeclarationNoIn | VariableDeclarationListNoIn ',' VariableDeclarationNoIn",[
	function(v) {
        if(v) {
            return [v]
        } else {
            return [];
        }
	},
	function(vlist,q,v) {
        if(v) {
            vlist.push(v);
        }
		return vlist;
	}
	]],
	"VariableDeclaration" : ["Identifier Initialiser ?",
	[function(id,init) {
        curscope.table[id] = undefined;
        if(init != "GRAMMAR_EMPTY") {
            var sn = createSN('init');
            var s = createSN('id').pushoprs(id);
            sn.oprs.push(s);
            sn.oprs.push(init);
            return sn;
        } else {
            return createSN('id').pushoprs(id);
        }
	}]],
	"VariableDeclarationNoIn" : ["Identifier InitialiserNoIn ?",[function(id,init) {
        curscope.table[id] = undefined;
        if(init != "GRAMMAR_EMPTY") {
            var sn = createSN('init');
            var s = createSN('id').pushoprs(id);
            sn.oprs.push(s);
            sn.oprs.push(init);
            return sn;
        } else {
            return createSN('id').pushoprs(id);
        }
	}]],
	"Initialiser" : ["'=' AssignmentExpression",function(a,b){
        return b;
    }],
	"InitialiserNoIn" : ["'=' AssignmentExpressionNoIn",function(a,b) {
        return b;
    }],
	"EmptyStatement" : ["';'",function() {
        return createSN('empty');
    }],
	"ExpressionStatement" : ["Expression ';' ?",[function(a,b){
        return a;
    }]], //fixme : ExpressionStatement : [lookahead ∉ {{, function}] Expression ;
    "IfStatement" : ["if '(' Expression ')' Statement else Statement | if '(' Expression ')' Statement",
    [function(ifstr,lq,e,rq,s1,elsestr,s2) {
        return createSN('ifelse').pushoprs(e,s1,s2);
    },function(ifstr,lq,e,rq,s1) {
        return createSN('if').pushoprs(e,s1);
    }]],
	"IterationStatement" : ["do Statement while '(' Expression ')' ';' ? | while '(' Expression ')' Statement | for '(' ExpressionNoIn ? ';' Expression ? ';' Expression ? ')' Statement | for '(' var VariableDeclarationListNoIn ';' Expression ? ';' Expression ? ')' Statement | for '(' LeftHandSideExpression in Expression ')' Statement | for '(' var VariableDeclarationNoIn in Expression ')' Statement",[
        function(d,s,w,lq,e,rq){
            return createSN('dowhile').pushoprs(e,s);
        },
        function(w,lq,e,rq,s){
            return createSN('while').pushoprs(e,s);
        },
        function(f,lq,e1,semi1,e2,semi2,e3,rq,s){
            var sn = new structnode();
            sn.structname = 'for';
            if(e1 == 'GRAMMAR_EMPTY') {
                e1 = null;
            }
            if(e2 == 'GRAMMAR_EMPTY') {
                e2 = null;
            }
            if(e3 == 'GRAMMAR_EMPTY') {
                e3 = null;
            }
            sn.oprs.push([e1,e2,e3]);
            sn.oprs.push(s);
            return sn;
        },
        function(forstr,lq,varstr,vd,semi1,e1,semi2,e2,rq,s){
            var sn = new structnode();
            sn.structname = 'for'
            if(e1 == 'GRAMMAR_EMPTY') {
                e1 = null;
            }
            if(e2 == 'GRAMMAR_EMPTY') {
                e2 = null;
            }
            sn.oprs.push([vd,e1,e2]);
            sn.oprs.push(s);
            return sn;
        },
        function(forstr,lq,ls,instr,e,rq,s){
            return createSN('forin').pushoprs([ls,e],s);
        },
        function(forstr,lq,varstr,vd,instr,e,rq,s){
           return createSN('forin').pushoprs([vd,e],s);
        }
    ]],
	"ContinueStatement" : ["continue ';' ? | continue Identifier ';' ?",function(){
        return createSN('continue');
    }],
	"BreakStatement" : ["break ';' ? | break Identifier ';' ?",function(b){
        return createSN('break');
    }],
	"ReturnStatement" : ["return ';' ? | return Expression ';' ?",[
    function(r) {
        return createSN('return');
    },
    function(r,e,semi) {
        return createSN('return').pushoprs(e);
    }
  ]],
	"WithStatement" : ["with '(' Expression ')' Statement",function(wstr,lq,e,rq,s) {
        return createSN('with').pushoprs(e,s);
    }],
	"SwitchStatement" : ["switch '(' Expression ')' CaseBlock",function(sw,lq,e,rp,cb){
        return createSN('switch').pushoprs(e,cb);
    }],
	"CaseBlock" : ["'{' CaseClauses ? '}' | '{' CaseClauses ? DefaultClause ? '}' | '{' CaseClauses ? DefaultClause ? CaseClauses '}'",[
        function(lq,cc,rq) {
            if(cc == 'GRAMMAR_EMPTY') {
                return [];
            } else {
                return cc;
            }
        },
        function(lq,cc,dc,rq) {
            var a = [];
            if(cc != 'GRAMMAR_EMPTY') {
                a = a.concat(cc)
            }
            if(dc != "GRAMMAR_EMPTY") {
                a.push(dc);
            }
            return a;
        },
        function(lq,cc,dc,cc2,rq) {
            var a = [];
            if(cc != 'GRAMMAR_EMPTY') {
                a = a.concat(cc)
            }
            if(dc != "GRAMMAR_EMPTY") {
                a.push(dc);
            }
            a = a.concat(cc2);
            return a;
        }
    ]],
	"CaseClauses" : ["CaseClause | CaseClauses CaseClause",[function(cc) {
        return [cc];
    },function(ccs,cc){
        ccs.push(cc);
        return ccs;
    }]],
	"CaseClause" : ["case Expression ':' StatementList ?",
    function(casestr,e,colon,st){
        var sn = createSN('case').pushoprs(e);
       if(st != "GRAMMAR_EMPTY") {
           sn.oprs.push(st);
       }
       return sn;
    }],
	"DefaultClause" : ["default ':' StatementList ?",
    function(d,colon,stlist){
        var sn = createSN('default');
        if(stlist != "GRAMMAR_EMPTY") {
            sn.oprs.push(stlist)
        }
        return sn;
    }],
	"LabelledStatement" : ["Identifier ':' Statement"],
	"ThrowStatement" : ["throw Expression ';' ?"],
	"TryStatement" : ["try Block Catch | try Block Finally | try Block Catch Finally"],
	"Catch" : ["catch '(' Identifier ')' Block"],
	"Finally" : ["finally Block"],
	"DebuggerStatement" : ["debugger ';' ?"],
	"FuncDef" : ["function",function() {
        var node = new funcnode();
        node.scope.prev = curscope;
        curscope = node.scope;
        curfuncnodes.push(node);
    }],
	"FunctionDeclaration" : ["FuncDef Identifier '(' FormalParameterList ? ')' '{' FunctionBody '}'",
	function(funcdef, id, lq, flist, rq, lbq, fb, rbq) {
        var node = curfuncnodes[curfuncnodes.length-1]
        if(flist != "GRAMMAR_EMPTY") {
            node.params = flist;
        }
        node.oprs = fb;
        node.funcname = id;
        curscope.prev.table[id] = node;
        curscope = curscope.prev;
        curfuncnodes.pop();
	}],
	"FunctionExpression" : ["FuncDef Identifier ? '(' FormalParameterList ? ')' '{' FunctionBody '}'",
    function(funcdef, id, lq, flist, rq, lbq, fb, rbq) {
        if(id == "GRAMMAR_EMPTY") {
            id = genname();
        }
        var node = curfuncnodes[curfuncnodes.length-1]
        if(flist != "GRAMMAR_EMPTY") {
            node.params = flist;
        }
        node.oprs = fb;
        node.funcname = id;
        curscope.prev.table[id] = node;
        curscope = curscope.prev;
        curfuncnodes.pop();
        return createSN('id').pushoprs(id);
	}],
	"FormalParameterList" : ["Identifier | FormalParameterList ',' Identifier",
	[
		function(id) {
            return [createSN('id').pushoprs(id)];
		},
		function(flist,comma,id) {
            flist.push(id);
			return flist;
		}
	]],
	"FunctionBody" : ["SourceElements ?",function(se){
        if(se == "GRAMMAR_EMPTY") {
            return []
        } else {
            return se;
        }
    }],
	"Program" : ["SourceElements ?",function(a){
        globalfunc.oprs = a;
        return a;
    }],
	"SourceElements" : ["SourceElement | SourceElements SourceElement",
    [function(a){
        var arr = [];
        if(a) {
            if(a instanceof Array) {
                arr = arr.concat(a)
            } else {
                arr.push(a);
            }
        }
        return arr;
    },function(a,b){
        if(b) {
            if(b instanceof Array) {
                a = a.concat(b);
            } else {
                a.push(b);
            }
        }
        return a;
    }]],
	"SourceElement" : ["Statement | FunctionDeclaration",function(a) {
        return a;
    }],
};


function runfunc(node,args) {
    args = args || [];
    var s = new Scope();
    for(var k in node.scope.table) {
        s.table[k] = node.scope.table[k];
        var n = s.table[k];
        if(n instanceof funcnode) {
            var f = new funcnode();
            f.funcname = n.funcname;
            f.scope = n.scope;
            f.params = n.params;
            f.oprs = n.oprs;
            f.runscope = s;
            //console.log('runscope',s)
            f.prototype = n.prototype;
            s.table[k] = f;
        }
    }
    s.table['this'] = node.context;
    s.prev = node.runscope || globalscope;
    for(var i=0;i<node.params.length;i++) {
        s.table[node.params[i].oprs[0]] = args[i]
    }
    for(var i = 0;i<node.oprs.length;i++) {
        var r = runstatement(node.oprs[i],s);
        if(r && r.op == 'return') {
            return r.v;
        }
    }
}

function runstatement(s,scope) {
    if(s.structname == 'ifelse') {
        var b = runexp(s.oprs[0],scope);
        var list;
        if(b) {
            list = s.oprs[1];
        } else {
            list = s.oprs[2];
        }
        for(var i=0;i<list.length;i++) {
            var r = runstatement(list[i],scope);
            if(r && r.op == 'return') {
                return r;
            }
        }
    } else if(s.structname == 'if') {
        var b = runexp(s.oprs[0],scope);
        if(b) {
            var list = s.oprs[1];
            for(var i=0;i<list.length;i++) {
                var r = runstatement(list[i],scope);
                if(r && r.op == 'return') {
                    return r;
                }
            }
        }
    } else if(s.structname == 'switch') {
        var ret = runexp(s.oprs[0],scope);
        var list = s.oprs[1];
        var runindex = -1;
        var defaultindex = -1;
        if(!list || !list.length) {
            return;
        }
        for(var i=0;i<list.length;i++) {
            if(list[i].structname == 'case') {
                var e = runexp(list[i].oprs[0],scope);
                if(e === ret) {
                    runindex = i;
                    break;
                }
            }
            if(list[i].structname == 'default') {
                defaultindex = i;
            }
        }
        if(runindex == -1 && defaultindex != -1) {
            runindex = defaultindex;
        }
        if(runindex >= 0) {
            for(var i=runindex;i<list.length;i++) {
                var stindex = 1;
                if(list[i].structname == 'default') {
                    stindex = 0;
                }
                if(list[i].oprs[stindex] && list[i].oprs[stindex].length > 0) {
                    for(var j=0;j<list[i].oprs[stindex].length;j++) {
                        var r = runstatement(list[i].oprs[stindex][j],scope);
                        if(r && r.op == 'break') {
                            return;
                        } else if(r && r.op == 'return') {
                            return r;
                        }
                    }
                }
            }
        }
    } else if(s.structname == 'with') {
        var e = runexp(s.oprs[0],scope);
        var newscope = new Scope();
        newscope.prev = scope;
        newscope.table = e;
        newscope.type = "with"
        var stlist = s.oprs[1];
        for(var i=0;i<stlist.length;i++) {
            var r = runstatement(stlist[i],newscope);
            if(r) {
                if(r.op == 'break') {
                    return;
                } else if(r.op == 'continue') {
                    continue;
                } else if(r.op == 'return') {
                    return r;
                }
            }
        }
    } else if(s.structname == 'for') {
        var list = s.oprs[0];
        var stlist = s.oprs[1];
        if(list[0] instanceof Array) {
            for(var i=0;i<list[0].length;i++) {
                runstatement(list[0][i],scope);
            }
        } else if(list[0]) {
            runstatement(list[0],scope)
        }
        while(true) {
            if(list[1]) {
                var ret = runexp(list[1],scope);
                if(!ret) {
                    break;
                }
            }
            for(var i=0;i<stlist.length;i++) {
                var r = runstatement(stlist[i],scope);
                if(r) {
                    if(r.op == 'break') {
                        return;
                    } else if(r.op == 'continue') {
                        continue;
                    } else if(r.op == 'return') {
                        return r;
                    }
                }
            }
            if(list[2]) {
                runexp(list[2],scope);
            }
        }
    } else if(s.structname == 'forin') {
        var list = s.oprs[0];
        var stlist = s.oprs[1];
        var obj;
        var id;
        if(list[0].structname == 'id') {
            id = list[0].oprs[0];
            obj = findscope(id,scope);
        } else if(list[0].structname == 'memberexp') {
            obj = runexp(list[0].oprs[0],scope);
            if(list[0].oprs[1].structname == 'id') {
                id = list[0].oprs[1].oprs[0];
            } else {
                id = runexp(list[0].oprs[1],scope);
            }
        }
        var ret = runexp(list[1],scope);
        for(var k in ret) {
            obj[id] = k;
            for(var i=0;i<stlist.length;i++) {
                var r = runstatement(stlist[i],scope);
                if(r) {
                    if(r.op == 'break') {
                        break;
                    } else if(r.op == 'continue') {
                        continue;
                    } else if(r.op == 'return') {
                        return r;
                    }
                }
            }
        }
    } else if(s.structname == 'while') {
        var list = s.oprs[1];
        while(true) {
            var ret = runexp(s.oprs[0],scope);
            if(ret == false) break;
            if(list && list.length) {
                for(var i=0;i<list.length;i++) {
                    var r = runstatement(list[i],scope);
                    if(r && r.op == 'break') {
                        return;
                    } else if(r && r.op == 'continue') {
                        break;
                    } else if(r && r.op == 'return') {
                        return r
                    }
                }
            }
        }
    } else if(s.structname == 'dowhile') {
        var list = s.oprs[1];
        while(true) {
            if(list && list.length) {
                for(var i=0;i<list.length;i++) {
                    var r = runstatement(list[i],scope);
                    if(r && r.op == 'break') {
                        return;
                    } else if(r && r.op == 'continue') {
                        break;
                    } else if(r && r.op == 'return') {
                        return r
                    }
                }
            }
            var ret = runexp(s.oprs[0],scope);
            if(ret == false) break;
        }
    } else if(s.structname == 'continue') {
        return {
            op: 'continue'
        }
    } else if(s.structname == 'break') {
        return {
            op: 'break'
        }
    } else if(s.structname == 'return') {
        var r = {
            op: 'return'
        }
        if(s.oprs[0]) {
            r.v = runexp(s.oprs[0],scope);
        }
        return r;
    } else if(s.structname == 'init') {
        var id = s.oprs[0].oprs[0];
        var sc = scope;
        while(sc) {
            if(typeof sc.table == 'object') {
                if(id in sc.table) {
                    var ret = runexp(s.oprs[1],scope)
                    sc.table[id] = ret;
                    break;
                }
            } else {
                if(typeof sc.table[id] != "undefined") {
                    var ret = runexp(s.oprs[1],scope)
                    sc.table[id] = ret;
                    break;
                }
            }
            sc = sc.prev;
        }
        if(!s) {
            throw new Error(id + " is not defined");
        }
    } else if(s.structname == 'exp') {
        runexp(s,scope);
    }
}

function runexp(exp,scope) {
    if(exp.structname == 'exp') {
        var ret;
        for(var i=0;i<exp.oprs.length;i++) {
            ret = runexp(exp.oprs[i],scope);
        }
        return ret;
    } else if(exp.structname == 'memberexp') {
        var obj = runexp(exp.oprs[0],scope);
        var id;
        if(exp.oprs[1].structname == 'id') {
            id = exp.oprs[1].oprs[0];
        } else {
            id = runexp(exp.oprs[1],scope);
        }
        return obj[id];
    } else if(exp.structname == 'id') {
        var id = exp.oprs[0];
        var s = findscope(id,scope);
        return s[id];
    } else if(exp.structname == 'this') {
        return scope.table['this'];
    } else if(exp.structname == 'numliter') {
        return parseFloat(exp.oprs[0]);
    } else if(exp.structname == 'strliter') {
        return exp.oprs[0];
    } else if(exp.structname == 'regexpliter') {
        var str = exp.oprs[0];
        var ind = str.length-1;
        while(ind >= 0) {
            if(str[ind] == '/') {
                break;
            }
            ind--;
        }
        return new RegExp(str.substring(1,ind),str.substring(ind+1));
    } else if(exp.structname == 'boolliter') {
        if(exp.oprs[0] == 'true') {
            return true;
        } else {
            return false;
        }
    } else if(exp.structname == 'nullliter') {
        return null;
    } else if(exp.structname == 'objliter') {
        var obj = {};
        var list = exp.oprs;
        for(var i=0;i<list.length;i++) {
            var ret1;
            if(list[i].oprs[0].structname == 'id') {
                ret1 = list[i].oprs[0].oprs[0];
            } else {
                ret1 = runexp(list[i].oprs[0],scope);
            }
            var ret2 = runexp(list[i].oprs[1],scope);
            obj[ret1] = ret2;
        }
        return obj;
    } else if(exp.structname == 'arrliter') {
        var list = exp.oprs;
        var arr = [];
        for(var i=0;i<list.length;i++) {
            if(list[i]) {
                arr.push(runexp(list[i],scope));
            } else {
                arr.push(undefined)
            }
        }
        return arr;
    } else if(exp.structname == 'new') {
        var f = runexp(exp.oprs[0],scope);
        if(f instanceof funcnode) {
            var obj = {};
            f.context = obj;
            runfunc(f,exp.oprs[1] || []);
            obj.__proto__ = f.prototype;
            return obj;
        } else {
            throw new Error('not a constructor');
        }
    } else if(exp.structname == 'call') {
        var f = runexp(exp.oprs[0],scope);
        var context = null;
        if(exp.oprs[0].structname == 'memberexp') {
            context = runexp(exp.oprs[0].oprs[0],scope);
        } else if(scope.type == 'with') {
            context = scope.table;
        } else {
            context = globalscope;
        }
        var argexps = [];
        for(var i=0;i<exp.oprs[1].oprs.length;i++) {
            argexps.push(runexp(exp.oprs[1].oprs[i],scope));
        }
        if(f instanceof funcnode) {
            f.context = context;
            var r = runfunc(f,argexps);
            return r;
        } else if(f instanceof Function) {
            return f.apply(context,argexps)
        }
    } else if(exp.structname == 'callgetmember') {
        var r = runexp(exp.oprs[0],scope);
        var id;
        if(exp.oprs[1].structname == 'id') {
            id = exp.oprs[1].oprs[0];
        } else {
            id = runexp(exp.oprs[1],scope);
        }
        return r[id];
    } else if(exp.structname == 'condexp') {
        var ret1 = runexp(exp.oprs[0],scope);
        if(ret1) {
            return runexp(exp.oprs[1],scope)
        } else {
            return runexp(exp.oprs[2],scope)
        }
    } else {
        var ret1;
        var ret2;
        if(exp.structname != 'typeof' && exp.structname != '=') {
            ret1 = runexp(exp.oprs[0],scope);
        }
        if(exp.oprs[1] && exp.structname != 'delete') {
            ret2 = runexp(exp.oprs[1],scope);
        }
        if(exp.structname == '+') {
            return ret1+ret2;
        } else if(exp.structname == '-') {
            return ret1-ret2;
        } else if(exp.structname == '*') {
            return ret1*ret2
        } else if(exp.structname == '/') {
            return ret1/ret2;
        } else if(exp.structname == '%') {
            return ret1%ret2;
        } else if(exp.structname == '>') {
            return ret1>ret2;
        } else if(exp.structname == '>=') {
            return ret1>=ret2
        } else if(exp.structname == '<') {
            return ret1<ret2;
        } else if(exp.structname == '<=') {
            return ret1<=ret2;
        } else if(exp.structname == '==') {
            return ret1==ret2;
        } else if(exp.structname == '!=') {
            return ret1!=ret2;
        } else if(exp.structname == '===') {
            return ret1===ret2;
        } else if(exp.structname == '&') {
            return ret1&ret2;
        } else if(exp.structname == '^') {
            return ret1^ret2;
        } else if(exp.structname == '|') {
            return ret1|ret2;
        } else if(exp.structname == '&&') {
            return ret1&&ret2;
        } else if(exp.structname == '||') {
            return ret1||ret2;
        } else if(exp.structname == 'instanceof') {
            return ret1.__proto__ === ret2.prototype;
        } else if(exp.structname == 'in') {
            return ret2.hasOwnProperty(ret1);
        } else if(exp.structname == 'delete') {
            if(exp.oprs[0].structname == 'memberexp') {
                ret1 = runexp(exp.oprs[0].oprs[0],scope);
                if(exp.oprs[0].oprs[1].structname == 'id') {
                    ret2 = exp.oprs[0].oprs[1].oprs[0];
                } else {
                    ret2 = runexp(exp.oprs[0].oprs[1],scope);
                }
                delete ret1[ret2];
                return true;
            } else {
                return false;
            }
        } else if(exp.structname == 'void') {
            return void ret1;
        } else if(exp.structname == 'typeof') {
            try {
                ret1 = runexp(exp.oprs[0],scope);
                return typeof ret1;
            } catch(_) {
                return "undefined"
            }
        } else if(exp.structname == 'positive') {
            return +ret1;
        } else if(exp.structname == 'negative') {
            return -ret1;
        } else if(exp.structname == '~') {
            return ~ret1;
        } else if(exp.structname == '!') {
                return !ret1;
        } else {
            if(exp.oprs[0].structname != 'id' && exp.oprs[0].structname != 'memberexp') {
                throw new Error("Invalid left-hand side in assignment")
            }
            var obj,id;
            if(exp.oprs[0].structname == 'id') {
                id = exp.oprs[0].oprs[0];
                try {
                    obj = findscope(id,scope);
                } catch(e) {
                    if(exp.structname == '=') {
                        obj = globalscope.table;
                    } else {
                        throw e;
                    }
                }
            } else {
                obj = runexp(exp.oprs[0].oprs[0],scope);
                if(exp.oprs[0].oprs[1].structname == 'id') {
                    id = exp.oprs[0].oprs[1].oprs[0];
                } else {
                    id = runexp(exp.oprs[0].oprs[1],scope);
                }
            }
            if(exp.structname == '=') {
                obj[id] = ret2;
            } else if(exp.structname == '*=') {
                obj[id] = ret1*ret2;
            } else if(exp.structname == '/=') {
                obj[id] = ret1/ret2;
            } else if(exp.structname == '%=') {
                obj[id] = ret1%ret2;
            } else if(exp.structname == '+=') {
                obj[id] = ret1+ret2;
            } else if(exp.structname == '-=') {
                obj[id] = ret1-ret2;
            } else if(exp.structname == '<<=') {
                obj[id] = ret1<<ret2;
            } else if(exp.structname == '>>=') {
                obj[id] = ret1>>ret2;
            } else if(exp.structname == '>>>=') {
                obj[id] = ret1>>>ret2;
            } else if(exp.structname == '&=') {
                obj[id] = ret1&ret2;
            } else if(exp.structname == '^=') {
                obj[id] = ret1^ret2;
            } else if(exp.structname == '|=') {
                obj[id] = ret1|ret2;
            } else if(exp.structname == 'prefix++') {
                ++obj[id];
            } else if(exp.structname == 'prefix--') {
                --obj[id];
            } else if(exp.structname == 'post++') {
                var r = obj[id];
                obj[id]++;
                return r;
            } else if(exp.structname == 'post--') {
                var r = obj[id];
                obj[id]--;
                return r;
            } else {
                throw new Error("Unknown Operator")
            }
            return obj[id];
        }
    }
}


export function sandbox() {
    var p = new Parser(lexical,Lexer.priority.LONG_FIRST,grammar,'Program');
    this.set = function(varname,obj) {
        globalscope.table[varname] = obj;
    };
    this.run = function(str) {
        p.parse(str);
        console.log(globalscope);
        for(var i=0;i<globalfunc.oprs.length;i++) {
            runstatement(globalfunc.oprs[i],globalscope)
        };
    };
    this.get = function(varname) {
        return globalscope.table[varname];
    };
    this.call = function(funcname, _this, args) {
        var fn = globalscope.table[funcname];
        if(!(fn instanceof funcnode)) {
            throw new Error(funcname+" is not a function");
        }
        args = args || [];
        args.unshift(_this);
        return fn.call.apply(fn,args);
    }
};