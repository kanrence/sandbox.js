function Lexer(lexical_ary,priority) {
	if(priority === Lexer.priority.TAIL_FIRST) {
		lexical_ary = lexical_ary.slice(0).reverse();
		priority = Lexer.priority.HEAD_FIRST;
	}
	lexical_ary.forEach(function(rule,index) {
		if(rule.lex_reg.source[0] !== '^') {
			rule.lex_reg = new RegExp('^'+rule.lex_reg.source);
		}
	});
	
	this.parse = function(str) {
		if(!lexical_ary) return null;
		var len = str.length;
		var i = 0;
		var list = [];
		while(i < len) {
			var r = null,k = '';
			for(var j = 0,l = lexical_ary.length;j < l;j++) {
				var lex_rule = lexical_ary[j];
				var ret = str.match(lex_rule.lex_reg);
				if(ret && ret['index'] === 0) {
					if(priority === Lexer.priority.HEAD_FIRST) {
						if(!r){
							r = ret;
							k = lex_rule.lex_type;
							break;
						}
					} else if(priority === Lexer.priority.LONG_FIRST) {
						if(!r || ret[0].length > r[0].length){
							r = ret;
							k = lex_rule.lex_type;
						}
					} else if(priority === Lexer.priority.SHORT_FIRST) {
						if(!r || ret[0].length < r[0].length){
							r = ret;
							k = lex_rule.lex_type;
						}
					}
				}
			}
			if(r) {
				if(k !== 'IGNORE') {
					list.push(new Lexer.token(r[0],k));
				}
				str = str.substring(r[0].length);
				i += r[0].length;
			} else {
				return null;
			}
		}
		return list;
	}
	this.destroy = function() {
		for(var i = 0,len = lexical_ary.length;i < len;i++) {
			lexical_ary[i] = null;
		}
		lexical_ary = null;
	}
}
//多个正则表达式匹配的情况下，选取匹配项的优先级
Lexer.priority = { 
	HEAD_FIRST: 1, //桉传入的数组顺序，越靠前优先级越高
	TAIL_FIRST: 2, //桉传入的数组顺序，越靠后优先级越高
	LONG_FIRST: 3, //匹配到的长度越长，优先级越高
	SHORT_FIRST: 4 //匹配到的长度越短，优先级越高
};

Lexer.token = function (val,type) {
	this.lexeme = val;
	this.type = type;
}

export default Lexer;