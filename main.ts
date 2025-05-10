import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, Menu, EventRef, ItemView } from 'obsidian';
import { parseMarkdown, MarkdownStructure, ContentItem, Section, Link } from './parseMarkdown';

// Interfaces from parseMarkdown.ts
interface Md2JsonSettings {
    outputDirectory: string;
    bulkOutputDirectory: string;
}

interface ConversionResult {
    fileName: string;
    isNew: boolean;
}

interface ChatGPTMessage {
    id: string;
    message: {
        id: string;
        author: {
            role: 'user' | 'assistant';
        };
        content: {
            parts: string[];
        };
        create_time: number;
    };
    parent: string | null;
    children: string[];
}

interface ChatGPTConversation {
    title: string;
    create_time: number;
    update_time: number;
    mapping: {
        [key: string]: ChatGPTMessage;
    };
    current_node: string;
}

const DEFAULT_SETTINGS: Md2JsonSettings = {
    outputDirectory: 'json-output',
    bulkOutputDirectory: 'bulk-json-output'
}

export default class Md2JsonPlugin extends Plugin {
    settings!: Md2JsonSettings;  // ! を追加して初期化を保証

    async onload() {
        await this.loadSettings();

        // Add a command to convert the current file to JSON
        this.addCommand({
            id: 'convert-current-to-json',
            name: 'Convert current file to JSON',
            callback: () => {
                const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (activeView) {
                    const file = activeView.file;
                    if (file) {
                        this.convertToJson(file.basename, activeView.getViewData());
                    }
                }
            }
        });

        // Add a command to convert all files to JSON
        this.addCommand({
            id: 'convert-all-to-json',
            name: 'Convert all files to JSON',
            callback: () => {
                this.convertAllFiles();
            }
        });

        // Add a command to create Elasticsearch bulk file
        this.addCommand({
            id: 'create-elasticsearch-bulk',
            name: 'Create Elasticsearch bulk file',
            callback: () => {
                this.createElasticsearchBulkFile();
            }
        });

        // Add a command to test parseMarkdown
        this.addCommand({
            id: 'test-parse-markdown',
            name: 'Test parseMarkdown method',
            callback: () => {
                const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (activeView) {
                    const file = activeView.file;
                    if (file) {
                        const markdown = activeView.getViewData();
                        console.log('Testing parseMarkdown with file:', file.basename);
                        const result = this.parseMarkdown(markdown, file.basename);
                        console.log('Parse result:', result);
                        new Notice(`Parsed ${file.basename} successfully. Check console for details.`);
                    }
                }
            }
        });

        // Add context menu for files
        this.registerEvent(
            (this.app.workspace as any).on('file-menu', (menu: Menu, file: TFile) => {
                if (file.extension === 'md') {
                    menu.addItem((item) => {
                        item
                            .setTitle('Convert to JSON')
                            .setIcon('file-code')
                            .onClick(async () => {
                                try {
                                    const content = await this.app.vault.read(file);
                                    await this.convertToJson(file.basename, content);
                                } catch (err) {
                                    const error = err as Error;
                                    console.error('Error:', error.message);
                                }
                            });
                    });
                }
            })
        );

        // Add settings tab
        this.addSettingTab(new Md2JsonSettingTab(this.app, this));

        // テスト用のコード
        console.log('Plugin loaded!');
        this.addCommand({
            id: 'test-conversion',
            name: 'Test JSON Conversion',
            callback: () => {
                const testMarkdown = `# Test Note
This is a test note with some **bold** and *italic* text.

## Section 1
- Item 1
- Item 2

## Section 2
1. Numbered item 1
2. Numbered item 2`;
                
                this.convertToJson('test_note', testMarkdown);
            }
        });
    }

    onunload() {
        console.log('Plugin unloaded!');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        console.log('Settings loaded:', this.settings);
    }

    async saveSettings() {
        await this.saveData(this.settings);
        console.log('Settings saved:', this.settings);
    }

    // parseMarkdownメソッドを関数を呼び出すように変更
    public parseMarkdown(markdown: string, fileName: string): MarkdownStructure {
        return parseMarkdown(markdown, fileName);
    }

