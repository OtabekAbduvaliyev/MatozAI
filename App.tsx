/**
 * Sadoo - Ovozli Yordamchi
 * Authors: Musayev Doniyor, Abduvaliyev Otabek
 */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FC, ReactNode } from "react";
import Home from "./Home";
import AuthScreen from "./components/AuthScreen";
import GoogleCallback from "./components/GoogleCallback";
import { authService } from "./services/authService";

const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? children : <Navigate to="/auth" />;
};

const App: FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthScreen />} />
        <Route path="/auth/callback/google" element={<GoogleCallback />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
