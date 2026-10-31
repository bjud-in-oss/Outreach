# TCK-MAINT-003: Bevara undermappar vid automatisk export

## MÅL
Rätta logiken för barrel-uppdatering i scripts/run-planera-live.ts så att underkataloger bevaras.

## UPPDRAG FÖR BYGGMOTORN
1. Använd read_file för att inspektera scripts/run-planera-live.ts runt rad 385–395 där createdModules fylls på.
2. Använd apply_patch med:
search_block:
      if (!isMaint && rel.startsWith(`src/features/${targetDomain}/`) && !rel.endsWith('index.ts')) {
        const base = path.basename(rel, '.ts');
        if (!createdModules.includes(base)) createdModules.push(base);
      }

replace_block:
      if (!isMaint && rel.startsWith(`src/features/${targetDomain}/`) && !rel.endsWith('index.ts')) {
        const domainDir = path.join(ROOT_DIR, 'src', 'features', targetDomain);
        const base = path.relative(domainDir, full).replace(/\.(ts|tsx)$/, '').replace(/\\/g, '/');
        if (!createdModules.includes(base)) createdModules.push(base);
      }
