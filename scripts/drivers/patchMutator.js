/**
 * scripts/drivers/patchMutator.js
 * Deterministisk O(N) kirurgisk diff- och patchmotor för källkod.
 */

function countOccurrences(str, substr) {
  if (!substr) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = str.indexOf(substr, pos)) !== -1) {
    count++;
    pos += substr.length;
  }
  return count;
}

export function applySourcePatch(currentContent, searchBlock, replaceBlock, filePath = '') {
  // 1. Exakt matchning
  const exactCount = countOccurrences(currentContent, searchBlock);
  if (exactCount > 1) {
    throw new Error(`AMBIGUOUS_SEARCH_BLOCK: Sökblocket förekommer ${exactCount} gånger i '${filePath}'. Ange 1–2 omgivande rader för unik matchning.`);
  }
  if (exactCount === 1) {
    const idx = currentContent.indexOf(searchBlock);
    return currentContent.slice(0, idx) + replaceBlock + currentContent.slice(idx + searchBlock.length);
  }

  // 2. LF-normaliserad fallback
  const normContent = currentContent.replace(/\r\n/g, '\n');
  const normSearch = searchBlock.replace(/\r\n/g, '\n');
  const normReplace = replaceBlock.replace(/\r\n/g, '\n');

  let normCount = countOccurrences(normContent, normSearch);
  let effectiveSearch = normSearch;

  if (normCount === 0) {
    const trimmedSearch = normSearch.trim();
    if (trimmedSearch) {
      const trimmedCount = countOccurrences(normContent, trimmedSearch);
      if (trimmedCount > 0) {
        normCount = trimmedCount;
        effectiveSearch = trimmedSearch;
      }
    }
  }

  if (normCount > 1) {
    throw new Error(`AMBIGUOUS_SEARCH_BLOCK: Sökblocket förekommer ${normCount} gånger i '${filePath}'. Ange 1–2 omgivande rader för unik matchning.`);
  }
  if (normCount === 1) {
    const idx = normContent.indexOf(effectiveSearch);
    return normContent.slice(0, idx) + normReplace + normContent.slice(idx + effectiveSearch.length);
  }

  throw new Error(`SEARCH_BLOCK_NOT_FOUND: Sökblocket hittades inte i '${filePath}'. Kontrollera indrag och omgivande rader.`);
}
