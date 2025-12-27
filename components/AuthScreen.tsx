const AuthScreen = () => {
  const handleGoogleLogin = () => {
    window.location.href = `${
      import.meta.env.VITE_API_URL
    }/auth/callback/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden transition-colors duration-300">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[60%] bg-emerald-600/5 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800 p-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 mb-6">
            {/* <Sparkles className="w-10 h-10 text-white" /> */}
            <img src="/logo-white.svg" alt="w-10 h-10 text-white" />{" "}
          </div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent mb-3">
            Sadoo
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            Ovozli yordamchingizga xush kelibsiz
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full py-4 px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 group shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Google orqali kirish
            </span>
          </button>
        </div>

        {/* <div className="mt-10 text-center">
          <p className="text-sm text-slate-400">
            Davom etish orqali siz{" "}
            <a href="#" className="text-emerald-500 hover:underline">
              Foydalanish shartlari
            </a>{" "}
            va{" "}
            <a href="#" className="text-emerald-500 hover:underline">
              Maxfiylik siyosati
            </a>
            ga rozilik bildirasiz.
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default AuthScreen;
