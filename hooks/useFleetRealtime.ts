import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase/client";
import { FleetStatusResponse } from "../types/fleet.types";
import { apiEndpoints } from "../lib/api/endpoints";

export function useFleetRealtime() {
  const [fleetData, setFleetData] = useState<FleetStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // 1. Fetch inicial de datos
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const data = await apiEndpoints.getFleetStatus();
        setFleetData(data);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    // 2. Suscripción a Supabase Realtime si está configurado
    if (!supabase) return;

    const channel = supabase
      .channel("fleet-telemetry")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "telemetry" },
        (payload) => {
          // Aquí integraríamos la lógica para actualizar el estado del camión específico
          // con la nueva lectura de telemetría.
          console.log("Nueva telemetría recibida:", payload);
          // Opcional: Podríamos re-hacer un fetch ligero o actualizar el estado mutándolo localmente.
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, []);

  return { fleetData, loading, error };
}
