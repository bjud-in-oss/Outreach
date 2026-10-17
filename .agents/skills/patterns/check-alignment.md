# Pattern: Check Alignment (Syna Alibin & Avstämning)

## Avsikt (Intent)
Förhindra att antaganden glider i det tysta och eliminera "compliance theater". Mönstret säkerställer att agentens mentala modell är fullständigt synkroniserad med verklighetens begränsningar och att föreslagna lösningar och tester prövas mot latenta haverier innan kod börjar skrivas.

---

## Kontext & Problem
Autonoma agenter strävar efter att slutföra uppgifter och producera "gröna" kvitton. Utan en explicit granskningskraft leder detta ofrånkomligen till:
1. **Compliance Theater:** Tester och kod som ger sken av att uppfylla kraven men som saknar faktisk verifierande substans.
2. **Tysta antaganden:** Modellen antar att bibliotek, miljöer eller nätverk beter sig idealt ("happy path"-sjukan).
3. **Zombietillstånd:** Fel fångas och ignoreras för att förhindra krascher, vilket leder till system som förfaller i tysthet.

---

## Mönstrets Kärnmekanik

### 1. Alibijakten (Substans framför Form)
Skilj på bevis och illusion:
- **Ytgranskning (Alibi):** Testet undersöker kodens textmassa, mockar bort all faktisk exekvering eller testar assertions som inte kan fallera.
- **Beteendeverifiering (Äkta):** Testet instansierar logiken i körtid, utsätter den för provokation och verifierar observerbara sidoeffekter.

### 2. Haveriprövning (Defensive Failure Audit)
Pröva förslaget mot systemets termodynamiska gränser:
- Vad sker när beroendet kraschar, tar timeout eller returnerar korrupt data?
- Sväljs felet i ett tyst block, eller propageras det transparent till systemets felhantering?
- Kraschar systemet snabbt och kontrollerat (Fail-Fast), eller fortsätter det i ett osäkert mellanläge?

### 3. Gräns- och Invariantkontroll
Säkerställ att den mentala kartan matchar verklighetens territorium:
- Respekterar lösningen de etablerade isoleringsgränserna?
- Försöker lösningen kringgå arkitekturen genom att skapa genvägar mellan isolerade moduler?

### 4. Destruktiv Tydlighet
Varje ny funktion gör ofta en gammal lösning förlegad:
- Vilka existerande antaganden eller historiska kodrader upphör att gälla?
- Vilka historiska tester måste omankras när förlegad logik saneras bort?

---

## Operativ Tillämpning i Triaden
- **Roll:** *Att vända om* i Fas 1 (Steg 2c och 2e).
- **Uppdrag:** Granska *Att följas* modeller och testspecifikationer som en oberoende rannsakare före godkännande.

## Anti-mönster & Varningstecken
- *Passiv acceptans:* Att godkänna ett förslag utan att identifiera minst en latent risk, ett dolt antagande eller en nödvändig sanering.
- *Kosmetiska invändningar:* Att enbart anmärka på formatering eller kommentarer i stället för arkitektonisk bärighet.

---
*Mönstret är anpassat för Outreach Engine v10.4 från 'Check Alignment' i [Augmented Coding Patterns](https://github.com/lexler/augmented-coding-patterns) av Lada Kesseler (Lexler), licensierat under CC-BY-4.0 och MIT License.*