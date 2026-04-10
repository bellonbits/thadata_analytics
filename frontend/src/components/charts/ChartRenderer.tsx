"use client";

import React from "react";
import {
  LineChart, Line, AreaChart, Area,
  BarChart, Bar, PieChart, Pie,
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, LabelList,
} from "recharts";
import { Chart as ChartType } from "@/lib/types";
import { Lightbulb } from "lucide-react";

const COLORS = ["#ea580c", "#f97316", "#3b82f6", "#22c55e", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899"];

const tooltipStyle = {
  contentStyle: {
    background: "#1c1c1c",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    fontSize: 12,
    color: "#fff",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  },
  itemStyle:  { color: "#e5e5e5", fontWeight: 600 },
  labelStyle: { color: "#a3a3a3", marginBottom: 4, fontSize: 11 },
  cursor:     { fill: "rgba(255,255,255,0.04)" },
};

// All axis ticks white/light so they're visible on dark bg
const axisProps = {
  stroke:    "transparent",
  tick:      { fill: "#a3a3a3", fontSize: 11, fontWeight: 500 },
  tickLine:  false,
  axisLine:  false,
};

const gridProps = {
  strokeDasharray: "3 3",
  stroke:          "rgba(255,255,255,0.07)",
  vertical:        false,
};

// Smart number formatter for Y axis
function fmtNum(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000)     return `${(v / 1_000).toFixed(1)}K`;
  if (Math.abs(v) < 1 && v !== 0) return v.toFixed(3);
  return v.toFixed(0);
}

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle.contentStyle}>
      {label !== undefined && (
        <p style={{ ...tooltipStyle.labelStyle, marginBottom: 6, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 5 }}>{String(label)}</p>
      )}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < payload.length - 1 ? 4 : 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color || p.fill, flexShrink: 0 }} />
          <span style={{ color: "#a3a3a3", fontSize: 11 }}>{p.name}:</span>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 12 }}>
            {typeof p.value === "number" ? fmtNum(p.value) : String(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

// Pie custom label
const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.35;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.04) return null;
  return (
    <text x={x} y={y} fill="#e5e5e5" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function ChartRenderer({ chart }: { chart: ChartType }) {
  const hasData = chart.data && chart.data.length > 0;
  const margin  = { top: 16, right: 20, left: 8, bottom: 4 };

  // Determine keys to render
  const rawKeys  = (chart.data_keys ?? []).filter(Boolean);
  const yKey     = chart.y_axis || "";
  const keys     = rawKeys.length > 0 ? rawKeys : yKey ? [yKey] : [];

  // Auto-detect actual keys from data if schema keys don't match
  const dataKeys = (() => {
    if (!hasData) return keys;
    const firstRow = chart.data[0];
    const available = Object.keys(firstRow).filter(k => k !== chart.x_axis);
    if (keys.length > 0 && keys.every(k => k in firstRow)) return keys;
    // fall back to available numeric keys
    return available.filter(k => typeof firstRow[k] === "number").slice(0, 4);
  })();

  const renderChart = (): React.ReactElement => {
    if (!hasData || dataKeys.length === 0) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontSize: 13 }}>
          No chart data
        </div>
      ) as unknown as React.ReactElement;
    }

    switch (chart.type) {

      // ── BAR ─────────────────────────────────────────────────────────────────
      case "bar":
        return (
          <BarChart data={chart.data} margin={margin} barCategoryGap="35%">
            <CartesianGrid {...gridProps} />
            <XAxis dataKey={chart.x_axis} {...axisProps} interval={0} angle={chart.data.length > 8 ? -30 : 0} textAnchor={chart.data.length > 8 ? "end" : "middle"} height={chart.data.length > 8 ? 48 : 28} />
            <YAxis {...axisProps} tickFormatter={fmtNum} width={48} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#a3a3a3", paddingTop: 8 }} />
            {dataKeys.map((key, i) => (
              <Bar key={key} dataKey={key} name={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={52}>
                {dataKeys.length === 1 && chart.data.map((_: any, idx: number) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            ))}
          </BarChart>
        );

      // ── PIE / DONUT ──────────────────────────────────────────────────────────
      case "pie": {
        const dKey = chart.y_axis || dataKeys[0] || "value";
        const nKey = chart.x_axis || "name";
        return (
          <PieChart>
            <Pie
              data={chart.data}
              dataKey={dKey}
              nameKey={nKey}
              cx="50%" cy="50%"
              innerRadius="32%" outerRadius="58%"
              paddingAngle={3}
              labelLine={false}
              label={<PieLabel />}
            >
              {chart.data.map((_: any, i: number) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#a3a3a3", paddingTop: 8 }} />
          </PieChart>
        );
      }

      // ── SCATTER ──────────────────────────────────────────────────────────────
      case "scatter":
        return (
          <ScatterChart margin={margin}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
            <XAxis dataKey={chart.x_axis} type="number" name={chart.x_axis} {...axisProps} tickFormatter={fmtNum} width={48} label={{ value: chart.x_axis, position: "insideBottomRight", fill: "#a3a3a3", fontSize: 11 }} />
            <YAxis dataKey={chart.y_axis} type="number" name={chart.y_axis} {...axisProps} tickFormatter={fmtNum} width={48} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.15)" }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#a3a3a3" }} />
            {dataKeys.map((key, i) => (
              <Scatter key={key} name={key} data={chart.data} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />
            ))}
          </ScatterChart>
        );

      // ── LINE / AREA ──────────────────────────────────────────────────────────
      case "line":
      default: {
        const useArea = dataKeys.length === 1;
        if (useArea) {
          return (
            <AreaChart data={chart.data} margin={margin}>
              <defs>
                {dataKeys.map((_, i) => (
                  <linearGradient key={i} id={`aG${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COLORS[i]} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={COLORS[i]} stopOpacity={0}    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey={chart.x_axis} {...axisProps} />
              <YAxis {...axisProps} tickFormatter={fmtNum} width={52} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#a3a3a3", paddingTop: 8 }} />
              {dataKeys.map((key, i) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={key}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2.5}
                  fill={`url(#aG${i})`}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0, fill: COLORS[i % COLORS.length] }}
                />
              ))}
            </AreaChart>
          );
        }
        return (
          <LineChart data={chart.data} margin={margin}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey={chart.x_axis} {...axisProps} />
            <YAxis {...axisProps} tickFormatter={fmtNum} width={52} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#a3a3a3", paddingTop: 8 }} />
            {dataKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={key}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2.5}
                dot={{ r: 3, fill: COLORS[i % COLORS.length], strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0, fill: COLORS[i % COLORS.length] }}
              />
            ))}
          </LineChart>
        );
      }
    }
  };

  return (
    <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div>
        <h3 style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 3 }}>{chart.title}</h3>
        {chart.purpose && (
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{chart.purpose}</p>
        )}
        {chart.annotation && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6, padding: "3px 10px", borderRadius: 99, background: "var(--accent-muted)", fontSize: 11, color: "var(--accent-light)", fontWeight: 600 }}>
            ▲ {chart.annotation}
          </div>
        )}
      </div>

      {/* Axis labels */}
      {(chart.x_axis || chart.y_axis) && (
        <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--text-muted)" }}>
          {chart.x_axis && <span>X: <strong style={{ color: "#a3a3a3" }}>{chart.x_axis}</strong></span>}
          {chart.y_axis && <span>Y: <strong style={{ color: "#a3a3a3" }}>{chart.y_axis}</strong></span>}
        </div>
      )}

      {/* Chart */}
      <div style={{ height: 300, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* AI Insight footer */}
      {chart.insight && (
        <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: "var(--radius)", background: "rgba(234,88,12,0.06)", border: "1px solid rgba(234,88,12,0.12)" }}>
          <Lightbulb size={14} color="var(--accent-light)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{chart.insight}</p>
        </div>
      )}
    </div>
  );
}
