RUTINER FÖR SKILL- OCH TICKET-ADAPTERING (AGENTS.md v10.0)

1. Central ticket-logistik (doc/TICKETS.md)
- Särskilj besluts-tickets (Wayfinder scenariofrågor utan kodändring) från bygg-tickets (specifika källkodsändringar under src/features/).
- Registrera enbart aktiva ärenden (Open, In Progress) i doc/TICKETS.md. Rensa rader med status Closed vid cykelavslut i Steg 4.
- Knyt varje bygg-ticket till 1 domän under src/features/ (eller Global).

2. Tregradig Agentdynamik (Följa, Vända om, Förlikas)
- Att följa (Steg 1a–1b): Inled Steg 1a med användarorientering. Om frågan saknar ticket-kod, ställ scenariofrågor på svenska för att rensa dimma innan det obrutna svepet startar. Formulera tre risknoder (State, Contract, Resilience), besvara dem internt med full teknisk precision, sätt "active_vectors" och driv kedjan 1b -> 2a -> 2b -> 2e -> 3c linjärt i ett obrutet svep.
- Att vända om (Terminal & API): Exekvera npm run verify i terminalen för att köra parallella granskningar via Gemini API. Låt bakgrundsskriptet validera kontrakt, resiliens och gränssnitt oberoende av chattens kontext.
- Att förlikas (Steg 2e–3c & Token Gate): Avsluta Steg 2 i 2e_syntetisera.md med nyckelordet MÄTTNAD: JA när alla målkonflikter lösts. Stanna vid Steg 3c, översätt den tekniska specifikationen till användarnytta och systembeteende i chatten samt presentera koden från REQUIRED_TOKEN.txt.

3. Transient E2E-Teststrategi och Autonom Orkestrering (Fas 2 / Steg 4)
- Skapa doc/LAST_CYCLE/APPROVAL.md när användaren bekräftat koden i chatten.
- Skapa transienta Mikro-E2E-tester under src/__tests__/transient_TCK-XXX.test.ts som exekverar hela flödet i minnet (< 3s) och verifierar Systembeteendet från 3c[cite: 7].
- Vid godkänd verifiering flyttas testet till den långsiktiga regressionssviten (src/__tests__/suite/e2e_regression.test.ts) via bakgrundsskript för att hålla framtida exekveringar under 15–20 sekunder.
- Låt klientorkestratören mata WebSocket-kabeln automatiskt med verktygs-svar (BidiGenerateContentToolResponse med NON_BLOCKING) så att flerstegskörningar hålls igång utan att användaren behöver prata igång agenten mellan varje enskilt steg.
- Logga principiella systemövergripande beslut i doc/DECISIONS.md. Domänspecifika arkitekturbeslut dokumenteras lokalt i src/features/[modul]/doc/DECISIONS.md.
- Vid ändring av autentisering, WebSocket eller API: Exekvera skarpa live-tester (pnpm test:live) mot riktiga gränssnitt enligt ADR-018. Redovisa nätverksstatus eller saknade nycklar direkt i diagnostiken.

4. Aktiva Skills och Delade Moduler (JIT)
- Läs in wayfinder, gemini-api-dev eller gemini-live-api-dev från doc/skills/ eller ~/.agents/skills/ enbart när motsvarande active_skill deklareras i Steg 1b.
- Slå upp sökvägen i doc/FEATURE_INDEX.json och läs in enbart den berörda mappen under src/features/ vid återanvändning av existerande moduler.