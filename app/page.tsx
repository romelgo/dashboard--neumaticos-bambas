import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-bambas-red to-bambas-orange flex items-center justify-center text-white font-black text-xl shadow-lg shadow-bambas-red/20 group-hover:scale-105 transition-transform">
                M
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">INNOVA</span>
            </div>
            <nav className="hidden md:flex gap-8">
              <a href="#" className="text-sm font-semibold text-slate-600 hover:text-bambas-red dark:text-slate-300 dark:hover:text-bambas-red transition-colors">Dashboard</a>
              <a href="#" className="text-sm font-semibold text-slate-600 hover:text-bambas-orange dark:text-slate-300 dark:hover:text-bambas-orange transition-colors">Analytics</a>
              <a href="#" className="text-sm font-semibold text-slate-600 hover:text-bambas-green dark:text-slate-300 dark:hover:text-bambas-green transition-colors">Reports</a>
              <a href="#" className="text-sm font-semibold text-slate-600 hover:text-bambas-blue dark:text-slate-300 dark:hover:text-bambas-blue transition-colors">Settings</a>
            </nav>
            <div>
              <button className="px-5 py-2.5 text-sm font-semibold text-white bg-bambas-red hover:bg-red-700 rounded-full transition-all duration-300 hover:shadow-[0_0_15px_rgba(227,0,15,0.4)]">
                Sign In
              </button>
            </div>
          </div>
        </div>
        {/* Subtle color bar at the bottom of the header */}
        <div className="h-[2px] w-full bg-gradient-to-r from-bambas-green via-bambas-blue to-bambas-red opacity-90" />
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full relative">
        {/* Decorative background glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-gradient-to-tr from-bambas-red/15 via-bambas-orange/10 to-bambas-blue/15 blur-[120px] -z-10 rounded-full mix-blend-multiply dark:mix-blend-screen opacity-70"></div>
        
        <div className="text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mb-4">
            <span className="w-2 h-2 rounded-full bg-bambas-green animate-pulse"></span>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">System Online - Operational</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Next Generation <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-bambas-red to-bambas-orange">
              Enterprise Intelligence
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium">
            Empower your operations with advanced analytics and seamless integrations. Built for the modern workforce with precision, security, and scale.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
            <button className="px-8 py-3.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:scale-105 transition-transform duration-300 shadow-xl shadow-slate-900/20 dark:shadow-white/10">
              Get Started
            </button>
            <button className="px-8 py-3.5 rounded-full border border-slate-300 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
              Documentation
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-32 grid md:grid-cols-3 gap-8">
          {[
            { 
              title: "Real-time Processing", 
              desc: "Instantly analyze data streams with high efficiency and robust architecture designed for mining operations.", 
              color: "bg-bambas-green", 
              shadow: "hover:shadow-[0_20px_40px_-15px_rgba(0,140,68,0.3)]",
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )
            },
            { 
              title: "Advanced Analytics", 
              desc: "Gain deeper insights through cutting-edge algorithms predicting maintenance and operational needs.", 
              color: "bg-bambas-blue", 
              shadow: "hover:shadow-[0_20px_40px_-15px_rgba(0,164,228,0.3)]",
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              )
            },
            { 
              title: "Secure Infrastructure", 
              desc: "Enterprise-grade security ensuring your sensitive operational data remains protected at all times.", 
              color: "bg-bambas-orange", 
              shadow: "hover:shadow-[0_20px_40px_-15px_rgba(243,112,33,0.3)]",
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )
            }
          ].map((feature, i) => (
            <div key={i} className={`p-8 rounded-3xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 hover:-translate-y-2 transition-all duration-300 ${feature.shadow} group cursor-pointer`}>
              <div className={`w-14 h-14 rounded-2xl ${feature.color} text-white flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 py-8 text-center text-slate-500 dark:text-slate-400 mt-auto">
        <p className="font-medium">© {new Date().getFullYear()} Innova Solutions. Las Bambas Theme.</p>
      </footer>
    </div>
  );
}
