"use client";

import { useState, useEffect } from "react";
import { useUpProvider } from "./components/providers/upProvider";
import { LandingPage } from "./components/LandingPage";
import { NoteDashboard } from "./components/NoteDashboard";
import { LoadingScreen } from "./components/LoadingScreen";

export default function Home() {
  const { walletConnected, isMiniApp, isInitializing } = useUpProvider();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || isInitializing) {
    return <LoadingScreen />;
  }

  if (!isMiniApp) {
    return <LandingPage />;
  }

  if (!walletConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Connect your wallet to use Notes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You need to connect your Universal Profile to create and manage notes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden">
      <NoteDashboard />
    </div>
  );
}
