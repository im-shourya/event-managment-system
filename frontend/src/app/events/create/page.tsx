"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function CreateEvent() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [teamSize, setTeamSize] = useState(1);
  const [externalLink, setExternalLink] = useState("");
  
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUserAndRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      
      const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
      
      if (profile?.role !== "admin") {
        router.push("/dashboard"); // Redirect if not admin
      } else {
        setUser(user);
      }
    };
    getUserAndRole();
  }, [router, supabase]);

  const handleAddFaq = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };

  const handleUpdateFaq = (index: number, field: "question" | "answer", value: string) => {
    const newFaqs = [...faqs];
    newFaqs[index][field] = value;
    setFaqs(newFaqs);
  };

  const handleRemoveFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('event-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('event-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!user) {
      setError("You must be logged in as an admin to create an event.");
      setLoading(false);
      return;
    }

    try {
      let poster_url = null;
      let banner_url = null;

      if (posterFile) poster_url = await uploadImage(posterFile);
      if (bannerFile) banner_url = await uploadImage(bannerFile);

      const { data: { session } } = await supabase.auth.getSession();
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001";
      const res = await fetch(`${backendUrl}/api/events`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          title,
          description,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
          created_by: user.id,
          team_size: teamSize,
          external_link: externalLink,
          poster_url,
          banner_url,
          faq: faqs
        }),
      });

      if (res.ok) {
        router.push("/events");
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to create event.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-neon">Checking permissions...</div>;
  }

  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto flex flex-col justify-center my-12">
      <div className="mb-8">
        <Link href="/events" className="text-gray-400 hover:text-accent-green transition-colors">
          &larr; Back to Events
        </Link>
      </div>

      <div className="glass-card p-8 rounded-3xl w-full">
        <h1 className="text-3xl font-bold mb-8">Create New Event</h1>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Event Title</label>
            <input
              type="text"
              className="w-full bg-surface border border-surface-border rounded-lg p-3 text-white focus:outline-none focus:border-accent-green transition-colors"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
            <textarea
              className="w-full bg-surface border border-surface-border rounded-lg p-3 text-white focus:outline-none focus:border-accent-green transition-colors min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Start Time</label>
              <input
                type="datetime-local"
                className="w-full bg-surface border border-surface-border rounded-lg p-3 text-white focus:outline-none focus:border-accent-green transition-colors"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">End Time</label>
              <input
                type="datetime-local"
                className="w-full bg-surface border border-surface-border rounded-lg p-3 text-white focus:outline-none focus:border-accent-green transition-colors"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Team Size</label>
              <input
                type="number"
                min="1"
                className="w-full bg-surface border border-surface-border rounded-lg p-3 text-white focus:outline-none focus:border-accent-green transition-colors"
                value={teamSize}
                onChange={(e) => setTeamSize(parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">External Link (Optional)</label>
              <input
                type="url"
                className="w-full bg-surface border border-surface-border rounded-lg p-3 text-white focus:outline-none focus:border-accent-green transition-colors"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Poster Image</label>
              <input
                type="file"
                accept="image/*"
                className="w-full bg-surface border border-surface-border rounded-lg p-3 text-white focus:outline-none focus:border-accent-green transition-colors"
                onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Banner Image</label>
              <input
                type="file"
                accept="image/*"
                className="w-full bg-surface border border-surface-border rounded-lg p-3 text-white focus:outline-none focus:border-accent-green transition-colors"
                onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-400">FAQs</label>
              <button type="button" onClick={handleAddFaq} className="text-xs text-accent-green border border-accent-green rounded px-2 py-1">
                + Add FAQ
              </button>
            </div>
            {faqs.map((faq, index) => (
              <div key={index} className="flex flex-col gap-2 mb-4 p-4 border border-surface-border rounded-lg bg-surface/50">
                <input
                  type="text"
                  placeholder="Question"
                  className="w-full bg-surface border border-surface-border rounded-lg p-2 text-white focus:outline-none text-sm"
                  value={faq.question}
                  onChange={(e) => handleUpdateFaq(index, "question", e.target.value)}
                  required
                />
                <textarea
                  placeholder="Answer"
                  className="w-full bg-surface border border-surface-border rounded-lg p-2 text-white focus:outline-none text-sm min-h-[60px]"
                  value={faq.answer}
                  onChange={(e) => handleUpdateFaq(index, "answer", e.target.value)}
                  required
                />
                <button type="button" onClick={() => handleRemoveFaq(index)} className="text-red-400 text-xs self-end">
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button type="submit" className="btn-primary w-full mt-6" disabled={loading}>
            {loading ? "Creating Event..." : "Create Event"}
          </button>
        </form>
      </div>
    </div>
  );
}
