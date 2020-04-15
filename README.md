本项目（仍在完善中）旨在浏览器上提供一个运行javascript或其他语言的沙箱环境，在沙箱内提供的全局环境接口可由外部定义。

```javascript
var vm = new sandbox();
vm.set('console',console);
var str = `
var obj = {
    k: 1,
    c: 2
}
for(var k in obj) {
    console.log(k)
}
`
vm.run(str);
```