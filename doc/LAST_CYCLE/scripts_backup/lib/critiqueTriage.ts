import * as fs from 'fs';
import * as path from 'path';

export interface KritikPost {
  prioritet: 'HOG' | 'MEDEL' | 'LAG';
  text: string;
  raw: string;
}

export function omprioriteraBatchForbattringar(improvementsPath: string, obsoletePatterns?: string[]): void {
  if (!fs.existsSync(improvementsPath)) {
    return;
  }

  const content = fs.readFileSync(improvementsPath, 'utf8');
  const lines = content.split('\n');

  const hog: KritikPost[] = [];
  const medel: KritikPost[] = [];
  const lag: KritikPost[] = [];
  const papperskorg: string[] = [];

  let currentSection = '';
  const sectionHeaders = [
    '## 1. Förbättringsförslag under process',
    '## 2. Inga pågående förbättringar',
    '## 3. Framtida förbättringsförslag',
    '## 4. Papperskorg'
  ];

  let activeContentStartIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('## ')) {
      const headerIndex = sectionHeaders.findIndex(h => line.startsWith(h));
      if (headerIndex !== -1) {
        currentSection = sectionHeaders[headerIndex];
        continue;
      }
    }

    if (currentSection === '## 4. Papperskorg') {
      if (line && !line.startsWith('## ')) {
        papperskorg.push(lines[i]);
      }
    } else if (currentSection === '## 1. Förbättringsförslag under process' || currentSection === '## 3. Framtida förbättringsförslag') {
      if (line.startsWith('* ') || line.startsWith('- ')) {
        let isObsolete = false;
        if (obsoletePatterns) {
          isObsolete = obsoletePatterns.some(pattern => line.includes(pattern));
        }

        if (isObsolete) {
          papperskorg.push(lines[i]);
        } else {
          let prioritet: 'HOG' | 'MEDEL' | 'LAG' = 'LAG';
          if (line.toUpperCase().includes('HOG') || line.toUpperCase().includes('HÖG')) {
            prioritet = 'HOG';
          } else if (line.toUpperCase().includes('MEDEL')) {
            prioritet = 'MEDEL';
          }

          const post: KritikPost = {
            prioritet,
            text: line,
            raw: lines[i]
          };

          if (prioritet === 'HOG') hog.push(post);
          else if (prioritet === 'MEDEL') medel.push(post);
          else lag.push(post);
        }
      }
    }
  }

  const sortedLines: string[] = [];
  sortedLines.push(sectionHeaders[0]);
  sortedLines.push('');
  hog.forEach(p => sortedLines.push(p.raw));
  medel.forEach(p => sortedLines.push(p.raw));
  lag.forEach(p => sortedLines.push(p.raw));
  sortedLines.push('');

  sortedLines.push(sectionHeaders[1]);
  sortedLines.push('');
  sortedLines.push(sectionHeaders[2]);
  sortedLines.push('');
  sortedLines.push(sectionHeaders[3]);
  sortedLines.push('');
  papperskorg.forEach(p => sortedLines.push(p));
  sortedLines.push('');

  fs.writeFileSync(improvementsPath, sortedLines.join('\n'));
}

export function hanteraKonstruktivKritik(kritik: string, improvementsPath: string): void {
  let content = '';
  if (fs.existsSync(improvementsPath)) {
    content = fs.readFileSync(improvementsPath, 'utf8');
  }

  const lines = content.split('\n');
  const targetHeader = '## 1. Förbättringsförslag under process';
  let targetIndex = lines.findIndex(l => l.trim().startsWith(targetHeader));

  if (targetIndex === -1) {
    const newContent = `## 1. Förbättringsförslag under process\n\n* ${kritik}\n\n${content}`;
    fs.writeFileSync(improvementsPath, newContent);
    return;
  }

  let insertIndex = -1;
  for (let i = targetIndex + 1; i < lines.length; i++) {
    if (lines[i].trim().startsWith('## ')) {
      insertIndex = i;
      break;
    }
  }

  if (insertIndex === -1) {
    lines.push(`* ${kritik}`);
  } else {
    lines.splice(insertIndex, 0, `* ${kritik}`);
  }

  fs.writeFileSync(improvementsPath, lines.join('\n'));
}