    private async convertToJson(originalFileName: string, markdown: string): Promise<ConversionResult | null> {
        try {
            console.log('Converting markdown to JSON...');
            
            // マークダウンを構造化データに変換
            const structure = this.parseMarkdown(markdown, originalFileName);
            console.log('Parsed structure:', structure);

            // Convert to JSON string (single line)
            const jsonString = JSON.stringify(structure);
            console.log('Generated JSON:', jsonString);

            // Create output directory if it doesn't exist
            const outputDir = this.settings.outputDirectory;
            if (!this.app.vault.getAbstractFileByPath(outputDir)) {
                this.app.vault.createFolder(outputDir);
                console.log('Created output directory:', outputDir);
            }

            // Save the JSON file with the original file name
            const fileName = `${originalFileName}.json`;
            const filePath = `${outputDir}/${fileName}`;
            
            // 既存のファイルを確認
            const existingFile = this.app.vault.getAbstractFileByPath(filePath);
            if (existingFile instanceof TFile) {
                try {
                    // 既存のファイルを上書き
                    await this.app.vault.modify(existingFile, jsonString);
                    console.log('Updated existing JSON file:', fileName);
                    return { fileName, isNew: false };
                } catch (error) {
                    console.error('Error updating file:', error);
                    throw error;
                }
            } else {
                try {
                    // 新規ファイルを作成
                    await this.app.vault.create(filePath, jsonString);
                    console.log('Created new JSON file:', fileName);
                    return { fileName, isNew: true };
                } catch (error) {
                    console.error('Error creating file:', error);
                    throw error;
                }
            }
        } catch (err) {
            const errorObj = err as Error;
            console.error('Error:', errorObj.message);
            new Notice('Error converting to JSON: ' + errorObj.message);
            return null;
        }
    }

    private async convertAllFiles() {
        try {
            const markdownFiles = this.app.vault.getMarkdownFiles();
            const convertedFiles: ConversionResult[] = [];

            for (const file of markdownFiles) {
                try {
                    const content = await this.app.vault.read(file);
                    const result = await this.convertToJson(file.basename, content);
                    if (result) {
                        convertedFiles.push(result);
                    }
                } catch (err) {
                    const error = err as Error;
                    console.error(`Error converting ${file.path}:`, error.message);
                }
            }

            if (convertedFiles.length > 0) {
                new Notice(`Converted ${convertedFiles.length} files to JSON.`);
            } else {
                new Notice('No files were converted.');
            }
        } catch (err) {
            const errorObj = err as Error;
            console.error('Error:', errorObj.message);
            new Notice('Error converting files: ' + errorObj.message);
        }
    }

    private async createElasticsearchBulkFile() {
        try {
            const inputDir = this.settings.outputDirectory;
            const outputDir = this.settings.bulkOutputDirectory;
            const jsonFiles = this.app.vault.getFiles().filter(file => 
                file.extension === 'json' && 
                file.path.startsWith(inputDir + '/')
            );

            if (jsonFiles.length === 0) {
                new Notice('No JSON files found in the input directory.');
                return;
            }

            // Create bulk output directory if it doesn't exist
            if (!this.app.vault.getAbstractFileByPath(outputDir)) {
                this.app.vault.createFolder(outputDir);
                console.log('Created bulk output directory:', outputDir);
            }

            const indexName = 'obsidian_notes';
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const BATCH_SIZE = 100; // 一度に処理するファイル数

            // ファイルをバッチに分割
            for (let i = 0; i < jsonFiles.length; i += BATCH_SIZE) {
                const batchFiles = jsonFiles.slice(i, i + BATCH_SIZE);
                const bulkContent: string[] = [];

                for (const file of batchFiles) {
                    try {
                        const content = await this.app.vault.read(file);
                        const docId = file.basename;
                        
                        // Add the index action (metadata line)
                        bulkContent.push(JSON.stringify({
                            index: {
                                _index: indexName,
                                _id: docId
                            }
                        }));
                        
                        // Add the document (data line) - ensure it's on a single line
                        let doc;
                        try {
                            doc = JSON.parse(content);
                        } catch (parseError) {
                            console.error(`Error parsing JSON file ${file.path}:`, parseError);
                            continue;
                        }

                        // すべての文字列フィールドから改行を削除
                        const processValue = (value: any): any => {
                            try {
                                if (typeof value === 'string') {
                                    return value.replace(/[\n\r]+/g, ' ').trim();
                                } else if (Array.isArray(value)) {
                                    return value.map(processValue);
                                } else if (value && typeof value === 'object') {
                                    const result: any = {};
                                    for (const key in value) {
                                        if (Object.prototype.hasOwnProperty.call(value, key)) {
                                            result[key] = processValue(value[key]);
                                        }
                                    }
                                    return result;
                                }
                                return value;
                            } catch (error) {
                                console.error('Error processing value:', error);
                                return value;
                            }
                        };

                        const processedDoc = processValue(doc);
                        const jsonString = JSON.stringify(processedDoc);
                        if (jsonString.includes('\n')) {
                            console.warn(`Warning: JSON string still contains newlines for file ${file.path}`);
                        }
                        bulkContent.push(jsonString);
                    } catch (fileError) {
                        console.error(`Error processing file ${file.path}:`, fileError);
                        continue;
                    }
                }

                if (bulkContent.length === 0) {
                    console.warn(`No valid JSON files were processed in batch ${i / BATCH_SIZE + 1}`);
                    continue;
                }

                // Create the bulk file for this batch
                const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
                const bulkFileName = `elasticsearch_bulk_${timestamp}_batch${batchNumber}.json`;
                const bulkFilePath = `${outputDir}/${bulkFileName}`;
                await this.app.vault.create(bulkFilePath, bulkContent.join('\n') + '\n');

                console.log(`Created Elasticsearch bulk file for batch ${batchNumber}: ${bulkFileName}`);
            }

            new Notice(`Created Elasticsearch bulk files with timestamp: ${timestamp}`);
        } catch (err) {
            const errorObj = err as Error;
            console.error('Error:', errorObj.message);
            new Notice('Error creating Elasticsearch bulk file: ' + errorObj.message);
        }
    }

