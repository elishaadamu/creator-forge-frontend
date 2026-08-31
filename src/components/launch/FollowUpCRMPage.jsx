import { useState, useEffect } from "react";
import CreatorFollowUpCRM from "./CreatorFollowUpCRM";
import { getCreators, getThreads, pollInboxReplies, updateCreatorDetails, deleteCreator } from "../../services/opsApi";
import { updatePageSEO } from "../../utils/seo";
import { Users, ExternalLink, RefreshCw, Rocket, ShieldCheck, CheckCircle, AlertCircle, X } from "lucide-react";

export default function FollowUpCRMPage() {
  const [creators, setCreators] = useState([]);
  const [realThreads, setRealThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncingImap, setIsSyncingImap] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    updatePageSEO({
      title: "Creator Follow-Up CRM & Inbound Replies | Creator Forge",
      description: "Directory list, audience score breakdown, AI sentiment analysis, and response tracking for partner creators.",
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
        getCreators({ limit: 50 }),
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
      console.warn("[FollowUpCRMPage] Data load error:", err);
      if (!isSilent) {
        notify("error", "Sync Error", "Failed to retrieve latest CRM data from database.");
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-poll interval every 30 seconds for background incoming replies
    const timer = setInterval(() => {
      loadData(true);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleSyncImap = async () => {
    setIsSyncingImap(true);
    try {
      const res = await pollInboxReplies();
      const threads = res?.threads || (await getThreads());
      if (threads && Array.isArray(threads)) {
        setRealThreads(threads);
      }
      await loadData(true);
      notify("success", "Inbox Synced", "Successfully scanned IMAP and updated lead classifications.");
    } catch (err) {
      console.warn("[FollowUpCRMPage] IMAP sync failed:", err);
      notify("error", "Sync Failed", "Could not connect to inbox. Check IMAP settings.");
    } finally {
      setIsSyncingImap(false);
    }
  };

  const handleApproveCreator = async (creatorId) => {
    setCreators((prev) =>
      prev.map((c) => (c.id === creatorId || c.handle === creatorId ? { ...c, status: "approved" } : c))
    );
    try {
      await updateCreatorDetails(creatorId, { status: "approved" });
      notify("success", "Lead Approved", "Creator marked as approved and ready for Step 5 product synthesis.");
    } catch (err) {
      console.warn("Approve creator failed:", err);
      notify("error", "Update Failed", "Could not persist approval to database.");
    }
  };

  const handleRejectCreator = async (creatorId) => {
    setCreators((prev) =>
      prev.map((c) => (c.id === creatorId || c.handle === creatorId ? { ...c, status: "rejected" } : c))
    );
    try {
      await updateCreatorDetails(creatorId, { status: "rejected" });
      notify("info", "Lead Rejected", "Creator archived and rejected in database.");
    } catch (err) {
      console.warn("Reject creator failed:", err);
      notify("error", "Update Failed", "Could not persist rejection to database.");
    }
  };

  const handleDeleteCreator = (creatorId) => {
    setCreators((prev) => prev.filter((c) => c.id !== creatorId && c.handle !== creatorId));
    try {
      const saved = JSON.parse(localStorage.getItem("forge_launch_discovered_creators") || "[]");
      const updated = saved.filter((c) => c.id !== creatorId && c.handle !== creatorId);
      localStorage.setItem("forge_launch_discovered_creators", JSON.stringify(updated));

      const deletedIds = JSON.parse(localStorage.getItem("forge_deleted_creator_ids") || "[]");
      if (creatorId && !deletedIds.includes(creatorId)) {
        deletedIds.push(creatorId);
        localStorage.setItem("forge_deleted_creator_ids", JSON.stringify(deletedIds));
      }
      localStorage.setItem("forge_last_deleted_timestamp", Date.now().toString());
    } catch (e) {}

    window.dispatchEvent(
      new CustomEvent("forge_creator_deleted", { detail: { creatorId } })
    );
    loadData(true);
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
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                CRM
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">
              Follow-Up & Inbound Reply Directory
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
              {creators.length} Leads
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleSyncImap}
            disabled={isSyncingImap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            title="Poll Gmail IMAP for latest creator replies"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingImap ? "animate-spin" : ""}`} />
            <span className="hidden xs:inline">Sync Inbox</span>
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
            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
            <p className="text-sm font-semibold text-slate-400 font-mono">
              Connecting to PostgreSQL & Loading CRM Leads...
            </p>
          </div>
        ) : (
          <CreatorFollowUpCRM
            isPage={true}
            creators={creators}
            realThreads={realThreads}
            onSelectCreator={(creatorId, targetStep) => {
              if (targetStep === "section2" || targetStep === 7) {
                window.open(`/launch?section=section2&creator=${encodeURIComponent(creatorId)}`, "_blank");
              } else {
                window.open(`/launch?section=section1&step=${targetStep || 5}&creator=${encodeURIComponent(creatorId)}`, "_blank");
              }
            }}
            onSyncImap={handleSyncImap}
            isSyncingImap={isSyncingImap}
            onApproveCreator={handleApproveCreator}
            onRejectCreator={handleRejectCreator}
            onDeleteCreator={handleDeleteCreator}
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
