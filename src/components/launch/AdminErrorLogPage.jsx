import { useState, useEffect } from "react";
import AdminPipelineLookup from "./AdminPipelineLookup";
import { getCreators, getThreads, pollInboxReplies, sendDirectEmail } from "../../services/opsApi";
import { updatePageSEO } from "../../utils/seo";
import { ShieldAlert, ExternalLink, RefreshCw, Rocket, CheckCircle, AlertCircle, X } from "lucide-react";

export default function AdminErrorLogPage() {
  const [creators, setCreators] = useState([]);
  const [realThreads, setRealThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    updatePageSEO({
      title: "Pipeline Intelligence & Exception Logs | Creator Forge",
      description: "Real-time error monitoring, scraper audit trails, and API diagnostics for Creator Forge platform.",
      image: "/og-image.svg"
    });
  }, []);

  const notify = (type, title, message) => {
    setToast({ type, title, message, id: Date.now() });
    setTimeout(() => setToast(null), 5000);
  };

  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [creatorsRes, threadsRes] = await Promise.allSettled([
        getCreators({ limit: 100 }),
        getThreads(),
      ]);

      if (creatorsRes.status === "fulfilled" && creatorsRes.value) {
        const rawList = Array.isArray(creatorsRes.value)
          ? creatorsRes.value
          : creatorsRes.value?.creators || [];
        setCreators(rawList);
      }
      if (threadsRes.status === "fulfilled" && threadsRes.value) {
        setRealThreads(Array.isArray(threadsRes.value) ? threadsRes.value : []);
      }
    } catch (err) {
      console.warn("[AdminErrorLogPage] Data load error:", err);
      if (!isSilent) {
        notify("error", "Sync Error", "Failed to retrieve pipeline error logs from database.");
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSyncImap = async () => {
    setIsSyncing(true);
    try {
      const res = await pollInboxReplies();
      const threads = res?.threads || (await getThreads());
      if (threads && Array.isArray(threads)) {
        setRealThreads(threads);
      }
      await loadData(true);
      notify("success", "Audit Completed", "Successfully scanned IMAP and updated exception logs.");
    } catch (err) {
      console.warn("[AdminErrorLogPage] IMAP scan error:", err);
      notify("error", "Scan Failed", "Could not connect to inbox IMAP listener.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTriggerFollowUp = async (creator) => {
    try {
      const email = creator.email || creator.email_public;
      if (!email) {
        notify("error", "Missing Email", "This creator has no email address configured.");
        return;
      }
      notify("info", "Dispatching Follow-Up", `Sending follow-up message to ${creator.name || creator.handle}...`);
      await sendDirectEmail(
        email,
        `Quick check-in regarding software partnership — ${creator.name || creator.display_name || creator.handle}`,
        `Hi ${creator.name || creator.display_name || "there"},\n\nJust following up on our previous note about engineering a custom software venture for your audience with zero upfront cost.\n\nLet us know if you'd like to see the preliminary build plan!\n\nBest,\nCreator Forge Team`,
        creator.id
      );
      await loadData(true);
      notify("success", "Follow-Up Dispatched", `Follow-up email delivered to ${email}.`);
    } catch (err) {
      console.warn("Follow-up error:", err);
      notify("error", "Dispatch Failed", err.message || "Failed to deliver follow-up.");
    }
  };

  return (
    <div className="min-h-screen bg-[#090b0e] text-slate-100 font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="h-14 border-b border-white/[0.08] bg-[#0d0f14]/95 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => (window.location.href = "/launch")}
          >
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center group-hover:border-purple-500/50 transition-colors">
              <Rocket className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight text-sm">
                Creator Forge
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                AUDIT LOGS
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">
              Pipeline Intelligence & Exception Dashboard
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-mono">
              {creators.length} Audited Leads
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleSyncImap}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            title="Poll Gmail IMAP for incoming replies and exceptions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span className="hidden xs:inline">Run Audit Scan</span>
          </button>

          <button
            type="button"
            onClick={() => window.open("/launch", "_blank")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            <span>Open Launch OS</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <RefreshCw className="w-8 h-8 text-rose-400 animate-spin" />
            <p className="text-sm font-semibold text-slate-400 font-mono">
              Auditing Pipeline & Exception Logs in PostgreSQL...
            </p>
          </div>
        ) : (
          <AdminPipelineLookup
            isPage={true}
            creators={creators}
            realThreads={realThreads}
            onSelectCreator={(creatorId) => {
              window.open(`/launch?section=section1&step=4&creator=${creatorId}`, "_blank");
            }}
            onTriggerFollowUp={handleTriggerFollowUp}
            onSyncImap={handleSyncImap}
            isSyncing={isSyncing}
            onNotify={notify}
          />
        )}
      </main>

      {/* Floating Global Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] pointer-events-auto">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl ${
              toast.type === "success"
                ? "bg-[#0b1b13]/95 border-emerald-500/30 text-emerald-300"
                : toast.type === "error"
                ? "bg-[#1f0e12]/95 border-rose-500/30 text-rose-300"
                : "bg-[#0f1422]/95 border-blue-500/30 text-blue-300"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <div className="text-xs">
              <p className="font-bold text-white">{toast.title}</p>
              <p className="opacity-90">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white p-1 ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
