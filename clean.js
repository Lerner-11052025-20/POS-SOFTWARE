const fs = require('fs');
const path = require('path');

const folders = ['./server', './client/src'];

function cleanFile(file) {
  if (file.endsWith('.js') || file.endsWith('.jsx')) {
    let content = fs.readFileSync(file, 'utf8');
    // Remove multi-line comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove single-line comments (ignoring http://)
    content = content.split('\n').map(line => {
      const index = line.indexOf('//');
      if (index === -1) return line;
      // If it looks like a URL, don't remove it
      if (line.substring(index - 1, index) === ':') return line;
      return line.substring(0, index);
    }).join('\n');
    fs.writeFileSync(file, content, 'utf8');
  }
}

function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules')) walk(file);
    } else {
      cleanFile(file);
    }
  });
}

folders.forEach(f => {
  const p = path.resolve(process.cwd(), f);
  if (fs.existsSync(p)) walk(p);
});

console.log('DONE');
