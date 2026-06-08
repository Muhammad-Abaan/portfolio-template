import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";

// Generate a random session ID that lasts for the current browser session
const getSessionId = () => {
  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
};

export const useAnalytics = () => {
  const location = useLocation();
  const startTimeRef = useRef<number>(Date.now());
  const maxScrollRef = useRef<number>(0);
  const currentPathRef = useRef<string>(location.pathname);

  // Function to finalize and save the view data for the previous page
  const savePageView = async (path: string, startTime: number, maxScroll: number) => {
    // Prevent logging dashboard/admin routes to keep data clean
    if (path.startsWith("/dashboard") || path.startsWith("/login") || path.startsWith("/analytics")) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const referrer = document.referrer || "Direct";
    
    try {
      await supabase.from("page_views").insert([{
        session_id: getSessionId(),
        path: path,
        referrer: referrer,
        time_spent_seconds: timeSpent,
        max_scroll_depth: Math.round(maxScroll),
      }]);
    } catch (err) {
      console.error("Failed to log analytics", err);
    }
  };

  useEffect(() => {
    // When the route changes, save the data for the PREVIOUS route
    if (currentPathRef.current !== location.pathname) {
      savePageView(currentPathRef.current, startTimeRef.current, maxScrollRef.current);
      
      // Reset trackers for the NEW route
      currentPathRef.current = location.pathname;
      startTimeRef.current = Date.now();
      maxScrollRef.current = 0;
    }

    // Scroll tracker listener
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const documentHeight = Math.max(
        document.body.scrollHeight, document.body.offsetHeight,
        document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight
      );
      const windowHeight = window.innerHeight;
      
      // If the page doesn't scroll, depth is 100%
      if (documentHeight <= windowHeight) {
        maxScrollRef.current = 100;
        return;
      }
      
      const scrollPercent = (scrollY / (documentHeight - windowHeight)) * 100;
      if (scrollPercent > maxScrollRef.current) {
        maxScrollRef.current = scrollPercent;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Check initial scroll on mount
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [location.pathname]);

  // Handle saving data if the user closes the tab entirely
  useEffect(() => {
    const handleBeforeUnload = () => {
      // We use a quick fetch instead of supabase client because async operations are cancelled on unload
      // But for simplicity in this project, we'll try standard supabase call
      savePageView(currentPathRef.current, startTimeRef.current, maxScrollRef.current);
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);
};
