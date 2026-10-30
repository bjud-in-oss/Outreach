# language: sv
Egenskap: Minnesindikator i promptfältet

  Scenario: Användaren ser hur mycket minne som finns kvar framför prompten
    Givet att användaren interagerar med Gemini Live-sessionen
    När systemet uppdaterar telemetriflödet för kontextanvändning
    Så ska en indikator visas i gränssnittet som visar hur många procent minne som är ledigt
