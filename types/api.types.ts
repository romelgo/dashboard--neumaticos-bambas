export interface ThermalPredictionResponse {
  id_camion: string;
  id_neumatico: string;
  alerta_termica: boolean;
  probabilidad: number;
  tiempo_estimado_min: number;
  temperatura_pico_estimada: number;
  sugerencia: string;
  severidad: "NORMAL" | "ADVERTENCIA" | "CRITICA";
}

export interface RulPredictionResponse {
  id_camion: string;
  id_neumatico: string;
  dias_restantes: number;
  fecha_estimada_baja: string;
  confianza: number;
}

export interface RoutePredictionResponse {
  id_segmento: string;
  severidad: "VERDE" | "AMARILLO" | "ROJO";
  riesgo_corte: number;
}

export interface SwapPredictionResponse {
  recomendacion_id: string;
  camion_origen: string;
  neumatico_origen: string;
  posicion_origen: number;
  camion_destino: string;
  neumatico_destino: string;
  posicion_destino: number;
  motivo: string;
  prioridad: "ALTA" | "MEDIA" | "BAJA";
}
