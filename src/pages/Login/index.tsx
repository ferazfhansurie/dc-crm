import logoUrl from "@/assets/images/logo.png";
import logoUrl2 from "@/assets/images/logo3.png";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { firebaseApp } from "@/firebaseconfig";

function Main() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSignIn = async () => {
    if (isLoading) return;
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch('https://bisnesgpt.jutateknologi.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userData', JSON.stringify(data.user));
        navigate('/chat');
      } else {
        setError(data.error || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !isLoading) {
      handleSignIn();
    }
  };

  const handleForgotPassword = async () => {
    const auth = getAuth(firebaseApp);
    setError("");
    setResetMessage("");

    if (!resetEmail) {
      setResetMessage("Please enter your email address.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage("Password reset email sent! Check your inbox.");
      setResetEmail("");
      setTimeout(() => {
        setShowResetModal(false);
        setResetMessage("");
      }, 3000);
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      switch (firebaseError.code) {
        case "auth/invalid-email":
          setResetMessage("Please enter a valid email address.");
          break;
        case "auth/user-not-found":
          setResetMessage("No account found with this email.");
          break;
        default:
          setResetMessage("An error occurred. Please try again.");
      }
    }
  };

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes border-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 4s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 0.5s ease-out forwards; }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }

        .glass-card {
          background: rgba(15, 15, 35, 0.6);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .glass-input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-input:focus {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(139, 92, 246, 0.5);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15), 0 0 20px rgba(139, 92, 246, 0.2);
          outline: none;
        }
        .glass-input::placeholder {
          color: rgba(156, 163, 175, 0.6);
        }

        .btn-primary {
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #8b5cf6 100%);
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .btn-primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }
        .btn-primary:hover::before {
          left: 100%;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
        }
        .btn-primary:active {
          transform: translateY(0);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .input-icon {
          color: rgba(156, 163, 175, 0.5);
          transition: color 0.3s ease;
        }
        .glass-input:focus + .input-icon,
        .input-wrapper:focus-within .input-icon {
          color: rgba(139, 92, 246, 0.8);
        }

        @keyframes logo-pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4),
                        0 0 0 0 rgba(99, 102, 241, 0.3),
                        0 0 60px rgba(139, 92, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 0 15px rgba(139, 92, 246, 0),
                        0 0 0 30px rgba(99, 102, 241, 0),
                        0 0 80px rgba(139, 92, 246, 0.5);
          }
        }
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rotate-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        .logo-container {
          animation: logo-pulse 3s ease-in-out infinite;
        }
        .logo-ring-outer {
          animation: rotate-slow 20s linear infinite;
        }
        .logo-ring-inner {
          animation: rotate-reverse 15s linear infinite;
        }
        .logo-glow {
          animation: breathe 3s ease-in-out infinite;
        }
      `}</style>

      <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950">
          {/* Animated orbs */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px] animate-pulse-glow" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-600/20 rounded-full blur-[80px] animate-pulse-glow" style={{ animationDelay: '4s' }} />

          {/* Floating particles */}
          <div className="absolute top-[15%] right-[15%] w-2 h-2 bg-white/30 rounded-full animate-float-slow" />
          <div className="absolute bottom-[25%] left-[10%] w-1.5 h-1.5 bg-purple-400/40 rounded-full animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[40%] right-[25%] w-1 h-1 bg-blue-400/50 rounded-full animate-float-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-[35%] left-[25%] w-2.5 h-2.5 bg-indigo-400/30 rounded-full animate-float" style={{ animationDelay: '3s' }} />
          <div className="absolute top-[60%] right-[10%] w-1.5 h-1.5 bg-violet-400/40 rounded-full animate-float-slow" style={{ animationDelay: '0.5s' }} />

          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.015]" style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Main content */}
        <div className={`relative z-10 w-full max-w-[340px] px-4 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

          {/* Logo and header */}
          <div className="text-center mb-6">
            <div className="mb-4 flex justify-center">
              <div className="relative">
                {/* Outer glow */}
                <div className="absolute -inset-6 bg-gradient-to-r from-purple-600/30 via-indigo-500/30 to-purple-600/30 rounded-full blur-2xl logo-glow" />

                {/* Animated outer ring */}
                <div className="absolute -inset-4 logo-ring-outer">
                  <div className="w-full h-full rounded-full border border-dashed border-purple-500/30" />
                </div>

                {/* Animated inner ring */}
                <div className="absolute -inset-2 logo-ring-inner">
                  <div className="w-full h-full rounded-full border border-indigo-400/20" style={{
                    borderStyle: 'dotted',
                    borderWidth: '1px'
                  }} />
                </div>

                {/* Main logo container */}
                <div className="relative w-24 h-24 logo-container rounded-full bg-gradient-to-br from-purple-600/30 via-indigo-600/20 to-violet-600/30 p-1">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800 flex items-center justify-center overflow-hidden border border-white/10">
                    <img
                      alt="Logo"
                      className="w-16 h-16 object-contain drop-shadow-lg"
                      src={logoUrl}
                      onError={(e) => { e.currentTarget.src = logoUrl2; }}
                    />
                  </div>
                </div>

                {/* Accent dots */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-1 h-1 bg-violet-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-400">
              Sign in to continue to Omniyal
            </p>
          </div>

          {/* Glassmorphic card */}
          <div className="glass-card rounded-2xl p-5">
            <div className="space-y-3.5">

              {/* Email input */}
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1.5 ml-0.5">
                  Email Address
                </label>
                <div className="relative input-wrapper">
                  <input
                    type="email"
                    className="glass-input w-full pl-9 pr-3 py-2.5 rounded-xl text-white text-sm"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              {/* Password input */}
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1.5 ml-0.5">
                  Password
                </label>
                <div className="relative input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="glass-input w-full pl-9 pr-10 py-2.5 rounded-xl text-white text-sm"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="text-right -mt-1">
                <button
                  onClick={() => setShowResetModal(true)}
                  className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors duration-200"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl animate-slide-up">
                  <p className="text-red-400 text-xs text-center flex items-center justify-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </p>
                </div>
              )}

              {/* Sign in button */}
              <button
                onClick={handleSignIn}
                disabled={isLoading}
                className="btn-primary w-full py-2.5 text-white text-sm font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 text-[10px] text-gray-500 bg-[#0f0f23]">New to Omniyal?</span>
                </div>
              </div>

              {/* Register button */}
              <button
                onClick={() => navigate('/register')}
                className="btn-secondary w-full py-2.5 text-white/80 text-sm font-medium rounded-xl"
              >
                Create Account
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-[10px] text-gray-600">
              Secure access to your dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => { setShowResetModal(false); setResetMessage(""); setResetEmail(""); }}
          />
          <div className="relative glass-card rounded-2xl p-5 w-full max-w-[320px] animate-slide-up">
            <div className="text-center mb-4">
              <div className="w-11 h-11 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center border border-purple-500/20">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white">Reset Password</h3>
              <p className="text-[11px] text-gray-400 mt-1">
                Enter your email to receive a reset link
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative input-wrapper">
                <input
                  type="email"
                  className="glass-input w-full pl-9 pr-3 py-2.5 rounded-xl text-white text-sm"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              {resetMessage && (
                <div className={`p-2.5 rounded-xl text-xs text-center flex items-center justify-center gap-1.5 ${
                  resetMessage.includes("sent")
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                }`}>
                  {resetMessage.includes("sent") ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {resetMessage}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  className="btn-secondary flex-1 py-2 text-white/70 text-sm rounded-xl"
                  onClick={() => { setShowResetModal(false); setResetMessage(""); setResetEmail(""); }}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary flex-1 py-2 text-white text-sm font-medium rounded-xl"
                  onClick={handleForgotPassword}
                >
                  Send Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Main;
