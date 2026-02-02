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

      <div className="relative flex items-center justify-center min-h-screen overflow-hidden py-8">
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
        <div className={`relative z-10 w-full max-w-[380px] px-4 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

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
                <div className="relative w-20 h-20 logo-container rounded-full bg-gradient-to-br from-purple-600/30 via-indigo-600/20 to-violet-600/30 p-1">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800 flex items-center justify-center overflow-hidden border border-white/10">
                    <img
                      alt="Logo"
                      className="w-12 h-12 object-contain drop-shadow-lg"
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
              Create Account
            </h1>
            <p className="text-sm text-gray-400">
              Join Omniyal to manage your business
            </p>
          </div>

          {/* Glassmorphic card */}
          <div className="glass-card rounded-2xl p-5">
            <div className="space-y-3">

              {/* Name and Company inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-400 mb-1.5 ml-0.5">
                    Full Name
                  </label>
                  <div className="relative input-wrapper">
                    <input
                      type="text"
                      className="glass-input w-full pl-9 pr-3 py-2.5 rounded-xl text-white text-sm"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-400 mb-1.5 ml-0.5">
                    Company Name
                  </label>
                  <div className="relative input-wrapper">
                    <input
                      type="text"
                      className="glass-input w-full pl-9 pr-3 py-2.5 rounded-xl text-white text-sm"
                      placeholder="Company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Phone input */}
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1.5 ml-0.5">
                  Phone Number
                </label>
                <div className="relative input-wrapper">
                  <input
                    type="tel"
                    className="glass-input w-full pl-9 pr-3 py-2.5 rounded-xl text-white text-sm"
                    placeholder={`+${getCountryCallingCode(selectedCountry)} 123456789`}
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    onKeyDown={handleKeyDown}
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>

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
                    placeholder="Create a password"
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

              {/* Error message */}
              {registerResult && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl animate-slide-up">
                  <p className="text-red-400 text-xs text-center flex items-center justify-center gap-1.5">
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
                className="btn-primary w-full py-2.5 text-white text-sm font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-1"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create Account
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
                  <span className="px-3 text-[10px] text-gray-500 bg-[#0f0f23]">Already have an account?</span>
                </div>
              </div>

              {/* Login button */}
              <button
                onClick={() => navigate('/login')}
                className="btn-secondary w-full py-2.5 text-white/80 text-sm font-medium rounded-xl"
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-[10px] text-gray-600">
              Your data is secure with us
            </p>
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
}

export default Main;
