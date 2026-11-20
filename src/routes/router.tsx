import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../layouts/AppShell";
import { AttemptDetailPage } from "../pages/AttemptDetailPage";
import { BaselinePage } from "../pages/BaselinePage";
import { DashboardPage } from "../pages/DashboardPage";
import { HistoryPage } from "../pages/HistoryPage";
import { HomePage } from "../pages/HomePage";
import { QuestionBankPage } from "../pages/QuestionBankPage";
import { QuizResultsPage } from "../pages/QuizResultsPage";
import { QuizRunPage } from "../pages/QuizRunPage";
import { QuizSetupPage } from "../pages/QuizSetupPage";
import { TopicDetailPage } from "../pages/TopicDetailPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="baseline" element={<BaselinePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="topics/:topicId" element={<TopicDetailPage />} />
          <Route path="quiz/setup" element={<QuizSetupPage />} />
          <Route path="quiz/run/:attemptId" element={<QuizRunPage />} />
          <Route path="quiz/results/:attemptId" element={<QuizResultsPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="history/:attemptId" element={<AttemptDetailPage />} />
          <Route path="questions" element={<QuestionBankPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
