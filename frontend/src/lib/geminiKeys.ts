export function splitGeminiKeys(rawKeys: string | null | undefined): string[] {
  if (!rawKeys) {
    return [];
  }

  return Array.from(
    new Set(
      rawKeys
        .split(/[\n,;|]+/)
        .map((key) => key.trim())
        .filter(Boolean)
    )
  );
}

export function isGeminiQuotaError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('quota') ||
    normalized.includes('rate limit') ||
    normalized.includes('limit exceeded') ||
    normalized.includes('resource exhausted') ||
    normalized.includes('429')
  );
}

export function buildGeminiKeyPool(rawKeys: string | null | undefined): string[] {
  return splitGeminiKeys(rawKeys);
}