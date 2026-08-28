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
      <div className="glass-card p-10 max-w-md w-full rounded-3xl relative overflow-hidden border border-surface-border">
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-green/10 rounded-full blur-[80px] -z-10 translate-x-1/2 -translate-y-1/2"></div>

        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3 text-white">
          <KeyRound className="text-accent-green" size={28} />
          Create New Password
        </h2>
        <p className="text-gray-400 mb-8">
          Enter your new password below. Make it a strong one!
        </p>

        {message && (
          <div className={`p-4 rounded-lg mb-6 text-sm ${
            message.type === 'error' ? 'bg-red-500/20 text-red-200 border border-red-500' : 
            'bg-green-500/20 text-green-200 border border-green-500'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
              <Lock size={16} /> New Password
            </label>
            <input
              type="password"
              className="w-full bg-surface border border-surface-border rounded-lg p-3 text-white focus:outline-none focus:border-accent-green transition-colors"
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
