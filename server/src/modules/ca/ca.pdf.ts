import PDFDocument from "pdfkit";
import { formatDateMg } from "../../common/time.js";
import type { CalculCote, EtatSection, LigneView } from "./ca.etat.js";

type EtatPdf = { etablissement: string; exercice: number; archivedAt: Date; sections: EtatSection[] };
type Def = { t: string; w: number; align?: "left" | "center" | "right" };
type Style = { bold?: boolean; italic?: boolean; fill?: string };

const M = 30;
const HDR: Style = { bold: true, fill: "#EAF1EC" };
const SECTION_LABEL = { FONCTIONNEMENT: "SECTION FONCTIONNEMENT", INVESTISSEMENT: "SECTION INVESTISSEMENT" } as const;
const CALCULS: [keyof CalculCote, string, string, boolean][] = [
  ["sousTotal", "SOUS-TOTAL", "SOUS-TOTAL", true],
  ["previsionnel", "EXCÉDENT PRÉVISIONNEL", "DÉFICIT PRÉVISIONNEL", false],
  ["resultatR1", "RÉSULTAT BÉNÉFICIAIRE R1", "RÉSULTAT DÉFICITAIRE R1", false],
  ["total1", "TOTAL 1", "TOTAL 1", true],
];

// espace simple : l'espace fine de toLocaleString("fr-FR") est absente de Helvetica
const fmt = (n: number | null) => (n === null ? "—" : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "));

export const renderEtatSynthese = (etat: EtatPdf) =>
  new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: M });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.lineWidth(0.5);

    const W = doc.page.width - 2 * M;
    const half = W / 2;
    const cw = [0.14, 0.4, 0.23, 0.23].map((r) => r * half); // N°, Intitulés, Crédits N-1, Réalisations
    const limit = doc.page.height - M - 24;

    const cells = (x: number, y: number, h: number, defs: Def[], s: Style = {}) => {
      for (const d of defs) {
        if (s.fill) doc.rect(x, y, d.w, h).fillAndStroke(s.fill, "#000");
        else doc.rect(x, y, d.w, h).stroke("#000");
        doc
          .fillColor("#000")
          .font(s.bold ? "Helvetica-Bold" : s.italic ? "Helvetica-Oblique" : "Helvetica")
          .fontSize(8)
          .text(d.t, x + 3, y + 3, { width: d.w - 6, align: d.align ?? "left" });
        x += d.w;
      }
    };

    const head = (y: number) => {
      cells(M, y, 16, [{ t: "DÉPENSES", w: half, align: "center" }], HDR);
      cells(M + half, y, 16, [{ t: "RECETTES", w: half, align: "center" }], HDR);
      const cols = (r: string): Def[] =>
        ["N° compte", "Intitulés", `Crédits ouverts définitifs ${etat.exercice - 1}`, `Réalisations : ${r}`].map(
          (t, i): Def => ({ t, w: cw[i], align: "center" }),
        );
      cells(M, y + 16, 28, cols("Mandatements"), HDR);
      cells(M + half, y + 16, 28, cols("Recouvrement"), HDR);
      return y + 44;
    };

    const hOf = (l?: LigneView) => {
      if (!l) return 0;
      doc.font("Helvetica").fontSize(8);
      return doc.heightOfString(l.intitule, { width: cw[1] - 6 }) + 6;
    };

    const line = (l: LigneView | undefined, x: number, y: number, h: number) =>
      cells(x, y, h, [
        { t: l ? String(l.numero) : "", w: cw[0] },
        { t: l?.intitule ?? "", w: cw[1] },
        { t: l ? fmt(l.creditsOuvertsN1) : "", w: cw[2], align: "right" },
        { t: l ? fmt(l.realisation) : "", w: cw[3], align: "right" },
      ]);

    etat.sections.forEach((s, i) => {
      if (i > 0) doc.addPage();
      doc.font("Helvetica-Bold").fontSize(9).text("RÉPUBLIQUE DE MADAGASCAR", M, M, { width: W, align: "center" });
      doc
        .moveDown(0.5)
        .font("Helvetica")
        .fontSize(11)
        .text(`ÉTAT DE SYNTHÈSE DU COMPTE ADMINISTRATIF DE ${etat.etablissement}`, { width: W, align: "center" });
      doc
        .moveDown(0.5)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(`AU TITRE DE LA GESTION ${etat.exercice}`, { width: W, align: "center" });
      doc.text(SECTION_LABEL[s.section], { width: W, align: "center" });
      let y = head(doc.y + 12);

      const n = Math.max(s.depenses.length, s.recettes.length);
      if (!n) {
        cells(M, y, 30, [{ t: "Aucune dépense ajoutée", w: half, align: "center" }], { italic: true });
        cells(M + half, y, 30, [{ t: "Aucune recette ajoutée", w: half, align: "center" }], { italic: true });
        y += 30;
      }
      for (let k = 0; k < n; k++) {
        const d = s.depenses[k];
        const r = s.recettes[k];
        const h = Math.max(hOf(d), hOf(r), 16);
        if (y + h > limit) {
          doc.addPage();
          y = head(M);
        }
        line(d, M, y, h);
        line(r, M + half, y, h);
        y += h;
      }

      for (const [key, gauche, droite, strong] of CALCULS) {
        if (y + 18 > limit) {
          doc.addPage();
          y = head(M);
        }
        const st: Style = strong ? HDR : {};
        const side = (label: string, c: CalculCote, x: number) =>
          cells(
            x,
            y,
            18,
            [
              { t: label, w: cw[0] + cw[1] },
              { t: fmt(c[key].credits), w: cw[2], align: "right" },
              { t: fmt(c[key].realisations), w: cw[3], align: "right" },
            ],
            st,
          );
        side(gauche, s.calcul.depenses, M);
        side(droite, s.calcul.recettes, M + half);
        y += 18;
      }

      doc.font("Helvetica").fontSize(7);
      doc.text("Montants exprimés en Ariary", M, y + 6, { width: half });
      doc.text(`Enregistré le ${formatDateMg(etat.archivedAt)}`, M + half, y + 6, { width: half, align: "right" });
    });

    doc.end();
  });