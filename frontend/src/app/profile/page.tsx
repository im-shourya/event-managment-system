"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, User, Hash, GraduationCap, Building, BookOpen } from "lucide-react";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: "error" | "success", text: string} | null>(null);
  const [user, setUser] = useState<any>(null);

  const [name, setName] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [year, setYear] = useState("");
  const [department, setDepartment] = useState("");
  const [college, setCollege] = useState("");

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
      if (profile) {
        setName(profile.name || "");
        setRegisterNumber(profile.register_number || "");
        setYear(profile.year || "");
        setDepartment(profile.department || "");
        setCollege(profile.college || "");
      }
      setLoading(false);
    };
    fetchProfile();
  }, [router, supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (!user) return;

    try {
      // The users table has RLS allowing update if auth.uid() = id
      const { error } = await supabase
        .from("users")
        .update({
          name,
          register_number: registerNumber,
          year,
          department,
          college
        })
        .eq("id", user.id);

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({ type: "success", text: "Profile updated successfully!" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-text-primary">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen p-8 max-w-2xl mx-auto flex flex-col justify-start">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2 text-text-muted hover:text-accent-green transition-colors w-fit">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      <div className="card p-8 w-full border border-border">
        <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <User size={28} /> My Profile
        </h1>
        <p className="text-text-secondary text-[14px] mb-8 pb-6 border-b border-border">
          Complete your profile to register for events. All fields are required.
        </p>

        {message && (
          <div className={`p-4 rounded-[8px] mb-6 text-[14px] ${message.type === 'error' ? 'bg-error/10 text-error border border-error' : 'bg-success/10 text-success border border-success'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div>
            <label className="block text-[14px] font-medium text-text-muted mb-1 flex items-center gap-2">
               Full Name
            </label>
            <input
              type="text"
              className="premium-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[14px] font-medium text-text-muted mb-1 flex items-center gap-2">
              <Hash size={16}/> Registration Number / Roll Number
            </label>
            <input
              type="text"
              className="premium-input font-mono"
              value={registerNumber}
              onChange={(e) => setRegisterNumber(e.target.value)}
              placeholder="e.g. 21BCE1234"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[14px] font-medium text-text-muted mb-1 flex items-center gap-2">
                <GraduationCap size={16}/> Year of Study
              </label>
              <select
                className="premium-input"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
              >
                <option value="" disabled>Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Alumni">Alumni</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[14px] font-medium text-text-muted mb-1 flex items-center gap-2">
                <BookOpen size={16}/> Department
              </label>
              <input
                type="text"
                className="premium-input"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Computer Science"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[14px] font-medium text-text-muted mb-1 flex items-center gap-2">
              <Building size={16}/> College / University
            </label>
            <input
              type="text"
              className="premium-input"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="e.g. Example Institute of Technology"
              required
            />
          </div>

          <button type="submit" className="btn-primary w-full mt-4" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
