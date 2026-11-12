import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();
const CYCLE_LOG_DIR = path.join(ROOT_DIR, 'doc', 'LAST_CYCLE');

export function execCaptured(cmd: string): string {
  try {
    const out = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe', cwd: ROOT_DIR });
    if (out) process.stdout.write(out);
    return out;
  } catch (err: any) {
    const combined = [err?.stdout, err?.stderr].filter(Boolean).join('\n').trim() || err?.message || String(err);
    if (combined) process.stderr.write(combined + '\n');
    throw new Error(combined);
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

export function restoreScriptsBackup() {
  const isMaintRun = process.argv.some(a => a.toUpperCase().includes("MAINT"));
  if (isMaintRun) {
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
