export interface WorkspaceManifest {
  rootName: string;
  subfolders: string[];
}

export function createDefaultWorkspaceManifest(rootName: string = 'Outreach_Workspace'): WorkspaceManifest {
  return {
    rootName,
    subfolders: ['Campaigns', 'Templates', 'Logs', 'Artifacts'],
  };
}
