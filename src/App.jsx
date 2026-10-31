import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import ScrollToTop from '@/components/ScrollToTop';
import PageNotFound from '@/lib/PageNotFound';
import { queryClientInstance } from '@/lib/query-client';
import Home from '@/pages/Home';
import Progress from '@/pages/Progress';
import WeekDetail from '@/pages/WeekDetail';
import PhaseDetail from '@/pages/PhaseDetail';
import SkillTree from '@/pages/SkillTree';
import HabitsDetail from '@/pages/HabitsDetail';
import MuscleBalanceDetail from '@/pages/MuscleBalanceDetail';
import PersonalRecords from '@/pages/PersonalRecords';
import Plan from '@/pages/Plan';
import Build from '@/pages/Build';
import Profile from '@/pages/Profile';
import ExerciseDetail from '@/pages/ExerciseDetail';
import WorkoutSession from '@/pages/WorkoutSession';
import WorkoutSummary from '@/pages/WorkoutSummary';
import PhaseComplete from '@/pages/PhaseComplete';
import History from '@/pages/History';
import SessionDetail from '@/pages/SessionDetail';

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/progress/week" element={<WeekDetail />} />
        <Route path="/progress/phase" element={<PhaseDetail />} />
        <Route path="/progress/skills" element={<SkillTree />} />
        <Route path="/progress/habits" element={<HabitsDetail />} />
        <Route path="/progress/muscle-balance" element={<MuscleBalanceDetail />} />
        <Route path="/progress/records" element={<PersonalRecords />} />
        <Route path="/progress/exercise/:id" element={<ExerciseDetail />} />
        <Route path="/history" element={<History />} />
        <Route path="/history/:id" element={<SessionDetail />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/build" element={<Build />} />
        <Route path="/build/exercise/:id" element={<ExerciseDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/workout" element={<WorkoutSession />} />
        <Route path="/summary" element={<WorkoutSummary />} />
        <Route path="/phase-complete" element={<PhaseComplete />} />
      </Route>
      {/* Redirect old account routes to the standalone app. */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <BrowserRouter>
        <ScrollToTop />
        <AppRoutes />
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
