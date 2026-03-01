import fs from 'fs';
import path from 'path';

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.error('Usage: npx tsx decode.ts <input_file> <output_file>');
  process.exit(1);
}

try {
  const base64Content = fs.readFileSync(inputFile, 'utf-8').replace(/\n/g, '');
  const decodedContent = Buffer.from(base64Content, 'base64').toString('utf-8');
  fs.writeFileSync(outputFile, decodedContent);
  console.log(`Successfully decoded ${inputFile} to ${outputFile}`);
} catch (error) {
  console.error('Error decoding file:', error);
  process.exit(1);
}
