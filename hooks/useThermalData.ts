import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase/client";

export interface TruckThermalData {
  id: string; // id_camion
  tajo: string;
  status: string;
  wheels: Record<string, number>;
  wheelPressure: Record<string, number>;
  wheelVibration: Record<string, number>;
  maxTemp: number;
  maxPressure: number;
  maxVibration: number;
  speed: number;
  isCritical: boolean;
  isWarning: boolean;
  serial: string;
}

export function useThermalData() {
  const [trucks, setTrucks] = useState<Record<string, TruckThermalData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      if (!supabase) return;
      
      try {
        const { data, error } = await supabase
          .from("telemetria_neumaticos")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(200);

        if (error) {
          console.error("Error fetching telemetry:", error);
          setLoading(false);
          return;
        }

        const initialTrucks: Record<string, TruckThermalData> = {};

        if (data) {
          [...data].reverse().forEach((row) => {
            updateTruckState(initialTrucks, row);
          });
        }

        setTrucks(initialTrucks);
      } catch (err) {
        console.error("Exception fetching initial data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    const channel = supabase
      .channel("thermal-telemetry")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "telemetria_neumaticos" },
        (payload) => {
          setTrucks((prev) => {
            const next = { ...prev };
            updateTruckState(next, payload.new);
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, []);

  return { trucks: Object.values(trucks), loading };
}

const POS_MAP: Record<number, string> = {
  1: "Posición 1",
  2: "Posición 2",
  3: "Posición 3",
  4: "Posición 4",
  5: "Posición 5",
  6: "Posición 6",
};

function updateTruckState(state: Record<string, TruckThermalData>, row: any) {
  const id_camion = row.id_camion;
  if (!id_camion) return;
  
  if (!state[id_camion]) {
    state[id_camion] = {
      id: id_camion,
      tajo: row.tajo_asignado || "DESCONOCIDO",
      status: "NOMINAL",
      wheels: { "Posición 1": 70, "Posición 2": 70, "Posición 3": 70, "Posición 4": 70, "Posición 5": 70, "Posición 6": 70 },
      wheelPressure: { "Posición 1": 115, "Posición 2": 115, "Posición 3": 115, "Posición 4": 115, "Posición 5": 115, "Posición 6": 115 },
      wheelVibration: { "Posición 1": 1.0, "Posición 2": 1.0, "Posición 3": 1.0, "Posición 4": 1.0, "Posición 5": 1.0, "Posición 6": 1.0 },
      maxTemp: 70,
      maxPressure: 115,
      maxVibration: 1.0,
      speed: 0,
      isCritical: false,
      isWarning: false,
      serial: id_camion.replace("CAT-797-", "SERIAL-"),
    };
  }
  
  const truck = state[id_camion];
  if (row.tajo_asignado) truck.tajo = row.tajo_asignado;
  if (row.velocidad_kmh !== undefined) truck.speed = row.velocidad_kmh;
  
  if (row.posicion) {
    const wheelId = POS_MAP[row.posicion] || `W${row.posicion}`;
    if (row.temperatura_c !== undefined) truck.wheels[wheelId] = row.temperatura_c;
    if (row.presion_psi !== undefined) truck.wheelPressure[wheelId] = row.presion_psi;
    if (row.vibracion_g !== undefined) truck.wheelVibration[wheelId] = row.vibracion_g;
  }
  
  // Calculate max values
  truck.maxTemp = Math.max(...Object.values(truck.wheels));
  truck.maxPressure = Math.max(...Object.values(truck.wheelPressure));
  truck.maxVibration = Math.max(...Object.values(truck.wheelVibration));
  
  // Update status based on max temp
  truck.isCritical = truck.maxTemp > 85;
  truck.isWarning = truck.maxTemp > 75 && truck.maxTemp <= 85;
  truck.status = truck.isCritical ? "CRÍTICO" : (truck.isWarning ? "ELEVADO" : "NOMINAL");
}
