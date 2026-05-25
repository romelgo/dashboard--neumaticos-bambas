"use client";

import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase/client";

export interface CamionFormData {
  id_camion: string;
  modelo: string;
  capacidad_ton: number;
  carga_operativa_ton: number;
  cantidad_neumaticos: number;
  tamano_neumatico: string;
  tajo_asignado: "Tajo Norte" | "Tajo Sur";
  estado: "OPERATIVO" | "MANTENIMIENTO" | "DETENIDO";
  disponibilidad_pct: number;
  horas_efectivas_dia: number;
  dias_operacion_mes: number;
  precio_neumatico_usd: number;
  vida_util_proyectada_h: number;
  periodo_analisis_meses: number;
  dureza_roca_mpa: number;
  pendiente_pct: number;
  distancia_chancadora_km: number;
  notas: string;
  imageFile?: File | null;
  image_url?: string;
  /** Profundidad actual de la cocada del neumático (mm). Nuevo: 65mm. Retiro: ~10mm */
  profundidad_cocada_actual_mm?: number;
  /** Total de horas operadas acumuladas en el período de análisis */
  horas_operadas_total?: number;
}

export interface Camion extends CamionFormData {
  id: number;
  created_at: string;
  updated_at: string;
}

// Valores por defecto del CAT 797F según especificaciones Bambas
export const CAT797F_DEFAULTS = {
  modelo: "CAT 797F",
  capacidad_ton: 400,
  carga_operativa_ton: 320,
  cantidad_neumaticos: 6,
  tamano_neumatico: "59/80R63",
  disponibilidad_pct: 85,
  horas_efectivas_dia: 21.83,
  dias_operacion_mes: 28,
  precio_neumatico_usd: 52000,
  periodo_analisis_meses: 6,
};

// Vida útil proyectada por tajo (imágenes de referencia)
export const VIDA_UTIL_POR_TAJO: Record<string, number> = {
  "Tajo Norte": 6201, // Roca 70 MPa, +10% pendiente
  "Tajo Sur": 4801,   // Roca 110 MPa, -10% pendiente
};

// Parámetros geomecánicos por tajo
export const PARAMS_POR_TAJO: Record<string, { dureza: number; pendiente: number; distancia: number }> = {
  "Tajo Norte": { dureza: 70, pendiente: 10, distancia: 4.5 },
  "Tajo Sur": { dureza: 110, pendiente: -10, distancia: 3.8 },
};

