var t1 = null,t2 = null;
function stat(t) {
	if(t === 's') {
		t1 = new Date().getTime();
	} else if(t === 'e') {
		t2 = new Date().getTime();
	} else if(t === 'r') {
		return t2 - t1;
	}
}

var debug = false;
function log() {
	if(debug) {
		console.log.apply(null,arguments);
	}
}
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

function Parser(lexical,priority,grammar,starter) {
	var tokenizer = new Lexer(lexical,priority);

	var id2entity = {},entity2id = {};
	var id = 0;
	var starterpi = starter+'_pi';
	grammar[starterpi] = [starter,[function(){}]];
	var symbollist = [];
	var privateSymbolMap = {};
	var privateSymbolid = 1;
	
	function createNewSymbol(type) {
		return new Lexer.token(('privateSymbol'+privateSymbolid++)+'_'+type,'GRAMMAR_SYM');
	}
	
	function reduceAsList() {
		if(arguments.length === 1) return arguments[0];
		var ret = [];
		for(var i = 0,len = arguments.length;i < len;i++) {
			ret[i] = arguments[i];
		}
		return ret;
	}

	var lexer = new Lexer([
	{ lex_type : "GRAMMAR_EMPTY", lex_reg : /GRAMMAR_EMPTY/ },
	{ lex_type : 'GRAMMAR_ZERO_OR_MORE', lex_reg : /\*/ },
	{ lex_type : 'GRAMMAR_ONE_OR_MORE', lex_reg : /\+/ },
	{ lex_type : 'GRAMMAR_ZERO_OR_ONE', lex_reg : /\?/ },
	{ lex_type : 'GRAMMAR_LEFT_BRACKET', lex_reg : /\(/ },
	{ lex_type : 'GRAMMAR_RIGHT_BRACKET', lex_reg : /\)/ },
	{ lex_type : 'GRAMMAR_OR', lex_reg : /\|/ },
	{ lex_type : 'GRAMMAR_QUOTE_SYM', lex_reg :/'[^\s]+?'/ },
	{ lex_type : 'GRAMMAR_SYM', lex_reg :/[^\s]+/ },
	{ lex_type : "IGNORE", lex_reg : /\s+/ } ], Lexer.priority.HEAD_FIRST);
	
	function EBNFParse1(g) { //替换GRAMMAR_QUOTE_SYM成GRAMMAR_SYM
		for(var k in g) {
			var list = lexer.parse(g[k][0]);
			list.forEach(function (tk) {
				if(tk.type === 'GRAMMAR_QUOTE_SYM') {
					tk.type = 'GRAMMAR_SYM';
					tk.lexeme = tk.lexeme.substring(1,tk.lexeme.length-1);
				}
			});
			g[k][0] = list;
		}
	}
	
	function EBNFParse2(g) { //去括号
		function handle(entry) {
			for(var i = 0;i < entry.length;i++) {
				if(entry[i].type === 'GRAMMAR_LEFT_BRACKET') {
					var count = 0,ary = [],len = entry.length,j = i+1;
					while(1) {
						if(j >= len || count === 0 && entry[j].type === 'GRAMMAR_RIGHT_BRACKET') break;
						ary.push(entry[j]);
						if(entry[j].type === 'GRAMMAR_LEFT_BRACKET') count++;
						if(entry[j].type === 'GRAMMAR_RIGHT_BRACKET') count--;
						j++;
					}
					if(j >= len) {
						throw(new Error('grammar driver error'));
					} else {
						newsymbol = privateSymbolMap[ary.map(function(e){return e.lexeme}).join('')];
						if(newsymbol) {
							entry.splice(i,j-i+1,newsymbol);
						} else {
							newsymbol = createNewSymbol('group');
							privateSymbolMap[ary.map(function(e){return e.lexeme}).join('')] = newsymbol;
							g[newsymbol.lexeme] = [];
							g[newsymbol.lexeme][0] = ary;
							g[newsymbol.lexeme][1] = reduceAsList;
							handle(g[newsymbol.lexeme][0]);
							entry.splice(i,j-i+1,newsymbol);
						}
						i--;
					}
				}
			}
		}
		for(var k in g) {
			handle(g[k][0]);
		}
	}
	
	function EBNFParse3(g) { //分割"|"
		for(var k in g) {
			var list = g[k][0];
			g[k][0] = [];
			var t = [];
			list.forEach(function (tk) {
				if(tk.type === 'GRAMMAR_OR') {
					g[k][0].push(t);
					t = [];
				} else {
					t.push(tk);
				}
			});
			t.length && g[k][0].push(t);
		}
	}
	
	function EBNFParse4(g) {
		function simplify(entry) {
			for(var i = 0;i < entry.length;i++) {
				if(entry[i].type === 'GRAMMAR_ZERO_OR_MORE' || entry[i].type === 'GRAMMAR_ONE_OR_MORE' || entry[i].type === 'GRAMMAR_ZERO_OR_ONE') {
					if(entry[i-1]) {
						var newsymbol = privateSymbolMap[entry[i-1].lexeme+entry[i].lexeme];
						if(newsymbol) {
							entry.splice(i-1,2,newsymbol);
						} else {
							newsymbol = createNewSymbol('list');
							privateSymbolMap[entry[i-1].lexeme+entry[i].lexeme] = newsymbol;
							g[newsymbol.lexeme] = [];
							if(entry[i].type === 'GRAMMAR_ZERO_OR_MORE') {
								g[newsymbol.lexeme][0] = 
								[
									[
										new Lexer.token(entry[i-1].lexeme,'GRAMMAR_SYM'),
										new Lexer.token(newsymbol.lexeme,'GRAMMAR_SYM')
									],
									[
										new Lexer.token('GRAMMAR_EMPTY','GRAMMAR_EMPTY')
									],
									[
										reduceAsList,
										function() {
											return 'GRAMMAR_EMPTY';
										}
									]
								];
							} else if(entry[i].type === 'GRAMMAR_ONE_OR_MORE') {
								g[newsymbol.lexeme][0] = 
								[
									[
										new Lexer.token(entry[i-1].lexeme,'GRAMMAR_SYM'),
										new Lexer.token(newsymbol.lexeme,'GRAMMAR_SYM')
									],
									[
										new Lexer.token(entry[i-1].lexeme,'GRAMMAR_SYM')
									],
									[
										reduceAsList,
										function() {
											return 'GRAMMAR_EMPTY';
										}
									]
								];
							} else if(entry[i].type === 'GRAMMAR_ZERO_OR_ONE') {
								g[newsymbol.lexeme][0] = 
								[
									[
										new Lexer.token(entry[i-1].lexeme,'GRAMMAR_SYM')
									],
									[
										new Lexer.token('GRAMMAR_EMPTY','GRAMMAR_EMPTY')
									],
									[
										reduceAsList,
										function() {
											return 'GRAMMAR_EMPTY';
										}
									]
								];
							}
							entry.splice(i-1,2,newsymbol);
							g[newsymbol.lexeme][0].forEach(function(e) {
								simplify(e);
							});
						}
						i--;
					}
				}
			}
		}
		for(var k in g) {
			g[k][0].forEach(function(entry) {
				simplify(entry);
			});
		}
	}
	EBNFParse1(grammar);
	EBNFParse2(grammar);
	EBNFParse3(grammar);
	EBNFParse4(grammar);
	
	for(var k in grammar) {
		var lists = grammar[k][0];
		lists.forEach(function (list) {
			list.forEach(function(tk) {
				if(tk.type === 'GRAMMAR_SYM' && symbollist.indexOf(tk.lexeme) < 0) {
					symbollist.push(tk.lexeme);
				}
			});
		});
		id2entity[id] = k;
		entity2id[k] = id++;
	}
	
	function checkSymbol() {
		var lexicalSymbol = {};
		lexical.forEach(function(e) {
			lexicalSymbol[e.lex_type] = 1;
		});
		symbollist.forEach(function(s){
			if(!(s in lexicalSymbol) && !(s in grammar)) {
				throw new Error(s+' is not defined');
			}
		});
	}

	checkSymbol();

	log('privateSymbolMap',privateSymbolMap)
	
	log('id2entity',id2entity);
	function pair(a,b,c) {
		return [a,b,c];
		//return a+'_'+b+'_'+c;
	}
	function unpair(s) {
		return s;
		/*return s.split('_').map(function(a){
			return parseInt(a);
		});*/
	}
	
	var emptySet = {};
	
	symbollist.forEach(function(k) {
		if(!(k in grammar)) {
			emptySet[k] = false;
		}
	});
	
	function empty(X) {
		if(X in emptySet) return emptySet[X];
		var entrylist = grammar[X][0];
		var ary = [];
		for(var i = 0,len = entrylist.length;i < len;i++) {
			if(entrylist[i][0].type === 'GRAMMAR_EMPTY') {
				return true;
			} else {
				var list = entrylist[i].map(function(tk) {
					return emptySet[tk.lexeme];
				});
				var a = false;
				for(var j = 0,l = list.length;j < l;j++) {
					if(list[j] === false) {
						a = false;
						break;
					}
					if(typeof list[j] === 'undefined') {
						a = undefined;
					}
				}
				if(j === l && typeof a !== 'undefined') return true;
				ary.push(a);
			}
		}
		for(i = 0,len = ary.length;i < len;i++) {
			if(typeof ary[i] === 'undefined') {
				return undefined;
			}
		}
		return false;
	}
	
	log('symbollist',symbollist);

	var loopcount = symbollist.length;
	while(1) {
		if(!loopcount) break;
		var hasUndefined = false;
		symbollist.forEach(function(s) {
			var ret = empty(s);
			if(typeof ret !== 'undefined') {
				emptySet[s] = ret;
			} else {
				hasUndefined = true;
			}
		});
		if(!hasUndefined) break;
		loopcount--;
	}
	if(!loopcount) {
		symbollist.forEach(function(s) {
			if(!(s in emptySet)) {
				emptySet[s] = false;
			}
		});
	}

	log('emptySet',emptySet);

	var firstSet = {};
	var firstCycle = [];
	function first(X,path) {
		if(firstSet[X]) return firstSet[X];
		if(path.indexOf(X) >= 0) {
			for(var i = 0,len = firstCycle.length;i < len;i++) {
				for(var j = 0,l = path.length;j < l;j++) {
					if(firstCycle[i].indexOf(path[j]) >= 0) {
						break;
					}
				}
				if(j < l) {
					path.slice(path.indexOf(X)).forEach(function(elm) {
						if(firstCycle[i].indexOf(elm) < 0) {
							firstCycle[i].push(elm);
						}
					});
					break;
				}
			}
			if(i === len) {
				firstCycle.push(path.slice(path.indexOf(X)));
			}
			return [];
		}
		if(!(X in grammar)) { //终结符
			firstSet[X] = [X];
			return firstSet[X];
		} else { //非终结符
			path.push(X);
			var entrylist = grammar[X][0];
			var f = [];
			if(emptySet[X]) {
				f.push('GRAMMAR_EMPTY');
			}
			entrylist.forEach(function(entry) {
				for(var i = 0,len = entry.length;i < len;i++) {
					if(entry[i].lexeme !== X) {
						var temp_f = first(entry[i].lexeme,path);
						temp_f.forEach(function(elm) {
							if(elm === 'GRAMMAR_EMPTY') return;
							if(f.indexOf(elm) >= 0) return;
							f.push(elm);
						});
					}
					if(!emptySet[entry[i].lexeme]) return;
				}
			});
			firstSet[X] = f;
			path.pop();
			return firstSet[X];
		}
	}
	
	symbollist.forEach(function(s) {
		first(s,[]);
	});
	log('firstCycle',firstCycle);
	firstCycle.forEach(function(c) {
		var newset = [];
		c.forEach(function (elm) {
			firstSet[elm].forEach(function(e) {
				if(newset.indexOf(e) < 0) {
					newset.push(e);
				}
			});
			firstSet[elm] = newset;
		});
	});

	log('first',firstSet);

	var followSet = {};
	followSet[starter] = ['GRAMMAR_END'];
	
	function tailEmpty(entry,from) {
		for(var i = from,len = entry.length;i < len;i++) {
			if(!emptySet[entry[i].lexeme]) {
				return false;
			}
		}
		return true;
	}
	
	function follow(X) {/////这里要fix多个连续empty的非终结符
		var entrylist = grammar[X][0];
		entrylist.forEach(function(entry) {
			for(var i = 0,len = entry.length - 1;i < len;i++) {
				if(!(entry[i].lexeme in grammar)) continue; //终结符不求follow
				var s = entry[i].lexeme;
				var j = i+1;
				followSet[s] = followSet[s] || [];
				var f = followSet[s];
				do {
					var temp_f = first(entry[j].lexeme);
					temp_f.forEach(function(elm) {
						if(elm !== 'GRAMMAR_EMPTY' && f.indexOf(elm) < 0) {
							f.push(elm);
						}
					});
					j++
				} while(j < len && temp_f.indexOf('GRAMMAR_EMPTY') >= 0)
				
				if(tailEmpty(entry,i+1)) {
					followSet[X] = followSet[X] || [];
					if(followSet[s].indexOf(followSet[X]) < 0) {
						followSet[s].push(followSet[X]);
					}
				}
			}
			if(entry[entry.length-1].lexeme in grammar) {
				var s = entry[entry.length-1].lexeme
				followSet[s] = followSet[s] || [];
				followSet[X] = followSet[X] || [];
				if(followSet[s].indexOf(followSet[X]) < 0) {
					followSet[s].push(followSet[X]);
				}
			}
		});
	}
	
	function flatten(set) {
		function merge(arrs) {
			var newarr = [];
			arrs.forEach(function(arr) {
				arr.forEach(function(elm) {
					if(elm instanceof Array) {
						if(arrs.indexOf(elm) < 0 && newarr.indexOf(elm) < 0) {
							newarr.push(elm);
						}
					} else {
						if(newarr.indexOf(elm) < 0) {
							newarr.push(elm);
						}
					}
				});
			});
			return newarr;
		}
		var path = [];
		var noarrmap = [];
		for(var k in set) {
			if(noarrmap.indexOf(set[k]) >= 0) continue;
			while(1) {
				path.push(set[k]);
				while(path.length) {
					var hasArr = false;
					var item = path[path.length-1];
					for(var i = 0,len = item.length;i<len;i++) {
						if(item[i] instanceof Array) {
							hasArr = true;
							if(path.indexOf(item[i]) >= 0) {
								var cycle = [];
								var ind = path.indexOf(item[i]);
								for(var i = path.length-1;i >= ind;i--) {
									cycle.push(path[i]);
									path.pop();
								}
								var newarr = merge(cycle);
								cycle.forEach(function(elm){
									for(var k in set) {
										if(set[k] === elm) {
											set[k] = newarr;
										} else if(set[k].indexOf(elm) >= 0) {
											set[k].splice(set[k].indexOf(elm),1,newarr);
										}
									}
								});
							} else {
								path.push(item[i]);
							}
							break;
						}
					}
					if(!hasArr) {
						if(noarrmap.indexOf(item) < 0)	noarrmap.push(item);
						var pitem = path[path.length-2];
						if(pitem) {
							item.forEach(function(elm) {
								if(pitem.indexOf(elm) < 0) {
									pitem.push(elm);
								}
							});
							pitem.splice(pitem.indexOf(item),1);
						}
						path.pop();
					}
				}
				if(noarrmap.indexOf(set[k]) >= 0) break;
			}
		}
	}
	
	symbollist.forEach(function(s) {
		if(s in grammar) {
			follow(s);
		}
	});
	flatten(followSet);

	log('followSet',followSet);
	
	var I = [];
	I[0] = [pair(entity2id[starterpi],0,0)];
	var IMapCache = {};
	IMapCache[I[0]] = 0;
	var closureMap = {};
	function closure(J) {
		for(var i = 0;i < J.length;i++) {
			var temp_p = unpair(J[i]);
			var t = grammar[id2entity[temp_p[0]]][0][temp_p[1]][temp_p[2]];
			if(t && typeof entity2id[t.lexeme] !== 'undefined') {
				if(closureMap[t.lexeme]) {
					closureMap[t.lexeme].forEach(function(elm) {
						if(J.indexOf(elm) < 0) {
							J.push(elm);
						}
					});
				} else {
					closureMap[t.lexeme] = [];
					for(var j = 0,len = grammar[t.lexeme][0].length;j < len;j++) {
						var p = pair(entity2id[t.lexeme],j,0);
						closureMap[t.lexeme].push(p);
						if(J.indexOf(p) < 0) {
							J.push(p);
						}
					}
				}
			}
		}
	}

	var GOTO = {},ACTION = {};

	function items(I) {
		for(var i = 0;i < I.length;i++) {
			closure(I[i]);
			var map = {};
			I[i].forEach(function(elm) {
				var p = unpair(elm);
				var entity = grammar[id2entity[p[0]]][0][p[1]];
				if(entity.length > p[2]) {
					var t = entity[p[2]]
					var temp_p = pair(p[0],p[1],p[2]+1);
					map[t.lexeme] = map[t.lexeme] || [];
					map[t.lexeme].push(temp_p);
				}
			});
			GOTO[i] = GOTO[i] || {};
			for(var lexeme in map) {
				var cachekey = map[lexeme].join('|');
				if(typeof IMapCache[cachekey] !== 'undefined') {
					GOTO[i][lexeme] = IMapCache[cachekey];
				} else {
					GOTO[i][lexeme] = IMapCache[cachekey] = I.length;
					I.push(map[lexeme]);
				}
			}
		}
		for(var i in GOTO) {
			ACTION[i] = ACTION[i] || {};
			for(var lexeme in GOTO[i]) {
				ACTION[i][lexeme] = ACTION[i][lexeme] || [];
				ACTION[i][lexeme].push(['p',GOTO[i][lexeme]]);
			}
		}
		
		for(i in I) {
			ACTION[i] = ACTION[i] || {};
			I[i].forEach(function(elm) {
				var p = unpair(elm);
				var s = id2entity[p[0]];
				var entity = grammar[s][0][p[1]];
				if(entity.length === p[2]) {
					if(s === starterpi) {
						ACTION[i]['GRAMMAR_END'] = ['a'];
						return;
					}
					var temp_f = followSet[s];
					temp_f.forEach(function(f){
						ACTION[i][f] = ACTION[i][f] || [];
						ACTION[i][f].push(['r'].concat(elm));
					});
				}
			});
		}
	}

	items(I);
	
	log('grammar',grammar)
	log('GOTO',GOTO);
	log('ACTION',ACTION);
	log('I',I)
	
	entity2id = null;
	firstCycle = null;
	privateSymbolMap = null;
	firstSet = null;
	emptySet = null;
	followSet = null;
	IMapCache = null;
	I = null;
	closureMap = null;
	symbollist = null;
	
	this.parse = function(str) {
		var tokenlist = tokenizer.parse(str);
		log('tokenlist',tokenlist);
		if(!tokenlist || !tokenlist.length) return null;
		tokenlist.push(new Lexer.token('', 'GRAMMAR_END'));
		function symbol(val) {
			this.val = val;
		}
		var actstack = [];
		var symbolStack = [];
		var act = null;
		var stack = [0],top = 0,i = 0,len = tokenlist.length,nexttoken = tokenlist[0];
		while(1) {
			if(i === len-1 && ACTION[stack[top]]['GRAMMAR_END'] && ACTION[stack[top]]['GRAMMAR_END'][0] === 'a') {
				console.log('accept');
				actstack = [];
				break;
			} else {
				var actlist = undefined, n = null;
				if(typeof ACTION[stack[top]][nexttoken.type] != 'undefined') {
					actlist = ACTION[stack[top]][nexttoken.type];
					n = nexttoken;
				} else if(typeof ACTION[stack[top]]['GRAMMAR_EMPTY'] != 'undefined') {
					actlist = ACTION[stack[top]]['GRAMMAR_EMPTY'];
					n = new Lexer.token('GRAMMAR_EMPTY','GRAMMAR_EMPTY');
				}
				if(typeof actlist === 'undefined') {
					while(actstack.length) {
						var actitem = actstack[actstack.length-1];
						if(actitem.cur === actitem.actlist.length - 1) {
							if(actitem.n.type !== 'GRAMMAR_EMPTY' && typeof ACTION[actitem.stack[actitem.stack.length-1]]['GRAMMAR_EMPTY'] !== 'undefined') {
								actitem.n = new Lexer.token('GRAMMAR_EMPTY','GRAMMAR_EMPTY');
								actitem.actlist = ACTION[actitem.stack[actitem.stack.length-1]]['GRAMMAR_EMPTY'];
								actitem.cur = -1;
							} else {
								actstack.pop();
							}
							continue;
						} else {
							log('again')
							stack = actitem.stack;
							i = actitem.i;
							top = stack.length-1;
							nexttoken = tokenlist[i];
							n = actitem.n;
							actitem.cur++;
							act = actitem.actlist[actitem.cur];
							symbolStack = actitem.symbolStack;
							break;
						}
					}
					if(!actstack.length) {
						console.log('error');
						actstack = [];
						break;
					}
				} else {
					actstack.push({actlist:actlist,i:i,n:n,stack:stack.slice(0),cur:0,symbolStack:symbolStack.slice(0)});
					act = actlist[0];
				}
				if(act[0] === 'p') { //act : p i (i为项集下标)
					stack.push(parseInt(act[1]));
					log('push',n.lexeme)
					symbolStack.push(new symbol(n.lexeme));
					top++;
					if(n.type != 'GRAMMAR_EMPTY') {
						i++;
						if(i < len) {
							nexttoken = tokenlist[i];
						}
					}
				} else if(act[0] === 'r') { //act ： r i j k (i j k为一个pair)
					var s = id2entity[parseInt(act[1],10)];
					log('reduce', s);
					var ind = parseInt(act[2],10);
					var entity = grammar[s][0][ind];
					var reducer = null;
					if(typeof grammar[s][1] === 'function') {
						reducer = grammar[s][1];
					} else if(grammar[s][1] instanceof Array) {
						reducer = grammar[s][1][ind];
					} else if(typeof grammar[s][1] === 'undefined') {
						//reducer = reduceAsList;
                        reducer = function(){
                            return [].join.call(arguments,'')
                        }
					}
					
					//var reducer = grammar[s][1][ind];
					var l = entity.length;
					var args = [];
					while(l--) {
						args.push(symbolStack.pop());
						stack.pop();
						top--;
					}
					/*function reducer() {
						return [].join.call([].filter.call(arguments,function(e){return e != 'GRAMMAR_EMPTY'}),' ');
					}*/
					var val = reducer.apply(null,args.reverse().map(function(a) {
							return a.val;
						}));
					if(GOTO[stack[top]][s]) {
						symbolStack.push(new symbol(val));
						stack.push(GOTO[stack[top]][s]);
						top++;
					}
				}
			}
		}
		return symbolStack[0].val;
	}
	this.destroy = function() {
		tokenizer.destroy();
		tokenizer = null;
		lexer.destroy();
		lexer = null;
		GOTO = null;
		ACTION = null;
		for(var i in grammar) {
			grammar[i] = null;
		}
	}
}

