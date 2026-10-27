import { EventEnvelope } from './envelope.ts';

export interface IMcpDriveClient {
  uploadFileMultipart(params: {
    name: string;
    folderId: string;
    content: string;
    mimeType: string;
  }): Promise<{ id: string; name: string }>;
}

export interface IMcpWalEngine {
  getWalHistory(): Array<{ status: string; sequenceNumber?: number; [key: string]: any }>;
  appendWalEntry(envelope: EventEnvelope<any>): Promise<{ sequenceNumber: number }>;
  commitWalEntry(sequenceNumber: number): Promise<void>;
  failWalEntry(sequenceNumber: number, error?: string): Promise<void>;
}

export interface IMcpDriveStore {
  applyPatch(filePath: string, searchBlock: string, replaceBlock: string): string;
}
