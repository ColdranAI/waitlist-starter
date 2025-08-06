"use client";

import { useState, useEffect } from "react";
import { getWaitlistStats } from "../app/actions";

interface WaitlistStatsProps {
  forceRefresh?: boolean;
}

export function WaitlistStats({ forceRefresh }: WaitlistStatsProps) {
  const [totalMembers, setTotalMembers] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      // Show updating state if we already have data
      if (totalMembers !== null) {
        setIsUpdating(true);
      }

      try {
        console.log("Fetching waitlist stats...");
        const result = await getWaitlistStats();
        console.log("Stats result:", result);

        if (result.success && result.data) {
          setTotalMembers(result.data.totalEntries);
          setError(null); // Clear any previous errors
          console.log("Stats updated to:", result.data.totalEntries);
        } else {
          console.warn("Stats fetch returned non-success:", result);
          // Don't set error here, just keep the previous value
        }
      } catch (err) {
        console.error("Stats fetch error:", err);
        // Don't hide the component on error, just log it
      } finally {
        setLoading(false);
        setIsUpdating(false);
      }
    }

    fetchStats();
  }, []); // Remove forceRefresh from dependencies since we're using key prop

  if (loading) {
    return (
      <div className="pl-2 text-sm text-gray-600 flex items-center gap-1">
        <div className="animate-pulse bg-gray-300 h-5 w-5 rounded"></div>people
        joined
      </div>
    );
  }

  // Always show something, even if there's an error or null data
  const displayCount = totalMembers ?? 0;

  return (
    <div className="pl-2 text-sm text-gray-600">
      <p>
        <span
          className={`font-semibold text-gray-900 transition-all duration-300 ${
            isUpdating ? "animate-pulse text-green-600" : ""
          }`}
        >
          {displayCount.toLocaleString()}
        </span>{" "}
        people joined
        {isUpdating && (
          <span className="ml-1 text-green-600 animate-pulse">↗</span>
        )}
        {error && (
          <span className="ml-2 text-xs text-gray-400">(updating...)</span>
        )}
      </p>
    </div>
  );
}
