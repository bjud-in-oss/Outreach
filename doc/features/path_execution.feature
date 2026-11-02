# language: sv
Egenskap: Vandringen längs Vägen och prövningen vid Portarna
  Som systemarkitekt och domänexpert
  Vill jag att byggmotorn följer en typad, ordnad Väg med tydliga Portar
  För att säkerställa att mänsklig avsikt och teknisk sanning råder innan koden rörs.

  Bakgrund:
    Givet att ett bygguppdrag initierats
    Och att Vägen är konfigurerad med aktiva Portar för Fas 0 till Fas 3.

  Scenario: Avsiktsporten öppnas av människan och vandringen fortsätter
    Givet att biljetten rör exakt 1 FSD-domän
    När agenten har formulerat avsikten i ett Gherkin-scenario under Fas 0
    Och agenten knackar på Avsiktsporten
    Och människan bekräftar att scenariot speglar intentionen (svarar "y")
    Så öppnas Avsiktsporten
    Och vandringen fortsätter autonomt in i Fas 1.

  Scenario: Människan avvisar vid Avsiktsporten och tidig omvändelse sker
    Givet att agenten har formulerat ett Gherkin-scenario under Fas 0
    När agenten knackar på Avsiktsporten
    Men människan avvisar intentionen (svarar "n")
    Så förblir Avsiktsporten stängd
    Och vandringen avbryts omedelbart
    Och ingen källkod under "src/" tillåts förändras.

  Scenario: Portväktaren avvisar en biljett som bryter mot domängränsen
    Givet att en biljett kräver förändringar i mer än 1 FSD-domän
    När Portväktaren granskar biljetten i Fas 0
    Så nekas tillträde omedelbart
    Och biljetten klyvs mekaniskt i sekventiella delkontrakt via decomposing-tickets
    Och ursprungsbiljetten markeras som SUPERSEDED.

  Scenario: Prövningsporten kräver körtidsankare och fail-first
    Givet att Fas 1 har levererat ett godkänt byggkontrakt
    När Fas 2 inleds och transient-testet körs mot befintlig kod
    Så måste testet först fallera rött mot ett erkänt körtidsankare
    Annars nekar Prövningsporten inträde till källkodsimplementationen
    Och bygget avbryts med ett krav på testjustering.
