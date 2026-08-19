import Link from "next/link";
import { QrCode, Award, Bell, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#030303]">
      
      {/* Background ambient glow - Cinematic */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-accent-green/10 rounded-full blur-[150px] -z-10 opacity-70"></div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] -z-10"></div>

      <main className="flex flex-col items-center text-center px-4 max-w-5xl w-full z-10 pt-20">
        
        {/* Badge */}
        <div className="animate-fade-in-up opacity-0 flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent-green/30 bg-accent-green/5 text-accent-green text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></span>
          The New Standard for Event Management
        </div>

        {/* Hero Title */}
        <h1 className="animate-fade-in-up delay-100 opacity-0 text-6xl md:text-8xl font-extrabold tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 pb-2">
          Manage Events <br />
          <span className="text-neon-accent bg-none text-accent-green">Seamlessly.</span>
        </h1>
        
        {/* Hero Subtitle */}
        <p className="animate-fade-in-up delay-200 opacity-0 text-lg md:text-xl text-gray-400 mb-10 max-w-2xl font-light leading-relaxed">
          The ultimate platform for student clubs to craft events, manage registrations, track attendance via QR, and collect feedback—all in one place.
        </p>

        {/* CTA Buttons */}
        <div className="animate-fade-in-up delay-300 opacity-0 flex flex-col sm:flex-row gap-5 mb-24">
          <Link href="/dashboard" className="btn-primary group text-lg px-8 py-4">
            Go to Dashboard 
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/events" className="btn-outline text-lg px-8 py-4">
            Browse Events
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left animate-fade-in-up delay-300 opacity-0">
          
          <div className="glass-card p-8 rounded-3xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-green/10 rounded-full blur-[40px] -z-10 group-hover:bg-accent-green/20 transition-colors duration-500"></div>
            <div className="w-14 h-14 bg-surface border border-surface-border rounded-2xl flex items-center justify-center mb-6 text-accent-green shadow-[0_0_15px_rgba(0,230,118,0.1)] group-hover:scale-110 transition-transform duration-500">
              <QrCode size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white group-hover:text-accent-green transition-colors">QR Attendance</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Lightning fast check-ins with uniquely generated cryptographic QR codes for every single participant.</p>
          </div>
          
          <div className="glass-card p-8 rounded-3xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-green/10 rounded-full blur-[40px] -z-10 group-hover:bg-accent-green/20 transition-colors duration-500"></div>
            <div className="w-14 h-14 bg-surface border border-surface-border rounded-2xl flex items-center justify-center mb-6 text-accent-green shadow-[0_0_15px_rgba(0,230,118,0.1)] group-hover:scale-110 transition-transform duration-500">
              <Award size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white group-hover:text-accent-green transition-colors">Premium Analytics</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Export beautiful CSV reports, track exactly who showed up, and view real-time feedback ratings.</p>
          </div>

          <div className="glass-card p-8 rounded-3xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-green/10 rounded-full blur-[40px] -z-10 group-hover:bg-accent-green/20 transition-colors duration-500"></div>
            <div className="w-14 h-14 bg-surface border border-surface-border rounded-2xl flex items-center justify-center mb-6 text-accent-green shadow-[0_0_15px_rgba(0,230,118,0.1)] group-hover:scale-110 transition-transform duration-500">
              <Bell size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white group-hover:text-accent-green transition-colors">Smart Notifications</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Keep everyone in the loop with automated email blasts and instant schedule updates.</p>
          </div>

        </div>
      </main>

      <footer className="absolute bottom-6 text-sm text-gray-600 font-medium tracking-wide">
        © 2026 Club Event Manager. All rights reserved.
      </footer>
    </div>
  );
}
