import fs from 'fs';
import https from 'https';
import path from 'path';

const BASE_URL = 'https://raw.githubusercontent.com/t-all-dcc/MEAT-PRO-Production-/main';

const files = [
  'services/sheetService.ts',
  'constants.ts',
  'types.ts',
  'index.html',
  'index.css',
  'vite.config.ts',
  'tsconfig.json',
  'package.json'
];

async function downloadFile(filePath: string) {
  const url = `${BASE_URL}/${filePath}`;
  const dest = path.join(process.cwd(), filePath);
  
  // Create directory if it doesn't exist
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download ${filePath}: ${res.statusCode}`));
        return;
      }
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Downloaded ${filePath}`);
        resolve(true);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  for (const file of files) {
    try {
      await downloadFile(file);
    } catch (error) {
      console.error(error);
    }
  }
}

main();
