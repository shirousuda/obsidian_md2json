// parseMarkdown.ts

export interface ContentItem {
    type: 'text' | 'list' | 'code' | 'link';
    content: string | string[];
    metadata?: Record<string, string | string[]>;
}

export interface Section {
    level: number;
    title: string;
    content: ContentItem[];
    subsections: Section[];
}

export interface Link {
    text: string;
    url: string;
}

export interface MarkdownStructure {
    title: string;
    metadata: Record<string, string | string[]>;
    sections: Section[];
    links: Link[];
    plain_text?: string;
}

export function parseMarkdown(content: string, fileName: string = 'untitled'): MarkdownStructure {
    const lines = content.split('\n');
    console.log('Markdown lines:', lines);

    // タイトルを加工して数値型や日付型として誤判定されないようにする
    const sanitizeTitle = (title: string): string => {
        // タイトルが数値や日付形式で始まる場合は、先頭に文字列であることを示すプレフィックスを追加
        if (/^\d+$/.test(title) || /^\d{4}-\d{2}-\d{2}/.test(title) || /^\d{2}\/\d{2}\/\d{4}/.test(title)) {
            return `title_${title}`;
        }
        return title;
    };

    // ファイル名からタイトルを生成し、加工を適用
    const title = sanitizeTitle(fileName.replace(/\.[^/.]+$/, '')); // 拡張子を除去
    console.log('Using filename as title:', title);

    const structure: MarkdownStructure = {
        title: title,
        metadata: {},
        sections: [],
        links: []
    };

    let sectionStack: { level: number; section: Section }[] = [];
    let currentList: string[] = [];
    let plainTextParts: string[] = [];
    let currentParagraph: string[] = [];
    let consecutiveEmptyLines = 0;
    let lastHeadingLevel = 0;
    let lastHeadingText = '';
    let emptySectionsFound = false;
    let emptySections: { heading: string; level: number }[] = [];

    // セクションの内容を保存する関数
    const saveCurrentContent = () => {
        if (currentParagraph.length > 0) {
            const paragraphText = currentParagraph.join(' ').trim();
            if (sectionStack.length > 0) {
                sectionStack[sectionStack.length - 1].section.content.push({
                    type: 'text',
                    content: paragraphText,
                    metadata: {}
                });
            }
            plainTextParts.push(paragraphText);
            currentParagraph = [];
        }
        if (currentList.length > 0 && sectionStack.length > 0) {
            sectionStack[sectionStack.length - 1].section.content.push({
                type: 'list',
                content: [...currentList],
                metadata: {}
            });
            currentList = [];
        }
    };

    const processTemplateSyntax = (text: string): string => {
        return text.replace(/<%[^%]+%>/g, '[TEMPLATE]');
    };

    const parseMetadata = (line: string): { key: string; value: string } | null => {
        const match = line.match(/^\*\*([^:]+):\*\*\s*(.+?)\s*$/);
        if (match) {
            return {
                key: match[1].toLowerCase(),
                value: match[2].trim()
            };
        }
        return null;
    };

    for (const line of lines) {
        if (!line.trim()) {
            consecutiveEmptyLines++;
            saveCurrentContent();
            continue;
        }
        if (line.trim() === '---') {
            saveCurrentContent();
            if (sectionStack.length > 0) {
                sectionStack[sectionStack.length - 1].section.content.push({
                    type: 'text',
                    content: '---',
                    metadata: {}
                });
            }
            consecutiveEmptyLines = 0;
            continue;
        }
        const headingMatch = line.match(/^\s*(#{1,6})\s+(.+?)\s*(?:\r\n|\r|\n)?$/);
        if (headingMatch) {
            saveCurrentContent();
            const level = headingMatch[1].length;
            const headingText = processTemplateSyntax(headingMatch[2].trim());
            const newSection: Section = {
                level: level,
                title: headingText,
                content: [],
                subsections: []
            };
            while (sectionStack.length > 0 && sectionStack[sectionStack.length - 1].level >= level) {
                const poppedSection = sectionStack.pop();
                if (poppedSection && poppedSection.section.content.length === 0 && poppedSection.section.subsections.length === 0) {
                    emptySectionsFound = true;
                    emptySections.push({
                        heading: poppedSection.section.title,
                        level: poppedSection.level
                    });
                    poppedSection.section.content.push({
                        type: 'text',
                        content: poppedSection.section.title,
                        metadata: {}
                    });
                }
            }
            if (sectionStack.length === 0) {
                structure.sections.push(newSection);
            } else {
                sectionStack[sectionStack.length - 1].section.subsections.push(newSection);
            }
            sectionStack.push({ level, section: newSection });
            lastHeadingLevel = level;
            lastHeadingText = headingText;
            plainTextParts.push(headingText);
            consecutiveEmptyLines = 0;
            continue;
        }
        const tagMatch = line.match(/#(\w+)/g);
        if (tagMatch) {
            tagMatch.forEach(tag => {
                const cleanTag = tag.replace('#', '');
                if (!structure.metadata.tags) {
                    structure.metadata.tags = [];
                }
                if (Array.isArray(structure.metadata.tags) && !structure.metadata.tags.includes(cleanTag)) {
                    structure.metadata.tags.push(cleanTag);
                }
            });
            if (sectionStack.length > 0) {
                sectionStack[sectionStack.length - 1].section.content.push({
                    type: 'text',
                    content: line.trim(),
                    metadata: {}
                });
            }
            consecutiveEmptyLines = 0;
            continue;
        }
        const metadata = parseMetadata(line);
        if (metadata) {
            if (metadata.key === 'created') {
                structure.metadata.created = metadata.value;
            } else if (metadata.key === 'updated') {
                structure.metadata.updated = metadata.value;
            }
            if (sectionStack.length > 0) {
                sectionStack[sectionStack.length - 1].section.content.push({
                    type: 'text',
                    content: line.trim(),
                    metadata: {}
                });
            }
            consecutiveEmptyLines = 0;
            continue;
        }
        const linkMatch = line.match(/^\[\[(.+?)\]\]$/);
        if (linkMatch) {
            const linkText = processTemplateSyntax(linkMatch[1]);
            structure.links.push({
                text: linkText,
                url: linkText
            });
            if (sectionStack.length > 0) {
                sectionStack[sectionStack.length - 1].section.content.push({
                    type: 'link',
                    content: linkText,
                    metadata: {}
                });
            }
            consecutiveEmptyLines = 0;
            continue;
        }
        const listMatch = line.match(/^[-*]\s+(.+)$/);
        if (listMatch) {
            const listItemText = processTemplateSyntax(listMatch[1].trim());
            currentList.push(listItemText);
            plainTextParts.push(listItemText);
            consecutiveEmptyLines = 0;
            continue;
        }
        if (line.trim()) {
            const processedLine = processTemplateSyntax(line.trim());
            currentParagraph.push(processedLine);
            consecutiveEmptyLines = 0;
        }
    }
    saveCurrentContent();
    const checkAndFixEmptySections = (sections: Section[], level: number = 1) => {
        for (const section of sections) {
            if (section.content.length === 0 && section.subsections.length === 0) {
                emptySectionsFound = true;
                emptySections.push({
                    heading: section.title,
                    level: level
                });
                section.content.push({
                    type: 'text',
                    content: section.title,
                    metadata: {}
                });
            }
            if (section.subsections.length > 0) {
                checkAndFixEmptySections(section.subsections, level + 1);
            }
        }
    };
    checkAndFixEmptySections(structure.sections);
    // Noticeによる警告表示は省略
    structure.plain_text = plainTextParts.join(' ');
    return structure;
} 