export interface SensorData {
  temperatura_c: number;
  velocidad_kmh: number;
  payload_ton: number;
  presion_psi: number;
  tkph_real: number;
  vibracion_g: number;
  timestamp: string;
}

export interface Tire {
  id_neumatico: string;
  posicion: number;
  horas_uso: number;
  ultima_lectura: SensorData;
}

export interface Truck {
  id_camion: string;
  estado: "OPERATIVO" | "MANTENIMIENTO" | "DETENIDO";
  tajo_asignado: "Tajo Sur" | "Tajo Norte" | string;
  neumaticos: Tire[];
}

export interface FleetStatusResponse {
  camiones: Truck[];
  timestamp_actualizacion: string;
}
