import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase/client";

export interface TruckHistoryDataPoint {
  time: string;
  fullTime: string;
  FL: number | null;
  FR: number | null;
  RL: number | null;
  RR: number | null;
}

const POS_MAP: Record<number, string> = {
  1: "Posición 1",
  2: "Posición 2",
  3: "Posición 3",
  4: "Posición 4",
  5: "Posición 5",
  6: "Posición 6",
};

export function useTruckHistory(truckId: string | null) {
  const [data, setData] = useState<TruckHistoryDataPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!truckId || !supabase) {
      setData([]);
      return;
    }

    let isMounted = true;

    const fetchHistory = async () => {
      if (!supabase) return;
      setLoading(true);
      try {
        const { data: rows, error } = await supabase
          .from("telemetria_neumaticos")
          .select("timestamp, posicion, temperatura_c, presion_psi, vibracion_g, velocidad_kmh")
          .eq("id_camion", truckId)
          .order("timestamp", { ascending: false })
          .limit(300);

        if (error) {
          console.error("Error fetching truck history:", error);
          if (isMounted) setLoading(false);
          return;
        }

        if (!rows || rows.length === 0) {
          if (isMounted) {
            setData([]);
            setLoading(false);
          }
          return;
        }

        const grouped: Record<string, any> = {};

        [...rows].reverse().forEach((row) => {
          const date = new Date(row.timestamp);
          const timeKey = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const shortTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          if (!grouped[timeKey]) {
            grouped[timeKey] = {
              time: shortTime,
              fullTime: timeKey,
              Velocidad: row.velocidad_kmh || 0,
            };
          } else if (row.velocidad_kmh !== undefined) {
            grouped[timeKey].Velocidad = row.velocidad_kmh;
          }

          const wheelId = POS_MAP[row.posicion] || `W${row.posicion}`;
          if (Object.values(POS_MAP).includes(wheelId)) {
            grouped[timeKey][`${wheelId}_temp`] = row.temperatura_c;
            grouped[timeKey][`${wheelId}_pressure`] = row.presion_psi;
            grouped[timeKey][`${wheelId}_vibration`] = row.vibracion_g;
          }
        });

        const timeSeries = Object.values(grouped) as any[];
        
        // Mantener solo los últimos 20 puntos para que el gráfico se vea limpio (Tremor style)
        if (isMounted) {
          setData(timeSeries.slice(-30));
        }
      } catch (err) {
        console.error("Exception fetching truck history:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHistory();

    // Podemos suscribirnos aquí si queremos actualizar el modal en tiempo real
    const channel = supabase
      .channel(`history-${truckId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "telemetria_neumaticos", filter: `id_camion=eq.${truckId}` },
        () => {
          // Refetch para mantener simple
          fetchHistory();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase?.removeChannel(channel);
    };
  }, [truckId]);

  return { data, loading };
}
