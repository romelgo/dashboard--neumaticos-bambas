import { ApiClient } from "./client";
import { 
  ThermalPredictionResponse, 
  RulPredictionResponse, 
  RoutePredictionResponse, 
  SwapPredictionResponse 
} from "../../types/api.types";
import { FleetStatusResponse, SensorData } from "../../types/fleet.types";

export const apiEndpoints = {
  // --- Modelos de Predicción ---
  
  predictThermal: async (data: any): Promise<ThermalPredictionResponse> => {
    return ApiClient.post<ThermalPredictionResponse>("/api/v1/predict/thermal", data);
  },

  predictRul: async (data: any): Promise<RulPredictionResponse> => {
    return ApiClient.post<RulPredictionResponse>("/api/v1/predict/rul", data);
  },

  predictRoute: async (data: any): Promise<RoutePredictionResponse> => {
    return ApiClient.post<RoutePredictionResponse>("/api/v1/predict/route", data);
  },

  getSwapRecommendations: async (): Promise<SwapPredictionResponse[]> => {
    return ApiClient.get<SwapPredictionResponse[]>("/api/v1/predict/swap");
  },

  // --- Estado de la Flota ---
  
  getFleetStatus: async (): Promise<FleetStatusResponse> => {
    return ApiClient.get<FleetStatusResponse>("/api/v1/fleet/status");
  },

  getActiveAlerts: async (): Promise<any[]> => {
    return ApiClient.get<any[]>("/api/v1/alerts/active");
  }
};
