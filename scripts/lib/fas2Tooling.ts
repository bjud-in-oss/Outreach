import * as fs from 'fs';
import * as path from 'path';
import { applySourcePatch } from '../drivers/patchMutator.js';
import { executeInspection } from './channelRunner.js';

const ROOT_DIR = process.cwd();

export const codegenTools = [
  ...[
    {
      name: 'read_file',
      behavior: 'NON_BLOCKING',
      description: 'Läser fil i repot (stora filer trunkeras).',
      parameters: { type: 'OBJECT', properties: { file_path: { type: 'STRING' } }, required: ['file_path'] },
    },
    {
      name: 'list_files',
      behavior: 'NON_BLOCKING',
      description: 'Listar innehållet i en katalog.',
      parameters: { type: 'OBJECT', properties: { directory_path: { type: 'STRING' } }, required: ['directory_path'] },
    }
  ],
  {
    name: 'save_code',
    behavior: 'NON_BLOCKING',
    description: 'Skapar en helt NY fil som inte existerar än. För befintliga filer, använd apply_patch för att inte radera historisk kod!',
    parameters: { type: 'OBJECT', properties: { file_path: { type: 'STRING' }, code: { type: 'STRING' } }, required: ['file_path', 'code'] },
  },
  {
    name: 'apply_patch',
    behavior: 'NON_BLOCKING',
    description: 'Gör en kirurgisk ändring i en BEFINTLIG fil via search & replace. Kräver 1-2 omgivande rader i search_block för att garantera unikhet.',
    parameters: {
      file_path: { type: 'STRING', description: 'Relativ sökväg till filen' },
      search_block: { type: 'STRING', description: 'Exakt kodblock som ska bytas ut (inkludera 1-2 rader omgivande kontext)' },
      replace_block: { type: 'STRING', description: 'Ny kod som ska ersätta search_block' },
    },
    required: ['file_path', 'search_block', 'replace_block'],
  }
];

export function createFas2ToolExecutor(
  isMaint: boolean,
  targetDomain: string,
  modifiedFiles: string[],
  createdModules: string[],
  codeSaved: { value: boolean },
  ticketPrompt: string,
  ticketPath: string
) {
  return function executeFas2Tools(name: string, args: any): string {
    if (name === 'read_file' || name === 'list_files') return executeInspection(name, args);

    const rel = args.file_path;
    if (!isMaint && !rel.startsWith(`src/features/${targetDomain}/`)) {
      throw new Error(`Otillåten skrivning till ${rel}. Endast src/features/${targetDomain}/ är tillåtet.`);
    }
    const full = path.resolve(ROOT_DIR, rel);

    if (name === 'save_code') {
      if (fs.existsSync(full) && (rel.endsWith("model/types.ts") || rel.endsWith("index.ts") || rel.includes("contracts/"))) {
        const existingContent = fs.readFileSync(full, "utf-8");
        const existingExports = (existingContent.match(/export (?:interface|type|class|const|function) ([a-zA-Z0-9_]+)/g) || []);
        for (const exp of existingExports) {
          const id = exp.split(" ").pop();
          if (!args.code.includes(id)) {
            throw new Error(`AVVISAD TYPAMPUTATION: Din nya kod saknar tidigare deklarerad export "${id}". Använd apply_patch för att lägga till nya typer utan att radera historiska kontrakt!`);
          }
        }
      }
      if (fs.existsSync(full)) {
        const existingContent = fs.readFileSync(full, 'utf-8');
        if (existingContent.length > 500 && args.code.length < existingContent.length * 0.4) {
          throw new Error(`AVVISAD TRUNKERING: '${rel}' har ${existingContent.length} tecken men din nya kod har bara ${args.code.length} tecken. Använd verktyget 'apply_patch' för att lägga till din funktion i filen utan att radera befintlig kod!`);
        }
      }

      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, args.code, 'utf-8');
      codeSaved.value = true;
      if (!modifiedFiles.includes(rel)) modifiedFiles.push(rel);

      if (!isMaint && rel.startsWith(`src/features/${targetDomain}/`) && !rel.endsWith('index.ts') && !rel.includes('__tests__')) {
        const domainDir = path.join(ROOT_DIR, 'src', 'features', targetDomain);
        const base = path.relative(domainDir, full).replace(/\.(ts|tsx)$/, '').replace(/\\/g, '/');
        if (!createdModules.includes(base)) createdModules.push(base);
      }
      console.log(`\n   💾 [SPARAD FIL]: ${rel} (${args.code.length} tecken)`);
      return `Fil sparad till ${rel}`;
    }

    if (name === 'apply_patch') {
      if (!fs.existsSync(full)) {
        throw new Error(`Filen '${rel}' finns inte. Använd save_code för att skapa nya filer.`);
      }
      const existingContent = fs.readFileSync(full, 'utf-8');
      const patchedContent = applySourcePatch(existingContent, args.search_block, args.replace_block, rel);
      if (patchedContent === existingContent) {
        throw new Error("SEARCH_BLOCK_NOT_FOUND: Sökblocket hittades inte. Bygget kraschas mekaniskt för att undvika tomma tillstånd.");
      }
      fs.writeFileSync(full, patchedContent, 'utf-8');
      codeSaved.value = true;
      if (!modifiedFiles.includes(rel)) modifiedFiles.push(rel);

      console.log(`\n   🩹 [PATCH APPLICERAD]: ${rel} (Ny storlek: ${patchedContent.length} tecken)`);
      return `Patch applicerad framgångsrikt på ${rel}.`;
    }

    return 'Okänt verktyg';
  };
}

