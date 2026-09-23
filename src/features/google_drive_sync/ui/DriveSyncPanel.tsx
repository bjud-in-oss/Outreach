import React, { useState } from 'react';
import { HardDrive, FolderCheck, RefreshCw, KeyRound, AlertTriangle, CheckCircle, Upload } from 'lucide-react';
import { useDriveStore } from '../model/driveStore.ts';

interface DriveSyncPanelProps {
  onNotifyEvent?: (source: string, type: string, data: any) => void;
}

export const DriveSyncPanel: React.FC<DriveSyncPanelProps> = ({ onNotifyEvent }) => {
  const { state, setAccessToken, initWorkspace, refreshFiles, client } = useDriveStore();
  const [tokenInput, setTokenInput] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleConnect = () => {
    if (!tokenInput.trim()) return;
    setAccessToken(tokenInput.trim(), 'mattias@inventeras.com');
    onNotifyEvent?.('outreach/drive-sync', 'drive.auth.connected', {
      user: 'mattias@inventeras.com',
      timestamp: new Date().toISOString(),
    });
  };

  const handleDemoConnect = () => {
    const demoToken = 'ya29.demo_token_' + Math.random().toString(36).substring(7);
    setAccessToken(demoToken, 'demo-operator@outreach.local');
    onNotifyEvent?.('outreach/drive-sync', 'drive.auth.demo_connected', {
      user: 'demo-operator@outreach.local',
      timestamp: new Date().toISOString(),
    });
  };

  const handleInitWorkspace = async () => {
    setIsInitializing(true);
    try {
      const folders = await initWorkspace();
      onNotifyEvent?.('outreach/drive-sync', 'drive.workspace.initialized', {
        folders,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Fel visas i store state
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCreateTestDocument = async () => {
    if (!state.workspaceFolders?.campaignsId) return;
    setUploadStatus('Laddar upp utkast...');
    try {
      const docName = `Kampanj-Utkast-${Date.now().toString().slice(-4)}.md`;
      const content = `# Strategiskt Outreach-Brev\nGenererat av Outreach Samordningsmotor\n\nHej! Vi följer upp det gemensamma initiativet kring AI-automation...`;
      const uploaded = await client.uploadFileMultipart({
        name: docName,
        folderId: state.workspaceFolders.campaignsId,
        content,
        mimeType: 'text/plain',
      });
      setUploadStatus(`Skapad: ${uploaded.name}`);
      onNotifyEvent?.('outreach/drive-sync', 'drive.file.created', {
        fileId: uploaded.id,
        name: uploaded.name,
        folder: 'Campaigns',
      });
      await refreshFiles(state.workspaceFolders.campaignsId);
    } catch (err: any) {
      setUploadStatus(`Fel vid skapande: ${err.message}`);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Google Drive Workspace Sync</h2>
            <p className="text-xs text-slate-400">Tvåvägssynkning och automatisk mapphierarki i Google Drive</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {state.isAuthenticated ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Ansluten ({state.userEmail})
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Ej ansluten
            </span>
          )}
        </div>
      </div>

      {state.error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <div>
            <span className="font-semibold">Fail-Fast Diagnostik: </span>
            {state.error}
          </div>
        </div>
      )}

      {!state.isAuthenticated ? (
        <div className="space-y-3 bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
          <label className="text-xs font-medium text-slate-300 block">
            Google Workspace Access Token (In-memory, sparas aldrig persistent)
          </label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="Klistra in OAuth Bearer token..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleConnect}
              disabled={!tokenInput.trim()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Anslut Token
            </button>
            <button
              onClick={handleDemoConnect}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Anslut med in-memory mock-token för snabbverifiering"
            >
              Snabbanslut (Demo)
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            För skarp anslutning används Google Cloud Workspace OAuth. Token behålls enbart under aktiv session.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleInitWorkspace}
                disabled={isInitializing}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <FolderCheck className="w-3.5 h-3.5" />
                <span>{isInitializing ? 'Initierar struktur...' : 'Initiera Outreach Workspace'}</span>
              </button>
              {state.workspaceFolders && (
                <button
                  onClick={handleCreateTestDocument}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Skapa kampanjdokument</span>
                </button>
              )}
            </div>
            <button
              onClick={() => setAccessToken(null)}
              className="text-xs text-slate-400 hover:text-red-400 underline cursor-pointer"
            >
              Koppla från
            </button>
          </div>

          {uploadStatus && (
            <p className="text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
              {uploadStatus}
            </p>
          )}

          {state.workspaceFolders && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
              {['Campaigns', 'Templates', 'Logs', 'Artifacts'].map((folder) => (
                <div
                  key={folder}
                  className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center space-x-2"
                >
                  <FolderCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <div className="text-xs font-medium text-slate-200 truncate">{folder}</div>
                    <div className="text-[10px] text-slate-500">Aktiv & Synkad</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
