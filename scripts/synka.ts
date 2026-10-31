import { execSync } from 'child_process';
import { GoogleGenAI } from '@google/genai';
import { BidiLiveSession } from './bidiLiveRunner.ts';

const ROOT_DIR = process.cwd();
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.LIVE_MODEL || process.env.GEMINI_MODEL || 'gemini-3.8-live';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USER = process.env.GITHUB_USER || 'bjud-in-oss';

function getGitDiffSummary(): string {
  try {
    execSync('git add -A', { cwd: ROOT_DIR });
    const stat = execSync('git diff --cached --stat', { encoding: 'utf-8', cwd: ROOT_DIR });
    const diff = execSync('git diff --cached', { encoding: 'utf-8', cwd: ROOT_DIR });
    return `STAT:\n${stat}\n\nDIFF (trunkerad vid behov):\n${diff.slice(0, 8000)}`;
  } catch {
    return '';
  }
}

async function generateCommitMessageLive(diffText: string): Promise<string> {
  if (!API_KEY) {
    return 'chore: uppdateringar och synkronisering av repot';
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY, apiVersion: 'v1alpha' });
  const runner = new BidiLiveSession({
    ai,
    model: MODEL_NAME,
    systemInstruction: [
      'Du är en teknisk miljömekaniker i Outreach Coordination Engine v10.4.',
      'Ditt uppdrag är att analysera git-diffar och formulera ett kort, konventionellt commit-meddelande på svenska.',
      'Formatet MÅSTE vara:',
      '<typ>(<område>): <Kort rubrik på max 60 tecken>',
      '',
      '- <Konkret punkt 1>',
      '- <Konkret punkt 2>',
      '',
      'Svara ENBART med commit-meddelandet, inga inledande eller avslutande artighetsfraser.'
    ].join('\n'),
  });

  try {
    await runner.connect();
    const prompt = `Analysera denna git-diff och generera commit-meddelandet:\n\n${diffText}`;
    const result = await runner.send(prompt, 60000);
    runner.close();
    return result.trim() || 'chore: synkronisering av repot';
  } catch (err: any) {
    runner.close();
    console.warn('⚠️ Bidi Live WebSocket svarade inte, använder reservtext:', err?.message || err);
    return 'chore: synkronisering av repot';
  }
}

async function main() {
  const customMessage = process.argv.slice(2).join(' ').trim();
  console.log('📦 [SYNK]: Kontrollerar lokalt tillstånd mot GitHub...');

  const status = execSync('git status --porcelain', { encoding: 'utf-8', cwd: ROOT_DIR }).trim();
  let unpushed = '';
  try {
    unpushed = execSync('git log @{u}..HEAD --oneline', { encoding: 'utf-8', cwd: ROOT_DIR }).trim();
  } catch {}

  if (!status && !unpushed) {
    console.log('✅ Inga ändringar eller opushade commits att synka. Repot är helt i fas.');
    process.exit(0);
  }

  if (status) {
    const diffText = getGitDiffSummary();
    let finalMessage = customMessage;
    if (!finalMessage) {
      console.log(`🤖 Genererar intelligent commit-meddelande via Bidi Live WebSocket (${MODEL_NAME})...`);
      finalMessage = await generateCommitMessageLive(diffText);
    }
    finalMessage = finalMessage.replace(/^```[a-z]*\n/i, '').replace(/\n```$/, '').trim();

    console.log(`\n📝 COMMIT-MEDDELANDE:\n${finalMessage}\n`);
    execSync('git add -A', { cwd: ROOT_DIR });
    execSync(`git commit -m "${finalMessage.replace(/"/g, '\\"')}"`, { stdio: 'inherit', cwd: ROOT_DIR });
  }

  const remoteUrl = GITHUB_TOKEN 
    ? `https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/Outreach.git`
    : 'origin';

  console.log('🚀 Pushar till GitHub...');
  execSync(`git push ${remoteUrl} main`, { stdio: 'inherit', cwd: ROOT_DIR });
  console.log('🎉 Synkningen slutfördes framgångsrikt!');
}

main().catch(err => {
  console.error('❌ Synkningsfel:', err.message || err);
  process.exit(1);
});
