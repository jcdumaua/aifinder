export type PersistedStringArrayLimits = {
  maxSerializedLength: number;
  maxItems: number;
  maxItemLength: number;
};

type StorageReader = {
  getItem(key: string): string | null;
};

function hasValidLimits(limits: PersistedStringArrayLimits) {
  return (
    Number.isSafeInteger(limits.maxSerializedLength) &&
    limits.maxSerializedLength >= 0 &&
    Number.isSafeInteger(limits.maxItems) &&
    limits.maxItems >= 0 &&
    Number.isSafeInteger(limits.maxItemLength) &&
    limits.maxItemLength >= 0
  );
}

export function parsePersistedStringArray(
  serialized: string | null,
  limits: PersistedStringArrayLimits,
): string[] {
  if (
    serialized === null ||
    !hasValidLimits(limits) ||
    serialized.length > limits.maxSerializedLength
  ) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(serialized);

    if (!Array.isArray(parsed) || parsed.length > limits.maxItems) {
      return [];
    }

    const normalizedItems: string[] = [];
    const normalizedKeys = new Set<string>();

    for (const item of parsed) {
      if (typeof item !== "string") {
        return [];
      }

      const normalizedItem = item.trim();

      if (
        normalizedItem.length === 0 ||
        normalizedItem.length > limits.maxItemLength
      ) {
        return [];
      }

      const normalizedKey = normalizedItem.toLowerCase();

      if (!normalizedKeys.has(normalizedKey)) {
        normalizedKeys.add(normalizedKey);
        normalizedItems.push(normalizedItem);
      }
    }

    return normalizedItems;
  } catch {
    return [];
  }
}

export function readPersistedStringArray(
  storage: StorageReader,
  key: string,
  limits: PersistedStringArrayLimits,
): string[] {
  try {
    return parsePersistedStringArray(storage.getItem(key), limits);
  } catch {
    return [];
  }
}
