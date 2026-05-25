"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase/client";

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [date, setDate] = useState(new Date());
  const [totalCamiones, setTotalCamiones] = useState(60);
  const [operativos, setOperativos] = useState(58);

  useEffect(() => {
    setMounted(true);
    // Actualizar la hora cada segundo
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      if (!supabase) return;
      try {
        const { count: total } = await supabase.from("camiones").select("*", { count: "exact", head: true });
        const { count: ops } = await supabase.from("camiones").select("*", { count: "exact", head: true }).eq("estado", "OPERATIVO");
        if (total !== null) setTotalCamiones(total);
        if (ops !== null) setOperativos(ops);
      } catch (e) {
        console.error("Error fetching header stats:", e);
      }
    };
    fetchStats();
  }, []);

  // Formatear en español (ej: viernes, 22 de mayo de 2026)
  const formattedDate = mounted 
    ? date.toLocaleDateString("es-ES", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : "";
    
  // Formatear en español corto (ej: 22 may)
  const formattedDateShort = mounted
    ? date.toLocaleDateString("es-ES", { month: 'short', day: 'numeric' })
    : "";
    
  // Formatear la hora en formato 12h (ej: 11:10 PM)
  const formattedTime = mounted 
    ? date.toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit', hour12: true })
    : "";

  const renderBrandText = () => {
    const text = "Las Bambas Intelligence";
    const colors = ["text-[#4285F4]", "text-[#EA4335]", "text-[#FBBC05]", "text-[#34A853]"];
    let colorIndex = 0;
    return text.split("").map((char, i) => {
      if (char === " ") return <span key={i}> </span>;
      const color = colors[Math.floor(colorIndex / 3) % colors.length];
      colorIndex++;
      return <span key={i} className={color}>{char}</span>;
    });
  };

  return (
    <header className="fixed top-0 w-full z-40 h-16">
      <div className="relative w-full h-full pb-[2px] overflow-hidden shadow-sm">
        {/* Animated Google Colors Border on the bottom */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute left-1/2 top-1/2 w-[200%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-[spin_4s_linear_infinite] opacity-80"
            style={{
              background: 'conic-gradient(from 0deg, transparent 70%, #4285F4 80%, #EA4335 87%, #FBBC05 94%, #34A853 100%)'
            }}
          />
        </div>
        
        {/* Inner Header Content */}
        <div className="relative w-full h-full bg-[#fffdfc] dark:bg-inverse-surface z-10 flex justify-between items-center px-3 sm:px-6">
          
          {/* Left Side: Brand and Status */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <span className="font-bold text-base sm:text-lg tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[110px] sm:max-w-none">
              {renderBrandText()}
            </span>
            <div className="h-4 sm:h-6 w-px bg-red-200 dark:bg-red-900/50"></div>
            <span className="font-bold text-[#0369a1] dark:text-sky-400 text-xs sm:text-sm tracking-wide whitespace-nowrap">
              {operativos}/{totalCamiones} <span className="hidden sm:inline">OPERATIVOS</span>
            </span>
          </div>

          {/* Middle Side: Date and Time */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-3 absolute left-1/2 -translate-x-1/2">
            <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 capitalize tracking-tight sm:tracking-wide text-center">
              <span className="hidden md:inline">{formattedDate}</span>
              <span className="inline md:hidden">{formattedDateShort}</span>
            </span>
            {mounted && <div className="hidden sm:block h-4 w-px bg-gray-300 dark:bg-gray-700"></div>}
            <span className="text-[10px] sm:text-sm font-bold text-gray-800 dark:text-gray-200 uppercase leading-none">
              {formattedTime}
            </span>
          </div>

          {/* Right Side: Actions and Profile */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button className="hidden sm:block p-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
              </svg>
            </button>
            <button className="p-1.5 sm:p-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            
            <div className="h-6 sm:h-8 w-px bg-red-100 dark:bg-red-900/50 mx-1 sm:mx-2"></div>
            
            <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2">
              <div className="hidden sm:flex flex-col items-end justify-center">
                <span className="text-[9px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-none mb-1">Supervisor</span>
                <span className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-none tracking-tight">A. CALDERÓN</span>
              </div>
              <img 
                src="/avatar.jpg" 
                className="w-7 h-7 sm:w-9 sm:h-9 object-cover rounded-full border-2 border-red-200/50 shadow-sm" 
                alt="Avatar" 
              />
            </div>
          </div>
          
        </div>
      </div>
    </header>
  );
}
