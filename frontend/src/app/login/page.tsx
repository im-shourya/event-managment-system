"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push("/");
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else {
        // Automatically sync to backend users table could go here, or we use Supabase database triggers.
        // For simplicity, we just push to dashboard if successful
        if (data.user) {
          router.push("/");
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card p-8 max-w-md w-full border border-border">
        <h2 className="text-3xl font-bold text-center mb-8 text-text-primary">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>
        
        {error && (
          <div className="bg-error/10 border border-error text-error p-3 rounded-[8px] mb-6 text-[14px] text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div>
            <label className="block text-[14px] font-medium text-text-muted mb-1">Email</label>
            <input
              type="email"
              className="premium-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[14px] font-medium text-text-muted">Password</label>
              {isLogin && (
                <Link href="/reset-password" className="text-[12px] text-accent-green hover:underline">
                  Forgot Password?
                </Link>
              )}
            </div>
            <input
              type="password"
              className="premium-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary w-full mt-4">
            {isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center text-[14px] text-text-secondary">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            className="text-accent-green hover:underline focus:outline-none"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
