"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useThermalData, TruckThermalData } from "../../../hooks/useThermalData";
import {
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Radio,
  Thermometer,
  Gauge,
  Activity,
  TrendingDown,
  MapPin,
  Clock,
  ChevronDown,
  X,
  BadgeCheck,
  Zap,
  RefreshCw,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SwapCandidate {
  id: string;
  truck: TruckThermalData;
  urgencyScore: number; // 0–100
  urgency: "ALTA" | "MEDIA" | "BAJA";
  motivo: string;
  suggestedTarget?: string; // id del camión destino sugerido
}

interface SwapAction {
  id: string;
  source: SwapCandidate;
  target: SwapCandidate;
  status: "PENDING" | "APPROVED" | "REJECTED";
  timestamp: string;
}

// ─── Utility: build swap recommendations from live fleet data ─────────────────

function buildSwapCandidates(trucks: TruckThermalData[]): SwapCandidate[] {
  const norte = trucks.filter((t) => t.tajo?.toUpperCase().includes("NORTE"));
  const sur = trucks.filter((t) => t.tajo?.toUpperCase().includes("SUR"));

  const hotSur = [...sur]
    .sort((a, b) => b.maxTemp - a.maxTemp)
    .slice(0, 5);

  const coldNorte = [...norte]
    .sort((a, b) => a.maxTemp - b.maxTemp)
    .slice(0, 5);

  const candidates: SwapCandidate[] = [];

  hotSur.forEach((truck) => {
    const tempDelta = truck.maxTemp - 75;
    const urgencyScore = Math.min(100, Math.round((tempDelta / 20) * 100));
    const urgency: "ALTA" | "MEDIA" | "BAJA" =
      truck.isCritical ? "ALTA" : truck.isWarning ? "MEDIA" : "BAJA";

    if (urgency === "BAJA") return; // solo sugerir si hay desgaste relevante

    const bestTarget = coldNorte.find(
      (t) => t.maxTemp < 72 && t.id !== truck.id
    );

    candidates.push({
      id: `SWAP-${truck.id}`,
      truck,
      urgencyScore: Math.max(0, urgencyScore),
      urgency,
      motivo:
        truck.isCritical
          ? `Temperatura crítica ${truck.maxTemp.toFixed(1)}°C — riesgo de fallo inminente. Reubicar a Tajo Norte.`
          : `Temperatura elevada ${truck.maxTemp.toFixed(1)}°C en Tajo Sur. Rotación preventiva recomendada.`,
      suggestedTarget: bestTarget?.id,
    });
  });

  // Sort by urgency score descending
  return candidates.sort((a, b) => b.urgencyScore - a.urgencyScore);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UrgencyBadge({ urgency }: { urgency: "ALTA" | "MEDIA" | "BAJA" }) {
  const cfg = {
    ALTA: {
      bg: "bg-error/15 text-error border-error/30",
      dot: "bg-error",
      pulse: true,
      icon: <ShieldAlert className="w-3 h-3" />,
    },
    MEDIA: {
      bg: "bg-amber-500/15 text-amber-500 border-amber-500/30",
      dot: "bg-amber-500",
      pulse: false,
      icon: <AlertTriangle className="w-3 h-3" />,
    },
    BAJA: {
      bg: "bg-secondary/15 text-secondary border-secondary/30",
      dot: "bg-secondary",
      pulse: false,
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
  }[urgency];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${cfg.bg}`}
    >
      {cfg.icon}
      PRIORIDAD {urgency}
    </span>
  );
}

function MetricPill({
  icon,
  value,
  label,
  critical,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  critical?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border backdrop-blur-sm ${
        critical
          ? "border-error/25 bg-error/5 text-error"
          : "border-white/10 dark:border-slate-800/30 bg-white/20 dark:bg-slate-950/20 text-on-surface"
      }`}
    >
      <span className="text-on-surface-variant/60">{icon}</span>
      <span className={`text-xs font-black ${critical ? "text-error" : ""}`}>
        {value}
      </span>
      <span className="text-[8px] font-black tracking-wider text-on-surface-variant/50 uppercase">
        {label}
      </span>
    </div>
  );
}

function TruckMiniCard({
  truck,
  role,
}: {
  truck: TruckThermalData;
  role: "origen" | "destino";
}) {
  const isOrigin = role === "origen";
  const accent = isOrigin
    ? truck.isCritical
      ? "border-error/40"
      : "border-amber-500/40"
    : "border-secondary/40";
  const tempColor = truck.isCritical
    ? "text-error"
    : truck.isWarning
    ? "text-amber-500"
    : "text-secondary";

  return (
    <div
      className={`flex-1 rounded-2xl border backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 p-4 flex flex-col gap-3 ${accent}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[9px] font-black tracking-widest text-on-surface-variant/60 uppercase">
            Camión {isOrigin ? "Origen" : "Destino"}
          </p>
          <h3 className="text-lg font-black text-on-surface tracking-tight mt-0.5">
            {truck.id}
          </h3>
        </div>
        <span
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
            truck.isCritical
              ? "bg-error/15 text-error border border-error/25"
              : truck.isWarning
              ? "bg-amber-500/15 text-amber-500 border border-amber-500/25"
              : "bg-secondary/15 text-secondary border border-secondary/25"
          }`}
        >
          {truck.status}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-[9px] font-black text-on-surface-variant/60 uppercase tracking-wider">
        <MapPin className="w-3 h-3" />
        {truck.tajo}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MetricPill
          icon={<Thermometer className="w-3 h-3" />}
          value={`${truck.maxTemp.toFixed(1)}°C`}
          label="Temp Máx"
          critical={truck.isCritical}
        />
        <MetricPill
          icon={<Gauge className="w-3 h-3" />}
          value={`${truck.speed.toFixed(0)} km/h`}
          label="Velocidad"
        />
        <MetricPill
          icon={<Activity className="w-3 h-3" />}
          value={`${truck.maxVibration.toFixed(1)} G`}
          label="Vibración"
        />
        <MetricPill
          icon={<TrendingDown className="w-3 h-3" />}
          value={`${truck.maxPressure.toFixed(0)} PSI`}
          label="Presión"
        />
      </div>

      {/* Wheel temp heat strip */}
      <div className="flex gap-0.5">
        {Object.entries(truck.wheels).map(([pos, temp], i) => {
          const pct = Math.min(100, ((temp - 40) / 55) * 100);
          const color =
            temp > 85
              ? "bg-error"
              : temp > 75
              ? "bg-amber-400"
              : "bg-secondary/60";
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full h-1.5 rounded-full bg-white/10 dark:bg-slate-800/40 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[7px] text-on-surface-variant/40 font-bold">
                P{i + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SwapsPage() {
  const { trucks, loading } = useThermalData();
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actions, setActions] = useState<Record<string, SwapAction>>({});
  const [notification, setNotification] = useState<{
    msg: string;
    type: "ok" | "err";
  } | null>(null);

  const candidates = useMemo(() => buildSwapCandidates(trucks), [trucks]);

  const norte = useMemo(
    () => trucks.filter((t) => t.tajo?.toUpperCase().includes("NORTE")),
    [trucks]
  );
  const sur = useMemo(
    () => trucks.filter((t) => t.tajo?.toUpperCase().includes("SUR")),
    [trucks]
  );

  const pendingCount = candidates.filter(
    (c) => !actions[c.id] || actions[c.id].status === "PENDING"
  ).length;
  const criticalCount = candidates.filter((c) => c.urgency === "ALTA").length;
  const approvedCount = Object.values(actions).filter(
    (a) => a.status === "APPROVED"
  ).length;

  const showNotification = useCallback(
    (msg: string, type: "ok" | "err") => {
      setNotification({ msg, type });
      setTimeout(() => setNotification(null), 3500);
    },
    []
  );

  const handleApprove = useCallback(
    (candidate: SwapCandidate) => {
      const targetTruck = trucks.find(
        (t) => t.id === candidate.suggestedTarget
      );
      if (!targetTruck) {
        showNotification("No hay camión destino disponible para este swap.", "err");
        return;
      }
      const action: SwapAction = {
        id: candidate.id,
        source: candidate,
        target: {
          id: `SWAP-${targetTruck.id}`,
          truck: targetTruck,
          urgencyScore: 0,
          urgency: "BAJA",
          motivo: "",
        },
        status: "APPROVED",
        timestamp: new Date().toLocaleTimeString("es-PE", { hour12: false }),
      };
      setActions((prev) => ({ ...prev, [candidate.id]: action }));
      showNotification(
        `✓ Swap aprobado: ${candidate.truck.id} → ${targetTruck.id}`,
        "ok"
      );
    },
    [trucks, showNotification]
  );

  const handleReject = useCallback(
    (candidate: SwapCandidate) => {
      const action: SwapAction = {
        id: candidate.id,
        source: candidate,
        target: candidate,
        status: "REJECTED",
        timestamp: new Date().toLocaleTimeString("es-PE", { hour12: false }),
      };
      setActions((prev) => ({ ...prev, [candidate.id]: action }));
      showNotification(`Swap rechazado: ${candidate.truck.id}`, "err");
    },
    [showNotification]
  );

  const filtered = useMemo(() => {
    if (filterPriority === "ALL") return candidates;
    return candidates.filter((c) => c.urgency === filterPriority);
  }, [candidates, filterPriority]);

  return (
    <div className="relative space-y-8 max-w-[1400px] mx-auto pb-32 z-10">
      {/* ── Animations ─────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes float-a {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(50px,-70px) scale(1.15); }
        }
        @keyframes float-b {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-70px,55px) scale(0.9); }
        }
        .blob-a { animation: float-a 22s ease-in-out infinite; }
        .blob-b { animation: float-b 28s ease-in-out infinite; }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .slide-in { animation: slide-in 0.25s ease; }
        @keyframes expand-down {
          from { opacity: 0; max-height: 0; }
          to   { opacity: 1; max-height: 700px; }
        }
        .expand-down { animation: expand-down 0.3s ease; overflow: hidden; }
      `}</style>

      {/* ── Background blobs ────────────────────────────────────────────────── */}
      <div className="absolute inset-0 -top-32 overflow-hidden pointer-events-none -z-10 select-none">
        <div className="blob-a absolute top-[5%] left-[3%] w-[480px] h-[480px] rounded-full bg-gradient-to-br from-violet-500/20 via-purple-400/15 to-fuchsia-400/10 blur-[90px]" />
        <div className="blob-b absolute top-[20%] right-[2%] w-[520px] h-[520px] rounded-full bg-gradient-to-bl from-sky-500/25 via-blue-400/20 to-teal-400/15 blur-[100px]" />
      </div>

      {/* ── Toast notification ──────────────────────────────────────────────── */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-50 slide-in flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border text-sm font-bold ${
            notification.type === "ok"
              ? "bg-secondary/20 border-secondary/40 text-secondary"
              : "bg-error/20 border-error/40 text-error"
          }`}
        >
          {notification.type === "ok" ? (
            <BadgeCheck className="w-4 h-4 flex-shrink-0" />
          ) : (
            <X className="w-4 h-4 flex-shrink-0" />
          )}
          {notification.msg}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-on-surface">
            Swaps Sugeridos
          </h1>
          <p className="text-sm text-on-surface-variant font-semibold mt-1.5 flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400" />
            Motor de Lógica Difusa — Modelo D · Rotación óptima Tajo Sur ↔ Norte
          </p>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 shadow-sm self-start md:self-auto">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
            {loading ? "Conectando..." : "Telemetría en Vivo"}
          </span>
          <Radio className="w-3.5 h-3.5 text-emerald-500" />
        </div>
      </div>

      {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Swaps pendientes */}
        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border border-white/40 dark:border-slate-800/60 rounded-2xl p-5 flex flex-col gap-1">
          <p className="text-[9px] font-black tracking-widest text-on-surface-variant/70 uppercase">
            Swaps Pendientes
          </p>
          <p className="text-3xl font-black text-on-surface tracking-tight">
            {String(pendingCount).padStart(2, "0")}
          </p>
          <p className="text-[9px] text-on-surface-variant/50 font-bold uppercase tracking-wider">
            en cola de aprobación
          </p>
        </div>

        {/* Críticos */}
        <div
          className={`backdrop-blur-xl border rounded-2xl p-5 flex flex-col gap-1 ${
            criticalCount > 0
              ? "bg-error/10 border-error/30 dark:border-error/25"
              : "bg-white/70 dark:bg-slate-900/60 border-white/40 dark:border-slate-800/60"
          }`}
        >
          <p
            className={`text-[9px] font-black tracking-widest uppercase ${
              criticalCount > 0 ? "text-error" : "text-on-surface-variant/70"
            }`}
          >
            Prioridad Alta
          </p>
          <p
            className={`text-3xl font-black tracking-tight ${
              criticalCount > 0 ? "text-error" : "text-on-surface"
            }`}
          >
            {String(criticalCount).padStart(2, "0")}
          </p>
          <p className="text-[9px] text-on-surface-variant/50 font-bold uppercase tracking-wider">
            {criticalCount > 0 ? "acción inmediata" : "sin alertas críticas"}
          </p>
        </div>

        {/* Tajo Sur activo */}
        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border border-white/40 dark:border-slate-800/60 rounded-2xl p-5 flex flex-col gap-1">
          <p className="text-[9px] font-black tracking-widest text-on-surface-variant/70 uppercase">
            Tajo Sur
          </p>
          <p className="text-3xl font-black text-on-surface tracking-tight">
            {String(sur.length).padStart(2, "0")}
          </p>
          <p className="text-[9px] text-on-surface-variant/50 font-bold uppercase tracking-wider">
            camiones activos
          </p>
        </div>

        {/* Aprobados */}
        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border border-white/40 dark:border-slate-800/60 rounded-2xl p-5 flex flex-col gap-1">
          <p className="text-[9px] font-black tracking-widest text-on-surface-variant/70 uppercase">
            Swaps Aprobados
          </p>
          <p className="text-3xl font-black text-secondary tracking-tight">
            {String(approvedCount).padStart(2, "0")}
          </p>
          <p className="text-[9px] text-on-surface-variant/50 font-bold uppercase tracking-wider">
            esta sesión
          </p>
        </div>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl border border-white/30 dark:border-slate-800/50">
        <div className="flex gap-1 p-1 bg-white/30 dark:bg-slate-950/20 rounded-xl border border-white/10">
          {(["ALL", "ALTA", "MEDIA"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all duration-200 cursor-pointer ${
                filterPriority === p
                  ? "bg-white dark:bg-slate-800 text-on-surface shadow"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {p === "ALL" ? "TODAS" : `PRIORIDAD ${p}`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest">
          <RefreshCw className="w-3 h-3" />
          {loading ? "Actualizando..." : `${candidates.length} recomendaciones`}
        </div>
      </div>

      {/* ── Swap Cards ─────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="w-10 h-10 rounded-full border-4 border-secondary/30 border-t-secondary animate-spin" />
          <p className="text-sm font-black text-on-surface-variant uppercase tracking-widest">
            Analizando flota en tiempo real...
          </p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 backdrop-blur-sm bg-white/10 dark:bg-slate-900/10 border border-white/10 rounded-2xl">
          <CheckCircle2 className="w-10 h-10 text-secondary" />
          <p className="font-black text-on-surface-variant uppercase tracking-widest text-sm">
            Sin recomendaciones de swap para este filtro
          </p>
          <p className="text-xs text-on-surface-variant/50 font-semibold">
            La flota opera dentro de parámetros normales
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {filtered.map((candidate) => {
          const action = actions[candidate.id];
          const isExpanded = expandedId === candidate.id;
          const targetTruck = trucks.find(
            (t) => t.id === candidate.suggestedTarget
          );
          const isApproved = action?.status === "APPROVED";
          const isRejected = action?.status === "REJECTED";

          return (
            <div
              key={candidate.id}
              className={`backdrop-blur-xl border rounded-2xl overflow-hidden transition-all duration-300 ${
                isApproved
                  ? "border-secondary/40 bg-secondary/5 dark:bg-secondary/5"
                  : isRejected
                  ? "border-white/20 dark:border-slate-800/40 bg-white/30 dark:bg-slate-900/30 opacity-60"
                  : candidate.urgency === "ALTA"
                  ? "border-error/35 bg-white/70 dark:bg-slate-900/60 shadow-lg shadow-error/5"
                  : "border-amber-500/25 bg-white/70 dark:bg-slate-900/60"
              }`}
            >
              {/* ── Card Header (always visible) ── */}
              <button
                onClick={() =>
                  setExpandedId(isExpanded ? null : candidate.id)
                }
                className="w-full px-6 py-4 flex items-center justify-between gap-4 cursor-pointer group"
              >
                {/* Left: id + urgency */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Urgency color stripe */}
                  <div
                    className={`w-1 h-10 rounded-full flex-shrink-0 ${
                      isApproved
                        ? "bg-secondary"
                        : isRejected
                        ? "bg-slate-400/40"
                        : candidate.urgency === "ALTA"
                        ? "bg-error"
                        : "bg-amber-400"
                    }`}
                  />
                  <div className="text-left min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black tracking-widest text-on-surface uppercase">
                        {candidate.truck.id}
                      </span>
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-secondary/15 text-secondary border border-secondary/25">
                          <BadgeCheck className="w-3 h-3" /> APROBADO ·{" "}
                          {action.timestamp}
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-500/15 text-slate-400 border border-slate-400/20">
                          <X className="w-3 h-3" /> RECHAZADO
                        </span>
                      ) : (
                        <UrgencyBadge urgency={candidate.urgency} />
                      )}
                    </div>
                    <p className="text-[10px] text-on-surface-variant/60 font-semibold mt-0.5 truncate">
                      {candidate.motivo}
                    </p>
                  </div>
                </div>

                {/* Right: quick metrics + chevron */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="text-right">
                      <p
                        className={`text-base font-black ${
                          candidate.truck.isCritical
                            ? "text-error"
                            : candidate.truck.isWarning
                            ? "text-amber-500"
                            : "text-on-surface"
                        }`}
                      >
                        {candidate.truck.maxTemp.toFixed(1)}°C
                      </p>
                      <p className="text-[8px] text-on-surface-variant/50 font-black uppercase tracking-wider">
                        Temp Máx
                      </p>
                    </div>
                    {/* Score bar */}
                    <div className="w-20 hidden md:block">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[8px] font-black text-on-surface-variant/50 uppercase tracking-wider">
                          Urgencia
                        </span>
                        <span className="text-[8px] font-black text-on-surface-variant/70">
                          {candidate.urgencyScore}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 dark:bg-slate-800/40 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            candidate.urgencyScore > 70
                              ? "bg-error"
                              : candidate.urgencyScore > 40
                              ? "bg-amber-400"
                              : "bg-secondary/60"
                          }`}
                          style={{ width: `${candidate.urgencyScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-on-surface-variant/50 transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {/* ── Expanded Detail ── */}
              {isExpanded && (
                <div className="expand-down border-t border-white/10 dark:border-slate-800/30 px-6 py-5 flex flex-col gap-5">
                  {/* Truck comparison */}
                  <div className="flex flex-col lg:flex-row items-stretch gap-4">
                    <TruckMiniCard truck={candidate.truck} role="origen" />

                    {/* Arrow */}
                    <div className="flex flex-row lg:flex-col items-center justify-center gap-1 px-2">
                      <div className="flex-1 lg:flex-none h-px lg:h-8 lg:w-px bg-white/20 dark:bg-slate-800/30" />
                      <div className="p-3 rounded-full bg-white/60 dark:bg-slate-900/60 border border-white/30 dark:border-slate-800/40 backdrop-blur-xl shadow">
                        <ArrowLeftRight className="w-5 h-5 text-violet-400" />
                      </div>
                      <div className="flex-1 lg:flex-none h-px lg:h-8 lg:w-px bg-white/20 dark:bg-slate-800/30" />
                      <p className="text-[8px] font-black text-on-surface-variant/50 uppercase tracking-wider lg:hidden">
                        SWAP
                      </p>
                    </div>

                    {targetTruck ? (
                      <TruckMiniCard truck={targetTruck} role="destino" />
                    ) : (
                      <div className="flex-1 rounded-2xl border border-dashed border-white/20 dark:border-slate-800/40 bg-white/20 dark:bg-slate-900/20 flex flex-col items-center justify-center gap-2 py-8 text-on-surface-variant/40">
                        <ArrowLeftRight className="w-6 h-6" />
                        <p className="text-[9px] font-black uppercase tracking-widest">
                          Sin camión destino disponible
                        </p>
                        <p className="text-[8px] text-center px-4">
                          No hay camiones en Tajo Norte con temperatura baja
                          disponibles
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Rationale */}
                  <div className="p-4 rounded-xl bg-white/30 dark:bg-slate-950/20 border border-white/15 dark:border-slate-800/30">
                    <p className="text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-1.5">
                      Análisis del Motor Difuso (Modelo D)
                    </p>
                    <p className="text-sm font-semibold text-on-surface leading-relaxed">
                      {candidate.motivo}
                      {targetTruck &&
                        ` Camión recomendado para rotación: ${targetTruck.id} (${targetTruck.tajo}, ${targetTruck.maxTemp.toFixed(1)}°C). El intercambio balancearía el desgaste térmico en la flota.`}
                    </p>
                  </div>

                  {/* Action buttons */}
                  {!isApproved && !isRejected && (
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => handleReject(candidate)}
                        className="px-5 py-2.5 rounded-xl border border-white/20 dark:border-slate-800/40 text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-white/10 dark:hover:bg-slate-950/20 transition-all cursor-pointer active:scale-95"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleApprove(candidate)}
                        disabled={!targetTruck}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer active:scale-95 flex items-center gap-2 ${
                          targetTruck
                            ? candidate.urgency === "ALTA"
                              ? "bg-error text-white hover:bg-error/90 shadow-lg shadow-error/20"
                              : "bg-secondary text-white hover:bg-secondary/90 shadow-lg shadow-secondary/20"
                            : "bg-slate-400/20 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        <BadgeCheck className="w-3.5 h-3.5" />
                        Aprobar Swap
                      </button>
                    </div>
                  )}

                  {isApproved && (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/10 border border-secondary/25">
                      <BadgeCheck className="w-4 h-4 text-secondary flex-shrink-0" />
                      <p className="text-xs font-bold text-secondary">
                        Swap aprobado a las {action.timestamp}. La orden fue
                        registrada y está en proceso de ejecución.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Fleet Overview ──────────────────────────────────────────────────── */}
      {!loading && trucks.length > 0 && (
        <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/50 border border-white/40 dark:border-slate-800/60 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-black text-on-surface uppercase tracking-widest">
                Vista General de Flota
              </h2>
              <p className="text-[9px] text-on-surface-variant/60 font-bold uppercase tracking-wider mt-0.5">
                {trucks.length} camiones activos · temperatura máxima por unidad
              </p>
            </div>
            <div className="flex gap-3 text-[9px] font-black uppercase tracking-widest text-on-surface-variant/50">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary/70" />
                Normal
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Elevado
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-error" />
                Crítico
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[...trucks]
              .sort((a, b) => b.maxTemp - a.maxTemp)
              .map((truck) => {
                const pct = Math.min(100, ((truck.maxTemp - 40) / 55) * 100);
                const color = truck.isCritical
                  ? "bg-error"
                  : truck.isWarning
                  ? "bg-amber-400"
                  : "bg-secondary/60";
                return (
                  <div
                    key={truck.id}
                    className="flex flex-col items-center gap-1 group cursor-default"
                    title={`${truck.id}: ${truck.maxTemp.toFixed(1)}°C — ${truck.tajo}`}
                  >
                    <div className="w-1.5 h-14 bg-white/10 dark:bg-slate-800/40 rounded-full overflow-hidden flex flex-col-reverse">
                      <div
                        className={`w-full rounded-full transition-all duration-500 ${color}`}
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[6px] font-black text-on-surface-variant/30 uppercase">
                      {truck.id.replace("CAT-797-", "").slice(-3)}
                    </span>
                  </div>
                );
              })}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 dark:border-slate-800/30 flex flex-wrap gap-4">
            <div className="flex flex-col">
              <p className="text-[8px] font-black text-on-surface-variant/50 uppercase tracking-widest">
                Tajo Norte
              </p>
              <p className="text-sm font-black text-on-surface">
                {norte.length} unidades
              </p>
              <p className="text-[9px] text-secondary font-bold">
                Máx:{" "}
                {norte.length > 0
                  ? Math.max(...norte.map((t) => t.maxTemp)).toFixed(1)
                  : "—"}
                °C
              </p>
            </div>
            <div className="w-px bg-white/10 dark:bg-slate-800/30 self-stretch" />
            <div className="flex flex-col">
              <p className="text-[8px] font-black text-on-surface-variant/50 uppercase tracking-widest">
                Tajo Sur
              </p>
              <p className="text-sm font-black text-on-surface">
                {sur.length} unidades
              </p>
              <p className="text-[9px] text-error font-bold">
                Máx:{" "}
                {sur.length > 0
                  ? Math.max(...sur.map((t) => t.maxTemp)).toFixed(1)
                  : "—"}
                °C
              </p>
            </div>
            <div className="w-px bg-white/10 dark:bg-slate-800/30 self-stretch" />
            <div className="flex flex-col">
              <p className="text-[8px] font-black text-on-surface-variant/50 uppercase tracking-widest">
                Promedio Flota
              </p>
              <p className="text-sm font-black text-on-surface">
                {trucks.length > 0
                  ? (
                      trucks.reduce((s, t) => s + t.maxTemp, 0) / trucks.length
                    ).toFixed(1)
                  : "—"}
                °C
              </p>
              <p className="text-[9px] text-on-surface-variant/50 font-bold">
                {trucks.filter((t) => t.isCritical).length} críticos
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer note ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest">
        <Clock className="w-3 h-3" />
        Recomendaciones generadas automáticamente por Modelo D (Lógica Difusa) a
        partir de telemetría en tiempo real vía Supabase Realtime.
      </div>
    </div>
  );
}
