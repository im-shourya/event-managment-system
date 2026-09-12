"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CheckinPage() {
  const { id, registrationId } = useParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"success" | "error" | "unauthorized" | null>(null);
  const [message, setMessage] = useState("");
  const [participant, setParticipant] = useState<any>(null);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const processCheckin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setStatus("unauthorized");
        setMessage("You must be logged in as the event admin to perform check-ins.");
        setLoading(false);
        return;
      }

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001";
        const res = await fetch(`${backendUrl}/api/events/${id}/checkin/${registrationId}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`
          }
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage("Attendance marked successfully!");
          setParticipant(data.participant);
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to mark attendance.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("An unexpected error occurred while checking in.");
      } finally {
        setLoading(false);
      }
    };

    if (id && registrationId) {
      processCheckin();
    }
  }, [id, registrationId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-text-primary">
        <Loader2 className="animate-spin mb-4" size={48} />
        <h2 className="text-xl font-bold">Processing Check-in...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <div className="card p-10 w-full max-w-md text-center border-border">
        
        {status === "success" && (
          <>
            <CheckCircle className="text-accent-green mx-auto mb-6" size={80} />
            <h1 className="text-3xl font-bold text-text-primary mb-2">Checked In!</h1>
            <p className="text-text-secondary mb-6">{message}</p>
            
            {participant && (
              <div className="bg-surface-elevated p-4 rounded-[12px] border border-border mb-8 text-left">
                <p className="text-[12px] text-text-muted mb-1">Participant Name</p>
                <p className="font-bold text-text-primary text-lg">{participant.name || "Unknown"}</p>
                <p className="text-[14px] text-text-secondary mt-2">{participant.email}</p>
              </div>
            )}
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="text-error mx-auto mb-6" size={80} />
            <h1 className="text-3xl font-bold text-text-primary mb-2">Check-in Failed</h1>
            <p className="text-error mb-8">{message}</p>
          </>
        )}

        {status === "unauthorized" && (
          <>
            <XCircle className="text-warning mx-auto mb-6" size={80} />
            <h1 className="text-3xl font-bold text-text-primary mb-2">Unauthorized</h1>
            <p className="text-warning mb-8">{message}</p>
            <Link href="/login" className="btn-primary w-full flex items-center justify-center">Login as Admin</Link>
          </>
        )}

        {status !== "unauthorized" && (
          <Link href={`/events/${id}`} className="btn-outline w-full flex items-center justify-center gap-2">
            <ArrowLeft size={16} /> Return to Event Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