function format(s) {
    s = s.split('\n')
    var ns = []
    for(var i =0;i<s.length;i++) {
        if(s[i]) {
            ns.push('  '+s[i])
        }
    }
    return ns.join('\n')
}

//case 1 expression

//var lexer = new Lexer([
//	{ lex_type : "number", lex_reg : /\d+/ },
//	{ lex_type : '+', lex_reg : /\+/ },
//	{ lex_type : '-', lex_reg : /-/ },
//	{ lex_type : "*", lex_reg : /\*/ },
//	{ lex_type : "(", lex_reg : /\(/ },
//	{ lex_type : ")", lex_reg : /\)/ },
//	{ lex_type : "/", lex_reg : /\// } ], Lexer.priority.HEAD_FIRST);

/*	
var str = '5*(6+3)';
var tokenlist = lexer.parse(str);
var ret = new Parser({
	'E' : ["E '+' T | T",[function(E,plus,T){return '(+ '+E+' '+T+')'},function(T){return T}]],
	'T' : ["T '*' F | F",[function(T,mult,F){return '(* '+T+' '+F+')'},function(F){return F}]],
	'F' : ["'(' E ')' | number",[function(l,E,r){return E},function(number){return number}]]
},'E').parse(tokenlist);

console.log(ret);*/

/*
//case 2 json

//var ttt = new Date().getTime();
var str = '[{"key":"value","k1":"v2","w":[1,2,{"t":5}]}]'

var ret = new Parser([
	{ lex_type : "number", lex_reg : /\d+/ },
	{ lex_type : "str", lex_reg : /\w+/ },
	{ lex_type : "\"", lex_reg : /"/ },
	{ lex_type : "{", lex_reg : /\{/ },
	{ lex_type : "}", lex_reg : /\}/ },
	{ lex_type : "[", lex_reg : /\[/ },
	{ lex_type : "]", lex_reg : /\]/ },
	{ lex_type : ":", lex_reg : /:/ },
	{ lex_type : ",", lex_reg : /,/ } ], Lexer.priority.HEAD_FIRST,{
	'ary' : ['[ elmlist ]',[function(q1,el,q2){return '['+('\n'+el).replace(/\n/g,'\n    ')+'\n]'}]],
	'elmlist' : [' elm , elmlist | elm | GRAMMAR_EMPTY',[function(elm,d,el){return elm+','+'\n'+el;},function(elm){return elm;},function(){return '';}]],
	'elm' : ['" str " | number | ary | OBJ',[function(q1,str,q2){return '"'+str+'"';},function(num){return num;},function(ary){return ary;},function(obj){return obj;}]],
	'pair' : ['" str " : value',[function(q1,str,q2,m,v){return '"'+str+'" : '+v;}]],
	'value' : ['" str " | ary | OBJ | number',[function(q1,str,q2){return '"'+str+'"'},function(ary){return ary;},function(obj){return obj;},function(num){return num;}]],
	'pairlist' : ['pair , pairlist | pair | GRAMMAR_EMPTY',[function(p,d,pl){return p+',\n'+pl; },function(p){return p;},function(){return '';}]],
	'OBJ' : ['{ pairlist }',[function(q,pl,q){return '{'+('\n'+pl).replace(/\n/g,'\n    ')+'\n}'}]],
	'JSON' : ['OBJ | ary',[function(obj){return obj},function(ary){return ary;}]]
},'JSON').parse(str);

//var ttt1 = new Date().getTime();
//console.log(ttt1 - ttt);
console.log(ret);
*/

