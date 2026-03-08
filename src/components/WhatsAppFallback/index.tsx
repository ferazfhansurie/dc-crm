import React, { useState, useEffect, useRef, useCallback } from "react";
import Lucide from "@/components/Base/Lucide";
import Button from "@/components/Base/Button";
import { toast } from "react-toastify";

interface WhatsAppFallbackProps {
  companyId: string;
  serverUrl?: string;
}

type SessionStatus = "none" | "connecting" | "qr" | "ready" | "error" | "disconnected";

function WhatsAppFallback({ companyId, serverUrl = "wss://bisnesgpt.jutateknologi.com" }: WhatsAppFallbackProps) {
  const [status, setStatus] = useState<SessionStatus>("none");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Check initial status via REST
  useEffect(() => {
    const httpUrl = serverUrl.replace("wss://", "https://").replace("ws://", "http://");
    fetch(`${httpUrl}/api/whatsapp/ephemeral/status/${companyId}`)
      .then(res => res.json())
      .then(data => {
        if (data.connected) {
          setStatus("ready");
          setPhoneNumber(data.phoneNumber || null);
        }
      })
      .catch(() => {/* ignore */});
  }, [companyId, serverUrl]);

  const connectWebSocket = useCallback(() => {
    const userEmail = localStorage.getItem("userEmail") || "admin";
    const wsUrl = `${serverUrl}/ws/${userEmail}/${companyId}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Request ephemeral session
      ws.send(JSON.stringify({
        type: "ephemeral_connect",
        companyId,
      }));
      setStatus("connecting");
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "ephemeral_qr":
            setStatus("qr");
            setQrCode(data.qrCode);
            break;
          case "ephemeral_ready":
            setStatus("ready");
            setPhoneNumber(data.phoneNumber);
            setQrCode(null);
            toast.success("WhatsApp Fallback Connected!");
            break;
          case "ephemeral_error":
            setStatus("error");
            setError(data.error);
            toast.error(data.error || "Connection failed");
            break;
          case "ephemeral_disconnected":
            setStatus("disconnected");
            setQrCode(null);
            setPhoneNumber(null);
            toast.warn("WhatsApp Fallback Disconnected");
            break;
          case "notification":
            if (data.level === "error" && data.title?.includes("24h")) {
              toast.error(data.message, { autoClose: 10000 });
            }
            break;
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    ws.onerror = () => {
      setStatus("error");
      setError("WebSocket connection failed");
    };

    ws.onclose = () => {
      if (status === "ready" || status === "qr" || status === "connecting") {
        setStatus("disconnected");
      }
    };
  }, [companyId, serverUrl, status]);

  const handleConnect = () => {
    setError(null);
    connectWebSocket();
  };

  const handleDisconnect = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "ephemeral_disconnect",
        companyId,
      }));
    }
    setStatus("none");
    setQrCode(null);
    setPhoneNumber(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        // Don't destroy session on unmount — it stays alive on server
        // Only close the WebSocket reference
        wsRef.current.close();
      }
    };
  }, []);

  const statusConfig = {
    none: { color: "slate", icon: "Link" as const, label: "Not Connected" },
    connecting: { color: "blue", icon: "Loader" as const, label: "Connecting..." },
    qr: { color: "amber", icon: "QrCode" as const, label: "Scan QR Code" },
    ready: { color: "green", icon: "CheckCircle" as const, label: "Connected" },
    error: { color: "red", icon: "AlertCircle" as const, label: "Error" },
    disconnected: { color: "slate", icon: "WifiOff" as const, label: "Disconnected" },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="space-y-4">
      {/* Status indicator */}
      <div className={`bg-gradient-to-r from-${currentStatus.color}-50/50 to-${currentStatus.color}-100/30 dark:from-${currentStatus.color}-900/20 dark:to-${currentStatus.color}-800/10 backdrop-blur-xl rounded-2xl p-4 border border-${currentStatus.color}-200/40 dark:border-${currentStatus.color}-700/40`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-2 rounded-xl bg-gradient-to-br from-${currentStatus.color}-500/20 to-${currentStatus.color}-600/20 backdrop-blur-sm border border-${currentStatus.color}-200/40 dark:border-${currentStatus.color}-700/40`}>
              <Lucide icon={currentStatus.icon} className={`w-5 h-5 text-${currentStatus.color}-600 dark:text-${currentStatus.color}-400 ${status === "connecting" ? "animate-spin" : ""}`} />
            </div>
            <div>
              <span className={`text-sm font-semibold text-${currentStatus.color}-700 dark:text-${currentStatus.color}-300`}>
                {currentStatus.label}
              </span>
              {phoneNumber && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Connected as +{phoneNumber}
                </p>
              )}
              {error && (
                <p className="text-xs text-red-500 dark:text-red-400">
                  {error}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {status === "ready" && (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-medium text-green-600 dark:text-green-400">Active</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* QR Code display */}
      {status === "qr" && qrCode && (
        <div className="flex flex-col items-center space-y-3 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/40 dark:border-slate-700/40">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Scan this QR code with WhatsApp
          </p>
          <div className="bg-white p-4 rounded-2xl shadow-lg">
            <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Open WhatsApp → Settings → Linked Devices → Link a Device
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {(status === "none" || status === "disconnected" || status === "error") && (
          <Button
            variant="primary"
            onClick={handleConnect}
            className="bg-gradient-to-r from-orange-500/90 to-amber-500/90 hover:from-orange-600/90 hover:to-amber-600/90 backdrop-blur-sm border-orange-400/30 shadow-xl shadow-orange-500/30 transition-all duration-300 rounded-xl px-6 py-3 hover:scale-105 transform-gpu"
          >
            <Lucide icon="Smartphone" className="w-4 h-4 mr-2" />
            Connect WhatsApp Fallback
          </Button>
        )}
        {(status === "ready" || status === "qr" || status === "connecting") && (
          <Button
            variant="outline-danger"
            onClick={handleDisconnect}
            className="rounded-xl px-6 py-3 transition-all duration-300"
          >
            <Lucide icon="X" className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
        )}
      </div>

      {/* Info note */}
      <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-900/20 dark:to-indigo-900/10 backdrop-blur-xl rounded-2xl p-4 border border-blue-200/40 dark:border-blue-700/40">
        <div className="flex items-start space-x-3">
          <Lucide icon="Info" className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            <strong>How it works:</strong> When the 24-hour messaging window expires on Meta Cloud API,
            messages will automatically be sent through this WhatsApp connection instead.
            Keep this browser tab open while sending messages outside the 24h window.
          </div>
        </div>
      </div>
    </div>
  );
}

export default WhatsAppFallback;
