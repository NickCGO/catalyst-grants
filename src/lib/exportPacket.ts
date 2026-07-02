// src/lib/exportPacket.ts
// ---------------------------------------------------------------------------
// Submission-ready packet export in both formats the funder might want:
//   buildPacketText(...)  -> string for copy-paste into an online portal
//   downloadPacketDocx(...) -> triggers a .docx download (Word/Google Docs)
// ---------------------------------------------------------------------------

import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";

export type PacketQuestion = {
  id: string;
  order_index: number;
  section?: string | null;
  question: string;
  word_limit?: number | null;
  char_limit?: number | null;
};

export type PacketAnswer = { question_id: string; answer: string };

type PacketMeta = {
  orgName: string;
  funderName: string;
  formTitle?: string;
  attachments?: { name: string; required?: boolean; condition?: string }[];
};

function pair(questions: PacketQuestion[], answers: PacketAnswer[]) {
  const map = new Map(answers.map((a) => [a.question_id, a.answer ?? ""]));
  return [...questions]
    .sort((a, b) => a.order_index - b.order_index)
    .map((q) => ({ q, a: map.get(q.id) ?? "" }));
}

// ---- copy-paste text ------------------------------------------------------

export function buildPacketText(questions: PacketQuestion[], answers: PacketAnswer[], meta: PacketMeta): string {
  const lines: string[] = [
    `${meta.formTitle ?? "Application"} — ${meta.funderName}`,
    `Applicant: ${meta.orgName}`,
    "",
  ];
  let lastSection = "";
  for (const { q, a } of pair(questions, answers)) {
    if (q.section && q.section !== lastSection) {
      lines.push("", `## ${q.section}`);
      lastSection = q.section;
    }
    lines.push(`${q.order_index}. ${q.question}`);
    lines.push(a || "[ not yet drafted ]", "");
  }
  if (meta.attachments?.length) {
    lines.push("", "## Required attachments checklist");
    for (const att of meta.attachments) {
      lines.push(`[ ] ${att.name}${att.required === false ? " (if applicable" + (att.condition ? `: ${att.condition}` : "") + ")" : ""}`);
    }
  }
  return lines.join("\n");
}

export async function copyPacketToClipboard(...args: Parameters<typeof buildPacketText>) {
  await navigator.clipboard.writeText(buildPacketText(...args));
}

// ---- .docx download -------------------------------------------------------

export async function downloadPacketDocx(questions: PacketQuestion[], answers: PacketAnswer[], meta: PacketMeta) {
  const children: Paragraph[] = [
    new Paragraph({ text: meta.formTitle ?? "Application", heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: `${meta.funderName} — ${meta.orgName}`, italics: true })] }),
    new Paragraph({ text: "" }),
  ];
  let lastSection = "";
  for (const { q, a } of pair(questions, answers)) {
    if (q.section && q.section !== lastSection) {
      children.push(new Paragraph({ text: q.section, heading: HeadingLevel.HEADING_1 }));
      lastSection = q.section;
    }
    children.push(new Paragraph({ children: [new TextRun({ text: `${q.order_index}. ${q.question}`, bold: true })] }));
    children.push(new Paragraph({ text: a || "[ not yet drafted ]" }));
    children.push(new Paragraph({ text: "" }));
  }
  if (meta.attachments?.length) {
    children.push(new Paragraph({ text: "Required attachments", heading: HeadingLevel.HEADING_1 }));
    for (const att of meta.attachments) {
      children.push(new Paragraph({ text: `☐ ${att.name}`, bullet: { level: 0 } }));
    }
  }
  const blob = await Packer.toBlob(new Document({ sections: [{ children }] }));
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${meta.orgName} - ${meta.funderName} application.docx`.replace(/[\/\\]/g, "-");
  link.click();
  URL.revokeObjectURL(url);
}
