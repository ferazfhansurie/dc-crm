import React, { useState, useEffect } from "react";
import axios from "axios";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { BACKEND_URL } from "@/config/backend";
import { toast } from "react-toastify";

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: {
      init: (params: {
        appId: string;
        cookie?: boolean;
        xfbml?: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: FBLoginResponse) => void,
        options: {
          config_id: string;
          response_type: string;
          override_default_response_type: boolean;
          extras: {
            setup: Record<string, unknown>;
            featureType: string;
            sessionInfoVersion: string;
          };
        }
      ) => void;
    };
  }
}

interface FBLoginResponse {
  authResponse?: {
    code?: string;
    accessToken?: string;
  };
  status: string;
}

interface WhatsAppEmbeddedSignupProps {
  companyId: string;
  phoneIndex: number;
  onSuccess?: (data: {
    displayPhoneNumber: string;
    verifiedName?: string;
    wabaId: string;
    phoneNumberId: string;
  }) => void;
  onError?: (error: string) => void;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
}

const WhatsAppEmbeddedSignup: React.FC<WhatsAppEmbeddedSignupProps> = ({
  companyId,
  phoneIndex,
  onSuccess,
  onError,
  buttonText = "Connect WhatsApp Business",
  className = "",
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [config, setConfig] = useState<{ appId: string; configId: string } | null>(null);

  // Fetch config from backend on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_URL.apiUrl}/whatsapp/embedded-signup/config`
        );
        console.log("Embedded signup config:", response.data);
        setConfig(response.data);
      } catch (error) {
        console.error("Failed to fetch embedded signup config:", error);
        toast.error("Failed to load WhatsApp configuration");
      }
    };
    fetchConfig();
  }, []);

  // Load Facebook SDK after config is available
  useEffect(() => {
    if (!config?.appId) return;

    // Check if SDK is already loaded
    if (window.FB) {
      console.log("FB SDK already loaded, reinitializing...");
      window.FB.init({
        appId: config.appId,
        cookie: true,
        xfbml: true,
        version: "v24.0",
      });
      setSdkLoaded(true);
      return;
    }

    // Define callback for when SDK loads
    window.fbAsyncInit = function () {
      console.log("FB SDK loaded, initializing...");
      window.FB.init({
        appId: config.appId,
        cookie: true,
        xfbml: true,
        version: "v24.0",
      });
      setSdkLoaded(true);
    };

    // Load SDK script if not present
    if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, [config?.appId]);

  // Complete signup with authorization code
  const completeSignup = async (code: string) => {
    try {
      setIsLoading(true);
      const result = await axios.post(
        `${BACKEND_URL.apiUrl}/whatsapp/embedded-signup/complete`,
        { companyId, phoneIndex, code }
      );

      if (result.data.success) {
        toast.success(`WhatsApp connected: ${result.data.displayPhoneNumber}`);
        onSuccess?.({
          displayPhoneNumber: result.data.displayPhoneNumber,
          verifiedName: result.data.verifiedName,
          wabaId: result.data.wabaId,
          phoneNumberId: result.data.phoneNumberId,
        });
      } else {
        throw new Error(result.data.error || "Failed to connect");
      }
    } catch (error) {
      console.error("Signup completion error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to complete signup";
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Launch Embedded Signup - MUST be synchronous from click event for popup to work
  const launchWhatsAppSignup = () => {
    if (!window.FB) {
      toast.error("Facebook SDK not loaded. Please refresh the page.");
      return;
    }

    if (!config?.configId) {
      toast.error("Configuration not loaded. Please refresh the page.");
      return;
    }

    console.log("Launching FB.login with config_id:", config.configId);
    setIsLoading(true);

    // FB.login MUST be called directly from click handler (no await/async before it)
    // This is what makes it open as a popup instead of a new tab
    window.FB.login(
      function (response: FBLoginResponse) {
        console.log("FB.login response:", response);
        
        if (response.authResponse?.code) {
          console.log("Got authorization code, completing signup...");
          completeSignup(response.authResponse.code);
        } else {
          console.log("Login cancelled or failed:", response.status);
          setIsLoading(false);
          if (response.status === "not_authorized") {
            toast.warning("Please authorize the app to continue");
          } else {
            toast.info("Signup was cancelled");
          }
          onError?.("Signup cancelled");
        }
      },
      {
        config_id: config.configId,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "whatsapp_business_app_onboarding",
          sessionInfoVersion: "3",
        },
      }
    );
  };

  // Loading state while fetching config
  if (!config) {
    return (
      <div className="text-gray-500 text-sm flex items-center gap-2">
        <Lucide icon="Loader2" className="w-4 h-4 animate-spin" />
        Loading configuration...
      </div>
    );
  }

  // Waiting for SDK to load
  if (!sdkLoaded) {
    return (
      <Button
        variant="outline-primary"
        className={`flex items-center gap-2 ${className}`}
        disabled
      >
        <Lucide icon="Loader2" className="w-4 h-4 animate-spin" />
        Loading Facebook SDK...
      </Button>
    );
  }

  // Show disabled state if already connected
  if (disabled) {
    return (
      <Button
        variant="secondary"
        className={`flex items-center gap-2 opacity-60 cursor-not-allowed ${className}`}
        disabled
      >
        <Lucide icon="CheckCircle" className="w-4 h-4 text-green-500" />
        Already Connected
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      className={`flex items-center gap-2 ${className}`}
      onClick={launchWhatsAppSignup}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Lucide icon="Loader2" className="w-4 h-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          {buttonText}
        </>
      )}
    </Button>
  );
};

export default WhatsAppEmbeddedSignup;
