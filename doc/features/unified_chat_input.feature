# language: sv
Egenskap: Enhetlig chat-input med STT, Live-Agent och Reflektions-dropdown

  Bakgrund:
    Givet att appen har laddats i webbläsaren

  Scenario: Sida laddas i passivt läge utan automatiska röstanslutningar
    Så ska prompt-baren visa reflektions-dropdownen med läget "Normal"
    Och Live-sessionen ska vara i läget "Frånkopplad"
    Och ingen WebSocket-anslutning ska vara öppen
    Och ingen mikrofonförfrågan ska ha skickats ännu

  Scenario: Klick på Live-knappen utlöser User Gesture och öppnar röstkanal
    Givet att användaren befinner sig i passivt läge
    När användaren klickar på Live-knappen "start-pause-button"
    Så ska webbläsaren begära mikrofonbehörighet
    Och AudioContext.state ska ändras till "running" inom 500 ms
    Och en WebSocket-anslutning mot Gemini Live API ska etableras inom 1000 ms
    Och Live-knappen ska ändra status till "Aktiv/Paus"

  Scenario: Byte av reflektionsläge via kompakt dropdown
    Givet att användaren klickar på reflektions-dropdownen i prompt-baren
    När användaren väljer alternativet "Makro"
    Så ska tillståndet i SwarmContext uppdateras till "makro"
    Och den aktiva sessionen ska behålla anslutningen utan att koppla från

  Scenario: Användning av Mikrofon-knapp för STT-diktering (Text)
    Givet att användaren klickar på STT-mikrofonikonen i prompt-baren
    När användaren talar ordet "Hello"
    Så ska texten "Hello" infogas i meddelandefältet
    Och ingen WebSocket mot Gemini Live API ska startas

  Scenario: Tunn mittdelare utan mekaniska pilknappar
    Så ska mittdelaren ha en maximal bredd på 4 px
    Och inga pilknappar ska visas på mittdelaren
    Och användaren ska fortfarande kunna dra i mittdelaren för att ändra panelstorlek