export function useTruckManager() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [camiones, setCamiones] = useState<Camion[]>([]);

  /** Agregar un nuevo camión a la tabla `camiones` */
  const addTruck = useCallback(async (data: CamionFormData): Promise<boolean> => {
    if (!supabase) {
      setError("No hay conexión con Supabase. Verifica las variables de entorno.");
      return false;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let finalImageUrl = data.image_url || null;

      // Subir archivo a Supabase Storage si existe
      if (data.imageFile) {
        const fileExt = data.imageFile.name.split('.').pop();
        const fileName = `${data.id_camion.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}.${fileExt}`;
        const filePath = `trucks/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("truck_images")
          .upload(filePath, data.imageFile);

        if (uploadError) {
          throw new Error(`Error subiendo la imagen: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("truck_images")
          .getPublicUrl(filePath);

        finalImageUrl = publicUrlData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from("camiones")
        .insert([{
          id_camion: data.id_camion.toUpperCase(),
          modelo: data.modelo,
          capacidad_ton: data.capacidad_ton,
          carga_operativa_ton: data.carga_operativa_ton,
          cantidad_neumaticos: data.cantidad_neumaticos,
          tamano_neumatico: data.tamano_neumatico,
          tajo_asignado: data.tajo_asignado,
          estado: data.estado,
          disponibilidad_pct: data.disponibilidad_pct,
          horas_efectivas_dia: data.horas_efectivas_dia,
          dias_operacion_mes: data.dias_operacion_mes,
          precio_neumatico_usd: data.precio_neumatico_usd,
          vida_util_proyectada_h: data.vida_util_proyectada_h,
          periodo_analisis_meses: data.periodo_analisis_meses,
          dureza_roca_mpa: data.dureza_roca_mpa,
          pendiente_pct: data.pendiente_pct,
          distancia_chancadora_km: data.distancia_chancadora_km,
          notas: data.notas || null,
          image_url: finalImageUrl,
          // Nuevos campos de profundidad (calculados al insertar)
          profundidad_cocada_actual_mm: data.profundidad_cocada_actual_mm ?? 65.0,
          horas_operadas_total: data.horas_operadas_total ?? 0,
        }]);

      if (insertError) throw new Error(insertError.message);

      setSuccess(true);
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido al registrar camión");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Obtener todos los camiones registrados */
  const listTrucks = useCallback(async () => {
    if (!supabase) {
      setError("No hay conexión con Supabase.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("camiones")
        .select("*")
        .order("id_camion", { ascending: true });

      if (fetchError) throw new Error(fetchError.message);
      setCamiones((data as Camion[]) || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al obtener camiones");
    } finally {
      setLoading(false);
    }
  }, []);

  /** Calcular métricas derivadas */
  const calcularMetricas = useCallback((data: Partial<CamionFormData>) => {
    const precioNeumatico = data.precio_neumatico_usd || CAT797F_DEFAULTS.precio_neumatico_usd;
    const vidaUtil = data.vida_util_proyectada_h || VIDA_UTIL_POR_TAJO[data.tajo_asignado || "Tajo Norte"];
    const cantNeumaticos = data.cantidad_neumaticos || CAT797F_DEFAULTS.cantidad_neumaticos;
    const horasDia = data.horas_efectivas_dia || CAT797F_DEFAULTS.horas_efectivas_dia;
    const diasMes = data.dias_operacion_mes || CAT797F_DEFAULTS.dias_operacion_mes;
    const meses = data.periodo_analisis_meses || CAT797F_DEFAULTS.periodo_analisis_meses;
    const disponibilidad = (data.disponibilidad_pct || CAT797F_DEFAULTS.disponibilidad_pct) / 100;

    // Profundidad de cocada
    const COCADA_INICIAL_MM = 65;
    const COCADA_MINIMA_MM  = 10;
    const profActual = data.profundidad_cocada_actual_mm ?? COCADA_INICIAL_MM;

    // Tasa de desgaste cocada (mm/h) = 65mm / vida_util_h
    const tasaDesgaste = vidaUtil > 0 ? COCADA_INICIAL_MM / vidaUtil : 0;

    // Porcentaje de vida útil consumida (basado en profundidad real)
    const pctDesgasteReal = ((COCADA_INICIAL_MM - profActual) / COCADA_INICIAL_MM) * 100;

    // Horas restantes estimadas según profundidad actual
    const horasRestantes = tasaDesgaste > 0
      ? (profActual - COCADA_MINIMA_MM) / tasaDesgaste
      : vidaUtil;

    // Costo por Hora (CPH) = precio_neumatico / vida_util × cantidad_neumaticos
    const cph = vidaUtil > 0 ? (precioNeumatico / vidaUtil) * cantNeumaticos : 0;

    // Horas efectivas totales por período (con disponibilidad)
    const horasPeriodo = horasDia * diasMes * meses * disponibilidad;

    // Costo total por camión en el período
    const costoTotalPeriodo = cph * horasPeriodo;

    return {
      tasaDesgaste_mm_h:       parseFloat(tasaDesgaste.toFixed(5)),
      cph_usd_h:               parseFloat(cph.toFixed(2)),
      horasPeriodo:            parseFloat(horasPeriodo.toFixed(1)),
      costoTotalPeriodo_usd:   parseFloat(costoTotalPeriodo.toFixed(0)),
      pctDesgasteReal:         parseFloat(pctDesgasteReal.toFixed(1)),
      profActual_mm:           parseFloat(profActual.toFixed(2)),
      horasRestantes_h:        parseFloat(horasRestantes.toFixed(1)),
    };
  }, []);

  const resetStatus = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    loading,
    error,
    success,
    camiones,
    addTruck,
    listTrucks,
    calcularMetricas,
    resetStatus,
  };
}