//case 4 php https://github.com/php/php-langspec/blob/master/spec/19-grammar.md#syntactic-grammar
/*
var lexical = [
	{ lex_type : '[' , lex_reg : /\[/ },
	{ lex_type : ']' , lex_reg : /\]/ },
	{ lex_type : '(' , lex_reg : /\(/ },
	{ lex_type : ')' , lex_reg : /\)/ },
	{ lex_type : '{' , lex_reg : /\{/ },
	{ lex_type : '}' , lex_reg : /\}/ },
	{ lex_type : '.' , lex_reg : /\./ },
	{ lex_type : '->' , lex_reg : /\->/ },
	{ lex_type : '++' , lex_reg : /\+\+/ },
	{ lex_type : '--' , lex_reg : /\-\-/ },
	{ lex_type : '**=' , lex_reg : /\*\*=/ },
	{ lex_type : '**' , lex_reg : /\*\* / },
	{ lex_type : '!==' , lex_reg : /!==/ },
	{ lex_type : '??' , lex_reg : /\?\?/ },
	{ lex_type : '&&' , lex_reg : /&&/ },
	{ lex_type : '&=' , lex_reg : /&=/ },
	{ lex_type : '&' , lex_reg : /&/ },
	{ lex_type : '||' , lex_reg : /\|\|/ },
	{ lex_type : '|' , lex_reg : /\|/ },
	{ lex_type : '*=' , lex_reg : /\*=/ },
	{ lex_type : '=>' , lex_reg : /=>/ },
	{ lex_type : '/=' , lex_reg : /\/=/ },
	{ lex_type : '%=' , lex_reg : /%=/ },
	{ lex_type : '+=' , lex_reg : /\+=/ },
	{ lex_type : '-=' , lex_reg : /\-=/ },
	{ lex_type : '.=' , lex_reg : /\.=/ },
	{ lex_type : '<<=' , lex_reg : /<<=/ },
	{ lex_type : '===' , lex_reg : /===/ },
	{ lex_type : '==' , lex_reg : /==/ },
	{ lex_type : '!=' , lex_reg : /!=/ },
	{ lex_type : '<=>' , lex_reg : /<=>/ },
	{ lex_type : '>>=' , lex_reg : />>=/ },
	{ lex_type : '>>' , lex_reg : />>/ },
	{ lex_type : '<<' , lex_reg : /<</ },
	{ lex_type : '<=' , lex_reg : /<=/ },
	{ lex_type : '>=' , lex_reg : />=/ },
	{ lex_type : '^=' , lex_reg : /\^=/ },
	{ lex_type : '^' , lex_reg : /\^/ },
	{ lex_type : '|=' , lex_reg : /\|=/ },
	{ lex_type : '?' , lex_reg : /\?/ },
	{ lex_type : '+' , lex_reg : /\+/ },
	{ lex_type : '-' , lex_reg : /\-/ },
	{ lex_type : '*' , lex_reg : /\* / },
	{ lex_type : '/' , lex_reg : /\// },
	{ lex_type : '~' , lex_reg : /~/ },
	{ lex_type : '!' , lex_reg : /!/ },
	{ lex_type : '$' , lex_reg : /\$/ },
	{ lex_type : '...' , lex_reg : /\.\.\./ },
	{ lex_type : '\\' , lex_reg : /\\/ },
	{ lex_type : ',' , lex_reg : /,/ },
	{ lex_type : ';' , lex_reg : /;/ },
	{ lex_type : ':' , lex_reg : /:/ },
	{ lex_type : '%' , lex_reg : /%/ },
	{ lex_type : '<' , lex_reg : /</ },
	{ lex_type : '>' , lex_reg : />/ },
	{ lex_type : '=' , lex_reg : /=/ },
	{ lex_type : '::' , lex_reg : /::/ },
	{ lex_type : '@' , lex_reg : /@/ },
	{ lex_type : '`' , lex_reg : /`/},
	{ lex_type : '<>' , lex_reg : /<>/},
	{ lex_type : 'abstract' , lex_reg : /abstract/ },
	{ lex_type : 'and' , lex_reg : /(and|AND)/ },
	{ lex_type : 'array' , lex_reg : /array/ },
	{ lex_type : 'as' , lex_reg : /as/ },
	{ lex_type : 'break' , lex_reg : /break/ },
	{ lex_type : 'callable' , lex_reg : /callable/ },
	{ lex_type : 'case' , lex_reg : /case/ },
	{ lex_type : 'catch' , lex_reg : /catch/ },
	{ lex_type : 'class' , lex_reg : /class/ },
	{ lex_type : 'clone' , lex_reg : /clone/ },
	{ lex_type : 'const' , lex_reg : /const/ },
	{ lex_type : 'continue' , lex_reg : /continue/ },
	{ lex_type : 'declare' , lex_reg : /declare/ },
	{ lex_type : 'default' , lex_reg : /default/ },
	{ lex_type : 'die' , lex_reg : /die/ },
	{ lex_type : 'do' , lex_reg : /do/ },
	{ lex_type : 'echo' , lex_reg : /echo/ },
	{ lex_type : 'else' , lex_reg : /else/ },
	{ lex_type : 'elseif' , lex_reg : /elseif/ },
	{ lex_type : 'empty' , lex_reg : /empty/ },
	{ lex_type : 'enddeclare' , lex_reg : /enddeclare/ },
	{ lex_type : 'endfor' , lex_reg : /endfor/ },
	{ lex_type : 'endforeach' , lex_reg : /endforeach/ },
	{ lex_type : 'endif' , lex_reg : /endif/ },
	{ lex_type : 'endswitch' , lex_reg : /endswitch/ },
	{ lex_type : 'endwhile' , lex_reg : /endwhile/ },
	{ lex_type : 'eval' , lex_reg : /eval/ },
	{ lex_type : 'exit' , lex_reg : /exit/ },
	{ lex_type : 'extends' , lex_reg : /extends/ },
	{ lex_type : 'final' , lex_reg : /final/ },
	{ lex_type : 'finally' , lex_reg : /finally/ },
	{ lex_type : 'for' , lex_reg : /for/ },
	{ lex_type : 'foreach' , lex_reg : /foreach/ },
	{ lex_type : 'function' , lex_reg : /function/ },
	{ lex_type : 'global' , lex_reg : /global/ },
	{ lex_type : 'goto' , lex_reg : /goto/ },
	{ lex_type : 'if' , lex_reg : /if/ },
	{ lex_type : 'implements' , lex_reg : /implements/ },
	{ lex_type : 'include' , lex_reg : /include/ },
	{ lex_type : 'include_once' , lex_reg : /include_once/ },
	{ lex_type : 'instanceof' , lex_reg : /instanceof/ },
	{ lex_type : 'insteadof' , lex_reg : /insteadof/ },
	{ lex_type : 'interface' , lex_reg : /interface/ },
	{ lex_type : 'isset' , lex_reg : /isset/ },
	{ lex_type : 'list' , lex_reg : /list/ },
	{ lex_type : 'namespace' , lex_reg : /namespace/ },
	{ lex_type : 'new' , lex_reg : /new/ },
	{ lex_type : 'or' , lex_reg : /(or|OR)/ },
	{ lex_type : 'print' , lex_reg : /print/ },
	{ lex_type : 'private' , lex_reg : /private/ },
	{ lex_type : 'protected' , lex_reg : /protected/ },
	{ lex_type : 'public' , lex_reg : /public/ },
	{ lex_type : 'require' , lex_reg : /require/ },
	{ lex_type : 'require_once' , lex_reg : /require_once/ },
	{ lex_type : 'return' , lex_reg : /return/ },
	{ lex_type : 'static' , lex_reg : /static/ },
	{ lex_type : 'switch' , lex_reg : /switch/ },
	{ lex_type : 'throw' , lex_reg : /throw/ },
	{ lex_type : 'trait' , lex_reg : /trait/ },
	{ lex_type : 'try' , lex_reg : /try/ },
	{ lex_type : 'unset' , lex_reg : /unset/ },
	{ lex_type : 'use' , lex_reg : /use/ },
	{ lex_type : 'var' , lex_reg : /var/ },
	{ lex_type : 'while' , lex_reg : /while/ },
	{ lex_type : 'xor' , lex_reg : /xor/ },
	{ lex_type : 'yield from' , lex_reg : /yield\s+from/ },
	{ lex_type : 'yield' , lex_reg : /yield/ },
	{ lex_type : 'self' , lex_reg : /self/ },
	{ lex_type : 'parent' , lex_reg : /parent/ },
	{ lex_type : 'binary' , lex_reg : /binary/ },
	{ lex_type : 'bool' , lex_reg : /bool/ },
	{ lex_type : 'boolean' , lex_reg : /boolean/ },
	{ lex_type : 'int' , lex_reg : /int/ },
	{ lex_type : 'integer' , lex_reg : /integer/ },
	{ lex_type : 'float' , lex_reg : /float/ },
	{ lex_type : 'object' , lex_reg : /object/ },
	{ lex_type : 'real' , lex_reg : /real/ },
	{ lex_type : 'string' , lex_reg : /string/ },
	{ lex_type : 'from' , lex_reg : /from/ },
	{ lex_type : 'ticks' , lex_reg : /ticks/ },
	{ lex_type : 'encoding' , lex_reg : /encoding/ },
	{ lex_type : 'strict_types' , lex_reg : /strict_types/ },
	{ lex_type : 'void' , lex_reg : /void/ },
	{ lex_type : 'iterable' , lex_reg : /iterable/ },
	{ lex_type : '__construct' , lex_reg : /__construct/ },
	{ lex_type : '__destruct' , lex_reg : /__destruct/ },
	{ lex_type : 'double' , lex_reg : /double/ },
	{ lex_type : 'boolean-literal' , lex_reg : /(true|TRUE|false|FALSE)/ },
	{ lex_type : 'integer-literal' , lex_reg : /(([1-9]+[0-9]*)|(0[0-7]+)|(0(x|X)[0-9a-fA-F]+)|(0(b|B)[0-1]+))/ },
	{ lex_type : 'floating-literal' , lex_reg : /((([0-9]*\.[0-9]+|[0-9]+\.)((e|E)(\+\-)?[0-9]+)?)|([0-9]+(e|E)?(\=|\-)?[0-9]+)|0)/ },
	{ lex_type : 'string-literal' , lex_reg : /((b?'(\\'|\\\\)*[^'\\]*')|(b?"(\\"|\\\\|\\\$|\\e|\\f|\\n|\\r|\\t|\\v|(\\[0-7]{1,3})|(\\(x|X)[0-9a-fA-F]{1,2})|(\\u\{[0-9a-fA-F]+\}))*[^"\\]*(\\[^0-7]+)*"))/},
	{ lex_type : 'binary-literal' , lex_reg : /0(b|B)[0-1]+/ },
	{ lex_type : 'variable-name' , lex_reg : /\$[a-zA-Z_]+[0-9a-zA-Z_]* / },
	{ lex_type : 'name' , lex_reg : /[a-zA-Z_]+[0-9a-zA-Z_]* / },
	{ lex_type : "IGNORE", lex_reg : /(\s+|\/\/.*\n|\/\*(\n|.)*?\*\/)/ }];

	var grammar = {
	"script" : ["statement-list"],
	"statement" : ["compound-statement | named-label-statement | expression-statement | selection-statement | iteration-statement | jump-statement | try-statement | declare-statement | const-declaration | function-definition | class-declaration | interface-declaration | trait-declaration | namespace-definition | namespace-use-declaration | global-declaration | function-static-declaration"],
	"compound-statement" : ["'{' statement-list ? '}'"],
	"statement-list" : ["statement | statement statement-list"],
	"expression-statement" : ["expression ? ';'"],

	"primary-expression" : ["variable | class-constant-access-expression | constant-access-expression | literal | array-creation-expression | intrinsic | anonymous-function-creation-expression | '(' expression ')'"],
	"simple-variable" : ["variable-name | '$' simple-variable | '$' '{' expression '}'"],

	"dereferencable-expression" : ["variable | '(' expression ')' | array-creation-expression | string-literal"],

	"callable-expression" : ["callable-variable | '(' expression ')' | array-creation-expression | string-literal"],

	"callable-variable" : ["simple-variable | subscript-expression | member-call-expression | scoped-call-expression | function-call-expression"],

	"variable" : ["callable-variable | scoped-property-access-expression | member-access-expression"],

	"qualified-name" : ["name"],

	"constant-access-expression" : ["qualified-name"],

	"literal" : ["integer-literal | floating-literal | string-literal | boolean-literal"],

	"intrinsic" : ["intrinsic-construct | intrinsic-operator"],

	"intrinsic-construct" : ["echo-intrinsic | list-intrinsic | unset-intrinsic"],

	"intrinsic-operator" : ["empty-intrinsic | eval-intrinsic | exit-intrinsic | isset-intrinsic | print-intrinsic"],

	"echo-intrinsic" : ["echo expression-list"],

	"expression-list" : ["expression | expression ',' expression-list"],

	"empty-intrinsic" : ["empty '(' expression ')'"],

	"eval-intrinsic" : ["eval '(' expression ')'"],

	"exit-intrinsic" : ["exit | exit '(' expression ? ')' | die | die '(' expression ? ')'"],

	"isset-intrinsic" : ["isset '(' variable-list ')'"],

	"variable-list" : ["variable | variable ',' variable-list"],

	"list-intrinsic" : ["list '(' list-expression-list ')'"],

	"list-expression-list" : ["unkeyed-list-expression-list | keyed-list-expression-list ',' ?"],

	"unkeyed-list-expression-list" : ["list-or-variable | ',' | list-or-variable ? ',' unkeyed-list-expression-list"],

	"keyed-list-expression-list" : ["expression '=>' list-or-variable | expression '=>' list-or-variable ',' keyed-list-expression-list"],

	"list-or-variable" : ["list-intrinsic | expression"],

	"print-intrinsic" : ["print expression"],

	"unset-intrinsic" : ["unset '(' variable-list ')'"],

	"anonymous-function-creation-expression" : ["static ?   function   '&' ? '(' parameter-declaration-list ? ')' anonymous-function-use-clause ? return-type ? compound-statement"],

	"anonymous-function-use-clause" : ["use '(' use-variable-name-list ')'"],

	"use-variable-name-list" : ["'&' ? variable-name | '&' ? variable-name ',' use-variable-name-list"],

	"postfix-expression" : ["primary-expression | clone-expression | object-creation-expression | postfix-increment-expression | postfix-decrement-expression | exponentiation-expression"],

	"clone-expression" : ["clone expression"],

	"object-creation-expression" : ["new   class-type-designator '(' argument-expression-list ? ')' | new class-type-designator | new   class '(' argument-expression-list ? ')' class-base-clause ? class-interface-clause ? '{' class-member-declarations ? '}' |  new class class-base-clause ? class-interface-clause ? '{' class-member-declarations ? '}'"],

	"class-type-designator" : ["qualified-name | expression"],

	"array-creation-expression" : ["array '(' array-initializer ? ')' | '[' array-initializer ? ']'"],

	"array-initializer" :  ["array-initializer-list ',' ?"],

	"array-initializer-list" : ["array-element-initializer | array-element-initializer ',' array-initializer-list"],

	"array-element-initializer" : ["'&' ? element-value | element-key '=>' '&' ? element-value"],

	"element-key" : ["expression"],

	"element-value" : ["expression"],

	"subscript-expression" : ["dereferencable-expression '[' expression ? ']' | dereferencable-expression '{' expression '}'"],

	"function-call-expression" : ["( qualified-name | include | include_once | require | require_once ) '(' argument-expression-list ? ')' | callable-expression '('  argument-expression-list ? ')'"],

	"argument-expression-list" : ["argument-expression | argument-expression ',' argument-expression-list"],

	"argument-expression" : ["variadic-unpacking | expression"],

	"variadic-unpacking" : ["'...' assignment-expression"],

	"member-access-expression" : ["dereferencable-expression '->' member-name"],

	"member-name" : ["name | simple-variable | '{' expression '}' | class"],

	"member-call-expression" : ["dereferencable-expression '->' member-name '(' argument-expression-list ? ')'"],

	"postfix-increment-expression" : ["variable '++'"],

	"postfix-decrement-expression" : ["variable '--'"],

	"scoped-property-access-expression" : ["scope-resolution-qualifier '::' simple-variable"],

	"scoped-call-expression" : ["scope-resolution-qualifier '::' member-name '(' argument-expression-list ? ')'"],

	"class-constant-access-expression" : ["scope-resolution-qualifier '::' 'name'"],

	"scope-resolution-qualifier" : ["relative-scope | qualified-name | dereferencable-expression"],

	"relative-scope" : ["self | parent | static"],

	"exponentiation-expression" : ["expression '**' expression"],

	"unary-expression" : ["postfix-expression | prefix-increment-expression | prefix-decrement-expression | unary-op-expression | error-control-expression | shell-command-expression | cast-expression"],
	
	"prefix-increment-expression" : ["'++' variable"],

	"prefix-decrement-expression" : ["'--' variable"],

	"unary-op-expression" : ["unary-operator unary-expression"],

	"unary-operator" : ["'+' | '-' | '!' | '~'"],

	"error-control-expression" : ["'@' expression"],

	"shell-command-expression" : ["'`' string-literal ? '`'"],

	"cast-expression" : ["'(' cast-type ')' expression"],

	"cast-type" : ["array | binary | bool | boolean | double | int | integer | float | object | real | string | unset"],

	"instanceof-expression" : ["unary-expression | instanceof-subject instanceof instanceof-type-designator"],

	"instanceof-subject" : ["expression"],

	"instanceof-type-designator" : ["qualified-name | expression"],

	"multiplicative-expression" : ["instanceof-expression | multiplicative-expression '*' instanceof-expression |  multiplicative-expression '/' instanceof-expression | multiplicative-expression '%' instanceof-expression"],

	"additive-expression" : ["multiplicative-expression | additive-expression   '+'   multiplicative-expression | additive-expression '-' multiplicative-expression | additive-expression '.' multiplicative-expression"],

	"shift-expression" : ["additive-expression | shift-expression '<<' additive-expression | shift-expression '>>' additive-expression"],

	"relational-expression" : ["shift-expression | relational-expression '<' shift-expression | relational-expression '>'  shift-expression | relational-expression '<=' shift-expression | relational-expression '>=' shift-expression | relational-expression '<=>' shift-expression"],

	"equality-expression" : ["relational-expression | equality-expression '==' relational-expression | equality-expression '!=' relational-expression | equality-expression '<>' relational-expression | equality-expression '===' relational-expression | equality-expression '!==' relational-expression"],

	"bitwise-AND-expression" : ["equality-expression | bitwise-AND-expression '&' equality-expression"],

	"bitwise-exc-OR-expression" : ["bitwise-AND-expression | bitwise-exc-OR-expression '^' bitwise-AND-expression"],

	"bitwise-inc-OR-expression" : ["bitwise-exc-OR-expression | bitwise-inc-OR-expression '|' bitwise-exc-OR-expression"],

	"logical-AND-expression-1" :  ["bitwise-inc-OR-expression | logical-AND-expression-1 '&&' bitwise-inc-OR-expression"],

	"logical-inc-OR-expression-1" : ["logical-AND-expression-1 | logical-inc-OR-expression-1 '||' logical-AND-expression-1"],

	"conditional-expression" : ["logical-inc-OR-expression-1 | logical-inc-OR-expression-1 '?' expression ? ':' conditional-expression"],

	"coalesce-expression" : ["logical-inc-OR-expression-1 '??' expression"],

	"assignment-expression" : ["conditional-expression | coalesce-expression | simple-assignment-expression | byref-assignment-expression | compound-assignment-expression"],

	"simple-assignment-expression" : ["variable '=' assignment-expression | list-intrinsic '=' assignment-expression"],

	"byref-assignment-expression" : ["variable '=' '&' assignment-expression"],

	"compound-assignment-expression" : ["variable compound-assignment-operator assignment-expression"],

	"compound-assignment-operator" : ["'**=' | '*=' | '/=' | '%=' | '+=' | '-=' | '.=' | '<<=' | '>>=' | '&=' | '^=' | '|='"],

	"logical-AND-expression-2" : ["assignment-expression | logical-AND-expression-2 ( and | '&&' ) assignment-expression"],

	"logical-exc-OR-expression" : ["logical-AND-expression-2 | logical-exc-OR-expression xor logical-AND-expression-2"],

	"logical-inc-OR-expression-2" : ["logical-exc-OR-expression | logical-inc-OR-expression-2 ( or | '||' ) logical-exc-OR-expression"],

	"yield-expression" : ["logical-inc-OR-expression-2 | yield array-element-initializer | yield from expression"],

	"expression" : ["yield-expression | include-expression | include-once-expression | require-expression | require-once-expression"],

	"include-expression" : ["include expression"],

	"include-once-expression" : ["include_once expression"],

	"require-expression" : ["require expression"],

	"require-once-expression" : ["require_once expression"],

	"constant-expression" : ["expression"],

	"named-label-statement" : ["name ';' statement"],

	"selection-statement" : ["if-statement | switch-statement"],

	"if-statement" : ["if '(' expression ')' statement elseif-clauses-1 ? else-clause-1 ? | if '(' expression ')' ':' statement-list elseif-clauses-2 ? else-clause-2 ? endif ';'"],

	"elseif-clauses-1" : ["elseif-clause-1 | elseif-clauses-1 elseif-clause-1"],

	"elseif-clause-1" : ["elseif '(' expression ')' statement"],

	"else-clause-1" : ["else statement"],

	"elseif-clauses-2" : ["elseif-clause-2 | elseif-clauses-2 elseif-clause-2"],

	"elseif-clause-2" : ["elseif '(' expression ')' ':' statement-list"],

	"else-clause-2" : ["else ':' statement-list"],

	"switch-statement" : ["switch '(' expression ')' '{' case-statements ? '}' | switch '(' expression ')' ':' case-statements ? endswitch ';'"],

	"case-statements" : ["case-statement case-statements ? | default-statement case-statements ?"],

	"case-statement" : ["case expression case-default-label-terminator statement-list ?"],

	"default-statement" : ["default case-default-label-terminator statement-list ?"],

	"case-default-label-terminator" : ["':' | ';'"],

	"iteration-statement" : ["while-statement | do-statement | for-statement | foreach-statement"],

	"while-statement" : ["while '(' expression ')' statement | while '(' expression ')' ':' statement-list endwhile ';'"],

	"do-statement" : ["do statement while '(' expression ')' ';'"],

	"for-statement" : ["for '(' for-initializer ? ';' for-control ? ';' for-end-of-loop ? ')' statement | for '(' for-initializer ? ';' for-control ? ';' for-end-of-loop ? ')' ':' statement-list endfor ';'"],

	"for-initializer" : ["for-expression-group"],

	"for-control" : ["for-expression-group"],

	"for-end-of-loop" : ["for-expression-group"],

	"for-expression-group" : ["expression | for-expression-group ',' expression"],

	"foreach-statement" : ["foreach '(' foreach-collection-name as foreach-key ? foreach-value ')' statement | foreach '(' foreach-collection-name as foreach-key ? foreach-value ')' ':' statement-list endforeach ';'"],

	"foreach-collection-name" : ["expression"],

	"foreach-key" : ["expression '=>'"],

	"foreach-value" : ["'&' ? expression | list-intrinsic"],

	"jump-statement" : ["goto-statement | continue-statement | break-statement | return-statement | throw-statement"],

	"goto-statement" : ["goto name ';'"],

	"continue-statement" : ["continue breakout-level ? ';'"],

	"breakout-level" : ["integer-literal"],

	"break-statement" : ["break breakout-level ? ';'"],

	"return-statement" : ["return expression ? ';'"],

	"throw-statement" : ["throw expression ';'"],

	"try-statement" : ["try compound-statement catch-clauses | try compound-statement finally-clause | try compound-statement catch-clauses finally-clause"],

	"catch-clauses" : ["catch-clause | catch-clauses catch-clause"],

	"catch-clause" : ["catch '(' qualified-name variable-name ')' compound-statement"],

	"finally-clause" : ["finally compound-statement"],

	"declare-statement" : ["declare '(' declare-directive ')' statement | declare '(' declare-directive ')' ':' statement-list  enddeclare ';' | declare '(' declare-directive ')' ';'"],

	"declare-directive" : ["ticks '=' literal | encoding '=' literal | strict_types '=' literal"],

	"function-definition" : ["function-definition-header compound-statement"],

	"function-definition-header" : ["function '&' ? name '(' parameter-declaration-list ? ')' return-type ?"],

	"parameter-declaration-list" : ["simple-parameter-declaration-list | variadic-declaration-list"],

	"simple-parameter-declaration-list" : ["parameter-declaration | parameter-declaration ',' parameter-declaration-list"],

	"variadic-declaration-list" : ["variadic-parameter ',' simple-parameter-declaration-list | variadic-parameter"],

	"parameter-declaration" : ["type-declaration ? '&' ? variable-name default-argument-specifier ?"],

	"variadic-parameter" : ["type-declaration ? '&' ? '...' variable-name"],

	"return-type" : ["':' type-declaration | ':' void"],

	"type-declaration" : ["array | callable | iterable | scalar-type | qualified-name"],

	"scalar-type" : ["bool | float | int | string"],

	"default-argument-specifier" : ["'=' constant-expression"],

	"class-declaration" : ["class-modifier ? class name class-base-clause ? class-interface-clause ? '{' class-member-declarations ? '}'"],

	"class-modifier" : ["abstract | final"],

	"class-base-clause" : ["extends qualified-name"],

	"class-interface-clause" : ["implements qualified-name | class-interface-clause ',' qualified-name"],

	"class-member-declarations" : ["class-member-declaration | class-member-declarations class-member-declaration"],

	"class-member-declaration" : ["class-const-declaration | property-declaration | method-declaration | constructor-declaration | destructor-declaration | trait-use-clause"],

	"const-declaration" : ["const const-elements ';'"],

	"class-const-declaration" : ["visibility-modifier ? const const-elements ';'"],

	"const-elements" : ["const-element | const-elements const-element"],

	"const-element" : ["name '=' constant-expression"],

	"property-declaration" : ["property-modifier property-elements"],

	"property-modifier" : ["var | visibility-modifier static-modifier ? | static-modifier visibility-modifier ?"],

	"visibility-modifier" : ["public | protected | private"],

	"static-modifier" : ["static"],

	"property-elements" : ["property-element | property-elements property-element"],

	"property-element" : ["variable-name property-initializer ? ';'"],

	"property-initializer" : ["'=' constant-expression"],

	"method-declaration" : ["method-modifiers ? function-definition | method-modifiers function-definition-header ';'"],

	"method-modifiers" : ["method-modifier | method-modifiers method-modifier"],

	"method-modifier" : ["visibility-modifier | static-modifier | class-modifier"],

	"constructor-declaration" : ["method-modifiers function '&' ? __construct '(' parameter-declaration-list ? ')' compound-statement"],

	"destructor-declaration" : ["method-modifiers function '&' ? __destruct '(' ')' compound-statement"],

	"interface-declaration" : ["interface name interface-base-clause ? '{' interface-member-declarations ? '}'"],

	"interface-base-clause" : ["extends qualified-name | interface-base-clause ',' qualified-name"],

	"interface-member-declarations" : ["interface-member-declaration | interface-member-declarations interface-member-declaration"],

	"interface-member-declaration" : ["class-const-declaration | method-declaration"],

	"trait-declaration" : ["trait name '{' trait-member-declarations ? '}'"],

	"trait-member-declarations" : ["trait-member-declaration | trait-member-declarations trait-member-declaration"],

	"trait-member-declaration" : ["property-declaration | method-declaration | constructor-declaration | destructor-declaration | trait-use-clauses"],

	"trait-use-clauses" : ["trait-use-clause | trait-use-clauses trait-use-clause"],

	"trait-use-clause" : ["use trait-name-list trait-use-specification"],

	"trait-name-list" : ["qualified-name | qualified-name ',' trait-name-list"],

	"trait-use-specification" : ["';' | '{' trait-select-and-alias-clauses ? '}'"],

	"trait-select-and-alias-clauses" : ["trait-select-and-alias-clause | trait-select-and-alias-clauses trait-select-and-alias-clause"],

	"trait-select-and-alias-clause" : ["trait-select-insteadof-clause ';' | trait-alias-as-clause ';'"],

	"trait-select-insteadof-clause" : ["name insteadof name"],

	"trait-alias-as-clause" : ["name as visibility-modifier ? name | name as visibility-modifier name ?"],

	"namespace-definition" : ["namespace name ';' | namespace name ? compound-statement"],

	"namespace-use-declaration" : ["use namespace-function-or-const ? namespace-use-clauses ';' | use namespace-function-or-const '\\' ? namespace-name '\\' '{' namespace-use-group-clauses-1 '}' ';' | use '\\' ? namespace-name '\\' '{' namespace-use-group-clauses-2 '}' ';'"],

	"namespace-use-clauses" : ["namespace-use-clause | namespace-use-clauses ',' namespace-use-clause"],

	"namespace-use-clause" : ["qualified-name namespace-aliasing-clause ?"],

	"namespace-aliasing-clause" : ["as name"],

	"namespace-function-or-const" : ["function | const"],

	"namespace-use-group-clauses-1" : ["namespace-use-group-clause-1 | namespace-use-group-clauses-1 ',' namespace-use-group-clause-1"],

	"namespace-use-group-clause-1" : ["namespace-name namespace-aliasing-clause ?"],

	"namespace-use-group-clauses-2" : ["namespace-use-group-clause-2 | namespace-use-group-clauses-2 ',' namespace-use-group-clause-2"],

	"namespace-use-group-clause-2" : ["namespace-function-or-const ? namespace-name namespace-aliasing-clause ?"],

	"global-declaration" : ["global variable-name-list ';'"],

	"function-static-declaration" : ["static static-variable-name-list ';'"],

	"namespace-name" : ["name"],

	"variable-name-list" : ["simple-variable | simple-variable ',' variable-name-list"],

	"static-variable-name-list" : ["static-variable-declaration | static-variable-declaration ',' static-variable-name-list"],

	"static-variable-declaration" : ["variable-name function-static-initializer ?"],

	"function-static-initializer" : ["'=' constant-expression"],

};



var str = `


defined('BASEPATH') OR exit('No direct script access allowed');

class CI_Input {
	
	protected $ip_address = FALSE;
	
	protected $headers = array();
	
	protected $_raw_input_stream;
	
	protected $_input_stream;
	
	protected $security;
	
	public function __construct(CI_Security &$security)
	{
		$this->security = $security;
		log_message('info', 'Input Class Initialized');
	}
	
	protected function _fetch_from_array(&$array, $index = NULL, $xss_clean = FALSE)
	{
		// If $index is NULL, it means that the whole $array is requested
		isset($index) OR $index = array_keys($array);
		// allow fetching multiple keys at once
		if (is_array($index))
		{
			$output = array();
			foreach ($index as $key)
			{
				$output[$key] = $this->_fetch_from_array($array, $key, $xss_clean);
			}
			return $output;
		}
		if (isset($array[$index]))
		{
			$value = $array[$index];
		}
		elseif (($count = preg_match_all('/(?:^[^\[]+)|\[[^]]*\]/', $index, $matches)) > 1) // Does the index contain array notation
		{
			$value = $array;
			for ($i = 0; $i < $count; $i++)
			{
				$key = trim($matches[0][$i], '[]');
				if ($key === '') // Empty notation will return the value as array
				{
					break;
				}
				if (isset($value[$key]))
				{
					$value = $value[$key];
				}
				else
				{
					return NULL;
				}
			}
		}
		else
		{
			return NULL;
		}
		return ($xss_clean === TRUE)
			? $this->security->xss_clean($value)
			: $value;
	}
	
	public function get($index = NULL, $xss_clean = FALSE)
	{
		return $this->_fetch_from_array($_GET, $index, $xss_clean);
	}
	
	public function post($index = NULL, $xss_clean = FALSE)
	{
		return $this->_fetch_from_array($_POST, $index, $xss_clean);
	}
	
	public function post_get($index, $xss_clean = FALSE)
	{
		return isset($_POST[$index])
			? $this->post($index, $xss_clean)
			: $this->get($index, $xss_clean);
	}
	
	public function get_post($index, $xss_clean = FALSE)
	{
		return isset($_GET[$index])
			? $this->get($index, $xss_clean)
			: $this->post($index, $xss_clean);
	}
	
	public function cookie($index = NULL, $xss_clean = FALSE)
	{
		return $this->_fetch_from_array($_COOKIE, $index, $xss_clean);
	}
	
	public function server($index, $xss_clean = FALSE)
	{
		return $this->_fetch_from_array($_SERVER, $index, $xss_clean);
	}
	
	public function input_stream($index = NULL, $xss_clean = FALSE)
	{
		// Prior to PHP 5.6, the input stream can only be read once,
		// so we'll need to check if we have already done that first.
		if ( ! is_array($this->_input_stream))
		{
			// $this->raw_input_stream will trigger __get().
			parse_str($this->raw_input_stream, $this->_input_stream);
			is_array($this->_input_stream) OR $this->_input_stream = array();
		}
		return $this->_fetch_from_array($this->_input_stream, $index, $xss_clean);
	}
	
	public function set_cookie($name, $value = '', $expire = 0, $domain = '', $path = '/', $prefix = '', $secure = NULL, $httponly = NULL)
	{
		if (is_array($name))
		{
			// always leave 'name' in last place, as the loop will break otherwise, due to $$item
			foreach (array('value', 'expire', 'domain', 'path', 'prefix', 'secure', 'httponly', 'name') as $item)
			{
				if (isset($name[$item]))
				{
					$$item = $name[$item];
				}
			}
		}
		if ($prefix === '' && config_item('cookie_prefix') !== '')
		{
			$prefix = config_item('cookie_prefix');
		}
		if ($domain == '' && config_item('cookie_domain') != '')
		{
			$domain = config_item('cookie_domain');
		}
		if ($path === '/' && config_item('cookie_path') !== '/')
		{
			$path = config_item('cookie_path');
		}
		$secure = ($secure === NULL && config_item('cookie_secure') !== NULL)
			? (bool) config_item('cookie_secure')
			: (bool) $secure;
		$httponly = ($httponly === NULL && config_item('cookie_httponly') !== NULL)
			? (bool) config_item('cookie_httponly')
			: (bool) $httponly;
		if ( ! is_numeric($expire) OR $expire < 0)
		{
			$expire = 1;
		}
		else
		{
			$expire = ($expire > 0) ? time() + $expire : 0;
		}
		setcookie($prefix.$name, $value, $expire, $path, $domain, $secure, $httponly);
	}
	
	public function ip_address()
	{
		if ($this->ip_address !== FALSE)
		{
			return $this->ip_address;
		}
		$proxy_ips = config_item('proxy_ips');
		if ( ! empty($proxy_ips) && ! is_array($proxy_ips))
		{
			$proxy_ips = explode(',', str_replace(' ', '', $proxy_ips));
		}
		$this->ip_address = $this->server('REMOTE_ADDR');
		if ($proxy_ips)
		{
			foreach (array('HTTP_X_FORWARDED_FOR', 'HTTP_CLIENT_IP', 'HTTP_X_CLIENT_IP', 'HTTP_X_CLUSTER_CLIENT_IP') as $header)
			{
				if (($spoof = $this->server($header)) !== NULL)
				{
					
					sscanf($spoof, '%[^,]', $spoof);
					if ( ! $this->valid_ip($spoof))
					{
						$spoof = NULL;
					}
					else
					{
						break;
					}
				}
			}
			if ($spoof)
			{
				for ($i = 0, $c = count($proxy_ips); $i < $c; $i++)
				{
					// Check if we have an IP address or a subnet
					if (strpos($proxy_ips[$i], '/') === FALSE)
					{
						// An IP address (and not a subnet) is specified.
						// We can compare right away.
						if ($proxy_ips[$i] === $this->ip_address)
						{
							$this->ip_address = $spoof;
							break;
						}
						continue;
					}
					// We have a subnet ... now the heavy lifting begins
					isset($separator) OR $separator = $this->valid_ip($this->ip_address, 'ipv6') ? ':' : '.';
					// If the proxy entry doesn't match the IP protocol - skip it
					if (strpos($proxy_ips[$i], $separator) === FALSE)
					{
						continue;
					}
					// Convert the REMOTE_ADDR IP address to binary, if needed
					if ( ! isset($ip, $sprintf))
					{
						if ($separator === ':')
						{
							// Make sure we're have the "full" IPv6 format
							$ip = explode(':',
								str_replace('::',
									str_repeat(':', 9 - substr_count($this->ip_address, ':')),
									$this->ip_address
								)
							);
							for ($j = 0; $j < 8; $j++)
							{
								$ip[$j] = intval($ip[$j], 16);
							}
							$sprintf = '%016b%016b%016b%016b%016b%016b%016b%016b';
						}
						else
						{
							$ip = explode('.', $this->ip_address);
							$sprintf = '%08b%08b%08b%08b';
						}
						$ip = vsprintf($sprintf, $ip);
					}
					// Split the netmask length off the network address
					sscanf($proxy_ips[$i], '%[^/]/%d', $netaddr, $masklen);
					// Again, an IPv6 address is most likely in a compressed form
					if ($separator === ':')
					{
						$netaddr = explode(':', str_replace('::', str_repeat(':', 9 - substr_count($netaddr, ':')), $netaddr));
						for ($j = 0; $j < 8; $j++)
						{
							$netaddr[$j] = intval($netaddr[$j], 16);
						}
					}
					else
					{
						$netaddr = explode('.', $netaddr);
					}
					// Convert to binary and finally compare
					if (strncmp($ip, vsprintf($sprintf, $netaddr), $masklen) === 0)
					{
						$this->ip_address = $spoof;
						break;
					}
				}
			}
		}
		if ( ! $this->valid_ip($this->ip_address))
		{
			return $this->ip_address = '0.0.0.0';
		}
		return $this->ip_address;
	}
	
	public function valid_ip($ip, $which = '')
	{
		switch (strtolower($which))
		{
			case 'ipv4':
				$which = FILTER_FLAG_IPV4;
				break;
			case 'ipv6':
				$which = FILTER_FLAG_IPV6;
				break;
			default:
				$which = NULL;
				break;
		}
		return (bool) filter_var($ip, FILTER_VALIDATE_IP, $which);
	}
	
	public function user_agent($xss_clean = FALSE)
	{
		return $this->_fetch_from_array($_SERVER, 'HTTP_USER_AGENT', $xss_clean);
	}
	
	public function request_headers($xss_clean = FALSE)
	{
		// If header is already defined, return it immediately
		if ( ! empty($this->headers))
		{
			return $this->_fetch_from_array($this->headers, NULL, $xss_clean);
		}
		// In Apache, you can simply call apache_request_headers()
		if (function_exists('apache_request_headers'))
		{
			$this->headers = apache_request_headers();
		}
		else
		{
			isset($_SERVER['CONTENT_TYPE']) && $this->headers['Content-Type'] = $_SERVER['CONTENT_TYPE'];
			foreach ($_SERVER as $key => $val)
			{
				if (sscanf($key, 'HTTP_%s', $header) === 1)
				{
					// take SOME_HEADER and turn it into Some-Header
					$header = str_replace('_', ' ', strtolower($header));
					$header = str_replace(' ', '-', ucwords($header));
					$this->headers[$header] = $_SERVER[$key];
				}
			}
		}
		return $this->_fetch_from_array($this->headers, NULL, $xss_clean);
	}
	
	public function get_request_header($index, $xss_clean = FALSE)
	{
		static $headers;
		if ( ! isset($headers))
		{
			empty($this->headers) && $this->request_headers();
			foreach ($this->headers as $key => $value)
			{
				$headers[strtolower($key)] = $value;
			}
		}
		$index = strtolower($index);
		if ( ! isset($headers[$index]))
		{
			return NULL;
		}
		return ($xss_clean === TRUE)
			? $this->security->xss_clean($headers[$index])
			: $headers[$index];
	}
	
	public function is_ajax_request()
	{
		return ( ! empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest');
	}
	
	public function method($upper = FALSE)
	{
		return ($upper)
			? strtoupper($this->server('REQUEST_METHOD'))
			: strtolower($this->server('REQUEST_METHOD'));
	}
	
	public function __get($name)
	{
		if ($name === 'raw_input_stream')
		{
			isset($this->_raw_input_stream) OR $this->_raw_input_stream = file_get_contents('php://input');
			return $this->_raw_input_stream;
		}
		elseif ($name === 'ip_address')
		{
			return $this->ip_address;
		}
	}
}
`;


var d = new Date().getTime();
var ret = new Parser(lexical,Lexer.priority.LONG_FIRST,grammar,'script');

var result = ret.parse(str);
ret.destroy();
//console.log(result);
var d1 = new Date().getTime();
console.log(d1-d);
*/

