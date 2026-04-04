const fs = require('fs');
const path = require('path');

const foldersToProcess = ['./server', './client/src'];
const extensions = ['.js', '.jsx', '.css'];

function removeComments(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const removed = content.replace(/\/\*[\s\S]*?\*\/|(?<=[^:])\/\/.*|^\/\/.*$/gm, '');
    fs.writeFileSync(filePath, removed, 'utf8');
  } catch (err) {
    console.error(`Error cleaning ${filePath}: ${err.message}`);
  }
}

function processDir(dir) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file === 'node_modules' || file === '.git') continue;
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        processDir(fullPath);
      } else if (stat.isFile() && extensions.includes(path.extname(file))) {
        console.log(`Cleaning: ${fullPath}`);
        removeComments(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error processing dir ${dir}: ${err.message}`);
  }
}

foldersToProcess.forEach(folder => {
  const absolutePath = path.join(process.cwd(), folder);
  if (fs.existsSync(absolutePath)) {
    processDir(absolutePath);
  } else {
    console.warn(`Folder not found: ${absolutePath}`);
  }
});

console.log('Cleanup complete!');

console.log('Cleanup complete!');
