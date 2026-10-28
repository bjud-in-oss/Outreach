import { GoogleDriveClient } from '../features/google_drive_sync/api/driveClient.ts';

export async function runDriveSyncTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results = [];

  // Test 1: Instansiering och token-lagring i minne
  try {
    const client = new GoogleDriveClient('mock-token-xyz');
    const hasToken = client.hasValidToken();
    results.push({ name: 'GoogleDriveClient initializes with in-memory token', passed: hasToken });
  } catch (err) {
    results.push({ name: 'GoogleDriveClient initializes with in-memory token', passed: false, error: String(err) });
  }

  // Test 2: Validering av filparametrar och MIME-typsdetektering
  try {
    const client = new GoogleDriveClient('mock-token-xyz');
    const mime = client.resolveMimeType('strategi.json');
    results.push({ name: 'Resolve MIME type correctly identifies application/json', passed: mime === 'application/json' });
  } catch (err) {
    results.push({ name: 'Resolve MIME type correctly identifies application/json', passed: false, error: String(err) });
  }

  // Test 3: Workspace-hierarkistruktur
  try {
    const client = new GoogleDriveClient('mock-token-xyz');
    const expectedFolders = ['Campaigns', 'Templates', 'Logs', 'Artifacts'];
    const structure = client.getWorkspaceSubfolders();
    const matches = expectedFolders.every((f) => structure.includes(f));
    results.push({ name: 'Workspace hierarchy contains standard subfolders', passed: matches });
  } catch (err) {
    results.push({ name: 'Workspace hierarchy contains standard subfolders', passed: false, error: String(err) });
  }

  return results;
}
