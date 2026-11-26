import React from "react";
import { createRoot } from "react-dom/client";
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
        <ResponsiveContainer width="100%" height={270}>
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
      <ResponsiveContainer width="100%" height={300}>
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
