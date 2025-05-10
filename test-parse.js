"use strict";
var _a;
exports.__esModule = true;
var parseMarkdown_1 = require("./parseMarkdown");
var fs = require("fs");
// コマンドライン引数からファイルパスを取得
var filePath = process.argv[2];
if (!filePath) {
    console.error('Please provide a markdown file path as an argument');
    process.exit(1);
}
// ファイルを読み込む
try {
    var markdown = fs.readFileSync(filePath, 'utf-8');
    var fileName = ((_a = filePath.split('/').pop()) === null || _a === void 0 ? void 0 : _a.replace(/\.[^/.]+$/, '')) || 'untitled';
    // parseMarkdown関数を実行
    var result = (0, parseMarkdown_1.parseMarkdown)(markdown, fileName);
    // 結果を出力
    console.log('Parse result:', JSON.stringify(result, null, 2));
}
catch (error) {
    console.error('Error:', error);
    process.exit(1);
}
