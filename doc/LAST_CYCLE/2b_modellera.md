# Steg 2b: Modellera Kodpatchmotorn (TCK-021a)

## 1. Algoritm för `applyPatch`
```typescript
function countOccurrences(str: string, substr: string): number {
  if (!substr) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = str.indexOf(substr, pos)) !== -1) {
    count++;
    pos += substr.length;
  }
  return count;
}
```

1. **Filhämtning**:
   - `const currentContent = vfsFiles.get(filePath);`
   - Om `currentContent === undefined`: Kasta `new Error("FILE_NOT_FOUND: Filen '" + filePath + "' hittades inte i VFS Staging.")`.

2. **Steg 1 (Exakt matchning)**:
   - `const exactCount = countOccurrences(currentContent, searchBlock);`
   - Om `exactCount > 1`:
     - Kasta `new Error("AMBIGUOUS_SEARCH_BLOCK: Sökblocket förekommer " + exactCount + " gånger i '" + filePath + "'. Ange 2–3 omgivande kontextrader för unik matchning.")`.
   - Om `exactCount === 1`:
     - `const idx = currentContent.indexOf(searchBlock);`
     - `const updated = currentContent.slice(0, idx) + replaceBlock + currentContent.slice(idx + searchBlock.length);`
     - `vfsFiles.set(filePath, updated);`
     - Returnera `updated`.

3. **Steg 2 (Fuzzy Fallback: LF-normalisering & Trimning)**:
   - `const normContent = currentContent.replace(/\r\n/g, '\n');`
   - `const normSearch = searchBlock.replace(/\r\n/g, '\n');`
   - `const normReplace = replaceBlock.replace(/\r\n/g, '\n');`
   - `let normCount = countOccurrences(normContent, normSearch);`
   - `let effectiveSearch = normSearch;`
   - Om `normCount === 0`:
     - Trimma sökblocket: `const trimmedSearch = normSearch.trim();`
     - Om `trimmedSearch`:
       - `normCount = countOccurrences(normContent, trimmedSearch);`
       - `effectiveSearch = trimmedSearch;`
   - Om `normCount > 1`:
     - Kasta `new Error("AMBIGUOUS_SEARCH_BLOCK: Sökblocket förekommer " + normCount + " gånger i '" + filePath + "'. Ange 2–3 omgivande kontextrader för unik matchning.")`.
   - Om `normCount === 1`:
     - `const idx = normContent.indexOf(effectiveSearch);`
     - `const updated = normContent.slice(0, idx) + normReplace + normContent.slice(idx + effectiveSearch.length);`
     - `vfsFiles.set(filePath, updated);`
     - Returnera `updated`.
   - Om fortfarande 0 träffar:
     - Kasta `new Error("SEARCH_BLOCK_NOT_FOUND: Sökblocket hittades inte i '" + filePath + "'. Kontrollera indrag och kontextrader.")`.
