"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, MapPin, CheckCircle, ArrowRight, UserCircle, LogOut, Users } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>("student");
  const [loading, setLoading] = useState(true);
  const [hostedEvents, setHostedEvents] = useState<any[]>([]);
  
  // Student states
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<any[]>([]);
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const fetchStudentData = async (userId: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001";
    
    // Fetch all events
    const allRes = await fetch(`${backendUrl}/api/events`);
    if (allRes.ok) {
      setAllEvents(await allRes.json());
    }

    // Fetch registered events
    const regRes = await fetch(`${backendUrl}/api/events/registered/${userId}`);
    if (regRes.ok) {
      setRegisteredEvents(await regRes.json());
    }
  };

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
        if (profile) {
          setRole(profile.role);
          
          if (profile.role === "admin") {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001";
            const res = await fetch(`${backendUrl}/api/events/hosted/${user.id}`);
            if (res.ok) setHostedEvents(await res.json());
          } else {
            // It's a student
            await fetchStudentData(user.id);
          }
        }
      }
      setLoading(false);
    };
    getUserData();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleRegister = async (eventId: string) => {
    if (!user) return;
    setRegisteringId(eventId);
    
    try {
      // Check if profile is complete
      const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
      if (!profile || !profile.register_number || !profile.year || !profile.department || !profile.college) {
        alert("You must complete your profile (Register Number, Year, Dept, College) before you can register. Click 'Profile' in the header.");
        setRegisteringId(null);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001";
      const res = await fetch(`${backendUrl}/api/events/${eventId}/register`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (res.ok) {
        // Refresh registered events
        await fetchStudentData(user.id);
        alert("Successfully registered!");
      } else {
        const errorData = await res.json();
        if (errorData.error && errorData.error.includes("unique constraint")) {
          alert("You are already registered for this event.");
        } else {
          alert(errorData.error || "Failed to register.");
        }
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    } finally {
      setRegisteringId(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-neon">Loading...</div>;
  }

  // --- ADMIN RENDER ---
  if (role === "admin") {
    const totalRegistrations = hostedEvents.reduce((acc, event) => acc + (event.stats?.totalRegistrations || 0), 0);
    const totalPresent = hostedEvents.reduce((acc, event) => acc + (event.stats?.totalPresent || 0), 0);

    return (
      <div className="min-h-screen p-8 max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-400">Welcome, {user?.email}</p>
          </div>
          <div className="flex gap-4">
            <Link href="/profile" className="btn-outline text-sm">Profile</Link>
            <button onClick={handleSignOut} className="btn-outline text-sm">Sign Out</button>
          </div>
        </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in-up delay-100 opacity-0">
              <div className="glass-card p-6 rounded-3xl group">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2 group-hover:text-accent-green transition-colors">
                  <Calendar size={16} /> Total Events
                </h3>
                <p className="text-4xl md:text-5xl font-extrabold text-white mt-2">{stats.totalEvents}</p>
              </div>
              <div className="glass-card p-6 rounded-3xl group">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2 group-hover:text-accent-green transition-colors">
                  <Users size={16} /> Total Registrations
                </h3>
                <p className="text-4xl md:text-5xl font-extrabold text-white mt-2">{stats.totalRegistrations}</p>
              </div>
              <div className="glass-card p-6 rounded-3xl group">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2 group-hover:text-accent-green transition-colors">
                  <CheckCircle size={16} /> Total Present
                </h3>
                <p className="text-4xl md:text-5xl font-extrabold text-white mt-2">{stats.totalPresent}</p>
              </div>
            </div>

        <div className="glass-card p-8 rounded-3xl w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-neon">Events Hosted by You</h2>
            <Link href="/events/create" className="btn-primary">+ Create Event</Link>
          </div>
          {hostedEvents.length === 0 ? (
            <p className="text-gray-400">You haven't created any events yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="py-3 px-4 font-bold text-gray-300">Event Title</th>
                    <th className="py-3 px-4 font-bold text-gray-300">Status</th>
                    <th className="py-3 px-4 font-bold text-gray-300">Date</th>
                    <th className="py-3 px-4 font-bold text-gray-300">Registrations</th>
                    <th className="py-3 px-4 font-bold text-gray-300">Present</th>
                    <th className="py-3 px-4 font-bold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hostedEvents.map((event) => (
                    <tr key={event.id} className="border-b border-surface-border/50 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-white font-medium">{event.title}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full border ${
                          event.status === 'upcoming' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          event.status === 'ongoing' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                          'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                          {event.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : "Upcoming"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">{new Date(event.start_time).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-gray-400">{event.stats?.totalRegistrations}</td>
                      <td className="py-3 px-4 text-gray-400">{event.stats?.totalPresent}</td>
                      <td className="py-3 px-4">
                        <Link href={`/events/${event.id}`} className="text-accent-green text-sm hover:underline">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- STUDENT RENDER ---
  const registeredEventIds = new Set(registeredEvents.map(e => e?.id));
  const upcomingEvents = allEvents.filter(e => !registeredEventIds.has(e.id));

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto flex flex-col justify-start relative animate-fade-in-up">
      {/* Cinematic background light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-accent-green/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <div className="flex justify-between items-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Dashboard</h1>
        <div className="flex items-center gap-4">
          <Link href="/profile" className="btn-outline flex items-center gap-2 py-2 px-4 text-sm">
            <UserCircle size={16} /> <span className="hidden sm:inline">Profile</span>
          </Link>
          <button onClick={handleSignOut} className="text-gray-400 hover:text-red-400 transition-colors p-2" title="Sign Out">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* My Registrations Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-neon flex items-center gap-2 mb-6">
          <CheckCircle size={24} /> My Registrations ({registeredEvents.length})
        </h2>
        
        {registeredEvents.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center">
            <p className="text-gray-400">You haven't registered for any events yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {registeredEvents.map(event => event && (
              <div key={event.id} className="glass-card p-6 rounded-2xl flex flex-col border border-accent-green/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent-green/20 rounded-full blur-[40px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-white line-clamp-1 flex-1 pr-2">{event.title}</h3>
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border flex-shrink-0 ${
                    event.status === 'upcoming' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                    event.status === 'ongoing' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                    'bg-gray-500/10 text-gray-400 border-gray-500/30'
                  }`}>
                    {event.status || 'Upcoming'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                  <Calendar size={14} /> {new Date(event.start_time).toLocaleString()}
                </div>
                <Link href={`/events/${event.id}`} className="btn-outline text-center text-sm mt-auto flex items-center justify-center gap-2">
                  View Info <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Browse Events Section */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Discover Events</h2>
        
        {upcomingEvents.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center border border-surface-border border-dashed">
            <p className="text-gray-400">No new events available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map(event => (
              <div key={event.id} className="glass-card flex flex-col rounded-2xl overflow-hidden group border border-surface-border hover:border-accent-green transition-all">
                {/* Simulated Poster Image Area */}
                <div className="h-40 w-full bg-gradient-to-br from-surface to-[#111] flex items-center justify-center relative">
                   <Calendar size={48} className="text-surface-border group-hover:text-accent-green/40 transition-colors" />
                   <div className="absolute top-3 right-3 bg-black/60 px-2 py-1 rounded text-[10px] uppercase font-bold text-white backdrop-blur-md border border-white/10">
                     {event.status || 'Upcoming'}
                   </div>
                   <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded text-xs text-white backdrop-blur-md font-medium border border-white/10">
                     {new Date(event.start_time).toLocaleDateString()}
                   </div>
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold text-white mb-2">{event.title}</h3>
                  <p className="text-gray-400 text-sm mb-6 line-clamp-2">
                    {event.description || "Join us for this exciting event!"}
                  </p>
                  
                  <div className="mt-auto grid grid-cols-2 gap-3">
                    <Link href={`/events/${event.id}`} className="btn-outline text-xs text-center py-2 px-0">
                      More Info
                    </Link>
                    <button 
                      onClick={() => handleRegister(event.id)}
                      disabled={registeringId === event.id}
                      className="btn-primary text-xs py-2 px-0"
                    >
                      {registeringId === event.id ? "Working..." : "Register Now"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
