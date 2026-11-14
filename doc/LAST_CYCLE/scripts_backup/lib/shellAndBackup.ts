import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();
const CYCLE_LOG_DIR = path.join(ROOT_DIR, 'doc', 'LAST_CYCLE');

const ERROR_LOG_PATH = path.join(CYCLE_LOG_DIR, 'LAST_ERROR.log');

export function execCaptured(cmd: string): string {
  try {
    const out = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe', cwd: ROOT_DIR });
    if (out) process.stdout.write(out);
    return out;
  } catch (err: any) {
    const combined = [err?.stdout, err?.stderr].filter(Boolean).join('\n').trim() || err?.message || String(err);
    fs.mkdirSync(CYCLE_LOG_DIR, { recursive: true });
    
    let logOutput = combined;
    const lines = combined.split('\n');
    if (lines.length > 30) {
       const head = lines.slice(0, 15);
       const tail = lines.slice(-15);
       logOutput = [...head, "\n... (terminalutdata trunkerad: visar de första 15 och sista 15 raderna)\n...", ...tail].join('\n');
       fs.writeFileSync(ERROR_LOG_PATH, combined, 'utf-8');
    }
    
    process.stderr.write(logOutput + '\n');
    throw new Error(logOutput);
  }
}

export function createVerifiedScriptsBackup() {
  const backupDir = path.join(CYCLE_LOG_DIR, "scripts_backup");
  console.log("🛡️ [MAINT-SÄKERHETSNÄT]: Förbereder och validerar scripts/ för backup...");
  
  try {
    execSync('git reset HEAD -- src/ scripts/ 2>/dev/null || true', { cwd: ROOT_DIR });
    execSync('git clean -fd src/ scripts/', { cwd: ROOT_DIR });

    execSync('node scripts/verify-architecture.js', { stdio: 'inherit', cwd: ROOT_DIR });
    execSync('npx esbuild scripts/run-planera-live.ts scripts/run-path.ts --bundle --platform=node --packages=external --outdir=/tmp/outreach-script-check', { stdio: 'inherit', cwd: ROOT_DIR });

    fs.rmSync(backupDir, { recursive: true, force: true });
    fs.mkdirSync(backupDir, { recursive: true });
    fs.cpSync(path.join(ROOT_DIR, "scripts"), backupDir, { recursive: true });
    console.log("🛡️ [MAINT-SÄKERHETSNÄT]: Säkerhetskopia av scripts/ skapad och validerad i doc/LAST_CYCLE/scripts_backup/\n");
  } catch (e: any) {
    console.error("❌ [MAINT-SÄKERHETSNÄT]: Backup misslyckades. Källkod eller arkitektur är trasig:", e.message);
    throw e;
  }
}

export function restoreScriptsBackup() {
  const isMaintRun = process.argv.some(a => a.toUpperCase().includes("MAINT"));
  if (isMaintRun) {
    try {
      execSync('git reset HEAD -- src/ scripts/ 2>/dev/null || true', { cwd: ROOT_DIR });
      execSync('git clean -fd src/ scripts/', { cwd: ROOT_DIR });
    } catch (err: any) {
       console.warn("⚠️ [MAINT-ÅTERSTÄLLNING]: Kunde inte städa git:", err?.message || err);
    }
    
    const backupDir = path.join(CYCLE_LOG_DIR, "scripts_backup");
    if (fs.existsSync(backupDir)) {
      try {
        fs.cpSync(backupDir, path.join(ROOT_DIR, "scripts"), { recursive: true });
        console.log("🛡️ [MAINT-ÅTERSTÄLLNING]: scripts/ har automatiskt återställts från säkerhetskopian.");
      } catch (err: any) {
        console.warn("⚠️ [MAINT-ÅTERSTÄLLNING]: Kunde inte återställa scripts/:", err?.message || err);
      }
    }
  }
}

export function dumpCrashDiff() {
  try {
    execSync("git add -N src/ scripts/ 2>/dev/null || true", { cwd: ROOT_DIR });
    const diff = execSync("git diff src/ scripts/", { encoding: "utf-8", cwd: ROOT_DIR });
    if (diff && diff.trim()) {
      fs.mkdirSync(CYCLE_LOG_DIR, { recursive: true });
      fs.writeFileSync(path.join(CYCLE_LOG_DIR, "CRASH_DIFF.patch"), diff, "utf-8");
      console.log("\n📄 [KRASCH-DIFF SPARAD]: doc/LAST_CYCLE/CRASH_DIFF.patch");
      console.log("────────────────── FYSISK KÄLLKODSDIFF (src/ & scripts/) ──────────────────");
      console.log(diff.slice(0, 2500) + (diff.length > 2500 ? "\n... (trunkerad vid 2500 tecken)" : ""));
      console.log("───────────────────────────────────────────────────────────────────────────\n");
    }
  } catch (err: any) {
    console.warn("⚠️ [KRASCH-DIFF]: Kunde inte spara diff:", err?.message || err);
  }
}
