import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function AuthShell({ title, subtitle, action, wide = false, children }) {
  return (
    <div className="admin-theme min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 relative font-sans selection:bg-blue-600 selection:text-white">
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none" />

      <div
        className={`${
          wide ? 'max-w-3xl' : 'max-w-md'
        } w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-8 sm:p-10 relative z-10`}
      >
        <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img
                src="/CUI%20Logo.png"
                alt="COMSATS University Islamabad"
                className="h-10 w-10 object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">{title}</h1>
              <p className="text-xs text-slate-500 font-medium">{subtitle || "CITE '26 · CUI Abbottabad"}</p>
            </div>
          </div>
          {action}
        </div>

        {children}
      </div>
    </div>
  );
}

export function AuthAlert({ type = 'error', children }) {
  const isError = type === 'error';
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      className={`mb-5 p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-fadeIn ${
        isError
          ? 'bg-rose-50 border border-rose-200 text-rose-700'
          : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
      }`}
    >
      <Icon
        className={`w-4 h-4 flex-shrink-0 ${isError ? 'text-rose-600' : 'text-emerald-600'}`}
        aria-hidden="true"
      />
      <span>{children}</span>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
