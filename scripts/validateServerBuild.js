const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const serverRoot = path.resolve(__dirname, '../server');
const files = [path.join(serverRoot, 'app.js'), path.join(serverRoot, 'server.js')];

const collectJavaScriptFiles = (directory) => {
  fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collectJavaScriptFiles(entryPath);
    else if (entry.isFile() && entry.name.endsWith('.js')) files.push(entryPath);
  });
};

collectJavaScriptFiles(path.join(serverRoot, 'src'));
files.forEach((filePath) => execFileSync(process.execPath, ['--check', filePath], { stdio: 'inherit' }));
console.log(`[Build] Server syntax validation passed for ${files.length} JavaScript files.`);