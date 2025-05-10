"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.Md2JsonPlugin = exports.parseMarkdown = void 0;
var obsidian_1 = require("obsidian");
var DEFAULT_SETTINGS = {
    outputDirectory: 'json-output',
    bulkOutputDirectory: 'bulk-json-output'
};
// parseMarkdownを独立した関数として切り出す
function parseMarkdown(markdown, fileName) {
    var lines = markdown.split('\n');
    console.log('Markdown lines:', lines);
    // ファイル名からタイトルを生成
    var title = fileName.replace(/\.[^/.]+$/, ''); // 拡張子を除去
    console.log('Using filename as title:', title);
    var structure = {
        title: title,
        tags: [],
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        sections: [],
        plain_text: '',
        links: []
    };
    var sectionStack = [];
    var currentList = [];
    var plainTextParts = [];
    var currentParagraph = [];
    var consecutiveEmptyLines = 0;
    var lastHeadingLevel = 0;
    var lastHeadingText = '';
    var emptySectionsFound = false;
    var emptySections = [];
    // デバッグ用のブレークポイント
    debugger;
    // セクションの内容を保存する関数
    var saveCurrentContent = function () {
        // 現在の段落を保存
        if (currentParagraph.length > 0) {
            var paragraphText = currentParagraph.join(' ').trim();
            if (sectionStack.length > 0) {
                console.log('Adding paragraph to section:', paragraphText);
                sectionStack[sectionStack.length - 1].section.content.push({
                    type: 'paragraph',
                    text: paragraphText,
                    lineBreaks: consecutiveEmptyLines
                });
            }
            plainTextParts.push(paragraphText);
            currentParagraph = [];
        }
        // 現在のリストを保存
        if (currentList.length > 0 && sectionStack.length > 0) {
            console.log('Adding list to section:', currentList);
            sectionStack[sectionStack.length - 1].section.content.push({
                type: 'list',
                items: __spreadArray([], currentList, true)
            });
            currentList = [];
        }
    };
    // テンプレート構文を処理する関数
    var processTemplateSyntax = function (text) {
        // テンプレート構文を一時的なプレースホルダーに置き換え
        return text.replace(/<%[^%]+%>/g, '[TEMPLATE]');
    };
    // メタデータを解析する関数
    var parseMetadata = function (line) {
        var match = line.match(/^\*\*([^:]+):\*\*\s*(.+?)\s*$/);
        if (match) {
            return {
                key: match[1].toLowerCase(),
                value: match[2].trim()
            };
        }
        return null;
    };
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        console.log('Processing line:', line);
        // デバッグ用のブレークポイント
        debugger;
        // 空行の処理
        if (!line.trim()) {
            consecutiveEmptyLines++;
            saveCurrentContent();
            continue;
        }
        // 区切り線の処理
        if (line.trim() === '---') {
            console.log('Found horizontal rule');
            saveCurrentContent();
            if (sectionStack.length > 0) {
                sectionStack[sectionStack.length - 1].section.content.push({
                    type: 'paragraph',
                    text: '---',
                    lineBreaks: 0
                });
            }
            consecutiveEmptyLines = 0;
            continue;
        }
        // 見出しの解析
        var headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            console.log('Found heading:', headingMatch[2]);
            saveCurrentContent();
            var level = headingMatch[1].length;
            var headingText = processTemplateSyntax(headingMatch[2].trim());
            // デバッグ用のブレークポイント
            debugger;
            // 新しいセクションを作成
            var newSection = {
                heading: headingText,
                content: [],
                children: []
            };
            console.log('Creating new section:', headingText, 'level:', level);
            // スタックを適切なレベルまで戻す
            while (sectionStack.length > 0 && sectionStack[sectionStack.length - 1].level >= level) {
                console.log('Popping section from stack:', sectionStack[sectionStack.length - 1].section.heading);
                var poppedSection = sectionStack.pop();
                if (poppedSection && poppedSection.section.content.length === 0 && poppedSection.section.children.length === 0) {
                    console.warn("\u8B66\u544A: \u30D5\u30A1\u30A4\u30EB \"".concat(fileName, "\" \u3067\u7A7A\u306E\u30BB\u30AF\u30B7\u30E7\u30F3\u3092\u691C\u51FA\u3057\u307E\u3057\u305F: \"").concat(poppedSection.section.heading, "\" (\u30EC\u30D9\u30EB: ").concat(poppedSection.level, ")"));
                    emptySectionsFound = true;
                    emptySections.push({
                        heading: poppedSection.section.heading,
                        level: poppedSection.level
                    });
                    // 空のセクションに見出しのテキストを段落として追加
                    poppedSection.section.content.push({
                        type: 'paragraph',
                        text: poppedSection.section.heading,
                        lineBreaks: 0
                    });
                }
            }
            if (sectionStack.length === 0) {
                // ルートレベルの見出し
                console.log('Adding root level section:', headingText);
                structure.sections.push(newSection);
            }
            else {
                // 子セクションとして追加
                console.log('Adding child section to:', sectionStack[sectionStack.length - 1].section.heading);
                sectionStack[sectionStack.length - 1].section.children.push(newSection);
            }
            sectionStack.push({ level: level, section: newSection });
            lastHeadingLevel = level;
            lastHeadingText = headingText;
            plainTextParts.push(headingText);
            consecutiveEmptyLines = 0;
            continue;
        }
        // タグの解析
        var tagMatch = line.match(/#(\w+)/g);
        if (tagMatch) {
            console.log('Found tags:', tagMatch);
            tagMatch.forEach(function (tag) {
                var cleanTag = tag.replace('#', '');
                if (!structure.tags.includes(cleanTag)) {
                    structure.tags.push(cleanTag);
                }
            });
            // タグを現在のセクションのコンテンツとしても追加
            if (sectionStack.length > 0) {
                sectionStack[sectionStack.length - 1].section.content.push({
                    type: 'paragraph',
                    text: line.trim(),
                    lineBreaks: 0
                });
            }
            consecutiveEmptyLines = 0;
            continue;
        }
        // メタデータの解析
        var metadata = parseMetadata(line);
        if (metadata) {
            console.log('Found metadata:', metadata);
            if (metadata.key === 'created') {
                structure.created = metadata.value;
            }
            else if (metadata.key === 'updated') {
                structure.updated = metadata.value;
            }
            // メタデータを現在のセクションのコンテンツとしても追加
            if (sectionStack.length > 0) {
                sectionStack[sectionStack.length - 1].section.content.push({
                    type: 'paragraph',
                    text: line.trim(),
                    lineBreaks: 0
                });
            }
            consecutiveEmptyLines = 0;
            continue;
        }
        // リンクの解析
        var linkMatch = line.match(/^\[\[(.+?)\]\]$/);
        if (linkMatch) {
            console.log('Found link:', linkMatch[1]);
            var linkText = processTemplateSyntax(linkMatch[1]);
            structure.links.push({
                type: 'note',
                target: linkText
            });
            // リンクを現在のセクションのコンテンツとしても追加
            if (sectionStack.length > 0) {
                sectionStack[sectionStack.length - 1].section.content.push({
                    type: 'paragraph',
                    text: "[[".concat(linkText, "]]"),
                    lineBreaks: 0
                });
            }
            consecutiveEmptyLines = 0;
            continue;
        }
        // リストの解析
        var listMatch = line.match(/^[-*]\s+(.+)$/);
        if (listMatch) {
            console.log('Found list item:', listMatch[1]);
            var listItemText = processTemplateSyntax(listMatch[1].trim());
            currentList.push(listItemText);
            plainTextParts.push(listItemText);
            consecutiveEmptyLines = 0;
            continue;
        }
        // 段落の解析
        if (line.trim()) {
            console.log('Adding to current paragraph:', line);
            var processedLine = processTemplateSyntax(line.trim());
            currentParagraph.push(processedLine);
            consecutiveEmptyLines = 0;
        }
    }
    // 最後の内容を保存
    saveCurrentContent();
    // 空のセクションをチェックして修正
    var checkAndFixEmptySections = function (sections, level) {
        if (level === void 0) { level = 1; }
        for (var _i = 0, sections_1 = sections; _i < sections_1.length; _i++) {
            var section = sections_1[_i];
            if (section.content.length === 0 && section.children.length === 0) {
                console.warn("\u8B66\u544A: \u30D5\u30A1\u30A4\u30EB \"".concat(fileName, "\" \u3067\u7A7A\u306E\u30BB\u30AF\u30B7\u30E7\u30F3\u3092\u691C\u51FA\u3057\u307E\u3057\u305F: \"").concat(section.heading, "\" (\u30EC\u30D9\u30EB: ").concat(level, ")"));
                emptySectionsFound = true;
                emptySections.push({
                    heading: section.heading,
                    level: level
                });
                // 空のセクションに見出しのテキストを段落として追加
                section.content.push({
                    type: 'paragraph',
                    text: section.heading,
                    lineBreaks: 0
                });
            }
            if (section.children.length > 0) {
                checkAndFixEmptySections(section.children, level + 1);
            }
        }
    };
    checkAndFixEmptySections(structure.sections);
    // 空のセクションが見つかった場合、全体の警告を表示
    if (emptySectionsFound) {
        var warningMessage = "\u8B66\u544A: \u30D5\u30A1\u30A4\u30EB \"".concat(fileName, "\" \u3067 ").concat(emptySections.length, " \u500B\u306E\u7A7A\u306E\u30BB\u30AF\u30B7\u30E7\u30F3\u304C\u898B\u3064\u304B\u308A\u307E\u3057\u305F:\n") +
            emptySections.map(function (s) { return "- \"".concat(s.heading, "\" (\u30EC\u30D9\u30EB: ").concat(s.level, ")"); }).join('\n');
        console.warn(warningMessage);
        new obsidian_1.Notice(warningMessage);
    }
    // プレーンテキストを生成（改行なし）
    structure.plain_text = plainTextParts.join(' ');
    console.log('Final structure:', structure);
    return structure;
}
exports.parseMarkdown = parseMarkdown;
var Md2JsonPlugin = /** @class */ (function (_super) {
    __extends(Md2JsonPlugin, _super);
    function Md2JsonPlugin() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Md2JsonPlugin.prototype.onload = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadSettings()];
                    case 1:
                        _a.sent();
                        // Add a command to convert the current file to JSON
                        this.addCommand({
                            id: 'convert-current-to-json',
                            name: 'Convert current file to JSON',
                            callback: function () {
                                var activeView = _this.app.workspace.getActiveViewOfType(obsidian_1.MarkdownView);
                                if (activeView) {
                                    var file = activeView.file;
                                    if (file) {
                                        _this.convertToJson(file.basename, activeView.getViewData());
                                    }
                                }
                            }
                        });
                        // Add a command to convert all files to JSON
                        this.addCommand({
                            id: 'convert-all-to-json',
                            name: 'Convert all files to JSON',
                            callback: function () {
                                _this.convertAllFiles();
                            }
                        });
                        // Add a command to create Elasticsearch bulk file
                        this.addCommand({
                            id: 'create-elasticsearch-bulk',
                            name: 'Create Elasticsearch bulk file',
                            callback: function () {
                                _this.createElasticsearchBulkFile();
                            }
                        });
                        // Add a command to test parseMarkdown
                        this.addCommand({
                            id: 'test-parse-markdown',
                            name: 'Test parseMarkdown method',
                            callback: function () {
                                var activeView = _this.app.workspace.getActiveViewOfType(obsidian_1.MarkdownView);
                                if (activeView) {
                                    var file = activeView.file;
                                    if (file) {
                                        var markdown = activeView.getViewData();
                                        console.log('Testing parseMarkdown with file:', file.basename);
                                        var result = _this.parseMarkdown(markdown, file.basename);
                                        console.log('Parse result:', result);
                                        new obsidian_1.Notice("Parsed ".concat(file.basename, " successfully. Check console for details."));
                                    }
                                }
                            }
                        });
                        // Add context menu for files
                        this.registerEvent(this.app.workspace.on('file-menu', function (menu, file) {
                            if (file.extension === 'md') {
                                menu.addItem(function (item) {
                                    item
                                        .setTitle('Convert to JSON')
                                        .setIcon('file-code')
                                        .onClick(function () { return __awaiter(_this, void 0, void 0, function () {
                                        var content, err_1, error;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    _a.trys.push([0, 3, , 4]);
                                                    return [4 /*yield*/, this.app.vault.read(file)];
                                                case 1:
                                                    content = _a.sent();
                                                    return [4 /*yield*/, this.convertToJson(file.basename, content)];
                                                case 2:
                                                    _a.sent();
                                                    return [3 /*break*/, 4];
                                                case 3:
                                                    err_1 = _a.sent();
                                                    error = err_1;
                                                    console.error('Error:', error.message);
                                                    return [3 /*break*/, 4];
                                                case 4: return [2 /*return*/];
                                            }
                                        });
                                    }); });
                                });
                            }
                        }));
                        // Add settings tab
                        this.addSettingTab(new Md2JsonSettingTab(this.app, this));
                        // テスト用のコード
                        console.log('Plugin loaded!');
                        this.addCommand({
                            id: 'test-conversion',
                            name: 'Test JSON Conversion',
                            callback: function () {
                                var testMarkdown = "# Test Note\nThis is a test note with some **bold** and *italic* text.\n\n## Section 1\n- Item 1\n- Item 2\n\n## Section 2\n1. Numbered item 1\n2. Numbered item 2";
                                _this.convertToJson('test_note', testMarkdown);
                            }
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    Md2JsonPlugin.prototype.onunload = function () {
        console.log('Plugin unloaded!');
    };
    Md2JsonPlugin.prototype.loadSettings = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _a = this;
                        _c = (_b = Object).assign;
                        _d = [{}, DEFAULT_SETTINGS];
                        return [4 /*yield*/, this.loadData()];
                    case 1:
                        _a.settings = _c.apply(_b, _d.concat([_e.sent()]));
                        console.log('Settings loaded:', this.settings);
                        return [2 /*return*/];
                }
            });
        });
    };
    Md2JsonPlugin.prototype.saveSettings = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.saveData(this.settings)];
                    case 1:
                        _a.sent();
                        console.log('Settings saved:', this.settings);
                        return [2 /*return*/];
                }
            });
        });
    };
    // parseMarkdownメソッドを関数を呼び出すように変更
    Md2JsonPlugin.prototype.parseMarkdown = function (markdown, fileName) {
        return parseMarkdown(markdown, fileName);
    };
    Md2JsonPlugin.prototype.convertToJson = function (originalFileName, markdown) {
        return __awaiter(this, void 0, void 0, function () {
            var structure, jsonString, outputDir, fileName, filePath, existingFile, error_1, err_2, errorObj;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 10, , 11]);
                        console.log('Converting markdown to JSON...');
                        structure = this.parseMarkdown(markdown, originalFileName);
                        console.log('Parsed structure:', structure);
                        jsonString = JSON.stringify(structure);
                        console.log('Generated JSON:', jsonString);
                        outputDir = this.settings.outputDirectory;
                        if (!this.app.vault.getAbstractFileByPath(outputDir)) {
                            this.app.vault.createFolder(outputDir);
                            console.log('Created output directory:', outputDir);
                        }
                        fileName = "".concat(originalFileName, ".json");
                        filePath = "".concat(outputDir, "/").concat(fileName);
                        existingFile = this.app.vault.getAbstractFileByPath(filePath);
                        if (!(existingFile instanceof obsidian_1.TFile)) return [3 /*break*/, 7];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 6]);
                        // 既存のファイルを上書き
                        return [4 /*yield*/, this.app.vault.modify(existingFile, jsonString)];
                    case 2:
                        // 既存のファイルを上書き
                        _a.sent();
                        console.log('Updated existing JSON file:', fileName);
                        return [2 /*return*/, { fileName: fileName, isNew: false }];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Error updating file:', error_1);
                        // 上書きに失敗した場合は、ファイルを削除して新規作成
                        return [4 /*yield*/, this.app.vault["delete"](existingFile)];
                    case 4:
                        // 上書きに失敗した場合は、ファイルを削除して新規作成
                        _a.sent();
                        return [4 /*yield*/, this.app.vault.create(filePath, jsonString)];
                    case 5:
                        _a.sent();
                        console.log('Recreated JSON file:', fileName);
                        return [2 /*return*/, { fileName: fileName, isNew: false }];
                    case 6: return [3 /*break*/, 9];
                    case 7: 
                    // 新規ファイルを作成
                    return [4 /*yield*/, this.app.vault.create(filePath, jsonString)];
                    case 8:
                        // 新規ファイルを作成
                        _a.sent();
                        console.log('Created new JSON file:', fileName);
                        return [2 /*return*/, { fileName: fileName, isNew: true }];
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        err_2 = _a.sent();
                        errorObj = err_2;
                        console.error('Error:', errorObj.message);
                        new obsidian_1.Notice('Error converting file to JSON: ' + errorObj.message);
                        return [2 /*return*/, null];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    Md2JsonPlugin.prototype.convertAllFiles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var files, convertedFiles, _i, files_1, file, content, result, newFiles, updatedFiles, message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('Converting all files...');
                        files = this.app.vault.getMarkdownFiles();
                        console.log('Found markdown files:', files.length);
                        convertedFiles = [];
                        _i = 0, files_1 = files;
                        _a.label = 1;
                    case 1:
                        if (!(_i < files_1.length)) return [3 /*break*/, 5];
                        file = files_1[_i];
                        return [4 /*yield*/, this.app.vault.read(file)];
                    case 2:
                        content = _a.sent();
                        return [4 /*yield*/, this.convertToJson(file.basename, content)];
                    case 3:
                        result = _a.sent();
                        if (result) {
                            convertedFiles.push(result);
                        }
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 1];
                    case 5:
                        if (convertedFiles.length > 0) {
                            newFiles = convertedFiles.filter(function (f) { return f.isNew; });
                            updatedFiles = convertedFiles.filter(function (f) { return !f.isNew; });
                            message = "Converted ".concat(convertedFiles.length, " files to JSON:\n");
                            if (newFiles.length > 0) {
                                message += "\nNew files:\n".concat(newFiles.map(function (f) { return f.fileName; }).join('\n'));
                            }
                            if (updatedFiles.length > 0) {
                                message += "\nUpdated files:\n".concat(updatedFiles.map(function (f) { return f.fileName; }).join('\n'));
                            }
                            new obsidian_1.Notice(message, 5000); // 5秒間表示
                        }
                        else {
                            new obsidian_1.Notice('No files were converted.');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    Md2JsonPlugin.prototype.createElasticsearchBulkFile = function () {
        return __awaiter(this, void 0, void 0, function () {
            var inputDir_1, outputDir, jsonFiles, indexName, timestamp, BATCH_SIZE, i, batchFiles, bulkContent, _loop_1, this_1, _i, batchFiles_1, file, batchNumber, bulkFileName, bulkFilePath, err_3, errorObj;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 9, , 10]);
                        inputDir_1 = this.settings.outputDirectory;
                        outputDir = this.settings.bulkOutputDirectory;
                        jsonFiles = this.app.vault.getFiles().filter(function (file) {
                            return file.extension === 'json' &&
                                file.path.startsWith(inputDir_1 + '/');
                        });
                        if (jsonFiles.length === 0) {
                            new obsidian_1.Notice('No JSON files found in the input directory.');
                            return [2 /*return*/];
                        }
                        // Create bulk output directory if it doesn't exist
                        if (!this.app.vault.getAbstractFileByPath(outputDir)) {
                            this.app.vault.createFolder(outputDir);
                            console.log('Created bulk output directory:', outputDir);
                        }
                        indexName = 'obsidian_notes';
                        timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                        BATCH_SIZE = 100;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < jsonFiles.length)) return [3 /*break*/, 8];
                        batchFiles = jsonFiles.slice(i, i + BATCH_SIZE);
                        bulkContent = [];
                        _loop_1 = function (file) {
                            var content, docId, doc, processValue_1, processedDoc, jsonString, fileError_1;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _b.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, this_1.app.vault.read(file)];
                                    case 1:
                                        content = _b.sent();
                                        docId = file.basename;
                                        // Add the index action (metadata line)
                                        bulkContent.push(JSON.stringify({
                                            index: {
                                                _index: indexName,
                                                _id: docId
                                            }
                                        }));
                                        doc = void 0;
                                        try {
                                            doc = JSON.parse(content);
                                        }
                                        catch (parseError) {
                                            console.error("Error parsing JSON file ".concat(file.path, ":"), parseError);
                                            return [2 /*return*/, "continue"];
                                        }
                                        processValue_1 = function (value) {
                                            try {
                                                if (typeof value === 'string') {
                                                    return value.replace(/[\n\r]+/g, ' ').trim();
                                                }
                                                else if (Array.isArray(value)) {
                                                    return value.map(processValue_1);
                                                }
                                                else if (value && typeof value === 'object') {
                                                    var result = {};
                                                    for (var key in value) {
                                                        if (Object.prototype.hasOwnProperty.call(value, key)) {
                                                            result[key] = processValue_1(value[key]);
                                                        }
                                                    }
                                                    return result;
                                                }
                                                return value;
                                            }
                                            catch (error) {
                                                console.error('Error processing value:', error);
                                                return value;
                                            }
                                        };
                                        processedDoc = processValue_1(doc);
                                        jsonString = JSON.stringify(processedDoc);
                                        if (jsonString.includes('\n')) {
                                            console.warn("Warning: JSON string still contains newlines for file ".concat(file.path));
                                        }
                                        bulkContent.push(jsonString);
                                        return [3 /*break*/, 3];
                                    case 2:
                                        fileError_1 = _b.sent();
                                        console.error("Error processing file ".concat(file.path, ":"), fileError_1);
                                        return [2 /*return*/, "continue"];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, batchFiles_1 = batchFiles;
                        _a.label = 2;
                    case 2:
                        if (!(_i < batchFiles_1.length)) return [3 /*break*/, 5];
                        file = batchFiles_1[_i];
                        return [5 /*yield**/, _loop_1(file)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        if (bulkContent.length === 0) {
                            console.warn("No valid JSON files were processed in batch ".concat(i / BATCH_SIZE + 1));
                            return [3 /*break*/, 7];
                        }
                        batchNumber = Math.floor(i / BATCH_SIZE) + 1;
                        bulkFileName = "elasticsearch_bulk_".concat(timestamp, "_batch").concat(batchNumber, ".json");
                        bulkFilePath = "".concat(outputDir, "/").concat(bulkFileName);
                        return [4 /*yield*/, this.app.vault.create(bulkFilePath, bulkContent.join('\n') + '\n')];
                    case 6:
                        _a.sent();
                        console.log("Created Elasticsearch bulk file for batch ".concat(batchNumber, ": ").concat(bulkFileName));
                        _a.label = 7;
                    case 7:
                        i += BATCH_SIZE;
                        return [3 /*break*/, 1];
                    case 8:
                        new obsidian_1.Notice("Created Elasticsearch bulk files with timestamp: ".concat(timestamp));
                        return [3 /*break*/, 10];
                    case 9:
                        err_3 = _a.sent();
                        errorObj = err_3;
                        console.error('Error:', errorObj.message);
                        new obsidian_1.Notice('Error creating Elasticsearch bulk file: ' + errorObj.message);
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    // マークダウンに戻すためのメソッドを追加
    Md2JsonPlugin.prototype.convertToMarkdown = function (structure) {
        var lines = [];
        // タイトルを追加
        lines.push("# ".concat(structure.title));
        lines.push('');
        // タグを追加
        if (structure.tags.length > 0) {
            structure.tags.forEach(function (tag) { return lines.push("#".concat(tag)); });
            lines.push('');
        }
        // セクションを再帰的に処理
        var processSection = function (section, level) {
            if (level === void 0) { level = 1; }
            // 見出しを追加
            lines.push("".concat('#'.repeat(level + 1), " ").concat(section.heading));
            lines.push('');
            // コンテンツを追加
            section.content.forEach(function (item) {
                if (item.type === 'paragraph' && item.text) {
                    lines.push(item.text);
                    // 改行を追加
                    if (item.lineBreaks) {
                        for (var i = 0; i < item.lineBreaks; i++) {
                            lines.push('');
                        }
                    }
                }
                else if (item.type === 'list' && item.items) {
                    item.items.forEach(function (item) { return lines.push("- ".concat(item)); });
                    lines.push('');
                }
            });
            // 子セクションを処理
            section.children.forEach(function (child) { return processSection(child, level + 1); });
        };
        // ルートセクションを処理
        structure.sections.forEach(function (section) { return processSection(section); });
        return lines.join('\n');
    };
    return Md2JsonPlugin;
}(obsidian_1.Plugin));
exports.Md2JsonPlugin = Md2JsonPlugin;
var Md2JsonSettingTab = /** @class */ (function (_super) {
    __extends(Md2JsonSettingTab, _super);
    function Md2JsonSettingTab(app, plugin) {
        var _this = _super.call(this, app, plugin) || this;
        _this.plugin = plugin;
        return _this;
    }
    Md2JsonSettingTab.prototype.display = function () {
        var _this = this;
        var containerEl = this.containerEl;
        containerEl.empty();
        new obsidian_1.Setting(containerEl)
            .setName('JSON Output Directory')
            .setDesc('Directory where JSON files will be saved')
            .addText(function (text) { return text
            .setPlaceholder('Enter output directory')
            .setValue(_this.plugin.settings.outputDirectory)
            .onChange(function (value) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('Output directory changed to:', value);
                        this.plugin.settings.outputDirectory = value;
                        return [4 /*yield*/, this.plugin.saveSettings()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); }); });
        new obsidian_1.Setting(containerEl)
            .setName('Bulk Output Directory')
            .setDesc('Directory where Elasticsearch bulk files will be saved')
            .addText(function (text) { return text
            .setPlaceholder('Enter bulk output directory')
            .setValue(_this.plugin.settings.bulkOutputDirectory)
            .onChange(function (value) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('Bulk output directory changed to:', value);
                        this.plugin.settings.bulkOutputDirectory = value;
                        return [4 /*yield*/, this.plugin.saveSettings()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); }); });
    };
    return Md2JsonSettingTab;
}(obsidian_1.PluginSettingTab));
