# Obsidian Markdown to JSON Plugin

An Obsidian plugin that converts markdown files into structured JSON format. This tool is particularly useful for processing Obsidian vaults and extracting structured data from markdown files.

## Features

- Converts Markdown files to structured JSON
- Preserves document hierarchy with sections and subsections
- Extracts metadata (tags, creation date, update date)
- Handles lists, links, and paragraphs
- Processes Obsidian-specific syntax (like `[[wiki-links]]`)
- Maintains document structure with proper nesting

## Installation

1. Download or clone this repository
2. Copy the following files to your Obsidian vault's `.obsidian/plugins/obsidian-md2json` folder:
   - `main.js`
   - `manifest.json`
3. Reload Obsidian
4. Enable the plugin in Settings > Community Plugins

## Usage

### Available Commands

Press `Ctrl+P` (or `Cmd+P` on Mac) to open the command palette and use any of the following commands:

1. **Convert current file to JSON**
   - Converts the currently open markdown file to JSON format
   - Creates a new JSON file in the configured output directory

2. **Convert all files to JSON**
   - Converts all markdown files in your vault to JSON format
   - Creates JSON files for each markdown file in the configured output directory

3. **Create Elasticsearch bulk file**
   - Creates a bulk import file for Elasticsearch
   - Processes all JSON files in the output directory
   - Creates a new file in the bulk output directory

### Context Menu

You can also right-click on any markdown file in the file explorer to access the "Convert to JSON" option.

### Settings

The plugin provides the following settings (accessible via Settings > Community Plugins > Markdown to JSON):

- **JSON Output Directory**: Directory where converted JSON files will be saved
- **Bulk Output Directory**: Directory where Elasticsearch bulk files will be saved

### Output Structure

The plugin generates a JSON structure with the following format:

```typescript
interface MarkdownStructure {
    title: string;
    metadata: Record<string, string | string[]>;
    sections: Section[];
    links: Link[];
    plain_text?: string;
}

interface Section {
    level: number;
    title: string;
    content: ContentItem[];
    subsections: Section[];
}

interface ContentItem {
    type: 'text' | 'list' | 'code' | 'link';
    content: string | string[];
    metadata?: Record<string, string | string[]>;
}

interface Link {
    text: string;
    url: string;
}
```

## Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/obsidian-md2json.git
cd obsidian-md2json
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. For development, you can use the following commands:
```bash
npm run dev    # Start development mode
npm run build  # Build for production
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 