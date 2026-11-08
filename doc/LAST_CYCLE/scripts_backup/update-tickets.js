import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const TICKETS_DIR = path.join(ROOT_DIR, 'doc', '.TICKETS');
const TICKETS_MD_PATH = path.join(ROOT_DIR, 'doc', 'TICKETS.md');

if (!fs.existsSync(TICKETS_DIR)) {
  process.exit(0);
}

const files = fs.readdirSync(TICKETS_DIR).filter(f => f.endsWith('.md') && f.startsWith('TCK-'));
const tickets = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(TICKETS_DIR, file), 'utf-8');
  const idMatch = file.replace('.md', '');
  
  const titleMatch = content.match(/^#\s+(.+)$/m);
  let title = titleMatch ? titleMatch[1] : idMatch;
  if (title.startsWith(`${idMatch}:`)) title = title.replace(`${idMatch}:`, '').trim();

  tickets.push({
    id: idMatch,
    line: `- [x] **${idMatch}** (VERIFIED): ${title} -> Se \`doc/.TICKETS/${file}\``
  });
}

// Sortera: MAINT först, därefter TCK (fallande nummer)
tickets.sort((a, b) => {
  const aIsMaint = a.id.includes('MAINT');
  const bIsMaint = b.id.includes('MAINT');
  if (aIsMaint && !bIsMaint) return -1;
  if (!aIsMaint && bIsMaint) return 1;
  return b.id.localeCompare(a.id, undefined, { numeric: true, sensitivity: 'base' });
});

let mdContent = `# TICKETS & LEVERANSPLAN\n\n## AKTIVA TICKETS\n\n`;
mdContent += tickets.map(t => t.line).join('\n') + '\n';

fs.writeFileSync(TICKETS_MD_PATH, mdContent, 'utf-8');
console.log('✅ doc/TICKETS.md är synkroniserad från doc/.TICKETS/');