//case 4 es5 https://people-mozilla.org/~jorendorff/es5.1-final.html

/*
 * Lexer part
 */
 

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
	{ lex_type : 'NullLiteral', lex_reg : /null/ },
	{ lex_type : 'BooleanLiteral', lex_reg : /(true|false)/ },
	{ lex_type : 'NumericLiteral', lex_reg : /((0|[1-9][0-9]*)\.[0-9]*((e|E)(\+|-)?[0-9]+)?|\.[0-9]+((e|E)(\+|-)?[0-9]+)?|(0|[1-9][0-9]*)((e|E)(\+|-)?[0-9]+)?|0(x|X)[0-9a-fA-F]+)/ },
	{ lex_type : 'StringLiteral', lex_reg : /("[^"]*"|'[^']*')/ }, //fixme not support escape sequence
	//{ lex_type : 'RegularExpressionLiteral', lex_reg : // },
	{ lex_type : "IGNORE", lex_reg : /(\s+|\/\/.*\n|\/\*(\n|.)*?\*\/)/ }
];

function simpleReduce() {
	return [].join.call([].filter.call(arguments,function(e){return e != 'GRAMMAR_EMPTY'}),' ');
}

function block(b) {
	this.parent_block = b;
	this.func_name = '';
	this.symbols = {};
	this.args = {};
}
var nickid = 1;

