import { PendulumStore } from './pendulumStore.ts';

export interface TurnBoundaryInput {
  text: string;
  isFinal: boolean;
  clientMessageId?: string;
  sourceRole?: string;
}

export interface TurnBoundaryResult {
  isFinal: boolean;
  isQuestion: boolean;
  shouldTransition: boolean;
  reason: 'PARTIAL_IGNORED' | 'NON_QUESTION' | 'SEMANTIC_QUESTION' | 'EMPTY_TEXT';
}

const QUESTION_PATTERNS = [
  /\?$/,
  /^(vad|vem|hur|varför|när|vilken|vilket|vilka|var)\b/i,
  /^(kan du|skulle du|vill du|har du|är det|finns det)\b/i,
  /\b(vad tycker du|berätta om|hjälp mig med|vad menar du)\b/i,
];

export function isSemanticQuestion(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return QUESTION_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function analyzeTurnBoundary(input: TurnBoundaryInput): TurnBoundaryResult {
  const trimmed = input.text.trim();
  if (!trimmed) {
    return {
      isFinal: input.isFinal,
      isQuestion: false,
      shouldTransition: false,
      reason: 'EMPTY_TEXT',
    };
  }

  // Guardrail: Endast isFinal: true får utvärderas semantiskt för transition till TALK
  if (!input.isFinal) {
    return {
      isFinal: false,
      isQuestion: isSemanticQuestion(trimmed),
      shouldTransition: false,
      reason: 'PARTIAL_IGNORED',
    };
  }

  const isQuestion = isSemanticQuestion(trimmed);
  if (isQuestion) {
    return {
      isFinal: true,
      isQuestion: true,
      shouldTransition: true,
      reason: 'SEMANTIC_QUESTION',
    };
  }

  return {
    isFinal: true,
    isQuestion: false,
    shouldTransition: false,
    reason: 'NON_QUESTION',
  };
}

export function handleIncomingTranscript(
  input: TurnBoundaryInput,
  store: PendulumStore
): TurnBoundaryResult {
  const result = analyzeTurnBoundary(input);
  if (result.shouldTransition) {
    store.setMode('TALK', result.reason);
  }
  return result;
}
