const fs = require('fs');
const path = require('path');

function cleanFile(filePath) {
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    console.log(`Cleaning: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const newLines = lines.map(line => {
      const idx = line.indexOf('//');
      if (idx !== -1 && !line.includes('://')) {
        return line.substring(0, idx);
      }
      return line;
    });
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
  }
}

function processDir(dir) {
  const absolutePath = path.resolve(dir);
  const files = fs.readdirSync(absolutePath);
  for (const file of files) {
    const fullPath = path.join(absolutePath, file);
    if (file === 'node_modules' || file === '.git') continue;
    
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      processDir(fullPath);
    } else {
      cleanFile(fullPath);
    }
  }
}

// Start cleaning from CURRENT directory (Root)
processDir('.');
console.log('CLEANUP FINISHED!');
