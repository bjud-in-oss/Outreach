import fs from 'node:fs';
import path from 'node:path';
import { checkAstMetrics, checkNoProductionMocks } from '../../scripts/drivers/ts.js';
import {
  applyPatch,
  setVfsFile,
  getVfsFile,
  hasVfsFile,
  listVfsFiles,
  clearVfs,
  deleteVfsFile,
  driveStore,
} from '../features/google_drive_sync/model/driveStore.ts';

export async function runTransientTCK021aTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const rootDir = process.cwd();

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  // Test 1: Exakt O(N) Search/Replace i VFS Staging
  try {
    clearVfs();
    const filePath = 'workspace/campaigns/brev.md';
    const initialContent = '# Välkommen\nDetta är ett initialt utkast för försoning.\nSlut på meddelande.';
    setVfsFile(filePath, initialContent);
    assert(hasVfsFile(filePath), 'Filen ska finnas i VFS efter setVfsFile');

    const searchBlock = 'Detta är ett initialt utkast för försoning.';
    const replaceBlock = 'Detta är ett förädlat utkast med närhet till försoningsmotorn.';

    const updated = applyPatch(filePath, searchBlock, replaceBlock);
    assert(updated.includes(replaceBlock), 'Returnerat innehåll ska innehålla ersättningsblocket');
    assert(!updated.includes(searchBlock), 'Ursprungligt sökblock ska vara ersatt');
    assert(getVfsFile(filePath) === updated, 'VFS Staging ska spara det uppdaterade innehållet');

    results.push({ name: 'Exakt Search/Replace utförs i VFS Staging och sparar resultat', passed: true });
  } catch (err: any) {
    results.push({ name: 'Exakt Search/Replace utförs i VFS Staging och sparar resultat', passed: false, error: err.message });
  }

  // Test 2: Fuzzy fallback via LF-normalisering (\r\n -> \n)
  try {
    clearVfs();
    const filePath = 'workspace/templates/schema.json';
    const crlfContent = '{\r\n  "status": "DRAFT",\r\n  "version": 1\r\n}';
    setVfsFile(filePath, crlfContent);

    // Sökblock med rena \n
    const searchBlock = '  "status": "DRAFT",\n  "version": 1';
    const replaceBlock = '  "status": "READY",\n  "version": 2';

    const updated = applyPatch(filePath, searchBlock, replaceBlock);
    assert(updated.includes('"status": "READY"'), 'Ska ersätta med LF-normaliserat innehåll');
    assert(updated.includes('"version": 2'), 'Version ska vara uppdaterad till 2');

    results.push({ name: 'LF-normalisering hanterar radbrytningsskillnader transparent', passed: true });
  } catch (err: any) {
    results.push({ name: 'LF-normalisering hanterar radbrytningsskillnader transparent', passed: false, error: err.message });
  }

  // Test 3: Unikhetsskydd med AMBIGUOUS_SEARCH_BLOCK och atomisk återställning
  try {
    clearVfs();
    const filePath = 'workspace/docs/guide.txt';
    const duplicateContent = 'rad1: upprepa\nrad2: unikt\nrad3: upprepa\nrad4: slut';
    setVfsFile(filePath, duplicateContent);

    let threwAmbiguous = false;
    try {
      applyPatch(filePath, 'upprepa', 'ersatt');
    } catch (err: any) {
      if (err.message.includes('AMBIGUOUS_SEARCH_BLOCK') && err.message.includes('omgivande kontextrader')) {
        threwAmbiguous = true;
      }
    }
    assert(threwAmbiguous, 'applyPatch ska kasta AMBIGUOUS_SEARCH_BLOCK med kontextkrav');
    assert(getVfsFile(filePath) === duplicateContent, 'Filinnehållet i VFS ska vara 100% oförändrat vid tvetydighet');

    results.push({ name: 'AMBIGUOUS_SEARCH_BLOCK avvisar tvetydiga träffar och bevarar filatomicitet', passed: true });
  } catch (err: any) {
    results.push({ name: 'AMBIGUOUS_SEARCH_BLOCK avvisar tvetydiga träffar och bevarar filatomicitet', passed: false, error: err.message });
  }

  // Test 4: Felhantering vid FILE_NOT_FOUND och SEARCH_BLOCK_NOT_FOUND
  try {
    clearVfs();
    let threwFileNotFound = false;
    try {
      applyPatch('nonexistent/file.ts', 'foo', 'bar');
    } catch (err: any) {
      if (err.message.includes('FILE_NOT_FOUND')) threwFileNotFound = true;
    }
    assert(threwFileNotFound, 'Ska kasta FILE_NOT_FOUND om filen saknas i VFS');

    setVfsFile('existing.ts', 'const a = 1;');
    let threwBlockNotFound = false;
    try {
      applyPatch('existing.ts', 'finns inte alls', 'ersättning');
    } catch (err: any) {
      if (err.message.includes('SEARCH_BLOCK_NOT_FOUND')) threwBlockNotFound = true;
    }
    assert(threwBlockNotFound, 'Ska kasta SEARCH_BLOCK_NOT_FOUND om sökblocket saknas');

    results.push({ name: 'Kastar semantiska fel för FILE_NOT_FOUND och SEARCH_BLOCK_NOT_FOUND', passed: true });
  } catch (err: any) {
    results.push({ name: 'Kastar semantiska fel för FILE_NOT_FOUND och SEARCH_BLOCK_NOT_FOUND', passed: false, error: err.message });
  }

  // Test 5: driveStore objekt- och VFS-hantering (list, delete, clear)
  try {
    clearVfs();
    driveStore.setVfsFile('a.txt', 'innehåll a');
    driveStore.setVfsFile('b.txt', 'innehåll b');
    const files = driveStore.listVfsFiles();
    assert(files.length === 2 && files.includes('a.txt') && files.includes('b.txt'), 'listVfsFiles ska lista alla filer');

    driveStore.deleteVfsFile('a.txt');
    assert(!driveStore.hasVfsFile('a.txt') && driveStore.hasVfsFile('b.txt'), 'deleteVfsFile ska radera enskild fil');

    driveStore.clearVfs();
    assert(driveStore.listVfsFiles().length === 0, 'clearVfs ska tömma VFS');

    results.push({ name: 'driveStore VFS-hjälpare hanterar listning, radering och rensning deterministiskt', passed: true });
  } catch (err: any) {
    results.push({ name: 'driveStore VFS-hjälpare hanterar listning, radering och rensning deterministiskt', passed: false, error: err.message });
  }

  // Test 6: AST- och miljöspärrar för driveStore.ts
  try {
    const storePath = path.join(rootDir, 'src/features/google_drive_sync/model/driveStore.ts');
    const content = fs.readFileSync(storePath, 'utf8');
    const astRes = checkAstMetrics('src/features/google_drive_sync/model/driveStore.ts', content);
    assert(astRes.valid, `AST-fel: ${astRes.error}`);

    const mockRes = checkNoProductionMocks('src/features/google_drive_sync/model/driveStore.ts', content);
    assert(mockRes.valid, `Mock-fel: ${mockRes.error}`);

    results.push({ name: 'driveStore.ts uppfyller AST-mått och produktionsspärrar mot mockar', passed: true });
  } catch (err: any) {
    results.push({ name: 'driveStore.ts uppfyller AST-mått och produktionsspärrar mot mockar', passed: false, error: err.message });
  }

  // Test 7: Token Gate godkännande i APPROVAL.md
  try {
    const approvalPath = path.join(rootDir, 'doc/LAST_CYCLE/APPROVAL.md');
    assert(fs.existsSync(approvalPath), 'APPROVAL.md måste finnas');
    const content = fs.readFileSync(approvalPath, 'utf8');
    assert(content.includes('TCK-021A-VFS-PATCH-TOKEN'), 'TCK-021A-VFS-PATCH-TOKEN måste finnas godkänd i APPROVAL.md');

    results.push({ name: 'Token Gate godkännande verifierat för TCK-021a i APPROVAL.md', passed: true });
  } catch (err: any) {
    results.push({ name: 'Token Gate godkännande verifierat för TCK-021a i APPROVAL.md', passed: false, error: err.message });
  }

  return results;
}
