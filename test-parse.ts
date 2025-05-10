import { parseMarkdown } from './parseMarkdown.js';
import * as fs from 'fs';

// コマンドライン引数からファイルパスを取得
const filePath = process.argv[2];
if (!filePath) {
    console.error('Please provide a markdown file path as an argument');
    process.exit(1);
}

// ファイルを読み込む
try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = parseMarkdown(content);
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    console.error('Error reading or parsing file:', error);
    process.exit(1);
} 