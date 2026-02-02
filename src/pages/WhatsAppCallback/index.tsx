import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const WhatsAppCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Processing WhatsApp connection...");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    console.log("WhatsApp callback received:", { code, state, error });

    if (error) {
      setStatus("error");
      setMessage(errorDescription || error || "Authorization failed");
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("No authorization code received");
      return;
    }

    // Verify state matches (CSRF protection)
    const savedState = sessionStorage.getItem("whatsapp_signup_state");
    if (state && savedState && state !== savedState) {
      setStatus("error");
      setMessage("State mismatch - possible security issue");
      return;
    }

    // Clear the saved state
    sessionStorage.removeItem("whatsapp_signup_state");

    // Send the code back to the opener window
    if (window.opener && window.opener.handleWhatsAppSignupCallback) {
      console.log("Sending code to opener window");
      window.opener.handleWhatsAppSignupCallback(code);
      setStatus("success");
      setMessage("WhatsApp connection initiated! This window will close...");
      
      // Close the popup after a short delay
      setTimeout(() => {
        window.close();
      }, 1500);
    } else {
      // If no opener, we might be in a redirect flow instead of popup
      setStatus("error");
      setMessage("Please close this window and try again from the settings page.");
    }
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
        {status === "processing" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">
              Connecting WhatsApp Business
            </h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        
        {status === "success" && (
          <>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-green-800 mb-2">
              Success!
            </h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        
        {status === "error" && (
          <>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-red-800 mb-2">
              Connection Failed
            </h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 transition-colors"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default WhatsAppCallback;
