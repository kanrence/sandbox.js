const path = require('path')

let config = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, '../dist'), // 定义输出的目录
    filename: 'sandbox.js', // 定义输出文件名
    libraryTarget: 'umd', // 指定遵循的模块化规范
  }
};

if(process.env.NODE_ENV != 'production') {
  config['devtool'] = 'inline-source-map';
}

module.exports = config;