import PDFDocument from "pdfkit";

export type BaPdfData = {
  exercice: number;
  etablissement: string;
  mission: string | null;
  programme: string | null;
  rubriqueLabel: string; // « Recette de fonctionnement »
  section: "FONCTIONNEMENT" | "INVESTISSEMENT";
  lignes: { numero: number; intitule: string; budgetPrimitif: number; excedent: number; budgetAdditionnel: number }[];
  totaux: { budgetPrimitif: number; excedent: number; budgetAdditionnel: number };
  editeLe: string; // dd/mm/yyyy
};

const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export function renderBudgetAdditionnel(d: BaPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const X = 40;
    const W = [50, 195, 90, 90, 90];
    const TOTAL_W = W.reduce((a, b) => a + b, 0);
    const XS = W.map((_, i) => X + W.slice(0, i).reduce((a, b) => a + b, 0));
    const PAD = 4;
    const limit = () => doc.page.height - doc.page.margins.bottom - 30;
    const HEAD = ["Comptes", "Intitulés de compte", `Budget primitif ${d.exercice}`, "Excédent", `Budget additionnel ${d.exercice}`];

    doc.font("Helvetica").fontSize(12).text(`BUDGET ADDITIONNEL DE L'ANNÉE : ${d.exercice}`, { align: "center" });
    doc.moveDown(0.4).font("Helvetica-Bold").fontSize(9).text(d.etablissement.toUpperCase(), { align: "center" });
    doc.moveDown(0.3).font("Helvetica-Bold").text(`MISSION : ${d.mission ?? "Non renseignée"}`, { align: "center" });
    doc.text(`PROGRAMME : ${d.programme ?? "Non renseigné"}`, { align: "center" });
    doc.text("(Unité monétaire : ARIARY)", { align: "center" });
    doc.moveDown(1).font("Helvetica-Bold").fontSize(10).text(d.rubriqueLabel.toUpperCase(), X, doc.y, { underline: true });
    let y = doc.y + 6;

    type Opt = { bold?: boolean; fill?: string; header?: boolean; span?: boolean; align?: ("left" | "center" | "right")[] };
    const row = (cells: string[], o: Opt = {}) => {
      const ws = o.span ? [W[0] + W[1], ...W.slice(2)] : W;
      const xs = o.span ? [XS[0], ...XS.slice(2)] : XS;
      const setFont = () => doc.font(o.bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
      setFont();
      const h = Math.max(...cells.map((c, i) => doc.heightOfString(c, { width: ws[i] - 2 * PAD }))) + 2 * PAD;
      if (y + h > limit()) {
        doc.addPage();
        y = doc.page.margins.top;
        if (!o.header) row(HEAD, { bold: true, header: true, fill: "#E8EEEA", align: Array(5).fill("center") });
        setFont();
      }
      if (o.fill) doc.rect(X, y, TOTAL_W, h).fill(o.fill);
      doc.fillColor("#000").strokeColor("#000").lineWidth(0.7);
      cells.forEach((c, i) => {
        doc.rect(xs[i], y, ws[i], h).stroke();
        doc.text(c, xs[i] + PAD, y + PAD, { width: ws[i] - 2 * PAD, align: o.align?.[i] ?? "left" });
      });
      y += h;
    };

    row(HEAD, { bold: true, header: true, fill: "#E8EEEA", align: Array(5).fill("center") });
    for (const l of d.lignes)
      row([String(l.numero), l.intitule, fmt(l.budgetPrimitif), fmt(l.excedent), fmt(l.budgetAdditionnel)], {
        align: ["left", "left", "right", "right", "right"],
      });
    row(
      [
        d.section === "FONCTIONNEMENT" ? "TOTAL DE FONCTIONNEMENT" : "TOTAL D'INVESTISSEMENT",
        fmt(d.totaux.budgetPrimitif),
        fmt(d.totaux.excedent),
        fmt(d.totaux.budgetAdditionnel),
      ],
      { bold: true, fill: "#E8EEEA", span: true, align: ["center", "right", "right", "right"] },
    );

    doc.font("Helvetica").fontSize(8).fillColor("#444");
    doc.text("Montants exprimés en Ariary", X, y + 8, { width: TOTAL_W / 2, align: "left" });
    doc.text(`Enregistré le ${d.editeLe}`, X + TOTAL_W / 2, y + 8, { width: TOTAL_W / 2, align: "right" });
    doc.end();
  });
}