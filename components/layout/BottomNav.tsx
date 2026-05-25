"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:max-w-3xl md:mx-auto md:mb-6 mb-6 px-4">
      <div className="relative w-full rounded-full p-[1.5px] shadow-[0_-4px_20px_rgba(32,42,190,0.06)]">

        {/* Animated Google Colors Border */}
        <div className="absolute inset-0 overflow-hidden rounded-full -z-10">
          <div
            className="absolute left-1/2 top-1/2 w-[200%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-[spin_4s_linear_infinite] opacity-80"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 70%, #4285F4 80%, #EA4335 87%, #FBBC05 94%, #34A853 100%)",
            }}
          />
        </div>

        {/* Inner Nav */}
        <nav
          className="relative w-full h-full flex justify-around items-center py-2 px-4 rounded-full"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center transition-all px-2 py-1 z-10 ${
              pathname === "/dashboard"
                ? "text-secondary"
                : "text-on-surface-variant hover:text-secondary"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-0.5">
              <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
            </svg>
            <span className="font-label-md text-[10px] font-bold">Dashboard</span>
          </Link>

          {/* Monitoreo */}
          <Link
            href="/dashboard/thermal"
            className={`flex flex-col items-center justify-center transition-all px-2 py-1 z-10 ${
              pathname === "/dashboard/thermal"
                ? "text-secondary"
                : "text-on-surface-variant hover:text-secondary"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-0.5">
              <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>
            </svg>
            <span className="font-label-md text-[10px] font-bold">Monitoreo</span>
          </Link>

          {/* Severidad — CTA izquierdo (rojo) */}
          <div className="relative -top-6 z-20">
            <Link href="/dashboard/route">
              <div
                className={`w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-xl border-4 border-white cursor-pointer transform hover:scale-105 transition-transform ${
                  pathname === "/dashboard/route"
                    ? "bg-gradient-to-br from-[#bc0100] to-[#720000]"
                    : "bg-gradient-to-br from-[#dc2626] to-[#7f1d1d]"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="19" r="3"/>
                  <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>
                  <circle cx="18" cy="5" r="3"/>
                </svg>
              </div>
            </Link>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-max">
              <span className={`text-[10px] font-bold ${pathname === "/dashboard/route" ? "text-red-500" : "text-on-surface-variant"}`}>
                Severidad
              </span>
            </div>
          </div>

          {/* Predicción */}
          <Link
            href="/dashboard/rul"
            className={`flex flex-col items-center justify-center transition-all px-2 py-1 z-10 ${
              pathname === "/dashboard/rul"
                ? "text-secondary"
                : "text-on-surface-variant hover:text-secondary"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-0.5">
              <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
            </svg>
            <span className="font-label-md text-[10px] font-bold">Predicción</span>
          </Link>

          {/* + Camión — CTA derecho (ámbar) */}
          <div className="relative -top-6 z-20">
            <Link href="/dashboard/add-truck">
              <div
                className={`w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-xl border-4 border-white cursor-pointer transform hover:scale-105 transition-transform bg-gradient-to-br ${
                  pathname === "/dashboard/add-truck"
                    ? "from-[#f59e0b] to-[#92400e]"
                    : "from-[#fbbf24] to-[#b45309]"
                }`}
                style={{
                  boxShadow:
                    pathname === "/dashboard/add-truck"
                      ? "0 4px 20px rgba(245,158,11,0.5)"
                      : "0 4px 14px rgba(180,83,9,0.35)",
                }}
              >
                {/* Truck icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
                  <path d="M15 18H9"/>
                  <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
                  <circle cx="17" cy="18" r="2"/>
                  <circle cx="7" cy="18" r="2"/>
                </svg>
              </div>
            </Link>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-max">
              <span className={`text-[10px] font-bold ${pathname === "/dashboard/add-truck" ? "text-amber-500" : "text-on-surface-variant"}`}>
                + Camión
              </span>
            </div>
          </div>

          {/* Intercambios */}
          <Link
            href="/dashboard/swaps"
            className={`flex flex-col items-center justify-center transition-all px-2 py-1 z-10 ${
              pathname === "/dashboard/swaps"
                ? "text-secondary"
                : "text-on-surface-variant hover:text-secondary"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-0.5">
              <path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>
            </svg>
            <span className="font-label-md text-[10px] font-bold">Cambios</span>
          </Link>

        </nav>
      </div>
    </div>
  );
}
