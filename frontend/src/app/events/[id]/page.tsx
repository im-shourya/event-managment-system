"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Calendar, Clock, Users, CheckCircle, Download, ArrowLeft, Mail, Building, GraduationCap, Hash, BookOpen, AlertTriangle, Send, Edit, MessageSquare, Star, Globe, QrCode, MapPin, Trophy, Monitor, ChevronDown, ChevronUp } from "lucide-react";

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState<{type: "error" | "success" | "warning", text: string} | null>(null);
  
  // Current user state
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [isMarkedPresent, setIsMarkedPresent] = useState(false);
  const [myQrCodeUrl, setMyQrCodeUrl] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Admin specific states
  const [isAdmin, setIsAdmin] = useState(false);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "present">("all");
  const [adminTab, setAdminTab] = useState<"registrations" | "feedback">("registrations");

  // Mass Mail States
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);
  const [mailSubject, setMailSubject] = useState("");
  const [mailBody, setMailBody] = useState("");
  const [mailAudience, setMailAudience] = useState<"all" | "present">("all");
  const [mailIncludeQR, setMailIncludeQR] = useState(false);
  const [sendingMail, setSendingMail] = useState(false);

  // Edit Event States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editPosterFile, setEditPosterFile] = useState<File | null>(null);
  const [editBannerFile, setEditBannerFile] = useState<File | null>(null);

  // Student Feedback States
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);

  // QR Modal States
  const [qrModalData, setQrModalData] = useState<{ registrationId: string } | null>(null);
  const [qrSendEmail, setQrSendEmail] = useState(false);
  const [generatingQr, setGeneratingQr] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001";
        
        // 1. Fetch Event Details
        const res = await fetch(`${backendUrl}/api/events/${id}`);
        if (res.ok) {
          const data = await res.json();
          setEvent(data);
          setEditForm({
            title: data.title,
            description: data.description,
            start_time: data.start_time.slice(0, 16), // datetime-local format
            end_time: data.end_time.slice(0, 16),
            status: data.status,
            team_size: data.team_size || 1,
            external_link: data.external_link || "",
            location: data.location || "",
            event_type: data.event_type || "offline",
            map_url: data.map_url || "",
            prize_pool: data.prize_pool || "",
            faq: data.faq || [],
            notifyParticipants: false
          });
        } else {
          setMessage({ type: "error", text: "Event not found." });
        }

        // 2. Fetch User & Profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
          setUserProfile(profile);

          if (profile?.role === "admin") {
            setIsAdmin(true);
            
            // 3. If admin, fetch all registrations & feedback
            const regRes = await fetch(`${backendUrl}/api/events/${id}/registrations`);
            if (regRes.ok) {
              const regData = await regRes.json();
              setRegistrations(regData);
            }

            const { data: fbData } = await supabase.from('feedback').select('*, users(name)').eq('event_id', id);
            if (fbData) setFeedbacks(fbData);

          } else {
            // 4. If student, check registration and feedback status
            const { data: myReg } = await supabase
              .from("registrations")
              .select("id, attendance_status, qr_code_url")
              .eq("event_id", id)
              .eq("user_id", user.id)
              .single();
            
            if (myReg) {
              setIsAlreadyRegistered(true);
              setIsMarkedPresent(myReg.attendance_status);
              setMyQrCodeUrl(myReg.qr_code_url);
            }

            const { data: myFb } = await supabase
              .from("feedback")
              .select("id")
              .eq("event_id", id)
              .eq("user_id", user.id)
              .single();
            
            if (myFb) setHasSubmittedFeedback(true);
          }
        }
      } catch (err) {
        setMessage({ type: "error", text: "Failed to load event details." });
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEventData();
  }, [id, supabase]);

  const handleRegister = async () => {
    setRegistering(true);
    setMessage(null);

    if (userProfile && (!userProfile.register_number || !userProfile.year || !userProfile.department || !userProfile.college)) {
      setMessage({ type: "warning", text: "You must complete your profile (Register Number, Year, Dept, College) before you can register." });
      setRegistering(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push("/login");
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001";
      const res = await fetch(`${backendUrl}/api/events/${id}/register`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ user_id: session.user.id }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Successfully registered! You will receive a confirmation email shortly." });
        setIsAlreadyRegistered(true);
      } else {
        const errorData = await res.json();
        if (errorData.error && errorData.error.includes("unique constraint")) {
          setMessage({ type: "error", text: "You are already registered for this event." });
          setIsAlreadyRegistered(true);
        } else {
          setMessage({ type: "error", text: errorData.error || "Failed to register." });
        }
      }
    } catch (err) {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setRegistering(false);
    }
  };

  const handleSendMassMail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingMail(true);
    const { data: { session } } = await supabase.auth.getSession();

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001";
      const res = await fetch(`${backendUrl}/api/events/${id}/mass-mail`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          subject: mailSubject,
          body: mailBody,
          target_audience: mailAudience,
          includeQR: mailIncludeQR
        }),
      });

      if (res.ok) {
        alert("Emails sent successfully!");
        setIsMailModalOpen(false);
        setMailSubject("");
        setMailBody("");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to send emails.");
      }
    } catch (error) {
      alert("An unexpected error occurred.");
    } finally {
      setSendingMail(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    try {
      let poster_url = event.poster_url;
      let banner_url = event.banner_url;

      const uploadImage = async (file: File) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error } = await supabase.storage.from('event-images').upload(fileName, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(fileName);
        return publicUrl;
      };

      if (editPosterFile) poster_url = await uploadImage(editPosterFile);
      if (editBannerFile) banner_url = await uploadImage(editBannerFile);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001";
      const res = await fetch(`${backendUrl}/api/events/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          ...editForm,
          poster_url,
          banner_url,
          start_time: new Date(editForm.start_time).toISOString(),
          end_time: new Date(editForm.end_time).toISOString(),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setEvent(updated);
        alert("Event updated successfully.");
        setIsEditModalOpen(false);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update event.");
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase.from('feedback').insert({
        event_id: id,
        user_id: user.id,
        rating: feedbackRating,
        comments: feedbackComments
      });

      if (!error) {
        setHasSubmittedFeedback(true);
      } else {
        alert(error.message);
      }
    }
    setSubmittingFeedback(false);
  };

  const handleGenerateQRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrModalData) return;
    setGeneratingQr(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001";
    
    try {
      if (qrModalData.registrationId === 'ALL') {
        const res = await fetch(`${backendUrl}/api/events/${id}/registrations/generate-all-qrs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ sendEmail: qrSendEmail })
        });
        
        if (res.ok) {
          const data = await res.json();
          // Refresh local registrations
          const regRes = await supabase
            .from('registrations')
            .select(`
              id,
              attendance_status,
              registered_at,
              qr_code_url,
              users ( id, email, name, register_number, year, department, college )
            `)
            .eq('event_id', id);
          if (regRes.data) setRegistrations(regRes.data);
          
          alert(data.message || "Bulk QR generated successfully.");
          setQrModalData(null);
        } else {
          const err = await res.json();
          alert(err.error || "Failed to generate QRs.");
        }
      } else {
        const res = await fetch(`${backendUrl}/api/events/${id}/registrations/${qrModalData.registrationId}/generate-qr`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ sendEmail: qrSendEmail })
        });

        if (res.ok) {
          const data = await res.json();
          // Update local registrations state
          setRegistrations(prev => prev.map(reg => reg.id === qrModalData.registrationId ? { ...reg, qr_code_url: data.qrCodeUrl } : reg));
          alert("QR generated successfully.");
          setQrModalData(null);
        } else {
          const err = await res.json();
          alert(err.error || "Failed to generate QR.");
        }
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    } finally {
      setGeneratingQr(false);
    }
  };

  const filteredRegistrations = filter === "all" ? registrations : registrations.filter(r => r.attendance_status === true);

  const downloadCSV = () => {
    const headers = ["Name", "Email", "Reg Number", "Year", "Dept", "College", "Status", "Registered At"];
    const rows = filteredRegistrations.map(reg => [
      reg.users?.name || "Unknown",
      reg.users?.email || "Unknown",
      reg.users?.register_number || "-",
      reg.users?.year || "-",
      reg.users?.department || "-",
      reg.users?.college || "-",
      reg.attendance_status ? "Present" : "Registered",
      new Date(reg.registered_at).toLocaleString()
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(field => `"${field}"`).join(",")) // Escaped commas
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `event_${id}_${filter}_list.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-neon">Loading event...</div>;
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Event not found</h1>
        <Link href="/events" className="btn-outline">Back to Events</Link>
      </div>
    );
  }

  const totalRegistrations = registrations.length;
  const totalPresent = registrations.filter(r => r.attendance_status === true).length;
  const averageRating = feedbacks.length > 0 
    ? (feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / feedbacks.length).toFixed(1) 
    : 0;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto flex flex-col justify-start relative animate-fade-in-up">
      {/* Cinematic background light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[300px] bg-accent-green/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <div className="mb-8 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-accent-green transition-colors w-fit">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        {isAdmin && (
          <button onClick={() => setIsEditModalOpen(true)} className="btn-outline flex items-center gap-2 text-sm py-2 px-4">
            <Edit size={16} /> Edit Event
          </button>
        )}
      </div>

      <div className="glass-card p-8 rounded-3xl w-full relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-green/10 rounded-full blur-[80px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
        
        {event.banner_url && (
          <img src={event.banner_url} alt="Event Banner" className="w-full h-48 md:h-64 object-cover rounded-2xl mb-8 border border-surface-border shadow-lg" />
        )}
        
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
          {event.poster_url && (
            <img src={event.poster_url} alt="Event Poster" className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-2xl border border-surface-border shadow-md" />
          )}
          <div>
            <h1 className="text-4xl font-extrabold text-neon mb-2">{event.title}</h1>
            <div className="flex gap-3 flex-wrap">
              <span className={`text-xs uppercase font-bold px-3 py-1 rounded-full border w-fit inline-block ${
                event.status === 'upcoming' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                event.status === 'ongoing' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                'bg-gray-500/10 text-gray-400 border-gray-500/30'
              }`}>
                {event.status}
              </span>
              {event.prize_pool && (
                <span className="text-xs uppercase font-bold px-3 py-1 rounded-full border border-yellow-500/50 bg-yellow-500/20 text-yellow-300 flex items-center gap-1 shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                  <Trophy size={14} /> {event.prize_pool}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-8 text-sm text-gray-300 mb-8 pb-8 border-b border-surface-border flex-wrap">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-surface rounded-lg text-accent-green border border-surface-border">
              <Calendar size={20} />
            </div>
            <div>
              <p className="font-bold text-white mb-1">Starts</p>
              <p>{new Date(event.start_time).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-surface rounded-lg text-accent-green border border-surface-border">
              <Clock size={20} />
            </div>
            <div>
              <p className="font-bold text-white mb-1">Ends</p>
              <p>{new Date(event.end_time).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-surface rounded-lg text-accent-green border border-surface-border">
              {event.event_type === 'online' ? <Monitor size={20} /> : <Building size={20} />}
            </div>
            <div>
              <p className="font-bold text-white mb-1">Type</p>
              <p className="capitalize">{event.event_type || 'Offline'}</p>
            </div>
          </div>
          {event.location && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-surface rounded-lg text-accent-green border border-surface-border">
                <MapPin size={20} />
              </div>
              <div>
                <p className="font-bold text-white mb-1">Location</p>
                <p>{event.location}</p>
              </div>
            </div>
          )}
          {event.team_size > 1 && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-surface rounded-lg text-accent-green border border-surface-border">
                <Users size={20} />
              </div>
              <div>
                <p className="font-bold text-white mb-1">Team Size</p>
                <p>{event.team_size} members</p>
              </div>
            </div>
          )}
          {event.external_link && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-surface rounded-lg text-accent-green border border-surface-border">
                <Globe size={20} />
              </div>
              <div>
                <p className="font-bold text-white mb-1">Link</p>
                <a href={event.external_link} target="_blank" rel="noreferrer" className="text-accent-green hover:underline break-all line-clamp-1">{event.external_link}</a>
              </div>
            </div>
          )}
        </div>

        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4 text-white">About this event</h2>
          <p className="text-gray-400 whitespace-pre-wrap leading-relaxed">
            {event.description || "No description provided."}
          </p>
        </div>

        {event.map_url && (
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4 text-white">Location Map</h2>
            <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-surface-border shadow-md">
              <iframe 
                src={event.map_url} 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        )}

        {event.faq && event.faq.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4 text-white">Frequently Asked Questions</h2>
            <div className="flex flex-col gap-3">
              {event.faq.map((f: any, idx: number) => (
                <div key={idx} className="bg-surface/30 border border-surface-border rounded-xl overflow-hidden transition-all duration-300">
                  <button 
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="w-full flex justify-between items-center p-4 text-left font-bold text-white hover:bg-surface/50 transition-colors"
                  >
                    {f.question}
                    {openFaqIndex === idx ? <ChevronUp size={20} className="text-accent-green flex-shrink-0" /> : <ChevronDown size={20} className="text-gray-500 flex-shrink-0" />}
                  </button>
                  <div className={`px-4 overflow-hidden transition-all duration-300 ease-in-out ${openFaqIndex === idx ? 'max-h-96 pb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <p className="text-gray-400 text-sm border-t border-surface-border/50 pt-3">{f.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hide Register button if user is Admin */}
        {!isAdmin && (
          <>
            {message && (
              <div className={`p-4 rounded-lg mb-6 text-sm flex items-center justify-between ${
                message.type === 'error' ? 'bg-red-500/20 text-red-200 border border-red-500' : 
                message.type === 'warning' ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500' :
                'bg-green-500/20 text-green-200 border border-green-500'
              }`}>
                <div className="flex items-center gap-2">
                  {message.type === 'warning' && <AlertTriangle size={18} />}
                  {message.text}
                </div>
                {message.type === 'warning' && (
                  <Link href="/profile" className="px-3 py-1 bg-yellow-500/30 rounded text-yellow-200 font-bold ml-4 whitespace-nowrap border border-yellow-500/50 hover:bg-yellow-500/50 transition-colors">
                    Complete Profile
                  </Link>
                )}
              </div>
            )}
            
            <button 
              onClick={handleRegister} 
              disabled={registering || isAlreadyRegistered || event.status === 'completed'}
              className="btn-primary w-full md:w-auto text-lg px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {registering ? "Registering..." : (isAlreadyRegistered ? <><CheckCircle size={20}/> Registered</> : (event.status === 'completed' ? "Registration Closed" : "Register Now"))}
            </button>

            {isAlreadyRegistered && myQrCodeUrl && (
              <div className="mt-8 p-6 bg-surface border border-surface-border rounded-2xl flex flex-col items-center text-center w-full max-w-sm mx-auto shadow-[0_0_20px_rgba(0,230,118,0.1)]">
                <h3 className="text-lg font-bold text-white mb-2">Your Check-In QR Pass</h3>
                <p className="text-gray-400 text-sm mb-4">Show this code at the event entrance.</p>
                <div className="bg-white p-2 rounded-xl">
                  <img src={myQrCodeUrl} alt="Check-In QR" className="w-48 h-48" />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* STUDENT FEEDBACK SECTION */}
      {!isAdmin && isMarkedPresent && event.status === 'completed' && (
        <div className="glass-card p-8 rounded-3xl w-full border border-surface-border relative mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
            <Star size={24} className="text-accent-green" /> Event Feedback
          </h2>
          {hasSubmittedFeedback ? (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-lg flex items-center gap-2">
              <CheckCircle size={20} /> Thank you for your feedback!
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="mt-6 flex flex-col gap-4">
              <p className="text-gray-400 text-sm">We'd love to hear your thoughts on this event.</p>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Rating (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className={`p-2 rounded-lg transition-colors ${feedbackRating >= star ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                      <Star size={32} fill={feedbackRating >= star ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Comments</label>
                <textarea
                  className="premium-input min-h-[100px]"
                  value={feedbackComments}
                  onChange={(e) => setFeedbackComments(e.target.value)}
                  placeholder="What did you like? What could be improved?"
                />
              </div>
              <button type="submit" className="btn-primary w-fit" disabled={submittingFeedback}>
                {submittingFeedback ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ADMIN DASHBOARD */}
      {isAdmin && (
        <div className="w-full mb-12">
          
          {/* Admin Tabs */}
          <div className="flex gap-4 border-b border-surface-border mb-6">
            <button 
              onClick={() => setAdminTab("registrations")}
              className={`pb-4 px-2 font-bold transition-colors ${adminTab === 'registrations' ? 'text-accent-green border-b-2 border-accent-green' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Registrations
            </button>
            <button 
              onClick={() => setAdminTab("feedback")}
              className={`pb-4 px-2 font-bold transition-colors flex items-center gap-2 ${adminTab === 'feedback' ? 'text-accent-green border-b-2 border-accent-green' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Feedback <span className="bg-surface px-2 py-0.5 rounded-full text-xs">{feedbacks.length}</span>
            </button>
          </div>

          {adminTab === "registrations" ? (
            <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Users size={28} className="text-accent-green" /> Analytics
                </h2>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsMailModalOpen(true)}
                    className="btn-primary text-sm flex items-center gap-2 py-2 px-4 bg-accent-green text-black hover:bg-accent-green/90"
                  >
                    <Mail size={16} /> Send Mass Email
                  </button>
                  <button 
                    onClick={() => setQrModalData({ registrationId: 'ALL' })}
                    className="btn-outline text-sm flex items-center gap-2 py-2 px-4 border-accent-green text-accent-green hover:bg-accent-green hover:text-black"
                  >
                    <QrCode size={16} /> Generate All QRs
                  </button>
                  <button 
                    onClick={downloadCSV}
                    className="btn-outline text-sm flex items-center gap-2 py-2 px-4"
                  >
                    <Download size={16} /> Download {filter === "all" ? "All" : "Present"} (CSV)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div 
                  onClick={() => setFilter("all")}
                  className={`glass-card p-6 rounded-2xl cursor-pointer border-2 transition-all group ${filter === 'all' ? 'border-accent-green shadow-[0_0_15px_rgba(0,230,118,0.2)]' : 'border-transparent hover:border-surface-border'}`}
                >
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-gray-300 group-hover:text-white transition-colors">
                    <Users size={18} className={filter === 'all' ? 'text-accent-green' : ''} /> 
                    Total Registrations
                  </h3>
                  <p className="text-5xl font-extrabold text-white mt-4">{totalRegistrations}</p>
                </div>
                
                <div 
                  onClick={() => setFilter("present")}
                  className={`glass-card p-6 rounded-2xl cursor-pointer border-2 transition-all group ${filter === 'present' ? 'border-accent-green shadow-[0_0_15px_rgba(0,230,118,0.2)]' : 'border-transparent hover:border-surface-border'}`}
                >
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-gray-300 group-hover:text-white transition-colors">
                    <CheckCircle size={18} className={filter === 'present' ? 'text-accent-green' : ''} /> 
                    Total Present
                  </h3>
                  <p className="text-5xl font-extrabold text-white mt-4">{totalPresent}</p>
                </div>
              </div>
              
              <div className="glass-card p-8 rounded-3xl w-full border border-surface-border relative">
                <h3 className="text-xl font-bold text-white mb-6">
                  {filter === "all" ? "All Registered Participants" : "Attendees Marked Present"}
                </h3>

                {filteredRegistrations.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-surface-border rounded-xl">
                    <Users size={48} className="text-gray-600 mb-4" />
                    <p className="text-gray-400 text-lg">No participants found in this category.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-surface-border">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface/50 border-b border-surface-border">
                          <th className="py-4 px-6 font-bold text-gray-300">Participant</th>
                          <th className="py-4 px-6 font-bold text-gray-300">Details</th>
                          <th className="py-4 px-6 font-bold text-gray-300">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRegistrations.map((reg) => (
                          <tr key={reg.id} className="border-b border-surface-border/50 hover:bg-white/5 transition-colors">
                            <td className="py-4 px-6 text-white font-medium">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-accent-green/20 text-accent-green flex items-center justify-center font-bold text-sm uppercase flex-shrink-0">
                                  {(reg.users?.name || "U").charAt(0)}
                                </div>
                                <div>
                                  <p>{reg.users?.name || "Unknown"}</p>
                                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                    <Mail size={12} /> {reg.users?.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-gray-400 text-sm">
                              <div className="flex flex-col gap-1">
                                <span className="flex items-center gap-2" title="Register Number"><Hash size={14} className="text-gray-500"/> {reg.users?.register_number || "-"}</span>
                                <span className="flex items-center gap-2" title="Year & Dept"><BookOpen size={14} className="text-gray-500"/> {reg.users?.year || "-"} • {reg.users?.department || "-"}</span>
                                <span className="flex items-center gap-2" title="College"><Building size={14} className="text-gray-500"/> {reg.users?.college || "-"}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col gap-2 items-start">
                                {reg.attendance_status ? (
                                  <span className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-green-500/10 text-accent-green border border-green-500/20 rounded-full">
                                    <CheckCircle size={12} /> Present
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-gray-500/10 text-gray-300 border border-gray-500/20 rounded-full">
                                    <Clock size={12} /> Registered
                                  </span>
                                )}
                                <span className="text-xs text-gray-600 ml-1">{new Date(reg.registered_at).toLocaleDateString()}</span>
                                {!reg.qr_code_url && (
                                  <button 
                                    onClick={() => setQrModalData({ registrationId: reg.id })}
                                    className="text-xs text-accent-green hover:underline mt-1 font-bold flex items-center gap-1 bg-surface px-2 py-1 rounded border border-surface-border"
                                  >
                                    <QrCode size={12} /> Generate QR
                                  </button>
                                )}
                                {reg.qr_code_url && (
                                  <span className="text-xs text-blue-400 mt-1 font-bold flex items-center gap-1">
                                    <CheckCircle size={12} /> QR Ready
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="glass-card p-8 rounded-3xl w-full border border-surface-border">
              <div className="flex items-center justify-between mb-8 pb-8 border-b border-surface-border">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Participant Feedback</h3>
                  <p className="text-gray-400 text-sm">Reviews from students who attended the event.</p>
                </div>
                <div className="text-center bg-surface p-4 rounded-2xl border border-surface-border min-w-[120px]">
                  <p className="text-gray-400 text-xs uppercase font-bold mb-1">Average Rating</p>
                  <p className="text-4xl font-extrabold text-yellow-400 flex items-center justify-center gap-1">
                    {averageRating} <Star size={24} fill="currentColor" />
                  </p>
                </div>
              </div>

              {feedbacks.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-surface-border rounded-xl">
                  <MessageSquare size={48} className="text-gray-600 mb-4" />
                  <p className="text-gray-400 text-lg">No feedback received yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {feedbacks.map(fb => (
                    <div key={fb.id} className="bg-surface/50 p-6 rounded-2xl border border-surface-border">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-white font-bold">{fb.users?.name || "Anonymous"}</p>
                          <p className="text-xs text-gray-500">{new Date(fb.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} fill={i < fb.rating ? "currentColor" : "none"} className={i < fb.rating ? "" : "text-gray-600"} />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm italic">"{fb.comments || "No written comments."}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Event Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-8 rounded-3xl w-full max-w-2xl border border-surface-border max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-neon flex items-center gap-2">
                <Edit size={24} /> Edit Event
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Event Title</label>
                <input
                  type="text"
                  className="w-full bg-surface border border-surface-border rounded-lg p-3 text-white focus:outline-none focus:border-accent-green transition-colors"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                <select
                  className="w-full bg-surface border border-surface-border rounded-lg p-3 text-white focus:outline-none focus:border-accent-green transition-colors"
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  required
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-surface border border-surface-border rounded-lg p-3 text-white focus:outline-none focus:border-accent-green transition-colors"
                    value={editForm.start_time}
                    onChange={(e) => setEditForm({...editForm, start_time: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-surface border border-surface-border rounded-lg p-3 text-white focus:outline-none focus:border-accent-green transition-colors"
                    value={editForm.end_time}
                    onChange={(e) => setEditForm({...editForm, end_time: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <textarea
                  className="w-full bg-surface border border-surface-border rounded-lg p-3 text-white focus:outline-none focus:border-accent-green transition-colors min-h-[120px]"
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Event Type</label>
                  <select
                    className="w-full bg-surface border border-surface-border rounded-lg p-3 text-white focus:outline-none focus:border-accent-green transition-colors"
                    value={editForm.event_type}
                    onChange={(e) => setEditForm({...editForm, event_type: e.target.value})}
                  >
                    <option value="offline">Offline / In-Person</option>
                    <option value="online">Online / Virtual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Location / Platform</label>
                  <input
                    type="text"
                    className="w-full bg-surface border border-surface-border rounded-lg p-3 text-white focus:outline-none focus:border-accent-green transition-colors"
                    value={editForm.location}
                    onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                  />
                </div>
              </div>
              
              {editForm.event_type === 'offline' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Map Embed URL (Optional)</label>
                  <input
                    type="url"
                    className="w-full bg-surface border border-surface-border rounded-lg p-3 text-white focus:outline-none focus:border-accent-green transition-colors"
                    value={editForm.map_url}
                    onChange={(e) => setEditForm({...editForm, map_url: e.target.value})}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Team Size</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-surface border border-surface-border rounded-lg p-3 text-white focus:outline-none focus:border-accent-green transition-colors"
                    value={editForm.team_size}
                    onChange={(e) => setEditForm({...editForm, team_size: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Prize Pool</label>
                  <input
                    type="text"
                    className="w-full bg-surface border border-surface-border rounded-lg p-3 text-white focus:outline-none focus:border-accent-green transition-colors"
                    value={editForm.prize_pool}
                    onChange={(e) => setEditForm({...editForm, prize_pool: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">External Link</label>
                  <input
                    type="url"
                    className="w-full bg-surface border border-surface-border rounded-lg p-3 text-white focus:outline-none focus:border-accent-green transition-colors"
                    value={editForm.external_link}
                    onChange={(e) => setEditForm({...editForm, external_link: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">New Poster Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full bg-surface border border-surface-border rounded-lg p-2 text-white focus:outline-none focus:border-accent-green transition-colors text-sm"
                    onChange={(e) => setEditPosterFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">New Banner Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full bg-surface border border-surface-border rounded-lg p-2 text-white focus:outline-none focus:border-accent-green transition-colors text-sm"
                    onChange={(e) => setEditBannerFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 mt-4">
                  <label className="block text-sm font-medium text-gray-400">FAQs</label>
                  <button type="button" onClick={() => setEditForm({...editForm, faq: [...(editForm.faq || []), { question: "", answer: "" }]})} className="text-xs text-accent-green border border-accent-green rounded px-2 py-1 hover:bg-accent-green hover:text-black transition-colors">
                    + Add FAQ
                  </button>
                </div>
                {(!editForm.faq || editForm.faq.length === 0) && <p className="text-sm text-gray-500 mb-4">No FAQs added.</p>}
                {editForm.faq && editForm.faq.map((f: any, index: number) => (
                  <div key={index} className="flex flex-col gap-2 p-4 mb-3 border border-surface-border rounded-lg bg-surface/50">
                    <input
                      type="text"
                      placeholder="Question"
                      className="w-full bg-surface border border-surface-border rounded-lg p-2 text-white focus:outline-none text-sm"
                      value={f.question}
                      onChange={(e) => {
                        const newFaq = [...editForm.faq];
                        newFaq[index].question = e.target.value;
                        setEditForm({...editForm, faq: newFaq});
                      }}
                      required
                    />
                    <textarea
                      placeholder="Answer"
                      className="w-full bg-surface border border-surface-border rounded-lg p-2 text-white focus:outline-none text-sm min-h-[60px]"
                      value={f.answer}
                      onChange={(e) => {
                        const newFaq = [...editForm.faq];
                        newFaq[index].answer = e.target.value;
                        setEditForm({...editForm, faq: newFaq});
                      }}
                      required
                    />
                    <button type="button" onClick={() => {
                      const newFaq = editForm.faq.filter((_: any, i: number) => i !== index);
                      setEditForm({...editForm, faq: newFaq});
                    }} className="text-red-400 text-xs self-end hover:underline">
                      Remove FAQ
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 bg-surface p-3 rounded-lg border border-surface-border mt-2">
                <input 
                  type="checkbox" 
                  id="notifyParticipants" 
                  checked={editForm.notifyParticipants}
                  onChange={(e) => setEditForm({...editForm, notifyParticipants: e.target.checked})}
                  className="w-4 h-4 accent-accent-green cursor-pointer"
                />
                <label htmlFor="notifyParticipants" className="text-white text-sm cursor-pointer select-none">
                  Notify all registered participants of these changes via Email
                </label>
              </div>

              <div className="flex gap-4 mt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-outline flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={savingEdit} className="btn-primary flex-1">
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mass Mail Modal */}
      {isMailModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-8 rounded-3xl w-full max-w-lg border border-surface-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-neon flex items-center gap-2">
                <Send size={24} /> Send Mass Email
              </h2>
              <button onClick={() => setIsMailModalOpen(false)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSendMassMail} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">To Audience:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input 
                      type="radio" 
                      name="audience" 
                      value="all" 
                      checked={mailAudience === 'all'} 
                      onChange={() => setMailAudience('all')}
                      className="accent-accent-green"
                    />
                    All Registered
                  </label>
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input 
                      type="radio" 
                      name="audience" 
                      value="present" 
                      checked={mailAudience === 'present'} 
                      onChange={() => setMailAudience('present')}
                      className="accent-accent-green"
                    />
                    Only Present
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
                <input
                  type="text"
                  className="w-full bg-surface border border-surface-border rounded-lg p-3 text-white focus:outline-none focus:border-accent-green transition-colors"
                  value={mailSubject}
                  onChange={(e) => setMailSubject(e.target.value)}
                  placeholder="e.g. Event Update!"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Message Body</label>
                <textarea
                  className="w-full bg-surface border border-surface-border rounded-lg p-3 text-white focus:outline-none focus:border-accent-green transition-colors min-h-[150px]"
                  value={mailBody}
                  onChange={(e) => setMailBody(e.target.value)}
                  placeholder="Type your message here..."
                  required
                />
              </div>

              <div className="flex items-center gap-3 bg-surface p-3 rounded-lg border border-surface-border mt-2">
                <input 
                  type="checkbox" 
                  id="includeQr" 
                  checked={mailIncludeQR}
                  onChange={(e) => setMailIncludeQR(e.target.checked)}
                  className="w-4 h-4 accent-accent-green cursor-pointer"
                />
                <label htmlFor="includeQr" className="text-white text-sm cursor-pointer select-none">
                  Include Unique QR Code Pass for Check-in
                </label>
              </div>

              <div className="flex gap-4 mt-2">
                <button type="button" onClick={() => setIsMailModalOpen(false)} className="btn-outline flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={sendingMail} className="btn-primary flex-1 flex justify-center items-center gap-2">
                  {sendingMail ? "Sending..." : <><Send size={18}/> Send Mail</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate QR Modal */}
      {qrModalData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-8 rounded-3xl w-full max-w-sm border border-surface-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-neon flex items-center gap-2">
                <QrCode size={20} /> {qrModalData.registrationId === 'ALL' ? 'Generate All QRs' : 'Generate QR'}
              </h2>
              <button onClick={() => setQrModalData(null)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleGenerateQRSubmit} className="flex flex-col gap-5">
              <div className="flex items-center gap-3 bg-surface p-3 rounded-lg border border-surface-border mt-2">
                <input 
                  type="checkbox" 
                  id="sendEmailCheck" 
                  checked={qrSendEmail}
                  onChange={(e) => setQrSendEmail(e.target.checked)}
                  className="w-4 h-4 accent-accent-green cursor-pointer"
                />
                <label htmlFor="sendEmailCheck" className="text-white text-sm cursor-pointer select-none">
                  Email QR code to participant
                </label>
              </div>
              <p className="text-xs text-gray-400">If unchecked, the QR code will only be updated in their registration portal.</p>

              <div className="flex gap-4 mt-2">
                <button type="button" onClick={() => setQrModalData(null)} className="btn-outline flex-1 text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={generatingQr} className="btn-primary flex-1 text-sm">
                  {generatingQr ? "Generating..." : "Generate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
