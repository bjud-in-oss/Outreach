export type SwarmAgentRole =
  | 'ATT_FORLIKAS'
  | 'ATT_FOLJA'
  | 'ATT_VANDA_OM'
  | 'SERIELL_MOTOR'
  | 'ORCHESTRATOR'
  | 'RESEARCHER'
  | 'OUTREACH_WRITER'
  | 'CRITIC';

export interface SwarmAgentConfig {
  id: string;
  name: string;
  role: SwarmAgentRole;
  systemInstruction: string;
  avatarColor: string;
  status: 'IDLE' | 'THINKING' | 'EXECUTING_TOOL' | 'DONE' | 'ERROR';
  currentThought?: string;
  kraftType?: 'BESLUT_ORKESTRERING' | 'SKAPANDE_EXEKVERING' | 'RISK_GRANSKNING' | 'SERIELL_PIPELINE';
}

/**
 * Standarddefinitioner för SI v10.0 Agentkrafter & 4:e Seriella Motorn
 */
export const DEFAULT_SWARM_ROLES: Record<string, SwarmAgentConfig> = {
  ATT_FORLIKAS: {
    id: 'agent-att-forlikas',
    name: 'Att Förlikas (Orkestratör & Dörrvakt / Wayfinder 1a)',
    role: 'ATT_FORLIKAS',
    systemInstruction:
      'Du är beslutsarkitekt, orkestratör och dörrvakt. Du leder Wayfinder-orientering i Steg 1a, rensar dimma, sammanfogar insikter i 2e (MÄTTNAD: JA), låser kontraktet i 3c (Token Gate) och skyddar källkoden tills godkännande föreligger.',
    avatarColor: 'from-purple-500 to-indigo-600',
    status: 'IDLE',
    kraftType: 'BESLUT_ORKESTRERING',
  },
  ATT_FOLJA: {
    id: 'agent-att-folja',
    name: 'Att Följa (Skapare & Exekutör / Teknisk orientering)',
    role: 'ATT_FOLJA',
    systemInstruction:
      'Du är systemets drivande skaparkraft. Vid aktiv ticket karterar du FSD-moduler, modellerar kontrakt och implementerar domänlogik linjärt från 1a till 3c i ett obrutet framåtsträvande svep.',
    avatarColor: 'from-blue-500 to-cyan-600',
    status: 'IDLE',
    kraftType: 'SKAPANDE_EXEKVERING',
  },
  ATT_VANDA_OM: {
    id: 'agent-att-vanda-om',
    name: 'Att Vända Om (Granskare / Intern riskanalys & Mikro-E2E)',
    role: 'ATT_VANDA_OM',
    systemInstruction:
      'Du anropar oberoende bakgrundsgranskningar vid körtid. Du stresstestar tillstånd, kontrakt och resiliens, tillämpar Fail Fast och validerar transienta mikro-E2E-tester (<3s) innan ändringar commitas.',
    avatarColor: 'from-amber-500 to-orange-600',
    status: 'IDLE',
    kraftType: 'RISK_GRANSKNING',
  },
  SERIELL_MOTOR: {
    id: 'agent-seriell-motor',
    name: 'Seriell Motor (SI v10.0 Linjär Exekveringspipeline)',
    role: 'SERIELL_MOTOR',
    systemInstruction:
      'Fristående automatiserad motor som kör hela SI v10.0-kedjan linjärt i ett obrutet svep: 1a (Förstå) ➔ 1b (Kartlägga) ➔ 2e (Syntetisera/Mättnad) ➔ 3c (Källkodsspecifikation & Token Gate) ➔ 4 (Mikro-E2E & Verkställande).',
    avatarColor: 'from-emerald-500 to-teal-600',
    status: 'IDLE',
    kraftType: 'SERIELL_PIPELINE',
  },

  // Bakåtkompatibilitet för äldre anrop
  ORCHESTRATOR: {
    id: 'agent-att-forlikas',
    name: 'Att Förlikas (Orkestratör & Dörrvakt / Wayfinder 1a)',
    role: 'ATT_FORLIKAS',
    systemInstruction:
      'Du är systemets samordnare och dörrvakt. Du delar upp uppdrag, koordinerar specialistagenter och sammanställer konsensus före commit.',
    avatarColor: 'from-purple-500 to-indigo-600',
    status: 'IDLE',
    kraftType: 'BESLUT_ORKESTRERING',
  },
  RESEARCHER: {
    id: 'agent-att-folja',
    name: 'Att Följa (Skapare & Exekutör / Teknisk orientering)',
    role: 'ATT_FOLJA',
    systemInstruction:
      'Du kartlägger målgrupps- och branschkontext, FSD-moduler och modellerar dataflöden i ett obrutet linjärt svep.',
    avatarColor: 'from-blue-500 to-cyan-600',
    status: 'IDLE',
    kraftType: 'SKAPANDE_EXEKVERING',
  },
  OUTREACH_WRITER: {
    id: 'agent-writer-legacy',
    name: 'Kommunikatör (Outreach Writer)',
    role: 'OUTREACH_WRITER',
    systemInstruction:
      'Du författar personliga, genuina och värdedrivna kontaktbrev på pedagogisk svenska med direkt relevans.',
    avatarColor: 'from-blue-400 to-indigo-500',
    status: 'IDLE',
    kraftType: 'SKAPANDE_EXEKVERING',
  },
  CRITIC: {
    id: 'agent-att-vanda-om',
    name: 'Att Vända Om (Granskare / Intern riskanalys & Mikro-E2E)',
    role: 'ATT_VANDA_OM',
    systemInstruction:
      'Du granskar utkast mot etiska riktlinjer, tonläge och resiliens. Tillämpar Fail Fast vid minsta avvikelse.',
    avatarColor: 'from-amber-500 to-orange-600',
    status: 'IDLE',
    kraftType: 'RISK_GRANSKNING',
  },
};

/**
 * Returnerar de 3 aktiva SI v10.0-krafterna för direkt övervakning
 */
export function getActiveAgentKrafter(): SwarmAgentConfig[] {
  return [
    DEFAULT_SWARM_ROLES.ATT_FORLIKAS,
    DEFAULT_SWARM_ROLES.ATT_FOLJA,
    DEFAULT_SWARM_ROLES.ATT_VANDA_OM,
  ];
}

/**
 * Returnerar den 4:e fristående seriella motorn
 */
export function getSerialMotorAgent(): SwarmAgentConfig {
  return DEFAULT_SWARM_ROLES.SERIELL_MOTOR;
}
