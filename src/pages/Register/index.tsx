import ThemeSwitcher from "@/components/ThemeSwitcher";
import logoUrl from "@/assets/images/dc-login-logo.png";
import { FormInput } from "@/components/Base/Form";
import Button from "@/components/Base/Button";
import clsx from "clsx";
import { Link, useNavigate } from "react-router-dom";
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, getDocs, addDoc, query, where, getDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from "axios";
import { getCountries, getCountryCallingCode, parsePhoneNumber, AsYouType, CountryCode } from 'libphonenumber-js'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCc0oSHlqlX7fLeqqonODsOIC3XA8NI7hc",
  authDomain: "onboarding-a5fcb.firebaseapp.com",
  databaseURL: "https://onboarding-a5fcb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "onboarding-a5fcb",
  storageBucket: "onboarding-a5fcb.appspot.com",
  messagingSenderId: "334607574757",
  appId: "1:334607574757:web:2603a69bf85f4a1e87960c",
  measurementId: "G-2C9J1RY67L"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

function Main() {
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [notes, setNotes] = useState("");
  const [quotaLeads, setQuotaLeads] = useState(0);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  const [weightage, setWeightage] = useState(0);

  
  const [registerResult, setRegisterResult] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'blaster' | 'enterprise' | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('MY');
  const navigate = useNavigate();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [cooldown]);

  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const formatPhoneNumber = (number: string) => {
    try {
      const phoneNumber = parsePhoneNumber(number, selectedCountry);
      return phoneNumber ? phoneNumber.format('E.164') : number;
    } catch (error) {
      // If parsing fails, return the original format with country code
      const countryCode = getCountryCallingCode(selectedCountry);
      const cleaned = number.replace(/[^\d]/g, '');
      return `+${countryCode}${cleaned}`;
    }
  };

  const sendVerificationCode = async () => {
    try {
      // Validate phone number
      if (phoneNumber.length < 10) {
        toast.error("Please enter a valid phone number");
        return;
      }
      // Double check if phone number is still available
      const isRegistered = await isPhoneNumberRegistered(phoneNumber);
      if (isRegistered) {
        toast.error("This phone number is already registered");
        return;
      }
      const formattedPhone = formatPhoneNumber(phoneNumber).substring(1) + '@c.us'; // Remove '+' for WhatsApp
      const code = generateVerificationCode();
      localStorage.setItem('verificationCode', code);
      const user = getAuth().currentUser;
      if (!user) {
        console.error("User not authenticated");
      }
      const docUserRef = doc(firestore, 'user', user?.email!);
      const docUserSnapshot = await getDoc(docUserRef);
      if (!docUserSnapshot.exists()) {
        
        return;
      }
      const dataUser = docUserSnapshot.data();
      const companyId = dataUser.companyId;
      const docRef = doc(firestore, 'companies', companyId);
      const docSnapshot = await getDoc(docRef);
      if (!docSnapshot.exists()) {
        
        return;
      }
      const data2 = docSnapshot.data();
      const baseUrl = data2.apiUrl || 'https://mighty-dane-newly.ngrok-free.app';
      const response = await fetch(`${baseUrl}/api/v2/messages/text/001/${formattedPhone}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Your verification code is: ${code}`,
          phoneIndex: 0,
          userName: "System"
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send verification code');
      }

      setIsVerificationSent(true);
      setVerificationStep(true);
      setCooldown(10);
      toast.success("Verification code sent!");
    } catch (error) {
      toast.error("Failed to send verification code");
      console.error(error);
    }
  };

  const isPhoneNumberRegistered = async (phoneNumber: string) => {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const usersRef = collection(firestore, "user");
      // Check both phone and phoneNumber fields
      const q1 = query(usersRef, where("phone", "==", formattedPhone));
      const q2 = query(usersRef, where("phoneNumber", "==", formattedPhone));
      
      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);
      
      return !snapshot1.empty || !snapshot2.empty;
    } catch (error) {
      console.error("Error checking phone number:", error);
      throw error;
    }
  };

  const handleRegister = async () => {
    try {
      // Validate plan selection
      if (!selectedPlan) {
        toast.error("Please select a plan to continue");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await signInWithEmailAndPassword(auth, email, password);  
      
      // Generate a unique company ID with proper padding
      // First get a timestamp-based ID component for uniqueness
      const timestamp = Date.now().toString().slice(-6);
      // Create a random component
      const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      // Combine for a unique ID with proper format
      const newCompanyId = `${randomPart}${timestamp.slice(-3)}`;
    
      // Save user data to Firestore
      const trialStartDate = new Date();
      const trialEndDate = new Date(trialStartDate);
      trialEndDate.setDate(trialEndDate.getDate() + 7);
      
      // Create a new company document in Firestore
      await setDoc(doc(firestore, "companies", newCompanyId), {
        id: newCompanyId,
        name: companyName,
        apiUrl: "https://juta.ngrok.app",
        whapiToken: "", // Initialize with any default values you need
        trialStartDate: trialStartDate,
        trialEndDate: trialEndDate,
      });

      await setDoc(doc(firestore, "user", user.email!), {
        name: name,
        company: companyName,
        email: user.email!,
        role: "1",
        companyId: newCompanyId,
        phone: 0,
        phoneNumber: formatPhoneNumber(phoneNumber),
        plan: selectedPlan,
        trialStartDate: trialStartDate,
        trialEndDate: trialEndDate,
        employeeId: employeeId || null,
        notes: notes || null,
        quotaLeads: quotaLeads || 0,
        invoiceNumber: invoiceNumber || null,
        weightage: weightage || 0,
      });

      // Save user data under the new company's employee collection
      await setDoc(doc(firestore, `companies/${newCompanyId}/employee`, user.email!), {
        name: name,
        email: user.email!,
        role: "1",
        phoneNumber: formatPhoneNumber(phoneNumber),

        employeeId: employeeId || null,
        notes: notes || null,
        quotaLeads: quotaLeads || 0,
        invoiceNumber: invoiceNumber || null,
        weightage: weightage || 0,
      });
   
      if (!user) {
        console.error("User not authenticated");
      }
      const docUserRef = doc(firestore, 'user', user?.email!);
      const docUserSnapshot = await getDoc(docUserRef);
      if (!docUserSnapshot.exists()) {
        
        return;
      }
      const dataUser = docUserSnapshot.data();
      const companyId = dataUser.companyId;
      const docRef = doc(firestore, 'companies', companyId);
      const docSnapshot = await getDoc(docRef);
      if (!docSnapshot.exists()) {
        
        return;
      }
      const data2 = docSnapshot.data();
      const baseUrl = data2.apiUrl || 'https://mighty-dane-newly.ngrok-free.app';
      const response2 = await axios.post(`${baseUrl}/api/channel/create/${newCompanyId}`);

      

      // Sign in the user after successful registration
      navigate('/loading');

      // Navigate to the dashboard or home page
   

      toast.success("Registration successful!");

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.response?.data || error.message);
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
    }
  };

  const handleKeyDown = (event: { key: string; }) => {
    if (event.key === "Enter") {
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
      <div className="min-h-screen bg-primary xl:bg-white dark:bg-darkmode-800 xl:dark:bg-darkmode-600 flex flex-col">
        <ThemeSwitcher />
        <div className="flex-1 flex items-center justify-center p-5">
          <div className="w-full max-w-[1100px] mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Logo Section */}
              <div className="hidden xl:flex flex-col justify-center items-center">
                <img
                  alt="Juta Software Logo"
                  className="w-[80%]"
                  src={logoUrl}
                />
              </div>

              {/* Form Section */}
              <div className="bg-white dark:bg-darkmode-600 rounded-md shadow-md p-8 xl:bg-transparent xl:shadow-none">
                <h2 className="text-2xl font-bold text-center xl:text-3xl xl:text-left mb-8">
                  Sign Up
                </h2>
                
                <div className="space-y-4">
                  <FormInput
                    type="text"
                    className="w-full px-4 py-3"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <FormInput
                    type="text"
                    className="w-full px-4 py-3"
                    placeholder="Company Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <div className="flex gap-2">
                  
                    <FormInput
                      type="tel"
                      className="block px-4 py-3 mt-4 intro-x min-w-full xl:min-w-[350px]"
                      placeholder={`Phone Number (e.g., ${getCountryCallingCode(selectedCountry)}123456789)`}
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                
                  <FormInput
                    type="text"
                    className="w-full px-4 py-3"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  
                  <FormInput
                    type="password"
                    className="w-full px-4 py-3"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                
                  {/* New Plan Selection Section */}
                  <div className="grid grid-cols-1 gap-2 mt-4 md:grid-cols-2">
                    {[
                      ['blaster', 'Team Inbox', '50'],
                      ['enterprise', 'Standard AI', '168'],
                      ['unlimited', 'Unlimited', '688']
                    ].map(([id, name, price]) => (
                      <div 
                        key={id}
                        className={clsx(
                          "p-2 border rounded cursor-pointer",
                          selectedPlan === id ? 'border-primary bg-primary/10' : 'border-gray-200'
                        )}
                        onClick={() => setSelectedPlan(id as 'blaster' | 'enterprise')}
                      >
                        <div className="text-sm font-bold">{name}</div>
                
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex flex-col xl:flex-row gap-3">
                  <Button
                    variant="primary"
                    className="w-full xl:w-32"
                    onClick={handleRegister}
                  >
                    Register
                  </Button>
                  <Link to="/login" className="w-full xl:w-32">
                    <Button
                      variant="outline-secondary"
                      className="w-full"
                    >
                      Back to Login
                    </Button>
                  </Link>
                </div>

                {registerResult && (
                  <div className="mt-5 text-center text-red-500">{registerResult}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
}

export default Main;