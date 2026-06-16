import { jsPDF } from "jspdf";

interface ProposalSection {
  key: string;
  label: string;
}

interface BuildProposalPdfArgs {
  orgName: string;
  funderName: string;
  formatLabel: string;
  sections: ProposalSection[];
  sectionContent: Record<string, string>;
}

const MARGIN = 56;
const PAGE_WIDTH = 595.28; // A4 pt
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function sanitizeFilename(name: string) {
  return name.replace(/[^a-z0-9-_]+/gi, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

/** Builds a simple, clean text proposal PDF and returns the jsPDF document. */
export function buildProposalPdf({ orgName, funderName, formatLabel, sections, sectionContent }: BuildProposalPdfArgs): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = MARGIN;

  const ensureSpace = (lineHeight: number) => {
    if (y + lineHeight > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  // Cover / header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(orgName || "Organisation", MARGIN, y);
  y += 26;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(90);
  doc.text(`Proposal to: ${funderName || "Funder"}`, MARGIN, y);
  y += 18;
  doc.text(formatLabel, MARGIN, y);
  y += 30;
  doc.setTextColor(0);

  for (const section of sections) {
    const content = (sectionContent[section.key] || "").trim();
    ensureSpace(40);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(section.label, MARGIN, y);
    y += 20;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    const text = content || "(Not yet written)";
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
    for (const line of lines) {
      ensureSpace(15);
      doc.text(line, MARGIN, y);
      y += 15;
    }
    y += 16;
  }

  return doc;
}

export function downloadProposalPdf(args: BuildProposalPdfArgs) {
  const doc = buildProposalPdf(args);
  const filename = `${sanitizeFilename(args.orgName || "proposal")}_${sanitizeFilename(args.funderName || "funder")}.pdf`;
  doc.save(filename);
}

/** Returns the PDF as a base64 string (no data: prefix) plus a suggested filename, for email attachment. */
export function proposalPdfToBase64(args: BuildProposalPdfArgs): { base64: string; filename: string } {
  const doc = buildProposalPdf(args);
  const base64 = doc.output("datauristring").split(",")[1];
  const filename = `${sanitizeFilename(args.orgName || "proposal")}_${sanitizeFilename(args.funderName || "funder")}.pdf`;
  return { base64, filename };
}
