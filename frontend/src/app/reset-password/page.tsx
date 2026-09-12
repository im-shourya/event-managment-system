"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: "error" | "success", text: string} | null>(null);
  
  const supabase = createClient();

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://events.shouryaparashar.in' : 'http://localhost:3000');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${FRONTEND_URL}/update-password`,
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Reset link sent to your email! Please check your inbox (and spam folder) and click the link to reset your password." });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card p-10 max-w-md w-full border border-border">

        <Link href="/login" className="flex items-center gap-2 text-text-muted hover:text-accent-green transition-colors w-fit mb-8">
          <ArrowLeft size={16} /> Back to Login
        </Link>

        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3 text-text-primary">
          <KeyRound className="text-accent-green" size={28} />
          Reset Password
        </h2>
        <p className="text-text-secondary text-[14px] mb-8">
          Enter your email to receive a secure password reset link.
        </p>

        {message && (
          <div className={`p-4 rounded-[8px] mb-6 text-[14px] ${
            message.type === 'error' ? 'bg-error/10 text-error border border-error' : 
            'bg-success/10 text-success border border-success'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleRequestLink} className="flex flex-col gap-5">
          <div>
            <label className="block text-[14px] font-medium text-text-muted mb-1 flex items-center gap-2">
              <Mail size={16} /> Email Address
            </label>
            <input
              type="email"
              className="premium-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>
    </div>
  );
}
