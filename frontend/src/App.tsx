import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ActiveUserProvider } from "@/contexts/ActiveUserContext";
import RequireActiveUser from "@/components/RequireActiveUser";
import LandingPage from "./pages/LandingPage";
import MyRoomPage from "./pages/MyRoomPage";
import ExplorePage from "./pages/ExplorePage";
import PostsPage from "./pages/PostsPage";
import NewPostPage from "./pages/NewPostPage";
import PostDetailPage from "./pages/PostDetailPage";
import PostInterpretationPage from "./pages/PostInterpretationPage";
import ConceptsPage from "./pages/ConceptsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ActivityPage from "./pages/ActivityPage";
import AdminPage from "./pages/AdminPage";
import AboutDatabasePage from "./pages/AboutDatabasePage";
import NotFound from "./pages/NotFound";
import RequireAdminUser from "@/components/RequireAdminUser";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ActiveUserProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/mitt-rum"
              element={
                <RequireActiveUser>
                  <MyRoomPage />
                </RequireActiveUser>
              }
            />
            <Route path="/utforska" element={<ExplorePage />} />
            <Route path="/utforska/:id" element={<PostDetailPage />} />
            <Route path="/posts" element={<RequireActiveUser><PostsPage /></RequireActiveUser>} />
            <Route
              path="/posts/:id/tolkning"
              element={
                <RequireActiveUser>
                  <PostInterpretationPage />
                </RequireActiveUser>
              }
            />
            <Route path="/posts/:id" element={<RequireActiveUser><PostDetailPage /></RequireActiveUser>} />
            <Route path="/new-post" element={<RequireActiveUser><NewPostPage /></RequireActiveUser>} />
            <Route path="/concepts" element={<ConceptsPage />} />
            <Route path="/analytics" element={<RequireActiveUser><AnalyticsPage /></RequireActiveUser>} />
            <Route path="/activity" element={<RequireActiveUser><ActivityPage /></RequireActiveUser>} />
            <Route
              path="/admin"
              element={
                <RequireActiveUser>
                  <RequireAdminUser>
                    <AdminPage />
                  </RequireAdminUser>
                </RequireActiveUser>
              }
            />
            <Route path="/about" element={<AboutDatabasePage />} />
            <Route path="/dashboard" element={<Navigate to="/mitt-rum" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ActiveUserProvider>
  </QueryClientProvider>
);

export default App;
