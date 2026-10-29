/**
 * scripts/compress-adrs.js
 * 
 * OUTREACH COORDINATION ENGINE (v10.4)
 * Intelligent semantisk komprimerare för ADR och Invarianter (v2.1).
 * Korrekt JS-radslut, bevarar tekniska prefix (16kHz) och verkliga konsekvenser.
 */

import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();

function cleanText(text) {
  return text
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[-*]\s+/, '')
    .trim();
}

function truncateSafely(text, maxLen) {
  if (text.length <= maxLen) return text;
  const sub = text.substring(0, maxLen);
  const lastPunct = Math.max(sub.lastIndexOf('.'), sub.lastIndexOf(';'), sub.lastIndexOf(','));
  if (lastPunct > maxLen * 0.6) {
    return sub.substring(0, lastPunct + 1);
  }
  const lastSpace = sub.lastIndexOf(' ');
  return (lastSpace > 0 ? sub.substring(0, lastSpace) : sub) + '...';
}

function compressDecisionsFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Dela upp filen i sektioner baserat på "## ADR-"
  const rawSections = content.split(/\n(?=## )/);
  if (rawSections.length <= 1) return;

  const header = rawSections[0].startsWith('## ') ? '# Arkitekturinvarianter\n\n' : rawSections[0].trim() + '\n\n';
  const sections = rawSections.slice(1);

  console.log(`🗜️  Bearbetar ${path.relative(ROOT_DIR, filePath)} (${sections.length} beslut)...`);

  const compressedSections = sections.map(sec => {
    const titleMatch = sec.match(/^##\s+([^\n]+)/);
    const title = titleMatch ? titleMatch[1].trim() : 'Okänd Invariant';

    // Fånga blocket mellan **Beslut**: och nästa rubrik/avgränsare
    const beslutMatch = sec.match(/-\s+\*\*Beslut\*\*:\s*([\s\S]*?)(?=\n-\s+\*\*[A-Za-zåäöÅÄÖ]+|\n---|\n##|$)/);
    let ruleText = '';
    
    if (beslutMatch && beslutMatch[1].trim().length > 0) {
      const rawBlock = beslutMatch[1].trim();
      // Dela upp vid faktiska listpunkter: "1. ", "2. "
      const points = rawBlock.split(/\n\s*\d+\.\s+/).map(cleanText).filter(p => p.length > 0);
      if (points.length > 1) {
        ruleText = points.map(p => truncateSafely(p, 140)).join('; ');
      } else {
        ruleText = cleanText(rawBlock);
      }
    } else {
      // Om filen redan komprimerats tidigare och har "- **Regel:**"
      const regelMatch = sec.match(/-\s+\*\*Regel\*\*:\s*([^\n]+)/);
      if (regelMatch) ruleText = cleanText(regelMatch[1]);
    }

    // Fånga blocket för **Konsekvens**: (eller befintligt **Skäl**:)
    const konsMatch = sec.match(/-\s+\*\*(?:Konsekvens|Skäl)\*\*:\s*([\s\S]*?)(?=\n-\s+\*\*[A-Za-zåäöÅÄÖ]+|\n---|\n##|$)/);
    let reasonText = '';
    if (konsMatch && konsMatch[1].trim().length > 0) {
      reasonText = cleanText(konsMatch[1]);
    } else {
      reasonText = 'Säkrar modulär integritet och FSD-kontrakt.';
    }

    const safeRule = truncateSafely(ruleText, 260);
    const safeReason = truncateSafely(reasonText, 160);

    return `## ${title}\n- **Regel:** ${safeRule}\n- **Skäl:** ${safeReason}`;
  });

  const finalContent = header + compressedSections.join('\n\n') + '\n';
  fs.writeFileSync(filePath, finalContent, 'utf-8');
  console.log(`✅ ${path.relative(ROOT_DIR, filePath)} färdig (${finalContent.length} tecken).`);
}

console.log('🏛️  [ADR-Komprimerare v2.1]: Startar precisionskörning...');

compressDecisionsFile(path.join(ROOT_DIR, 'doc', 'DECISIONS.md'));
compressDecisionsFile(path.join(ROOT_DIR, 'src', 'features', 'gemini_live_swarm', 'doc', 'DECISIONS.md'));
compressDecisionsFile(path.join(ROOT_DIR, 'src', 'features', 'google_drive_sync', 'doc', 'DECISIONS.md'));
compressDecisionsFile(path.join(ROOT_DIR, 'src', 'features', 'mcp_bridge', 'doc', 'DECISIONS.md'));
compressDecisionsFile(path.join(ROOT_DIR, 'src', 'features', 'wal_logger', 'doc', 'DECISIONS.md'));