var blockpool = {'globalBlock' : new block(null)};

var firstPassCurBlock = blockpool['globalBlock'];


/*var grammar = {
	"IdentifierName" : ["Identifier | ReservedWord"],
	"ReservedWord" : ["break | do | instanceof | typeof | case | else | new | var | catch | finally | return | void | continue | for | switch | while | debugger | function | this | with | default | if | throw | delete | in | try | class | enum | extends | super | const | export | import | NullLiteral | BooleanLiteral"],
	"Literal" : ["NullLiteral | BooleanLiteral | NumericLiteral | StringLiteral"],
	"PrimaryExpression" : ["this | Identifier | Literal | ArrayLiteral | ObjectLiteral | '(' Expression )"],
	"ArrayLiteral" : ["'[' Elision ? ']' | '[' ElementList ']' | '[' ElementList ',' Elision ? ']'"],
	"ElementList" : ["Elision ? AssignmentExpression | ElementList ',' Elision ? AssignmentExpression"],
	"Elision" : ["',' | Elision ','"],
	"ObjectLiteral" : ["'{' '}' | '{' PropertyNameAndValueList '}' | '{' PropertyNameAndValueList  ',' '}'"],
	"PropertyNameAndValueList" : ["PropertyAssignment | PropertyNameAndValueList ',' PropertyAssignment"],
	"PropertyAssignment" : ["PropertyName ':' AssignmentExpression | get PropertyName '(' ')' '{' FunctionBody '}' | set PropertyName '(' PropertySetParameterList ')' '{' FunctionBody '}'"],
	"PropertyName" : ["IdentifierName | StringLiteral | NumericLiteral"],
	"PropertySetParameterList" : ["Identifier"],
	"MemberExpression" : ["PrimaryExpression | FunctionExpression | MemberExpression '[' Expression ']' | MemberExpression '.' IdentifierName | new MemberExpression Arguments"],
	"NewExpression" : ["MemberExpression | new NewExpression"],
	"CallExpression" : ["MemberExpression Arguments | CallExpression Arguments | CallExpression '[' Expression ']' | CallExpression '.' IdentifierName"],
	"Arguments" : ["'(' ')' | '(' ArgumentList ')'"],
	"ArgumentList" : ["AssignmentExpression | ArgumentList ',' AssignmentExpression"],
	"LeftHandSideExpression" : ["NewExpression | CallExpression"],
	"PostfixExpression" : ["LeftHandSideExpression | LeftHandSideExpression '++' | LeftHandSideExpression '--'"],
	"UnaryExpression" : ["PostfixExpression | delete UnaryExpression | void UnaryExpression | typeof UnaryExpression | '++' UnaryExpression | '--' UnaryExpression | '+' UnaryExpression | '-' UnaryExpression | '~' UnaryExpression | '!' UnaryExpression"],
	"MultiplicativeExpression" : ["UnaryExpression | MultiplicativeExpression '*' UnaryExpression | MultiplicativeExpression '/' UnaryExpression | MultiplicativeExpression '%' UnaryExpression"],
	"AdditiveExpression" : ["MultiplicativeExpression | AdditiveExpression '+' MultiplicativeExpression | AdditiveExpression '-' MultiplicativeExpression"],
	"ShiftExpression" : ["AdditiveExpression | ShiftExpression '<<' AdditiveExpression | ShiftExpression '>>' AdditiveExpression | ShiftExpression '>>>' AdditiveExpression"],
	"RelationalExpression" : ["ShiftExpression | RelationalExpression '<' ShiftExpression | RelationalExpression '>' ShiftExpression | RelationalExpression '<=' ShiftExpression | RelationalExpression '>=' ShiftExpression | RelationalExpression instanceof ShiftExpression | RelationalExpression in ShiftExpression"],
	"RelationalExpressionNoIn" : ["ShiftExpression | RelationalExpressionNoIn '<' ShiftExpression | RelationalExpressionNoIn '>' ShiftExpression | RelationalExpressionNoIn '<=' ShiftExpression | RelationalExpressionNoIn '>=' ShiftExpression | RelationalExpressionNoIn instanceof ShiftExpression"],
	"EqualityExpression" : ["RelationalExpression | EqualityExpression '==' RelationalExpression | EqualityExpression '!=' RelationalExpression | EqualityExpression '===' RelationalExpression | EqualityExpression '!==' RelationalExpression"],
	"EqualityExpressionNoIn" : ["RelationalExpressionNoIn | EqualityExpressionNoIn '==' RelationalExpressionNoIn | EqualityExpressionNoIn '!=' RelationalExpressionNoIn | EqualityExpressionNoIn '===' RelationalExpressionNoIn | EqualityExpressionNoIn '!==' RelationalExpressionNoIn"],
	"BitwiseANDExpression" : ["EqualityExpression | BitwiseANDExpression '&' EqualityExpression"],
	"BitwiseANDExpressionNoIn" : ["EqualityExpressionNoIn | BitwiseANDExpressionNoIn '&' EqualityExpressionNoIn"],
	"BitwiseXORExpression" : ["BitwiseANDExpression | BitwiseXORExpression '^' BitwiseANDExpression"],
	"BitwiseXORExpressionNoIn" : ["BitwiseANDExpressionNoIn | BitwiseXORExpressionNoIn '^' BitwiseANDExpressionNoIn"],
	"BitwiseORExpression" : ["BitwiseXORExpression | BitwiseORExpression '|' BitwiseXORExpression"],
	"BitwiseORExpressionNoIn" : ["BitwiseXORExpressionNoIn | BitwiseORExpressionNoIn '|' BitwiseXORExpressionNoIn"],
	"LogicalANDExpression" : ["BitwiseORExpression | LogicalANDExpression '&&' BitwiseORExpression"],
	"LogicalANDExpressionNoIn" : ["BitwiseORExpressionNoIn | LogicalANDExpressionNoIn '&&' BitwiseORExpressionNoIn"],
	"LogicalORExpression" : ["LogicalANDExpression | LogicalORExpression '||' LogicalANDExpression"],
	"LogicalORExpressionNoIn" : ["LogicalANDExpressionNoIn | LogicalORExpressionNoIn '||' LogicalANDExpressionNoIn"],
	"ConditionalExpression" : ["LogicalORExpression | LogicalORExpression '?' AssignmentExpression ':' AssignmentExpression"],
	"ConditionalExpressionNoIn" : ["LogicalORExpressionNoIn | LogicalORExpressionNoIn '?' AssignmentExpression ':' AssignmentExpressionNoIn"],
	"AssignmentExpression" : ["ConditionalExpression | LeftHandSideExpression '=' AssignmentExpression | LeftHandSideExpression AssignmentOperator AssignmentExpression"],
	"AssignmentExpressionNoIn" : ["ConditionalExpressionNoIn | LeftHandSideExpression '=' AssignmentExpressionNoIn | LeftHandSideExpression AssignmentOperator AssignmentExpressionNoIn"],
	"AssignmentOperator" : ["'*=' | '/=' | '%=' | '+=' | '-=' | '<<=' | '>>=' | '>>>=' | '&=' | '^=' | '|='"],
	"Expression" : ["AssignmentExpression | Expression ',' AssignmentExpression"],
	"ExpressionNoIn" : ["AssignmentExpressionNoIn | ExpressionNoIn ',' AssignmentExpressionNoIn"],
	"Statement" : ["Block | VariableStatement | EmptyStatement | ExpressionStatement | IfStatement | IterationStatement | ContinueStatement | BreakStatement | ReturnStatement | WithStatement | LabelledStatement | SwitchStatement | ThrowStatement | TryStatement | DebuggerStatement"],
	"Block" : ["'{' StatementList ? '}'"],
	"StatementList" : ["Statement | StatementList Statement"],
	"VariableStatement" : ["var VariableDeclarationList ';'",
	function(s,vlist) {
		vlist.forEach(function(v) {
			firstPassCurBlock.symbols[v] = '__INIT__';
		});
	}],
	"VariableDeclarationList" : ["VariableDeclaration | VariableDeclarationList ',' VariableDeclaration",[
	function(v) {
		return [v];
	},
	function(vlist,q,v) {
		vlist.push(v);
		return vlist;
	}
	]],
	"VariableDeclarationListNoIn" : ["VariableDeclarationNoIn | VariableDeclarationListNoIn ',' VariableDeclarationNoIn"],
	"VariableDeclaration" : ["Identifier Initialiser ?",
	function(id,init){
		return id;
	}],
	"VariableDeclarationNoIn" : ["Identifier InitialiserNoIn ?"],
	"Initialiser" : ["'=' AssignmentExpression",function(assi,exp){return [assi,exp];}],
	"InitialiserNoIn" : ["'=' AssignmentExpressionNoIn"],
	"EmptyStatement" : ["';'"],
	"ExpressionStatement" : ["Expression ';'"], //fixme : ExpressionStatement : [lookahead ∉ {{, function}] Expression ;
	"IfStatement" : ["if '(' Expression ')' Statement else Statement | if '(' Expression ')' Statement"],
	"IterationStatement" : ["do Statement while '(' Expression ')' ';' | while '(' Expression ')' Statement | for '(' ExpressionNoIn ? ';' Expression ? ';' Expression ? ')' Statement | for '(' var VariableDeclarationListNoIn ';' Expression ? ';' Expression ? ')' Statement | for '(' LeftHandSideExpression in Expression ')' Statement | for '(' var VariableDeclarationNoIn in Expression ')' Statement"],
	"ContinueStatement" : ["continue ';' | continue Identifier ';'"],
	"BreakStatement" : ["break ';' | break Identifier ';'"],
	"ReturnStatement" : ["return ';' | return Expression ';'"],
	"WithStatement" : ["with '(' Expression ')' Statement"],
	"SwitchStatement" : ["switch '(' Expression ')' CaseBlock"],
	"CaseBlock" : ["'{' CaseClauses ? '}' | '{' CaseClauses ? DefaultClause CaseClauses ? '}'"],
	"CaseClauses" : ["CaseClause | CaseClauses CaseClause"],
	"CaseClause" : ["case Expression ':' StatementList ?"],
	"DefaultClause" : ["default ':' StatementList ?"],
	"LabelledStatement" : ["Identifier ':' Statement"],
	"ThrowStatement" : ["throw Expression ';'"],
	"TryStatement" : ["try Block Catch | try Block Finally | try Block Catch Finally"],
	"Catch" : ["catch '(' Identifier ')' Block"],
	"Finally" : ["finally Block"],
	"DebuggerStatement" : ["debugger ';'"],
	"FuncDef" : ["function",
	function(p){
		var blk = new block(firstPassCurBlock);
		firstPassCurBlock = blk;
		return p;
	}],
	"FunctionDeclaration" : ["FuncDef Identifier '(' FormalParameterList ? ')' '{' FunctionBody '}'",
	function(funcdef, id, lq, flist, rq, lbq, fb, rbq) {
		blockpool[id] = firstPassCurBlock;
		console.log(flist,111)
		if(flist !== 'GRAMMAR_EMPTY') {
			flist.forEach(function(p) {
				firstPassCurBlock.args[p] = '__INIT__';
			});
		}
		firstPassCurBlock.parent_block.symbols[id] = '__INIT__';
		firstPassCurBlock.func_name = id;
		firstPassCurBlock = firstPassCurBlock.parent_block;
	}],
	"FunctionExpression" : ["FuncDef Identifier ? '(' FormalParameterList ? ')' '{' FunctionBody '}'"],
	"FormalParameterList" : ["Identifier | FormalParameterList ',' Identifier",
	[
		function(id) {
			return [id];
		},
		function(flist,id) {
			flist.push(id);
			return flist;
		}
	]],
	"FunctionBody" : ["SourceElements ?"],
	"Program" : ["SourceElements ?"],
	"SourceElements" : ["SourceElement | SourceElements SourceElement"],
	"SourceElement" : ["Statement | FunctionDeclaration"],
};*/

