import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../services/authService";

const GoogleCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const processLogin = async () => {
      const accessToken = searchParams.get("accessToken");
      const refreshToken = searchParams.get("refreshToken");

      if (accessToken && refreshToken) {
        try {
          // 1. Save tokens first
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);

          // 2. Fetch user details
          const user = await authService.getCurrentUser();
          localStorage.setItem("user", JSON.stringify(user));

          // 3. Redirect to home
          // We use window.location.href to ensure a full reload/state reset if needed,
          // or navigate('/') if the app state is reactive enough.
          // Given the architecture, a reload might be safer to ensure all services init correctly.
          window.location.href = "/";
        } catch (error) {
          console.error("Failed to fetch user details", error);
          navigate("/auth?error=Failed to load user profile");
        }
      } else {
        navigate("/auth?error=Google auth failed");
      }
    };

    processLogin();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 dark:text-slate-400 font-medium">
          Tizimga kirilmoqda...
        </p>
      </div>
    </div>
  );
};

export default GoogleCallback;
