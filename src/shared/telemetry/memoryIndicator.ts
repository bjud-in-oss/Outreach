export function formatMemoryIndicator(metric?: any): string {
  if (!metric || typeof metric !== 'object') {
    return '0 / 8192 tokens';
  }
  return `${metric.usedTokens ?? 0} / ${metric.maxTokens ?? 8192} tokens`;
}