var grammar = {
	"IdentifierName" : ["Identifier | ReservedWord"],
	"ReservedWord" : ["break | do | instanceof | typeof | case | else | new | var | catch | finally | return | void | continue | for | switch | while | debugger | function | this | with | default | if | throw | delete | in | try | class | enum | extends | super | const | export | import | NullLiteral | BooleanLiteral"],
	"Literal" : ["NullLiteral | BooleanLiteral | NumericLiteral | StringLiteral"],
	"PrimaryExpression" : ["this | Identifier | Literal | ArrayLiteral | ObjectLiteral | '(' Expression ')'"],
	"ArrayLiteral" : ["'[' Elision ? ']' | '[' ElementList ']' | '[' ElementList ',' Elision ? ']'"],
	"ElementList" : ["Elision ? AssignmentExpression | ElementList ',' Elision ? AssignmentExpression"],
	"Elision" : ["',' | Elision ','"],
	"ObjectLiteral" : ["'{' '}' | '{' PropertyNameAndValueList '}' | '{' PropertyNameAndValueList  ',' '}'"],
	"PropertyNameAndValueList" : ["PropertyAssignment | PropertyNameAndValueList ',' PropertyAssignment"],
	"PropertyAssignment" : ["PropertyName ':' AssignmentExpression | get PropertyName '(' ')' '{' FunctionBody '}' | set PropertyName '(' PropertySetParameterList ')' '{' FunctionBody '}'"],
	"PropertyName" : ["IdentifierName | StringLiteral | NumericLiteral"],
	"PropertySetParameterList" : ["Identifier"],
	"MemberExpression" : ["PrimaryExpression | FunctionExpression | MemberExpression '[' Expression ']' | MemberExpression '.' IdentifierName | new MemberExpression Arguments"],
	"NewExpression" : ["MemberExpression | new NewExpression"],
	"CallExpression" : ["MemberExpression Arguments | CallExpression Arguments | CallExpression '[' Expression ']' | CallExpression '.' IdentifierName"],
	"Arguments" : ["'(' ')' | '(' ArgumentList ')'"],
	"ArgumentList" : ["AssignmentExpression | ArgumentList ',' AssignmentExpression"],
	"LeftHandSideExpression" : ["NewExpression | CallExpression"],
	"PostfixExpression" : ["LeftHandSideExpression | LeftHandSideExpression '++' | LeftHandSideExpression '--'"],
	"UnaryExpression" : ["PostfixExpression | delete UnaryExpression | void UnaryExpression | typeof UnaryExpression | '++' UnaryExpression | '--' UnaryExpression | '+' UnaryExpression | '-' UnaryExpression | '~' UnaryExpression | '!' UnaryExpression"],
	"MultiplicativeExpression" : ["UnaryExpression | MultiplicativeExpression '*' UnaryExpression | MultiplicativeExpression '/' UnaryExpression | MultiplicativeExpression '%' UnaryExpression"],
	"AdditiveExpression" : ["MultiplicativeExpression | AdditiveExpression '+' MultiplicativeExpression | AdditiveExpression '-' MultiplicativeExpression"],
	"ShiftExpression" : ["AdditiveExpression | ShiftExpression '<<' AdditiveExpression | ShiftExpression '>>' AdditiveExpression | ShiftExpression '>>>' AdditiveExpression"],
	"RelationalExpression" : ["ShiftExpression | RelationalExpression '<' ShiftExpression | RelationalExpression '>' ShiftExpression | RelationalExpression '<=' ShiftExpression | RelationalExpression '>=' ShiftExpression | RelationalExpression instanceof ShiftExpression | RelationalExpression in ShiftExpression"],
	"RelationalExpressionNoIn" : ["ShiftExpression | RelationalExpressionNoIn '<' ShiftExpression | RelationalExpressionNoIn '>' ShiftExpression | RelationalExpressionNoIn '<=' ShiftExpression | RelationalExpressionNoIn '>=' ShiftExpression | RelationalExpressionNoIn instanceof ShiftExpression"],
	"EqualityExpression" : ["RelationalExpression | EqualityExpression '==' RelationalExpression | EqualityExpression '!=' RelationalExpression | EqualityExpression '===' RelationalExpression | EqualityExpression '!==' RelationalExpression"],
	"EqualityExpressionNoIn" : ["RelationalExpressionNoIn | EqualityExpressionNoIn '==' RelationalExpressionNoIn | EqualityExpressionNoIn '!=' RelationalExpressionNoIn | EqualityExpressionNoIn '===' RelationalExpressionNoIn | EqualityExpressionNoIn '!==' RelationalExpressionNoIn"],
	"BitwiseANDExpression" : ["EqualityExpression | BitwiseANDExpression '&' EqualityExpression"],
	"BitwiseANDExpressionNoIn" : ["EqualityExpressionNoIn | BitwiseANDExpressionNoIn '&' EqualityExpressionNoIn"],
	"BitwiseXORExpression" : ["BitwiseANDExpression | BitwiseXORExpression '^' BitwiseANDExpression"],
	"BitwiseXORExpressionNoIn" : ["BitwiseANDExpressionNoIn | BitwiseXORExpressionNoIn '^' BitwiseANDExpressionNoIn"],
	"BitwiseORExpression" : ["BitwiseXORExpression | BitwiseORExpression '|' BitwiseXORExpression"],
	"BitwiseORExpressionNoIn" : ["BitwiseXORExpressionNoIn | BitwiseORExpressionNoIn '|' BitwiseXORExpressionNoIn"],
	"LogicalANDExpression" : ["BitwiseORExpression | LogicalANDExpression '&&' BitwiseORExpression"],
	"LogicalANDExpressionNoIn" : ["BitwiseORExpressionNoIn | LogicalANDExpressionNoIn '&&' BitwiseORExpressionNoIn"],
	"LogicalORExpression" : ["LogicalANDExpression | LogicalORExpression '||' LogicalANDExpression"],
	"LogicalORExpressionNoIn" : ["LogicalANDExpressionNoIn | LogicalORExpressionNoIn '||' LogicalANDExpressionNoIn"],
	"ConditionalExpression" : ["LogicalORExpression | LogicalORExpression '?' AssignmentExpression ':' AssignmentExpression"],
	"ConditionalExpressionNoIn" : ["LogicalORExpressionNoIn | LogicalORExpressionNoIn '?' AssignmentExpression ':' AssignmentExpressionNoIn"],
	"AssignmentExpression" : ["ConditionalExpression | LeftHandSideExpression '=' AssignmentExpression | LeftHandSideExpression AssignmentOperator AssignmentExpression"],
	"AssignmentExpressionNoIn" : ["ConditionalExpressionNoIn | LeftHandSideExpression '=' AssignmentExpressionNoIn | LeftHandSideExpression AssignmentOperator AssignmentExpressionNoIn"],
	"AssignmentOperator" : ["'*=' | '/=' | '%=' | '+=' | '-=' | '<<=' | '>>=' | '>>>=' | '&=' | '^=' | '|='"],
	"Expression" : ["AssignmentExpression | Expression ',' AssignmentExpression"],
	"ExpressionNoIn" : ["AssignmentExpressionNoIn | ExpressionNoIn ',' AssignmentExpressionNoIn"],
	"Statement" : ["Block | VariableStatement | EmptyStatement | ExpressionStatement | IfStatement | IterationStatement | ContinueStatement | BreakStatement | ReturnStatement | WithStatement | LabelledStatement | SwitchStatement | ThrowStatement | TryStatement | DebuggerStatement",
    function(a){
        return a+'\n'
    }],
	"Block" : ["'{' StatementList ? '}'",[function(lq,slist,rq){
        if(slist == 'GRAMMAR_EMPTY') {
            return lq+rq;
        } else {
            nslist = []
            slist = slist.split('\n')
            for(var i =0;i<slist.length;i++) {
                if(slist[i]) {
                    nslist.push('  '+slist[i])
                }
            }
            return lq+'\n'+nslist.join('\n')+'\n'+rq;
        }
    }]],
	"StatementList" : ["Statement | StatementList Statement"],
	"VariableStatement" : ["var VariableDeclarationList ';' ?",
	function(s,vlist,q) {
        if(q != "GRAMMAR_EMPTY") {
            return 'var '+vlist+q;
        } else {
            return 'var '+vlist;
        }
	}],
	"VariableDeclarationList" : ["VariableDeclaration | VariableDeclarationList ',' VariableDeclaration",[
	function(v) {
		return v;
	},
	function(vlist,q,v) {
		return vlist+','+v;
	}
	]],
	"VariableDeclarationListNoIn" : ["VariableDeclarationNoIn | VariableDeclarationListNoIn ',' VariableDeclarationNoIn"],
	"VariableDeclaration" : ["Identifier Initialiser ?",
	[function(id,init) {
        if(init == "GRAMMAR_EMPTY") {
            return id
        } else {
            return id + init;
        }
	}]],
	"VariableDeclarationNoIn" : ["Identifier InitialiserNoIn ?"],
	"Initialiser" : ["'=' AssignmentExpression",function(a,b){return a+b}],
	"InitialiserNoIn" : ["'=' AssignmentExpressionNoIn"],
	"EmptyStatement" : ["';'"],
	"ExpressionStatement" : ["Expression ';' ?",[function(a,b){
        if(b == "GRAMMAR_EMPTY") {
            return a
        } else {
            return a+b;
        }
    }]], //fixme : ExpressionStatement : [lookahead ∉ {{, function}] Expression ;
	"IfStatement" : ["if '(' Expression ')' Statement else Statement | if '(' Expression ')' Statement"],
	"IterationStatement" : ["do Statement while '(' Expression ')' ';' ? | while '(' Expression ')' Statement | for '(' ExpressionNoIn ? ';' Expression ? ';' Expression ? ')' Statement | for '(' var VariableDeclarationListNoIn ';' Expression ? ';' Expression ? ')' Statement | for '(' LeftHandSideExpression in Expression ')' Statement | for '(' var VariableDeclarationNoIn in Expression ')' Statement",[
        function(){
            return [].join.call(arguments,'')
        },
        function(){
            return [].join.call(arguments,'')
        },
        function(){
            return [].join.call(arguments,'')
        },
        function(forstr,lq,varstr,vd,semi1,e1,semi2,e2,rq,st){
            var s = forstr+lq+varstr+' '+vd+semi1;
            if(e1 != 'GRAMMAR_EMPTY') {
                s += e1;
            }
            s += semi2;
            if(e2 != 'GRAMMAR_EMPTY') {
                s += e2;
            }
            s += rq+st
            return s;
        },
        function(){
            return [].join.call(arguments,'')
        },
        function(forstr,lq,varstr,vd,instr,rq,e,st){
            return forstr+lq+varstr+' '+vd+' '+instr+' '+e+rq+st
        }
    ]],
	"ContinueStatement" : ["continue ';' ? | continue Identifier ';' ?"],
	"BreakStatement" : ["break ';' ? | break Identifier ';' ?"],
	"ReturnStatement" : ["return ';' ? | return Expression ';' ?",[
    function() {
      return "return;"
    },
    function(r,e,semi) {
      return r+" "+e+semi;
    }
  ]],
	"WithStatement" : ["with '(' Expression ')' Statement"],
	"SwitchStatement" : ["switch '(' Expression ')' CaseBlock"],
	"CaseBlock" : ["'{' CaseClauses ? '}' | '{' CaseClauses ? DefaultClause ? '}'",[
        function(lq,cc,rq) {
            if(cc == 'GRAMMAR_EMPTY') {
                return lq+rq
            } else {
                
                return lq+'\n'+format(cc)+'\n'+rq
            }
        },
        function(lq,cc1,dc,rq) {
            var s = lq+'\n'
            if(cc1 != 'GRAMMAR_EMPTY') {
                s += format(cc1)+'\n'
            }
            if(dc != "GRAMMAR_EMPTY") {
                s += format(dc)
            }
            s += '\n'+rq
            return s
        }
    ]],
	"CaseClauses" : ["CaseClause | CaseClauses CaseClause"],
	"CaseClause" : ["case Expression ':' StatementList ?",
    function(casestr,e,colon,st){
       var s = casestr+' '+e+' '+colon+'\n';
       if(st != "GRAMMAR_EMPTY") {
           s += format(st)
       }
       return s+'\n'
    }],
	"DefaultClause" : ["default ':' StatementList ?",
    function(d,colon,stlist){
        if(stlist == "GRAMMAR_EMPTY") {
            return d+colon;
        } else {
            return d+colon+'\n'+format(stlist)
        }
    }],
	"LabelledStatement" : ["Identifier ':' Statement"],
	"ThrowStatement" : ["throw Expression ';' ?"],
	"TryStatement" : ["try Block Catch | try Block Finally | try Block Catch Finally"],
	"Catch" : ["catch '(' Identifier ')' Block"],
	"Finally" : ["finally Block"],
	"DebuggerStatement" : ["debugger ';' ?"],
	"FuncDef" : ["function"],
	"FunctionDeclaration" : ["FuncDef Identifier '(' FormalParameterList ? ')' '{' FunctionBody '}'",
	function(funcdef, id, lq, flist, rq, lbq, fb, rbq) {
        fbs = fb.split('\n')
        nfbs = [];
        for(var i=0;i<fbs.length;i++) {
            if(fbs[i]) {
                nfbs.push('  '+fbs[i])
            }
        }
        fb = nfbs.join('\n')
        if(flist == "GRAMMAR_EMPTY") {
            return funcdef+' '+id+lq+rq+lbq+"\n"+fb+"\n"+rbq+'\n';
        } else {
            return funcdef+' '+id+lq+flist+rq+lbq+"\n"+fb+"\n"+rbq+'\n';
        }
	}],
	"FunctionExpression" : ["FuncDef Identifier ? '(' FormalParameterList ? ')' '{' FunctionBody '}'"],
	"FormalParameterList" : ["Identifier | FormalParameterList ',' Identifier",
	[
		function(id) {
			return id;
		},
		function(flist,comma,id) {
			return flist+comma+id;
		}
	]],
	"FunctionBody" : ["SourceElements ?",function(se){
        if(se == "GRAMMAR_EMPTY") {
            return ""
        } else {
            return se;
        }
    }],
	"Program" : ["SourceElements ?",function(a){
        return a;
    }],
	"SourceElements" : ["SourceElement | SourceElements SourceElement",
    [function(a){
        return a;
    },function(a,b){
        return a+b;
    }]],
	"SourceElement" : ["Statement | FunctionDeclaration"],
};

var str = `
function b(q) {
    var w=q,e=1
    var d=1
    function r() {
        console.log(111)
        console.log(111)
    }
}
function a(){
    if(true) {
        console.log(222);
        console.log(2223);
    }
    for(var i =0;i<10;i++) {
        console.log(i)
    }
    switch(a) {
        case 1:
            console.log(1);
            break;
        case 2:
            console.log(222);
            break;
        default: 
            console.log(333)
    }
    while(1) {
        var a = 1
        console.log(a)
    }
}
`
var p = new Parser(lexical,Lexer.priority.LONG_FIRST,grammar,'Program');
var ret = p.parse(str);
console.log(ret);
