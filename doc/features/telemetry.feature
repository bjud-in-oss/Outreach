# language: sv
Egenskap: Telemetripuls för systemövervakning och närhet
  Som systemoperatör och medmänniska
  Vill jag kunna verifiera systemets livstecken och körtidstillstånd
  För att garantera obruten närhet, transparens och driftssäkerhet

  Scenario: Emittering av typad telemetriping
    När telemetrins funktion emitPing anropas
    Så skall en PingEvent skickas till den delade händelsebussen SwarmEventBus
    Och händelsen skall valideras runtime enligt Zod-kontraktet
    Och anropet skall returnera ett bekräftat resultatobjekt med success=true
