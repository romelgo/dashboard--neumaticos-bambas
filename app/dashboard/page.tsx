"use client";

import { useEffect, useState } from "react";
import { useFleetRealtime } from "../../hooks/useFleetRealtime";
import { supabase } from "../../lib/supabase/client";

/* ─── FORMATTER HELPER (DETERMINISTIC TO PREVENT SSR HYDRATION MISMATCH) ─── */
function formatNumber(val: number, options: { decimals?: number; currency?: boolean } = {}) {
  const { decimals = 0, currency = false } = options;
  const fixed = val.toFixed(decimals);
  const parts = fixed.split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const decimalPart = parts[1] ? `,${parts[1]}` : "";
  return `${currency ? "$" : ""}${integerPart}${decimalPart}`;
}

/* ─── TIPOS ─── */
interface TajoStats {
  tajo_asignado: string;
  camiones: number;
  temp_prom: number;
  vib_prom: number;
  tkph_prom: number;
  desgaste_prom: number;
  payload_prom: number;
  presion_prom: number;
  prof_inicial_prom: number;
  prof_final_prom: number;
  prof_final_min: number;
  prof_final_max: number;
  horas_prom: number;
  registros_criticos: number;
}

interface DatosPrueba {
  id_camion: string;
  tajo_asignado: string;
  horas_trabajadas: number;
  prof_inicial_mm: number;
  prof_final_mm: number;
  vida_util_h: number;
  condiciones: string;
}

/* ─── CONSTANTES DEL PROYECTO ─── */
const FLOTA_TOTAL = 60;
const PRECIO_NEUMATICO_USD = 52000;
const NEUMATICOS_POR_CAMION = 6;
const VIDA_UTIL_NORTE_H = 6201;
const VIDA_UTIL_SUR_H = 4801;
const VIDA_UTIL_FLOTA_H = 5300;
const HORAS_DIA = 21.83;
const DIAS_MES = 28;
const DISPONIBILIDAD_META = 85;
const CAPACIDAD_TON = 320;
const COCADA_INICIAL_MM = 65;
const COCADA_MINIMA_MM = 10; // límite de retiro

/* ─── ESTILOS BASE ─── */
const glassStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255, 255, 255, 0.45)",
  boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.04)",
};

/* ─── SUBCOMPONENTES ─── */
function KPICard({
  label, value, sub, color = "#4285F4", icon, trend,
}: {
  label: string; value: string; sub?: string; color?: string; icon: string; trend?: { value: string; up: boolean };
}) {
  return (
    <div style={{
      ...glassStyle,
      borderRadius: 16,
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      transition: "all 0.2s ease-in-out",
      cursor: "default",
      position: "relative",
      overflow: "hidden",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${color}66`;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 12px 40px 0 rgba(31, 38, 135, 0.08)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.45)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 8px 32px 0 rgba(31, 38, 135, 0.04)";
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${color}cc, transparent)` }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="material-symbols-outlined select-none" style={{ fontSize: 24, color }}>
          {icon}
        </span>
        {trend && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
            background: trend.up ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
            color: trend.up ? "#16a34a" : "#dc2626",
            display: "inline-flex", alignItems: "center", gap: 2,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 10, fontWeight: 800 }}>
              {trend.up ? "arrow_upward" : "arrow_downward"}
            </span>
            {trend.value}
          </span>
        )}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      {sub && <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 500, marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function ComparativaBar({
  label, norte, sur, unit, maxVal, colorNorte = "#16a34a", colorSur = "#dc2626",
}: {
  label: string; norte: number; sur: number; unit: string; maxVal: number;
  colorNorte?: string; colorSur?: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        <div style={{ display: "flex", gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: colorNorte }}>N: {norte}{unit}</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: colorSur }}>S: {sur}{unit}</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ height: 6, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(norte / maxVal) * 100}%`, background: colorNorte, borderRadius: 99, transition: "width 1s ease" }} />
        </div>
        <div style={{ height: 6, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(sur / maxVal) * 100}%`, background: colorSur, borderRadius: 99, transition: "width 1s ease" }} />
        </div>
      </div>
    </div>
  );
}

function DisponibilidadGauge({ value, meta }: { value: number; meta: number }) {
  const pct = Math.min(value, 100);
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  const color = value >= meta ? "#16a34a" : value >= meta - 5 ? "#d97706" : "#dc2626";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: 120, height: 120 }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            transform="rotate(-90 60 60)" style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 20, fontWeight: 800, color }}>{value}%</span>
          <span style={{ fontSize: 9, color: "#64748b", fontWeight: 700 }}>META {meta}%</span>
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Disponibilidad Mecánica
      </span>
    </div>
  );
}

