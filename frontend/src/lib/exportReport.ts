/**
 * Export utilities: PDF (browser print window) and DOCX (docx library).
 */

import { AnalyzeResponse } from "./types";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function safeFilename(title: string, ext: string) {
  return `${title.slice(0, 60).replace(/[^a-z0-9 ]/gi, "_").trim()}.${ext}`;
}
function pct(n: number) { return `${(n * 100).toFixed(0)}%`; }

// ─── PDF ─────────────────────────────────────────────────────────────────────

export async function exportPDF(data: AnalyzeResponse, title: string) {
  const { report, appendix, actions, meta } = data;
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // ── Section builders ──────────────────────────────────────────────────────

  const bigQuestionsHtml = (report?.big_questions ?? []).length
    ? `<div class="questions-block">
        <p class="micro-label">Key questions this report answers</p>
        <ol class="q-list">
          ${report!.big_questions.map(q => `<li>${esc(q)}</li>`).join("")}
        </ol>
      </div>`
    : "";

  const execBoxHtml = report?.introduction_summary
    ? `<div class="exec-box">
        <p class="exec-label">&#9654; Executive Summary</p>
        <p class="exec-body">${esc(report.introduction_summary)}</p>
      </div>`
    : "";

  const analysisHtml = (report?.analysis ?? []).map((s, i) => `
    <div class="q-block avoid-break">
      <div class="q-header">
        <span class="q-badge">${i + 1}</span>
        <span class="q-title">${esc(s.question)}</span>
      </div>
      <div class="q-body">
        ${s.methods ? `
        <div class="q-row">
          <span class="pill pill-blue">Method</span>
          <p class="p-italic">${esc(s.methods)}</p>
        </div>` : ""}
        ${s.findings ? `
        <div class="q-row">
          <span class="pill pill-orange">Findings</span>
          <p>${esc(s.findings)}</p>
        </div>` : ""}
        ${s.conclusion ? `
        <div class="q-row q-concl">
          <span class="pill pill-green">Conclusion</span>
          <p class="p-concl">${esc(s.conclusion)}</p>
        </div>` : ""}
      </div>
    </div>`).join("");

  const actionsHtml = (actions ?? []).map(a => `
    <div class="action-row avoid-break">
      <span class="pri pri-${a.priority}">${a.priority}</span>
      <div class="action-body">
        <p class="action-title">${esc(a.action)}</p>
        <p class="action-sub">${esc(a.impact)}</p>
      </div>
      <span class="conf">${pct(a.confidence)}</span>
    </div>`).join("");

  const futureHtml = (report?.future_work ?? []).map(fw =>
    `<li>${esc(fw)}</li>`).join("");

  const risksHtml = (report?.risks ?? []).map(r =>
    `<div class="risk-row avoid-break">&#9651;&nbsp; ${esc(r)}</div>`).join("");

  const appendixHtml = [
    appendix?.notes        ? `<div class="app-block avoid-break"><p class="app-label">A. Methodology</p><p class="app-body">${esc(appendix.notes)}</p></div>` : "",
    appendix?.data_quality ? `<div class="app-block avoid-break"><p class="app-label">B. Data Quality</p><p class="app-body">${esc(appendix.data_quality)}</p></div>` : "",
    appendix?.sql          ? `<div class="app-block avoid-break"><p class="app-label">C. SQL Queries</p><pre class="code">${esc(appendix.sql)}</pre></div>` : "",
    appendix?.code         ? `<div class="app-block avoid-break"><p class="app-label">D. Code</p><pre class="code code-green">${esc(appendix.code)}</pre></div>` : "",
  ].filter(Boolean).join("");

  // ── Full HTML document ────────────────────────────────────────────────────

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${esc(title)}</title>
<style>
/* ── Page setup ───────────────────────────────────────────────────────── */
@page {
  size: A4 portrait;
  margin: 15mm 15mm 18mm 15mm;
}
@page :first { margin-top: 10mm; }

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: "Segoe UI", Arial, Helvetica, sans-serif;
  font-size: 9.5pt;
  line-height: 1.5;
  color: #ffffff;
  background: #111827;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ── Cover ──────────────────────────────────────────────────────────── */
.cover {
  border-bottom: 2pt solid #ea580c;
  padding-bottom: 10pt;
  margin-bottom: 16pt;
}
.cover-logo {
  height: 85pt;
  margin-bottom: 12pt;
  object-fit: contain;
}
.cover-brand {
  font-size: 7pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
  margin-bottom: 6pt;
}
.cover-title {
  font-size: 18pt;
  font-weight: 800;
  color: #ea580c;
  line-height: 1.2;
  margin-bottom: 6pt;
  word-break: break-word;
}
.cover-meta {
  font-size: 8pt;
  color: #9ca3af;
  display: flex;
  flex-wrap: wrap;
  gap: 4pt 12pt;
  border-top: 1pt solid #374151;
  padding-top: 6pt;
}
.cover-meta b { color: #f9fafb; }
.cover-warn { color: #fb923c; }

/* ── Section headings ────────────────────────────────────────────────── */
.section { margin-bottom: 16pt; }

.s-head {
  display: flex;
  align-items: center;
  gap: 6pt;
  font-size: 12pt;
  font-weight: 800;
  color: #ea580c;
  border-bottom: 1.5pt solid #ea580c;
  padding-bottom: 4pt;
  margin-bottom: 10pt;
  page-break-after: avoid;
}
.s-head.blue  { color: #60a5fa; border-color: #60a5fa; }
.s-head.green { color: #4ade80; border-color: #4ade80; }
.s-head.red   { color: #f87171; border-color: #f87171; }
.s-head.gray  { color: #d1d5db; border-color: #4b5563; }

.s-num {
  width: 16pt; height: 16pt;
  border-radius: 50%;
  background: #ea580c;
  color: #ffffff;
  font-size: 8.5pt;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.s-head.blue  .s-num { background: #60a5fa; color: #111827; }
.s-head.green .s-num { background: #4ade80; color: #111827; }
.s-head.red   .s-num { background: #f87171; color: #111827; }
.s-head.gray  .s-num { background: #d1d5db; color: #111827; }

/* ── Intro ───────────────────────────────────────────────────────────── */
.intro-body {
  border-left: 2.5pt solid #ea580c;
  padding: 6pt 10pt;
  background: #1f2937;
  margin-bottom: 10pt;
  font-size: 9.5pt;
  color: #f9fafb;
  line-height: 1.5;
}

.micro-label {
  font-size: 6.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
  margin-bottom: 4pt;
}

.questions-block { margin-bottom: 10pt; }
.q-list {
  padding-left: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 3pt;
  counter-reset: qc;
}
.q-list li {
  counter-increment: qc;
  display: flex;
  align-items: flex-start;
  gap: 6pt;
  font-size: 9pt;
  color: #f9fafb;
  background: #1f2937;
  border: 1pt solid #374151;
  border-radius: 3pt;
  padding: 4pt 8pt;
  line-height: 1.4;
}
.q-list li::before {
  content: counter(qc);
  background: #ea580c;
  color: #ffffff;
  width: 12pt; height: 12pt;
  border-radius: 50%;
  font-size: 7pt;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1pt;
}

.exec-box {
  border: 1pt solid #c2410c;
  border-left: 3pt solid #ea580c;
  border-radius: 3pt;
  background: #431407;
  padding: 6pt 10pt;
}
.exec-label {
  font-size: 7.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: #fdba74;
  margin-bottom: 3pt;
}
.exec-body { font-size: 9pt; color: #fff7ed; line-height: 1.5; }

/* ── Analysis blocks ─────────────────────────────────────────────────── */
.q-block {
  border: 1pt solid #374151;
  border-radius: 3pt;
  margin-bottom: 8pt;
  overflow: hidden;
}
.q-header {
  background: #1f2937;
  border-bottom: 1pt solid #374151;
  padding: 5pt 10pt;
  display: flex;
  align-items: flex-start;
  gap: 6pt;
}
.q-badge {
  background: #ea580c;
  color: #ffffff;
  width: 14pt; height: 14pt;
  border-radius: 50%;
  font-size: 7.5pt;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1pt;
}
.q-title { font-size: 9.5pt; font-weight: 700; color: #ffffff; line-height: 1.3; margin-top: 1pt; }

.q-body { padding: 6pt 10pt; display: flex; flex-direction: column; gap: 6pt; }
.q-row { display: flex; flex-direction: column; gap: 2pt; }
.q-concl {
  background: #064e3b;
  border: 1pt solid #047857;
  border-radius: 3pt;
  padding: 5pt 8pt;
  margin-top: 2pt;
}

/* ── Pills ───────────────────────────────────────────────────────────── */
.pill {
  display: inline-block;
  font-size: 6.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 1.5pt 5pt;
  border-radius: 8pt;
  width: fit-content;
}
.pill-orange { background: #7c2d12; color: #ffedd5; border: 1pt solid #c2410c; }
.pill-blue   { background: #1e3a8a; color: #dbeafe; border: 1pt solid #2563eb; }
.pill-green  { background: #064e3b; color: #d1fae5; border: 1pt solid #059669; }

p { font-size: 9.5pt; color: #e5e7eb; line-height: 1.5; }
.p-italic { font-style: italic; color: #9ca3af; font-size: 9pt; }
.p-concl  { font-size: 9.5pt; color: #a7f3d0; line-height: 1.5; }

/* ── Conclusions ─────────────────────────────────────────────────────── */
.concl-body {
  border-left: 2.5pt solid #22c55e;
  background: #064e3b;
  padding: 6pt 10pt;
  margin-bottom: 10pt;
  font-size: 9.5pt;
  color: #d1fae5;
  line-height: 1.6;
}

.sub-head {
  font-size: 8.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #9ca3af;
  margin: 10pt 0 5pt;
  padding-bottom: 2pt;
  border-bottom: 1pt solid #374151;
}

/* ── Actions ─────────────────────────────────────────────────────────── */
.action-row {
  display: flex;
  align-items: flex-start;
  gap: 8pt;
  padding: 6pt 10pt;
  border: 1pt solid #374151;
  border-radius: 3pt;
  margin-bottom: 5pt;
  background: #1f2937;
}
.action-body { flex: 1; }
.action-title { font-size: 9.5pt; font-weight: 700; color: #ffffff; margin-bottom: 1pt; }
.action-sub   { font-size: 8.5pt;  color: #9ca3af; }
.pri {
  font-size: 6.5pt; font-weight: 700; text-transform: uppercase;
  padding: 1.5pt 5pt; border-radius: 8pt; white-space: nowrap; flex-shrink: 0; margin-top: 1.5pt;
}
.pri-high   { background: #7f1d1d; color: #fecaca; }
.pri-medium { background: #7c2d12; color: #fed7aa; }
.pri-low    { background: #064e3b; color: #d1fae5; }
.conf { font-size: 7.5pt; color: #9ca3af; white-space: nowrap; flex-shrink: 0; margin-top: 2pt; }

/* ── Future work ─────────────────────────────────────────────────────── */
.future-list ul { padding-left: 12pt; display: flex; flex-direction: column; gap: 3pt; color: #ffffff; }
.future-list li { font-size: 9pt; color: #e5e7eb; line-height: 1.5; }

/* ── Risks ───────────────────────────────────────────────────────────── */
.risk-row {
  background: #450a0a;
  border: 1pt solid #7f1d1d;
  border-radius: 3pt;
  padding: 5pt 10pt;
  font-size: 9pt;
  color: #fecaca;
  margin-bottom: 4pt;
  line-height: 1.5;
}

/* ── Appendix ────────────────────────────────────────────────────────── */
.app-divider {
  border: none;
  border-top: 1.5pt dashed #4b5563;
  margin: 16pt 0 14pt;
}
.app-block { margin-bottom: 10pt; }
.app-label {
  font-size: 8pt; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.07em; color: #9ca3af; margin-bottom: 4pt;
}
.app-body { font-size: 9pt; color: #d1d5db; line-height: 1.5; }
.code {
  background: #030712;
  color: #fdba74;
  font-family: inherit;
  font-size: 7.5pt;
  line-height: 1.5;
  padding: 8pt 10pt;
  border-radius: 3pt;
  white-space: pre-wrap;
  word-break: break-all;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.code-green { color: #86efac; }

/* ── Utilities ───────────────────────────────────────────────────────── */
.avoid-break { page-break-inside: avoid; }
.pg-break    { page-break-before: always; }
</style>
</head>
<body>

<!-- ══ Cover ════════════════════════════════════════════════════════════ -->
<div class="cover avoid-break">
  <img src="${window.location.origin}/logo.png" class="cover-logo" alt="Thadata Analytics Logo" />
  <p class="cover-brand">Thadata Analytics &nbsp;&middot;&nbsp; Data Analysis Report</p>
  <h1 class="cover-title">${esc(title)}</h1>
  <div class="cover-meta">
    <span>Generated: <b>${now}</b></span>
    <span>Confidence: <b>${pct(meta.confidence_overall)}</b></span>
    ${meta.rows_analyzed > 0 ? `<span>Rows analyzed: <b>${meta.rows_analyzed.toLocaleString()}</b></span>` : ""}
    ${meta.warnings.length > 0 ? `<span class="cover-warn">&#9888; ${meta.warnings.length} data warning${meta.warnings.length > 1 ? "s" : ""}</span>` : ""}
  </div>
</div>

${report ? `

<!-- ══ 1. Introduction ══════════════════════════════════════════════════ -->
<div class="section">
  <h2 class="s-head"><span class="s-num">1</span> Introduction</h2>
  <div class="intro-body">${esc(report.introduction)}</div>
  ${bigQuestionsHtml}
  ${execBoxHtml}
</div>

${report.analysis?.length ? `
<!-- ══ 2. Analysis ══════════════════════════════════════════════════════ -->
<div class="section">
  <h2 class="s-head blue"><span class="s-num">2</span> Analysis</h2>
  ${analysisHtml}
</div>
` : ""}

${report.conclusions || actions?.length || report.future_work?.length ? `
<!-- ══ 3. Conclusions ═══════════════════════════════════════════════════ -->
<div class="section">
  <h2 class="s-head green"><span class="s-num">3</span> Conclusions &amp; Discussion</h2>
  ${report.conclusions ? `<div class="concl-body">${esc(report.conclusions)}</div>` : ""}
  ${actions?.length ? `
    <p class="sub-head">Recommended Actions</p>
    ${actionsHtml}` : ""}
  ${futureHtml ? `
    <div class="future-list">
      <p class="sub-head">Future Work &amp; Next Steps</p>
      <ul>${futureHtml}</ul>
    </div>` : ""}
</div>
` : ""}

${report.risks?.length ? `
<!-- ══ Risks ════════════════════════════════════════════════════════════ -->
<div class="section">
  <h2 class="s-head red"><span class="s-num">!</span> Risks &amp; Assumptions</h2>
  ${risksHtml}
</div>
` : ""}

${appendixHtml ? `
<!-- ══ Appendix ═════════════════════════════════════════════════════════ -->
<hr class="app-divider"/>
<div class="section">
  <h2 class="s-head gray"><span class="s-num">A</span> Appendix <span style="font-size:8pt;font-weight:400;margin-left:5pt">— technical detail for reviewers</span></h2>
  ${appendixHtml}
</div>
` : ""}

` : `<p style="color:#6b7280;font-style:italic;margin-top:20pt">No report content available.</p>`}

</body>
</html>`;

  const win = window.open("", "_blank", "width=860,height=750,scrollbars=yes");
  if (!win) {
    alert("Popup blocked — allow popups for this site and try again.");
    return;
  }
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 900);
}

// ─── DOCX ─────────────────────────────────────────────────────────────────────

export async function exportDOCX(data: AnalyzeResponse, title: string) {
  const {
    Document, Paragraph, TextRun, Packer, BorderStyle, UnderlineType,
  } = await import("docx");

  const { report, appendix, actions } = data;
  const children: InstanceType<typeof Paragraph>[] = [];
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const sp = (before = 0, after = 100) =>
    new Paragraph({ children: [new TextRun("")], spacing: { before, after } });

  const hr = () => new Paragraph({
    border: { bottom: { color: "D1D5DB", style: BorderStyle.SINGLE, size: 6 } },
    spacing: { before: 260, after: 260 },
  });

  const sH = (num: string, text: string, color = "EA580C") => new Paragraph({
    children: [
      new TextRun({ text: `${num}  `, bold: true, size: 28, color, font: "Arial" }),
      new TextRun({ text, bold: true, size: 28, color, font: "Arial", underline: { type: UnderlineType.SINGLE, color } }),
    ],
    spacing: { before: 400, after: 160 },
  });

  const subH = (text: string, color = "374151") => new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22, color, font: "Arial" })],
    spacing: { before: 240, after: 80 },
  });

  const body = (text: string, indent = 0, italic = false, color = "374151") => new Paragraph({
    children: [new TextRun({ text, size: 22, color, italics: italic, font: "Arial" })],
    spacing: { after: 100 },
    indent: indent ? { left: indent } : undefined,
  });

  const micro = (text: string) => new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), size: 16, bold: true, color: "9CA3AF", allCaps: true, font: "Arial" })],
    spacing: { before: 120, after: 60 },
  });

  const pill = (text: string, color: string) => new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), size: 16, bold: true, color, allCaps: true, font: "Arial" })],
    spacing: { before: 100, after: 50 },
    indent: { left: 360 },
  });

  const bullet = (text: string) => new Paragraph({
    children: [new TextRun({ text, size: 22, color: "374151", font: "Arial" })],
    bullet: { level: 0 },
    spacing: { after: 70 },
  });

  // Cover
  children.push(
    new Paragraph({ children: [new TextRun({ text: "THADATA ANALYTICS · DATA ANALYSIS REPORT", size: 16, bold: true, color: "9CA3AF", allCaps: true, font: "Arial" })], spacing: { after: 100 } }),
    new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 40, color: "EA580C", font: "Arial" })], spacing: { after: 140 } }),
    new Paragraph({ children: [new TextRun({ text: `${now}   ·   Confidence: ${pct(data.meta.confidence_overall)}   ·   Rows: ${data.meta.rows_analyzed.toLocaleString()}`, size: 18, color: "6B7280", font: "Arial" })], spacing: { after: 440 } }),
    hr(),
  );

  if (!report) {
    children.push(body("No report content available."));
  } else {
    // 1. Introduction
    children.push(sH("1.", "Introduction"));
    children.push(body(report.introduction));

    if (report.big_questions?.length) {
      children.push(sp(160, 80));
      children.push(micro("Key Questions This Report Answers"));
      report.big_questions.forEach((q, i) => {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: `${i + 1}.  `, bold: true, size: 22, color: "EA580C", font: "Arial" }),
            new TextRun({ text: q, size: 22, color: "374151", font: "Arial" }),
          ],
          spacing: { after: 70 },
          indent: { left: 360 },
        }));
      });
    }

    if (report.introduction_summary) {
      children.push(sp(180, 60));
      children.push(micro("Executive Summary — Conclusions at a Glance"));
      children.push(body(report.introduction_summary, 360, true, "374151"));
    }

    children.push(hr());

    // 2. Analysis
    if (report.analysis?.length) {
      children.push(sH("2.", "Analysis", "1D4ED8"));
      report.analysis.forEach((s, i) => {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: `${i + 1}.  `, bold: true, size: 24, color: "EA580C", font: "Arial" }),
            new TextRun({ text: s.question, bold: true, size: 24, color: "111827", font: "Arial" }),
          ],
          spacing: { before: 180, after: 80 },
        }));
        if (s.methods) {
          children.push(pill("Method", "1D4ED8"));
          children.push(body(s.methods, 540, true, "6B7280"));
        }
        if (s.findings) {
          children.push(pill("Findings", "EA580C"));
          children.push(body(s.findings, 540));
        }
        if (s.conclusion) {
          children.push(pill("Conclusion", "15803D"));
          children.push(body(s.conclusion, 540, false, "14532D"));
        }
        children.push(sp(60, 0));
      });
      children.push(hr());
    }

    // 3. Conclusions
    if (report.conclusions || actions?.length || report.future_work?.length) {
      children.push(sH("3.", "Conclusions & Discussion", "15803D"));
      if (report.conclusions) children.push(body(report.conclusions, 0, false, "14532D"));
      if (actions?.length) {
        children.push(subH("Recommended Actions"));
        actions.forEach(a => {
          const c = a.priority === "high" ? "B91C1C" : a.priority === "medium" ? "C2410C" : "15803D";
          children.push(new Paragraph({
            children: [
              new TextRun({ text: `[${a.priority.toUpperCase()}]  `, bold: true, size: 20, color: c, font: "Arial" }),
              new TextRun({ text: a.action, bold: true, size: 22, color: "111827", font: "Arial" }),
            ],
            spacing: { before: 100, after: 40 },
            indent: { left: 360 },
          }));
          children.push(body(a.impact, 720, false, "6B7280"));
        });
      }
      if (report.future_work?.length) {
        children.push(subH("Future Work & Next Steps", "6B7280"));
        report.future_work.forEach(fw => children.push(bullet(fw)));
      }
      children.push(hr());
    }

    if (report.risks?.length) {
      children.push(subH("Risks & Assumptions", "B91C1C"));
      report.risks.forEach(r => children.push(new Paragraph({
        children: [new TextRun({ text: `▲  ${r}`, size: 22, color: "7F1D1D", font: "Arial" })],
        spacing: { after: 70 },
      })));
      children.push(hr());
    }

    if (appendix && (appendix.notes || appendix.data_quality || appendix.sql || appendix.code)) {
      children.push(sH("A.", "Appendix", "9CA3AF"));
      if (appendix.notes) {
        children.push(subH("A. Methodology", "6B7280"));
        children.push(body(appendix.notes, 360, false, "4B5563"));
      }
      if (appendix.data_quality) {
        children.push(subH("B. Data Quality", "6B7280"));
        children.push(body(appendix.data_quality, 360, false, "4B5563"));
      }
      if (appendix.sql) {
        children.push(subH("C. SQL Queries", "6B7280"));
        children.push(new Paragraph({
          children: [new TextRun({ text: appendix.sql, size: 18, color: "EA580C", font: "Courier New" })],
          spacing: { after: 100 },
          indent: { left: 360 },
        }));
      }
      if (appendix.code) {
        children.push(subH("D. Code", "6B7280"));
        children.push(new Paragraph({
          children: [new TextRun({ text: appendix.code, size: 18, color: "4B5563", font: "Courier New" })],
          spacing: { after: 100 },
          indent: { left: 360 },
        }));
      }
    }
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeFilename(title, "docx");
  a.click();
  URL.revokeObjectURL(url);
}
