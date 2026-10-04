# Steg 2e: Syntetisera & Förlika Målkonflikter (TCK-022c)

## 1. Målkonflikter & Förlikning
- **Konflikt 1**: Mjukare ZCR-krav vs Falska positiva röstutlösningar vid lågfrekvent bakgrundsbrus (t.ex. ventilation, brum).
  - *Förlikning*: Den första grenen kräver `rms > (rmsThreshold * 1.5)`. Detta innebär att ljudet måste ha 50% högre energi än baströskeln för att kringgå ZCR-filtret. Svagt bakgrundsbrus (med RMS under 1.5x) måste fortfarande passera `zcr > zcrThreshold` för att klassificeras som tal. Djupa vokaler med kraftig energi släpps igenom utan att klippas.
- **Konflikt 2**: Kontinuerlig mikrofonströmning vs UI-intent status.
  - *Förlikning*: `activeIntent` representerar användarens UI-fokus och visualisering, medan mikrofonströmmen via EventBus transporterar röstdata så fort tal detekteras. Detta frikopplar agenternas lyssningsförmåga från knappsatsens tillstånd och ger ett organiskt samtalsflöde.
- **Konflikt 3**: Pre-Roll och Post-Roll timing.
  - *Förlikning*: Pre-roll på 200 ms och post-roll på 500 ms bevaras fullt ut för att fånga inledande konsonanter och hålla meningsavslut intakta.

MÄTTNAD: JA
