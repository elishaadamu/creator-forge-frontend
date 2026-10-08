import { useState, useEffect } from "react";
import CreatorFollowUpCRM from "./CreatorFollowUpCRM";
import { getCreators, getThreads, pollInboxReplies, updateCreatorDetails, deleteCreator, getWorkflowState, getCoLaunchProjects } from "../../services/opsApi";
import { updatePageSEO } from "../../utils/seo";
import { Users, ExternalLink, RefreshCw, Rocket, ShieldCheck, CheckCircle, AlertCircle, X, Target, Layers, Zap, MessageSquare, ShieldAlert } from "lucide-react";
import { CRMSkeleton } from "./Section2Skeletons";
import CreatorForgeLogo from "../ui/CreatorForgeLogo";
import { HeroShallowPolygons } from "../ui/FloatingPolygons";

export default function FollowUpCRMPage() {
  const [creators, setCreators] = useState([]);
  const [realThreads, setRealThreads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workflowState, setWorkflowState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncingImap, setIsSyncingImap] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
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
      const [creatorsRes, threadsRes, workflowRes, projectsRes] = await Promise.allSettled([
        getCreators({ limit: 1000 }),
        getThreads(),
        getWorkflowState(),
        getCoLaunchProjects(),
      ]);

      if (creatorsRes.status === "fulfilled" && creatorsRes.value) {
        const rawList = Array.isArray(creatorsRes.value)
          ? creatorsRes.value
          : creatorsRes.value?.creators || [];
        
        // MongoDB Atlas is the single authoritative source of truth
        setCreators(rawList);
        if (rawList.length === 0) {
          try {
            localStorage.removeItem("forge_crm_cached_creators");
            localStorage.removeItem("forge_launch_discovered_creators");
          } catch (e) { }
        }
      } else {
        setCreators([]);
      }
      if (threadsRes.status === "fulfilled" && threadsRes.value) {
        setRealThreads(Array.isArray(threadsRes.value) ? threadsRes.value : []);
      }
      if (workflowRes.status === "fulfilled" && workflowRes.value) {
        setWorkflowState(workflowRes.value);
      }
      if (projectsRes.status === "fulfilled" && projectsRes.value) {
        setProjects(Array.isArray(projectsRes.value) ? projectsRes.value : []);
      }
    } catch (err) {
      console.warn("[FollowUpCRMPage] Data load error:", err);
      setCreators([]);
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
    const target = (creators || []).find((c) => c.id === creatorId || c.handle === creatorId);
    const isAiInterested =
      target?.replyInfo?.classification === "interested" ||
      ["qualified", "interested"].includes((target?.reply_classification || target?.replyClassification || "").toLowerCase());

    if (!isAiInterested && target?.status !== "approved") {
      notify("warning", "Approval Blocked", "Creator cannot be approved until AI flags their reply as interested.");
      return;
    }

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

  const handleDeleteCreator = async (creatorId) => {
    setCreators((prev) => prev.filter((c) => c.id !== creatorId && c.handle !== creatorId));
    try {
      await deleteCreator(creatorId);
      notify("info", "Lead Deleted", "Creator permanently deleted from pipeline database.");
    } catch (err) {
      console.warn("Delete creator backend error:", err);
    }

    try {
      localStorage.removeItem("forge_crm_cached_creators");
      localStorage.removeItem("forge_launch_discovered_creators");
      const rawDeleted = (() => {
        try {
          const direct = localStorage.getItem("forge_deleted_creator_ids");
          if (!direct) return [];
          const parsed = JSON.parse(direct);
          if (Array.isArray(parsed)) return parsed;
          if (parsed && typeof parsed === "object" && Array.isArray(parsed.data)) return parsed.data;
          return [];
        } catch {
          return [];
        }
      })();
      const deletedIds = Array.isArray(rawDeleted) ? [...rawDeleted] : [];
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

  const handleDeleteAllCreators = async () => {
    if (!window.confirm("Are you sure you want to permanently delete all creators from the database? This action cannot be undone.")) {
      return;
    }
    setIsDeletingAll(true);
    setCreators([]);
    setRealThreads([]);
    try {
      localStorage.removeItem("forge_crm_cached_creators");
      localStorage.removeItem("forge_launch_discovered_creators");
      localStorage.removeItem("forge_launch_real_threads");
      localStorage.removeItem("forge_launch_pitch_sent_map");
      localStorage.removeItem("forge_launch_ai_choice_map");
      const { deleteAllCreators } = await import("../../services/opsApi");
      await deleteAllCreators();
      notify("success", "All Leads Deleted", "All creators have been deleted from MongoDB Atlas.");
    } catch (err) {
      console.warn("Delete all creators failed:", err);
      notify("error", "Delete Failed", "Failed to delete all creators from database.");
    } finally {
      setIsDeletingAll(false);
      loadData(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col overflow-x-clip w-full max-w-[100vw] relative">
      {/* Subtle Ambient Core & Linear Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-indigo-200/25 via-purple-100/20 to-transparent blur-3xl" />
        <div className="absolute top-[25%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-bl from-emerald-200/20 via-teal-100/15 to-transparent blur-3xl" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-amber-100/20 via-rose-100/15 to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-slate-100/40" />
      </div>

      {/* Shallow Asymmetrical Polygons (Strictly BEHIND the cards - z-0, pointer-events-none) */}
      <div className="absolute top-14 inset-x-0 h-[920px] pointer-events-none overflow-hidden select-none z-0" aria-hidden="true">
        <HeroShallowPolygons className="z-0" />
      </div>

      {/* Top Navbar */}
      <header className="h-14 border-b border-slate-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 relative shadow-2xs">
        <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => (window.location.href = "/launch")}
          >
            <CreatorForgeLogo size={28} showWordmark={true} theme="light" />
            <div className="hidden xl:flex items-center">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                OPERATOR STUDIO
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden md:block" />

          {/* Clean Suite Navigation Tabs (Matching /launch & /project-os) */}
          <div className="hidden md:flex items-center p-1 rounded-xl bg-slate-100/90 border border-slate-200">
            <a
              href="/launch"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer text-slate-600 hover:text-slate-950 border border-transparent hover:bg-white/60"
            >
              <Target className="w-3.5 h-3.5 text-slate-400" />
              <span>Acquisition OS</span>
            </a>
            <a
              href="/project-os"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer text-slate-600 hover:text-slate-950 hover:bg-white/60 border border-transparent"
              title="Open Dedicated Co-Launch Operations Center"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Project OS</span>
            </a>
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer bg-white text-slate-950 border border-slate-200/80 shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
              <span>Follow-Up CRM</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {creators.length}
              </span>
            </button>
            <a
              href="/participation-manager"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer text-slate-600 hover:text-slate-950 hover:bg-white/60 border border-transparent"
              title="Dedicated Creator Participation & Co-Builder Console"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Co-Builders ($50)</span>
            </a>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="/admin-error-log"
            className="hidden sm:flex items-center gap-1.5 px-2.5 h-8 rounded-xl text-xs font-semibold whitespace-nowrap bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer shadow-2xs"
            title="Open Admin Pipeline Oversight & Error Log"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>Admin Error Log</span>
          </a>

          {creators.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteAllCreators}
              disabled={isDeletingAll}
              className="flex items-center gap-1.5 px-3 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              title="Permanently wipe all creators from database"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{isDeletingAll ? "Deleting..." : `Delete All (${creators.length})`}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSyncImap}
            disabled={isSyncingImap}
            className="flex items-center gap-1.5 px-3 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Poll Gmail IMAP for latest creator replies"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingImap ? "animate-spin" : ""}`} />
            <span>{isSyncingImap ? "Syncing..." : "Sync Inbox"}</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 relative">
        {loading ? (
          <CRMSkeleton />
        ) : (
          <CreatorFollowUpCRM
            isPage={true}
            creators={creators}
            realThreads={realThreads}
            projects={projects}
            pitchSentMap={workflowState?.pitch_sent_map || {}}
            onSelectCreator={(creatorId, targetStep) => {
              if (targetStep === "section2" || targetStep === 7) {
                window.open(`/project-os?creator=${encodeURIComponent(creatorId)}`, "_blank");
              } else {
                const stepNum = Number(targetStep) || 5;
                window.open(`/launch?section=section1&step=${stepNum}&creator=${encodeURIComponent(creatorId)}`, "_blank");
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
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl bg-white/95 backdrop-blur-md ${
              toast.type === "success"
                ? "border-emerald-200 text-emerald-900"
                : toast.type === "error"
                ? "border-rose-200 text-rose-900"
                : "border-slate-200 text-slate-900"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <div className="text-xs">
              <p className="font-bold text-slate-900">{toast.title}</p>
              <p className="text-slate-600">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-700 p-1 ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
