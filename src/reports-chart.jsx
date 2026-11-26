import React from "react";
import { createRoot } from "react-dom/client";
import { jsPDF } from "jspdf";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

const CATEGORY_COLORS = {
  Alimentari: "#2563eb",
  Trasporti: "#059669",
  Svago: "#d97706",
  Casa: "#7c3aed",
  Altro: "#64748b",
};

const FALLBACK_COLORS = ["#0284c7", "#db2777", "#65a30d", "#ea580c", "#475569"];

function getCategoryColor(cat, index = 0) {
  return CATEGORY_COLORS[cat] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function formatEuro(value) {
  return `€ ${Number(value || 0).toFixed(2)}`;
}

function CustomMonthlyTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;
  return (
    <div className="recharts-custom-tooltip">
      <div className="tooltip-title">{item.category}</div>
      <div className="tooltip-value">{formatEuro(item.amount)}</div>
      <div className="tooltip-sub">
        {item.count === 1 ? "1 spesa" : `${item.count} spese`}
      </div>
    </div>
  );
}

function CustomYearlyTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const nonZero = payload.filter((p) => Number(p.value) > 0);
  const total = nonZero.reduce((sum, p) => sum + Number(p.value || 0), 0);

  return (
    <div className="recharts-custom-tooltip">
      <div className="tooltip-title">{label}</div>
      {nonZero.length === 0 ? (
        <div className="tooltip-sub">Nessuna spesa</div>
      ) : (
        <>
          {nonZero.map((entry) => (
            <div key={entry.dataKey} className="tooltip-row">
              <span className="tooltip-dot-label">
                <span
                  className="tooltip-dot"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}
              </span>
              <span className="tooltip-row-val">{formatEuro(entry.value)}</span>
            </div>
          ))}
          <div className="tooltip-total">
            <span>Totale</span>
            <span>{formatEuro(total)}</span>
          </div>
        </>
      )}
    </div>
  );
}

