import { describe, it, expect } from 'vitest';
import { skapaKonstruktionsport, knackaPaPorten, PortNekadError } from '..';
import { FilKrav } from '../model/types';

describe('konstruktionsport TCK-038', () => {
    it('ska öppna porten när alla filkrav är uppfyllda', async () => {
        const matris: FilKrav[] = [
            { filVag: 'src/features/path/engine/konstruktionsport.ts', maxRader: 250, kravsExport: true }
        ];

        const inspekterare = async () => ({
            existerar: true,
            antalRader: 100,
            exporteradIIndex: true
        });

        const port = skapaKonstruktionsport({ matris, inspekterare });
        const resultat = await knackaPaPorten(port, {});

        expect(resultat.oppnad).toBe(true);
    });

    it('ska kasta PortNekadError med SKAPA_FILER när filen saknas', async () => {
        const matris: FilKrav[] = [
            { filVag: 'src/features/path/engine/saknas.ts', maxRader: 250, kravsExport: false }
        ];

        const inspekterare = async () => ({
            existerar: false,
            antalRader: 0,
            exporteradIIndex: false
        });

        const port = skapaKonstruktionsport({ matris, inspekterare });

        await expect(knackaPaPorten(port, {})).rejects.toThrow(PortNekadError);
    });

    it('ska kasta PortNekadError med MODULÄR_EXPANSION när radgräns överskrids', async () => {
         const matris: FilKrav[] = [
            { filVag: 'src/features/path/engine/for-stor.ts', maxRader: 125, kravsExport: false }
        ];

        const inspekterare = async () => ({
            existerar: true,
            antalRader: 130,
            exporteradIIndex: false
        });

        const port = skapaKonstruktionsport({ matris, inspekterare });

         await expect(knackaPaPorten(port, {})).rejects.toThrow(PortNekadError);
    });

    it('ska kasta PortNekadError med UPPDATERA_INDEX när export saknas', async () => {
         const matris: FilKrav[] = [
            { filVag: 'src/features/path/engine/ej-exporterad.ts', maxRader: 250, kravsExport: true }
        ];

        const inspekterare = async () => ({
            existerar: true,
            antalRader: 50,
            exporteradIIndex: false 
        });

        const port = skapaKonstruktionsport({ matris, inspekterare });

         await expect(knackaPaPorten(port, {})).rejects.toThrow(PortNekadError);
    });
});
