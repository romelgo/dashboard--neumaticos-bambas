import Image from "next/image";
import { Thermometer, Gauge, Weight } from "lucide-react";

interface TruckCardProps {
  id: string;
  status: "OPERATIVO" | "MANTENIMIENTO" | "DETENIDO";
  tajo: string;
  temperature: number;
  speed: number;
  payload: number;
  alert?: boolean;
}

export function TruckCard({ id, status, tajo, temperature, speed, payload, alert }: TruckCardProps) {
  return (
    <div className={`relative overflow-hidden bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl ${alert ? 'border-bambas-red shadow-bambas-red/10' : 'border-slate-200 dark:border-slate-800'}`}>
      {alert && (
        <div className="absolute top-0 right-0 bg-bambas-red text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg shadow-sm">
          ¡ALERTA TÉRMICA!
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{id}</h3>
          <p className="text-sm font-semibold text-slate-500">{tajo}</p>
        </div>
        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${status === 'OPERATIVO' ? 'bg-bambas-green/10 text-bambas-green' : 'bg-bambas-orange/10 text-bambas-orange'}`}>
          {status}
        </span>
      </div>

      <div className="relative w-full h-40 mb-5 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-800/80 rounded-xl flex items-center justify-center p-2 border border-slate-100 dark:border-slate-800">
        <Image src="/truck.png" alt="CAT 797F" width={220} height={130} className="object-contain drop-shadow-xl" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className={`flex flex-col items-center rounded-lg p-2 border ${temperature > 85 ? 'bg-bambas-red/5 border-bambas-red/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
          <Thermometer className={`w-5 h-5 mb-1 ${temperature > 85 ? 'text-bambas-red animate-pulse' : 'text-slate-400'}`} />
          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">{temperature}°C</span>
        </div>
        <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg p-2">
          <Gauge className="w-5 h-5 text-bambas-blue mb-1" />
          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">{speed} km/h</span>
        </div>
        <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg p-2">
          <Weight className="w-5 h-5 text-bambas-orange mb-1" />
          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">{payload}t</span>
        </div>
      </div>
    </div>
  );
}
