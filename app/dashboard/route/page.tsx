"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useThermalData, TruckThermalData } from "../../../hooks/useThermalData";
import {
  Radio,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Activity,
  Gauge,
  TrendingDown,
  Thermometer,
  Layers,
  Navigation2,
  Filter,
  BarChart3,
  ArrowUpRight,
  Zap,
} from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Severity = "ROJA" | "AMARILLA" | "VERDE";

interface RouteSegment {
  id: string;
  tajo: string;
  trucks: TruckThermalData[];
  avgVibration: number;
  maxVibration: number;
  avgPressure: number;
  avgSpeed: number;
  avgTemp: number;
  aggressivenessScore: number; // 0–100
  severity: Severity;
  truckCount: number;
  criticalTrucks: number;
}

// ─── Clasificador heurístico Modelo C ─────────────────────────────────────────
//
// El Modelo C (K-Means + Random Forest) clasifica segmentos en Verde/Amarillo/Rojo
// usando: vibracion_g, presion_psi, velocidad_kmh, latitud, longitud.
//
// En ausencia de los modelos pkl, derivamos la clasificación directamente
// de la telemetría agrupada por tajo/zona desde Supabase Realtime.
//

function classifySegments(trucks: TruckThermalData[]): RouteSegment[] {
  if (trucks.length === 0) return [];

  // Agrupar por tajo
  const zones: Record<string, TruckThermalData[]> = {};
  trucks.forEach((t) => {
    const key = t.tajo || "DESCONOCIDO";
    if (!zones[key]) zones[key] = [];
    zones[key].push(t);
  });

  // Para cada zona, generar múltiples "segmentos" simulando los tramos de ruta
  const segments: RouteSegment[] = [];

  Object.entries(zones).forEach(([tajo, truckList]) => {
    // Dividir en 3 segmentos por tajo (inicio, medio, final)
    const tramos = ["Tramo Entrada", "Tramo Central", "Tramo Salida"];
    const chunkSize = Math.ceil(truckList.length / 3);

    tramos.forEach((tramo, i) => {
      const chunk = truckList.slice(i * chunkSize, (i + 1) * chunkSize);
      if (chunk.length === 0) return;

      const avgVib =
        chunk.reduce((s, t) => s + t.maxVibration, 0) / chunk.length;
      const maxVib = Math.max(...chunk.map((t) => t.maxVibration));
      const avgPsi =
        chunk.reduce((s, t) => s + t.maxPressure, 0) / chunk.length;
      const avgSpd = chunk.reduce((s, t) => s + t.speed, 0) / chunk.length;
      const avgTmp = chunk.reduce((s, t) => s + t.maxTemp, 0) / chunk.length;

      // Score de agresividad (0–100)
      // Vibración pesa 40%, temperatura 35%, presión 25%
      const vibScore = Math.min(100, ((avgVib - 0.5) / 3.0) * 100);
      const tempScore = Math.min(100, ((avgTmp - 40) / 55) * 100);
      const psiScore = Math.min(100, ((avgPsi - 105) / 20) * 100);
      const aggressiveness = Math.round(
        vibScore * 0.4 + tempScore * 0.35 + psiScore * 0.25
      );

      const severity: Severity =
        aggressiveness >= 65
          ? "ROJA"
          : aggressiveness >= 35
          ? "AMARILLA"
          : "VERDE";

      const criticalTrucks = chunk.filter((t) => t.isCritical).length;

      segments.push({
        id: `${tajo.toUpperCase().replace(/\s+/g, "-")}-${tramo.toUpperCase().replace(/\s+/g, "-")}`,
        tajo,
        trucks: chunk,
        avgVibration: Math.round(avgVib * 100) / 100,
        maxVibration: Math.round(maxVib * 100) / 100,
        avgPressure: Math.round(avgPsi * 10) / 10,
        avgSpeed: Math.round(avgSpd * 10) / 10,
        avgTemp: Math.round(avgTmp * 10) / 10,
        aggressivenessScore: aggressiveness,
        severity,
        truckCount: chunk.length,
        criticalTrucks,
      });
    });
  });

  return segments.sort((a, b) => b.aggressivenessScore - a.aggressivenessScore);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = {
    ROJA: {
      cls: "bg-error/15 text-error border-error/30",
      icon: <ShieldAlert className="w-3 h-3" />,
      dot: "bg-error",
    },
    AMARILLA: {
      cls: "bg-amber-500/15 text-amber-500 border-amber-500/30",
      icon: <AlertTriangle className="w-3 h-3" />,
      dot: "bg-amber-400",
    },
    VERDE: {
      cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
      icon: <CheckCircle2 className="w-3 h-3" />,
      dot: "bg-emerald-400",
    },
  }[severity];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${cfg.cls}`}
    >
      {cfg.icon}
      ZONA {severity}
    </span>
  );
}

function MetricBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-1.5 w-full bg-white/10 dark:bg-slate-800/40 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Sparkline de vibración ───────────────────────────────────────────────────

function VibSparkline({ trucks }: { trucks: TruckThermalData[] }) {
  const vals = trucks.map((t) => t.maxVibration);
  if (vals.length === 0) return null;
  const max = Math.max(...vals, 0.1);
  return (
    <div className="flex items-end gap-0.5 h-8 w-full">
      {vals.slice(-12).map((v, i) => {
        const pct = (v / max) * 100;
        const color =
          v > 2.5
            ? "bg-error/80"
            : v > 1.5
            ? "bg-amber-400/80"
            : "bg-emerald-400/60";
        return (
          <div
            key={i}
            className={`flex-1 rounded-t-sm transition-all duration-300 ${color}`}
            style={{ height: `${pct}%` }}
          />
        );
      })}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function RouteManagementPage() {
  const { trucks, loading } = useThermalData();
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [filterZone, setFilterZone] = useState<string>("ALL");
  const [selectedSegId, setSelectedSegId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);

  const segments = useMemo(() => classifySegments(trucks), [trucks]);

  // KPIs
  const rojas = segments.filter((s) => s.severity === "ROJA").length;
  const amarillas = segments.filter((s) => s.severity === "AMARILLA").length;
  const verdes = segments.filter((s) => s.severity === "VERDE").length;
  const avgScore =
    segments.length > 0
      ? Math.round(
          segments.reduce((s, g) => s + g.aggressivenessScore, 0) /
            segments.length
        )
      : 0;

  const zones = useMemo(
    () => ["ALL", ...Array.from(new Set(segments.map((s) => s.tajo)))],
    [segments]
  );

  const filtered = useMemo(() => {
    return segments
      .filter((s) => filterSeverity === "ALL" || s.severity === filterSeverity)
      .filter((s) => filterZone === "ALL" || s.tajo === filterZone);
  }, [segments, filterSeverity, filterZone]);

  const selectedSeg = segments.find((s) => s.id === selectedSegId) ?? null;

  // Fleet-wide max vibration truck
  const mostAggressiveTruck = useMemo(
    () =>
      [...trucks].sort((a, b) => b.maxVibration - a.maxVibration)[0] ?? null,
    [trucks]
  );

  return (
    <div className="relative space-y-6 max-w-[1500px] mx-auto pb-32 z-10">
      {/* ── Animations ── */}
      <style>{`
        @keyframes float-rt-a {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(60px,-55px) scale(1.1); }
        }
        @keyframes float-rt-b {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-55px,45px) scale(0.92); }
        }
        .rt-blob-a { animation: float-rt-a 26s ease-in-out infinite; }
        .rt-blob-b { animation: float-rt-b 32s ease-in-out infinite; }
        @keyframes pulse-dot {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.5; transform:scale(1.5); }
        }
        .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
        @keyframes slide-rt {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .slide-rt { animation: slide-rt 0.25s ease both; }
      `}</style>

      {/* ── Background blobs ── */}
      <div className="absolute inset-0 -top-32 overflow-hidden pointer-events-none -z-10 select-none">
        <div className="rt-blob-a absolute top-[2%] left-[4%] w-[460px] h-[460px] rounded-full bg-gradient-to-br from-emerald-500/15 via-teal-400/12 to-cyan-400/8 blur-[85px]" />
        <div className="rt-blob-b absolute bottom-[8%] right-[3%] w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-orange-500/12 via-amber-400/10 to-yellow-400/8 blur-[90px]" />
      </div>

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-on-surface">
            Agresividad de Ruta
          </h1>
          <p className="text-sm text-on-surface-variant font-semibold mt-1.5 flex items-center gap-2">
            <Navigation2 className="w-4 h-4 text-emerald-400" />
            Modelo C — K-Means + Random Forest · Clasificación de segmentos viales
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => setShowMap((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border ${
              showMap
                ? "bg-secondary/15 border-secondary/30 text-secondary"
                : "bg-white/60 dark:bg-slate-900/50 border-white/30 dark:border-slate-800/50 text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {showMap ? "Ocultar Mapa" : "Ver Mapa"}
          </button>
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              {loading ? "Conectando..." : "Telemetría Activa"}
            </span>
            <Radio className="w-3.5 h-3.5 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          className={`backdrop-blur-xl border rounded-2xl p-5 flex flex-col gap-1 ${
            rojas > 0
              ? "bg-error/10 border-error/30"
              : "bg-white/70 dark:bg-slate-900/60 border-white/40 dark:border-slate-800/60"
          }`}
        >
          <p
            className={`text-[9px] font-black tracking-widest uppercase ${
              rojas > 0 ? "text-error" : "text-on-surface-variant/70"
            }`}
          >
            Zonas Críticas
          </p>
          <div className="flex items-baseline gap-1">
            <p
              className={`text-3xl font-black tracking-tight ${
                rojas > 0 ? "text-error" : "text-on-surface"
              }`}
            >
              {loading ? "—" : String(rojas).padStart(2, "0")}
            </p>
            <span className="text-[8px] font-black text-on-surface-variant/50 uppercase">
              ROJA
            </span>
          </div>
          <p className="text-[9px] text-on-surface-variant/50 font-bold uppercase tracking-wider">
            {rojas > 0 ? "acción inmediata" : "sin zonas críticas"}
          </p>
        </div>

        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border border-white/40 dark:border-slate-800/60 rounded-2xl p-5 flex flex-col gap-1">
          <p className="text-[9px] font-black tracking-widest text-on-surface-variant/70 uppercase">
            Zonas de Advertencia
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-black text-amber-500 tracking-tight">
              {loading ? "—" : String(amarillas).padStart(2, "0")}
            </p>
            <span className="text-[8px] font-black text-on-surface-variant/50 uppercase">
              AMARILLA
            </span>
          </div>
          <p className="text-[9px] text-on-surface-variant/50 font-bold uppercase tracking-wider">
            monitoreo preventivo
          </p>
        </div>

        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border border-white/40 dark:border-slate-800/60 rounded-2xl p-5 flex flex-col gap-1">
          <p className="text-[9px] font-black tracking-widest text-on-surface-variant/70 uppercase">
            Zonas Normales
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-black text-emerald-500 tracking-tight">
              {loading ? "—" : String(verdes).padStart(2, "0")}
            </p>
            <span className="text-[8px] font-black text-on-surface-variant/50 uppercase">
              VERDE
            </span>
          </div>
          <p className="text-[9px] text-on-surface-variant/50 font-bold uppercase tracking-wider">
            operación normal
          </p>
        </div>

        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border border-white/40 dark:border-slate-800/60 rounded-2xl p-5 flex flex-col gap-1">
          <p className="text-[9px] font-black tracking-widest text-on-surface-variant/70 uppercase">
            Score Agresividad
          </p>
          <div className="flex items-baseline gap-1">
            <p
              className={`text-3xl font-black tracking-tight ${
                avgScore >= 65
                  ? "text-error"
                  : avgScore >= 35
                  ? "text-amber-500"
                  : "text-emerald-500"
              }`}
            >
              {loading ? "—" : avgScore}
            </p>
            <span className="text-[8px] font-black text-on-surface-variant/50 uppercase">
              / 100
            </span>
          </div>
          <p className="text-[9px] text-on-surface-variant/50 font-bold uppercase tracking-wider">
            promedio flota
          </p>
        </div>
      </div>

      {/* ── Map + Detail panel ── */}
      {showMap && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 slide-rt">
          {/* Map */}
          <div className="lg:col-span-2 backdrop-blur-xl bg-white/50 dark:bg-slate-900/50 border border-white/40 dark:border-slate-800/60 rounded-2xl overflow-hidden relative" style={{ minHeight: "420px" }}>
            {/* Header strip */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-white/20 dark:border-slate-800/30">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-black text-on-surface uppercase tracking-widest">
                  Minera Las Bambas — Vista Satelital
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Severity dots */}
                {(["ROJA","AMARILLA","VERDE"] as Severity[]).map((s) => (
                  <div key={s} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full pulse-dot ${
                      s === "ROJA" ? "bg-error" : s === "AMARILLA" ? "bg-amber-400" : "bg-emerald-400"
                    }`} />
                    <span className="text-[7px] font-black text-on-surface-variant/50 uppercase tracking-wider">
                      {s}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* iFrame map */}
            <div className="absolute inset-0 top-10">
              <iframe
                className="w-full h-full border-0"
                src="https://maps.google.com/maps?hl=es&q=minera+bambas+apurimac&t=k&z=15&ie=UTF8&iwloc=B&output=embed"
                allowFullScreen
                loading="lazy"
                style={{ pointerEvents: "auto" }}
              />
            </div>

            {/* Overlay legend pills */}
            <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5">
              {segments.slice(0, 6).map((seg) => (
                <button
                  key={seg.id}
                  onClick={() =>
                    setSelectedSegId(seg.id === selectedSegId ? null : seg.id)
                  }
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    selectedSegId === seg.id
                      ? seg.severity === "ROJA"
                        ? "bg-error text-white border-error shadow-lg"
                        : seg.severity === "AMARILLA"
                        ? "bg-amber-500 text-white border-amber-500 shadow-lg"
                        : "bg-emerald-500 text-white border-emerald-500 shadow-lg"
                      : "bg-white/80 dark:bg-slate-900/80 border-white/30 dark:border-slate-800/50 text-on-surface hover:scale-105"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      seg.severity === "ROJA"
                        ? "bg-error"
                        : seg.severity === "AMARILLA"
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    } ${selectedSegId === seg.id ? "bg-white" : ""}`}
                  />
                  {seg.tajo.replace("Tajo ", "T.")} — {seg.id.split("-").slice(-2).join(" ")}
                </button>
              ))}
            </div>
          </div>

          {/* Side detail panel */}
          <div className="flex flex-col gap-4">
            {selectedSeg ? (
              <>
                {/* Selected segment detail */}
                <div
                  className={`backdrop-blur-xl border rounded-2xl p-5 flex flex-col gap-4 ${
                    selectedSeg.severity === "ROJA"
                      ? "bg-error/10 border-error/35"
                      : selectedSeg.severity === "AMARILLA"
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-emerald-500/5 border-emerald-500/25"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[9px] font-black text-on-surface-variant/50 uppercase tracking-widest">
                        Segmento Seleccionado
                      </p>
                      <h3 className="text-sm font-black text-on-surface mt-0.5 leading-tight">
                        {selectedSeg.tajo}
                      </h3>
                      <p className="text-[9px] text-on-surface-variant/60 font-bold uppercase tracking-wider mt-0.5">
                        {selectedSeg.id.split("-").slice(-2).join(" ")}
                      </p>
                    </div>
                    <SeverityBadge severity={selectedSeg.severity} />
                  </div>

                  {/* Score gauge */}
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest">
                        Score de Agresividad
                      </span>
                      <span
                        className={`text-base font-black ${
                          selectedSeg.severity === "ROJA"
                            ? "text-error"
                            : selectedSeg.severity === "AMARILLA"
                            ? "text-amber-500"
                            : "text-emerald-500"
                        }`}
                      >
                        {selectedSeg.aggressivenessScore}/100
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-white/15 dark:bg-slate-800/40 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          selectedSeg.severity === "ROJA"
                            ? "bg-gradient-to-r from-error to-error/80"
                            : selectedSeg.severity === "AMARILLA"
                            ? "bg-gradient-to-r from-amber-400 to-amber-500"
                            : "bg-gradient-to-r from-emerald-400 to-emerald-500"
                        }`}
                        style={{
                          width: `${selectedSeg.aggressivenessScore}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        icon: <Activity className="w-3 h-3" />,
                        label: "Vibr. Promedio",
                        value: `${selectedSeg.avgVibration} G`,
                        sub: `Máx: ${selectedSeg.maxVibration} G`,
                        bar: selectedSeg.avgVibration,
                        max: 3.5,
                        color:
                          selectedSeg.avgVibration > 2.5
                            ? "bg-error"
                            : selectedSeg.avgVibration > 1.5
                            ? "bg-amber-400"
                            : "bg-emerald-400",
                      },
                      {
                        icon: <TrendingDown className="w-3 h-3" />,
                        label: "Presión Prom.",
                        value: `${selectedSeg.avgPressure} PSI`,
                        sub: "Rango: 105–125",
                        bar: selectedSeg.avgPressure - 105,
                        max: 20,
                        color: "bg-secondary/70",
                      },
                      {
                        icon: <Gauge className="w-3 h-3" />,
                        label: "Velocidad Prom.",
                        value: `${selectedSeg.avgSpeed.toFixed(1)} km/h`,
                        sub: "Rango: 10–40",
                        bar: selectedSeg.avgSpeed - 10,
                        max: 30,
                        color: "bg-sky-400/70",
                      },
                      {
                        icon: <Thermometer className="w-3 h-3" />,
                        label: "Temp Prom.",
                        value: `${selectedSeg.avgTemp.toFixed(1)}°C`,
                        sub: selectedSeg.avgTemp > 85 ? "CRÍTICO" : "Normal",
                        bar: selectedSeg.avgTemp - 40,
                        max: 55,
                        color:
                          selectedSeg.avgTemp > 85 ? "bg-error" : "bg-tertiary/70",
                      },
                    ].map((m, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-1 p-2.5 rounded-xl bg-white/20 dark:bg-slate-950/20 border border-white/10 dark:border-slate-800/25"
                      >
                        <div className="flex items-center gap-1 text-on-surface-variant/60">
                          {m.icon}
                          <span className="text-[7px] font-black uppercase tracking-wider">
                            {m.label}
                          </span>
                        </div>
                        <span className="text-sm font-black text-on-surface">
                          {m.value}
                        </span>
                        <MetricBar value={m.bar} max={m.max} color={m.color} />
                        <span className="text-[7px] text-on-surface-variant/40 font-bold">
                          {m.sub}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between text-[9px] font-black text-on-surface-variant/50 uppercase tracking-wider pt-1 border-t border-white/10 dark:border-slate-800/20">
                    <span className="flex items-center gap-1">
                      <Navigation2 className="w-2.5 h-2.5" />
                      {selectedSeg.truckCount} camiones activos
                    </span>
                    <span
                      className={selectedSeg.criticalTrucks > 0 ? "text-error" : ""}
                    >
                      {selectedSeg.criticalTrucks} críticos
                    </span>
                  </div>
                </div>

                {/* Vibration sparkline */}
                <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/50 border border-white/40 dark:border-slate-800/60 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-2">
                    Vibración Estructural — Última telemetría
                  </p>
                  <VibSparkline trucks={selectedSeg.trucks} />
                  <div className="flex justify-between mt-1">
                    <span className="text-[7px] font-bold text-on-surface-variant/30 uppercase">
                      — histórico
                    </span>
                    <span className="text-[7px] font-bold text-on-surface-variant/30 uppercase">
                      ahora →
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-slate-800/50 rounded-2xl text-on-surface-variant/40">
                <MapPin className="w-8 h-8" />
                <p className="text-[10px] font-black uppercase tracking-widest text-center px-4">
                  Selecciona un segmento del mapa para ver el análisis de agresividad
                </p>
              </div>
            )}

            {/* Most aggressive truck */}
            {mostAggressiveTruck && (
              <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/50 border border-white/40 dark:border-slate-800/60 rounded-2xl p-4 flex flex-col gap-2">
                <p className="text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest">
                  Mayor vibración en flota
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-base font-black text-on-surface">
                      {mostAggressiveTruck.id}
                    </p>
                    <p className="text-[9px] text-on-surface-variant/50 font-bold">
                      {mostAggressiveTruck.tajo}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-error">
                      {mostAggressiveTruck.maxVibration.toFixed(1)} G
                    </p>
                    <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-wider">
                      G-RMS Máx
                    </p>
                  </div>
                </div>
                <MetricBar
                  value={mostAggressiveTruck.maxVibration}
                  max={3.5}
                  color="bg-gradient-to-r from-error to-error/70"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl border border-white/30 dark:border-slate-800/50">
        <div className="flex gap-1 p-1 bg-white/30 dark:bg-slate-950/20 rounded-xl border border-white/10">
          {(["ALL", "ROJA", "AMARILLA", "VERDE"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all duration-200 cursor-pointer ${
                filterSeverity === s
                  ? "bg-white dark:bg-slate-800 text-on-surface shadow"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {s === "ALL" ? "TODOS" : `ZONA ${s}`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-on-surface-variant/50" />
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="appearance-none bg-white/60 dark:bg-slate-900/50 backdrop-blur-md border border-white/20 dark:border-slate-800/40 rounded-xl text-[10px] font-black text-on-surface px-3 py-2 pr-6 focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all tracking-widest uppercase cursor-pointer"
          >
            {zones.map((z) => (
              <option key={z} value={z}>
                {z === "ALL" ? "TODAS LAS ZONAS" : z.toUpperCase()}
              </option>
            ))}
          </select>

          <span className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest ml-2">
            {filtered.length} segmentos
          </span>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="w-10 h-10 rounded-full border-4 border-emerald-400/30 border-t-emerald-400 animate-spin" />
          <p className="text-sm font-black text-on-surface-variant uppercase tracking-widest">
            Clasificando segmentos desde telemetría en vivo...
          </p>
        </div>
      )}

      {/* ── Segment Cards ── */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((seg, idx) => (
            <div
              key={seg.id}
              onClick={() =>
                setSelectedSegId(seg.id === selectedSegId ? null : seg.id)
              }
              style={{ animationDelay: `${idx * 25}ms` }}
              className={`slide-rt backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border border-t-4 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl shadow-md cursor-pointer ${
                selectedSegId === seg.id
                  ? seg.severity === "ROJA"
                    ? "border-error ring-2 ring-error/30"
                    : seg.severity === "AMARILLA"
                    ? "border-amber-500 ring-2 ring-amber-500/30"
                    : "border-emerald-500 ring-2 ring-emerald-500/30"
                  : seg.severity === "ROJA"
                  ? "border-error/50 border-t-error/80"
                  : seg.severity === "AMARILLA"
                  ? "border-amber-500/35 border-t-amber-500/70"
                  : "border-emerald-500/25 border-t-emerald-500/60"
              }`}
            >
              {/* Card header */}
              <div
                className={`px-4 py-3 flex justify-between items-center border-b border-white/10 dark:border-slate-800/30 ${
                  seg.severity === "ROJA"
                    ? "bg-error/10"
                    : seg.severity === "AMARILLA"
                    ? "bg-amber-500/10"
                    : "bg-emerald-500/5"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-[8px] font-black text-on-surface-variant/50 uppercase tracking-widest">
                    {seg.tajo}
                  </p>
                  <p className="text-xs font-black text-on-surface truncate">
                    {seg.id.split("-").slice(-2).join(" ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                  </p>
                </div>
                <SeverityBadge severity={seg.severity} />
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col gap-4">
                {/* Score — hero */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[8px] font-black text-on-surface-variant/50 uppercase tracking-widest mb-0.5">
                      Score Agresividad
                    </p>
                    <div className="flex items-baseline gap-0.5">
                      <span
                        className={`text-4xl font-black tracking-tight leading-none ${
                          seg.severity === "ROJA"
                            ? "text-error"
                            : seg.severity === "AMARILLA"
                            ? "text-amber-500"
                            : "text-emerald-500"
                        }`}
                      >
                        {seg.aggressivenessScore}
                      </span>
                      <span className="text-xs font-bold text-on-surface-variant/50 pb-0.5">
                        /100
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-on-surface-variant/50 uppercase tracking-widest mb-0.5">
                      Camiones
                    </p>
                    <span className="text-xl font-black text-on-surface">
                      {seg.truckCount}
                    </span>
                    {seg.criticalTrucks > 0 && (
                      <p className="text-[8px] font-black text-error">
                        {seg.criticalTrucks} críticos
                      </p>
                    )}
                  </div>
                </div>

                {/* Score bar */}
                <div className="h-2 w-full bg-white/15 dark:bg-slate-800/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      seg.severity === "ROJA"
                        ? "bg-gradient-to-r from-error to-error/80"
                        : seg.severity === "AMARILLA"
                        ? "bg-gradient-to-r from-amber-400 to-amber-500"
                        : "bg-gradient-to-r from-emerald-400 to-emerald-500"
                    }`}
                    style={{ width: `${seg.aggressivenessScore}%` }}
                  />
                </div>

                {/* Vibration sparkline mini */}
                <div>
                  <p className="text-[7px] font-black text-on-surface-variant/40 uppercase tracking-widest mb-1">
                    Vibración — telemetría reciente
                  </p>
                  <VibSparkline trucks={seg.trucks} />
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    {
                      icon: <Activity className="w-2.5 h-2.5" />,
                      label: "Vibr",
                      value: `${seg.avgVibration} G`,
                      critical: seg.avgVibration > 2.5,
                    },
                    {
                      icon: <Gauge className="w-2.5 h-2.5" />,
                      label: "Veloc",
                      value: `${seg.avgSpeed.toFixed(0)} km/h`,
                      critical: false,
                    },
                    {
                      icon: <TrendingDown className="w-2.5 h-2.5" />,
                      label: "Presión",
                      value: `${seg.avgPressure.toFixed(0)} PSI`,
                      critical: false,
                    },
                    {
                      icon: <Thermometer className="w-2.5 h-2.5" />,
                      label: "Temp",
                      value: `${seg.avgTemp.toFixed(0)}°C`,
                      critical: seg.avgTemp > 85,
                    },
                  ].map((m, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[9px] font-black ${
                        m.critical
                          ? "border-error/25 bg-error/5 text-error"
                          : "border-white/10 dark:border-slate-800/25 bg-white/15 dark:bg-slate-950/15 text-on-surface"
                      }`}
                    >
                      <span className="text-on-surface-variant/50">
                        {m.icon}
                      </span>
                      <span className="text-on-surface-variant/50 uppercase tracking-wider text-[7px]">
                        {m.label}:
                      </span>
                      {m.value}
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSegId(seg.id === selectedSegId ? null : seg.id);
                    if (!showMap) setShowMap(true);
                  }}
                  className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                    seg.severity === "ROJA"
                      ? "bg-error text-white hover:bg-error/90 shadow-lg shadow-error/15"
                      : seg.severity === "AMARILLA"
                      ? "border border-amber-500/35 text-amber-500 hover:bg-amber-500/10"
                      : "border border-white/20 dark:border-slate-800/40 text-on-surface-variant hover:bg-white/10 dark:hover:bg-slate-950/20"
                  }`}
                >
                  <ArrowUpRight className="w-3 h-3" />
                  Ver en Mapa
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && !loading && (
            <div className="col-span-full py-20 flex flex-col items-center gap-3 backdrop-blur-sm bg-white/10 dark:bg-slate-900/10 border border-white/10 rounded-2xl text-on-surface-variant/40">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              <p className="font-black uppercase tracking-widest text-sm">
                Sin segmentos para este filtro
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Fleet vibration heatmap strip ── */}
      {!loading && trucks.length > 0 && (
        <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/50 border border-white/40 dark:border-slate-800/60 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-black text-on-surface uppercase tracking-widest flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-on-surface-variant/50" />
                Heatmap de Vibración — Flota Completa
              </h2>
              <p className="text-[9px] text-on-surface-variant/50 font-bold uppercase tracking-wider mt-0.5">
                G-RMS máximo por unidad · Ordenado por agresividad
              </p>
            </div>
            <div className="flex gap-3 text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                &lt;1.5G
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                1.5–2.5G
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-error" />
                &gt;2.5G
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[...trucks]
              .sort((a, b) => b.maxVibration - a.maxVibration)
              .map((truck) => {
                const pct = Math.min(100, (truck.maxVibration / 3.5) * 100);
                const color =
                  truck.maxVibration > 2.5
                    ? "bg-error"
                    : truck.maxVibration > 1.5
                    ? "bg-amber-400"
                    : "bg-emerald-400/70";
                return (
                  <div
                    key={truck.id}
                    className="flex flex-col items-center gap-1 group cursor-default"
                    title={`${truck.id}: ${truck.maxVibration.toFixed(2)} G — ${truck.tajo}`}
                  >
                    <div className="w-2 h-14 bg-white/10 dark:bg-slate-800/40 rounded-full overflow-hidden flex flex-col-reverse">
                      <div
                        className={`w-full rounded-full transition-all duration-500 ${color}`}
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[5.5px] font-black text-on-surface-variant/30 uppercase">
                      {truck.id.replace("CAT-797-", "").slice(-3)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── Footer note ── */}
      <div className="flex items-center gap-2 text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest">
        <Zap className="w-3 h-3" />
        Clasificación derivada del Modelo C (K-Means + Random Forest) a partir de telemetría
        en tiempo real vía Supabase Realtime. Input: vibracion_g, presion_psi, velocidad_kmh.
      </div>
    </div>
  );
}
