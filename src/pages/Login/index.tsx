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
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

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
        /* ===== AURORA BACKGROUND ===== */
        @keyframes aurora {
          0%, 100% {
            background-position: 50% 50%, 50% 50%;
          }
          25% {
            background-position: 0% 50%, 100% 50%;
          }
          50% {
            background-position: 50% 100%, 50% 0%;
          }
          75% {
            background-position: 100% 50%, 0% 50%;
          }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(100%) rotate(45deg); }
        }

        @keyframes float-gentle {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
          25% { transform: translateY(-15px) translateX(5px) rotate(2deg); }
          50% { transform: translateY(-8px) translateX(-5px) rotate(-1deg); }
          75% { transform: translateY(-20px) translateX(3px) rotate(1deg); }
        }

        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(120px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
        }

        @keyframes pulse-soft {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }

        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.1); }
          50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.5), 0 0 60px rgba(139, 92, 246, 0.2); }
        }

        @keyframes slide-up-fade {
          0% { opacity: 0; transform: translateY(30px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes border-flow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes text-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes ripple {
          0% { transform: scale(0); opacity: 0.5; }
          100% { transform: scale(4); opacity: 0; }
        }

        @keyframes morph {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
        }

        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes spin-reverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }

        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        .aurora-bg {
          background:
            radial-gradient(ellipse at 20% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(59, 130, 246, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 40% 60%, rgba(168, 85, 247, 0.1) 0%, transparent 40%),
            radial-gradient(ellipse at 60% 30%, rgba(99, 102, 241, 0.08) 0%, transparent 45%),
            linear-gradient(135deg, #0a0a1a 0%, #0f0f2d 25%, #0a0a1a 50%, #0d0d25 75%, #0a0a1a 100%);
          background-size: 200% 200%, 200% 200%, 150% 150%, 180% 180%, 100% 100%;
          animation: aurora 20s ease-in-out infinite;
        }

        .noise-overlay {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
        }

        .glass-card-premium {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.05) 0%,
            rgba(255, 255, 255, 0.02) 50%,
            rgba(255, 255, 255, 0.05) 100%
          );
          backdrop-filter: blur(40px) saturate(150%);
          -webkit-backdrop-filter: blur(40px) saturate(150%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.05) inset,
            0 20px 50px -15px rgba(0, 0, 0, 0.5),
            0 0 100px -20px rgba(139, 92, 246, 0.15);
          position: relative;
          overflow: hidden;
        }

        .glass-card-premium::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        }

        .glass-input-premium {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .glass-input-premium:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .glass-input-premium:focus {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(139, 92, 246, 0.5);
          box-shadow:
            0 0 0 4px rgba(139, 92, 246, 0.1),
            0 0 30px rgba(139, 92, 246, 0.15),
            inset 0 0 20px rgba(139, 92, 246, 0.03);
          outline: none;
        }

        .glass-input-premium::placeholder {
          color: rgba(156, 163, 175, 0.5);
          transition: color 0.3s ease;
        }

        .glass-input-premium:focus::placeholder {
          color: rgba(156, 163, 175, 0.3);
        }

        .input-wrapper-premium {
          position: relative;
        }

        .input-wrapper-premium::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #8b5cf6, #6366f1, #8b5cf6);
          background-size: 200% 100%;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateX(-50%);
          border-radius: 2px;
          animation: border-flow 3s linear infinite;
        }

        .input-wrapper-premium:focus-within::after {
          width: calc(100% - 24px);
        }

        .btn-premium {
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #7c3aed 100%);
          background-size: 200% 200%;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow:
            0 4px 15px rgba(139, 92, 246, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .btn-premium::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.6s ease;
        }

        .btn-premium:hover {
          transform: translateY(-2px);
          box-shadow:
            0 8px 30px rgba(139, 92, 246, 0.4),
            0 0 60px rgba(139, 92, 246, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          background-position: 100% 100%;
        }

        .btn-premium:hover::before {
          left: 100%;
        }

        .btn-premium:active {
          transform: translateY(0);
        }

        .btn-premium .ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          animation: ripple 0.6s ease-out;
        }

        .btn-secondary-premium {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .btn-secondary-premium::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1));
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .btn-secondary-premium:hover {
          border-color: rgba(139, 92, 246, 0.3);
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .btn-secondary-premium:hover::before {
          opacity: 1;
        }

        .icon-float {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .input-wrapper-premium:focus-within .icon-float {
          transform: translateY(-1px) scale(1.1);
          color: rgba(139, 92, 246, 0.9);
        }

        .morph-blob {
          animation: morph 8s ease-in-out infinite;
        }

        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
        .stagger-5 { animation-delay: 0.5s; }

        .text-gradient {
          background: linear-gradient(135deg, #fff 0%, #a5b4fc 50%, #fff 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: text-shimmer 8s ease-in-out infinite;
        }

        .logo-premium {
          animation: glow-pulse 3s ease-in-out infinite, breathe 4s ease-in-out infinite;
        }

        .ring-outer {
          animation: spin-slow 25s linear infinite;
        }

        .ring-inner {
          animation: spin-reverse 18s linear infinite;
        }

        .floating-shape {
          animation: float-gentle 6s ease-in-out infinite;
        }

        .orbit-dot {
          animation: orbit 12s linear infinite;
        }

        .fade-up {
          animation: slide-up-fade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
      `}</style>

      <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
        {/* Aurora animated background */}
        <div className="absolute inset-0 aurora-bg" />

        {/* Noise texture overlay */}
        <div className="absolute inset-0 noise-overlay" />

        {/* Animated mesh gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] morph-blob bg-gradient-to-br from-purple-600/20 via-violet-600/15 to-transparent blur-[100px] animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] morph-blob bg-gradient-to-tl from-blue-600/15 via-indigo-600/10 to-transparent blur-[120px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] morph-blob bg-gradient-to-r from-fuchsia-600/10 via-purple-600/15 to-transparent blur-[80px] animate-pulse-soft" style={{ animationDelay: '4s' }} />

        {/* Floating geometric shapes */}
        <div className="absolute top-[10%] right-[20%] w-16 h-16 border border-purple-500/20 rotate-45 floating-shape opacity-30" style={{ animationDelay: '0s' }} />
        <div className="absolute bottom-[20%] left-[15%] w-12 h-12 border border-indigo-500/20 rotate-12 floating-shape opacity-25" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[60%] right-[10%] w-8 h-8 border border-violet-500/25 rotate-[30deg] floating-shape opacity-30" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[30%] left-[8%] w-20 h-20 border border-blue-500/15 rounded-full floating-shape opacity-20" style={{ animationDelay: '1.5s' }} />

        {/* Floating particles */}
        <div className="absolute top-[15%] right-[25%] w-2 h-2 bg-purple-400/40 rounded-full floating-shape blur-[1px]" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-[30%] left-[12%] w-1.5 h-1.5 bg-indigo-400/50 rounded-full floating-shape blur-[0.5px]" style={{ animationDelay: '1.2s' }} />
        <div className="absolute top-[45%] right-[8%] w-1 h-1 bg-violet-400/60 rounded-full floating-shape" style={{ animationDelay: '2.3s' }} />
        <div className="absolute bottom-[15%] right-[30%] w-2.5 h-2.5 bg-blue-400/30 rounded-full floating-shape blur-[1px]" style={{ animationDelay: '0.8s' }} />
        <div className="absolute top-[70%] left-[25%] w-1.5 h-1.5 bg-fuchsia-400/40 rounded-full floating-shape" style={{ animationDelay: '1.8s' }} />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        {/* Main content */}
        <div className={`relative z-10 w-full max-w-[95%] sm:max-w-[420px] px-4 sm:px-5 mx-auto transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

          {/* Logo section */}
          <div className="text-center mb-8">
            <div className="mb-6 flex justify-center">
              <div className="relative">
                {/* Outer glow effect */}
                <div className="absolute -inset-8 bg-gradient-to-r from-purple-600/20 via-indigo-500/20 to-violet-600/20 rounded-full blur-3xl animate-pulse-soft" />

                {/* Animated outer ring */}
                <div className="absolute -inset-6 ring-outer">
                  <div className="w-full h-full rounded-full border border-dashed border-purple-500/25" />
                </div>

                {/* Animated inner ring */}
                <div className="absolute -inset-3 ring-inner">
                  <div className="w-full h-full rounded-full" style={{
                    border: '1px dotted rgba(129, 140, 248, 0.2)'
                  }} />
                </div>

                {/* Orbiting dot */}
                <div className="absolute inset-0 orbit-dot">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full blur-[1px]" />
                </div>

                {/* Main logo container */}
                <div className="relative w-24 h-24 logo-premium rounded-full bg-gradient-to-br from-purple-600/30 via-indigo-600/20 to-violet-600/30 p-1">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-900/95 via-slate-900 to-slate-800/95 flex items-center justify-center overflow-hidden border border-white/10 backdrop-blur-xl">
                    <img
                      alt="Logo"
                      className="w-16 h-16 object-contain drop-shadow-2xl"
                      src={logoUrl}
                      onError={(e) => { e.currentTarget.src = logoUrl2; }}
                    />
                  </div>
                </div>

                {/* Corner accents */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full shadow-lg shadow-purple-500/50" />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-gradient-to-t from-indigo-400 to-indigo-600 rounded-full shadow-lg shadow-indigo-500/50" style={{ animationDelay: '0.5s' }} />
                <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-1 h-1 bg-gradient-to-r from-violet-400 to-violet-600 rounded-full shadow-lg shadow-violet-500/50" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-1.5 h-1.5 bg-gradient-to-l from-purple-300 to-purple-500 rounded-full shadow-lg shadow-purple-400/50" style={{ animationDelay: '1.5s' }} />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gradient mb-2 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-400/80 font-light">
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Glass card */}
          <div className={`glass-card-premium rounded-3xl p-6 fade-up ${isVisible ? 'stagger-1' : ''}`}>
            <div className="space-y-5">

              {/* Email input */}
              <div className={`fade-up ${isVisible ? 'stagger-2' : ''}`}>
                <label className="block text-xs font-medium text-gray-400/90 mb-2 ml-1 tracking-wide uppercase">
                  Email Address
                </label>
                <div className="input-wrapper-premium">
                  <input
                    type="email"
                    className="glass-input-premium w-full pl-11 pr-4 py-3.5 rounded-2xl text-white text-sm font-light"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <svg className={`absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 icon-float transition-all duration-300 ${focusedInput === 'email' ? 'text-purple-400' : 'text-gray-500/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              {/* Password input */}
              <div className={`fade-up ${isVisible ? 'stagger-3' : ''}`}>
                <label className="block text-xs font-medium text-gray-400/90 mb-2 ml-1 tracking-wide uppercase">
                  Password
                </label>
                <div className="input-wrapper-premium">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="glass-input-premium w-full pl-11 pr-12 py-3.5 rounded-2xl text-white text-sm font-light"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <svg className={`absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 icon-float transition-all duration-300 ${focusedInput === 'password' ? 'text-purple-400' : 'text-gray-500/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500/60 hover:text-purple-400 transition-all duration-300 hover:scale-110"
                  >
                    {showPassword ? (
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot password link */}
              <div className={`text-right fade-up ${isVisible ? 'stagger-3' : ''}`}>
                <button
                  onClick={() => setShowResetModal(true)}
                  className="text-xs text-purple-400/80 hover:text-purple-300 transition-all duration-300 hover:underline underline-offset-4"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-xl fade-up">
                  <p className="text-red-400 text-xs text-center flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className={`btn-premium w-full py-3.5 text-white text-sm font-medium rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none fade-up ${isVisible ? 'stagger-4' : ''}`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2.5">
                    <svg className="animate-spin h-4.5 w-4.5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2.5">
                    Sign In
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className={`relative py-2 fade-up ${isVisible ? 'stagger-4' : ''}`}>
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.06]"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-[10px] text-gray-500/80 bg-transparent backdrop-blur-xl tracking-wider uppercase">New to Omniyal?</span>
                </div>
              </div>

              {/* Register button */}
              <button
                onClick={() => navigate('/register')}
                className={`btn-secondary-premium w-full py-3.5 text-white/80 text-sm font-medium rounded-2xl fade-up ${isVisible ? 'stagger-5' : ''}`}
              >
                <span className="relative z-10">Create Account</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-center gap-2 mt-6 fade-up ${isVisible ? 'stagger-5' : ''}`}>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.05]">
              <svg className="w-3 h-3 text-emerald-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-[10px] text-gray-500/80 tracking-wide">
                Secure & Encrypted
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => { setShowResetModal(false); setResetMessage(""); setResetEmail(""); }}
            style={{ animation: 'fade-in 0.3s ease-out' }}
          />
          <div className="relative glass-card-premium rounded-3xl p-5 sm:p-6 w-full max-w-[95%] sm:max-w-[380px] mx-auto fade-up">
            <div className="text-center mb-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center border border-purple-500/20 backdrop-blur-xl">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1">Reset Password</h3>
              <p className="text-xs text-gray-400/80 font-light">
                Enter your email to receive a reset link
              </p>
            </div>

            <div className="space-y-4">
              <div className="input-wrapper-premium">
                <input
                  type="email"
                  className="glass-input-premium w-full pl-11 pr-4 py-3.5 rounded-2xl text-white text-sm font-light"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              {resetMessage && (
                <div className={`p-3.5 rounded-2xl text-xs text-center flex items-center justify-center gap-2 ${
                  resetMessage.includes("sent")
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                }`}>
                  {resetMessage.includes("sent") ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {resetMessage}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  className="btn-secondary-premium flex-1 py-3 text-white/70 text-sm rounded-2xl"
                  onClick={() => { setShowResetModal(false); setResetMessage(""); setResetEmail(""); }}
                >
                  <span className="relative z-10">Cancel</span>
                </button>
                <button
                  className="btn-premium flex-1 py-3 text-white text-sm font-medium rounded-2xl"
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
