# language: sv
Egenskap: Visa kontextminne
  Som användare vill jag se kontextminnets användning i gränssnittet
  Så att jag har kontroll över systemets resurser

  Scenario: Visning av kontextminne framför användaretiketten
    Givet att jag är i gränssnittet för swarm-interaktionen
    När jag ser etiketten "👤 Du:"
    Då ska en indikator för kontextminnets användning visas alldeles framför den
