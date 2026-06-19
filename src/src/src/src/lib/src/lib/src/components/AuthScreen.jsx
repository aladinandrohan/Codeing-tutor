import { useState } from "react";
import { Terminal, Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../lib/AuthContext";

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!email || !password) {
      setError("Fill in both fields to continue.");
      return;
    }
    if (password.length < 6) {
      setError("Password needs to be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error: authError } =
      mode === "signin" ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    if (mode === "signup") {
      setNotice("Check your email to confirm your account, then sign in.");
      setMode("signin");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0F1115] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#7EE787]/15 flex items-center justify-center mb-3">
            <Terminal size={22} className="text-[#7EE787]" />
          </div>
          <h1 className="text-[20px] font-semibold text-[#EDEDED]">Code Tutor</h1>
          <p className="text-[13px] text-[#6B7280] mt-1">Learn to code, one tiny step at a time</p>
        </div>

        <div className="bg-[#13151A] border border-[#22252C] rounded-2xl p-6 shadow-2xl">
          <div className="flex bg-[#1C1F26] rounded-xl p-1 mb-5">
            <button
              onClick={() => { setMode("signin"); setError(""); setNotice(""); }}
              className={`flex-1 text-[13px] font-medium py-2 rounded-lg transition-colors ${
                mode === "signin" ? "bg-[#2A2D35] text-[#EDEDED]" : "text-[#6B7280]"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => { setMode("signup"); setError(""); setNotice(""); }}
              className={`flex-1 text-[13px] font-medium py-2 rounded-lg transition-colors ${
                mode === "signup" ? "bg-[#2A2D35] text-[#EDEDED]" : "text-[#6B7280]"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#1C1F26] border border-[#2A2D35] focus:border-[#F2B544]/50 outline-none rounded-xl pl-9 pr-3 py-2.5 text-[14px] text-[#EDEDED] placeholder-[#4B5563] transition-colors"
              />
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-[#1C1F26] border border-[#2A2D35] focus:border-[#F2B544]/50 outline-none rounded-xl pl-9 pr-3 py-2.5 text-[14px] text-[#EDEDED] placeholder-[#4B5563] transition-colors"
              />
            </div>

            {error && <p className="text-[12.5px] text-[#F2A0A0] px-1">{error}</p>}
            {notice && <p className="text-[12.5px] text-[#7EE787] px-1">{notice}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#F2B544] disabled:opacity-60 text-[#16181D] font-medium text-[14px] py-2.5 rounded-xl transition-opacity mt-1"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <>
                  {mode === "signin" ? "Sign in" : "Create account"}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-[#4B5563] mt-5">
          Your chat history saves automatically and is private to your account.
        </p>
      </div>
    </div>
  );
}
