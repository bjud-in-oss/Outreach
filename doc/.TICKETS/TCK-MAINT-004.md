# TCK-MAINT-004: Sessionsisolering och underhållsstöd i samrad.ts

## MÅL
Mötesbryggan ska endast erbjuda byggstart vid exit ifall en ny biljett skapades under den aktiva sessionen, samt tillåta underhållsbiljetter.

## UPPDRAG FÖR BYGGMOTORN
1. Använd read_file på scripts/samrad.ts.
2. Använd apply_patch för att flytta variabeln sessionCreatedTicket till toppskopet ovanför main().
3. I save_file: sätt sessionCreatedTicket = ticketId när en biljett sparas under doc/.TICKETS/. Tillåt TCK-MAINT-biljetter utan krav på export function.
4. Vid exit: fråga ENBART om byggstart ifall sessionCreatedTicket har ett värde.
