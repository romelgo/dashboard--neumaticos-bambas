import { useState, useCallback } from "react";
import { apiEndpoints } from "../lib/api/endpoints";
import { 
  ThermalPredictionResponse, 
  RulPredictionResponse, 
  RoutePredictionResponse, 
  SwapPredictionResponse 
} from "../types/api.types";

export function usePredictions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getThermalAlerts = useCallback(async (data: any): Promise<ThermalPredictionResponse | null> => {
    setLoading(true);
    try {
      const res = await apiEndpoints.predictThermal(data);
      return res;
    } catch (err: any) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRul = useCallback(async (data: any): Promise<RulPredictionResponse | null> => {
    setLoading(true);
    try {
      const res = await apiEndpoints.predictRul(data);
      return res;
    } catch (err: any) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Agregar resto de modelos...

  return {
    loading,
    error,
    getThermalAlerts,
    getRul
  };
}
