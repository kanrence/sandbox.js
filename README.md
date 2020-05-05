本项目（仍在完善中）旨在浏览器上提供一个运行javascript或其他语言的沙箱环境，在沙箱内提供的全局环境接口可由外部定义。

```javascript
function hello() {
    console.log('helloworld,我在沙箱外')
}
var vm = new sandbox();
vm.set('hello',hello); //把hello函数设置到沙箱的全局变量hello上
vm.set('console',console) //把console设置到沙箱的全局变量console上

var code = `
function inner() {
    console.log("我在沙箱里面");
}
hello();
inner();
function callme(a) {
    return a+1;
}
var getme = "GETME";
`
vm.run(code);
console.log(vm.call("callme",null,[1])); // 2
console.log(vm.get("getme")); // GETME
```