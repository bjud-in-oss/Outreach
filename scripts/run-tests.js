import { execSync } from "child_process";

console.log("🧪 [REGRESSIONSSVIT]: Exekverar domäncentrerade Vitest-sviter...");

try {
  execSync("npx vitest run src/features/", {
    stdio: "inherit",
    cwd: process.cwd(),
  });
  console.log("✅ [REGRESSIONSSVIT]: Alla domäntester godkända.");
} catch (error) {
  console.error("❌ [REGRESSIONSSVIT]: Minst ett domäntest underkändes.");
  process.exit(1);
}
