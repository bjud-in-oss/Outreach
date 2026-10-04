import fs from 'node:fs';
import path from 'node:path';
import { checkAstMetrics, checkNoProductionMocks } from '../../scripts/drivers/ts.js';
import { McpServer, createUnifiedMcpServer } from '../features/mcp_bridge/server/mcpServer.ts';
import { driveStore } from '../features/google_drive_sync/model/driveStore.ts';
import { WalEngine } from '../features/wal_logger/engine/walEngine.ts';

export async function runTransientTCK021bTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const rootDir = process.cwd();

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  // Test 1: MCP Server listar apply_code_patch via tools/list
  try {
    const wal = new WalEngine();
    const server = createUnifiedMcpServer(undefined, wal, driveStore);
    const listRes = await server.handleJsonRpcRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
    });

    assert(!('error' in listRes), 'tools/list ska inte returnera fel');
    const tools = (listRes as any).result?.tools || [];
    const patchTool = tools.find((t: any) => t.name === 'apply_code_patch');
    assert(Boolean(patchTool), 'apply_code_patch ska finnas registrerat i MCP-verktygslistan');
    assert(
      patchTool.inputSchema.properties.searchBlock.description.includes('omgivande'),
      'searchBlock ska ha hjälpsam prompt-beskrivning för kontext'
    );

    results.push({ name: 'apply_code_patch är registrerat och exponerat via tools/list', passed: true });
  } catch (err: any) {
    results.push({ name: 'apply_code_patch är registrerat och exponerat via tools/list', passed: false, error: err.message });
  }

  // Test 2: Framgångsrikt tools/call med O(N) patch i VFS
  try {
    const wal = new WalEngine();
    const server = createUnifiedMcpServer(undefined, wal, driveStore);

    const testFile = 'campaigns/investor_outreach.md';
    driveStore.setVfsFile(
      testFile,
      '## Bakgrund\nDetta är första versionen av utkastet.\n## Avslutning\nHälsningar teamet.'
    );

    const callRes = await server.handleJsonRpcRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'apply_code_patch',
        arguments: {
          filePath: testFile,
          searchBlock: 'Detta är första versionen av utkastet.',
          replaceBlock: 'Detta är en förädlad version styrd av försoningsmotorn.',
        },
      },
    });

    assert(!('error' in callRes), 'Framgångsrik tools/call får inte returnera JSON-RPC fel');
    const result = (callRes as any).result;
    assert(!result.isError, 'isError ska inte vara satt vid framgång');
    assert(result.content[0].text.includes('COMMITTED'), 'Resultatet ska bekräfta att WAL blivit COMMITTED');

    const updated = driveStore.getVfsFile(testFile);
    assert(
      Boolean(updated?.includes('Detta är en förädlad version styrd av försoningsmotorn.')),
      'Filinnehållet i VFS ska ha uppdaterats'
    );

    results.push({ name: 'tools/call utför patch i VFS och bekräftar COMMITTED', passed: true });
  } catch (err: any) {
    results.push({ name: 'tools/call utför patch i VFS och bekräftar COMMITTED', passed: false, error: err.message });
  }

  // Test 3: WAL transaktionsloggning (PENDING -> COMMITTED)
  try {
    const wal = new WalEngine();
    const server = createUnifiedMcpServer(undefined, wal, driveStore);

    const testFile = 'campaigns/wal_audit_test.txt';
    driveStore.setVfsFile(testFile, 'initial rad 1\ninitial rad 2');

    await server.handleJsonRpcRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'apply_code_patch',
        arguments: {
          filePath: testFile,
          searchBlock: 'initial rad 2',
          replaceBlock: 'uppdaterad rad 2',
        },
      },
    });

    const history = wal.getWalHistory();
    const patchEntry = history.find((h) => h.envelope.type === 'code.patch.applied');
    assert(Boolean(patchEntry), 'Händelse med typ code.patch.applied ska finnas i WAL');
    assert(patchEntry?.status === 'COMMITTED', 'Status i WAL ska ha avancerat till COMMITTED');

    results.push({ name: 'WAL loggar transaktion med typ code.patch.applied och status COMMITTED', passed: true });
  } catch (err: any) {
    results.push({ name: 'WAL loggar transaktion med typ code.patch.applied och status COMMITTED', passed: false, error: err.message });
  }

  // Test 4: Tvetydigt sökblock ger isError: true utan att kasta JSON-RPC -32603
  try {
    const wal = new WalEngine();
    const server = createUnifiedMcpServer(undefined, wal, driveStore);

    const testFile = 'campaigns/duplicate_block.txt';
    const originalContent = 'dubblerad rad\nunikt innehåll\ndubblerad rad';
    driveStore.setVfsFile(testFile, originalContent);

    const callRes = await server.handleJsonRpcRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'apply_code_patch',
        arguments: {
          filePath: testFile,
          searchBlock: 'dubblerad rad',
          replaceBlock: 'ersättning',
        },
      },
    });

    assert(!('error' in callRes), 'Ska inte kasta JSON-RPC -32603 protokollfel vid tvetydighet');
    const result = (callRes as any).result;
    assert(result.isError === true, 'Ska sätta isError: true vid AMBIGUOUS_SEARCH_BLOCK');
    assert(
      result.content[0].text.includes('Sökblocket var inte unikt eller kunde inte hittas'),
      'Ska ge handledande system-nudge i texten'
    );
    assert(driveStore.getVfsFile(testFile) === originalContent, 'Filinnehållet i VFS ska förbli orört vid tvetydighet');

    const history = wal.getWalHistory();
    const failedEntry = history[history.length - 1];
    assert(failedEntry?.status === 'FAILED', 'WAL ska markera den misslyckade patchen som FAILED');

    results.push({ name: 'AMBIGUOUS_SEARCH_BLOCK returnerar isError: true med system-nudge utan RPC-krasch', passed: true });
  } catch (err: any) {
    results.push({ name: 'AMBIGUOUS_SEARCH_BLOCK returnerar isError: true med system-nudge utan RPC-krasch', passed: false, error: err.message });
  }

  // Test 5: Saknat sökblock eller fil returnerar isError: true
  try {
    const wal = new WalEngine();
    const server = createUnifiedMcpServer(undefined, wal, driveStore);

    const callRes = await server.handleJsonRpcRequest({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'apply_code_patch',
        arguments: {
          filePath: 'finns_inte.txt',
          searchBlock: 'något',
          replaceBlock: 'annat',
        },
      },
    });

    assert(!('error' in callRes), 'Ska inte kasta JSON-RPC protokollfel');
    const result = (callRes as any).result;
    assert(result.isError === true, 'isError ska vara true vid saknad fil');

    results.push({ name: 'Saknad fil eller sökblock returnerar isError: true mjukt', passed: true });
  } catch (err: any) {
    results.push({ name: 'Saknad fil eller sökblock returnerar isError: true mjukt', passed: false, error: err.message });
  }

  // Test 6: AST- och miljöspärrar för codePatchTools.ts och mcpServer.ts
  try {
    const toolFile = path.join(rootDir, 'src/features/mcp_bridge/tools/codePatchTools.ts');
    const serverFile = path.join(rootDir, 'src/features/mcp_bridge/server/mcpServer.ts');

    const toolContent = fs.readFileSync(toolFile, 'utf8');
    const serverContent = fs.readFileSync(serverFile, 'utf8');

    const astTool = checkAstMetrics('src/features/mcp_bridge/tools/codePatchTools.ts', toolContent);
    assert(astTool.valid, `AST tool fel: ${astTool.error}`);

    const astServer = checkAstMetrics('src/features/mcp_bridge/server/mcpServer.ts', serverContent);
    assert(astServer.valid, `AST server fel: ${astServer.error}`);

    const mockTool = checkNoProductionMocks('src/features/mcp_bridge/tools/codePatchTools.ts', toolContent);
    assert(mockTool.valid, `Mock tool fel: ${mockTool.error}`);

    results.push({ name: 'codePatchTools.ts och mcpServer.ts uppfyller AST-mått och spärrar', passed: true });
  } catch (err: any) {
    results.push({ name: 'codePatchTools.ts och mcpServer.ts uppfyller AST-mått och spärrar', passed: false, error: err.message });
  }

  // Test 7: Token Gate godkännande i APPROVAL.md
  try {
    const approvalPath = path.join(rootDir, 'doc/LAST_CYCLE/APPROVAL.md');
    assert(fs.existsSync(approvalPath), 'APPROVAL.md måste finnas');
    const content = fs.readFileSync(approvalPath, 'utf8');
    assert(content.includes('TCK-021B-MCP-PATCH-TOKEN'), 'TCK-021B-MCP-PATCH-TOKEN måste finnas godkänd i APPROVAL.md');

    results.push({ name: 'Token Gate godkännande verifierat för TCK-021b i APPROVAL.md', passed: true });
  } catch (err: any) {
    results.push({ name: 'Token Gate godkännande verifierat för TCK-021b i APPROVAL.md', passed: false, error: err.message });
  }

  return results;
}
