import logoUrl from "@/assets/images/logo.png";
import logoUrl2 from "@/assets/images/logo3.png";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from "axios";
import { getCountryCallingCode, parsePhoneNumber, AsYouType, CountryCode } from 'libphonenumber-js'

function Main() {
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registerResult, setRegisterResult] = useState<string | null>(null);
  const [selectedCountry] = useState<CountryCode>('MY');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const formatPhoneNumber = (number: string) => {
    try {
      const parsed = parsePhoneNumber(number, selectedCountry);
      return parsed ? parsed.format('E.164') : number;
    } catch (error) {
      const countryCode = getCountryCallingCode(selectedCountry);
      const cleaned = number.replace(/[^\d]/g, '');
      return `+${countryCode}${cleaned}`;
    }
  };

  const handleRegister = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      setRegisterResult(null);

      const timestamp = Date.now().toString().slice(-6);
      const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const newCompanyId = `${randomPart}${timestamp.slice(-3)}`;

      const userResponse = await axios.post(`https://bisnesgpt.jutateknologi.com/api/create-user/${encodeURIComponent(email)}/${encodeURIComponent(formatPhoneNumber(phoneNumber))}/${encodeURIComponent(password)}/1/${newCompanyId}`);

      if (userResponse.data) {
        const channelResponse = await axios.post(`https://bisnesgpt.jutateknologi.com/api/channel/create/${newCompanyId}`, {
          name: name,
          companyName: companyName,
          phoneNumber: formatPhoneNumber(phoneNumber),
          email: email,
          password: password,
          plan: 'free',
          country: selectedCountry
        });

        if (channelResponse.data) {
          const response = await fetch('https://bisnesgpt.jutateknologi.com/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const data = await response.json();

          if (response.ok) {
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userData', JSON.stringify(data.user));
            navigate('/loading');
            toast.success("Registration successful!");
          }
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.response?.data || error.message);
        setRegisterResult(error.response?.data?.message || error.message);
        toast.error(`Registration failed: ${error.response?.data?.message || error.message}`);
      } else if (error instanceof Error) {
        console.error("Error registering user:", error);
        setRegisterResult(error.message);
        toast.error("Failed to register user: " + error.message);
      } else {
        console.error("Unexpected error:", error);
        setRegisterResult("Unexpected error occurred");
        toast.error("Failed to register user: Unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !isLoading) {
      handleRegister();
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatter = new AsYouType(selectedCountry);
    const formatted = formatter.input(e.target.value);
    setPhoneNumber(formatted);
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
          0% { transform: rotate(0deg) translateX(100px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(100px) rotate(-360deg); }
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

        @keyframes checkmark-draw {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
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

        .stagger-1 { animation-delay: 0.05s; }
        .stagger-2 { animation-delay: 0.1s; }
        .stagger-3 { animation-delay: 0.15s; }
        .stagger-4 { animation-delay: 0.2s; }
        .stagger-5 { animation-delay: 0.25s; }
        .stagger-6 { animation-delay: 0.3s; }
        .stagger-7 { animation-delay: 0.35s; }
        .stagger-8 { animation-delay: 0.4s; }

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

        .feature-tag {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          transition: all 0.3s ease;
        }

        .feature-tag:hover {
          background: rgba(139, 92, 246, 0.15);
          border-color: rgba(139, 92, 246, 0.3);
          transform: translateY(-1px);
        }

        /* Custom scrollbar for the form */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 2px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }
      `}</style>

      <div className="relative flex items-center justify-center min-h-screen overflow-hidden py-8">
        {/* Aurora animated background */}
        <div className="absolute inset-0 aurora-bg" />

        {/* Noise texture overlay */}
        <div className="absolute inset-0 noise-overlay" />

        {/* Animated mesh gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] morph-blob bg-gradient-to-br from-purple-600/20 via-violet-600/15 to-transparent blur-[100px] animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] morph-blob bg-gradient-to-tl from-blue-600/15 via-indigo-600/10 to-transparent blur-[120px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] morph-blob bg-gradient-to-r from-fuchsia-600/10 via-purple-600/15 to-transparent blur-[80px] animate-pulse-soft" style={{ animationDelay: '4s' }} />

        {/* Floating geometric shapes */}
        <div className="absolute top-[8%] right-[18%] w-14 h-14 border border-purple-500/20 rotate-45 floating-shape opacity-30" style={{ animationDelay: '0s' }} />
        <div className="absolute bottom-[18%] left-[12%] w-10 h-10 border border-indigo-500/20 rotate-12 floating-shape opacity-25" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[55%] right-[8%] w-7 h-7 border border-violet-500/25 rotate-[30deg] floating-shape opacity-30" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[25%] left-[6%] w-16 h-16 border border-blue-500/15 rounded-full floating-shape opacity-20" style={{ animationDelay: '1.5s' }} />

        {/* Floating particles */}
        <div className="absolute top-[12%] right-[22%] w-2 h-2 bg-purple-400/40 rounded-full floating-shape blur-[1px]" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-[28%] left-[10%] w-1.5 h-1.5 bg-indigo-400/50 rounded-full floating-shape blur-[0.5px]" style={{ animationDelay: '1.2s' }} />
        <div className="absolute top-[42%] right-[6%] w-1 h-1 bg-violet-400/60 rounded-full floating-shape" style={{ animationDelay: '2.3s' }} />
        <div className="absolute bottom-[12%] right-[28%] w-2.5 h-2.5 bg-blue-400/30 rounded-full floating-shape blur-[1px]" style={{ animationDelay: '0.8s' }} />
        <div className="absolute top-[68%] left-[22%] w-1.5 h-1.5 bg-fuchsia-400/40 rounded-full floating-shape" style={{ animationDelay: '1.8s' }} />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        {/* Main content */}
        <div className={`relative z-10 w-full max-w-[420px] px-5 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

          {/* Logo section */}
          <div className="text-center mb-6">
            <div className="mb-5 flex justify-center">
              <div className="relative">
                {/* Outer glow effect */}
                <div className="absolute -inset-7 bg-gradient-to-r from-purple-600/20 via-indigo-500/20 to-violet-600/20 rounded-full blur-3xl animate-pulse-soft" />

                {/* Animated outer ring */}
                <div className="absolute -inset-5 ring-outer">
                  <div className="w-full h-full rounded-full border border-dashed border-purple-500/25" />
                </div>

                {/* Animated inner ring */}
                <div className="absolute -inset-2.5 ring-inner">
                  <div className="w-full h-full rounded-full" style={{
                    border: '1px dotted rgba(129, 140, 248, 0.2)'
                  }} />
                </div>

                {/* Orbiting dot */}
                <div className="absolute inset-0 orbit-dot">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full blur-[1px]" />
                </div>

                {/* Main logo container */}
                <div className="relative w-20 h-20 logo-premium rounded-full bg-gradient-to-br from-purple-600/30 via-indigo-600/20 to-violet-600/30 p-1">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-900/95 via-slate-900 to-slate-800/95 flex items-center justify-center overflow-hidden border border-white/10 backdrop-blur-xl">
                    <img
                      alt="Logo"
                      className="w-12 h-12 object-contain drop-shadow-2xl"
                      src={logoUrl}
                      onError={(e) => { e.currentTarget.src = logoUrl2; }}
                    />
                  </div>
                </div>

                {/* Corner accents */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full shadow-lg shadow-purple-500/50" />
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-gradient-to-t from-indigo-400 to-indigo-600 rounded-full shadow-lg shadow-indigo-500/50" />
                <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-1 h-1 bg-gradient-to-r from-violet-400 to-violet-600 rounded-full shadow-lg shadow-violet-500/50" />
                <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-1.5 h-1.5 bg-gradient-to-l from-purple-300 to-purple-500 rounded-full shadow-lg shadow-purple-400/50" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gradient mb-1.5 tracking-tight">
              Create Your Account
            </h1>
            <p className="text-sm text-gray-400/80 font-light">
              Start your journey with Omniyal today
            </p>
          </div>

          {/* Glass card */}
          <div className={`glass-card-premium rounded-3xl p-6 fade-up ${isVisible ? 'stagger-1' : ''}`}>
            <div className="space-y-4">

              {/* Name and Company row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Full Name */}
                <div className={`fade-up ${isVisible ? 'stagger-2' : ''}`}>
                  <label className="block text-[10px] font-medium text-gray-400/90 mb-1.5 ml-1 tracking-wide uppercase">
                    Full Name
                  </label>
                  <div className="input-wrapper-premium">
                    <input
                      type="text"
                      className="glass-input-premium w-full pl-10 pr-3 py-3 rounded-xl text-white text-sm font-light"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setFocusedInput('name')}
                      onBlur={() => setFocusedInput(null)}
                    />
                    <svg className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 icon-float transition-all duration-300 ${focusedInput === 'name' ? 'text-purple-400' : 'text-gray-500/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>

                {/* Company Name */}
                <div className={`fade-up ${isVisible ? 'stagger-2' : ''}`}>
                  <label className="block text-[10px] font-medium text-gray-400/90 mb-1.5 ml-1 tracking-wide uppercase">
                    Company
                  </label>
                  <div className="input-wrapper-premium">
                    <input
                      type="text"
                      className="glass-input-premium w-full pl-10 pr-3 py-3 rounded-xl text-white text-sm font-light"
                      placeholder="Company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setFocusedInput('company')}
                      onBlur={() => setFocusedInput(null)}
                    />
                    <svg className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 icon-float transition-all duration-300 ${focusedInput === 'company' ? 'text-purple-400' : 'text-gray-500/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Phone Number */}
              <div className={`fade-up ${isVisible ? 'stagger-3' : ''}`}>
                <label className="block text-[10px] font-medium text-gray-400/90 mb-1.5 ml-1 tracking-wide uppercase">
                  Phone Number
                </label>
                <div className="input-wrapper-premium">
                  <input
                    type="tel"
                    className="glass-input-premium w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm font-light"
                    placeholder={`+${getCountryCallingCode(selectedCountry)} 123456789`}
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setFocusedInput('phone')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <svg className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 icon-float transition-all duration-300 ${focusedInput === 'phone' ? 'text-purple-400' : 'text-gray-500/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>

              {/* Email */}
              <div className={`fade-up ${isVisible ? 'stagger-4' : ''}`}>
                <label className="block text-[10px] font-medium text-gray-400/90 mb-1.5 ml-1 tracking-wide uppercase">
                  Email Address
                </label>
                <div className="input-wrapper-premium">
                  <input
                    type="email"
                    className="glass-input-premium w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm font-light"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <svg className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 icon-float transition-all duration-300 ${focusedInput === 'email' ? 'text-purple-400' : 'text-gray-500/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              {/* Password */}
              <div className={`fade-up ${isVisible ? 'stagger-5' : ''}`}>
                <label className="block text-[10px] font-medium text-gray-400/90 mb-1.5 ml-1 tracking-wide uppercase">
                  Password
                </label>
                <div className="input-wrapper-premium">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="glass-input-premium w-full pl-10 pr-11 py-3 rounded-xl text-white text-sm font-light"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <svg className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 icon-float transition-all duration-300 ${focusedInput === 'password' ? 'text-purple-400' : 'text-gray-500/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500/60 hover:text-purple-400 transition-all duration-300 hover:scale-110"
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

              {/* Error message */}
              {registerResult && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-xl fade-up">
                  <p className="text-red-400 text-xs text-center flex items-center justify-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {registerResult}
                  </p>
                </div>
              )}

              {/* Register button */}
              <button
                onClick={handleRegister}
                disabled={isLoading}
                className={`btn-premium w-full py-3.5 text-white text-sm font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-1 fade-up ${isVisible ? 'stagger-6' : ''}`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2.5">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2.5">
                    Get Started
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className={`relative py-1.5 fade-up ${isVisible ? 'stagger-7' : ''}`}>
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.06]"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-[10px] text-gray-500/80 bg-transparent backdrop-blur-xl tracking-wider uppercase">Already have an account?</span>
                </div>
              </div>

              {/* Login button */}
              <button
                onClick={() => navigate('/login')}
                className={`btn-secondary-premium w-full py-3 text-white/80 text-sm font-medium rounded-xl fade-up ${isVisible ? 'stagger-8' : ''}`}
              >
                <span className="relative z-10">Sign In</span>
              </button>
            </div>
          </div>

          {/* Footer with features */}
          <div className={`mt-5 fade-up ${isVisible ? 'stagger-8' : ''}`}>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <div className="feature-tag flex items-center gap-1.5 px-2.5 py-1 rounded-full">
                <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-[10px] text-gray-400">Free Trial</span>
              </div>
              <div className="feature-tag flex items-center gap-1.5 px-2.5 py-1 rounded-full">
                <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-[10px] text-gray-400">Secure</span>
              </div>
              <div className="feature-tag flex items-center gap-1.5 px-2.5 py-1 rounded-full">
                <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-[10px] text-gray-400">Instant Setup</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </>
  );
}

export default Main;