export function getRequiredFiles(ticketPath: string, isMaint: boolean, targetDomain: string): string[] {
  const ticketPrompt = fs.readFileSync(ticketPath, 'utf-8');
  const targetMatch = ticketPrompt.match(/\*\*Målfiler:\*\*\s*(.+)/);
  if (targetMatch) {
    const filesPart = targetMatch[1];
    const fileMatches = filesPart.match(/`([^`]+)`/g);
    if (fileMatches) {
      return fileMatches.map(m => m.replace(/`/g, ''));
    }
  }

  if (isMaint) {
    const scriptFiles = ticketPrompt.match(/scripts\/[a-zA-Z0-9_\-./]+\.(?:ts|js)/g) || [];
    const sharedFiles = ticketPrompt.match(/src\/shared\/[a-zA-Z0-9_\-./]+\.(?:ts|tsx)/g) || [];
    const rootFiles = ticketPrompt.match(/(?:vite\.config\.ts|package\.json|src\/App\.tsx)/g) || [];
    return Array.from(new Set([...scriptFiles, ...sharedFiles, ...rootFiles]));
  }
  const promptFiles = ticketPrompt.match(new RegExp(`src/features/${targetDomain}/[a-zA-Z0-9_/\\-]+\\.(ts|tsx)`, 'g')) || [];
  return Array.from(new Set(promptFiles)).filter(f => !f.includes('__tests__') && !f.endsWith('index.ts'));
}

export function getMissingFiles(ticketPath: string, isMaint: boolean, targetDomain: string): string[] {
  return getRequiredFiles(ticketPath, isMaint, targetDomain).filter(f => {
    const fullPath = path.join(ROOT_DIR, f);
    if (!fs.existsSync(fullPath)) return true;
    try {
      return fs.statSync(fullPath).size === 0;
    } catch (e: any) {
      return true;
    }
  });
}

export function isFas2Complete(
  codeSaved: { value: boolean },
  ticketPath: string,
  isMaint: boolean,
  targetDomain: string,
  modifiedFiles: string[]
): boolean {
  if (!codeSaved.value) return false;
  const required = getRequiredFiles(ticketPath, isMaint, targetDomain);
  const missing = getMissingFiles(ticketPath, isMaint, targetDomain);
  return missing.length === 0 && required.every(f => modifiedFiles.includes(f));
}

export function getFas2FollowupPrompt(
  ticketPath: string,
  isMaint: boolean,
  targetDomain: string,
  modifiedFiles: string[]
): string {
  const missing = getMissingFiles(ticketPath, isMaint, targetDomain);
  if (missing.length > 0) {
    return `⚠️ Följande källkodsfiler från kontraktet saknas fortfarande på disk:\n${missing.map(f => `- ${f}`).join('\n')}\nDu MÅSTE använda 'save_code' för att skapa och spara dessa filer innan bygget kan gå vidare!`;
  }
  const untouched = getRequiredFiles(ticketPath, isMaint, targetDomain).filter(f => !modifiedFiles.includes(f));
  if (untouched.length > 0) {
     return `⚠️ Följande källkodsfiler från kontraktet har inte ändrats:\n${untouched.map(f => `- ${f}`).join('\n')}\nDu MÅSTE använda 'apply_patch' eller 'save_code' för att uppdatera dessa filer!`;
  }
  return `Du har genomfört inspektion. Slutför nu uppdraget omedelbart! Använd 'apply_patch' för att uppdatera befintliga filer, eller 'save_code' om du skapar en helt ny fil.`;
}
