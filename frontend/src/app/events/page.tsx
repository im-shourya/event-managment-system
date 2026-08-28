"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EventsList() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001";
        const res = await fetch(`${backendUrl}/api/events`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        } else {
          console.error("Failed to fetch events");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold">Upcoming Events</h1>
          <p className="text-gray-400">Discover and register for club events.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/" className="btn-outline text-sm">
            Back to Dashboard
          </Link>
          <Link href="/events/create" className="btn-primary text-sm">
            + Create Event
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="text-neon text-center mt-20">Loading events...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length === 0 ? (
            <p className="text-gray-500 col-span-3 text-center">No events found. Be the first to create one!</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="glass-card p-6 rounded-2xl flex flex-col">
                <h2 className="text-xl font-bold text-neon mb-2">{event.title}</h2>
                <p className="text-gray-400 text-sm mb-4 flex-grow line-clamp-3">
                  {event.description || "No description provided."}
                </p>
                <div className="mt-auto">
                  <div className="text-sm text-gray-500 mb-4">
                    📅 {new Date(event.start_time).toLocaleString()}
                  </div>
                  <Link 
                    href={`/events/${event.id}`}
                    className="btn-outline w-full text-center inline-block block"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
