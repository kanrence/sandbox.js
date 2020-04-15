const path = require('path')

module.exports = {
  entry: './src/index.js',
  devtool: 'inline-source-map',
  output: {
    path: path.resolve(__dirname, '../dist'), // 定义输出的目录
    filename: 'sandbox.js', // 定义输出文件名
    //library: 'sandbox', // 定义暴露到浏览器环境的全局变量名称
    libraryTarget: 'umd', // 指定遵循的模块化规范
  }
};