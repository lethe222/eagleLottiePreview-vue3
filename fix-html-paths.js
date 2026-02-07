import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const files = [
  'dist/viewer/lottie.html',
  'dist/viewer/lottie-zip.html'
];

files.forEach(file => {
  let content = readFileSync(file, 'utf-8');

  // Fix paths: remove ./viewer/ prefix since files are now inside viewer folder
  content = content.replace(/\.\/viewer\//g, './');

  writeFileSync(file, content, 'utf-8');
  console.log(`Fixed paths in ${file}`);
});

console.log('All HTML paths fixed!');
