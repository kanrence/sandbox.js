import Lexer from './lexer.js'

var debug = false;
function log() {
	if(debug) {
		console.log.apply(null,arguments);
	}
}

function reduceAsList() {
    if(arguments.length === 1) return arguments[0];
    var ret = [];
    for(var i = 0,len = arguments.length;i < len;i++) {
        ret[i] = arguments[i];
    }
    return ret;
}

function createNewSymbol(type,id) {
    return new Lexer.token(('privateSymbol'+id)+'_'+type,'GRAMMAR_SYM');
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
							newsymbol = createNewSymbol('group',privateSymbolid++);
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
							newsymbol = createNewSymbol('list',privateSymbolid++);
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
                            return arguments[0];
                            //return [].join.call(arguments,'')
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

export default Parser;