"use client";

import React, { useMemo, useState } from "react";
import { useThermalData } from "../../../hooks/useThermalData";
import { Modal } from "../../../components/ui/Modal";
import { ThermalTimeSeriesChart } from "../../../components/charts/ThermalTimeSeriesChart";
import { 
  Thermometer, 
  Gauge, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  SlidersHorizontal, 
  MapPin, 
  Radio 
} from "lucide-react";

export default function ThermalAlertsPage() {
  const { trucks, loading } = useThermalData();
  const [filterZone, setFilterZone] = useState<string>("ALL");
  const [filterState, setFilterState] = useState<string>("ALL");
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);

  // Filter trucks
  const filteredTrucks = useMemo(() => {
    return trucks.filter(truck => {
      if (filterZone !== "ALL" && truck.tajo?.toUpperCase() !== filterZone.toUpperCase()) return false;
      if (filterState === "CRÍTICO" && !truck.isCritical) return false;
      if (filterState === "ADVERTENCIA" && !truck.isWarning) return false;
      if (filterState === "OPERATIVO" && (truck.isCritical || truck.isWarning)) return false;
      return true;
    });
  }, [trucks, filterZone, filterState]);

  // Aggregate stats
  const totalTrucks = trucks.length;
  const criticalCount = trucks.filter(t => t.isCritical).length;
  const avgTemp = totalTrucks > 0 
    ? trucks.reduce((sum, t) => sum + t.maxTemp, 0) / totalTrucks 
    : 0;
    
  const maxTempNorte = trucks
    .filter(t => t.tajo?.toUpperCase().includes("NORTE"))
    .reduce((max, t) => Math.max(max, t.maxTemp), 0);
    
  const maxTempSur = trucks
    .filter(t => t.tajo?.toUpperCase().includes("SUR"))
    .reduce((max, t) => Math.max(max, t.maxTemp), 0);

  const maxTempNorteTruck = trucks
    .filter(t => t.tajo?.toUpperCase().includes("NORTE"))
    .sort((a, b) => b.maxTemp - a.maxTemp)[0];
    
  const maxTempSurTruck = trucks
    .filter(t => t.tajo?.toUpperCase().includes("SUR"))
    .sort((a, b) => b.maxTemp - a.maxTemp)[0];

  return (
    <div className="relative space-y-8 max-w-[1600px] mx-auto pb-32 z-10">
      {/* Custom styles for floating background blobs */}
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
        .animate-float-1 {
          animation: float-1 20s ease-in-out infinite;
        }
        .animate-float-2 {
          animation: float-2 25s ease-in-out infinite;
        }
        .animate-float-3 {
          animation: float-3 22s ease-in-out infinite;
        }
      `}</style>

      {/* Background Glowing Blobs for Glassmorphism */}
      <div className="absolute inset-0 -top-32 overflow-hidden pointer-events-none -z-10 select-none">
        <div className="absolute top-[2%] left-[5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-rose-500/25 via-pink-500/20 to-amber-400/15 blur-[90px] animate-float-1" />
        <div className="absolute top-[12%] right-[2%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-600/35 via-sky-500/30 to-teal-400/20 blur-[100px] animate-float-2" />
        <div className="absolute bottom-[15%] left-[8%] w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-fuchsia-500/20 via-purple-500/15 to-blue-500/10 blur-[90px] animate-float-3" />
      </div>

      {/* Header Info */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-on-surface tracking-tight bg-gradient-to-r from-on-surface via-on-surface-variant to-on-surface bg-clip-text">
            Monitoreo Térmico
          </h2>
          <p className="text-base text-on-surface-variant font-semibold mt-2 flex items-center gap-2">
            <Radio className="w-4 h-4 text-secondary animate-pulse" />
            Centro de Comando Operativo — Zona Atacama
          </p>
        </div>
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-slate-800/70 shadow-sm self-start md:self-auto">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">
            {loading ? "Conectando..." : "Telemetría en Vivo Activa"}
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {/* KPI 1: Temp Promedio */}
        <div className="backdrop-blur-xl bg-white/75 dark:bg-slate-900/60 border border-white/50 dark:border-slate-800/70 hover:border-secondary/45 dark:hover:border-secondary/55 hover:shadow-2xl hover:shadow-secondary/5 transition-all duration-300 p-8 rounded-2xl flex flex-col justify-between group">
          <div>
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Temp Promedio Flota</p>
              <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                <Thermometer className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-secondary tracking-tight">{avgTemp.toFixed(1)}</span>
              <span className="text-base text-on-surface-variant font-bold">°C</span>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-[9px] font-black text-on-surface-variant uppercase tracking-wider mb-1.5">
              <span>Rendimiento Térmico</span>
              <span>{Math.min(100, Math.round((avgTemp/120)*100))}%</span>
            </div>
            <div className="h-1.5 w-full bg-surface-container-high/40 rounded-full overflow-hidden p-[1px] border border-white/10 dark:border-slate-800/20">
              <div className="bg-gradient-to-r from-secondary to-secondary-container h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (avgTemp/120)*100)}%` }}></div>
            </div>
          </div>
        </div>

        {/* KPI 2: Alertas Críticas */}
        <div className={`backdrop-blur-xl border hover:shadow-2xl transition-all duration-300 p-8 rounded-2xl flex flex-col justify-between group ${
          criticalCount > 0 
            ? 'bg-error-container/25 dark:bg-error-container/15 border-error/40 hover:border-error/60 hover:shadow-error/5' 
            : 'bg-white/75 dark:bg-slate-900/60 border-white/50 dark:border-slate-800/70 hover:border-outline-variant/50 hover:shadow-slate-200/20'
        }`}>
          <div>
            <div className="flex justify-between items-start mb-4">
              <p className={`text-[10px] font-black uppercase tracking-widest ${criticalCount > 0 ? 'text-error' : 'text-on-surface-variant'}`}>Alertas Críticas</p>
              <div className={`p-2 rounded-xl ${criticalCount > 0 ? 'bg-error/10 text-error' : 'bg-surface-container-high/40 text-on-surface-variant'}`}>
                <ShieldAlert className={`w-5 h-5 ${criticalCount > 0 ? 'animate-bounce' : ''}`} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl font-extrabold tracking-tight ${criticalCount > 0 ? 'text-error' : 'text-on-surface'}`}>{String(criticalCount).padStart(2, '0')}</span>
              <span className="text-base text-on-surface-variant font-bold">CAMIONES</span>
            </div>
          </div>
          <div className="mt-6">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${
              criticalCount > 0 
                ? 'bg-error/15 text-error animate-pulse' 
                : 'bg-surface-container-high/30 text-on-surface-variant/70 border border-white/5'
            }`}>
              {criticalCount > 0 ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>
                  ACCION REQUERIDA
                </>
              ) : (
                "SIN ALERTAS ACTIVAS"
              )}
            </span>
          </div>
        </div>

        {/* KPI 3: Máx Temp - Norte */}
        <div className="backdrop-blur-xl bg-white/75 dark:bg-slate-900/60 border border-white/50 dark:border-slate-800/70 hover:border-tertiary/45 dark:hover:border-tertiary/55 hover:shadow-2xl hover:shadow-tertiary/5 transition-all duration-300 p-8 rounded-2xl flex flex-col justify-between group">
          <div>
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Máx Temp - Norte</p>
              <div className="p-2 rounded-xl bg-tertiary/10 text-tertiary">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-on-surface tracking-tight">{maxTempNorte.toFixed(1)}</span>
              <span className="text-base text-on-surface-variant font-bold">°C</span>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-1">
            <span className="text-[10px] font-black text-tertiary tracking-widest uppercase">
              {maxTempNorteTruck ? maxTempNorteTruck.id : 'SIN DATOS'}
            </span>
            <span className="text-[9px] text-on-surface-variant/70 font-bold tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 text-tertiary" /> TAJO NORTE
            </span>
          </div>
        </div>

        {/* KPI 4: Máx Temp - Sur */}
        <div className="backdrop-blur-xl bg-white/75 dark:bg-slate-900/60 border border-white/50 dark:border-slate-800/70 hover:border-primary/45 dark:hover:border-primary/55 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 p-8 rounded-2xl flex flex-col justify-between group">
          <div>
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Máx Temp - Sur</p>
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-primary tracking-tight">{maxTempSur.toFixed(1)}</span>
              <span className="text-base text-on-surface-variant font-bold">°C</span>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-1">
            <span className={`text-[10px] font-black text-primary tracking-widest uppercase ${maxTempSur > 85 ? 'animate-pulse' : ''}`}>
              {maxTempSurTruck ? `${maxTempSurTruck.id} ${maxTempSur > 85 ? '(PELIGRO)' : ''}` : 'SIN DATOS'}
            </span>
            <span className="text-[9px] text-on-surface-variant/70 font-bold tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary" /> TAJO SUR
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-6 mb-10 p-4 rounded-2xl bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl border border-white/30 dark:border-slate-800/50 shadow-sm">
        <div className="flex gap-1.5 p-1 bg-surface-container-high/30 dark:bg-slate-950/20 backdrop-blur-sm rounded-xl border border-white/5">
          <button 
            onClick={() => setFilterZone("ALL")} 
            className={`px-5 py-2 rounded-lg text-xs font-black tracking-widest transition-all duration-300 cursor-pointer ${
              filterZone === "ALL" 
                ? "bg-white dark:bg-slate-800 text-on-surface shadow-md scale-102" 
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            TODAS LAS ZONAS
          </button>
          <button 
            onClick={() => setFilterZone("TAJO NORTE")} 
            className={`px-5 py-2 rounded-lg text-xs font-black tracking-widest transition-all duration-300 cursor-pointer ${
              filterZone === "TAJO NORTE" 
                ? "bg-white dark:bg-slate-800 text-on-surface shadow-md scale-102" 
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            TAJO NORTE
          </button>
          <button 
            onClick={() => setFilterZone("TAJO SUR")} 
            className={`px-5 py-2 rounded-lg text-xs font-black tracking-widest transition-all duration-300 cursor-pointer ${
              filterZone === "TAJO SUR" 
                ? "bg-white dark:bg-slate-800 text-on-surface shadow-md scale-102" 
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            TAJO SUR
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <select 
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="appearance-none bg-white/60 dark:bg-slate-900/50 backdrop-blur-md border border-white/20 dark:border-slate-800/40 rounded-xl text-xs font-black text-on-surface pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-secondary/35 transition-all tracking-widest uppercase cursor-pointer"
            >
              <option value="ALL" className="bg-surface dark:bg-slate-900">ESTADO: TODOS LOS ACTIVOS</option>
              <option value="CRÍTICO" className="bg-surface dark:bg-slate-900">ESTADO: CRÍTICOS (&gt;85°C)</option>
              <option value="ADVERTENCIA" className="bg-surface dark:bg-slate-900">ESTADO: ADVERTENCIA (&gt;75°C)</option>
              <option value="OPERATIVO" className="bg-surface dark:bg-slate-900">ESTADO: OPERATIVOS</option>
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </div>
          </div>
          
          <button className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/50 backdrop-blur-md border border-white/20 dark:border-slate-800/40 text-on-surface-variant hover:text-secondary hover:border-secondary/40 hover:shadow-lg transition-all duration-300 flex items-center justify-center cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          </button>
        </div>
      </div>

      {/* Truck Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {filteredTrucks.map((truck) => {
          let statusClass = "border-t-4 border-t-secondary/60 hover:border-secondary hover:shadow-secondary/5";
          let colorClass = "text-secondary";
          let bgClass = "bg-secondary/5";
          let btnClass = "border border-white/30 dark:border-slate-800/60 text-on-surface hover:bg-white/20 dark:hover:bg-slate-950/20 hover:border-white/45 cursor-pointer";
          let btnText = "VER TELEMETRÍA";
          let statusLabel = "OPERATIVO";
          let statusBg = "bg-secondary/15 text-secondary border-secondary/20";
          let statusIcon = <CheckCircle2 className="w-3.5 h-3.5" />;

          if (truck.isCritical) {
            statusClass = "border-t-4 border-t-error/60 hover:border-error hover:shadow-error/10 bg-error/5";
            colorClass = "text-error";
            bgClass = "bg-error/10";
            btnClass = "bg-error text-white hover:bg-error/95 hover:shadow-lg hover:shadow-error/20 border-transparent cursor-pointer";
            btnText = "DETENER ACTIVO";
            statusLabel = "CRÍTICO";
            statusBg = "bg-error/15 text-error border-error/20";
            statusIcon = <ShieldAlert className="w-3.5 h-3.5 animate-bounce" />;
          } else if (truck.isWarning) {
            statusClass = "border-t-4 border-t-amber-500/60 hover:border-amber-500 hover:shadow-amber-500/5 bg-amber-500/5";
            colorClass = "text-amber-500";
            bgClass = "bg-amber-500/10";
            btnClass = "border border-amber-500/35 text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/45 cursor-pointer";
            btnText = "AJUSTAR VELOCIDAD";
            statusLabel = "ADVERTENCIA";
            statusBg = "bg-amber-500/15 text-amber-500 border-amber-500/20";
            statusIcon = <AlertTriangle className="w-3.5 h-3.5" />;
          }

          return (
            <div 
              key={truck.id} 
              onClick={() => setSelectedTruckId(truck.id)}
              className={`backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border border-white/45 dark:border-slate-800/65 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5 shadow-md cursor-pointer ${statusClass}`}
            >
              {/* Card Header */}
              <div className={`px-4 py-3.5 flex justify-between items-center border-b border-white/10 dark:border-slate-800/30 ${bgClass}`}>
                <span className="text-xs font-black tracking-widest text-on-surface">
                  {truck.id}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider border uppercase ${statusBg}`}>
                  {statusIcon}
                  {statusLabel}
                </span>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-on-surface">CAT 797F</h3>
                    <p className="text-[9px] text-on-surface-variant/70 uppercase font-black tracking-widest mt-0.5">S/N: #{truck.serial}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-black ${truck.isCritical ? 'text-error' : (truck.isWarning ? 'text-amber-500' : 'text-on-surface')}`}>{truck.maxTemp.toFixed(1)}°C</p>
                    <p className="text-[9px] text-on-surface-variant/70 font-bold uppercase tracking-widest mt-0.5">{truck.tajo}</p>
                  </div>
                </div>
                
                {/* Telemetry Pods */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {/* Temp Pod */}
                  <div className={`backdrop-blur-sm bg-white/25 dark:bg-slate-950/20 p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                    truck.maxTemp > 85 
                      ? 'border-error/20 bg-error/5 text-error animate-pulse' 
                      : 'border-white/10 dark:border-slate-800/20'
                  }`}>
                    <span className="text-[8px] font-black tracking-wider text-on-surface-variant/70 uppercase mb-0.5 flex items-center gap-0.5">
                      <Thermometer className="w-3.5 h-3.5" /> TEMP. MÁX
                    </span>
                    <span className="font-extrabold text-sm text-on-surface">{truck.maxTemp.toFixed(1)}°C</span>
                  </div>
                  
                  {/* Pressure Pod */}
                  <div className="backdrop-blur-sm bg-white/25 dark:bg-slate-950/20 p-2.5 rounded-xl border border-white/10 dark:border-slate-800/20 flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] font-black tracking-wider text-on-surface-variant/70 uppercase mb-0.5 flex items-center gap-0.5">
                      <TrendingUp className="w-3.5 h-3.5 text-secondary" /> PRESIÓN
                    </span>
                    <span className="font-extrabold text-sm text-on-surface">{truck.maxPressure.toFixed(0)} PSI</span>
                  </div>

                  {/* Vibration Pod */}
                  <div className="backdrop-blur-sm bg-white/25 dark:bg-slate-950/20 p-2.5 rounded-xl border border-white/10 dark:border-slate-800/20 flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] font-black tracking-wider text-on-surface-variant/70 uppercase mb-0.5 flex items-center gap-0.5">
                      <Activity className="w-3.5 h-3.5 text-tertiary" /> VIBRACIÓN
                    </span>
                    <span className="font-extrabold text-sm text-on-surface">{truck.maxVibration.toFixed(1)} G</span>
                  </div>

                  {/* Speed Pod */}
                  <div className="backdrop-blur-sm bg-white/25 dark:bg-slate-950/20 p-2.5 rounded-xl border border-white/10 dark:border-slate-800/20 flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] font-black tracking-wider text-on-surface-variant/70 uppercase mb-0.5 flex items-center gap-0.5">
                      <Gauge className="w-3.5 h-3.5 text-secondary" /> VELOCIDAD
                    </span>
                    <span className="font-extrabold text-sm text-on-surface">{truck.speed.toFixed(0)} km/h</span>
                  </div>
                </div>

                <div className="mt-auto">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTruckId(truck.id);
                    }}
                    className={`w-full py-2 font-black rounded-xl text-[10px] transition-all duration-300 uppercase tracking-widest active:scale-95 flex items-center justify-center gap-1 ${btnClass}`}
                  >
                    {btnText}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredTrucks.length === 0 && !loading && (
          <div className="col-span-full py-16 text-center backdrop-blur-sm bg-white/10 dark:bg-slate-900/10 border border-white/10 dark:border-slate-800/20 rounded-2xl text-on-surface-variant font-black tracking-widest uppercase text-sm">
            No hay camiones que coincidan con los filtros seleccionados.
          </div>
        )}
      </div>

      <Modal 
        isOpen={!!selectedTruckId} 
        onClose={() => setSelectedTruckId(null)}
        title={`Telemetría Histórica: ${selectedTruckId}`}
      >
        {selectedTruckId && <ThermalTimeSeriesChart truckId={selectedTruckId} />}
      </Modal>
    </div>
  );
}
