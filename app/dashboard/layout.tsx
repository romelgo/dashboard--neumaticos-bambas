import { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen flex flex-col relative">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
      />
      <Header />
      
      <main className="pt-24 pb-32 flex-1 w-full px-4 sm:px-6 md:px-8">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