    // マークダウンに戻すためのメソッドを追加
    private convertToMarkdown(structure: MarkdownStructure): string {
        const lines: string[] = [];
        
        // Add title
        lines.push(`# ${structure.title}`);
        
        // Add metadata
        if (structure.metadata.tags && Array.isArray(structure.metadata.tags)) {
            structure.metadata.tags.forEach(tag => lines.push(`#${tag}`));
        }
        
        // Add created and updated dates if they exist
        if (structure.metadata.created) {
            lines.push(`created: ${structure.metadata.created}`);
        }
        if (structure.metadata.updated) {
            lines.push(`updated: ${structure.metadata.updated}`);
        }
        
        // Add a blank line after metadata
        lines.push('');
        
        // Process sections
        const processSection = (section: Section, level: number = 1) => {
            lines.push(`${'#'.repeat(level + 1)} ${section.title}`);
            
            // Process content items
            for (const item of section.content) {
                if (item.type === 'text') {
                    lines.push(item.content as string);
                } else if (item.type === 'list' && Array.isArray(item.content)) {
                    item.content.forEach(listItem => lines.push(`- ${listItem}`));
                } else if (item.type === 'code') {
                    lines.push('```');
                    lines.push(item.content as string);
                    lines.push('```');
                } else if (item.type === 'link') {
                    lines.push(`[[${item.content}]]`);
                }
                lines.push('');
            }
            
            // Process subsections
            section.subsections.forEach(subsection => processSection(subsection, level + 1));
        };
        
        // Process all sections
        structure.sections.forEach(section => processSection(section));
        
        return lines.join('\n');
    }
}

class Md2JsonSettingTab extends PluginSettingTab {
    plugin: Md2JsonPlugin;

    constructor(app: App, plugin: Md2JsonPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        containerEl.createEl('h2', {text: 'JSON Output Settings'});

        new Setting(containerEl)
            .setName('JSON Output Directory')
            .setDesc('Directory where JSON files will be saved')
            .addText(text => text
                .setPlaceholder('Enter output directory')
                .setValue(this.plugin.settings.outputDirectory)
                .onChange(async (value) => {
                    console.log('Output directory changed to:', value);
                    this.plugin.settings.outputDirectory = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Bulk Output Directory')
            .setDesc('Directory where Elasticsearch bulk files will be saved')
            .addText(text => text
                .setPlaceholder('Enter bulk output directory')
                .setValue(this.plugin.settings.bulkOutputDirectory)
                .onChange(async (value) => {
                    console.log('Bulk output directory changed to:', value);
                    this.plugin.settings.bulkOutputDirectory = value;
                    await this.plugin.saveSettings();
                }));
    }
} 