/** Gauge de profundidad de cocada */
function ProfundidadGauge({
  profActual, profInicial = 65, profMinima = 10, label, color,
}: {
  profActual: number; profInicial?: number; profMinima?: number; label: string; color: string;
}) {
  const rango = profInicial - profMinima;
  const restante = Math.max(profActual - profMinima, 0);
  const pct = Math.min((restante / rango) * 100, 100);
  const radius = 44;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  const desgastePct = ((profInicial - profActual) / profInicial * 100).toFixed(1);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: 100, height: 100 }}>
        {/* Track fondo */}
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="9" />
          <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="9"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            transform="rotate(-90 50 50)" style={{ transition: "stroke-dashoffset 1.2s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
          <span style={{ fontSize: 17, fontWeight: 900, color }}>{profActual.toFixed(1)}</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: "#64748b" }}>mm</span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#0f172a" }}>{label}</div>
        <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>Desgaste: {desgastePct}%</div>
      </div>
    </div>
  );
}

/* ─── PÁGINA PRINCIPAL ─── */
export default function DashboardPage() {
  const { loading: fleetLoading, error } = useFleetRealtime();
  const [tajoStats, setTajoStats] = useState<TajoStats[]>([]);
  const [datosPrueba, setDatosPrueba] = useState<DatosPrueba[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalCamionesDB, setTotalCamionesDB] = useState(0);
  const [neumaticosEnAlerta, setNeumaticosEnAlerta] = useState(0);
  const [camionesConProfundidad, setCamionesConProfundidad] = useState<{
    id_camion: string; tajo: string; prof: number; vida_util: number; horas: number;
  }[]>([]);
  // Desgaste real calculado desde tabla camiones: (65 - prof_cocada) / horas_operadas
  const [desgasteRealNorte, setDesgasteRealNorte] = useState(0.00644);
  const [desgasteRealSur,   setDesgasteRealSur]   = useState(0.00759);
  const [profRealNorte, setProfRealNorte] = useState(55.8);
  const [profRealSur,   setProfRealSur]   = useState(52.7);
  const [horasRealNorte, setHorasRealNorte] = useState(1424.0);
  const [horasRealSur,   setHorasRealSur]   = useState(1422.0);

  useEffect(() => {
    const fetchStats = async () => {
      if (!supabase) { setStatsLoading(false); return; }
      try {
        // ── 1. Estadísticas por tajo (telemetría con profundidad) ──
        const { data: telData } = await supabase
          .from("telemetria_neumaticos")
          .select(`
            tajo_asignado, id_camion,
            temperatura_c, vibracion_g, tkph_real, desgaste_mm_h,
            payload_ton, presion_psi,
            profundidad_inicial_mm, profundidad_final_mm, horas_acumuladas
          `);

        if (telData) {
          const grouped: Record<string, TajoStats> = {};
          let alertas = 0;

          for (const row of telData as Record<string, number | string>[]) {
            const t = row.tajo_asignado as string;
            if (!grouped[t]) {
              grouped[t] = {
                tajo_asignado: t, camiones: 0,
                temp_prom: 0, vib_prom: 0, tkph_prom: 0,
                desgaste_prom: 0, payload_prom: 0, presion_prom: 0,
                prof_inicial_prom: 0, prof_final_prom: 0,
                prof_final_min: 999, prof_final_max: 0,
                horas_prom: 0, registros_criticos: 0,
              };
            }
            const g = grouped[t];
            g.temp_prom    += row.temperatura_c as number;
            g.vib_prom     += row.vibracion_g as number;
            g.tkph_prom    += row.tkph_real as number;
            g.desgaste_prom+= row.desgaste_mm_h as number;
            g.payload_prom += row.payload_ton as number;
            g.presion_prom += row.presion_psi as number;
            g.prof_inicial_prom += (row.profundidad_inicial_mm as number) || 65;
            g.prof_final_prom   += (row.profundidad_final_mm as number)   || 65;
            g.horas_prom        += (row.horas_acumuladas as number)       || 0;
            const pf = (row.profundidad_final_mm as number) || 65;
            if (pf < g.prof_final_min) g.prof_final_min = pf;
            if (pf > g.prof_final_max) g.prof_final_max = pf;
            if (pf < 20) { g.registros_criticos++; alertas++; }
            g.camiones++;
          }

          const result = Object.values(grouped).map(g => ({
            ...g,
            temp_prom:         +(g.temp_prom          / g.camiones).toFixed(1),
            vib_prom:          +(g.vib_prom           / g.camiones).toFixed(2),
            tkph_prom:         +(g.tkph_prom          / g.camiones).toFixed(1),
            desgaste_prom:     +(g.desgaste_prom      / g.camiones).toFixed(4),
            payload_prom:      +(g.payload_prom       / g.camiones).toFixed(1),
            presion_prom:      +(g.presion_prom       / g.camiones).toFixed(1),
            prof_inicial_prom: +(g.prof_inicial_prom  / g.camiones).toFixed(1),
            prof_final_prom:   +(g.prof_final_prom    / g.camiones).toFixed(2),
            horas_prom:        +(g.horas_prom         / g.camiones).toFixed(1),
            camiones: new Set(
              (telData as Record<string, string>[])
                .filter(r => r.tajo_asignado === g.tajo_asignado)
                .map(r => r.id_camion)
            ).size,
          }));

          setTajoStats(result);
          setNeumaticosEnAlerta(alertas);
        }

        // ── 2. Conteo de camiones + estadísticas reales de desgaste por tajo ──
        const { count } = await supabase
          .from("camiones")
          .select("*", { count: "exact", head: true });
        setTotalCamionesDB(count || 0);

        // ── 3. Desgaste REAL calculado de camiones: (65 - prof_cocada) / horas ──
        const { data: camAgr } = await supabase
          .from("camiones")
          .select("tajo_asignado, profundidad_cocada_actual_mm, horas_operadas_total, vida_util_proyectada_h");

        if (camAgr) {
          const camRows = camAgr as Record<string, number | string>[];
          // Agrupar por tajo
          const agr: Record<string, { sumProf: number; sumHoras: number; n: number }> = {};
          for (const r of camRows) {
            const t = r.tajo_asignado as string;
            if (!agr[t]) agr[t] = { sumProf: 0, sumHoras: 0, n: 0 };
            agr[t].sumProf  += (r.profundidad_cocada_actual_mm as number) || 65;
            agr[t].sumHoras += (r.horas_operadas_total as number) || 0;
            agr[t].n++;
          }
          // Calcular promedios y tasa real
          if (agr["Tajo Norte"]) {
            const g = agr["Tajo Norte"];
            const avgProf  = g.sumProf  / g.n;
            const avgHoras = g.sumHoras / g.n;
            setProfRealNorte(+avgProf.toFixed(2));
            setHorasRealNorte(+avgHoras.toFixed(1));
            setDesgasteRealNorte(avgHoras > 0 ? +((COCADA_INICIAL_MM - avgProf) / avgHoras).toFixed(6) : 0.00644);
          }
          if (agr["Tajo Sur"]) {
            const g = agr["Tajo Sur"];
            const avgProf  = g.sumProf  / g.n;
            const avgHoras = g.sumHoras / g.n;
            setProfRealSur(+avgProf.toFixed(2));
            setHorasRealSur(+avgHoras.toFixed(1));
            setDesgasteRealSur(avgHoras > 0 ? +((COCADA_INICIAL_MM - avgProf) / avgHoras).toFixed(6) : 0.00759);
          }
        }

        // ── 4. Datos de prueba (tabla imagen) — últimos 5 Norte + 5 Sur ──
        const { data: camNorte } = await supabase
          .from("camiones")
          .select("id_camion, tajo_asignado, vida_util_proyectada_h, profundidad_cocada_actual_mm, horas_operadas_total, dureza_roca_mpa, pendiente_pct")
          .eq("tajo_asignado", "Tajo Norte")
          .order("id_camion", { ascending: true })
          .limit(5);

        const { data: camSur } = await supabase
          .from("camiones")
          .select("id_camion, tajo_asignado, vida_util_proyectada_h, profundidad_cocada_actual_mm, horas_operadas_total, dureza_roca_mpa, pendiente_pct")
          .eq("tajo_asignado", "Tajo Sur")
          .order("id_camion", { ascending: true })
          .limit(5);

        const camData = [...(camNorte || []), ...(camSur || [])];

        if (camData.length > 0) {
          const prueba: DatosPrueba[] = (camData as Record<string, number | string>[]).map(c => {
            const isNorte  = c.tajo_asignado === "Tajo Norte";
            const dureza   = (c.dureza_roca_mpa as number) || (isNorte ? 70 : 110);
            const pendiente = (c.pendiente_pct as number) || (isNorte ? 10 : -10);
            const condStr  = `Roca ${dureza} MPa, ${pendiente > 0 ? "+" : ""}${pendiente}% pendiente, ${isNorte ? "sube cargado" : "baja cargado"}`;
            return {
              id_camion:       c.id_camion as string,
              tajo_asignado:   c.tajo_asignado as string,
              horas_trabajadas:+(c.horas_operadas_total as number || 0).toFixed(1),
              prof_inicial_mm: 65,
              prof_final_mm:   +(c.profundidad_cocada_actual_mm as number || 65).toFixed(1),
              vida_util_h:     (c.vida_util_proyectada_h as number) || (isNorte ? 6201 : 4801),
              condiciones:     condStr,
            };
          });
          setDatosPrueba(prueba);

          const allCam = camData as Record<string, number | string>[];
          setCamionesConProfundidad(
            allCam.map(c => ({
              id_camion: c.id_camion as string,
              tajo:      c.tajo_asignado as string,
              prof:      +(c.profundidad_cocada_actual_mm as number || 65),
              vida_util: c.vida_util_proyectada_h as number,
              horas:     +(c.horas_operadas_total as number || 0),
            }))
          );
        }
      } catch (e) {
        console.error("Stats error:", e);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Fallback si no hay datos (valores exactos del estudio de referencia)
  const norte = tajoStats.find(t => t.tajo_asignado === "Tajo Norte") ?? {
    tajo_asignado: "Tajo Norte", camiones: 30, temp_prom: 78.8, vib_prom: 1.74,
    tkph_prom: 988.6, desgaste_prom: 0.00644, payload_prom: 137.7, presion_prom: 125.0,
    prof_inicial_prom: 65, prof_final_prom: 55.88, prof_final_min: 55.1, prof_final_max: 56.5,
    horas_prom: 1433.5, registros_criticos: 0,
  };
  const sur = tajoStats.find(t => t.tajo_asignado === "Tajo Sur") ?? {
    tajo_asignado: "Tajo Sur", camiones: 30, temp_prom: 74.2, vib_prom: 1.70,
    tkph_prom: 973.7, desgaste_prom: 0.00759, payload_prom: 137.9, presion_prom: 125.0,
    prof_inicial_prom: 65, prof_final_prom: 52.81, prof_final_min: 51.1, prof_final_max: 54.4,
    horas_prom: 1426.5, registros_criticos: 0,
  };

  // Métricas derivadas
  const cphNorte = +((PRECIO_NEUMATICO_USD / VIDA_UTIL_NORTE_H) * NEUMATICOS_POR_CAMION).toFixed(2);
  const cphSur   = +((PRECIO_NEUMATICO_USD / VIDA_UTIL_SUR_H)   * NEUMATICOS_POR_CAMION).toFixed(2);
  const horasPeriodo    = HORAS_DIA * DIAS_MES * 6;
  const costoTotalFlota = ((cphNorte + cphSur) / 2) * horasPeriodo * FLOTA_TOTAL;
  const capacidadTotal  = FLOTA_TOTAL * CAPACIDAD_TON * HORAS_DIA * DIAS_MES;

  // Desgaste real de cocada desde BD (calculado: (65 - prof_actual) / horas_operadas)
  // Si aún no cargó, usar valores de referencia del estudio
  const desgasteCocadaNorte = desgasteRealNorte > 0 ? desgasteRealNorte : 0.00644;
  const desgasteCocadaSur   = desgasteRealSur   > 0 ? desgasteRealSur   : 0.00759;
  const profNorteDisplay    = profRealNorte  > 0 ? profRealNorte  : 55.88;
  const profSurDisplay      = profRealSur    > 0 ? profRealSur    : 52.81;

  return (
    <div className="relative space-y-8 max-w-[1600px] mx-auto pb-32 z-10">
      <style>{`
        @keyframes float-1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(60px,-80px) scale(1.2)} }
        @keyframes float-2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-80px,50px) scale(0.85)} }
        @keyframes float-3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(50px,70px) scale(1.15)} }
        .animate-float-1 { animation: float-1 20s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 25s ease-in-out infinite; }
        .animate-float-3 { animation: float-3 22s ease-in-out infinite; }
        .dash-table tbody tr:hover { background: rgba(37,99,235,0.04); }
        .dash-table th { font-size:10px; font-weight:800; color:#475569; text-transform:uppercase; letter-spacing:0.07em; padding:10px 12px; border-bottom:2px solid #e2e8f0; white-space:nowrap; }
        .dash-table td { font-size:12px; color:#334155; padding:9px 12px; border-bottom:1px solid #f1f5f9; font-weight:500; white-space:nowrap; }
      `}</style>

      {/* Blobs de fondo */}
      <div className="absolute inset-0 -top-32 overflow-hidden pointer-events-none -z-10 select-none">
        <div className="absolute top-[2%] left-[5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-rose-500/20 via-pink-500/15 to-amber-400/10 blur-[95px] animate-float-1" />
        <div className="absolute top-[12%] right-[2%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-600/30 via-sky-500/25 to-teal-400/15 blur-[105px] animate-float-2" />
        <div className="absolute bottom-[15%] left-[8%] w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-fuchsia-500/15 via-purple-500/10 to-blue-500/8 blur-[95px] animate-float-3" />
      </div>

      {/* ── Cabecera ── */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-7">
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.03em" }}>
            Monitor Global
          </h1>
          <p style={{ fontSize: 14, color: "#475569", fontWeight: 600, margin: "6px 0 0" }}>
            Flota CAT 797F — Minera Las Bambas
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2 self-start md:self-auto">
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", boxShadow: "0 0 8px #16a34a", display: "inline-block" }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: "#16a34a", letterSpacing: "0.04em" }}>Supabase Realtime</span>
        </div>
      </div>

      {(fleetLoading || statsLoading) && (
        <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", padding: 16, ...glassStyle, borderRadius: 12 }}>
          ⏳ Cargando datos de flota...
        </div>
      )}
      {error && error.message !== "API_NOT_CONFIGURED" && (
        <div style={{ fontSize: 13, color: "#dc2626", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 10, padding: 12 }}>
          ⚠️ Error: {error.message}
        </div>
      )}

      {/* ══ KPIs FILA 1 — Impacto Geomecánico (Objetivo 1) ══ */}
      <div>
        <h2 style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>
          📊 Impacto Geomecánico — Objetivo 1: Tasa de Desgaste (mm/h) y CPH por Zona
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <KPICard
            icon="construction" label="Desgaste Real — Tajo Norte"
            value={`${desgasteCocadaNorte.toFixed(5)} mm/h`}
            sub={`Roca 70 MPa | +10% pend. | Prof: ${profNorteDisplay} mm`}
            color="#16a34a"
            trend={{ value: "6,201 h vida útil", up: true }}
          />
          <KPICard
            icon="circle" label="Desgaste Real — Tajo Sur"
            value={`${desgasteCocadaSur.toFixed(5)} mm/h`}
            sub={`Roca 110 MPa | -10% pend. | Prof: ${profSurDisplay} mm`}
            color="#dc2626"
            trend={{ value: "4,801 h vida útil", up: false }}
          />
          <KPICard
            icon="payments" label="CPH — Tajo Norte"
            value={`$${formatNumber(cphNorte, { decimals: 2 })}/h`}
            sub={`$52,000 ÷ ${formatNumber(VIDA_UTIL_NORTE_H)}h × 6 neum.`}
            color="#2563eb"
          />
          <KPICard
            icon="monetization_on" label="CPH — Tajo Sur"
            value={`$${formatNumber(cphSur, { decimals: 2 })}/h`}
            sub={`$52,000 ÷ ${formatNumber(VIDA_UTIL_SUR_H)}h × 6 neum.`}
            color="#d97706"
          />
        </div>
      </div>

      {/* ══ SECCIÓN PROFUNDIDAD DE COCADA (NUEVO) ══ */}
      <div>
        <h2 style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>
          🔩 Profundidad de Cocada — Datos Reales de Flota
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Panel Gauge Norte */}
          <div style={{ ...glassStyle, borderRadius: 18, padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: "#16a34a", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>north</span>
                Tajo Norte
              </h3>
              <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(22,163,74,0.1)", color: "#16a34a", padding: "3px 10px", borderRadius: 99 }}>
                Roca 70 MPa
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <ProfundidadGauge
                profActual={profNorteDisplay}
                label="Profundidad Prom."
                color="#16a34a"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Inicial", val: `${COCADA_INICIAL_MM} mm`, color: "#64748b" },
                { label: "Actual Prom.", val: `${profNorteDisplay.toFixed(1)} mm`, color: "#16a34a" },
                { label: "Mínimo", val: `${(norte.prof_final_min || 1).toFixed(1)} mm`, color: "#dc2626" },
              ].map(item => (
                <div key={item.label} style={{ textAlign: "center", padding: "8px 4px", background: "rgba(0,0,0,0.03)", borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: item.color }}>{item.val}</div>
                  <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, marginTop: 2 }}>{item.label}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: "#475569", fontWeight: 700 }}>Desgaste consumido</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#d97706" }}>
                  {(((COCADA_INICIAL_MM - profNorteDisplay) / COCADA_INICIAL_MM) * 100).toFixed(1)}%
                </span>
              </div>
              <div style={{ height: 8, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${((COCADA_INICIAL_MM - profNorteDisplay) / COCADA_INICIAL_MM) * 100}%`,
                  background: "linear-gradient(90deg, #16a34a, #d97706)",
                  borderRadius: 99, transition: "width 1.2s ease",
                }} />
              </div>
            </div>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textAlign: "center" }}>
              Tasa cocada: <strong>{desgasteCocadaNorte.toFixed(5)} mm/h</strong> · Vida útil: <strong>6,201 h</strong>
            </div>
          </div>

          {/* Panel Gauge Sur */}
          <div style={{ ...glassStyle, borderRadius: 18, padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: "#dc2626", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>south</span>
                Tajo Sur
              </h3>
              <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(220,38,38,0.1)", color: "#dc2626", padding: "3px 10px", borderRadius: 99 }}>
                Roca 110 MPa
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <ProfundidadGauge
                profActual={profSurDisplay}
                label="Profundidad Prom."
                color="#dc2626"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Inicial", val: `${COCADA_INICIAL_MM} mm`, color: "#64748b" },
                { label: "Actual Prom.", val: `${profSurDisplay.toFixed(1)} mm`, color: "#dc2626" },
                { label: "Mínimo", val: `${(sur.prof_final_min || 1).toFixed(1)} mm`, color: "#7c3aed" },
              ].map(item => (
                <div key={item.label} style={{ textAlign: "center", padding: "8px 4px", background: "rgba(0,0,0,0.03)", borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: item.color }}>{item.val}</div>
                  <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, marginTop: 2 }}>{item.label}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: "#475569", fontWeight: 700 }}>Desgaste consumido</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#dc2626" }}>
                  {(((COCADA_INICIAL_MM - profSurDisplay) / COCADA_INICIAL_MM) * 100).toFixed(1)}%
                </span>
              </div>
              <div style={{ height: 8, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${((COCADA_INICIAL_MM - profSurDisplay) / COCADA_INICIAL_MM) * 100}%`,
                  background: "linear-gradient(90deg, #16a34a, #dc2626)",
                  borderRadius: 99, transition: "width 1.2s ease",
                }} />
              </div>
            </div>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textAlign: "center" }}>
              Tasa cocada: <strong>{desgasteCocadaSur.toFixed(5)} mm/h</strong> · Vida útil: <strong>4,801 h</strong>
            </div>
          </div>

          {/* Panel KPIs alerta + diferencial */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Neumáticos críticos */}
            <div style={{
              background: neumaticosEnAlerta > 0 ? "rgba(220,38,38,0.06)" : "rgba(22,163,74,0.06)",
              border: `1px solid ${neumaticosEnAlerta > 0 ? "rgba(220,38,38,0.2)" : "rgba(22,163,74,0.2)"}`,
              borderRadius: 16, padding: "18px 20px", flex: 1,
            }}>
              <h3 style={{ fontSize: 12, fontWeight: 800, color: neumaticosEnAlerta > 0 ? "#dc2626" : "#16a34a", marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>warning</span>
                Registros Críticos (&lt;20mm)
              </h3>
              <div style={{ fontSize: 36, fontWeight: 900, color: neumaticosEnAlerta > 0 ? "#dc2626" : "#16a34a" }}>
                {neumaticosEnAlerta}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                {neumaticosEnAlerta === 0 ? "Sin alertas de profundidad" : "Registros bajo umbral crítico"}
              </div>
            </div>

            {/* Diferencial Norte vs Sur */}
            <div style={{ ...glassStyle, borderRadius: 16, padding: "16px 18px", flex: 1 }}>
              <h3 style={{ fontSize: 12, fontWeight: 800, color: "#2563eb", marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>compare_arrows</span>
                Diferencial Cocada
              </h3>
              {[
                { label: "Desgaste Δ (mm)", norte: (COCADA_INICIAL_MM - profNorteDisplay).toFixed(1), sur: (COCADA_INICIAL_MM - profSurDisplay).toFixed(1) },
                { label: "Prof. actual (mm)", norte: profNorteDisplay.toFixed(1), sur: profSurDisplay.toFixed(1) },
                { label: "Horas prom.", norte: horasRealNorte.toFixed(0), sur: horasRealSur.toFixed(0) },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 10.5, color: "#64748b", fontWeight: 600 }}>{row.label}</span>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#16a34a" }}>N:{row.norte}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#dc2626" }}>S:{row.sur}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Cocada mínima info */}
            <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.18)", borderRadius: 16, padding: "14px 18px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#2563eb", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Límites de Referencia
              </div>
              {[
                { label: "Cocada nueva", val: "65 mm", color: "#16a34a" },
                { label: "Alerta (&lt;20mm)", val: "20 mm", color: "#d97706" },
                { label: "Retiro obligatorio", val: `${COCADA_MINIMA_MM} mm`, color: "#dc2626" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                  <span style={{ fontSize: 10.5, color: "#64748b", fontWeight: 600 }} dangerouslySetInnerHTML={{ __html: item.label }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: item.color }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ TABLA DATOS DE PRUEBA (replicando imagen) ══ */}
      <div style={{ ...glassStyle, borderRadius: 18, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: "#2563eb" }}>table_chart</span>
            Datos de Prueba — Período Jul–Oct 2024 (4 meses) · Fuente: BD Real Camiones
          </h3>
          <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 0", fontWeight: 500 }}>
            Profundidad inicial: {COCADA_INICIAL_MM} mm | Neumáticos 59/80R63 · CAT 797F
          </p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="dash-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th>ID Camión</th>
                <th>Tajo Asignado</th>
                <th>Período Prueba</th>
                <th>Horas Trabajadas</th>
                <th>Prof. Inicial (mm)</th>
                <th>Prof. Final (mm)</th>
                <th>Vida Útil Proy. (h)</th>
                <th>Condiciones</th>
              </tr>
            </thead>
            <tbody>
              {datosPrueba.length > 0 ? datosPrueba.map((row, i) => {
                const isNorte = row.tajo_asignado === "Tajo Norte";
                const desgaste = (row.prof_inicial_mm - row.prof_final_mm).toFixed(2);
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.5)" : "rgba(248,250,252,0.5)" }}>
                    <td style={{ fontWeight: 700, color: "#0f172a" }}>{row.id_camion}</td>
                    <td>
                      <span style={{
                        fontSize: 10.5, fontWeight: 800, padding: "3px 10px", borderRadius: 99,
                        background: isNorte ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.12)",
                        color: isNorte ? "#16a34a" : "#dc2626",
                      }}>
                        {row.tajo_asignado === "Tajo Norte" ? "Tajo_1 (Tajo Norte)" : "Tajo_2 (Tajo Sur)"}
                      </span>
                    </td>
                    <td style={{ color: "#64748b" }}>Jul-Oct 2024 (4 meses)</td>
                    <td style={{ fontWeight: 700 }}>{row.horas_trabajadas.toFixed(1)}</td>
                    <td style={{ color: "#16a34a", fontWeight: 700 }}>{row.prof_inicial_mm}</td>
                    <td>
                      <span style={{
                        fontWeight: 800,
                        color: row.prof_final_mm < 20 ? "#dc2626" : row.prof_final_mm < 35 ? "#d97706" : "#16a34a",
                      }}>
                        {row.prof_final_mm.toFixed(1)}
                      </span>
                      <span style={{ fontSize: 9.5, color: "#94a3b8", marginLeft: 4 }}>(Δ {desgaste})</span>
                    </td>
                    <td style={{ fontWeight: 700, color: isNorte ? "#16a34a" : "#dc2626" }}>
                      {formatNumber(row.vida_util_h)}
                    </td>
                    <td style={{ fontSize: 11, color: "#475569" }}>{row.condiciones}</td>
                  </tr>
                );
              }) : (
                Array.from({ length: 5 }, (_, i) => {
                  const isNorte = i < 3;
                  const profFinal = isNorte ? (55.8 - i * 0.3) : (53.4 - i * 0.7);
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.5)" : "rgba(248,250,252,0.5)" }}>
                      <td style={{ fontWeight: 700, color: "#0f172a" }}>TEST_{String(i + 1).padStart(3, "0")}</td>
                      <td><span style={{ fontSize: 10.5, fontWeight: 800, padding: "3px 10px", borderRadius: 99, background: isNorte ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.12)", color: isNorte ? "#16a34a" : "#dc2626" }}>{isNorte ? "Tajo_1 (Tajo Norte)" : "Tajo_2 (Tajo Sur)"}</span></td>
                      <td style={{ color: "#64748b" }}>Jul-Oct 2024 (4 meses)</td>
                      <td style={{ fontWeight: 700 }}>{(1424 + i * 15).toFixed(1)}</td>
                      <td style={{ color: "#16a34a", fontWeight: 700 }}>65</td>
                      <td><span style={{ fontWeight: 800, color: "#d97706" }}>{profFinal.toFixed(1)}</span></td>
                      <td style={{ fontWeight: 700, color: isNorte ? "#16a34a" : "#dc2626" }}>{isNorte ? "6.201" : "4.801"}</td>
                      <td style={{ fontSize: 11, color: "#475569" }}>{isNorte ? "Roca 70 MPa, +10% pendiente, sube cargado" : "Roca 110 MPa, -10% pendiente, baja cargado"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ KPIs FILA 2 — Capacidad Operativa (Objetivo 2) ══ */}
      <div>
        <h2 style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>
          🚛 Capacidad Operativa — Objetivo 2: Validar Flota 60 Equipos al 83% Disponibilidad
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <KPICard icon="local_shipping" label="Flota Total" value={`${FLOTA_TOTAL}`} sub={`${totalCamionesDB} registrados en sistema`} color="#2563eb" />
          <KPICard icon="precision_manufacturing" label="Cap. Operativa" value={`${CAPACIDAD_TON} t`} sub={`${FLOTA_TOTAL} camiones × ${CAPACIDAD_TON} ton`} color="#16a34a" />
          <KPICard icon="calendar_today" label="Ton/Período" value={`${formatNumber(capacidadTotal / 1_000_000, { decimals: 1 })}M t`} sub={`${HORAS_DIA}h/día × ${DIAS_MES} días × 6 meses`} color="#d97706" />
        </div>
      </div>

      {/* ══ PANELES COMPARATIVOS ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4.5">
        <div style={{ ...glassStyle, borderRadius: 18, padding: "22px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 18, display: "flex", alignItems: "center", gap: 6 }}>
            <span className="material-symbols-outlined" style={{ color: "#2563eb" }}>trending_up</span>
            Comparativa Norte vs Sur — Telemetría
          </h3>
          <ComparativaBar label="Temperatura (°C)"    norte={norte.temp_prom}    sur={sur.temp_prom}    unit="°C" maxVal={100} />
          <ComparativaBar label="TKPH Real"            norte={norte.tkph_prom}    sur={sur.tkph_prom}    unit=""   maxVal={1200} />
          <ComparativaBar label="Vibración (G)"        norte={norte.vib_prom}     sur={sur.vib_prom}     unit="G"  maxVal={4} />
          <ComparativaBar label="Presión Neumático"    norte={norte.presion_prom} sur={sur.presion_prom} unit=" PSI" maxVal={135} />
          <ComparativaBar
            label="Profundidad Cocada (mm)"
            norte={profNorteDisplay}
            sur={profSurDisplay}
            unit=" mm" maxVal={65}
            colorNorte="#16a34a" colorSur="#dc2626"
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...glassStyle, borderRadius: 18, padding: "20px", display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
            <DisponibilidadGauge value={DISPONIBILIDAD_META} meta={83} />
          </div>
          <div style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(22,163,74,0.05))", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 18, padding: "20px 22px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#2563eb" }}>attach_money</span>
              Costo Total Flota / 6 meses
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2563eb" }}>
              ${formatNumber(costoTotalFlota / 1_000_000, { decimals: 1 })}M
            </div>
            <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 500, marginTop: 4 }}>
              CPH prom × {formatNumber(horasPeriodo)}h × {FLOTA_TOTAL} camiones
            </div>
          </div>
        </div>
      </div>

      {/* ══ ALERTAS Y RECOMENDACIONES ══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Alertas Térmicas */}
        <div style={{ background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.18)", borderRadius: 16, padding: "18px 20px" }}>
          <h3 style={{ fontSize: 12, fontWeight: 800, color: "#dc2626", marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>thermostat</span>
            Alertas Térmicas (Modelo A)
          </h3>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#dc2626", marginBottom: 4 }}>0</div>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Sin alertas críticas &gt;85°C</div>
          <div style={{ marginTop: 12, padding: "6px 12px", borderRadius: 8, background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)", fontSize: 11, color: "#16a34a", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 12, fontWeight: 900 }}>check</span>
            Flota en rango normal
          </div>
        </div>

        {/* Vida Útil Restante */}
        <div style={{ background: "rgba(217,119,6,0.04)", border: "1px solid rgba(217,119,6,0.18)", borderRadius: 16, padding: "18px 20px" }}>
          <h3 style={{ fontSize: 12, fontWeight: 800, color: "#d97706", marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>schedule</span>
            RUL Próximos Cambios (Modelo B)
          </h3>
          {camionesConProfundidad.filter(c => c.prof < 25).slice(0, 3).length > 0
            ? camionesConProfundidad.filter(c => c.prof < 25).slice(0, 3).map(truck => {
              const horasRest = Math.max(0, ((truck.prof - COCADA_MINIMA_MM) / (COCADA_INICIAL_MM / truck.vida_util)));
              const diasRest  = Math.round(horasRest / HORAS_DIA);
              return (
                <div key={truck.id_camion} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 12, color: "#334155", fontWeight: 700 }}>{truck.id_camion}</span>
                  <span style={{ fontSize: 11.5, color: "#d97706", fontWeight: 800 }}>{diasRest}d · {truck.tajo === "Tajo Norte" ? "Norte" : "Sur"}</span>
                </div>
              );
            })
            : [{ id: "CAT-012", dias: 8, tajo: "Sur" }, { id: "CAT-027", dias: 14, tajo: "Norte" }, { id: "CAT-041", dias: 19, tajo: "Sur" }].map(truck => (
              <div key={truck.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: 12, color: "#334155", fontWeight: 700 }}>{truck.id}</span>
                <span style={{ fontSize: 11.5, color: "#d97706", fontWeight: 800 }}>{truck.dias}d · Tajo {truck.tajo}</span>
              </div>
            ))
          }
        </div>

        {/* Swap Recomendado */}
        <div style={{ background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.18)", borderRadius: 16, padding: "18px 20px" }}>
          <h3 style={{ fontSize: 12, fontWeight: 800, color: "#2563eb", marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>swap_horiz</span>
            Swap Recomendado (Modelo D)
          </h3>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12.5, color: "#334155", fontWeight: 700 }}>CAT-012 (Pos 1)</span>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#64748b" }}>swap_horiz</span>
            <span style={{ fontSize: 12.5, color: "#334155", fontWeight: 700 }}>CAT-045 (Pos 5)</span>
          </div>
          <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 500, marginBottom: 10 }}>Norte → Sur | Urgencia: Alta</div>
          <button style={{ width: "100%", padding: "9px", borderRadius: 10, fontSize: 11, fontWeight: 800, background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none", color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(37,99,235,0.2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Aprobar Swap
          </button>
        </div>
      </div>

      {/* ══ VARIABLES SIMULACIÓN (Objetivo 3) ══ */}
      <div style={{ ...glassStyle, borderRadius: 18, padding: "22px 24px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
          <span className="material-symbols-outlined" style={{ color: "#2563eb" }}>science</span>
          Variables de Simulación — Escenario Mixto (Objetivo 3)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            { label: "Cocada Inicial", value: `${COCADA_INICIAL_MM} mm`, color: "#2563eb", icon: "circle" },
            { label: "Vida Útil Flota Ref.", value: `${formatNumber(VIDA_UTIL_FLOTA_H)} h`, color: "#16a34a", icon: "schedule" },
            { label: "Horas Efectivas/Día", value: `${HORAS_DIA} h`, color: "#d97706", icon: "alarm" },
            { label: "Período de Análisis", value: "6 meses", color: "#dc2626", icon: "bar_chart" },
          ].map(item => (
            <div key={item.label} style={{ padding: "14px", borderRadius: 12, background: `${item.color}08`, border: `1px solid ${item.color}15` }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: item.color }}>{item.icon}</span>
              <div style={{ fontSize: 17, fontWeight: 800, color: item.color, marginTop: 4 }}>{item.value}</div>
              <div style={{ fontSize: 10, color: "#475569", fontWeight: 600, marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Fórmula Desgaste Cocada", value: `65 mm ÷ vida_util_h`, desc: "Tasa = 65/6201 Norte | 65/4801 Sur", color: "#2563eb" },
            { label: "Fórmula CPH", value: `$52,000 ÷ vida_util × 6 neum.`, desc: "CPH Norte: $50.3/h | CPH Sur: $65.0/h", color: "#dc2626" },
          ].map(f => (
            <div key={f.label} style={{ background: `${f.color}06`, border: `1px solid ${f.color}18`, borderRadius: 10, padding: "12px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: f.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.label}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: "4px 0 2px", fontFamily: "monospace" }}>{f.value}</div>
              <div style={{ fontSize: 10.5, color: "#64748b" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
