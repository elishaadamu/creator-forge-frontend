import { useState, useEffect } from "react";
import CreatorFollowUpCRM from "./CreatorFollowUpCRM";
import { getCreators, getThreads, pollInboxReplies, updateCreatorDetails, deleteCreator, getWorkflowState, getCoLaunchProjects } from "../../services/opsApi";
import { updatePageSEO } from "../../utils/seo";
import { Users, ExternalLink, RefreshCw, Rocket, ShieldCheck, CheckCircle, AlertCircle, X } from "lucide-react";
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
        getCreators({ limit: 50 }),
        getThreads(),
        getWorkflowState(),
        getCoLaunchProjects(),
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
      if (workflowRes.status === "fulfilled" && workflowRes.value) {
        setWorkflowState(workflowRes.value);
      }
      if (projectsRes.status === "fulfilled" && projectsRes.value) {
        setProjects(Array.isArray(projectsRes.value) ? projectsRes.value : []);
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

  const handleDeleteCreator = (creatorId) => {
    setCreators((prev) => prev.filter((c) => c.id !== creatorId && c.handle !== creatorId));
    try {
      const raw = localStorage.getItem("forge_launch_discovered_creators");
      if (raw) {
        const parsed = JSON.parse(raw);
        const saved = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.data) ? parsed.data : []);
        if (saved.length > 0) {
          const updated = saved.filter((c) => c.id !== creatorId && c.handle !== creatorId);
          localStorage.setItem("forge_launch_discovered_creators", JSON.stringify(updated));
        }
      }

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
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => (window.location.href = "/launch")}
          >
            <CreatorForgeLogo size={28} showWordmark={true} theme="light" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                CRM
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-600">
              Follow-Up & Inbound Reply Directory
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
              {creators.length} Leads
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleSyncImap}
            disabled={isSyncingImap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Poll Gmail IMAP for latest creator replies"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingImap ? "animate-spin" : ""}`} />
            <span className="hidden xs:inline">Sync Inbox</span>
          </button>

          <a
            href="/project-os"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold transition-all shadow-xs"
            title="Open Co-Launch Project Operations Center"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Project OS</span>
            <ExternalLink className="w-3 h-3 text-emerald-600" />
          </a>

          <button
            type="button"
            onClick={() => window.open("/launch", "_blank")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <span>Acquisition</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
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
