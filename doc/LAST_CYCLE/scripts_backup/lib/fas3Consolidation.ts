import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { execSync } from 'child_process';
import { BidiLiveSession } from '../bidiLiveRunner.js';

const ROOT_DIR = process.cwd();
const FEATURE_INDEX_PATH = path.join(ROOT_DIR, 'doc', 'FEATURE_INDEX.json');
const TICKETS_PATH = path.join(ROOT_DIR, 'doc', 'TICKETS.md');

export function konsolideraTest(
  targetDomain: string,
  ticketId: string,
  testExt: string,
  createdModules: string[],
  transientTestFullPath: string
) {
  console.log('📦 Fas 3: Konsoliderar godkänt test till domänens permanenta testsvit...');
  const permanentTestDir = path.join(ROOT_DIR, 'src', 'features', targetDomain, '__tests__');
  fs.mkdirSync(permanentTestDir, { recursive: true });

  const primaryModule = createdModules[0] || ticketId.toLowerCase();
  const permanentTestPath = path.join(permanentTestDir, `${path.basename(primaryModule)}.test.${testExt}`);
  fs.mkdirSync(path.dirname(permanentTestPath), { recursive: true });

  let transientTestContent = fs.existsSync(transientTestFullPath) ? fs.readFileSync(transientTestFullPath, 'utf-8') : '';
  transientTestContent = transientTestContent
    .replace(new RegExp(`'\\.\\./features/${targetDomain}'`, 'g'), "'..'")
    .replace(new RegExp(`"\\.\\./features/${targetDomain}"`, 'g'), '".."')
    .replace(new RegExp(`'\\.\\./features/${targetDomain}/`, 'g'), "'../")
    .replace(new RegExp(`"\\.\\./features/${targetDomain}/`, 'g'), '"../')
    .replace(/'\.\.\/features\//g, "'../../")
    .replace(/"\.\.\/features\//g, '"../../')
    .replace(/'\.\.\/shared\//g, "'../../../shared/")
    .replace(/"\.\.\/shared\//g, '"../../../shared/');

  fs.writeFileSync(permanentTestPath, transientTestContent, 'utf-8');
  fs.unlinkSync(transientTestFullPath);
}

export function synkaDomanBarrel(targetDomain: string, createdModules: string[]) {
  const barrelPath = path.join(ROOT_DIR, `src/features/${targetDomain}/index.ts`);
  if (fs.existsSync(barrelPath)) {
    let barrelContent = fs.readFileSync(barrelPath, 'utf-8');
    for (const mod of createdModules) {
      const exp = `export * from './${mod}';`;
      if (!barrelContent.includes(`./${mod}`)) {
        barrelContent = barrelContent.trim() + `\n${exp}\n`;
        console.log(`   🔗 [BARREL-UPDATE]: Exporterar ./${mod} i index.ts`);
      }
    }
    fs.writeFileSync(barrelPath, barrelContent, 'utf-8');
  }
}

export function uppdateraFeatureIndex(targetDomain: string, createdModules: string[]) {
  console.log('🗺️  Fas 3: Synkroniserar doc/FEATURE_INDEX.json...');
  try {
    let indexData: any = { features: {} };
    if (fs.existsSync(FEATURE_INDEX_PATH)) indexData = JSON.parse(fs.readFileSync(FEATURE_INDEX_PATH, 'utf-8'));
    if (!indexData.features[targetDomain]) indexData.features[targetDomain] = { files: [], exports: [] };
    for (const mod of createdModules) {
      if (!indexData.features[targetDomain].files.includes(`${mod}.ts`)) {
        indexData.features[targetDomain].files.push(`${mod}.ts`);
      }
    }
    fs.writeFileSync(FEATURE_INDEX_PATH, JSON.stringify(indexData, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn(`⚠️ [FAS 3]: Kunde inte uppdatera FEATURE_INDEX.json: ${err?.message || err}`);
  }
}

export function uppdateraBiljettstatus(ticketId: string) {
  console.log('📋 Fas 3: Uppdaterar biljettstatus i doc/TICKETS.md...');
  try {
    if (fs.existsSync(TICKETS_PATH)) {
      let ticketsContent = fs.readFileSync(TICKETS_PATH, 'utf-8');
      const ticketPattern = new RegExp(`\\[ \\] \\*\\*${ticketId}\\*\\*`, 'g');
      if (ticketPattern.test(ticketsContent)) {
        ticketsContent = ticketsContent.replace(ticketPattern, `[x] **${ticketId}** (VERIFIED)`);
        fs.writeFileSync(TICKETS_PATH, ticketsContent, 'utf-8');
      }
    }
  } catch (err: any) {
    console.warn(`⚠️ [FAS 3]: Kunde inte uppdatera TICKETS.md: ${err?.message || err}`);
  }
}

export async function hanteraTrepunktsbesiktning(
  ticketId: string,
  ai: any,
  systemInstruction: string
) {
  console.log('\n🛡️ [SANDBOX]: Systemförändring (MAINT) detekterad. Genererar besiktningsrapport...');
    
  const diff = execSync('git diff --stat', { encoding: 'utf-8', cwd: ROOT_DIR });
  const diffContent = execSync('git diff', { encoding: 'utf-8', cwd: ROOT_DIR });
  
  const inspectionRunner = new BidiLiveSession({
    ai, model: 'gemini-3.8-live', systemInstruction,
  });
  
  const inspectionPrompt = `Du har just utfört ett underhållsarbete (TCK-MAINT).\nHär är git diffen över vad du ändrat:\n\n${diffContent}\n\nGe mig en Trepunktsbesiktning enligt följande format (KORT och på svenska):\n\n**Möjlighet (Avsikt):** [Vad gör ändringen för nytta?]\n**Grindanalys (Faronivå):** [Markera 'FÖRHÖJD RISK: Grindändring' om du ändrat i verify-architecture.js eller ts.js. Annars 'LÅG RISK: Rutinunderhåll']\n**Ångerrätt:** [Ett n (nej) kasserar omedelbart denna ändring.]`;
  
  const inspectionReport = await inspectionRunner.send(inspectionPrompt);
  console.log('\n' + inspectionReport + '\n');
  console.log('--- GIT DIFF STAT ---');
  console.log(diff);
  
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  
  let decisionMade = false;
  while (!decisionMade) {
    const answer = await new Promise<string>(resolve => {
      rl.question('\n❓ [j = Godkänn kod] [s = Spara spec, återställ kod] [n = Kassera allt] [Valfri text = Fråga AI]: ', resolve);
    });
    
    const input = answer.trim().toLowerCase();
    if (input === 'j') {
      decisionMade = true;
    } else if (input === 's') {
      console.log('📝 Sparar specifikationen i doc/.TICKETS/ och återställer källkoden...');
      const specPath = path.join(ROOT_DIR, "doc", ".TICKETS", `${ticketId}.md`);
      const specContent = `# ${ticketId}: Planerad Systemförbättring\n\n## BESIKTNINGSRAPPORT\n${inspectionReport}\n\n## FÖRESLAGEN KOD-DIFF\n\`\`\`diff\n${diffContent}\`\`\`\n`;
      fs.writeFileSync(specPath, specContent, "utf-8");
      
      execSync("git checkout -- src/ scripts/ package.json vite.config.ts 2>/dev/null || true", { cwd: ROOT_DIR });
      console.log(`✅ Källkoden återställd. Specifikationen är sparad i doc/.TICKETS/${ticketId}.md`);
      rl.close();
      inspectionRunner.close();
      process.exit(0);
    } else if (input === 'n') {
      console.log('🔄 Avbryter och rullar tillbaka alla ändringar...');
      execSync('git reset --hard && git clean -fd', { stdio: 'inherit', cwd: ROOT_DIR });
      console.log('✅ Systemet är intakt (allt kasserat).');
      rl.close();
      inspectionRunner.close();
      process.exit(0);
    } else if (input !== '') {
      console.log('\n   🤔 Frågar modellen...');
      const reply = await inspectionRunner.send(`Människan ställer en fråga inför godkännandet: "${answer}". Svara kort och ärligt utifrån diffen.`);
      console.log('\n' + reply + '\n');
    }
  }
  rl.close();
  inspectionRunner.close();
}

export function genomforGitCommitPush(isMaint: boolean, ticketId: string, targetDomain: string) {
  try {
    console.log('\n📦 Genomför automatisk Git Commit & Push till GitHub...');
    execSync('git add doc/ src/ scripts/ package.json vite.config.ts', { cwd: ROOT_DIR });
    const commitMsg = isMaint 
      ? `chore(infra): ${ticketId} systemunderhåll autonomt applicerat och mänskligt verifierat` 
      : `feat(${targetDomain}): ${ticketId} autonomt byggd, konsoliderad och verifierad`;
    execSync(`git commit -m "${commitMsg}"`, { cwd: ROOT_DIR });
    
    const ghToken = process.env.GITHUB_TOKEN;
    if (ghToken) {
      const ghUser = process.env.GITHUB_USER || 'bjud-in-oss';
      const remoteUrl = `https://${ghUser}:${ghToken}@github.com/${ghUser}/Outreach.git`;
      execSync(`git push ${remoteUrl} main`, { stdio: 'inherit', cwd: ROOT_DIR });
      console.log('🚀 Kodbasen är synkad till GitHub via .env token!');
    } else {
      execSync('git push origin main', { stdio: 'inherit', cwd: ROOT_DIR });
    }
  } catch (gitErr: any) {
    console.warn('⚠️ Git push krävde manuell intervention:', gitErr.message);
  }
}
