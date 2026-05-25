"use client";

import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTruckHistory } from "../../hooks/useTruckHistory";

interface ThermalTimeSeriesChartProps {
  truckId: string;
}

const COLORS = {
  "Posición 1": "#0f766e", // teal-700
  "Posición 2": "#0369a1", // sky-700
  "Posición 3": "#ca8a04", // yellow-600
  "Posición 4": "#c2410c", // orange-700
  "Posición 5": "#be123c", // rose-700
  "Posición 6": "#6d28d9", // violet-700
};

type MetricType = "Temperatura" | "Presión" | "Vibración" | "Velocidad";

export function ThermalTimeSeriesChart({ truckId }: ThermalTimeSeriesChartProps) {
  const { data, loading } = useTruckHistory(truckId);
  const [activeMetric, setActiveMetric] = useState<MetricType>("Temperatura");

  if (loading && data.length === 0) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="w-8 h-8 rounded-full border-4 border-surface-container-high border-t-primary animate-spin"></span>
          <span className="text-sm font-bold text-on-surface-variant tracking-widest uppercase">Cargando telemetría...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center">
        <span className="text-sm font-bold text-on-surface-variant tracking-widest uppercase">No hay datos históricos</span>
      </div>
    );
  }

  const getMetricConfig = () => {
    switch (activeMetric) {
      case "Temperatura": return { suffix: "_temp", unit: "°C", label: "Temperatura Máxima" };
      case "Presión": return { suffix: "_pressure", unit: " PSI", label: "Presión" };
      case "Vibración": return { suffix: "_vibration", unit: " G", label: "Vibración" };
      case "Velocidad": return { suffix: "", unit: " km/h", label: "Velocidad" };
    }
  };

  const { suffix, unit } = getMetricConfig();

  return (
    <div className="w-full">
      {/* TABS */}
      <div className="flex space-x-1.5 p-1 bg-surface-container-high/30 dark:bg-slate-950/20 backdrop-blur-sm rounded-xl border border-white/5 mb-6 max-w-max">
        {(["Temperatura", "Presión", "Vibración", "Velocidad"] as MetricType[]).map((metric) => (
          <button
            key={metric}
            onClick={() => setActiveMetric(metric)}
            className={`px-4 py-2 rounded-lg text-xs font-black tracking-widest transition-all duration-300 cursor-pointer ${
              activeMetric === metric
                ? "bg-white dark:bg-slate-800 text-on-surface shadow-md scale-102"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {metric}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-bold text-on-surface-variant tracking-widest uppercase mb-1">
          Evolución de {activeMetric}
        </h4>
        <p className="text-xs text-on-surface-variant/70">
          Mostrando las últimas {data.length} lecturas de telemetría agrupadas por minuto.
        </p>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="#e2e8f0" 
              className="dark:stroke-slate-800" 
            />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              dy={10}
              minTickGap={20}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              dx={-10}
              domain={['auto', 'auto']}
              tickFormatter={(val) => `${val}${unit === "°C" ? "°" : ""}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="backdrop-blur-md bg-white/75 dark:bg-slate-900/75 border border-white/20 dark:border-slate-800/60 p-4 rounded-xl shadow-xl text-xs font-semibold">
                      <p className="text-on-surface-variant font-bold mb-2 uppercase tracking-wider">{label}</p>
                      <div className="space-y-1">
                        {payload.map((item: any, index: number) => {
                          const cleanName = String(item.name || "").replace("_temp", "").replace("_pressure", "").replace("_vibration", "");
                          return (
                            <div key={index} className="flex justify-between gap-4 items-center">
                              <span className="flex items-center gap-1.5 text-on-surface-variant">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                {cleanName}:
                              </span>
                              <span className="font-extrabold text-on-surface">
                                {Number(item.value).toFixed(1)}{unit}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              iconType="circle" 
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} 
            />
            
            {activeMetric === "Velocidad" ? (
              <Line 
                type="monotone" 
                dataKey="Velocidad" 
                name="Velocidad" 
                stroke="#0284c7" // sky-600
                strokeWidth={2} 
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
                connectNulls={true}
              />
            ) : (
              (Object.keys(COLORS) as Array<keyof typeof COLORS>).map((pos) => (
                <Line 
                  key={pos}
                  type="monotone" 
                  dataKey={`${pos}${suffix}`} 
                  name={pos} 
                  stroke={COLORS[pos]} 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  connectNulls={true}
                />
              ))
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
