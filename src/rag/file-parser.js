const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

function parseFolder(folderPath) {
  const chunks = [];
  
  if (!fs.existsSync(folderPath)) {
    throw new Error(`Folder not found: ${folderPath}`);
  }

  const files = fs.readdirSync(folderPath).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.txt', '.md', '.csv'].includes(ext);
  });

  console.log(`📂 Found ${files.length} files in ${folderPath}`);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const ext = path.extname(file).toLowerCase();
    let fileChunks = [];

    if (ext === '.txt' || ext === '.md') {
      fileChunks = content.split(/\n\n+/).map(c => c.trim()).filter(c => c.length > 20);
    } else if (ext === '.csv') {
      const records = parse(content, { columns: true, skip_empty_lines: true });
      fileChunks = records.map(row => Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(', '));
    }

    for (const chunk of fileChunks) {
      chunks.push({ text: chunk, source: file, length: chunk.length });
    }
  }

  console.log(`📝 Parsed ${chunks.length} chunks from ${files.length} files`);
  return chunks;
}

module.exports = { parseFolder };
