"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { KeyRound, Lock } from "lucide-react";

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: "error" | "success", text: string} | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Supabase client automatically picks up the access_token in the URL fragment 
    // and establishes a session if a user clicked a recovery link.
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage({ type: "error", text: "Invalid or expired reset link. Please request a new one." });
      }
    };
    checkSession();
  }, [supabase]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Password updated successfully! Redirecting..." });
      setTimeout(() => {
        router.push("/");
      }, 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card p-10 max-w-md w-full border border-border">
        
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3 text-text-primary">
          <KeyRound className="text-accent-green" size={28} />
          Create New Password
        </h2>
        <p className="text-text-secondary text-[14px] mb-8">
          Enter your new password below. Make it a strong one!
        </p>

        {message && (
          <div className={`p-4 rounded-[8px] mb-6 text-[14px] ${
            message.type === 'error' ? 'bg-error/10 text-error border border-error' : 
            'bg-success/10 text-success border border-success'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="flex flex-col gap-5">
          <div>
            <label className="block text-[14px] font-medium text-text-muted mb-1 flex items-center gap-2">
              <Lock size={16} /> New Password
            </label>
            <input
              type="password"
              className="premium-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn-primary w-full mt-2" disabled={loading || message?.type === 'error'}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
