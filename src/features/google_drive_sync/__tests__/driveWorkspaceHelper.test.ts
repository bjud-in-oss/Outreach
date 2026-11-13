import { describe, it, expect } from 'vitest';
import { GoogleDriveClient } from '../api/driveClient';
import { createDefaultWorkspaceManifest } from '../model/driveWorkspaceHelper';

describe('TCK-056: Transient Drive Sync Workspace Tests', () => {
  it('GoogleDriveClient initializes with in-memory token', () => {
    const client = new GoogleDriveClient('mock-token-xyz');
    const hasToken = client.hasValidToken();
    expect(hasToken).toBe(true);
  });

  it('Resolve MIME type correctly identifies application/json', () => {
    const client = new GoogleDriveClient('mock-token-xyz');
    const mime = client.resolveMimeType('strategi.json');
    expect(mime).toBe('application/json');
  });

  it('Workspace hierarchy contains standard subfolders', () => {
    const client = new GoogleDriveClient('mock-token-xyz');
    const expectedFolders = ['Campaigns', 'Templates', 'Logs', 'Artifacts'];
    const structure = client.getWorkspaceSubfolders();
    const matches = expectedFolders.every((f) => structure.includes(f));
    expect(matches).toBe(true);
  });

  it('createDefaultWorkspaceManifest returns correct default structure', () => {
    const manifest = createDefaultWorkspaceManifest('Outreach_Workspace');
    expect(manifest.rootName).toBe('Outreach_Workspace');
    expect(manifest.subfolders).toEqual(['Campaigns', 'Templates', 'Logs', 'Artifacts']);
  });
});
