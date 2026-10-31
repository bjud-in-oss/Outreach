# language: sv
Egenskap: Minnesindikator i Promptfältet

  Scenario: Visa ledigt minne för användaren
    Givet att användaren interagerar med promptfältet
    När telemetrisystemet rapporterar minnesanvändning
    Så ska en indikator visa hur mycket minne som finns kvar i formatet "[Ledigt X%]"
