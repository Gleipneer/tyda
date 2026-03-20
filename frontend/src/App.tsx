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
import ConceptsPage from "./pages/ConceptsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ActivityPage from "./pages/ActivityPage";
import AboutDatabasePage from "./pages/AboutDatabasePage";
import NotFound from "./pages/NotFound";
import RequireAdmin from "@/components/RequireAdmin";
import AdminOverviewPage from "./pages/admin/AdminOverviewPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminPostsPage from "./pages/admin/AdminPostsPage";
import AdminConceptsPage from "./pages/admin/AdminConceptsPage";
import AdminDatabaseQueriesPage from "./pages/admin/AdminDatabaseQueriesPage";
import EditPostPage from "./pages/EditPostPage";

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
            <Route path="/posts/:id/edit" element={<RequireActiveUser><EditPostPage /></RequireActiveUser>} />
            <Route path="/posts/:id" element={<RequireActiveUser><PostDetailPage /></RequireActiveUser>} />
            <Route path="/new-post" element={<RequireActiveUser><NewPostPage /></RequireActiveUser>} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminOverviewPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/anvandare"
              element={
                <RequireAdmin>
                  <AdminUsersPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/poster"
              element={
                <RequireAdmin>
                  <AdminPostsPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/begrepp"
              element={
                <RequireAdmin>
                  <AdminConceptsPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/databasfragor"
              element={
                <RequireAdmin>
                  <AdminDatabaseQueriesPage />
                </RequireAdmin>
              }
            />
            <Route path="/concepts" element={<ConceptsPage />} />
            <Route path="/analytics" element={<RequireActiveUser><AnalyticsPage /></RequireActiveUser>} />
            <Route path="/activity" element={<RequireActiveUser><ActivityPage /></RequireActiveUser>} />
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
