"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useTruckManager,
  CamionFormData,
  CAT797F_DEFAULTS,
  VIDA_UTIL_POR_TAJO,
  PARAMS_POR_TAJO,
} from "../../../hooks/useTruckManager";

/* ─── FORMATTER HELPER (DETERMINISTIC TO PREVENT SSR HYDRATION MISMATCH) ─── */
function formatNumber(val: number, options: { decimals?: number; currency?: boolean } = {}) {
  const { decimals = 0, currency = false } = options;
  const fixed = val.toFixed(decimals);
  const parts = fixed.split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const decimalPart = parts[1] ? `,${parts[1]}` : "";
  return `${currency ? "$" : ""}${integerPart}${decimalPart}`;
}

/* ─── TIPOS AUXILIARES ─── */
type Tajo = "Tajo Norte" | "Tajo Sur";
type Estado = "OPERATIVO" | "MANTENIMIENTO" | "DETENIDO";

/* ─── VALORES INICIALES ─── */
const INITIAL_DATA: CamionFormData = {
  id_camion: "",
  modelo: CAT797F_DEFAULTS.modelo,
  capacidad_ton: CAT797F_DEFAULTS.capacidad_ton,
  carga_operativa_ton: CAT797F_DEFAULTS.carga_operativa_ton,
  cantidad_neumaticos: CAT797F_DEFAULTS.cantidad_neumaticos,
  tamano_neumatico: CAT797F_DEFAULTS.tamano_neumatico,
  tajo_asignado: "Tajo Norte",
  estado: "OPERATIVO",
  disponibilidad_pct: CAT797F_DEFAULTS.disponibilidad_pct,
  horas_efectivas_dia: CAT797F_DEFAULTS.horas_efectivas_dia,
  dias_operacion_mes: CAT797F_DEFAULTS.dias_operacion_mes,
  precio_neumatico_usd: CAT797F_DEFAULTS.precio_neumatico_usd,
  vida_util_proyectada_h: VIDA_UTIL_POR_TAJO["Tajo Norte"],
  periodo_analisis_meses: CAT797F_DEFAULTS.periodo_analisis_meses,
  dureza_roca_mpa: PARAMS_POR_TAJO["Tajo Norte"].dureza,
  pendiente_pct: PARAMS_POR_TAJO["Tajo Norte"].pendiente,
  distancia_chancadora_km: PARAMS_POR_TAJO["Tajo Norte"].distancia,
  notas: "",
};

/* ─── COLORES DE ESTADO ─── */
const ESTADO_CONFIG: Record<Estado, { label: string; color: string; bg: string }> = {
  OPERATIVO:    { label: "Operativo",    color: "#16a34a", bg: "rgba(34,197,94,0.12)" },
  MANTENIMIENTO:{ label: "Mantenimiento",color: "#d97706", bg: "rgba(245,158,11,0.12)" },
  DETENIDO:     { label: "Detenido",     color: "#dc2626", bg: "rgba(239,68,68,0.12)" },
};

/* ─── PASOS DEL STEPPER ─── */
const STEPS = [
  { id: 1, title: "Identificación",  icon: "fingerprint", desc: "ID y modelo del equipo" },
  { id: 2, title: "Operación",       icon: "settings", desc: "Tajo y capacidad" },
  { id: 3, title: "Neumáticos",      icon: "donut_large", desc: "Especificaciones y costos" },
  { id: 4, title: "Confirmación",    icon: "task_alt", desc: "Revisar y guardar" },
];

/* ─── COMPONENTES ESTILO VIDRIO ─── */
const glassStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255, 255, 255, 0.45)",
  boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.04)",
};

