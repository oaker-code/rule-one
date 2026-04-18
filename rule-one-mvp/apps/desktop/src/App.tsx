import { useEffect, useMemo, useState } from "react";

import "./App.css";
import { initDatabase } from "./lib/db";
import type { ReviewResult, ReviewSupervisorInput } from "./lib/pipeline/types";
import DailyReviewPage from "./pages/DailyReviewPage";
import HistoryPage from "./pages/HistoryPage";
import HomePage from "./pages/HomePage";
import ModelSettingsPage from "./pages/ModelSettingsPage";
import ResultPage from "./pages/ResultPage";

function App() {
  const [draftInput, setDraftInput] = useState<ReviewSupervisorInput | null>(null);
  const [draftResult, setDraftResult] = useState<ReviewResult | null>(null);
  const [databaseError, setDatabaseError] = useState("");

  useEffect(() => {
    void initDatabase().catch((error) => {
      console.error("Rule One database init failed:", error);
      setDatabaseError(
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Database init failed.",
      );
    });
  }, []);

  const route = useHashRoute();

  const selectedHistorySessionId = useMemo(() => {
    if (!route.startsWith("/history")) {
      return null;
    }

    const [, query] = route.split("?");
    return new URLSearchParams(query ?? "").get("sessionId");
  }, [route]);

  function navigate(nextRoute: string) {
    window.location.hash = nextRoute;
  }

  function handleReviewComplete(input: ReviewSupervisorInput, result: ReviewResult) {
    setDraftInput(input);
    setDraftResult(result);
    navigate("/result");
  }

  return (
    <>
      {databaseError ? <div className="banner-error">Database error: {databaseError}</div> : null}
      {renderRoute({
        route,
        draftInput,
        draftResult,
        selectedHistorySessionId,
        navigate,
        onReviewComplete: handleReviewComplete,
      })}
    </>
  );
}

export default App;

function useHashRoute(): string {
  const [route, setRoute] = useState(readHashRoute());

  useEffect(() => {
    function handleHashChange() {
      setRoute(readHashRoute());
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return route;
}

function readHashRoute(): string {
  const route = window.location.hash.replace(/^#/, "");
  return route || "/";
}

function renderRoute({
  route,
  draftInput,
  draftResult,
  selectedHistorySessionId,
  navigate,
  onReviewComplete,
}: {
  route: string;
  draftInput: ReviewSupervisorInput | null;
  draftResult: ReviewResult | null;
  selectedHistorySessionId: string | null;
  navigate: (route: string) => void;
  onReviewComplete: (input: ReviewSupervisorInput, result: ReviewResult) => void;
}) {
  if (route.startsWith("/history")) {
    return (
      <HistoryPage
        selectedSessionId={selectedHistorySessionId}
        onBackHome={() => navigate("/")}
        onOpenSettings={() => navigate("/settings")}
      />
    );
  }

  switch (route) {
    case "/daily-review":
      return <DailyReviewPage onBackHome={() => navigate("/")} onReviewComplete={onReviewComplete} />;
    case "/result":
      return (
        <ResultPage
          draftInput={draftInput}
          draftResult={draftResult}
          onBackHome={() => navigate("/")}
          onViewHistory={(sessionId) => navigate(sessionId ? `/history?sessionId=${sessionId}` : "/history")}
        />
      );
    case "/settings":
      return <ModelSettingsPage onBackHome={() => navigate("/")} />;
    case "/":
    default:
      return (
        <HomePage
          onStartReview={() => navigate("/daily-review")}
          onOpenHistory={() => navigate("/history")}
          onOpenSettings={() => navigate("/settings")}
        />
      );
  }
}
