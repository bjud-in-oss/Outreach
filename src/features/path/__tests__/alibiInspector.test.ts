import { describe, it, expect } from 'vitest';
import { inspectTestAlibis } from '../engine/alibiInspector';
import { exekveraRecept } from '../engine/pathRunner';
import { PathContext } from '../model/types';

describe('TCK-060: Alibi Inspection and Reconciliation Rollback', () => {

  describe('inspectTestAlibis()', () => {
    it('underkänner tautologiska assertions', () => {
      const alibiKod = `
        import { expect, it } from 'vitest';
        it('trivial', () => {
          expect(true).toBe(true);
        });
      `;
      const resultat = inspectTestAlibis(alibiKod);
      expect(resultat.godkand).toBe(false);
      expect(resultat.felmeddelande).toContain('Tautologisk assertion');
    });

    it('godkänner icke-tautologisk kod', () => {
      const renKod = `
        import { expect, it } from 'vitest';
        import { knackaPaPorten } from '..';
        it('riktig', async () => {
          const res = await knackaPaPorten('test');
          expect(res.oppnad).toBe(true);
        });
      `;
      const resultat = inspectTestAlibis(renKod);
      expect(resultat.godkand).toBe(true);
    });
  });

  describe('Provningsportens alibi-kontroll (Direkt Lambda)', () => {
    it('stoppar exekvering vid alibi i testkoden', async () => {
      // Simulera provningsportens logik direkt i minnet utan att mocka själva skapaProvningsport
      const testExekverare = async (kod: string) => {
        const alibiResultat = inspectTestAlibis(kod);
        if (!alibiResultat.godkand) {
          return { oppnad: false, omvandelseKrav: 'ÅTGÄRDA_TESTSYNTAX' };
        }
        return { oppnad: true };
      };

      const resultat = await testExekverare('expect(false).toBe(false);');
      expect(resultat.oppnad).toBe(false);
      expect(resultat.omvandelseKrav).toBe('ÅTGÄRDA_TESTSYNTAX');
    });
  });

  describe('exekveraRecept() med omvändelseloggik', () => {
    it('anropar onOmvandelse och återställer tillstånd', async () => {
      let omvandelseAnropad = 0;
      let senasteForsok = -1;
      
      const kontext: PathContext = {
        aktivaSteg: [],
        stegHistorik: [],
        resiliensLager: { krascher: 0 },
        invarianter: []
      };

      const mockRecept = {
        id: 'fail-recipe',
        steg: [
          {
            id: 'steg-1',
            krav: { beskrivning: 'Fail', id: 'krav-1' },
            exekvera: async () => {
              throw new Error('Körtidskrasch');
            }
          }
        ]
      };

      try {
        await exekveraRecept(mockRecept, kontext, {
          maxOmvandelseForsok: 2,
          onOmvandelse: (_fel, _ctx, forsok) => {
            omvandelseAnropad++;
            senasteForsok = forsok;
          }
        });
      } catch (err: any) {
        expect(err.message).toBe('Körtidskrasch');
      }

      expect(omvandelseAnropad).toBe(2);
      expect(senasteForsok).toBe(2);
    });
  });

});