/* ─── COMPONENTE CAMPO FORMULARIO ─── */
function Field({
  label, value, onChange, type = "text", placeholder = "", unit = "", readOnly = false, min, max, step,
}: {
  label: string; value: string | number; onChange?: (v: string) => void;
  type?: string; placeholder?: string; unit?: string; readOnly?: boolean;
  min?: number; max?: number; step?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </label>
      <div className="flex items-center" style={{ position: "relative" }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          min={min}
          max={max}
          step={step}
          style={{
            width: "100%",
            padding: "10px 14px",
            paddingRight: unit ? "52px" : "14px",
            background: readOnly ? "#f1f5f9" : "#f8fafc",
            border: `1px solid ${readOnly ? "#e2e8f0" : "#cbd5e1"}`,
            borderRadius: 10,
            color: readOnly ? "#64748b" : "#0f172a",
            fontSize: 14,
            fontWeight: 500,
            outline: "none",
            transition: "border-color 0.2s",
            cursor: readOnly ? "default" : "text",
          }}
          onFocus={e => !readOnly && (e.target.style.borderColor = "#2563eb")}
          onBlur={e => (e.target.style.borderColor = readOnly ? "#e2e8f0" : "#cbd5e1")}
        />
        {unit && (
          <span style={{
            position: "absolute", right: 12, fontSize: 12,
            color: "#64748b", fontWeight: 700, pointerEvents: "none",
          }}>{unit}</span>
        )}
      </div>
    </div>
  );
}

/* ─── SELECTOR PERSONALIZADO ─── */
function SelectField<T extends string>({
  label, value, onChange, options,
}: {
  label: string; value: T; onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        style={{
          width: "100%", padding: "10px 14px",
          background: "#f8fafc",
          border: "1px solid #cbd5e1",
          borderRadius: 10, color: "#0f172a",
          fontSize: 14, fontWeight: 500, outline: "none",
          cursor: "pointer",
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: "#ffffff", color: "#0f172a" }}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

/* ─── COMPONENTE PRINCIPAL ─── */
export default function AddTruckPage() {
  const router = useRouter();
  const { addTruck, loading, error, success, camiones, listTrucks, calcularMetricas, resetStatus } = useTruckManager();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CamionFormData>(INITIAL_DATA);
  const [metricas, setMetricas] = useState(calcularMetricas(INITIAL_DATA));
  const [selectedTruck, setSelectedTruck] = useState<any>(null);
  
  /* Filtros de búsqueda para el listado */
  const [searchQuery, setSearchQuery] = useState("");
  const [tajoFilter, setTajoFilter] = useState("ALL");

  useEffect(() => {
    listTrucks();
  }, [listTrucks]);

  /* Auto-completar valores por tajo */
  const handleTajoChange = (tajo: Tajo) => {
    const params = PARAMS_POR_TAJO[tajo];
    const vida = VIDA_UTIL_POR_TAJO[tajo];
    setForm(prev => ({
      ...prev,
      tajo_asignado: tajo,
      vida_util_proyectada_h: vida,
      dureza_roca_mpa: params.dureza,
      pendiente_pct: params.pendiente,
      distancia_chancadora_km: params.distancia,
    }));
  };

  /* Recalcular métricas cuando cambia el form */
  useEffect(() => {
    setMetricas(calcularMetricas(form));
  }, [form, calcularMetricas]);

  const update = (key: keyof CamionFormData) => (val: string) => {
    setForm(prev => ({ ...prev, [key]: isNaN(Number(val)) || val === "" ? val : Number(val) }));
  };

  const handleOpenModal = () => {
    setForm(INITIAL_DATA);
    setStep(1);
    resetStatus();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetStatus();
  };

  const handleSubmit = async () => {
    const ok = await addTruck(form);
    if (ok) {
      listTrucks(); // Refrescar la lista de camiones
      setTimeout(() => {
        setIsModalOpen(false);
      }, 2000);
    }
  };

  const filteredCamiones = camiones.filter(c => {
    const matchesSearch = c.id_camion.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.modelo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTajo = tajoFilter === "ALL" || c.tajo_asignado === tajoFilter;
    return matchesSearch && matchesTajo;
  });

  return (
    <div className="relative space-y-8 max-w-[1600px] mx-auto pb-32 z-10">
      {/* Estilos para animación de blobs flotantes y entrada del modal */}
      <style>{`
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, -80px) scale(1.2); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-80px, 50px) scale(0.85); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, 70px) scale(1.15); }
        }
        @keyframes modal-fade-in {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-float-1 {
          animation: float-1 20s ease-in-out infinite;
        }
        .animate-float-2 {
          animation: float-2 25s ease-in-out infinite;
        }
        .animate-float-3 {
          animation: float-3 22s ease-in-out infinite;
        }
        .animate-modal {
          animation: modal-fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Blobs de Fondo Brillantes para Efecto Glassmorphism */}
      <div className="absolute inset-0 -top-32 overflow-hidden pointer-events-none -z-10 select-none">
        <div className="absolute top-[2%] left-[5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-rose-500/20 via-pink-500/15 to-amber-400/10 blur-[95px] animate-float-1" />
        <div className="absolute top-[12%] right-[2%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-600/30 via-sky-500/25 to-teal-400/15 blur-[105px] animate-float-2" />
        <div className="absolute bottom-[15%] left-[8%] w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-fuchsia-500/15 via-purple-500/10 to-blue-500/8 blur-[95px] animate-float-3" />
      </div>

      {/* ── Cabecera ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.03em" }}>
            Gestión de Flota
          </h1>
          <p style={{ fontSize: 14, color: "#475569", fontWeight: 600, margin: "6px 0 0" }}>
            Flota CAT 797F — Minera Las Bambas
          </p>
        </div>
        
        <button
          onClick={handleOpenModal}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            color: "#ffffff",
            border: "none",
            borderRadius: 12,
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 4px 18px rgba(37, 99, 235, 0.3)",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
          Registrar Camión
        </button>
      </div>

      {/* ── Barra de Búsqueda y Filtros ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/50 backdrop-blur-xl border border-white/30 shadow-sm mb-6">
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 260 }}>
          <div style={{ position: "relative", width: "100%" }}>
            <span className="material-symbols-outlined" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: 20 }}>search</span>
            <input
              type="text"
              placeholder="Buscar camión por ID o modelo..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px 10px 40px",
                background: "rgba(255, 255, 255, 0.6)",
                border: "1px solid #cbd5e1",
                borderRadius: 12,
                fontSize: 14,
                color: "#0f172a",
                outline: "none",
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div style={{ display: "flex", gap: 4, background: "rgba(241, 245, 249, 0.6)", padding: 4, borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <button
              onClick={() => setTajoFilter("ALL")}
              style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 800, border: "none", cursor: "pointer", transition: "all 0.2s",
                background: tajoFilter === "ALL" ? "#ffffff" : "transparent",
                color: tajoFilter === "ALL" ? "#0f172a" : "#64748b",
                boxShadow: tajoFilter === "ALL" ? "0 2px 8px rgba(0, 0, 0, 0.05)" : "none",
              }}
            >
              TODAS LAS ZONAS
            </button>
            <button
              onClick={() => setTajoFilter("Tajo Norte")}
              style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 800, border: "none", cursor: "pointer", transition: "all 0.2s",
                background: tajoFilter === "Tajo Norte" ? "#ffffff" : "transparent",
                color: tajoFilter === "Tajo Norte" ? "#16a34a" : "#64748b",
                boxShadow: tajoFilter === "Tajo Norte" ? "0 2px 8px rgba(0, 0, 0, 0.05)" : "none",
              }}
            >
              TAJO NORTE
            </button>
            <button
              onClick={() => setTajoFilter("Tajo Sur")}
              style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 800, border: "none", cursor: "pointer", transition: "all 0.2s",
                background: tajoFilter === "Tajo Sur" ? "#ffffff" : "transparent",
                color: tajoFilter === "Tajo Sur" ? "#dc2626" : "#64748b",
                boxShadow: tajoFilter === "Tajo Sur" ? "0 2px 8px rgba(0, 0, 0, 0.05)" : "none",
              }}
            >
              TAJO SUR
            </button>
          </div>
        </div>
      </div>

      {/* ── Listado de Camiones ── */}
      {loading && camiones.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, ...glassStyle, borderRadius: 18, color: "#64748b", fontWeight: 600 }}>
          ⏳ Cargando camiones de la flota...
        </div>
      )}

      {filteredCamiones.length === 0 && !loading && (
        <div style={{
          ...glassStyle,
          borderRadius: 18,
          padding: "60px 20px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: "#94a3b8" }}>local_shipping</span>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>No hay camiones</h3>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0, maxWidth: 400 }}>
            {searchQuery || tajoFilter !== "ALL"
              ? "Ningún camión coincide con los filtros aplicados en este momento."
              : "No se han registrado camiones en el sistema. Registra el primero para comenzar a monitorear."}
          </p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
        {filteredCamiones.map((truck) => {
          const metrics = calcularMetricas(truck);
          const config = ESTADO_CONFIG[truck.estado] || ESTADO_CONFIG.OPERATIVO;
          const isTajoNorte = truck.tajo_asignado === "Tajo Norte";
          
          return (
            <div
              key={truck.id}
              style={{
                borderRadius: 18,
                overflow: "hidden",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                minHeight: 300,
                backgroundImage: truck.image_url ? `url('${truck.image_url}')` : "linear-gradient(to bottom, #1e293b, #0f172a)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
                cursor: "pointer",
              }}
              onClick={() => setSelectedTruck(truck)}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 16px 36px rgba(0, 0, 0, 0.3)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.4)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 32px 0 rgba(31, 38, 135, 0.15)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              }}
            >
              {/* Overlay Gradient (fade to black) */}
              <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%)",
                zIndex: 1,
              }} />

              {/* Content on top of gradient */}
              <div style={{
                position: "relative",
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                height: "100%",
                padding: 20,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <span style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 2 }}>
                      {truck.modelo}
                    </span>
                    <h3 style={{ fontSize: 26, fontWeight: 900, color: "#ffffff", margin: 0, display: "flex", alignItems: "center", gap: 8, textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
                      <span className="material-symbols-outlined" style={{ color: isTajoNorte ? "#4ade80" : "#f87171" }}>local_shipping</span>
                      {truck.id_camion}
                    </h3>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    {/* Tajo Badge */}
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 99,
                      background: isTajoNorte ? "rgba(22, 163, 74, 0.3)" : "rgba(220, 38, 38, 0.3)",
                      color: isTajoNorte ? "#4ade80" : "#f87171",
                      border: `1px solid ${isTajoNorte ? "rgba(74, 222, 128, 0.4)" : "rgba(248, 113, 113, 0.4)"}`,
                      textTransform: "uppercase", letterSpacing: "0.04em", backdropFilter: "blur(4px)"
                    }}>
                      {truck.tajo_asignado}
                    </span>

                    {/* Estado Badge */}
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 99,
                      background: "rgba(0,0,0,0.6)",
                      color: config.color, border: "1px solid rgba(255,255,255,0.15)",
                      display: "inline-flex", alignItems: "center", gap: 4, backdropFilter: "blur(4px)"
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: config.color }} />
                      {config.label}
                    </span>
                  </div>
                </div>

                {/* Minimal metrics */}
                <div style={{ display: "flex", gap: 20, marginTop: 16, borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 14 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Costo/Hora</div>
                    <div style={{ fontSize: 14, color: "#ffffff", fontWeight: 800 }}>${formatNumber(metrics.cph_usd_h, { decimals: 2 })}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Carga</div>
                    <div style={{ fontSize: 14, color: "#ffffff", fontWeight: 800 }}>{truck.carga_operativa_ton} t</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Disp.</div>
                    <div style={{ fontSize: 14, color: "#ffffff", fontWeight: 800 }}>{truck.disponibilidad_pct}%</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal de Registro de Camión ── */}
      {isModalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: 16,
        }}>
          {/* Tarjeta Modal */}
          <div
            className="animate-modal"
            style={{
              background: "#ffffff",
              borderRadius: 20,
              border: "1px solid #e2e8f0",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
              width: "100%",
              maxWidth: 620,
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Cabecera del Modal */}
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: "#2563eb" }}>local_shipping</span>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", margin: 0 }}>Registrar Camión</h2>
                  <p style={{ fontSize: 11, color: "#64748b", fontWeight: 600, margin: 0 }}>Flota CAT 797F — Minera Las Bambas</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  padding: 4,
                  borderRadius: "50%",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Stepper del Modal */}
            <div style={{ display: "flex", gap: 6, padding: "20px 24px 10px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {STEPS.map((s) => (
                <div key={s.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: "100%", height: 4, borderRadius: 99,
                    background: step >= s.id
                      ? "linear-gradient(90deg, #2563eb, #16a34a)"
                      : "#e2e8f0",
                    transition: "background 0.4s",
                  }} />
                  <div style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: step >= s.id ? "#2563eb" : "#94a3b8",
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    transition: "color 0.3s",
                    marginTop: 2,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13, fontWeight: 800 }}>{s.icon}</span>
                    {s.title}
                  </div>
                </div>
              ))}
            </div>

            {/* Botones de Navegación (Movidos arriba para mejor visibilidad) */}
            <div style={{
              padding: "12px 24px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              gap: 12,
              justifyContent: "space-between",
              background: "#f8fafc",
            }}>
              {step > 1 ? (
                <button
                  onClick={() => { resetStatus(); setStep(s => s - 1); }}
                  style={{
                    padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 800,
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#475569", cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  ← Anterior
                </button>
              ) : (
                <button
                  onClick={handleCloseModal}
                  style={{
                    padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 800,
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#475569", cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
              )}

              {step < 4 ? (
                <button
                  onClick={() => {
                    if (step === 1 && !form.id_camion.trim()) {
                      alert("El ID del camión es obligatorio.");
                      return;
                    }
                    setStep(s => s + 1);
                  }}
                  style={{
                    padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 800,
                    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    border: "none", color: "#ffffff", cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
                    transition: "all 0.2s",
                  }}
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading || success}
                  style={{
                    padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 800,
                    background: loading || success
                      ? "#e2e8f0"
                      : "linear-gradient(135deg, #16a34a, #15803d)",
                    border: "none", color: loading || success ? "#94a3b8" : "#ffffff",
                    cursor: loading || success ? "not-allowed" : "pointer",
                    boxShadow: loading || success ? "none" : "0 4px 12px rgba(22, 163, 74, 0.2)",
                    transition: "all 0.3s",
                  }}
                >
                  {loading ? "⏳ Guardando..." : success ? "✅ Guardado" : "🚛 Registrar Camión"}
                </button>
              )}
            </div>

            {/* Contenido del Formulario */}
            <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
              
              {/* Pasos */}
              {step === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <SectionTitle icon="fingerprint" title="Identificación del Equipo" />
                  <Field
                    label="ID del Camión *"
                    value={form.id_camion}
                    onChange={update("id_camion")}
                    placeholder="Ej: CAT-001"
                  />
                  <Field
                    label="Modelo"
                    value={form.modelo}
                    onChange={update("modelo")}
                    placeholder="CAT 797F"
                  />
                  <SelectField<Estado>
                    label="Estado Operacional"
                    value={form.estado}
                    onChange={v => setForm(p => ({ ...p, estado: v }))}
                    options={[
                      { value: "OPERATIVO",     label: "🟢 Operativo" },
                      { value: "MANTENIMIENTO", label: "🔧 Mantenimiento" },
                      { value: "DETENIDO",      label: "🔴 Detenido" },
                    ]}
                  />
                  {/* Badge de estado */}
                  <div style={{
                    padding: "10px 14px", borderRadius: 10,
                    background: ESTADO_CONFIG[form.estado].bg,
                    border: `1px solid ${ESTADO_CONFIG[form.estado].color}33`,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: ESTADO_CONFIG[form.estado].color,
                      boxShadow: `0 0 6px ${ESTADO_CONFIG[form.estado].color}`,
                    }} />
                    <span style={{ fontSize: 13, color: ESTADO_CONFIG[form.estado].color, fontWeight: 700 }}>
                      {ESTADO_CONFIG[form.estado].label}
                    </span>
                  </div>
                  
                  {/* Image Upload Field */}
                  <div className="flex flex-col gap-1.5">
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Imagen del Camión
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setForm(p => ({ ...p, imageFile: e.target.files![0] }));
                        }
                      }}
                      style={{
                        width: "100%", padding: "8px 12px",
                        background: "#f8fafc", border: "1px solid #cbd5e1",
                        borderRadius: 10, fontSize: 13, color: "#475569"
                      }}
                    />
                    {form.imageFile && (
                      <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>
                        ✓ {form.imageFile.name}
                      </span>
                    )}
                  </div>

                  <Field
                    label="Notas adicionales"
                    value={form.notas}
                    onChange={update("notas")}
                    placeholder="Observaciones opcionales..."
                  />
                </div>
              )}

              {step === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <SectionTitle icon="settings" title="Parámetros Operacionales" />

                  <SelectField<Tajo>
                    label="Tajo Asignado *"
                    value={form.tajo_asignado}
                    onChange={handleTajoChange}
                    options={[
                      { value: "Tajo Norte", label: "🟢 Tajo Norte — Roca Media (70 MPa)" },
                      { value: "Tajo Sur",   label: "🔴 Tajo Sur — Roca Dura (110 MPa)" },
                    ]}
                  />

                  {/* Infopanel tajo */}
                  <InfoPanel tajo={form.tajo_asignado} />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <Field label="Capacidad Nominal" value={form.capacidad_ton} onChange={update("capacidad_ton")} type="number" unit="ton" min={0} />
                    <Field label="Carga Operativa"   value={form.carga_operativa_ton} onChange={update("carga_operativa_ton")} type="number" unit="ton" min={0} />
                    <Field label="Disponibilidad Mec." value={form.disponibilidad_pct} onChange={update("disponibilidad_pct")} type="number" unit="%" min={0} max={100} step={0.1} />
                    <Field label="Horas Efectivas/Día" value={form.horas_efectivas_dia} onChange={update("horas_efectivas_dia")} type="number" unit="h" min={0} max={24} step={0.01} />
                    <Field label="Días Operación/Mes" value={form.dias_operacion_mes} onChange={update("dias_operacion_mes")} type="number" unit="días" min={1} max={31} />
                    <Field label="Período de Análisis" value={form.periodo_analisis_meses} onChange={update("periodo_analisis_meses")} type="number" unit="meses" min={1} />
                  </div>

                  {/* Parámetros geomecánicos (auto-fill pero editables) */}
                  <div style={{
                    padding: "14px", borderRadius: 12,
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                      Condiciones Geomecánicas (auto por tajo)
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                      <Field label="Dureza Roca" value={form.dureza_roca_mpa} onChange={update("dureza_roca_mpa")} type="number" unit="MPa" step={0.1} />
                      <Field label="Pendiente" value={form.pendiente_pct} onChange={update("pendiente_pct")} type="number" unit="%" step={0.1} />
                      <Field label="Dist. Chancadora" value={form.distancia_chancadora_km} onChange={update("distancia_chancadora_km")} type="number" unit="km" step={0.1} />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <SectionTitle icon="donut_large" title="Especificaciones de Neumáticos" />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <Field label="Cant. Neumáticos" value={form.cantidad_neumaticos} onChange={update("cantidad_neumaticos")} type="number" min={1} max={12} />
                    <Field label="Tamaño Neumático" value={form.tamano_neumatico} onChange={update("tamano_neumatico")} placeholder="59/80R63" />
                    <Field label="Precio Unitario" value={form.precio_neumatico_usd} onChange={update("precio_neumatico_usd")} type="number" unit="USD" min={0} />
                    <Field label="Vida Útil Proyectada" value={form.vida_util_proyectada_h} onChange={update("vida_util_proyectada_h")} type="number" unit="h" min={0} />
                  </div>

                  {/* ── Métricas calculadas ── */}
                  <div style={{
                    background: "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(22,163,74,0.05))",
                    border: "1px solid rgba(37,99,235,0.2)",
                    borderRadius: 14, padding: "18px",
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14, display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>bar_chart</span>
                      Métricas Calculadas — {form.tajo_asignado}
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <MetricBox
                        label="Tasa de Desgaste"
                        value={`${formatNumber(metricas.tasaDesgaste_mm_h, { decimals: 4 })} mm/h`}
                        color="#2563eb"
                        icon="architecture"
                      />
                      <MetricBox
                        label="Costo por Hora (CPH)"
                        value={`$${formatNumber(metricas.cph_usd_h, { decimals: 2 })}/h`}
                        color="#16a34a"
                        icon="payments"
                      />
                      <MetricBox
                        label="Horas en Período"
                        value={`${formatNumber(metricas.horasPeriodo)} h`}
                        color="#d97706"
                        icon="schedule"
                      />
                      <MetricBox
                        label="Costo Total / Camión"
                        value={`$${formatNumber(metricas.costoTotalPeriodo_usd)}`}
                        color="#dc2626"
                        icon="monetization_on"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <SectionTitle icon="task_alt" title="Confirmar Registro" />

                  {/* Resumen */}
                  <div style={{
                    background: "#f8fafc",
                    borderRadius: 14, padding: 18,
                    border: "1px solid #e2e8f0",
                  }}>
                    <ResumenRow label="ID Camión" value={form.id_camion.toUpperCase()} highlight />
                    <ResumenRow label="Modelo" value={form.modelo} />
                    <ResumenRow label="Estado" value={ESTADO_CONFIG[form.estado].label} />
                    <ResumenRow label="Tajo" value={form.tajo_asignado} />
                    <ResumenRow label="Capacidad" value={`${form.capacidad_ton} ton`} />
                    <ResumenRow label="Carga Operativa" value={`${form.carga_operativa_ton} ton`} />
                    <ResumenRow label="Disponibilidad" value={`${form.disponibilidad_pct}%`} />
                    <ResumenRow label="Horas/Día" value={`${form.horas_efectivas_dia} h`} />
                    <ResumenRow label="Días/Mes" value={`${form.dias_operacion_mes} días`} />
                    <ResumenRow label="Neumáticos" value={`${form.cantidad_neumaticos} × ${form.tamano_neumatico}`} />
                    <ResumenRow label="Precio Neumático" value={`$${formatNumber(form.precio_neumatico_usd)}`} />
                    <ResumenRow label="Vida Útil Proy." value={`${formatNumber(form.vida_util_proyectada_h)} h`} />
                    <ResumenRow label="Tasa Desgaste" value={`${formatNumber(metricas.tasaDesgaste_mm_h, { decimals: 4 })} mm/h`} />
                    <ResumenRow label="CPH" value={`$${formatNumber(metricas.cph_usd_h, { decimals: 2 })}/h`} highlight />
                    <ResumenRow label="Costo Total" value={`$${formatNumber(metricas.costoTotalPeriodo_usd)}`} highlight />
                    {form.notas && <ResumenRow label="Notas" value={form.notas} />}
                  </div>

                  {/* Estados de envío */}
                  {error && (
                    <div style={{
                      padding: 14, borderRadius: 10,
                      background: "rgba(220,38,38,0.06)",
                      border: "1px solid rgba(220,38,38,0.25)",
                      color: "#dc2626", fontSize: 13, fontWeight: 700,
                    }}>
                      ❌ {error}
                    </div>
                  )}
                  {success && (
                    <div style={{
                      padding: 14, borderRadius: 10,
                      background: "rgba(22,163,74,0.08)",
                      border: "1px solid rgba(22,163,74,0.3)",
                      color: "#16a34a", fontSize: 13, fontWeight: 800,
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>check_circle</span>
                      ¡Camión {form.id_camion.toUpperCase()} registrado exitosamente en Supabase!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ── Modal de Detalles del Camión ── */}
      {selectedTruck && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 110, padding: 16,
        }} onClick={() => setSelectedTruck(null)}>
          <div
            className="animate-modal"
            style={{
              background: "#ffffff", borderRadius: 24, border: "1px solid #e2e8f0",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              width: "100%", maxWidth: 500, overflow: "hidden", display: "flex", flexDirection: "column",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              height: 200, position: "relative",
              backgroundImage: selectedTruck.image_url ? `url('${selectedTruck.image_url}')` : "linear-gradient(to bottom, #1e293b, #0f172a)",
              backgroundSize: "cover", backgroundPosition: "center"
            }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0))" }} />
              <button
                onClick={() => setSelectedTruck(null)}
                style={{ position: "absolute", top: 16, right: 16, background: "rgba(0,0,0,0.4)", border: "none", color: "white", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(4px)" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
              <div style={{ position: "absolute", bottom: 16, left: 20 }}>
                <span style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{selectedTruck.modelo}</span>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: "#ffffff", margin: 0, textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>{selectedTruck.id_camion}</h2>
              </div>
            </div>
            
            <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Tajo Asignado</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{selectedTruck.tajo_asignado}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Estado</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: ESTADO_CONFIG[selectedTruck.estado as Estado]?.color || "#0f172a" }}>{ESTADO_CONFIG[selectedTruck.estado as Estado]?.label || selectedTruck.estado}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Capacidad Nominal</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{selectedTruck.capacidad_ton} ton</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Carga Operativa</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{selectedTruck.carga_operativa_ton} ton</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Disponibilidad</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{selectedTruck.disponibilidad_pct}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Neumáticos</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{selectedTruck.cantidad_neumaticos} × {selectedTruck.tamano_neumatico}</div>
                </div>
              </div>

              {selectedTruck.notas && (
                <div style={{ padding: "12px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Notas</div>
                  <div style={{ fontSize: 13, color: "#475569", fontStyle: "italic" }}>{selectedTruck.notas}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── SUBCOMPONENTES ─── */

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#2563eb" }}>{icon}</span>
      <h3 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0 }}>{title}</h3>
    </div>
  );
}

function InfoPanel({ tajo }: { tajo: Tajo }) {
  const config = {
    "Tajo Norte": {
      gradient: "linear-gradient(135deg, rgba(22, 163, 74, 0.1), rgba(22, 163, 74, 0.03))",
      border: "1px solid rgba(22, 163, 74, 0.25)",
      icon: "circle",
      color: "#16a34a",
      items: [
        { label: "Dureza Roca", value: "70 MPa (Media)" },
        { label: "Pendiente", value: "+10% (sube cargado)" },
        { label: "Vida Útil Ref.", value: "6,201 h" },
        { label: "Dist. Chancadora", value: "4.5 km" },
      ],
    },
    "Tajo Sur": {
      gradient: "linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(220, 38, 38, 0.03))",
      border: "1px solid rgba(220, 38, 38, 0.25)",
      icon: "circle",
      color: "#dc2626",
      items: [
        { label: "Dureza Roca", value: "110 MPa (Muy dura)" },
        { label: "Pendiente", value: "-10% (baja cargado)" },
        { label: "Vida Útil Ref.", value: "4,801 h" },
        { label: "Dist. Chancadora", value: "3.8 km" },
      ],
    },
  };

  const c = config[tajo];
  return (
    <div style={{ background: c.gradient, border: c.border, borderRadius: 12, padding: "14px 16px" }}>
      <p style={{ fontSize: 11, fontWeight: 800, color: c.color, display: "flex", alignItems: "center", gap: 4, margin: "0 0 10px 0" }}>
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: c.color }}>{c.icon}</span>
        Condiciones — {tajo}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {c.items.map(item => (
          <div key={item.label}>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{item.label}</div>
            <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 800, marginTop: 1 }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricBox({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <div style={{
      padding: "12px 14px", borderRadius: 10,
      background: `${color}08`,
      border: `1px solid ${color}20`,
      display: "flex",
      flexDirection: "column",
      gap: 3,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 14, color }}>{icon}</span>
        <span style={{ fontSize: 9.5, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function ResumenRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "8px 0",
      borderBottom: "1px solid #e2e8f0",
    }}>
      <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: highlight ? 900 : 700,
        color: highlight ? "#2563eb" : "#0f172a",
      }}>{value}</span>
    </div>
  );
}
