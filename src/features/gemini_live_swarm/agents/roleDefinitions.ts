export type AgentForce = 'ATT_FORLIKAS' | 'ATT_FOLJA' | 'ATT_VANDA_OM' | 'SERIELL_MOTOR';

export type SwarmAgentRole =
  | 'ORCHESTRATOR'
  | 'RESEARCHER'
  | 'OUTREACH_WRITER'
  | 'CRITIC'
  | 'SERIELL_MOTOR'
  | 'ATT_FORLIKAS'
  | 'ATT_FOLJA'
  | 'ATT_VANDA_OM';

export interface SwarmAgentConfig {
  id: string;
  name: string;
  role: SwarmAgentRole;
  force?: AgentForce;
  systemInstruction: string;
  avatarColor: string;
  status: 'IDLE' | 'THINKING' | 'EXECUTING_TOOL' | 'DONE' | 'ERROR';
  currentThought?: string;
}

export const DEFAULT_SWARM_ROLES: Record<string, SwarmAgentConfig> & {
  ORCHESTRATOR: SwarmAgentConfig;
  RESEARCHER: SwarmAgentConfig;
  OUTREACH_WRITER: SwarmAgentConfig;
  CRITIC: SwarmAgentConfig;
  SERIELL_MOTOR: SwarmAgentConfig;
} = {
  ORCHESTRATOR: {
    id: 'agent-orchestrator',
    name: 'Svärmledare (Orchestrator)',
    role: 'ORCHESTRATOR',
    force: 'ATT_FORLIKAS',
    systemInstruction:
      'Du är systemets samordnare. Du delar upp uppdrag, koordinerar specialistagenter och sammanställer konsensus före commit.',
    avatarColor: 'from-purple-500 to-indigo-600',
    status: 'IDLE',
  },
  RESEARCHER: {
    id: 'agent-researcher',
    name: 'Fältanalytiker (Researcher)',
    role: 'RESEARCHER',
    force: 'ATT_FOLJA',
    systemInstruction:
      'Du kartlägger mottagarens digitala fotavtryck, branschkontext, utmaningar och identifierar naturliga kontaktpunkter.',
    avatarColor: 'from-blue-500 to-cyan-600',
    status: 'IDLE',
  },
  OUTREACH_WRITER: {
    id: 'agent-writer',
    name: 'Kommunikatör (Outreach Writer)',
    role: 'OUTREACH_WRITER',
    force: 'ATT_FOLJA',
    systemInstruction:
      'Du författar personliga, genuina och värdedrivna kontaktbrev på pedagogisk svenska med direkt relevans.',
    avatarColor: 'from-emerald-500 to-teal-600',
    status: 'IDLE',
  },
  CRITIC: {
    id: 'agent-critic',
    name: 'Kvalitetsgranskare (Critic)',
    role: 'CRITIC',
    force: 'ATT_VANDA_OM',
    systemInstruction:
      'Du granskar utkast mot etiska riktlinjer, tonläge och relevans. Tillämpar Fail-Fast vid minsta tecken på spam eller fluff.',
    avatarColor: 'from-amber-500 to-orange-600',
    status: 'IDLE',
  },
  SERIELL_MOTOR: {
    id: 'engine-serial-motor',
    name: 'Seriell Exekveringsmotor (Pipeline Engine)',
    role: 'SERIELL_MOTOR',
    force: 'SERIELL_MOTOR',
    systemInstruction:
      'Du är systemets 4:e motor. Du garanterar deterministisk sekvensering, fasövergångar (1a -> 1b -> 2e -> 3c), beräknar körtidsmetrik och upprätthåller Token Gate-skydd.',
    avatarColor: 'from-cyan-500 to-blue-600',
    status: 'IDLE',
  },
};

export function mapRoleToForce(role: SwarmAgentRole): AgentForce {
  switch (role) {
    case 'ORCHESTRATOR':
    case 'ATT_FORLIKAS':
      return 'ATT_FORLIKAS';
    case 'RESEARCHER':
    case 'OUTREACH_WRITER':
    case 'ATT_FOLJA':
      return 'ATT_FOLJA';
    case 'CRITIC':
    case 'ATT_VANDA_OM':
      return 'ATT_VANDA_OM';
    case 'SERIELL_MOTOR':
      return 'SERIELL_MOTOR';
    default:
      return 'ATT_FOLJA';
  }
}

export function mapForceToRole(force: AgentForce): SwarmAgentRole {
  switch (force) {
    case 'ATT_FORLIKAS':
      return 'ORCHESTRATOR';
    case 'ATT_FOLJA':
      return 'RESEARCHER';
    case 'ATT_VANDA_OM':
      return 'CRITIC';
    case 'SERIELL_MOTOR':
      return 'SERIELL_MOTOR';
  }
}
