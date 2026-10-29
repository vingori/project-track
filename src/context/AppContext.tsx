"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserRole } from "@/types";

interface AppContextType {
  currentProjectKey: string;
  setCurrentProjectKey: (key: string) => void;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  selectedIssueId: string | null;
  setSelectedIssueId: (id: string | null) => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentProjectKey, setCurrentProjectKey] = useState<string>("CORE");
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("ADMIN");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  // Global hotkey 'c' for Create Issue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        setIsCreateModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Real-time live synchronization stream (Server-Sent Events)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/events");
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data?.type) {
            setRefreshKey((k) => k + 1);
          }
        } catch {
          // Ignore non-json pings
        }
      };
    } catch (err) {
      console.warn("Real-time SSE not supported or unavailable:", err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentProjectKey,
        setCurrentProjectKey,
        currentUserRole,
        setCurrentUserRole,
        isCreateModalOpen,
        setIsCreateModalOpen,
        selectedIssueId,
        setSelectedIssueId,
        refreshKey,
        triggerRefresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