function ReportsBarChart({ mode, monthlyData, yearlyData, categories }) {
  if (mode === "monthly") {
    const hasData = Array.isArray(monthlyData) && monthlyData.some((d) => d.amount > 0);
    if (!hasData) {
      return (
        <div className="chart-empty-state">
          Nessuna spesa registrata nel mese selezionato per generare il grafico.
        </div>
      );
    }

    return (
      <div className="chart-canvas-wrap">
        <ResponsiveContainer width="100%" height={270} minWidth={200} initialDimension={{ width: 320, height: 270 }}>
          <BarChart
            data={monthlyData}
            margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="category"
              tick={{ fill: "#374151", fontSize: 12, fontWeight: 600 }}
              axisLine={{ stroke: "#d1d5db" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `€${v}`}
              width={56}
            />
            <Tooltip content={<CustomMonthlyTooltip />} cursor={{ fill: "rgba(37, 99, 235, 0.06)" }} />
            <Bar dataKey="amount" name="Importo (€)" radius={[6, 6, 0, 0]} maxBarSize={56}>
              {monthlyData.map((entry, idx) => (
                <Cell
                  key={entry.category}
                  fill={getCategoryColor(entry.category, idx)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const hasYearlyData = Array.isArray(yearlyData) && yearlyData.some((d) => d.total > 0);
  if (!hasYearlyData) {
    return (
      <div className="chart-empty-state">
        Nessuna spesa registrata nell&apos;anno selezionato per generare il grafico.
      </div>
    );
  }

  const activeCategories = Array.isArray(categories) && categories.length
    ? categories
    : Object.keys(CATEGORY_COLORS);

  return (
    <div className="chart-canvas-wrap">
      <ResponsiveContainer width="100%" height={300} minWidth={200} initialDimension={{ width: 320, height: 300 }}>
        <BarChart
          data={yearlyData}
          margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "#374151", fontSize: 11, fontWeight: 600 }}
            axisLine={{ stroke: "#d1d5db" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `€${v}`}
            width={56}
          />
          <Tooltip content={<CustomYearlyTooltip />} cursor={{ fill: "rgba(37, 99, 235, 0.06)" }} />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
          {activeCategories.map((cat, idx) => (
            <Bar
              key={cat}
              dataKey={cat}
              stackId="a"
              fill={getCategoryColor(cat, idx)}
              radius={idx === activeCategories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              maxBarSize={38}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

let chartRoot = null;

window.renderReportsChart = function (payload) {
  const container = document.getElementById("reports-chart-root");
  if (!container) return;

  if (!chartRoot) {
    chartRoot = createRoot(container);
  }

  chartRoot.render(
    <ReportsBarChart
      mode={payload?.mode || "monthly"}
      monthlyData={payload?.monthlyData || []}
      yearlyData={payload?.yearlyData || []}
      categories={payload?.categories || []}
    />
  );
};

function pdfSafeText(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/[^\x20-\xFF\u20AC]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hexToRgb(hex) {
  const clean = String(hex || "#64748b").replace("#", "");
  const full = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean.padEnd(6, "0");
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function captureChartPng() {
  return new Promise((resolve) => {
    const root = document.getElementById("reports-chart-root");
    const svg = root ? root.querySelector("svg.recharts-surface") || root.querySelector("svg") : null;
    if (!svg) {
      resolve(null);
      return;
    }

    const rect = svg.getBoundingClientRect();
    const width = Math.max(Math.round(rect.width || Number(svg.getAttribute("width")) || 560), 300);
    const height = Math.max(Math.round(rect.height || Number(svg.getAttribute("height")) || 270), 180);

    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(width));
    clone.setAttribute("height", String(height));
    if (!clone.getAttribute("viewBox")) {
      clone.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }

    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("width", "100%");
    bg.setAttribute("height", "100%");
    bg.setAttribute("fill", "#ffffff");
    clone.insertBefore(bg, clone.firstChild);

    clone.querySelectorAll("text").forEach((el) => {
      if (!el.getAttribute("font-family")) {
        el.setAttribute("font-family", "Helvetica, Arial, sans-serif");
      }
    });

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    const dataUri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);

    const img = new Image();
    img.onload = () => {
      try {
        const scale = 2;
        const canvas = document.createElement("canvas");
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, width, height);
        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          width,
          height,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUri;
  });
}

window.exportReportPdf = async function (payload) {
  const {
    mode = "monthly",
    periodTitle = "Report Spese",
    periodSubtitle = "",
    totalAmount = 0,
    totalCount = 0,
    categories = [],
    yearlySummary = [],
    expenses = [],
    fileName = "report-spese.pdf",
  } = payload || {};

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 16;

  // Intestazione Report
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(37, 99, 235);
  doc.text("GESTORE SPESE & AGENDA", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(107, 114, 128);
  const generatedText = `Generato il ${new Date().toLocaleDateString("it-IT")}`;
  doc.text(generatedText, pageWidth - margin, y, { align: "right" });

  y += 6.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(17, 24, 39);
  doc.text(pdfSafeText(periodTitle), margin, y);

  if (periodSubtitle) {
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(75, 85, 99);
    doc.text(pdfSafeText(periodSubtitle), margin, y);
  }

  y += 4;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Riquadri Riepilogo (Totale & Conteggio)
  const cardGap = 5;
  const cardW = (contentWidth - cardGap) / 2;
  const cardH = 19;

  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(margin, y, cardW, cardH, 2.5, 2.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 64, 175);
  doc.text(mode === "yearly" ? "TOTALE ANNO" : "TOTALE MESE", margin + 4, y + 6);
  doc.setFontSize(15);
  doc.setTextColor(29, 78, 216);
  doc.text(`€ ${Number(totalAmount || 0).toFixed(2)}`, margin + 4, y + 14.5);

  const card2X = margin + cardW + cardGap;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(card2X, y, cardW, cardH, 2.5, 2.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("NUMERO SPESE", card2X + 4, y + 6);
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(String(totalCount || 0), card2X + 4, y + 14.5);

  y += cardH + 7;

  // Sezione Grafico a Barre
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text("Grafico Spese per Categoria", margin, y);
  y += 3.5;

  const chartPng = await captureChartPng();
  if (chartPng) {
    const maxChartW = contentWidth - 4;
    const aspect = chartPng.height / chartPng.width;
    let drawW = maxChartW;
    let drawH = drawW * aspect;
    if (drawH > 72) {
      drawH = 72;
      drawW = drawH / aspect;
    }

    const boxH = drawH + (mode === "yearly" && categories.length ? 11 : 4);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(margin, y, contentWidth, boxH, 2, 2, "FD");

    const imgX = margin + (contentWidth - drawW) / 2;
    doc.addImage(chartPng.dataUrl, "PNG", imgX, y + 2, drawW, drawH);

    // Legenda vettoriale per la vista annuale (in Recharts la legenda è HTML esterno all'SVG)
    if (mode === "yearly" && categories.length > 0) {
      let lx = margin + 6;
      const ly = y + drawH + 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      categories.forEach((cat, idx) => {
        const [r, g, b] = hexToRgb(getCategoryColor(cat, idx));
        doc.setFillColor(r, g, b);
        doc.rect(lx, ly - 2.6, 2.8, 2.8, "F");
        doc.setTextColor(55, 65, 81);
        const label = pdfSafeText(cat);
        doc.text(label, lx + 4, ly);
        lx += doc.getTextWidth(label) + 10;
      });
    }

    y += boxH + 7;
  } else {
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text("Nessuna spesa disponibile per generare il grafico nel periodo selezionato.", margin + 4, y + 8.5);
    y += 20;
  }

  // Ripartizione Mensile (solo Vista Annuale)
  if (mode === "yearly" && Array.isArray(yearlySummary) && yearlySummary.length > 0) {
    if (y + 38 > pageHeight - 16) {
      doc.addPage();
      y = 16;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text("Ripartizione Mese per Mese", margin, y);
    y += 4;

    const cols = 3;
    const cellGap = 3;
    const cellW = (contentWidth - cellGap * (cols - 1)) / cols;
    const cellH = 8.5;

    yearlySummary.forEach((item, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const cx = margin + col * (cellW + cellGap);
      const cy = y + row * (cellH + 2);
      const hasVal = Number(item.total) > 0;

      doc.setFillColor(hasVal ? 239 : 249, hasVal ? 246 : 250, hasVal ? 255 : 251);
      doc.setDrawColor(hasVal ? 191 : 229, hasVal ? 219 : 231, hasVal ? 254 : 235);
      doc.roundedRect(cx, cy, cellW, cellH, 1.5, 1.5, "FD");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(55, 65, 81);
      doc.text(pdfSafeText(item.name), cx + 3, cy + 5.6);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(hasVal ? 29 : 107, hasVal ? 78 : 114, hasVal ? 216 : 128);
      doc.text(`€ ${Number(item.total || 0).toFixed(2)}`, cx + cellW - 3, cy + 5.6, { align: "right" });
    });

    const totalRows = Math.ceil(yearlySummary.length / cols);
    y += totalRows * (cellH + 2) + 5;
  }

  // Elenco Dettagliato delle Spese
  if (y + 22 > pageHeight - 16) {
    doc.addPage();
    y = 16;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text("Elenco Dettagliato Spese", margin, y);
  y += 4;

  const colDateX = margin + 2;
  const colDescX = margin + 25;
  const colCatX = margin + 124;
  const colAmtRightX = pageWidth - margin - 2;

  const drawTableHeader = () => {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, contentWidth, 7.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text("Data", colDateX, y + 5);
    doc.text("Descrizione e dettagli", colDescX, y + 5);
    doc.text("Categoria", colCatX, y + 5);
    doc.text("Importo", colAmtRightX, y + 5, { align: "right" });
    y += 7.5;
  };

  if (!Array.isArray(expenses) || expenses.length === 0) {
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text("Nessuna spesa registrata per questo periodo.", margin + 4, y + 7.5);
  } else {
    drawTableHeader();

    expenses.forEach((exp, idx) => {
      const descText = pdfSafeText(exp.description || "Spesa");
      const metaParts = [];
      if (exp.store) metaParts.push(`Negozio: ${pdfSafeText(exp.store)}`);
      if (exp.quantity && Number(exp.quantity) > 1) metaParts.push(`Qta: ${exp.quantity}`);
      if (exp.recurrenceLabel) metaParts.push(`Ricorrenza: ${pdfSafeText(exp.recurrenceLabel)}`);
      if (exp.note) metaParts.push(`Nota: ${pdfSafeText(exp.note)}`);
      if (Array.isArray(exp.tags) && exp.tags.length > 0) {
        metaParts.push(exp.tags.map((t) => `#${pdfSafeText(t)}`).join(" "));
      }
      const metaLine = metaParts.join(" · ");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      const descLines = doc.splitTextToSize(descText, 95);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      const metaLines = metaLine ? doc.splitTextToSize(metaLine, 95) : [];

      const rowHeight = Math.max(8.5, descLines.length * 4 + metaLines.length * 3.4 + 3.5);

      if (y + rowHeight > pageHeight - 16) {
        doc.addPage();
        y = 16;
        drawTableHeader();
      }

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, rowHeight, "F");
      }

      doc.setDrawColor(229, 231, 235);
      doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(75, 85, 99);
      doc.text(pdfSafeText(exp.dateFormatted || exp.date || ""), colDateX, y + 5.2);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(17, 24, 39);
      doc.text(descLines, colDescX, y + 5.2);

      if (metaLines.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(metaLines, colDescX, y + 5.2 + descLines.length * 4);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(55, 65, 81);
      doc.text(pdfSafeText(exp.category || "Altro"), colCatX, y + 5.2);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(17, 24, 39);
      doc.text(`€ ${Number(exp.amount || 0).toFixed(2)}`, colAmtRightX, y + 5.2, { align: "right" });

      y += rowHeight;
    });

    if (y + 10 > pageHeight - 16) {
      doc.addPage();
      y = 16;
    }

    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    doc.rect(margin, y, contentWidth, 8.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 64, 175);
    doc.text("Totale Complessivo", margin + 3, y + 5.6);
    doc.text(`€ ${Number(totalAmount || 0).toFixed(2)}`, colAmtRightX, y + 5.6, { align: "right" });
  }

  // Numerazione pagine su tutto il documento
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Gestore Spese & Agenda · Pagina ${i} di ${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

