export type SwarmAgentRole = 'ORCHESTRATOR' | 'RESEARCHER' | 'OUTREACH_WRITER' | 'CRITIC';

export interface SwarmAgentConfig {
  id: string;
  name: string;
  role: SwarmAgentRole;
  systemInstruction: string;
  avatarColor: string;
  status: 'IDLE' | 'THINKING' | 'EXECUTING_TOOL' | 'DONE' | 'ERROR';
  currentThought?: string;
}

export const DEFAULT_SWARM_ROLES: Record<SwarmAgentRole, SwarmAgentConfig> = {
  ORCHESTRATOR: {
    id: 'agent-orchestrator',
    name: 'Svärmledare (Orchestrator)',
    role: 'ORCHESTRATOR',
    systemInstruction:
      'Du är systemets samordnare. Du delar upp uppdrag, koordinerar specialistagenter och sammanställer konsensus före commit.',
    avatarColor: 'from-purple-500 to-indigo-600',
    status: 'IDLE',
  },
  RESEARCHER: {
    id: 'agent-researcher',
    name: 'Fältanalytiker (Researcher)',
    role: 'RESEARCHER',
    systemInstruction:
      'Du kartlägger mottagarens digitala fotavtryck, branschkontext, utmaningar och identifierar naturliga kontaktpunkter.',
    avatarColor: 'from-blue-500 to-cyan-600',
    status: 'IDLE',
  },
  OUTREACH_WRITER: {
    id: 'agent-writer',
    name: 'Kommunikatör (Outreach Writer)',
    role: 'OUTREACH_WRITER',
    systemInstruction:
      'Du författar personliga, genuina och värdedrivna kontaktbrev på pedagogisk svenska med direkt relevans.',
    avatarColor: 'from-emerald-500 to-teal-600',
    status: 'IDLE',
  },
  CRITIC: {
    id: 'agent-critic',
    name: 'Kvalitetsgranskare (Critic)',
    role: 'CRITIC',
    systemInstruction:
      'Du granskar utkast mot etiska riktlinjer, tonläge och relevans. Tillämpar Fail-Fast vid minsta tecken på spam eller fluff.',
    avatarColor: 'from-amber-500 to-orange-600',
    status: 'IDLE',
  },
};
