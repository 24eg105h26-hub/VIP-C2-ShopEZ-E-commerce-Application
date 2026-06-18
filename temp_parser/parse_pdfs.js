const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const srcDir = path.join(__dirname, '..', 'temp_src', 'MERN phase wise');
const destDir = path.join(__dirname, 'extracted_texts');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      if (path.extname(fullPath).toLowerCase() === '.pdf') {
        results.push(fullPath);
      }
    }
  });
  return results;
}

async function extract() {
  const pdfFiles = walk(srcDir);
  for (const pdfFile of pdfFiles) {
    const relativePath = path.relative(srcDir, pdfFile);
    const targetTxtPath = path.join(destDir, relativePath.replace(/\.pdf$/i, '.txt'));
    const targetDir = path.dirname(targetTxtPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const dataBuffer = fs.readFileSync(pdfFile);
    try {
      const data = await pdf(dataBuffer);
      fs.writeFileSync(targetTxtPath, data.text, 'utf8');
      console.log(`Extracted: ${relativePath} -> ${targetTxtPath}`);
    } catch (err) {
      console.error(`Error parsing ${pdfFile}:`, err);
    }
  }
}

extract();
