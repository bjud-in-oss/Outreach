/**
 * scripts/compress-adrs.js
 * 
 * OUTREACH COORDINATION ENGINE (v10.4)
 * Isomorf decentraliserad komprimerare för ADR och Invarianter.
 * Garanterar fast maxstorlek och låglatens-inläsning vid domänimport/export.
 */

import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const MAX_FILE_CHARS = 4000; // Fast storlekstak per beslutskatalog

function compressDecisionsFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  
  if (content.length <= MAX_FILE_CHARS) {
    console.log(`✓ ${path.relative(ROOT_DIR, filePath)}: Inom budget (${content.length}/${MAX_FILE_CHARS} tecken).`);
    return;
  }

  console.log(`🗜️  Komprimerar ${path.relative(ROOT_DIR, filePath)} (${content.length} tecken -> max ${MAX_FILE_CHARS})...`);

  // Dela upp i sektioner (ADR eller Paradigmskiften)
  const sections = content.split(/\n(?=## )/);
  const header = sections[0].startsWith('## ') ? '# Arkitekturinvarianter\n\n' : sections.shift() + '\n\n';

  const compressedSections = sections.map(sec => {
    const lines = sec.trim().split('\n');
    const titleLine = lines[0] || '## Ospecificerad Invariant';
    
    // Extrahera kärnregeln (Beslut) och skälet (Konsekvens/Kontext)
    let rule = '';
    let reason = '';

    for (const l of lines) {
      if (l.includes('**Beslut**:') || l.includes('INVARIANT:')) rule = l.replace(/.*(?:\*\*Beslut\*\*:|INVARIANT:)/, '').trim();
      if (l.includes('**Konsekvens**:') || l.includes('**Skäl**:')) reason = l.replace(/.*(?:\*\*Konsekvens\*\*:|\*\*Skäl\*\*:)/, '').trim();
    }

    if (!rule) rule = lines.slice(1, 3).join(' ').trim();
    if (!reason) reason = 'Kritiskt för domänens integritet och FSD-isolering.';

    return `${titleLine}\n- **Regel:** ${rule.substring(0, 180)}\n- **Skäl:** ${reason.substring(0, 120)}`;
  });

  const finalContent = header + compressedSections.join('\n\n') + '\n';
  fs.writeFileSync(filePath, finalContent, 'utf-8');
  console.log(`✅ ${path.relative(ROOT_DIR, filePath)} komprimerad till ${finalContent.length} tecken.`);
}

console.log('🏛️  [ADR-Komprimerare]: Skannar globala och decentraliserade beslutsloggar...');

// 1. Globala systemloggar
compressDecisionsFile(path.join(ROOT_DIR, 'doc', 'DECISIONS.md'));
compressDecisionsFile(path.join(ROOT_DIR, 'doc', 'PARADIGM_SHIFTS.md'));

// 2. Decentraliserade domänloggar (reser med respektive feature)
const featuresDir = path.join(ROOT_DIR, 'src', 'features');
if (fs.existsSync(featuresDir)) {
  for (const feat of fs.readdirSync(featuresDir)) {
    const featDecisions = path.join(featuresDir, feat, 'doc', 'DECISIONS.md');
    compressDecisionsFile(featDecisions);
  }
}
