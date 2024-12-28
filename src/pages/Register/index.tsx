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
  const [registerResult, setRegisterResult] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'blaster' | 'enterprise' | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('MY');

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
        console.log('No such document!');
        return;
      }
      const dataUser = docUserSnapshot.data();
      const companyId = dataUser.companyId;
      const docRef = doc(firestore, 'companies', companyId);
      const docSnapshot = await getDoc(docRef);
      if (!docSnapshot.exists()) {
        console.log('No such document!');
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

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await signInWithEmailAndPassword(auth, email, password);  
      // Fetch the current number of companies to generate a new company ID
      const querySnapshot = await getDocs(collection(firestore, "companies"));
      const companyCount = querySnapshot.size;
      const newCompanyId = `0${companyCount + 1}`;
    // Save user data to Firestore
    const trialStartDate = new Date();
    const trialEndDate = new Date(trialStartDate);
    trialEndDate.setDate(trialEndDate.getDate() + 7);
      // Create a new company document in Firestore
      await setDoc(doc(firestore, "companies", newCompanyId), {
        id: newCompanyId,
        name: companyName,
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
        phone: formatPhoneNumber(phoneNumber),
        phoneNumber: formatPhoneNumber(phoneNumber),
        plan: selectedPlan,
        trialStartDate: trialStartDate,
        trialEndDate: trialEndDate,
      });

      // Save user data under the new company's employee collection
      await setDoc(doc(firestore, `companies/${newCompanyId}/employee`, user.email!), {
        name: name,
        email: user.email!,
        role: "1",
        phoneNumber: formatPhoneNumber(phoneNumber),


      });
   
      if (!user) {
        console.error("User not authenticated");
      }
      const docUserRef = doc(firestore, 'user', user?.email!);
      const docUserSnapshot = await getDoc(docUserRef);
      if (!docUserSnapshot.exists()) {
        console.log('No such document!');
        return;
      }
      const dataUser = docUserSnapshot.data();
      const companyId = dataUser.companyId;
      const docRef = doc(firestore, 'companies', companyId);
      const docSnapshot = await getDoc(docRef);
      if (!docSnapshot.exists()) {
        console.log('No such document!');
        return;
      }
      const data2 = docSnapshot.data();
      const baseUrl = data2.apiUrl || 'https://mighty-dane-newly.ngrok-free.app';
      const response2 = await axios.post(`${baseUrl}/api/channel/create/${newCompanyId}`);

      console.log(response2);

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
                  
                  {/* Phone input group */}
                  <div className="flex gap-2">
                    <select
                      className="w-[180px] px-4 py-3 bg-white border rounded dark:bg-darkmode-600 dark:border-darkmode-400"
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value as CountryCode)}
                    >
                      {getCountries().map((country) => (
                        <option key={country} value={country}>
                          {new Intl.DisplayNames(['en'], { type: 'region' }).of(country)} (+{getCountryCallingCode(country)})
                        </option>
                      ))}
                    </select>
                    <FormInput
                      type="tel"
                      className="flex-1 px-4 py-3"
                      placeholder="Phone Number (e.g., 123456789)"
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