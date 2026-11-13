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
let existingTickets = new Map();

if (fs.existsSync(TICKETS_MD_PATH)) {
  const content = fs.readFileSync(TICKETS_MD_PATH, 'utf-8');
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/- \[([ x])\] \*\*(TCK-[A-Za-z0-9-]+)\*\*/);
    if (match) {
      existingTickets.set(match[2], match[1]);
    }
  }
}

for (const file of files) {
  const content = fs.readFileSync(path.join(TICKETS_DIR, file), 'utf-8');
  const idMatch = file.replace('.md', '');
  
  const titleMatch = content.match(/^#\s+(.+)$/m);
  let title = titleMatch ? titleMatch[1] : idMatch;
  if (title.startsWith(`${idMatch}:`)) title = title.replace(`${idMatch}:`, '').trim();

  let status = '[ ]';
  let label = 'READY';

  if (existingTickets.has(idMatch)) {
    status = existingTickets.get(idMatch);
    if (status === 'x') {
      label = 'VERIFIED';
    } else if (status === ' ') {
      label = 'READY';
    }
  } else if (idMatch.includes('MAINT')) {
     status = '[x]';
     label = 'VERIFIED';
  }

  tickets.push({
    id: idMatch,
    line: `- ${status} **${idMatch}** (${label}): ${title} -> Se \`doc/.TICKETS/${file}\``
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
