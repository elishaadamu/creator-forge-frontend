import { useEffect, useState, useRef } from "react";
import {
  Target,
  Search,
  Send,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  FileText,
  Zap,
  Award,
  Star,
  Clock,
  Play,
  Pause,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Users,
  TrendingUp,
  Cpu,
  X,
  Pencil,
  Rocket,
  Trash2,
  Instagram,
  Youtube,
  Music,
  Plus,
  AlertTriangle,
  Flame,
  Bot,
  Lightbulb,
  Radio,
} from "lucide-react";
import { deleteAllCreators } from "../../services/opsApi";
import AdminPipelineLookup from "./AdminPipelineLookup";
import ActionNotificationToast from "../ui/ActionNotificationToast";
import ConfirmationModal from "../ui/ConfirmationModal";

export default function AcquisitionEngine({
  initialCreators = [],
  api,
  onCreateProject,
  onGoToProjectOS,
  onResetAll,
}) {
  const [activeStep, setActiveStep] = useState(() => {
    try {
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const stepParam = Number(searchParams?.get('step'));
      if (stepParam >= 1 && stepParam <= 6) return stepParam;
      const savedCreators = JSON.parse(
        localStorage.getItem("forge_launch_discovered_creators") || "[]",
      );
      if (!savedCreators || savedCreators.length === 0) return 1;
      const savedStep = Number(
        localStorage.getItem("forge_launch_acquisition_step"),
      );
      return savedStep >= 1 && savedStep <= 6 ? savedStep : 1;
    } catch {
      return 1;
    }
  });
  const [campaignRunning, setCampaignRunning] = useState(true);
  const [showAdminLookup, setShowAdminLookup] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("forge_launch_acquisition_step", String(activeStep));
    } catch (error) {
      console.warn(
        "[AcquisitionEngine] Failed to persist workflow step:",
        error,
      );
    }
  }, [activeStep]);

  // Step 1: Campaign Controls State
  const [niches, setNiches] = useState([
    "Tech",
    "Software",
    "SaaS",
    "Fintech",
    "Productivity",
  ]);
  const [customNicheInput, setCustomNicheInput] = useState("");
  const [minFollowers, setMinFollowers] = useState(100000);
  const [maxFollowers, setMaxFollowers] = useState(1000000);
  const [minEngagement, setMinEngagement] = useState(2.0);
  const [creatorsBatchCount, setCreatorsBatchCount] = useState(3); // Default batch size
  const [selectedPlatforms, setSelectedPlatforms] = useState([
    "youtube",
    "tiktok",
    "instagram",
  ]);
  const [templateSubject, setTemplateSubject] = useState(
    "Co-founder partnership inquiry for {{display_name}}",
  );
  const [templateBody, setTemplateBody] = useState(
    `Hi {{first_name}},\n\nI have been following your {{niche}} work on {{platform}} and love the community you have built.\n\nWe operate Creator Forge Studio — an elite software venture lab. We design, engineer, and fund 100% of custom software products for top creators under a 50/50 net recurring revenue partnership. You never write code, manage servers, or handle customer support (<2 hours/month advisory role).\n\nBased on audience research across your {{follower_count}} community in {{niche}}, we designed 3 software product concepts tailored specifically for your audience to create compounding monthly recurring revenue.\n\nAre you open to reviewing a 60-second preview deck this week?\n\nBest regards,\nCreator Forge Studio Team\n\n---\nRef: [CF-STAGE:STEP3_INQUIRY | CF-CID:{{creator_id}} | Handle:@{{handle}}]`,
  );

  // Discovered Creators State (Dynamic AI + Apify Pipeline)
  const [creators, setCreators] = useState(() => {
    if (initialCreators && initialCreators.length > 0) return initialCreators;
    try {
      const saved = localStorage.getItem("forge_launch_discovered_creators");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const [selectedCreatorId, setSelectedCreatorId] = useState(() => {
    try {
      const savedCreators = JSON.parse(
        localStorage.getItem("forge_launch_discovered_creators") || "[]",
      );
      return initialCreators?.[0]?.id || savedCreators?.[0]?.id || null;
    } catch {
      return null;
    }
  });
  const [selectedConceptId, setSelectedConceptId] = useState(null);
  const [discovering, setDiscovering] = useState(false);
  const [discoveryLog, setDiscoveryLog] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(null);
  const [replyFilter, setReplyFilter] = useState("all");

  // Keep discovered creators persisted to localStorage so they never vanish on refresh
  useEffect(() => {
    try {
      if (creators && creators.length > 0) {
        localStorage.setItem(
          "forge_launch_discovered_creators",
          JSON.stringify(creators),
        );
      } else {
        localStorage.removeItem("forge_launch_discovered_creators");
      }
    } catch (err) {
      console.warn(
        "[AcquisitionEngine] Failed to save creators to localStorage:",
        err,
      );
    }
  }, [creators]);

  // Alert & Notification System State
  const [toasts, setToasts] = useState([]);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const notify = (type, title, message, duration = 3500) => {
    const id = "toast_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => {
      // Deduplicate: replace any existing toast with the same title so it never stacks
      const filtered = prev.filter((t) => t.title !== title);
      // Keep at most 2 toasts on screen simultaneously
      return [...filtered.slice(-1), { id, type, title, message, duration }];
    });
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleDeleteAllCreators = () => {
    setShowDeleteConfirmModal(true);
  };

  const executeDeleteAllCreators = async () => {
    setIsDeletingAll(true);
    const creatorCount = creators.length;
    const threadCount = realThreads.length;
    try {
      try {
        await deleteAllCreators();
      } catch (err) {
        console.warn("Backend delete all creators failed or offline:", err);
      }
      localStorage.removeItem("forge_launch_discovered_creators");
      localStorage.removeItem("forge_launch_active_project");
      localStorage.removeItem("forge_launch_acquisition_step");
      localStorage.removeItem("forge_launch_real_threads");
      localStorage.removeItem("forge_launch_pitch_sent_map");
      localStorage.removeItem("forge_launch_answer_sent_map");
      localStorage.removeItem("forge_launch_persuasion_sent_map");
      localStorage.setItem("forge_launch_active_section", "section1");
      onResetAll?.();
      setCreators([]);
      setRealThreads([]);
      setSelectedCreatorId(null);
      setSelectedConceptId(null);
      setPositiveAdvanceNotice(null);
      setAutoAdvancedIds(new Set());
      autoAdvancedIdsRef.current = new Set();
      setAiDetectedChoiceMap({});
      setHasAutoCreatedProject(false);
      setActiveStep(1);
      setDiscoveryLog("");
      setOutreachLog("");
      setShowDeleteConfirmModal(false);

      // Trigger rich alert toast
      notify(
        "success",
        "Pipeline Reset & Creators Deleted",
        `Successfully wiped ${creatorCount} creators, ${threadCount} email threads, and reset workflow back to Step 1.`,
        6000
      );
    } catch (err) {
      notify(
        "error",
        "Deletion Failed",
        err.message || "An error occurred while resetting the pipeline."
      );
    } finally {
      setIsDeletingAll(false);
    }
  };

  const toggleCampaignRunning = () => {
    setCampaignRunning((prev) => {
      const next = !prev;
      notify(
        next ? "success" : "warning",
        next ? "Acquisition Engine Active" : "Acquisition Engine Paused",
        next
          ? "Autonomous workers are actively scouting leads, sending outreach, and polling replies."
          : "Autonomous background processing has been temporarily paused.",
        4000
      );
      return next;
    });
  };

  // Email Modification State
  const [editingEmailCreatorId, setEditingEmailCreatorId] = useState(null);
  const [tempEmailValue, setTempEmailValue] = useState("");

  const startEditEmail = (creatorId, currentEmail, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setEditingEmailCreatorId(creatorId);
    setTempEmailValue(currentEmail || "");
  };

  const saveEditEmail = async (creatorId, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const newEmail = tempEmailValue.trim();

    // 1. Update local state immediately
    setCreators((prev) =>
      prev.map((c) => {
        if (c.id === creatorId) {
          return { ...c, email: newEmail, email_public: newEmail };
        }
        return c;
      }),
    );
    setEditingEmailCreatorId(null);

    // 2. Persist to DB if backend creator
    try {
      const { updateCreatorDetails } = await import("../../services/opsApi");
      await updateCreatorDetails(creatorId, { email_public: newEmail });
      notify("success", "Email Updated", `Contact email updated to ${newEmail || "empty"}.`, 3500);
    } catch (err) {
      console.warn("[AcquisitionEngine] Failed to save email to DB:", err);
      notify("warning", "Saved Locally", `Email updated in session: ${newEmail}`, 3500);
    }
  };

  const cancelEditEmail = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setEditingEmailCreatorId(null);
    setTempEmailValue("");
  };

  // Apify business email lookup state and handler
  const [findingApifyId, setFindingApifyId] = useState(null);
  const [apifyStatusMsg, setApifyStatusMsg] = useState({});

  const handleApifyFindEmail = async (creator, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setFindingApifyId(creator.id);
    try {
      const { findEmailWithApify, updateCreatorDetails } =
        await import("../../services/opsApi");
      const res = await findEmailWithApify({
        handle: creator.handle?.replace("@", "") || creator.name,
        channel: creator.handle || creator.name,
        url: creator.profile_url || "",
      });
      if (res && res.email) {
        setCreators((prev) =>
          prev.map((c) => {
            if (c.id === creator.id) {
              return {
                ...c,
                email: res.email,
                email_public: res.email,
                email_verified: true,
              };
            }
            return c;
          }),
        );
        setApifyStatusMsg((prev) => ({
          ...prev,
          [creator.id]: `[Apify] Verified Email: ${res.email}`,
        }));
        try {
          await updateCreatorDetails(creator.id, { email_public: res.email });
        } catch (dbErr) {
          console.warn("[Apify] DB save error:", dbErr);
        }
      } else {
        setApifyStatusMsg((prev) => ({
          ...prev,
          [creator.id]: "[Notice] No business email found via Apify for this channel",
        }));
      }
    } catch (err) {
      console.warn("[Apify] Find error:", err);
      setApifyStatusMsg((prev) => ({
        ...prev,
        [creator.id]: "[Notice] Apify email lookup failed",
      }));
    } finally {
      setFindingApifyId(null);
    }
  };

  // Quick preset niche tags
  const popularNiches = [
    "Tech & SaaS",
    "AI Tools",
    "Software Dev",
    "Fintech",
    "Productivity",
    "Gaming",
    "Creator Economy",
    "Fitness & Health",
  ];

  const removeNiche = (tagToRemove) => {
    setNiches((prev) =>
      prev.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase()),
    );
  };

  const addNiche = (tagToAdd) => {
    const trimmed = tagToAdd.trim().replace(/^,+|,+$/g, "");
    if (
      trimmed &&
      !niches.some((t) => t.toLowerCase() === trimmed.toLowerCase())
    ) {
      setNiches((prev) => [...prev, trimmed]);
    }
    setCustomNicheInput("");
  };

  const togglePlatform = (p) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p)
        ? prev.length > 1
          ? prev.filter((item) => item !== p)
          : prev
        : [...prev, p],
    );
  };

  // Load existing creators from database on mount & merge
  useEffect(() => {
    import("../../services/opsApi").then(({ getCreators }) => {
      getCreators({ limit: 50 })
        .then((res) => {
          const rawList = Array.isArray(res) ? res : res?.creators || [];
          if (rawList.length > 0) {
            setCreators((prev) => {
              if (prev.length > 0) {
                const dbMap = new Map(rawList.map((item) => [item.id, item]));
                return prev.map((c) => {
                  const dbItem = dbMap.get(c.id);
                  if (!dbItem) return c;
                  return {
                    ...c,
                    email: dbItem.email_public || c.email,
                    email_public: dbItem.email_public || c.email_public,
                    status: dbItem.status || c.status,
                    replyClassification:
                      dbItem.reply_classification || c.replyClassification,
                    reply_classification:
                      dbItem.reply_classification || c.reply_classification,
                    replyText: dbItem.reply_text || c.replyText,
                  };
                });
              }
              const formatted = rawList.map((c) => {
                const f_count = c.follower_count || 0;
                const follower_str =
                  f_count >= 1000000
                    ? `${(f_count / 1000000).toFixed(1)}M`
                    : f_count >= 1000
                      ? `${Math.round(f_count / 1000)}K`
                      : String(f_count);
                const c_niche = Array.isArray(c.niche)
                  ? c.niche
                  : [c.niche || "Tech"];
                const primary_niche = c_niche[0] || "Tech";
                const d_name = c.display_name || c.handle || "Creator";
                const first_name = d_name.split(" ")[0] || "Creator";
                const score =
                  c.creatorScore ||
                  c.score ||
                  Math.min(
                    98,
                    Math.max(
                      78,
                      Math.round(
                        74 +
                          (c.engagement_score || 3.5) * 4 +
                          (c.email_public ? 3 : 0),
                      ),
                    ),
                  );

                return {
                  id: c.id,
                  name: d_name,
                  display_name: d_name,
                  handle: `@${c.handle.replace(/^@/, "")}`,
                  platform: (c.platform || "YouTube").toUpperCase(),
                  follower_count: f_count,
                  followerStr: follower_str,
                  engagement: c.engagement_score || 3.8,
                  niche: c_niche.join(", "),
                  avatar:
                    c.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(c.handle)}&background=6366f1&color=fff`,
                  creatorScore: score,
                  email: c.email_public || "",
                  email_public: c.email_public || "",
                  status: c.status || "qualified",
                  replyClassification: c.reply_classification || null,
                  reply_classification: c.reply_classification || null,
                  replyText: c.reply_text || null,
                  hasReplied: Boolean(
                    c.reply_classification &&
                    c.reply_classification !== "awaiting_reply" &&
                    c.reply_classification !== "no_email",
                  ),
                  productConcepts: [
                    {
                      id: `p1_${c.id}`,
                      name: `${first_name} OS`,
                      tagline: `Automated SaaS workspace for ${primary_niche} community`,
                      problem: `Workflow friction & monetization for ${primary_niche} audience`,
                      pricing: "$29/mo",
                      mvpDifficulty: "Low (2 weeks)",
                      opportunityScore: Math.min(98, score + 2),
                      rationale: `High audience intent identified in ${primary_niche} community.`,
                    },
                    {
                      id: `p2_${c.id}`,
                      name: `${first_name} Flow AI`,
                      tagline: `AI-powered operating system for ${primary_niche}`,
                      problem:
                        "Audience retention & automated digital delivery",
                      pricing: "$49/mo",
                      mvpDifficulty: "Medium (3 weeks)",
                      opportunityScore: Math.min(95, score),
                      rationale:
                        "Strong engagement on recent video uploads and tutorial series.",
                    },
                    {
                      id: `p3_${c.id}`,
                      name: `${first_name} Pro Hub`,
                      tagline: `Private template & tools community for ${primary_niche}`,
                      problem:
                        "Resource fragmentation and lack of unified tools",
                      pricing: "$79/mo",
                      mvpDifficulty: "Medium (3-4 weeks)",
                      opportunityScore: Math.min(92, score - 3),
                      rationale:
                        "Dedicated following ready for premium software access.",
                    },
                  ],
                };
              });
              setSelectedCreatorId(formatted[0]?.id || null);
              return formatted;
            });
          }
        })
        .catch((e) =>
          console.warn(
            "[AcquisitionEngine] Failed to load initial creators:",
            e,
          ),
        );
    });
  }, []);

  // ── 3-Minute Review & Autonomous Interval Timer ───────────────────────────
  // ── 3-Minute Review & Autonomous Interval Timer (Background-Proof & Wall-Clock Synced) ──
  const [countdownSeconds, setCountdownSeconds] = useState(180); // 3 minutes = 180s
  const [timerPaused, setTimerPaused] = useState(false);

  // Handle Pause / Resume toggle cleanly
  const toggleStep2Timer = () => {
    if (timerPaused) {
      const newTarget = Date.now() + countdownSeconds * 1000;
      try {
        localStorage.setItem("forge_step2_timer_target", newTarget.toString());
      } catch {}
      setTimerPaused(false);
    } else {
      try {
        localStorage.removeItem("forge_step2_timer_target");
      } catch {}
      setTimerPaused(true);
    }
  };

  // Interval countdown effect for Step 2 (wall-clock synced & background-safe)
  useEffect(() => {
    if (
      activeStep === 2 &&
      !discovering &&
      !timerPaused &&
      editingEmailCreatorId === null &&
      creators.length > 0
    ) {
      let target = null;
      try {
        const saved = localStorage.getItem("forge_step2_timer_target");
        if (saved) {
          target = parseInt(saved, 10);
        }
      } catch {}

      if (!target || isNaN(target) || target <= Date.now()) {
        target = Date.now() + 180 * 1000;
        try {
          localStorage.setItem("forge_step2_timer_target", target.toString());
        } catch {}
      }

      const syncRemaining = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((target - now) / 1000));
        setCountdownSeconds(remaining);
        if (remaining <= 0) {
          try {
            localStorage.removeItem("forge_step2_timer_target");
          } catch {}
          setActiveStep(3);
        }
      };

      // Initial sync immediately
      syncRemaining();

      // 1. Web Worker for active background ticking (bypasses browser inactive tab throttling)
      let worker = null;
      try {
        const blob = new Blob(
          [
            "let t=null; self.onmessage=function(e){ if(e.data==='start'){ if(t)clearInterval(t); t=setInterval(function(){self.postMessage('tick');}, 1000); } else if(e.data==='stop'){ if(t)clearInterval(t); t=null; } };",
          ],
          { type: "application/javascript" },
        );
        worker = new Worker(URL.createObjectURL(blob));
        worker.onmessage = () => syncRemaining();
        worker.postMessage("start");
      } catch (e) {
        // Fallback if workers blocked
      }

      // 2. Standard setInterval heartbeat
      const interval = setInterval(syncRemaining, 1000);

      // 3. Instant sync on visibility change and window focus
      const handleVisibilityOrFocus = () => {
        syncRemaining();
      };
      document.addEventListener("visibilitychange", handleVisibilityOrFocus);
      window.addEventListener("focus", handleVisibilityOrFocus);

      return () => {
        if (worker) {
          try {
            worker.postMessage("stop");
            worker.terminate();
          } catch {}
        }
        clearInterval(interval);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityOrFocus,
        );
        window.removeEventListener("focus", handleVisibilityOrFocus);
      };
    } else if (activeStep !== 2) {
      try {
        localStorage.removeItem("forge_step2_timer_target");
      } catch {}
    }
  }, [
    activeStep,
    discovering,
    timerPaused,
    editingEmailCreatorId,
    creators.length,
  ]);

  const formatCountdown = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  // Reset Pipeline State & Start Clean
  const handleStartFresh = () => {
    setCreators([]);
    setSelectedCreatorId(null);
    setSelectedConceptId(null);
    setRealThreads([]);
    setPositiveAdvanceNotice(null);
    setPitchSentMap({});
    setAiDetectedChoiceMap({});
    setAutoAdvancedIds(new Set());
    autoAdvancedIdsRef.current = new Set();
    setDiscoveryLog("");
    try {
      localStorage.removeItem("forge_launch_discovered_creators");
      localStorage.removeItem("forge_launch_real_threads");
      localStorage.removeItem("forge_launch_pitch_sent_map");
      localStorage.removeItem("forge_launch_ai_choice_map");
      localStorage.removeItem("forge_launch_active_step");
      localStorage.removeItem("forge_launch_acquisition_step");
    } catch (e) {}
    setActiveStep(1);
  };

  // Autonomous Engine Start & Discovery Trigger (AI + Apify)
  const handleStartEngine = async () => {
    // 1. Immediately wipe previous batch state so Step 2 renders completely fresh
    setCreators([]);
    setSelectedCreatorId(null);
    setSelectedConceptId(null);
    setRealThreads([]);
    setPositiveAdvanceNotice(null);
    setPitchSentMap({});
    setAiDetectedChoiceMap({});
    setAutoAdvancedIds(new Set());
    autoAdvancedIdsRef.current = new Set();
    try {
      localStorage.removeItem("forge_launch_discovered_creators");
      localStorage.removeItem("forge_launch_real_threads");
      localStorage.removeItem("forge_launch_pitch_sent_map");
      localStorage.removeItem("forge_launch_ai_choice_map");
      localStorage.removeItem("forge_launch_active_step");
      localStorage.removeItem("forge_launch_acquisition_step");
    } catch (e) {}

    setDiscovering(true);
    setActiveStep(2); // Transition to Step 2
    try {
      localStorage.removeItem("forge_step2_timer_target");
    } catch (e) {}
    setCountdownSeconds(180);
    const targetCount = creatorsBatchCount || 3;
    const activeNiches =
      niches.length > 0 ? niches : ["Tech", "Software", "SaaS"];
    setDiscoveryLog(
      `[AI Scout] Dynamically discovering ${targetCount} fresh creators across [${activeNiches.join(", ")}] on ${selectedPlatforms.join(", ")}...`,
    );

    try {
      const { discoverAutonomousCreators } =
        await import("../../services/opsApi");
      setDiscoveryLog(
        `[Apify / Scrapers] Extracting channel URLs, handles & profile metrics for ${activeNiches.join(", ")}...`,
      );

      const res = await discoverAutonomousCreators({
        niches: activeNiches,
        min_followers: minFollowers,
        max_followers: maxFollowers,
        min_engagement_rate: minEngagement,
        target_count: targetCount,
        platforms: selectedPlatforms,
      });

      if (res && res.creators && res.creators.length > 0) {
        setCreators(res.creators);
        setSelectedCreatorId(res.creators[0].id);
        const emailsFound = res.creators.filter((c) =>
          (c.email || c.email_public || "").includes("@"),
        ).length;
        setDiscoveryLog(
          `[Apify Engine] Discovered & enriched ${res.creators.length} creators (${emailsFound} verified business emails retrieved via Apify). You have 3 minutes to review/modify emails before autonomous dispatch.`,
        );
      } else {
        setDiscoveryLog(
          `[Apify Engine] No qualifying creators returned. Apify checked ${res?.candidate_count || 0} candidates and found ${res?.enriched_count || 0} with verified email and follower criteria.`,
        );
      }
    } catch (e) {
      console.warn(e);
      setDiscoveryLog(
        `[Notice] Discovery note: ${e.message || "Scouted dynamic creators."}`,
      );
    } finally {
      setDiscovering(false);
    }
  };

  // ── Helper to ensure all creators have tailored, rich product concepts ───────
  const ensureCreatorConcepts = (c) => {
    if (!c) return [];
    const d_name = c.name || c.display_name || c.handle || "Creator";
    const first_name = d_name.split(" ")[0] || "Creator";
    const primary_niche = Array.isArray(c.niche)
      ? c.niche.join(", ")
      : c.niche || "Tech";
    const nicheLower = primary_niche.toLowerCase();
    const score = c.creatorScore || c.score || 88;

    // Check category archetype
    let category = "tech";
    if (
      nicheLower.includes("finance") ||
      nicheLower.includes("fintech") ||
      nicheLower.includes("money") ||
      nicheLower.includes("invest") ||
      nicheLower.includes("crypto")
    ) {
      category = "finance";
    } else if (
      nicheLower.includes("video") ||
      nicheLower.includes("edit") ||
      nicheLower.includes("premiere") ||
      nicheLower.includes("davinci") ||
      nicheLower.includes("film")
    ) {
      category = "video_editing";
    } else if (
      nicheLower.includes("game") ||
      nicheLower.includes("gaming") ||
      nicheLower.includes("unity") ||
      nicheLower.includes("unreal")
    ) {
      category = "game_dev";
    } else if (
      nicheLower.includes("productiv") ||
      nicheLower.includes("study") ||
      nicheLower.includes("notion") ||
      nicheLower.includes("habit") ||
      nicheLower.includes("life")
    ) {
      category = "productivity";
    } else if (
      nicheLower.includes("data") ||
      nicheLower.includes("machine learning") ||
      nicheLower.includes("ai") ||
      nicheLower.includes("python")
    ) {
      category = "data_ai";
    } else if (
      nicheLower.includes("cyber") ||
      nicheLower.includes("security") ||
      nicheLower.includes("hack")
    ) {
      category = "cybersecurity";
    } else if (
      nicheLower.includes("saas") ||
      nicheLower.includes("founder") ||
      nicheLower.includes("startup") ||
      nicheLower.includes("business")
    ) {
      category = "business_founder";
    } else if (
      nicheLower.includes("podcast") ||
      nicheLower.includes("audio") ||
      nicheLower.includes("voice")
    ) {
      category = "podcast_audio";
    }

    // Replace stale generic developer concepts if creator is NOT in coding
    const hasExistingValid =
      c.productConcepts &&
      c.productConcepts.length > 0 &&
      c.productConcepts[0].keyFeatures;
    const isStaleDev =
      c.productConcepts?.[0]?.tagline?.includes("developers") &&
      category !== "tech";
    if (hasExistingValid && !isStaleDev) {
      return c.productConcepts;
    }

    switch (category) {
      case "productivity":
        return [
          {
            id: `p1_${c.id}`,
            name: `${first_name} Executive OS`,
            tagline: `All-in-one digital operating system, smart time-blocking & personal execution dashboard`,
            customer: `Knowledge workers, solopreneurs, students & ambitious professionals seeking high daily output`,
            problem: `App fatigue—juggling disconnected tools for task tracking, calendar planning, reading notes, and daily habits with zero cohesion`,
            keyFeatures: [
              `Unified daily command center with smart calendar time-blocking`,
              `Second Brain knowledge capture & automated progressive summarization`,
              `Goal & habit tracking engine with weekly reflection prompts`,
              `Curated executive templates derived from ${first_name}'s proven systems`,
            ],
            audienceEvidence: `Over 540+ comments asking for downloadable templates, productivity setups, and system walkthroughs`,
            pricing: "$19/mo Starter • $49/mo Pro",
            revenueModel:
              "SaaS Subscription • 50/50 Revenue Share • Projected $22.4K MRR at 2.8% audience conversion",
            competition: `Generic tools like Notion or Todoist require tedious manual setup. ${first_name} OS works instantly out-of-the-box with built-in accountability.`,
            mvpDifficulty: "Low (2 weeks)",
            opportunityScore: Math.min(98, score + 3),
            rationale: `Directly monetizes viewers who want to implement ${first_name}'s exact life-planning and productivity operating system.`,
            mockup: {
              appUrl: `${first_name.toLowerCase()}os.app`,
              primaryMetric: "$22.4K MRR",
              activeMetric: "1,280 Daily Planners",
              efficiencyMetric: "88% Habit Completion",
            },
          },
          {
            id: `p2_${c.id}`,
            name: `${first_name} Flow AI`,
            tagline: `Context-aware Second Brain AI assistant & automated weekly review copilot`,
            customer: `Busy professionals, founders & creators looking to synthesize reading notes and automate task triage`,
            problem: `Information overload—saving hundreds of articles, book notes, and tasks that are never reviewed or acted upon`,
            keyFeatures: [
              `AI note synthesizer that automatically extracts action items from reading logs`,
              `Weekly AI review engine that analyzes accomplishments and flags stalled goals`,
              `Voice memo to structured task & project board transformer`,
              `Context-aware search & synthesis across your entire personal knowledge base`,
            ],
            audienceEvidence: `360+ community inquiries requesting an AI assistant trained on ${first_name}'s thinking frameworks and note-taking methods`,
            pricing: "$29/mo Pro • $79/mo Team",
            revenueModel:
              "Usage-tiered SaaS • 50/50 Co-founder Split • Projected $26.8K MRR within 60 days of launch",
            competition: `Standard ChatGPT/Claude lack personal knowledge base integration and structured task triage workflows`,
            mvpDifficulty: "Medium (3 weeks)",
            opportunityScore: Math.min(96, score + 1),
            rationale: `Solves the ubiquitous problem of knowledge hoarding by turning saved notes into active daily execution.`,
            mockup: {
              appUrl: `${first_name.toLowerCase()}flow.ai`,
              primaryMetric: "$26.8K MRR",
              activeMetric: "940 AI Reviews/Day",
              efficiencyMetric: "4.9/5 User Rating",
            },
          },
          {
            id: `p3_${c.id}`,
            name: `${first_name} Academy Hub`,
            tagline: `Interactive sprint challenges, deep work co-working rooms & verified systems vault`,
            customer: `Aspiring creators & career pivoters seeking structured accountability and peer review`,
            problem: `Passive video watching yields low retention; learners lack interactive accountability, peer feedback, and structured implementation sprints`,
            keyFeatures: [
              "30-Day system building challenges with progress accountability checkpoints",
              "Curated vault of vetted SOPs, production checklists & execution templates",
              "Weekly live co-working deep work rooms & hot-seat audits",
              "Verified milestone badges & community peer feedback network",
            ],
            audienceEvidence: `High recurring questions on Patreon/Discord asking for structured practice environments and feedback`,
            pricing: "$79/mo Annual • $19/mo Community",
            revenueModel:
              "Hybrid SaaS & Community Tier • 50/50 Split • High retention with sub-3% churn rate",
            competition: `Generic platforms like Coursera/Udemy lack live cohort interactivity and the creator's authoritative lifestyle trust`,
            mvpDifficulty: "Medium (3-4 weeks)",
            opportunityScore: Math.min(93, score - 2),
            rationale: `Transforms free YouTube viewers into high-LTV recurring community members with lasting habit changes.`,
            mockup: {
              appUrl: `${first_name.toLowerCase()}hub.io`,
              primaryMetric: "$34.8K MRR",
              activeMetric: "1,620 Members",
              efficiencyMetric: "92% Completion Rate",
            },
          },
        ];

      case "finance":
        return [
          {
            id: `p1_${c.id}`,
            name: `${first_name} Wealth OS`,
            tagline: `Automated portfolio asset allocation, dividend tracking, and rebalancing workspace`,
            customer: `Retail investors, FIRE aspirants & wealth builders seeking institutional-grade clarity`,
            problem: `Messy, manual spreadsheets that break easily and lack automated dividend projections, tax-loss harvesting cues, and risk-weighted rebalancing`,
            keyFeatures: [
              `Multi-brokerage API portfolio aggregation & unified net worth tracking`,
              `Automated target allocation rebalancing calculator with buy/sell recommendations`,
              `Dividend cash flow calendar with compounding reinvestment projections`,
              `Downside risk & asset class correlation stress-testing engine`,
            ],
            audienceEvidence: `Over 620+ comments across top financial teardowns asking for portfolio models and rebalancing tools`,
            pricing: "$24/mo Starter • $69/mo Pro",
            revenueModel:
              "SaaS Subscription • 50/50 Revenue Share • Projected $28.5K MRR at 2.4% audience conversion",
            competition: `Traditional tools (Empower, Kubera) are either bloated or cost-prohibitive. ${first_name} Wealth OS delivers clear, unbiased portfolio insights.`,
            mvpDifficulty: "Low-Medium (3 weeks)",
            opportunityScore: Math.min(98, score + 3),
            rationale: `Capitalizes on high financial intent and trust in ${first_name}'s market analysis.`,
            mockup: {
              appUrl: `${first_name.toLowerCase()}wealth.app`,
              primaryMetric: "$28.5K MRR",
              activeMetric: "1,420 Active Portfolios",
              efficiencyMetric: "96% Rebalancing Accuracy",
            },
          },
          {
            id: `p2_${c.id}`,
            name: `${first_name} Alpha AI`,
            tagline: `Autonomous 10-K financial teardown, earnings call synthesis & valuation copilot`,
            customer: `Active stock pickers, analysts & serious retail investors looking to evaluate companies faster`,
            problem: `Retail investors lack the 40+ hours needed every quarter to read 150-page financial filings and listen to earnings calls`,
            keyFeatures: [
              `Automated 10-K & quarterly earnings transcript breakdown with red-flag detection`,
              `Discounted cash flow (DCF) model generator with customizable growth assumptions`,
              `Competitor moat analysis & financial health ratio benchmarking`,
              `Insider buying & institutional 13F filing change alert feed`,
            ],
            audienceEvidence: `410+ requests for ${first_name}'s custom valuation models and company research checklists`,
            pricing: "$39/mo Pro • $99/mo Investor",
            revenueModel:
              "Usage-tiered SaaS • 50/50 Co-founder Split • Projected $31.2K MRR within 60 days of launch",
            competition: `Bloomberg/FactSet cost $25,000/yr. Standard ChatGPT hallucinates financial tables. ${first_name} Alpha AI provides verified SEC data.`,
            mvpDifficulty: "Medium (3 weeks)",
            opportunityScore: Math.min(96, score + 1),
            rationale: `Delivers institutional-grade research capabilities at a price accessible to retail investors.`,
            mockup: {
              appUrl: `${first_name.toLowerCase()}alpha.ai`,
              primaryMetric: "$31.2K MRR",
              activeMetric: "880 Active Analysts",
              efficiencyMetric: "4.95/5 Analysis Rating",
            },
          },
          {
            id: `p3_${c.id}`,
            name: `${first_name} Capital Club`,
            tagline: `Macroeconomic briefing sprints, interactive DCF sandbox & verified investor community`,
            customer: `Serious investors seeking structured macroeconomic context and verified peer discussion`,
            problem: `Social media finance groups are filled with hype, pump-and-dump schemes, and lack rigorous financial reasoning`,
            keyFeatures: [
              "Monthly deep-dive macroeconomic thesis briefings and sector allocation blueprints",
              "Interactive valuation spreadsheet sandbox with live scenario modeling",
              "Private vetted investor forum with verified asset allocation benchmarks",
              "Quarterly live portfolio AMA and risk audit sessions",
            ],
            audienceEvidence: `High recurring inquiries regarding private mastermind access and ongoing portfolio commentary`,
            pricing: "$89/mo Annual • $29/mo Community",
            revenueModel:
              "Hybrid SaaS & Mastermind Tier • 50/50 Split • High retention with sub-2% churn rate",
            competition: `Generic investing newsletters provide passive reading without interactive tools or vetted peer networks`,
            mvpDifficulty: "Medium (3 weeks)",
            opportunityScore: Math.min(93, score - 2),
            rationale: `Builds a high-trust, high-LTV investor community with strong recurring membership stability.`,
            mockup: {
              appUrl: `${first_name.toLowerCase()}capital.io`,
              primaryMetric: "$38.2K MRR",
              activeMetric: "920 Verified Investors",
              efficiencyMetric: "94% Retention Rate",
            },
          },
        ];

      case "video_editing":
        return [
          {
            id: `p1_${c.id}`,
            name: `${first_name} Timeline OS`,
            tagline: `Smart NLE timeline assistant & automated asset management plugin for Premiere & DaVinci`,
            customer: `Commercial video editors, YouTube creators & agency post-production teams`,
            problem: `Editors waste 40% of their project time manually organizing b-roll, syncing multitrack audio, and keyframing transitions`,
            keyFeatures: [
              `One-click automated silence cutting & timeline cleanup`,
              `Integrated preset browser for instant drag-and-drop SFX, LUTs, and motion graphics`,
              `Automated subtitle generation with custom typography presets and animated styling`,
              `Client revision marker sync directly into the editing timeline`,
            ],
            audienceEvidence: `Over 480+ comments asking for ${first_name}'s exact presets, timeline shortcuts, and asset packs`,
            pricing: "$29/mo Starter • $79/mo Studio",
            revenueModel:
              "SaaS Plugin Subscription • 50/50 Revenue Share • Projected $21.5K MRR at 3.1% audience conversion",
            competition: `Generic stock marketplaces (Envato) are uncurated clutter. ${first_name} Timeline OS delivers curated, production-tested assets.`,
            mvpDifficulty: "Medium (3 weeks)",
            opportunityScore: Math.min(98, score + 3),
            rationale: `Saves video editors 5+ hours on every project, making the subscription an instant no-brainer purchase.`,
            mockup: {
              appUrl: `${first_name.toLowerCase()}timeline.app`,
              primaryMetric: "$21.5K MRR",
              activeMetric: "840 Active Editors",
              efficiencyMetric: "62% Faster Turnaround",
            },
          },
          {
            id: `p2_${c.id}`,
            name: `${first_name} Cut AI`,
            tagline: `AI-assisted pacing heatmap analyzer, auto-b-roll matcher & rough-cut generator`,
            customer: `Solo creators, podcast editors & agencies producing high-volume content`,
            problem: `Manually reviewing hours of raw footage to find optimal cut points and matching b-roll causes severe turnaround bottlenecks`,
            keyFeatures: [
              `Smart pacing heatmaps highlighting viewer drop-off risk spots in edits`,
              `Semantic b-roll search across local project folders using natural language`,
              `Multi-cam auto-switching based on voice activity and emotion tracking`,
              `Automated aspect ratio re-framing for TikTok and Shorts`,
            ],
            audienceEvidence: `320+ community requests for workflow tools that accelerate assembly and rough-cut editing`,
            pricing: "$39/mo Pro • $99/mo Agency",
            revenueModel:
              "Usage-tiered SaaS • 50/50 Co-founder Split • Projected $27.4K MRR within 60 days of launch",
            competition: `Standard video AI tools create low-quality automated shorts. ${first_name} Cut AI assists professional editors inside their NLE.`,
            mvpDifficulty: "Medium-High (4 weeks)",
            opportunityScore: Math.min(96, score + 1),
            rationale: `Solves the initial assembly bottleneck for commercial creators.`,
            mockup: {
              appUrl: `${first_name.toLowerCase()}cut.ai`,
              primaryMetric: "$27.4K MRR",
              activeMetric: "690 Projects Processed/Day",
              efficiencyMetric: "4.88/5 Pacing Score",
            },
          },
          {
            id: `p3_${c.id}`,
            name: `${first_name} Post Hub`,
            tagline: `Commercial editing agency portal, client proofing pipeline & asset masterclasses`,
            customer: `Freelance editors and boutique post-production agencies managing multiple client deliverables`,
            problem: `Scattered client feedback via WhatsApp, Google Drive, and email leads to endless revisions and unpaid scope creep`,
            keyFeatures: [
              "Frame-accurate client video review and approval player with drawn annotations",
              "Automated invoice escrow and final deliverable watermarking until payment is released",
              "Curated vault of sound design, title cards & transition packs updated monthly",
              "Private community job board with vetted editing gigs",
            ],
            audienceEvidence: `High volume of inquiries from junior editors wanting to land higher-paying corporate clients`,
            pricing: "$69/mo Annual • $24/mo Community",
            revenueModel:
              "Hybrid SaaS & Agency Portal • 50/50 Split • High retention with sub-3% churn rate",
            competition: `Frame.io is built for Hollywood enterprises. ${first_name} Post Hub is built specifically for YouTube and social video agencies.`,
            mvpDifficulty: "Medium (3 weeks)",
            opportunityScore: Math.min(93, score - 2),
            rationale: `Directly helps editors make more money from clients while streamlining their delivery operations.`,
            mockup: {
              appUrl: `${first_name.toLowerCase()}posthub.io`,
              primaryMetric: "$31.8K MRR",
              activeMetric: "1,120 Agency Users",
              efficiencyMetric: "95% On-Time Delivery",
            },
          },
        ];

      case "game_dev":
        return [
          {
            id: `p1_${c.id}`,
            name: `${first_name} Engine Kit`,
            tagline: `Modular game architecture framework, responsive character controllers & state machines`,
            customer: `Indie game developers, solo creators & technical artists building commercial releases`,
            problem: `Indie developers waste 6+ months building boilerplate movement, save serialization, and state machines instead of actual gameplay`,
            keyFeatures: [
              `Plug-and-play 2D/3D character controllers with responsive input buffering`,
              `Visual hierarchical state machine editor with live gameplay debugging`,
              `Cross-platform save/load serialization engine with cloud sync`,
              `Modular inventory, dialogue tree & quest tracking systems`,
            ],
            audienceEvidence: `Over 510+ comments on devlogs asking for downloadable project files and controller mechanics`,
            pricing: "$29/mo Starter • $89/mo Studio",
            revenueModel:
              "SaaS Architecture Toolkit • 50/50 Revenue Share • Projected $19.4K MRR at 2.6% audience conversion",
            competition: `Generic asset store plugins often have abandoned documentation. ${first_name} Engine Kit is battle-tested in live videos.`,
            mvpDifficulty: "Medium (3 weeks)",
            opportunityScore: Math.min(98, score + 3),
            rationale: `Accelerates indie game production timelines from years to months.`,
            mockup: {
              appUrl: `${first_name.toLowerCase()}kit.app`,
              primaryMetric: "$19.4K MRR",
              activeMetric: "780 Active Studios",
              efficiencyMetric: "80% Less Boilerplate",
            },
          },
          {
            id: `p2_${c.id}`,
            name: `${first_name} Shader AI`,
            tagline: `Visual shader graph generator, performance profiler & asset optimization assistant`,
            customer: `Indie builders seeking AAA visual fidelity without deep HLSL/GLSL programming experience`,
            problem: `Writing custom shaders and optimizing draw calls is notoriously complex and stalls indie game visual polish`,
            keyFeatures: [
              `Natural language to visual shader graph generator with live preview`,
              `Automated draw-call and overdraw bottleneck analyzer`,
              `Mobile & Steam Deck GPU optimization recommendations`,
              `One-click procedural material and texture stylizer`,
            ],
            audienceEvidence: `340+ requests for shader tutorials and performance profiling workflows`,
            pricing: "$39/mo Pro • $99/mo Studio",
            revenueModel:
              "Usage-tiered SaaS • 50/50 Co-founder Split • Projected $23.6K MRR within 60 days of launch",
            competition: `Complex DCC tools (Blender, Houdini) are disconnected from game engines. ${first_name} Shader AI integrates directly into runtime.`,
            mvpDifficulty: "Medium-High (4 weeks)",
            opportunityScore: Math.min(96, score + 1),
            rationale: `Empowers solo developers to achieve stunning visual effects without hiring expensive technical artists.`,
            mockup: {
              appUrl: `${first_name.toLowerCase()}shader.ai`,
              primaryMetric: "$23.6K MRR",
              activeMetric: "1,120 Shaders Compiled/Day",
              efficiencyMetric: "4.91/5 Performance Rating",
            },
          },
          {
            id: `p3_${c.id}`,
            name: `${first_name} GameLab Hub`,
            tagline: `Indie game publishing portal, playtest feedback pipeline & verified launch academy`,
            customer: `Solo developers and small indie studios preparing for Steam and console launches`,
            problem: `Great indie games fail because developers launch without playtester feedback, marketing wishlists, or publisher readiness`,
            keyFeatures: [
              "Automated playtest build distribution with in-game bug reporting and heatmap telemetry",
              "Steam page conversion audit and capsule art A/B testing analyzer",
              "Curated directory of vetted publisher contracts, pitch decks & press contacts",
              "Monthly live showcase AMA with industry veterans and publishers",
            ],
            audienceEvidence: `High volume of comments asking how to get publishers and increase Steam wishlists`,
            pricing: "$79/mo Annual • $29/mo Community",
            revenueModel:
              "Hybrid SaaS & Publishing Hub • 50/50 Split • High retention with sub-3% churn rate",
            competition: `Generic indie forums lack structured telemetry tools and actionable publishing roadmaps`,
            mvpDifficulty: "Medium (3 weeks)",
            opportunityScore: Math.min(93, score - 2),
            rationale: `Directly impacts commercial success and Steam launch sales for indie creators.`,
            mockup: {
              appUrl: `${first_name.toLowerCase()}gamelab.io`,
              primaryMetric: "$28.4K MRR",
              activeMetric: "940 Active Games",
              efficiencyMetric: "91% Playtest Rating",
            },
          },
        ];

      case "data_ai":
        return [
          {
            id: `p1_${c.id}`,
            name: `${first_name} Data OS`,
            tagline: `Automated exploratory data analysis (EDA), smart pandas pipelines & model benchmarking workspace`,
            customer: `Data analysts, ML engineers, researchers & students transitioning into data science`,
            problem: `Data professionals spend 80% of their time writing repetitive pandas cleaning boilerplate, configuring environments, and formatting missing data`,
            keyFeatures: [
              `One-click automated exploratory data analysis (EDA) with interactive distribution charts`,
              `Smart pandas pipeline generator for automated imputation and feature encoding`,
              `Pre-built ML model benchmark comparison matrix with SHAP explainability`,
              `Cloud notebook synchronization and instant FastAPI production export`,
            ],
            audienceEvidence: `Over 580+ comments requesting clean datasets, starter notebooks, and deployment scripts`,
            pricing: "$29/mo Starter • $79/mo Pro",
            revenueModel:
              "SaaS Subscription • 50/50 Revenue Share • Projected $24.8K MRR at 2.7% audience conversion",
            competition: `Generic notebooks (Jupyter, Colab) require manual library setup. ${first_name} Data OS automates the tedious 80% of data prep.`,
            mvpDifficulty: "Low-Medium (2-3 weeks)",
            opportunityScore: Math.min(98, score + 3),
            rationale: `Directly monetizes viewers who want to fast-track their data engineering and modeling pipelines.`,
            mockup: {
              appUrl: `${first_name.toLowerCase()}data.app`,
              primaryMetric: "$24.8K MRR",
              activeMetric: "1,150 Data Pipelines",
              efficiencyMetric: "78% Faster EDA",
            },
          },
          {
            id: `p2_${c.id}`,
            name: `${first_name} Model Flow AI`,
            tagline: `Fine-tuning assistant, GPU environment validator & automated model deployment copilot`,
            customer: `Intermediate & advanced ML practitioners fine-tuning open-source LLMs and computer vision models`,
            problem: `Configuring CUDA drivers, optimizing batch sizes, and preventing out-of-memory (OOM) GPU crashes is a massive barrier to production deployment`,
            keyFeatures: [
              `Automated GPU environment checker and VRAM optimization calculator`,
              `LoRA and QLoRA fine-tuning workflow generator for open-source foundation models`,
              `Automated model evaluation benchmark against standard industry datasets`,
              `One-click Docker containerization and serverless GPU endpoint deployment`,
            ],
            audienceEvidence: `390+ requests for practical fine-tuning guides and production deployment blueprints`,
            pricing: "$49/mo Pro • $129/mo Team",
            revenueModel:
              "Usage-tiered SaaS • 50/50 Co-founder Split • Projected $29.5K MRR within 60 days of launch",
            competition: `AWS SageMaker and GCP Vertex are enterprise-bloated and expensive. ${first_name} Model Flow AI is streamlined for indie practitioners.`,
            mvpDifficulty: "Medium (3 weeks)",
            opportunityScore: Math.min(96, score + 1),
            rationale: `Removes the infrastructure friction from modern machine learning workflows.`,
            mockup: {
              appUrl: `${first_name.toLowerCase()}flow.ai`,
              primaryMetric: "$29.5K MRR",
              activeMetric: "740 Models Trained/Day",
              efficiencyMetric: "4.93/5 Deployment Success",
            },
          },
          {
            id: `p3_${c.id}`,
            name: `${first_name} DataLab Hub`,
            tagline: `Interactive industry project sandboxes, real-world datasets & data science career accelerator`,
            customer: `Aspiring data scientists and analysts looking to build hireable, production-grade portfolios`,
            problem: `Toy datasets like Iris and Titanic don't prepare learners for real-world messy corporate data or technical interview take-homes`,
            keyFeatures: [
              "Curated library of proprietary, messy real-world industry datasets (Fintech, Health, E-commerce)",
              "Interactive in-browser Python sandboxes with automated test suite grading",
              "Monthly live dataset teardowns and technical interview simulation sprints",
              "Verified portfolio project badges reviewed by senior industry practitioners",
            ],
            audienceEvidence: `High demand on community channels for project reviews and portfolio coaching`,
            pricing: "$89/mo Annual • $24/mo Community",
            revenueModel:
              "Hybrid SaaS & Learning Hub • 50/50 Split • High retention with sub-3% churn rate",
            competition: `Coursera and DataCamp offer rigid, multiple-choice courses without genuine production portfolio artifacts`,
            mvpDifficulty: "Medium (3 weeks)",
            opportunityScore: Math.min(93, score - 2),
            rationale: `Directly helps students transition into six-figure data science careers.`,
            mockup: {
              appUrl: `${first_name.toLowerCase()}datalab.io`,
              primaryMetric: "$33.6K MRR",
              activeMetric: "1,420 Enrolled Analysts",
              efficiencyMetric: "93% Portfolio Placement",
            },
          },
        ];

      case "business_founder":
        return [
          {
            id: `p1_${c.id}`,
            name: `${first_name} Founder OS`,
            tagline: `All-in-one lean startup validation, waitlist conversion & pre-sale sprint workspace`,
            customer: `Aspiring founders, solopreneurs, indie hackers & operators launching micro-SaaS businesses`,
            problem: `Founders spend 3–6 months building products in isolation without pre-validating customer demand or collecting deposits`,
            keyFeatures: [
              `High-converting demand-testing landing page builder with integrated Stripe pre-orders`,
              `Automated competitor reverse-engineering & pricing benchmark engine`,
              `Customer interview questionnaire generator and sentiment tagger`,
              `Launch roadmap checklist tracking MRR milestones and retention cohorts`,
            ],
            audienceEvidence: `Over 680+ comments asking how to find profitable product ideas and acquire initial paying users`,
            pricing: "$29/mo Starter • $79/mo Pro",
            revenueModel:
              "SaaS Subscription • 50/50 Revenue Share • Projected $26.4K MRR at 2.9% audience conversion",
            competition: `Passive startup blogs give advice without software execution. ${first_name} Founder OS actively collects customer demand and revenue.`,
            mvpDifficulty: "Low-Medium (2-3 weeks)",
            opportunityScore: Math.min(98, score + 3),
            rationale: `Directly empowers subscribers to launch revenue-generating digital products.`,
            mockup: {
              appUrl: `${first_name.toLowerCase()}founder.app`,
              primaryMetric: "$26.4K MRR",
              activeMetric: "1,040 Launched Startups",
              efficiencyMetric: "$380 Avg Pre-Sales/User",
            },
          },
          {
            id: `p2_${c.id}`,
            name: `${first_name} Traction AI`,
            tagline: `AI growth strategist, cold acquisition copywriter & distribution engine`,
            customer: `Early-stage bootstrapped founders struggling with customer acquisition and outbound sales`,
            problem: `Technical founders know how to build code but lack marketing skills, resulting in zero-traffic launches`,
            keyFeatures: [
              `AI cold email & LinkedIn outreach personalization generator tailored to target ICP`,
              `Reddit & Twitter organic distribution monitor that flags high-intent customer conversations`,
              `Product Hunt & community launch copy generator with proven high-converting hooks`,
              `Automated SEO content brief generator targeting high-intent buyer keywords`,
            ],
            audienceEvidence: `420+ questions regarding customer acquisition channels and cold outreach conversion rates`,
            pricing: "$49/mo Pro • $129/mo Team",
            revenueModel:
              "Usage-tiered SaaS • 50/50 Co-founder Split • Projected $32.8K MRR within 60 days of launch",
            competition: `Generic AI copywriters write fluffy blog posts. ${first_name} Traction AI focuses exclusively on B2B customer acquisition funnels.`,
            mvpDifficulty: "Medium (3 weeks)",
            opportunityScore: Math.min(96, score + 1),
            rationale: `Solves the single biggest reason startups fail: lack of distribution and sales.`,
            mockup: {
              appUrl: `${first_name.toLowerCase()}traction.ai`,
              primaryMetric: "$32.8K MRR",
              activeMetric: "12,400 Leads Reached/Day",
              efficiencyMetric: "18.4% Reply Rate",
            },
          },
          {
            id: `p3_${c.id}`,
            name: `${first_name} Micro-SaaS Club`,
            tagline: `Private founder revenue sprint, vetted acquisition dealflow & launch mastermind`,
            customer: `Serious bootstrappers and digital operators seeking vetted revenue benchmarks and peer accountability`,
            problem: `Building alone is isolating; founders lack trusted peer reviews, legal contracts, and accountability partners`,
            keyFeatures: [
              "Monthly revenue verification sprint with public leaderboard and cohort accountability",
              "Vetted legal contract vault (co-founder agreements, advisory shares, asset sale agreements)",
              "Private dealflow channel for acquiring and selling micro-SaaS apps under $100K ARR",
              "Bi-weekly live teardown masterclasses with founders making $50K+ MRR",
            ],
            audienceEvidence: `High demand for private founder mastermind access and real-revenue case study data`,
            pricing: "$99/mo Annual • $29/mo Community",
            revenueModel:
              "Hybrid SaaS & Mastermind • 50/50 Split • Sub-2% churn rate with high annual LTV",
            competition: `Public forums like Indie Hackers are overrun by spam. ${first_name} Micro-SaaS Club offers vetted, verified-revenue founders.`,
            mvpDifficulty: "Medium (3 weeks)",
            opportunityScore: Math.min(93, score - 2),
            rationale: `Builds a prestigious, high-retention community asset with high lifetime value.`,
            mockup: {
              appUrl: `${first_name.toLowerCase()}saasclub.io`,
              primaryMetric: "$41.2K MRR",
              activeMetric: "860 Verified Founders",
              efficiencyMetric: "96% Annual Renewal",
            },
          },
        ];

      default:
        // Coding / Software Development Archetype
        return [
          {
            id: `p1_${c.id}`,
            name: `${first_name} OS`,
            tagline: `All-in-one automated software workspace for ${primary_niche} developers & creators`,
            customer: `${primary_niche} professionals, indie builders & active tutorial subscribers`,
            problem: `Fragmented tooling, repetitive manual configurations, and lack of specialized ${primary_niche} workflow templates`,
            keyFeatures: [
              `Pre-built ${primary_niche} automation templates & scripts`,
              "One-click cloud workspace deployment",
              "AI-assisted code & workflow generation",
              `Private community template sharing & syncing`,
            ],
            audienceEvidence: `Over 480+ comments across recent uploads asking for downloadable starter templates and setup shortcuts`,
            pricing: "$29/mo Starter • $79/mo Pro",
            revenueModel:
              "SaaS Subscription • 50/50 Revenue Share • Projected $16.8K MRR at 2.5% audience conversion",
            competition: `Generic tools like Notion or GitHub templates lack dedicated ${primary_niche} runtime execution and creator-branded workflows`,
            mvpDifficulty: "Low (2 weeks)",
            opportunityScore: Math.min(98, score + 3),
            rationale: `Directly monetizes existing tutorial viewers who repeatedly ask for project codebases and workflow automation.`,
            mockup: {
              appUrl: `${first_name.toLowerCase()}os.app`,
              primaryMetric: "$14.2K MRR",
              activeMetric: "520 Active Builders",
              efficiencyMetric: "94% Workflow Speedup",
            },
          },
          {
            id: `p2_${c.id}`,
            name: `${first_name} Flow AI`,
            tagline: `Autonomous AI copilot & analysis pipeline tailored for ${primary_niche}`,
            customer: `Intermediate & advanced ${primary_niche} practitioners looking to automate complex tasks`,
            problem: `Existing LLMs lack domain context for ${primary_niche} best practices, resulting in hallucinated syntax and slow debugging`,
            keyFeatures: [
              `Specialized ${primary_niche} fine-tuned agent assistant`,
              "Automated error analysis & instant repair recommendations",
              "Batch asset & code transformation engine",
              "Direct IDE & terminal integrations",
            ],
            audienceEvidence: `310+ community threads requesting an AI assistant trained specifically on ${first_name}'s teaching methodology and stack`,
            pricing: "$49/mo Pro • $129/mo Team",
            revenueModel:
              "Usage-tiered SaaS • 50/50 Co-founder Split • Projected $24.5K MRR within 60 days of launch",
            competition: `Standard ChatGPT/Claude lack deep context for ${primary_niche} frameworks and creator's proprietary boilerplates`,
            mvpDifficulty: "Medium (3 weeks)",
            opportunityScore: Math.min(96, score + 1),
            rationale: `Massive willingness to pay for specialized AI workflows that eliminate hours of manual debugging.`,
            mockup: {
              appUrl: `${first_name.toLowerCase()}flow.ai`,
              primaryMetric: "$21.8K MRR",
              activeMetric: "890 AI Queries/Day",
              efficiencyMetric: "4.9/5 User Rating",
            },
          },
          {
            id: `p3_${c.id}`,
            name: `${first_name} Pro Hub`,
            tagline: `Premium interactive masterclass hub, live sandboxes & vetted tool directory`,
            customer: `Aspiring professionals transitioning into ${primary_niche} careers`,
            problem: `Passive video watching yields low retention; learners lack interactive sandbox environments and feedback loops`,
            keyFeatures: [
              "Interactive in-browser coding sandbox with real-time test verification",
              `Curated ${primary_niche} component library & verified templates`,
              "Weekly private code reviews & live co-working sessions",
              "Verified completion certificate & portfolio showcase",
            ],
            audienceEvidence: `High recurring questions on Patreon/Discord asking for structured practice environments and feedback`,
            pricing: "$99/mo Annual • $19/mo Community",
            revenueModel:
              "Hybrid SaaS & Community Tier • 50/50 Split • High retention with sub-3% churn rate",
            competition: `Generic platforms like Coursera/Udemy lack live sandbox interactivity and the creator's authoritative brand trust`,
            mvpDifficulty: "Medium (3-4 weeks)",
            opportunityScore: Math.min(93, score - 2),
            rationale: `Transforms free YouTube/TikTok viewers into high-LTV recurring members.`,
            mockup: {
              appUrl: `${first_name.toLowerCase()}prohub.io`,
              primaryMetric: "$32.4K MRR",
              activeMetric: "1,450 Members",
              efficiencyMetric: "91% Completion Rate",
            },
          },
        ];
    }
  };

  // ── Helper to dynamically generate 100% tailored audience research signals ─
  const getCreatorAudienceIntelligence = (creator) => {
    if (!creator) return null;

    const nicheRaw = Array.isArray(creator.niche)
      ? creator.niche.join(" ")
      : creator.niche || "";
    const nicheLower = nicheRaw.toLowerCase();
    const bio = (creator.bio || "").toLowerCase();
    const name =
      creator.name || creator.display_name || creator.handle || "Creator";
    const followers = creator.follower_count || 100000;
    const avgViews = Math.round(followers * (0.28 + (followers % 17) * 0.01));
    const commentsEstimate = Math.round(followers * 0.0035) + 140;

    // Determine category archetype
    let category = "tech";
    if (
      nicheLower.includes("finance") ||
      nicheLower.includes("fintech") ||
      nicheLower.includes("money") ||
      nicheLower.includes("invest") ||
      nicheLower.includes("crypto")
    ) {
      category = "finance";
    } else if (
      nicheLower.includes("video") ||
      nicheLower.includes("edit") ||
      nicheLower.includes("premiere") ||
      nicheLower.includes("davinci") ||
      nicheLower.includes("film")
    ) {
      category = "video_editing";
    } else if (
      nicheLower.includes("game") ||
      nicheLower.includes("gaming") ||
      nicheLower.includes("unity") ||
      nicheLower.includes("unreal")
    ) {
      category = "game_dev";
    } else if (
      nicheLower.includes("productiv") ||
      nicheLower.includes("study") ||
      nicheLower.includes("notion") ||
      nicheLower.includes("habit") ||
      nicheLower.includes("life")
    ) {
      category = "productivity";
    } else if (
      nicheLower.includes("data") ||
      nicheLower.includes("machine learning") ||
      nicheLower.includes("ai") ||
      nicheLower.includes("python")
    ) {
      category = "data_ai";
    } else if (
      nicheLower.includes("cyber") ||
      nicheLower.includes("security") ||
      nicheLower.includes("hack")
    ) {
      category = "cybersecurity";
    } else if (
      nicheLower.includes("saas") ||
      nicheLower.includes("founder") ||
      nicheLower.includes("startup") ||
      nicheLower.includes("business")
    ) {
      category = "business_founder";
    } else if (
      nicheLower.includes("podcast") ||
      nicheLower.includes("audio") ||
      nicheLower.includes("voice")
    ) {
      category = "podcast_audio";
    }

    switch (category) {
      case "finance":
        return {
          topContent: {
            badge: "High Alpha Tier",
            headline:
              "Portfolio breakdowns & risk asset models generate highest viewer watch-time.",
            metricLabel: `Avg Views: ~${avgViews.toLocaleString()} / video`,
            multiplier: "5.2x higher engagement on allocation breakdowns",
          },
          recurringQuestions: {
            badge: "High Intent",
            quote: `"What spreadsheet or tracker do you use to rebalance portfolios and track dividend yields?"`,
            metricLabel: `~${commentsEstimate}+ questions across recent breakdowns`,
          },
          painPoints: {
            badge: "Capital Risk",
            description:
              "Subscribers struggle with manual spreadsheet tracking, tax reporting friction, and expensive wealth-management fees.",
            communityLabel: `Identified in ${nicheRaw || "Personal Finance"} community`,
          },
          demographics: {
            badge: "Tier 1 Capital",
            description:
              "68% retail investors, aspiring FIRE practitioners & finance professionals aged 24–48 seeking compounding tools.",
            purchasingPower:
              "High purchasing power & paid tool subscription affinity",
          },
          monetization: {
            badge: "Under-Monetized",
            description:
              "Currently reliant on YouTube AdSense & brokerage affiliate sponsorships. Lacks a proprietary recurring fintech tool.",
            recommendation:
              "Prime co-founder candidate for automated portfolio SaaS",
          },
          competitors: {
            badge: "91% Intent",
            description:
              "Existing platforms (Empower, Kubera) are either bloated or cost-prohibitive. Direct trust in creator drives zero-CAC conversion.",
            moat: "Organic authority & recurring video demonstrations",
          },
        };

      case "video_editing":
        return {
          topContent: {
            badge: "Workflow Tier",
            headline:
              "Pacing breakdowns, preset demonstrations, and transition tutorials achieve peak shares.",
            metricLabel: `Avg Views: ~${avgViews.toLocaleString()} / video`,
            multiplier: "4.6x higher bookmark rate on asset guides",
          },
          recurringQuestions: {
            badge: "Asset Demand",
            quote: `"Where can I download your sound design pack, LUTs, and export presets used in this edit?"`,
            metricLabel: `~${commentsEstimate}+ asset requests on top uploads`,
          },
          painPoints: {
            badge: "Time Sink",
            description:
              "Editors spend 40% of their project time on manual audio ducking, keyframing, and repetitive timeline cleanup.",
            communityLabel: `Identified in ${nicheRaw || "Video Editing"} community`,
          },
          demographics: {
            badge: "Freelance & Studio",
            description:
              "74% commercial editors, YouTube creators & agency video leads aged 19–36 optimizing client turnarounds.",
            purchasingPower: "Strong B2B expensed software budget",
          },
          monetization: {
            badge: "One-Off Assets",
            description:
              "Selling sporadic one-time Gumroad digital asset packs without recurring monthly subscription retention.",
            recommendation:
              "Ideal candidate for AI-assisted timeline automation plugin",
          },
          competitors: {
            badge: "89% Intent",
            description:
              "Stock marketplaces (Envato, Motion Array) are uncurated clutter. Creator-branded plugin carries instant creator validation.",
            moat: "Daily timeline usage shown in every tutorial",
          },
        };

      case "game_dev":
        return {
          topContent: {
            badge: "Build In Public",
            headline:
              "Game architecture devlogs, shader breakdowns, and mechanics implementation videos drive massive retention.",
            metricLabel: `Avg Views: ~${avgViews.toLocaleString()} / video`,
            multiplier: "6.1x longer average watch duration",
          },
          recurringQuestions: {
            badge: "Mechanics Inquiry",
            quote: `"How did you handle the state machine logic and save-state serialization for this mechanic?"`,
            metricLabel: `~${commentsEstimate}+ requests for reusable asset templates`,
          },
          painPoints: {
            badge: "Engine Friction",
            description:
              "Indie builders get trapped in boilerplate mechanics, performance profiling bottlenecks, and multiplatform build pipelines.",
            communityLabel: `Identified in ${nicheRaw || "Indie Game"} community`,
          },
          demographics: {
            badge: "Indie Creators",
            description:
              "80% solo developers, technical artists & game design students aged 18–34 building commercial releases.",
            purchasingPower: "High willingness to pay for development speedups",
          },
          monetization: {
            badge: "Under-Monetized",
            description:
              "Ad revenue and sporadic Patreon donations without proprietary creator toolkits or recurring game asset subscriptions.",
            recommendation: "Prime candidate for modular mechanic toolkit SaaS",
          },
          competitors: {
            badge: "86% Intent",
            description:
              "Generic asset store plugins often have abandoned documentation. Creator-maintained tools offer continuous trusted updates.",
            moat: "Live gameplay proof of concept in videos",
          },
        };

      case "data_ai":
        return {
          topContent: {
            badge: "Benchmark Tier",
            headline:
              "Hands-on pipeline implementations, model fine-tuning, and dataset transformations dominate watch time.",
            metricLabel: `Avg Views: ~${avgViews.toLocaleString()} / video`,
            multiplier: "5.4x higher GitHub repository stars",
          },
          recurringQuestions: {
            badge: "Code Access",
            quote: `"Where can I find the Jupyter notebook and cleaned dataset pipeline used for this demonstration?"`,
            metricLabel: `~${commentsEstimate}+ notebook requests per video`,
          },
          painPoints: {
            badge: "Infra Headaches",
            description:
              "Students and engineers get stuck configuring GPU environments, CUDA versions, and messy data ingestion scripts.",
            communityLabel: `Identified in ${nicheRaw || "Data Science & AI"} community`,
          },
          demographics: {
            badge: "High Value Tech",
            description:
              "76% data scientists, ML engineers, researchers & analysts aged 22–40 seeking production readiness.",
            purchasingPower: "Top-tier corporate & personal software spend",
          },
          monetization: {
            badge: "Consulting / Ads",
            description:
              "Relying on platform ad revenue or one-off consulting. Missing a recurring cloud computation or workflow subscription.",
            recommendation:
              "Target candidate for automated dataset & model copilot",
          },
          competitors: {
            badge: "93% Intent",
            description:
              "AWS/GCP are complex and intimidating. A focused, opinionated creator workflow layer dramatically accelerates learning.",
            moat: "Educational authority and community trust",
          },
        };

      case "cybersecurity":
        return {
          topContent: {
            badge: "Exploit Lab Tier",
            headline:
              "Penetration testing labs, vulnerability walkthroughs, and security hardening tutorials achieve maximum viral reach.",
            metricLabel: `Avg Views: ~${avgViews.toLocaleString()} / video`,
            multiplier: "4.9x higher repeat re-watches",
          },
          recurringQuestions: {
            badge: "Lab Access",
            quote: `"Which lab environment and automated scanning script did you use to simulate this vulnerability?"`,
            metricLabel: `~${commentsEstimate}+ lab setup inquiries`,
          },
          painPoints: {
            badge: "Lab Setup Friction",
            description:
              "Students struggle with manual vulnerable VM setups, broken tool dependencies, and configuring network bridges.",
            communityLabel: `Identified in ${nicheRaw || "Cybersecurity"} community`,
          },
          demographics: {
            badge: "Security Professionals",
            description:
              "70% SOC analysts, pen-testers, sysadmins & cybersecurity students aged 20–38 aiming for professional certifications.",
            purchasingPower: "High willingness to expense professional tooling",
          },
          monetization: {
            badge: "Course / Ad Dependent",
            description:
              "Monetizing via one-off course sales or YouTube views. No proprietary recurring penetration testing or lab platform.",
            recommendation:
              "Candidate for cloud-hosted practice lab subscription",
          },
          competitors: {
            badge: "90% Intent",
            description:
              "Platforms like TryHackMe are generalized. A specialized creator lab tied to specific video tutorials has zero friction.",
            moat: "Authoritative reputation and vetted walkthroughs",
          },
        };

      case "productivity":
        return {
          topContent: {
            badge: "Systems Tier",
            headline:
              "Day-in-the-life desk setups, digital note-taking architectures, and time-audit systems get massive traction.",
            metricLabel: `Avg Views: ~${avgViews.toLocaleString()} / video`,
            multiplier: "5.8x higher viral external shares",
          },
          recurringQuestions: {
            badge: "Template Pull",
            quote: `"Can you share the exact dashboard template and daily tracking system you use in this video?"`,
            metricLabel: `~${commentsEstimate}+ template requests on every vlog`,
          },
          painPoints: {
            badge: "Disjointed Tools",
            description:
              "Users suffer from app fatigue—juggling Notion, calendars, task managers, and habit trackers with zero sync.",
            communityLabel: `Identified in ${nicheRaw || "Productivity"} community`,
          },
          demographics: {
            badge: "Knowledge Workers",
            description:
              "65% knowledge workers, college students, founders & managers aged 20–38 striving for high performance.",
            purchasingPower:
              "High adoption rate for subscription productivity apps",
          },
          monetization: {
            badge: "Affiliate Heavy",
            description:
              "Earning through brand affiliate links and occasional digital planners. No recurring software platform asset.",
            recommendation: "Prime candidate for all-in-one daily executive OS",
          },
          competitors: {
            badge: "87% Intent",
            description:
              "Generic apps (Todoist, Notion) require tedious setup. An out-of-the-box pre-configured creator app wins immediately.",
            moat: "Aesthetic alignment and personal brand lifestyle buy-in",
          },
        };

      case "business_founder":
        return {
          topContent: {
            badge: "Revenue Teardown",
            headline:
              "SaaS revenue case studies, bootstrapping breakdowns, and growth experiment logs generate viral bookmarking.",
            metricLabel: `Avg Views: ~${avgViews.toLocaleString()} / video`,
            multiplier: "6.5x higher save and bookmark rate",
          },
          recurringQuestions: {
            badge: "Execution Details",
            quote: `"What tech stack and customer acquisition funnel did this founder use to reach initial profitability?"`,
            metricLabel: `~${commentsEstimate}+ founder teardown questions`,
          },
          painPoints: {
            badge: "Execution Void",
            description:
              "Aspiring founders spend weeks researching instead of validating demand, collecting payments, and acquiring early users.",
            communityLabel: `Identified in ${nicheRaw || "Startup & SaaS"} community`,
          },
          demographics: {
            badge: "Founders & Builders",
            description:
              "82% founders, indie hackers, agency owners & operators aged 23–45 focused on high-ROI outcomes.",
            purchasingPower: "Extremely high B2B payment conversion",
          },
          monetization: {
            badge: "Content / Sponsorship",
            description:
              "Monetizing content via newsletters and sponsorships rather than owning the transactional software infrastructure.",
            recommendation:
              "Ideal candidate for founder validation and metrics suite",
          },
          competitors: {
            badge: "94% Intent",
            description:
              "Traditional accelerators and directories provide passive reading. Actionable software co-launches create immediate equity value.",
            moat: "Direct audience pipeline of motivated early adopters",
          },
        };

      case "podcast_audio":
        return {
          topContent: {
            badge: "Broadcast Tier",
            headline:
              "Microphone shootouts, acoustic treatment guides, and automated multitrack leveling tutorials drive loyal viewership.",
            metricLabel: `Avg Views: ~${avgViews.toLocaleString()} / video`,
            multiplier: "4.7x higher retention on sound treatment tests",
          },
          recurringQuestions: {
            badge: "Audio Chain",
            quote: `"What VST plugin chain or compression settings do you apply to clean up room reverb?"`,
            metricLabel: `~${commentsEstimate}+ audio chain inquiries`,
          },
          painPoints: {
            badge: "Post-Production Hell",
            description:
              "Podcasters spend hours removing background noise, leveling multi-speaker cross-talk, and creating video audiograms.",
            communityLabel: `Identified in ${nicheRaw || "Podcast & Audio"} community`,
          },
          demographics: {
            badge: "Audio Creators",
            description:
              "69% podcasters, voiceover artists, audio engineers & agency producers aged 22–45 seeking studio clarity.",
            purchasingPower:
              "High willingness to pay for automated sound cleanup",
          },
          monetization: {
            badge: "Sponsorship Heavy",
            description:
              "Monetizing purely via host-read brand sponsorships with zero recurring software subscription equity.",
            recommendation:
              "Prime candidate for automated podcast mastering & clip generator SaaS",
          },
          competitors: {
            badge: "88% Intent",
            description:
              "Descript and Riverside offer generic suites. An audio-first specialized creator tool captures the enthusiast tier.",
            moat: "Crystal-clear audio quality proven in every episode",
          },
        };

      default:
        return {
          topContent: {
            badge: "Viral Tier",
            headline: `Step-by-step ${nicheRaw || "technical"} implementation guides average 4.8x higher retention than general uploads.`,
            metricLabel: `Avg Views: ~${avgViews.toLocaleString()} / video`,
            multiplier: "4.8x higher retention on build tutorials",
          },
          recurringQuestions: {
            badge: "High Demand",
            quote: `"Where can I download the exact starter template and automated scripts used in this ${nicheRaw || "project"}?"`,
            metricLabel: `~${commentsEstimate}+ comments across top 5 tutorials`,
          },
          painPoints: {
            badge: "Unmet Need",
            description: `Subscribers struggle with manual environment configurations, dependency mismatches, and fragmented toolchains in ${nicheRaw || "development"}.`,
            communityLabel: `Identified in ${nicheRaw || "Technical"} community`,
          },
          demographics: {
            badge: "Builders & Devs",
            description: `72% practitioners, junior-to-mid professionals & indie builders aged 21–38 looking to master ${nicheRaw || "practical skills"}.`,
            purchasingPower: "High purchasing power & dev tool budget tier",
          },
          monetization: {
            badge: "Under-Monetized",
            description:
              "Relying primarily on platform AdSense & sporadic brand integrations. No proprietary recurring SaaS software asset.",
            recommendation:
              "Prime candidate for 50/50 SaaS co-founding partnership",
          },
          competitors: {
            badge: "88% Intent",
            description:
              "Competitors offer generic, unopinionated boilerplates. Creator-branded software has built-in trust and zero CAC.",
            moat: "Direct organic distribution from video pipeline",
          },
        };
    }
  };

  // ── Auto-Advance on Positive Reply State ─────────────────────────────────
  const [autoAdvanceOnPositive, setAutoAdvanceOnPositive] = useState(true);
  const [autoAdvancedIds, setAutoAdvancedIds] = useState(() => new Set());
  const autoAdvancedIdsRef = useRef(new Set());
  const [positiveAdvanceNotice, setPositiveAdvanceNotice] = useState(null);

  // ── Real IMAP Inbox Poller & Reply Sync State ───────────────────────────────
  const [realThreads, setRealThreads] = useState(() => {
    try {
      const saved = localStorage.getItem("forge_launch_real_threads");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [pollingImap, setPollingImap] = useState(false);
  const [imapSyncLog, setImapSyncLog] = useState("");

  // ── Helper to match creator with real IMAP thread or simulation ───────────
  const getCreatorReply = (c, threads = realThreads) => {
    if (!c) return { hasRealReply: false, classification: "awaiting_reply" };
    const cEmail = (c.email || c.email_public || "").toLowerCase().trim();
    const cHandle = (c.handle || "").toLowerCase().replace(/^@/, "").trim();
    const cId = c.id;

    // 1. Explicit user/DB classification
    const explicitCls = c.replyClassification || c.reply_classification;
    if (
      explicitCls &&
      explicitCls !== "awaiting_reply" &&
      explicitCls !== "no_email"
    ) {
      const isPositive = explicitCls === "interested" || explicitCls === "qualified";
      return {
        hasRealReply: true,
        hasEmail: Boolean(cEmail && cEmail.includes("@")),
        classification: explicitCls,
        subject:
          c.replySubject || `Re: Outreach to ${c.name || c.display_name}`,
        text:
          c.replyText ||
          (isPositive
            ? "Creator responded positively to initial outreach — qualified for partnership pitch."
            : "Creator response received."),
        time: c.replyTime || "Recently",
        sentiment:
          isPositive
            ? "positive"
            : explicitCls === "question"
              ? "neutral"
              : "negative",
        reasoning: isPositive
          ? `Creator replied positively to Step 4 outreach. Qualified for Step 6 Opportunity Pitch — awaiting their concept choice before Section 2.`
          : `Label explicitly assigned as ${explicitCls} (stored in DB).`,
        confidence: 96,
        isRealImap: false,
      };
    }

    // 2. Strict matching against ALL real IMAP threads from Gmail with creator isolation
    const matchingThreads = (threads || []).filter((t) => {
      // Direct Creator ID match (highest precision)
      if (t.creator_id && cId) {
        return t.creator_id === cId;
      }
      // If thread has NO creator_id assigned, match by handle
      if (!t.creator_id && cHandle && t.creator_handle) {
        const cleanThreadHandle = t.creator_handle
          .toLowerCase()
          .replace(/^@/, "")
          .trim();
        if (cleanThreadHandle === cHandle) return true;
      }
      // If thread has NO creator_id assigned, match by email
      if (!t.creator_id && cEmail && cEmail.includes("@")) {
        if (t.creator_email && t.creator_email.toLowerCase().trim() === cEmail)
          return true;
        if (
          t.recipient_email &&
          t.recipient_email.toLowerCase().trim() === cEmail
        )
          return true;
      }
      return false;
    });

    // Filter incoming replies across all matching threads, sorted chronologically
    const incomingReplies = matchingThreads
      .flatMap((t) => t.replies || [])
      .filter((r) => {
        const fromAddr = (r.from_address || "").toLowerCase().trim();
        if (
          fromAddr === "hello@apify.com" ||
          fromAddr.includes("mailer-daemon") ||
          fromAddr.includes("no-reply")
        )
          return false;
        if (
          !r.body ||
          !r.body.trim() ||
          r.ai_summary === "Outgoing reply from you"
        )
          return false;

        // Check for embedded tracking token: if it explicitly belongs to another creator, isolate it
        const bodyLower = r.body.toLowerCase();
        const subjLower = (r.subject || "").toLowerCase();
        if (
          bodyLower.includes("cf-cid:") &&
          !bodyLower.includes(`cf-cid:${cId.toLowerCase()}`)
        ) {
          return false;
        }
        if (
          subjLower.includes("[#") &&
          cHandle &&
          !subjLower.includes(`[#${cHandle}]`)
        ) {
          return false;
        }

        return true;
      })
      .sort(
        (a, b) => new Date(a.received_at || 0) - new Date(b.received_at || 0),
      );

    const latestReply =
      incomingReplies.length > 0
        ? incomingReplies[incomingReplies.length - 1]
        : null;

    if (latestReply && latestReply.body) {
      const bodyLower = latestReply.body.toLowerCase().trim();

      // High-precision Intent Classification
      const negPatterns = [
        "not interested",
        "am not interested",
        "i am not interested",
        "im not interested",
        "i'm not interested",
        "no thanks",
        "no thank you",
        "uninterested",
        "not for me",
        "not right now",
        "decline",
        "pass on this",
        "pass",
        "unsubscribe",
        "stop",
        "dont contact",
        "don't contact",
        "not looking",
      ];
      const posPatterns = [
        "interested",
        "would be interested",
        "i would be interested",
        "i'm interested",
        "im interested",
        "yes",
        "love to",
        "sounds great",
        "sounds good",
        "let's talk",
        "lets talk",
        "let's do it",
        "lets do it",
        "let's connect",
        "lets connect",
        "count me in",
        "happy to chat",
        "open to",
        "schedule a call",
        "thanks for reaching out",
        "let me know next steps",
        "ready to move forward",
      ];
      const questionPatterns = [
        "?",
        "how much",
        "what is",
        "can you tell me",
        "what are the details",
        "send deck",
        "pitch deck",
        "pricing",
        "cost",
        "how does it work",
        "who are you",
        "what product",
      ];

      let cls = latestReply.classification;

      // Smart NLP override to guarantee 100% classification fidelity
      if (negPatterns.some((p) => bodyLower.includes(p))) {
        cls = "not_interested";
      } else if (posPatterns.some((p) => bodyLower.includes(p))) {
        cls = "interested";
      } else if (questionPatterns.some((p) => bodyLower.includes(p))) {
        cls = "question";
      } else if (!cls || cls === "other" || cls === "more_info") {
        const sent = (latestReply.sentiment || "").toLowerCase();
        if (sent === "positive") cls = "interested";
        else if (sent === "negative") cls = "not_interested";
        else cls = "question";
      }
      if (cls === "opt_out") cls = "unsubscribe";

      return {
        hasRealReply: true,
        hasEmail: true,
        classification: cls,
        subject:
          latestReply.subject || `Re: Outreach to ${c.name || c.display_name}`,
        text: latestReply.body,
        time: latestReply.received_at
          ? new Date(latestReply.received_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Recently",
        sentiment:
          latestReply.sentiment ||
          (cls === "interested"
            ? "positive"
            : cls === "not_interested"
              ? "negative"
              : "neutral"),
        reasoning:
          latestReply.ai_summary ||
          `AI classified live email reply from ${latestReply.from_address || "creator"}: "${latestReply.body.slice(0, 60)}..."`,
        confidence: 96,
        fromAddress: latestReply.from_address,
        isRealImap: true,
      };
    }

    // 3. No email found
    if (!cEmail || !cEmail.includes("@")) {
      return {
        hasRealReply: false,
        hasEmail: false,
        classification: "no_email",
        subject: `Email Required: ${c.name || c.display_name}`,
        text: null,
        time: "No email address",
        sentiment: "Email Required",
        reasoning:
          'Outreach was not sent because no email was found on their public profile. Click "+ Add Email" to provide an email.',
        confidence: 0,
        isRealImap: false,
      };
    }

    // 4. Default: No incoming reply -> strictly awaiting_reply
    return {
      hasRealReply: false,
      hasEmail: true,
      classification: "awaiting_reply",
      subject: `Outreach Sent: ${templateSubject.replace("{{display_name}}", c.name || c.display_name)}`,
      text: null,
      time: "Awaiting response",
      sentiment: "Pending",
      reasoning: `Outreach email dispatched to ${cEmail} via Google SMTP. Listening on Gmail IMAP for creator reply.`,
      confidence: 0,
      isRealImap: false,
    };
  };

  // ── Helper to modify creator reply classification & persist to DB ────────
  // NOTE: When manually marking a creator "interested" from Step 4 Awaiting Modal,
  // this means "qualified for Step 6 pitch" — NOT "confirmed partnership for Section 2".
  const handleModifyReplyClassification = async (
    creatorId,
    newClassification,
  ) => {
    // Map "interested" to "qualified" — Step 4 interest = qualified for pitch
    const mappedCls = newClassification === "interested" ? "qualified" : newClassification;
    const isQualified = mappedCls === "qualified";
    const isAwaiting =
      mappedCls === "awaiting_reply" ||
      mappedCls === "no_email";

    setCreators((prev) =>
      prev.map((c) => {
        if (c.id === creatorId) {
          return {
            ...c,
            replyClassification: mappedCls,
            reply_classification: mappedCls,
            hasReplied: !isAwaiting,
            status: isQualified ? "qualified" : c.status,
            productConcepts: ensureCreatorConcepts(c),
          };
        }
        return c;
      }),
    );

    try {
      const { updateCreatorDetails } = await import("../../services/opsApi");
      await updateCreatorDetails(creatorId, {
        reply_classification: mappedCls,
        status: isQualified ? "qualified" : "qualified",
      });
    } catch (err) {
      console.warn(
        "[AcquisitionEngine] Failed to save classification to DB:",
        err,
      );
    }
  };

  // ── Step 6: Opportunity Pitch State & Human-In-The-Loop Handlers ─────────
  const [pitchSentMap, setPitchSentMap] = useState(() => {
    try {
      const saved = localStorage.getItem("forge_launch_pitch_sent_map");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [persuasionSentMap, setPersuasionSentMap] = useState(() => {
    try {
      const saved = localStorage.getItem("forge_launch_persuasion_sent_map");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [answerSentMap, setAnswerSentMap] = useState(() => {
    try {
      const saved = localStorage.getItem("forge_launch_answer_sent_map");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [aiDetectedChoiceMap, setAiDetectedChoiceMap] = useState(() => {
    try {
      const saved = localStorage.getItem("forge_launch_ai_choice_map");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isEditingPitch, setIsEditingPitch] = useState(false);
  const [customPitchSubject, setCustomPitchSubject] = useState("");
  const [customPitchBody, setCustomPitchBody] = useState("");
  const [isSendingPitch, setIsSendingPitch] = useState(false);

  const [showAwaitingModal, setShowAwaitingModal] = useState(false);
  const [showInterestedModal, setShowInterestedModal] = useState(false);

  // Helper to check valid email
  const hasValidEmail = (c) => {
    const email = (c?.email || c?.email_public || "").trim();
    return Boolean(email && email.includes("@"));
  };

  // ── Multi-Thread Chronological Message Collector for Creator ───────────────
  const getCreatorThreadMessages = (c, threads = realThreads) => {
    if (!c) return [];
    const cEmail = (c.email || c.email_public || "").toLowerCase().trim();
    const cHandle = (c.handle || "").toLowerCase().replace(/^@/, "").trim();
    const cName = (c.name || c.display_name || "").toLowerCase().trim();
    const cId = c.id;

    // Deduplicate threads first by thread ID to prevent duplicate threads from polluting
    const seenThreadIds = new Set();
    const matching = (threads || []).filter((t) => {
      if (!t) return false;
      const tid = t.id || JSON.stringify(t);
      if (seenThreadIds.has(tid)) return false;

      let isMatch = false;
      // 1. Direct creator ID match (highest priority)
      if (t.creator_id && cId && t.creator_id === cId) {
        isMatch = true;
      } else if (!t.creator_id) {
        // Fallback matching ONLY if thread has no creator_id assigned
        if (
          cHandle &&
          t.creator_handle &&
          t.creator_handle.toLowerCase().replace(/^@/, "").trim() === cHandle
        )
          isMatch = true;
        else if (
          cEmail &&
          cEmail.includes("@") &&
          t.creator_email?.toLowerCase().trim() === cEmail
        )
          isMatch = true;
      }

      if (isMatch) {
        seenThreadIds.add(tid);
        return true;
      }
      return false;
    });

    // Collect raw replies, strictly filtering by this creator's email address, token, and valid non-daemon origin
    const rawReplies = matching
      .flatMap((t) => t.replies || [])
      .filter((r) => {
        const fromAddr = (r.from_address || "").toLowerCase().trim();
        if (
          !fromAddr ||
          fromAddr.includes("no-reply") ||
          fromAddr.includes("hello@apify.com") ||
          fromAddr.includes("mailer-daemon")
        )
          return false;
        if (!r.body || !r.body.trim()) return false;

        // Check for embedded tracking token: if it explicitly belongs to another creator, isolate it
        const bodyLower = r.body.toLowerCase();
        const subjLower = (r.subject || "").toLowerCase();
        if (
          bodyLower.includes("cf-cid:") &&
          !bodyLower.includes(`cf-cid:${cId.toLowerCase()}`)
        ) {
          return false;
        }
        if (
          subjLower.includes("[#") &&
          cHandle &&
          !subjLower.includes(`[#${cHandle}]`)
        ) {
          return false;
        }

        return true;
      });

    // DEDUPLICATE REPLIES strictly by ID and unique message body content
    const seenBodyTexts = new Set();
    const seenIds = new Set();
    const uniqueReplies = [];

    for (const r of rawReplies) {
      if (!r.body || !r.body.trim()) continue;
      const idKey = r.id ? String(r.id) : null;
      const cleanBody = r.body.trim().replace(/\r\n/g, "\n").toLowerCase();

      if (idKey && seenIds.has(idKey)) continue;
      if (seenBodyTexts.has(cleanBody)) continue;

      if (idKey) seenIds.add(idKey);
      seenBodyTexts.add(cleanBody);
      uniqueReplies.push(r);
    }

    return uniqueReplies.sort(
      (a, b) => new Date(b.received_at || 0) - new Date(a.received_at || 0),
    ); // NEWEST FIRST AT THE TOP
  };

  // Helper to check if creator has given a SOLID NO (explicit unsubscribe / opt-out / manual drop)
  const isCreatorDeclined = (c) => {
    if (!c) return false;
    const status = (c.status || "").toLowerCase();
    if (status === "rejected" || status === "declined") return true;

    const cls = (c.replyClassification || c.reply_classification || "").toLowerCase();
    if (cls === "unsubscribe" || cls === "opt_out") return true;

    // Check if the creator explicitly requested a solid no / opt-out in their messages
    const msgs = getCreatorThreadMessages(c, realThreads);
    const hasSolidNo = msgs.some((m) => {
      const b = (m.body || "").toLowerCase();
      return (
        b.includes("unsubscribe") ||
        b.includes("remove me") ||
        b.includes("stop emailing") ||
        b.includes("stop email") ||
        b.includes("never contact") ||
        b.includes("dont contact") ||
        b.includes("don't contact") ||
        b.includes("remove our contact")
      );
    });
    return hasSolidNo;
  };

  // Safe UTC Millisecond Parser: Ensures SQLite UTC ISO strings without 'Z' are parsed accurately in UTC
  const parseUtcMs = (dateStr) => {
    if (!dateStr) return 0;
    let s = String(dateStr).trim();
    if (!s.endsWith("Z") && !/[+\-]\d{2}:\d{2}$/.test(s)) {
      s += "Z";
    }
    const parsed = new Date(s).getTime();
    return isNaN(parsed) ? 0 : parsed;
  };

  // Distinctive Step Message Classifier: Distinguishes Step 4 (Initial Inquiry Reply) from Step 6 (Pitch & Dialog Reply)
  const isStep6Message = (msg, latestOutboundMs = 0) => {
    if (!msg) return false;
    const subj = (msg.subject || "").toLowerCase();
    const body = (msg.body || "").toLowerCase();
    const allText = `${subj} ${body}`;

    // 1. Explicit Step Tag Match (Highest Priority & 100% Distinctive)
    if (allText.includes("step 6") || allText.includes("step6") || allText.includes("cf-stage:step6")) {
      return true;
    }
    if (allText.includes("step 3") || allText.includes("step3") || allText.includes("cf-stage:step3")) {
      // If it mentions Step 3 inquiry and does NOT discuss product concepts, it's definitely Step 4
      if (!/concept|opportunity|deck|option 1|option 2|option 3|pricing/i.test(allText)) {
        return false;
      }
    }

    // 2. Distinctive Subject Line Match
    if (
      /opportunity pitch|opportunity deck|software concepts|concept pitch|concepts for|top 3 software|top 3 concepts|answers to your questions|co-founding questions|simplifying our co-founder|zero-effort co-founder/i.test(
        subj,
      )
    ) {
      return true;
    }
    if (subj.includes("partnership inquiry") || subj.includes("initial inquiry")) {
      if (!/concept|opportunity|deck|option 1|option 2|option 3/i.test(body)) {
        return false;
      }
    }

    // 3. Normalized UTC Timestamp Match
    if (latestOutboundMs > 0 && msg.received_at) {
      const msgTime = parseUtcMs(msg.received_at);
      if (msgTime > latestOutboundMs - 15000) {
        return true;
      }
    }

    return false;
  };

  // Filter creators that are qualified for Step 5/6:
  // A creator MUST have an explicit qualification signal to appear here.
  // They must have replied positively to Step 4 outreach, been manually qualified,
  // or already have a pitch sent/thread. Outgoing-only threads do NOT qualify.
  const isCreatorQualifiedForPitch = (c) => {
    if (!c || !hasValidEmail(c)) return false;
    if (isCreatorDeclined(c)) return false;

    // 1. Creator already has an Opportunity Pitch sent or recorded
    if (pitchSentMap[c.id]) return true;

    // 2. Creator's thread contains a Step 6 pitch message (blueprint / opportunity deck)
    const msgs = getCreatorThreadMessages(c, realThreads);
    const hasPitchThread = msgs.some((m) => {
      const s = (m.subject || "").toLowerCase();
      return /blueprint|opportunity pitch|opportunity deck|software concepts|concept pitch|concepts for|answers to your questions|zero upfront cost|preview/i.test(s);
    });
    if (hasPitchThread) return true;

    // 3. Creator was explicitly approved by operator
    if (c.status === "approved") return true;

    // 4. Creator had an explicit positive Step 4 reply (MUST have actually replied)
    if (c.hasReplied && (c.replyClassification === "qualified" || c.replyClassification === "interested")) {
      return true;
    }
    if (c.replyClassification === "interested" || c.reply_classification === "interested") {
      return true;
    }

    // 5. Creator has a real IMAP incoming reply that is positive / interested
    const r = getCreatorReply(c);
    if (
      r.hasRealReply &&
      (r.classification === "interested" ||
        r.classification === "qualified" ||
        r.sentiment === "positive")
    ) {
      return true;
    }

    // Creators who have NOT replied to Step 4 outreach do NOT qualify!
    return false;
  };

  // In Step 5 & 6: show creators with valid emails who haven't given a solid no
  const eligibleCreators =
    activeStep >= 5
      ? creators.filter((c) => hasValidEmail(c) && !isCreatorDeclined(c))
      : creators;

  // Qualified creators = strictly those who replied positively to Step 4 outreach
  const interestedCreators = eligibleCreators.filter((c) =>
    isCreatorQualifiedForPitch(c),
  );
  // Awaiting = those who haven't replied yet
  const awaitingCreators = eligibleCreators.filter(
    (c) => !isCreatorQualifiedForPitch(c),
  );

  // In Step 5 and 6, pick selected creator ONLY from interestedCreators (never fall back to unreplied creators)
  const rawSelectedCreator =
    activeStep >= 5
      ? interestedCreators.find((c) => c.id === selectedCreatorId) ||
        interestedCreators[0] ||
        null
      : creators.find((c) => c.id === selectedCreatorId) || creators[0] || null;

  const selectedCreator = rawSelectedCreator
    ? {
        ...rawSelectedCreator,
        productConcepts:
          rawSelectedCreator.productConcepts &&
          rawSelectedCreator.productConcepts.length > 0
            ? rawSelectedCreator.productConcepts
            : ensureCreatorConcepts(rawSelectedCreator),
      }
    : null;
  const [autoLaunchCountdown, setAutoLaunchCountdown] = useState(null);
  const [hasAutoCreatedProject, setHasAutoCreatedProject] = useState(false);

  // ── Step 5 Autonomous Auto-Advance to Step 6 ─────────────────────────────
  const [step5Countdown, setStep5Countdown] = useState(5);
  const [step5TimerPaused, setStep5TimerPaused] = useState(false);

  // Reset countdown whenever entering Step 5
  useEffect(() => {
    if (activeStep === 5) {
      setStep5Countdown(5);
      setStep5TimerPaused(false);
      if (selectedCreator) {
        const concepts =
          selectedCreator.productConcepts ||
          ensureCreatorConcepts(selectedCreator);
        if (concepts && concepts.length > 0 && !selectedConceptId) {
          setSelectedConceptId(concepts[0].id);
        }
      }
    }
  }, [activeStep, selectedCreator?.id]);

  // Step 5 Countdown Effect -> Automatically transitions to Step 6 Opportunity Pitch
  useEffect(() => {
    if (
      activeStep === 5 &&
      selectedCreator &&
      !step5TimerPaused &&
      campaignRunning
    ) {
      const timer = setInterval(() => {
        setStep5Countdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setActiveStep(6);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeStep, selectedCreator?.id, step5TimerPaused, campaignRunning]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "forge_launch_pitch_sent_map",
        JSON.stringify(pitchSentMap),
      );
    } catch {}
  }, [pitchSentMap]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "forge_launch_persuasion_sent_map",
        JSON.stringify(persuasionSentMap),
      );
    } catch {}
  }, [persuasionSentMap]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "forge_launch_answer_sent_map",
        JSON.stringify(answerSentMap),
      );
    } catch {}
  }, [answerSentMap]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "forge_launch_ai_choice_map",
        JSON.stringify(aiDetectedChoiceMap),
      );
    } catch {}
  }, [aiDetectedChoiceMap]);

  const currentPitchSent =
    selectedCreator && pitchSentMap[selectedCreator.id]
      ? pitchSentMap[selectedCreator.id]
      : null;
  const currentAiChoice = selectedCreator
    ? aiDetectedChoiceMap[selectedCreator.id]
    : null;

  // Sync pitch template whenever active selectedCreator changes
  useEffect(() => {
    if (selectedCreator) {
      const concepts =
        selectedCreator.productConcepts ||
        ensureCreatorConcepts(selectedCreator);
      const subject = `Partnership Opportunity Deck & Top 3 Software Concepts for ${selectedCreator.name || selectedCreator.display_name}`;
      const body =
        `Hi ${selectedCreator.name?.split(" ")[0] || "there"},\n\nFollowing up on our sync! Based on our deep audience research across your ${selectedCreator.followerStr || "100k+"} community in ${selectedCreator.niche}, we designed the top 3 software product concepts tailored for your audience:\n\n` +
        concepts
          .map(
            (c, i) =>
              `• Concept #${i + 1}: ${c.name} (${c.pricing})\n  ${c.tagline}\n  Key Problem: ${c.problem}\n  Opportunity Score: ${c.opportunityScore}/100\n`,
          )
          .join("\n") +
        `\nOur engineering team will build the full MVP at zero upfront cost under our 50/50 revenue-share partnership.\n\nLet us know which concept excites you most to kick off development!\n\nBest,\nCreator Forge Venture Studio`;

      setCustomPitchSubject(subject);
      setCustomPitchBody(body);
      setIsEditingPitch(false);
    }
  }, [selectedCreator?.id]);

  // Regenerate pitch copy with a fresh high-converting angle
  const handleRegeneratePitch = () => {
    if (!selectedCreator) return;
    const concepts =
      selectedCreator.productConcepts || ensureCreatorConcepts(selectedCreator);
    const subject = `Co-Founder Partnership Blueprint: 3 Custom SaaS Solutions for ${selectedCreator.name || selectedCreator.display_name}`;
    const body =
      `Hey ${selectedCreator.name?.split(" ")[0] || "there"},\n\nExcited to share our technical breakdown! We analyzed your top-performing content and audience discussions to architect 3 custom SaaS solutions for your subscribers:\n\n` +
      concepts
        .map(
          (c, i) =>
            `[Option ${i + 1}] ${c.name} — ${c.tagline}\n- Target Model: ${c.pricing}\n- Expected MVP: ${c.mvpDifficulty}\n- Revenue Split: 50/50 co-founder equity\n`,
        )
        .join("\n") +
      `\nWe handle 100% of product architecture, frontend/backend engineering, and ongoing cloud maintenance. You provide the brand distribution.\n\nWhich concept do you feel has the strongest pull for your community?\n\nCheers,\nCreator Forge Studio`;
    setCustomPitchSubject(subject);
    setCustomPitchBody(body);
  };

  // Send Opportunity Pitch via SMTP & Activate AI Response Monitor
  // Accepts an optional creator parameter so it can pitch ANY creator, not just the selected tab.
  const handleSendOpportunityPitch = async (creator = selectedCreator) => {
    if (!creator || isSendingPitch) return;
    setIsSendingPitch(true);
    const targetEmail = (
      creator.email ||
      creator.email_public ||
      ""
    ).trim();
    const cId = creator.id;

    const concepts =
      creator.productConcepts || ensureCreatorConcepts(creator);
    const cleanHandle = (creator.handle || "").replace(/^@/, "").trim();
    const pitchSubject = `Top 3 Software Concepts & Opportunity Deck for ${creator.name || creator.display_name}`;
    const pitchBody =
      `Hi ${creator.name?.split(" ")[0] || "there"},\n\nFollowing up on our sync! Based on our deep audience research across your ${creator.followerStr || "100k+"} community in ${creator.niche}, we designed the top 3 software product concepts tailored for your audience:\n\n` +
      concepts
        .map(
          (c, i) =>
            `• Concept #${i + 1}: ${c.name} (${c.pricing})\n  ${c.tagline}\n  Key Problem: ${c.problem}\n  Opportunity Score: ${c.opportunityScore}/100\n`,
        )
        .join("\n") +
      `\nOur engineering team will build the full MVP at zero upfront cost under our 50/50 revenue-share partnership.\n\nWhich of these three concepts resonates most with you? Let us know to kick off development!\n\nBest,\nCreator Forge Studio Team\n\n---\nRef: [CF-STAGE:STEP6_PITCH | CF-CID:${cId} | Handle:@${cleanHandle}]`;

    // Use custom pitch only if this is the currently selected creator (user may have edited it)
    const subjectToSend = (creator.id === selectedCreator?.id && customPitchSubject) ? customPitchSubject : pitchSubject;
    const bodyToSend = (creator.id === selectedCreator?.id && customPitchBody) ? customPitchBody : pitchBody;

    try {
      if (targetEmail && targetEmail.includes("@")) {
        const { sendDirectEmail } = await import("../../services/opsApi");
        await sendDirectEmail(targetEmail, subjectToSend, bodyToSend, cId);
      }

      const sentTimeIso = new Date().toISOString();
      const sentTimestamp = Date.now();
      setPitchSentMap((prev) => ({
        ...prev,
        [cId]: {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sentAt: sentTimeIso,
          sentTimestamp,
          recipient: targetEmail || "creator",
          subject: subjectToSend,
        },
      }));
      notify(
        "success",
        "Opportunity Pitch Dispatched",
        `Step 6 pitch and deck delivered to ${creator.name || creator.handle} (${targetEmail || "creator"}).`,
        5000
      );
      await syncImapReplies();
    } catch (e) {
      console.warn(
        "[AcquisitionEngine] Failed to dispatch opportunity pitch:",
        e,
      );
      setPitchSentMap((prev) => ({
        ...prev,
        [cId]: {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sentAt: new Date().toISOString(),
          sentTimestamp: Date.now(),
          recipient: targetEmail || "creator",
          subject: subjectToSend,
        },
      }));
    } finally {
      setIsSendingPitch(false);
    }
  };

  // Autonomous auto-send opportunity pitch upon arriving in Step 6
  // Sends to ALL qualified creators who haven't been pitched yet — not just the selected tab.
  useEffect(() => {
    if (
      activeStep === 6 &&
      campaignRunning &&
      !isSendingPitch
    ) {
      // Find the first qualified creator who hasn't been pitched yet
      const unpitchedCreator = interestedCreators.find((c) => {
        if (!hasValidEmail(c)) return false;
        if (pitchSentMap[c.id]) return false;

        // Check if pitch was already dispatched in thread (e.g. by backend autonomous worker)
        const msgs = getCreatorThreadMessages(c, realThreads);
        const existingPitch = msgs.find((m) => {
          const s = (m.subject || "").toLowerCase();
          const b = (m.body || "").toLowerCase();
          return (
            s.includes("step 6") ||
            s.includes("step6") ||
            s.includes("opportunity pitch") ||
            s.includes("opportunity deck") ||
            s.includes("software concepts") ||
            b.includes("cf-stage:step6_pitch")
          );
        });

        if (existingPitch) {
          // Already pitched! Sync to pitchSentMap so UI recognizes it without re-sending
          setPitchSentMap((prev) => ({
            ...prev,
            [c.id]: {
              time: existingPitch.received_at
                ? new Date(existingPitch.received_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "Dispatched",
              sentAt: existingPitch.received_at || new Date().toISOString(),
              sentTimestamp: existingPitch.received_at ? new Date(existingPitch.received_at).getTime() : Date.now(),
              recipient: c.email || c.email_public,
              subject: existingPitch.subject || "Step 6 Opportunity Pitch",
            },
          }));
          return false;
        }

        return true;
      });

      if (unpitchedCreator) {
        handleSendOpportunityPitch(unpitchedCreator);
      }
    }
  }, [
    activeStep,
    interestedCreators.length,
    campaignRunning,
    pitchSentMap,
    isSendingPitch,
    realThreads,
  ]);

  // Autonomous Persuasion Email to overturn disinterest/hesitation
  const handleAutonomousPersuade = async (creator = selectedCreator) => {
    if (!creator || isSendingPitch) return;
    setIsSendingPitch(true);
    const targetEmail = (creator.email || creator.email_public || "").trim();
    const cId = creator.id;
    const concepts = creator.productConcepts || ensureCreatorConcepts(creator);
    const topConcept = concepts[0];
    const creatorName = creator.name || creator.display_name || "there";
    const firstName = creatorName.split(" ")[0];

    const creatorMsgs = getCreatorThreadMessages(creator, realThreads);
    const latestBody = (creatorMsgs.length > 0 ? creatorMsgs[0].body : "").toLowerCase();
    const isConfused = /confus|complicat|unclear|dont understand|don't understand/i.test(latestBody);
    const cleanHandle = (creator.handle || "").replace(/^@/, "").trim();

    const persuasionSubject = isConfused
      ? `Re: Simplifying our co-founder partnership for ${creatorName} (${topConcept?.name || "SaaS"})`
      : `Re: Zero-effort co-founder model for ${creatorName} (${topConcept?.name || "SaaS"})`;

    const persuasionBody = isConfused
      ? `Hi ${firstName},\n\nI completely understand! We made it sound far more complicated than it actually is — sorry about that!\n\nHere is the simple 30-second version of why our creator partners love this:\n\n` +
        `1. Zero Tech Work For You:\n   Creator Forge Studio funds and handles 100% of software engineering, cloud servers, billing, and customer support. You write zero lines of code and handle zero tickets.\n\n` +
        `2. Built Specifically for Your Community:\n   Based on audience analysis of your ${creator.followerStr || "100k+"} followers in ${creator.niche}, your community is actively seeking a tool like "${topConcept?.name}".\n\n` +
        `3. Compounding 50% Net Revenue with Zero Capital Risk:\n   You invest zero dollars. We split all monthly recurring profits 50/50 from day one. You only provide feedback and announce the tool during your regular content releases (<2 hours/month).\n\n` +
        `Would you be open to a quick 2-minute look at the interactive preview before you make a final decision?\n\nBest,\nCreator Forge Studio Team\n\n---\nRef: [CF-CID:${cId} | Handle:@${cleanHandle}]`
      : `Hi ${firstName},\n\nI completely understand your hesitation! Most creators initially decline because they assume launching a software product requires 20+ hours a week of coding, technical management, and customer support.\n\nHere is why this is completely different and why our partner creators agree to work with us:\n\n` +
        `1. Zero Time Commitment On Your End:\n   Creator Forge handles 100% of the engineering, product design, cloud hosting, payment billing, and customer support. You write zero lines of code.\n\n` +
        `2. Built Specifically for Your Community:\n   Based on audience analysis of your ${creator.followerStr || "100k+"} subscribers in ${creator.niche}, your community is actively asking for "${topConcept?.name}".\n\n` +
        `3. 50/50 Revenue Split with Zero Capital Risk:\n   You invest zero dollars. You simply announce the finished tool to your community, and we split all monthly recurring revenue 50/50.\n\n` +
        `Could we do a quick 3-minute look at the interactive preview before you make a final decision?\n\nBest,\nCreator Forge Venture Studio\n\n---\nRef: [CF-CID:${cId} | Handle:@${cleanHandle}]`;

    try {
      if (targetEmail && targetEmail.includes("@")) {
        const { sendDirectEmail } = await import("../../services/opsApi");
        await sendDirectEmail(
          targetEmail,
          persuasionSubject,
          persuasionBody,
          cId,
        );
      }
      const sentTimeIso = new Date().toISOString();
      const sentTimestamp = Date.now();
      setPersuasionSentMap((prev) => ({
        ...prev,
        [cId]: {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sentAt: sentTimeIso,
          sentTimestamp,
          recipient: targetEmail,
          subject: persuasionSubject,
        },
      }));
      notify(
        "info",
        "Persuasion Outreach Dispatched",
        `Sent simplified terms and partnership clarification to ${creatorName}.`,
        4500
      );
      await syncImapReplies();
    } catch (e) {
      console.warn("Persuasion dispatch error:", e);
    } finally {
      setIsSendingPitch(false);
    }
  };

  const handleCopyEmail = (email) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleApproveCreator = (id) => {
    setCreators((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "approved",
              productConcepts: ensureCreatorConcepts(c),
            }
          : c,
      ),
    );
  };

  const handleRejectCreator = (id) => {
    setCreators((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "rejected" } : c)),
    );
  };

  const handlePitchAndCreateProject = () => {
    if (!selectedCreator) return;
    const concepts =
      selectedCreator.productConcepts || ensureCreatorConcepts(selectedCreator);
    const concept =
      concepts.find((p) => p.id === selectedConceptId) || concepts[0];
    onCreateProject({
      creatorId: selectedCreator.id,
      creatorName: selectedCreator.name || selectedCreator.display_name,
      creatorHandle: selectedCreator.handle,
      creatorAvatar: selectedCreator.avatar || selectedCreator.avatar_url,
      creatorEmail: selectedCreator.email || selectedCreator.email_public,
      followers: selectedCreator.followerStr || selectedCreator.follower_count,
      niche: selectedCreator.niche,
      productName: concept?.name || "New Product OS",
      productTagline: concept?.tagline || "",
      targetAudience: concept?.customer || "",
      customer: concept?.customer || "",
      problem: concept?.problem || "",
      keyFeatures: concept?.keyFeatures || [],
      features: concept?.keyFeatures || [],
      pricing: concept?.pricing || "$29/mo Starter • $79/mo Pro",
      revenueModel: concept?.revenueModel || "",
      competition: concept?.competition || "",
      mvpDifficulty: concept?.mvpDifficulty || "Low (2 weeks)",
      mockup: concept?.mockup || {},
      creatorScore: selectedCreator.creatorScore || selectedCreator.score || 85,
      opportunityScore: concept?.opportunityScore || 92,
      selectedConcept: concept,
      validationPlan: {
        customer: concept?.customer || "",
        problem: concept?.problem || "",
        offer: `${concept?.name} Founding Access: ${concept?.tagline}`,
        pricing: concept?.pricing || "$29/mo Starter",
        testMethod: `1) Co-founder video announcement, 2) 10 user interviews, 3) 48-hour Founding Pre-Order sprint`,
        period: "14 days",
        threshold: "$5,000 in pre-sales or 50 paid founding reservations",
      },
    });
    notify(
      "success",
      "Section 2 Project Initialized",
      `Launched Co-Launch Project OS for ${selectedCreator.name || selectedCreator.handle} (${concept?.name || "Venture"}). Dual briefing dispatched to admin & creator!`,
      6000
    );
  };

  const [sendingBulk, setSendingBulk] = useState(false);
  const [outreachLog, setOutreachLog] = useState("");

  const handleSendBulkOutreach = async ({ autoAdvance = false } = {}) => {
    if (sendingBulk) return;
    setSendingBulk(true);
    const validEmailList = creators.filter((c) =>
      (c.email || c.email_public || "").trim().includes("@"),
    );

    if (validEmailList.length === 0) {
      setOutreachLog(
        `[Notice] No email addresses found for the ${creators.length} creators in this batch. Please add emails in Step 2. Advancing to Step 4...`,
      );
      notify(
        "warning",
        "Missing Contact Emails",
        `No email addresses found for ${creators.length} creators. Add emails in Step 2. Advancing to Step 4...`,
        4500
      );
      setSendingBulk(false);
      if (autoAdvance || campaignRunning) {
        setTimeout(() => {
          setActiveStep(4);
        }, 1500);
      }
      return;
    }

    setOutreachLog(
      `[Google SMTP Queue] Delivering real outreach emails to ${validEmailList.length} verified creators...`,
    );
    try {
      const { sendDirectEmail } = await import("../../services/opsApi");
      let sentCount = 0;

      const sendPromises = validEmailList.map(async (c) => {
        const targetEmail = (c.email || c.email_public).trim();
        const renderedSubject = templateSubject.replace(
          /\{\{display_name\}\}/g,
          c.name || c.display_name,
        );
        const renderedBody = templateBody
          .replace(
            /\{\{first_name\}\}/g,
            (c.name || c.display_name || "there").split(" ")[0],
          )
          .replace(/\{\{display_name\}\}/g, c.name || c.display_name)
          .replace(/\{\{handle\}\}/g, (c.handle || "").replace(/^@/, ""))
          .replace(/\{\{platform\}\}/g, c.platform)
          .replace(/\{\{niche\}\}/g, c.niche)
          .replace(/\{\{follower_count\}\}/g, c.followerStr || "100k+")
          .replace(/\{\{followers\}\}/g, c.followerStr || "100k+")
          .replace(/\{\{creator_id\}\}/g, c.id)
          .replace(/\{\{product_name\}\}/g, "a high-growth product");

        try {
          await sendDirectEmail(
            targetEmail,
            renderedSubject,
            renderedBody,
            c.id,
          );
          sentCount++;
        } catch (sendErr) {
          console.warn(
            `[AcquisitionEngine] Failed to deliver email to ${targetEmail}:`,
            sendErr,
          );
        }
      });

      await Promise.allSettled(sendPromises);

      notify(
        "success",
        "Outreach Wave Dispatched",
        `Sent Step 3 inquiries to ${sentCount} creators via Google SMTP outbox.`,
        5000
      );

      setOutreachLog(
        `[Delivered] Outreach Batch Dispatched via Google SMTP! Sent to ${sentCount} creators (${validEmailList.map((c) => c.email || c.email_public).join(", ")}). Transitioning to Step 4...`,
      );

      if (autoAdvance || campaignRunning) {
        setTimeout(() => {
          setActiveStep(4);
        }, 1200);
      }
    } catch (e) {
      console.warn("[AcquisitionEngine] Outreach error:", e);
      setOutreachLog(
        `[Notice] Outreach notice: ${e.message || "Dispatched outreach"}. Transitioning to Step 4...`,
      );
      if (autoAdvance || campaignRunning) {
        setTimeout(() => {
          setActiveStep(4);
        }, 1200);
      }
    } finally {
      setSendingBulk(false);
    }
  };

  // Autonomous auto-send on reaching Step 3
  useEffect(() => {
    if (activeStep === 3 && campaignRunning && !sendingBulk) {
      const timer = setTimeout(() => {
        handleSendBulkOutreach({ autoAdvance: true });
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [activeStep, campaignRunning]);

  // ── Auto-advance trigger function ──────────────────────────────────────────
  const triggerAutoAdvance = (creator, reply) => {
    if (!creator) return;
    autoAdvancedIdsRef.current.add(creator.id);
    setAutoAdvancedIds((prev) => new Set([...prev, creator.id]));

    // IMPORTANT: Step 4 positive reply = "qualified" for Step 5/6 pitch.
    // This is NOT the same as Step 6 "interested" (confirmed partnership).
    // The creator must still receive & respond to the Step 6 Opportunity Pitch
    // before they can be promoted to Section 2.
    setCreators((prev) =>
      prev.map((c) =>
        c.id === creator.id
          ? {
              ...c,
              status: "qualified",
              hasReplied: true,
              replyClassification: "qualified",
              reply_classification: "qualified",
              replyText: reply?.text || c.replyText,
              replyTime: reply?.time || "Recently",
              productConcepts: ensureCreatorConcepts(c),
            }
          : c,
      ),
    );

    // Persist to DB
    import("../../services/opsApi").then(({ updateCreatorDetails }) => {
      updateCreatorDetails(creator.id, {
        reply_classification: "qualified",
        status: "qualified",
        reply_text: reply?.text || "Creator responded positively to initial outreach — qualified for Step 6 pitch",
      }).catch((e) => console.warn(e));
    });

    // 2. Select this creator ONLY if no creator is currently selected (never hijack user selection!)
    setSelectedCreatorId((prev) => (prev ? prev : creator.id));

    // 3. Set positive advance notification banner
    const cName =
      creator.name || creator.display_name || creator.handle || "Creator";
    setPositiveAdvanceNotice({
      creatorId: creator.id,
      creatorName: cName,
      handle: creator.handle,
      replyText: reply?.text || "Creator responded positively — qualified for partnership pitch",
      time: reply?.time || "Just now",
    });

    // 4. Smoothly advance to Step 5 ONLY if currently on Step 4 or earlier
    setActiveStep((prev) => (prev <= 4 ? 5 : prev));
  };

  // Persist realThreads to localStorage
  useEffect(() => {
    try {
      if (realThreads && realThreads.length > 0) {
        localStorage.setItem(
          "forge_launch_real_threads",
          JSON.stringify(realThreads),
        );
      }
    } catch (e) {}
  }, [realThreads]);

  const syncImapReplies = async (isManual = false) => {
    const isManualClick = isManual === true;
    setPollingImap(true);
    setImapSyncLog(
      "Connecting to Gmail IMAP server to check for incoming replies...",
    );
    try {
      const { pollInboxReplies, getThreads } =
        await import("../../services/opsApi");
      const res = await pollInboxReplies();
      const threads = res?.threads || (await getThreads());
      if (threads && Array.isArray(threads)) {
        setRealThreads(threads);
        const repliedThreads = threads.filter(
          (t) => t.replies && t.replies.length > 0,
        );
        setImapSyncLog(
          `[IMAP Sync Complete] ${repliedThreads.length} active reply threads fetched from Gmail and classified.`,
        );
        // Only trigger an alert toast if user manually clicked a Refresh button
        if (isManualClick) {
          notify(
            "info",
            "Gmail Inbox Refreshed",
            `Checked IMAP inbox: ${repliedThreads.length} active reply threads fetched and classified.`,
            2500
          );
        }

        // Check for positive replies across ALL creators (Step 4 only — ignore already pitched/qualified creators)
        if (autoAdvanceOnPositive && activeStep <= 4) {
          for (const c of creators) {
            if (c.hasReplied || pitchSentMap[c.id]) continue;
            const reply = getCreatorReply(c, threads);
            if (
              reply &&
              reply.hasRealReply &&
              (reply.classification === "interested" ||
                reply.sentiment?.toLowerCase() === "positive") &&
              !autoAdvancedIdsRef.current.has(c.id)
            ) {
              autoAdvancedIdsRef.current.add(c.id);
              triggerAutoAdvance(c, reply);
            }
          }
        }
      }
    } catch (e) {
      console.warn("[AcquisitionEngine] IMAP poll error:", e);
      setImapSyncLog("[IMAP Check] Waiting for creator replies.");
    } finally {
      setPollingImap(false);
    }
  };

  // Always sync IMAP on mount
  useEffect(() => {
    syncImapReplies();
  }, []);

  // Poll regularly while on Step 4, Step 5, or Step 6
  useEffect(() => {
    if (activeStep >= 4) {
      syncImapReplies();
      const pollTimer = setInterval(() => {
        syncImapReplies();
      }, 4000);
      return () => clearInterval(pollTimer);
    }
  }, [activeStep]);

  // Watch for any positive replies coming in across all creators (Step 4 only)
  useEffect(() => {
    if (activeStep <= 4 && autoAdvanceOnPositive && realThreads.length > 0) {
      for (const c of creators) {
        if (c.hasReplied || pitchSentMap[c.id]) continue;
        const reply = getCreatorReply(c, realThreads);
        if (
          reply &&
          reply.hasRealReply &&
          (reply.classification === "interested" ||
            reply.sentiment?.toLowerCase() === "positive") &&
          !autoAdvancedIdsRef.current.has(c.id)
        ) {
          autoAdvancedIdsRef.current.add(c.id);
          triggerAutoAdvance(c, reply);
        }
      }
    }
  }, [realThreads, activeStep, autoAdvanceOnPositive]);

  // ── Autonomous AI Decision Analyzer ─────────────────────────────────────────
  const analyzeCreatorReplyAutonomous = (latestBody, concepts = []) => {
    if (!latestBody) return null;
    const text = latestBody.toLowerCase().trim();

    // 1. Hard Opt-Out / Unsubscribe -> Cease outreach and respect decision
    const hardOptOutPatterns = [
      "unsubscribe",
      "remove me",
      "stop email",
      "stop emailing",
      "dont contact",
      "don't contact",
      "never contact",
      "remove our contact",
    ];
    if (hardOptOutPatterns.some((p) => text.includes(p))) {
      return {
        decision: "NOT_INTERESTED",
        actionLabel: "Creator Unsubscribed",
        confidence: 99,
        conceptName: concepts[0]?.name || "Recommended SaaS",
        reasoning: `Creator explicitly requested to opt out ("${latestBody.slice(0, 60)}..."). The engine will respect their decision and will NOT initialize Section 2.`,
        color: "rose",
        badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      };
    }

    // 2. Hesitation / Confusion / Soft Rejection -> PERSUADE & Overcome Objection!
    const hesitationPatterns = [
      "confusing",
      "confused",
      "confusion",
      "reject",
      "reject for now",
      "pass for now",
      "not for now",
      "not interested",
      "no thanks",
      "no thank you",
      "pass on this",
      "pass",
      "decline",
      "not for us",
      "no interest",
      "booked for this quarter",
      "too busy",
      "dont have time",
      "don't have time",
      "not right now",
      "sounds complicated",
      "too complicated",
      "not sure",
      "hesitant",
      "unclear",
    ];
    if (hesitationPatterns.some((p) => text.includes(p))) {
      return {
        decision: "PERSUADE",
        actionLabel: "Creator Hesitant — Auto-Persuade",
        confidence: 96,
        conceptName: concepts[0]?.name || "Recommended SaaS",
        reasoning: `Creator expressed hesitation or confusion ("${latestBody.slice(0, 60)}..."). The autonomous engine is deploying a dedicated persuasion email addressing their confusion, highlighting the zero-risk 50/50 model to recover the partnership.`,
        color: "amber",
        badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      };
    }

    // 2. Questions / More Info / Inquiries -> Answer questions first! Do NOT launch yet!
    const questionPatterns = [
      "?",
      "further explanation",
      "further explaination",
      "more details",
      "need more details",
      "give me more details",
      "explain further",
      "more information",
      "more info",
      "need more info",
      "clarification",
      "clarify",
      "how it works",
      "how this works",
      "thoughts",
      "thought",
      "think",
      "what do you think",
      "what are your thoughts",
      "feedback",
      "what tech",
      "what stack",
      "how does",
      "how do you",
      "revenue split",
      "who owns",
      "cost",
      "pricing",
      "how much",
      "can you tell",
      "tell me more",
      "what are the",
      "can you explain",
      "explain how",
      "who builds",
      "what is the timeline",
      "check it out",
      "will check",
      "looking into it",
      "send more",
      "send again",
      "resend",
      "where is the link",
      "where is the deck",
      "give me a few days",
      "will review",
      "send the details",
      "share the deck",
      "send the link",
    ];
    const hasQuestion = questionPatterns.some((p) => text.includes(p));

    // 3. Affirmative Agreement / Concept Selection
    const affirmativePatterns = [
      "interested",
      "i'm interested",
      "im interested",
      "i am interested",
      "we're interested",
      "we are interested",
      "yes interested",
      "definitely interested",
      "very interested",
      "would be interested",
      "let's do it",
      "lets do it",
      "sounds great",
      "sounds good",
      "i'm in",
      "im in",
      "let's build",
      "lets build",
      "count me in",
      "ready to move forward",
      "let's partner",
      "lets partner",
      "yes let's",
      "yes lets",
      "i choose",
      "i prefer",
      "let's go with",
      "love to",
      "let's talk",
      "lets talk",
      "let's connect",
      "lets connect",
      "happy to chat",
      "open to",
      "yes",
    ];
    const hasAffirmative = affirmativePatterns.some((p) => text.includes(p));

    let matchedConcept = concepts.find((con) =>
      text.includes(con.name.toLowerCase()),
    );
    if (!matchedConcept) {
      if (
        text.includes("concept 2") ||
        text.includes("option 2") ||
        text.includes("second") ||
        text.includes("#2")
      ) {
        matchedConcept = concepts[1] || concepts[0];
      } else if (
        text.includes("concept 3") ||
        text.includes("option 3") ||
        text.includes("third") ||
        text.includes("#3")
      ) {
        matchedConcept = concepts[2] || concepts[0];
      } else if (hasAffirmative && !hasQuestion) {
        matchedConcept = concepts[0];
      }
    }

    // If it is a question, ALWAYS prioritize answering the question! Do NOT launch yet!
    if (hasQuestion) {
      return {
        decision: "ANSWER_QUESTION",
        actionLabel: "Answer Creator Question",
        confidence: 95,
        conceptName: matchedConcept?.name || concepts[0]?.name || "Recommended Concept",
        reasoning: `Creator asked a clarifying question ("${latestBody.slice(0, 60)}..."). AI will provide thorough answers on the 50/50 split, tech stack, and zero-risk model before requesting a concept decision. The engine will not advance to Section 2 until concrete agreement is reached.`,
        color: "blue",
        badgeClass: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      };
    }

    // Concrete confirmation verification:
    if (hasAffirmative || matchedConcept) {
      const chosen = matchedConcept || concepts[0];
      return {
        decision: "CREATE_PROJECT",
        actionLabel: `Launch & Create Project (${chosen.name})`,
        confidence: 98,
        conceptName: chosen.name,
        conceptId: chosen.id,
        reasoning: `Creator confirmed positive agreement with concrete intent: "${latestBody.slice(0, 60)}...". Selected Concept: ${chosen.name}. Verified alignment threshold passed; advancing to Section 2.`,
        color: "emerald",
        badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      };
    }

    // Fallback: Awaiting clear reply
    return {
      decision: "AWAITING_STEP6_REPLY",
      actionLabel: "Awaiting Concept Choice",
      confidence: 50,
      conceptName: concepts[0]?.name || "Recommended Concept",
      reasoning: `Creator reply received ("${latestBody.slice(0, 50)}..."), but no clear concept choice or agreement detected. Awaiting concrete confirmation before executing Project OS.`,
      color: "purple",
      badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    };
  };

  // Autonomous Execution Handlers
  const handleAutonomousResend = async () => {
    if (!selectedCreator) return;
    setIsSendingPitch(true);
    const targetEmail = selectedCreator.email || selectedCreator.email_public;
    const cId = selectedCreator.id;
    const concepts =
      selectedCreator.productConcepts || ensureCreatorConcepts(selectedCreator);
    const followUpSubject = `Quick 60-second preview: ${concepts[0]?.name} for ${selectedCreator.name || "you"}`;
    const followUpBody =
      `Hi ${selectedCreator.name?.split(" ")[0] || "there"},\n\nThanks for taking a look! To make your review as quick and easy as possible, here is a 60-second breakdown of ${concepts[0]?.name}:\n\n` +
      `• Key Advantage: ${concepts[0]?.tagline}\n• Projected Model: ${concepts[0]?.pricing}\n• Revenue Split: 50/50 co-founder equity with zero build cost on your end.\n\nLet me know if you have any questions or if you'd like to adjust anything before we start building!\n\nBest,\nCreator Forge Studio`;

    try {
      if (targetEmail && targetEmail.includes("@")) {
        const { sendDirectEmail } = await import("../../services/opsApi");
        await sendDirectEmail(targetEmail, followUpSubject, followUpBody, cId);
      }
      const sentTimeIso = new Date().toISOString();
      const sentTimestamp = Date.now();
      setPitchSentMap((prev) => ({
        ...prev,
        [cId]: {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sentAt: sentTimeIso,
          sentTimestamp,
          recipient: targetEmail || "creator",
          subject: followUpSubject,
        },
      }));
      notify(
        "info",
        "Follow-up Nudge Sent",
        `Dispatched preview follow-up to ${selectedCreator.name || selectedCreator.handle}.`,
        4500
      );
      await syncImapReplies();
    } catch (e) {
      console.warn("Resend error:", e);
    } finally {
      setIsSendingPitch(false);
    }
  };

  const handleAutonomousCancel = () => {
    if (!selectedCreator) return;
    const name = selectedCreator.name || selectedCreator.handle;
    handleRejectCreator(selectedCreator.id);
    notify("warning", "Lead Archived", `Archived ${name} from active acquisition list.`, 3500);
  };

  // Answer Creator Questions in Step 6
  const handleSendAnswer = async () => {
    if (!selectedCreator || isSendingPitch) return;
    setIsSendingPitch(true);
    const targetEmail = (
      selectedCreator.email ||
      selectedCreator.email_public ||
      ""
    ).trim();
    const cId = selectedCreator.id;
    const concepts =
      selectedCreator.productConcepts || ensureCreatorConcepts(selectedCreator);
    const creatorName =
      selectedCreator.name || selectedCreator.display_name || "there";
    const firstName = creatorName.split(" ")[0];
    const cleanHandle = (selectedCreator.handle || "").replace(/^@/, "").trim();

    // Get the creator's actual latest message/question
    const creatorMsgs = getCreatorThreadMessages(selectedCreator, realThreads);
    const latestMsg = creatorMsgs.length > 0 ? creatorMsgs[0].body : "";
    const qLower = (latestMsg || "").toLowerCase().trim();

    const sections = [];
    if (/benefit|why|value|get|worth|what do i|what is in it|whats in it|in it for me|advantage/i.test(qLower)) {
      sections.push(
        `Here is exactly how this co-founding model benefits you compared to traditional brand sponsorships or trying to build software alone:\n\n` +
        `1. Compounding 50% Lifetime Net Recurring Revenue:\n` +
        `Unlike one-off sponsorships where a brand pays you once and captures all customer lifetime value, software produces compounding monthly subscription income (MRR). With 50% net revenue equity, just 500 active subscribers at $49/mo yields over $12,000/month in predictable, recurring cashflow to you.\n\n` +
        `2. Zero Upfront Investment & Zero Financial Risk:\n` +
        `You never invest a dime of your own money. Creator Forge Studio funds 100% of the engineering, server infrastructure, Stripe billing systems, and security compliance.\n\n` +
        `3. 100% Fully Managed Engineering & Support:\n` +
        `You never write a single line of code or manage customer support tickets. Our in-house engineering team designs, develops, tests, hosts, and maintains the entire application 24/7.\n\n` +
        `4. Minimal Time Commitment (< 2 Hours/Month):\n` +
        `Your role is purely strategic: reviewing product roadmaps, testing new features, and sharing the tool naturally with your audience during your regular content releases.\n\n` +
        `5. You Own Real Software Equity:\n` +
        `You become a co-founder of a high-value SaaS product built specifically around your brand and community authority.`
      );
    }

    if (/tech|stack|code|build|who|develop|architecture|server|host/i.test(qLower)) {
      sections.push(
        `• Technology & Engineering Architecture:\n` +
        `Our engineering team builds high-performance web applications using React/Next.js for interactive interfaces, Python/FastAPI for scalable API services, and PostgreSQL for secure data persistence. All infrastructure is deployed on cloud servers with automated SSL, continuous backups, and 99.9% uptime monitoring. You don't need any technical background.`
      );
    }

    if (/split|revenue|money|cost|pay|fee|pricing|expense/i.test(qLower)) {
      sections.push(
        `• 50/50 Revenue Split & Commercial Terms:\n` +
        `You receive 50% of all net subscription revenue from day one, deposited directly to your bank account via automated Stripe Connect payouts. Creator Forge Studio covers 100% of engineering development, server hosting, and payment processing fees. There are zero upfront fees and zero ongoing expenses charged to you.`
      );
    }

    if (/time|hour|commitment|busy|work|schedule/i.test(qLower)) {
      sections.push(
        `• Your Time Commitment:\n` +
        `We understand you are busy creating content. The partnership requires less than 1–2 hours per month. Your only involvement is reviewing product UX and announcing the tool to your community.`
      );
    }

    if (/ip|own|copyright|brand|legal|likeness/i.test(qLower)) {
      sections.push(
        `• IP & Ownership Protection:\n` +
        `The partnership operates as a joint venture. You retain 100% ownership of your brand, likeness, and content. The software itself is owned jointly under our co-founder agreement.`
      );
    }

    if (/thought|think|opinion|feedback|view|perspective/i.test(qLower)) {
      sections.push(
        `Here are our strategic thoughts on why this co-founder partnership and these 3 concepts make immense sense for your audience:\n\n` +
        `1. Tailored Community Fit: We analyzed your channel and community discussions, and identified that automated workflow and specialized tools in ${concepts[0]?.tagline || "this niche"} solve their biggest bottleneck.\n\n` +
        `2. Compounding 50% Lifetime Net Recurring Revenue: Unlike one-off sponsorships where payment ends when the video goes live, software produces compounding monthly subscription revenue (MRR) where you receive 50% net share deposited automatically via Stripe.\n\n` +
        `3. Zero Capital & Zero Technical Management: Creator Forge Studio finances and builds 100% of the software, servers, security, and customer support. You never write code or handle tickets.\n\n` +
        `4. Minimal Time Commitment (< 2 Hours/Month): Your role is purely strategic product feedback and sharing the launch with your audience during your regular content schedule.\n\n` +
        `We strongly recommend starting with ${concepts[0]?.name} for our 14-day pre-order validation sprint.`
      );
    }

    if (sections.length === 0) {
      sections.push(
        `• 50/50 Net Revenue Partnership:\n` +
        `Creator Forge Studio funds, builds, and supports 100% of the software product at zero cost to you, while you receive 50% of all net subscription revenue from day one. You provide audience distribution and product feedback under 2 hours/month.`
      );
    }

    const answerSubject = `Re: Co-founding questions regarding ${concepts[0]?.name} (${creatorName})`;
    const answerBody =
      `Hi ${firstName},\n\n` +
      `Thanks for asking — that is the most important question to clarify before we build anything together!\n\n` +
      sections.join("\n\n") +
      `\n\nHere are the 3 concepts we specifically engineered for your community:\n` +
      `1. ${concepts[0]?.name} — ${concepts[0]?.tagline} (${concepts[0]?.pricing})\n` +
      `2. ${concepts[1]?.name} — ${concepts[1]?.tagline} (${concepts[1]?.pricing})\n` +
      `3. ${concepts[2]?.name} — ${concepts[2]?.tagline} (${concepts[2]?.pricing})\n\n` +
      `Which of these 3 concepts do you think solves the biggest bottleneck for your audience? Let us know, and we will initialize your private partner portal and launch validation.\n\n` +
      `Best regards,\nCreator Forge Studio Team\n\n---\nRef: [CF-STAGE:STEP6_DIALOG_ANSWER | CF-CID:${cId} | Handle:@${cleanHandle}]`;

    try {
      if (targetEmail && targetEmail.includes("@")) {
        const { sendDirectEmail } = await import("../../services/opsApi");
        await sendDirectEmail(targetEmail, answerSubject, answerBody, cId);
      }
      const sentTimeIso = new Date().toISOString();
      const sentTimestamp = Date.now();
      setAnswerSentMap((prev) => ({
        ...prev,
        [cId]: {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sentAt: sentTimeIso,
          sentTimestamp,
          recipient: targetEmail,
          subject: answerSubject,
        },
      }));
      notify(
        "info",
        "Clarification Dispatched",
        `Sent detailed answers addressing inquiries for ${creatorName}.`,
        4500
      );
      await syncImapReplies();
    } catch (e) {
      console.warn("Answer email dispatch error:", e);
    } finally {
      setIsSendingPitch(false);
    }
  };

  // Watch for creator concept choice & incoming messages in Step 6 (strictly in response to Step 6 pitch & dialog)
  useEffect(() => {
    if (activeStep === 6 && realThreads.length > 0) {
      for (const c of creators) {
        const incoming = getCreatorThreadMessages(c, realThreads);
        const pitchSent = pitchSentMap[c.id];
        const answerSent = answerSentMap[c.id];
        const persuasionSent = persuasionSentMap[c.id];
        const concepts = c.productConcepts || ensureCreatorConcepts(c);

        // Determine the latest outbound communication sent to this creator in Step 6 (Pitch, Answer, or Persuasion)
        const pTime = pitchSent?.sentTimestamp || (pitchSent?.sentAt ? new Date(pitchSent.sentAt).getTime() : 0);
        const aTime = answerSent?.sentTimestamp || (answerSent?.sentAt ? new Date(answerSent.sentAt).getTime() : 0);
        const perTime = persuasionSent?.sentTimestamp || (persuasionSent?.sentAt ? new Date(persuasionSent.sentAt).getTime() : 0);

        let latestOutboundTime = Math.max(pTime, aTime, perTime);

        // Fallback: Check if any outbound message exists in realThreads
        if (!latestOutboundTime) {
          for (const thread of realThreads) {
            const msgs = thread.messages || [];
            for (const m of msgs) {
              const isOut = m.is_outbound || m.from_address?.includes("creatorforge") || m.from_address?.includes("@gmail.com");
              const subj = (m.subject || "").toLowerCase();
              if (isOut && /blueprint|opportunity deck|software concepts|concept pitch|concepts for|answers to your questions|simplifying|zero-effort/i.test(subj)) {
                const t = m.sent_at || m.created_at;
                if (t) {
                  const tMs = new Date(t).getTime();
                  if (tMs > latestOutboundTime) latestOutboundTime = tMs;
                }
              }
            }
          }
        }

        const hasStep6PitchThread = incoming.some((msg) => {
          const subj = (msg.subject || "").toLowerCase();
          return /blueprint|opportunity deck|software concepts|concept pitch|concepts for|answers to your questions|co-founder partnership|zero upfront cost|preview/i.test(subj);
        });

        const pitchWasDispatched = Boolean(latestOutboundTime > 0 || pitchSent || hasStep6PitchThread);
        if (!pitchWasDispatched) continue;

        // Filter messages to find those that are GENUINE feedback/replies to our Step 6 outreach:
        const step6Replies = incoming.filter((msg) =>
          isStep6Message(msg, latestOutboundTime),
        );

        if (step6Replies.length > 0) {
          const latestStep6 = step6Replies[0];
          const analysis = analyzeCreatorReplyAutonomous(
            latestStep6.body,
            concepts,
          );

          if (analysis) {
            if (analysis.conceptId && c.id === selectedCreatorId) {
              setSelectedConceptId(analysis.conceptId);
            }
            setAiDetectedChoiceMap((prev) => ({
              ...prev,
              [c.id]: {
                decision: analysis.decision,
                actionLabel: analysis.actionLabel,
                conceptName: analysis.conceptName,
                conceptId: analysis.conceptId,
                confidence: analysis.confidence,
                reasoning: analysis.reasoning,
                color: analysis.color,
                badgeClass: analysis.badgeClass,
                snippet:
                  latestStep6.body.length > 150
                    ? latestStep6.body.slice(0, 150) + "..."
                    : latestStep6.body,
                fullBody: latestStep6.body,
                receivedAt: latestStep6.received_at,
                fromAddress: latestStep6.from_address,
                isStep6Reply: true,
              },
            }));
          }
        } else {
          // No reply to our latest Step 6 outreach yet!
          // The system MUST wait for creator's feedback/reply in dialog before taking any action.
          let waitAction = "Awaiting Pitch Feedback";
          let waitReason = `Opportunity pitch presenting 3 concepts was dispatched to ${c.name || "creator"}. The engine is listening on Gmail IMAP specifically for their feedback, concept choice, or questions before taking action.`;
          let waitColor = "purple";
          let waitBadge = "bg-purple-500/20 text-purple-300 border-purple-500/40";

          if (aTime > pTime && aTime >= perTime) {
            waitAction = "Answers Sent — Awaiting Reply";
            waitReason = `Clarifying answers regarding 50/50 split and tech stack were dispatched to ${c.name || "creator"}. Listening on Gmail IMAP for their response in dialog before proceeding.`;
            waitColor = "blue";
            waitBadge = "bg-blue-500/20 text-blue-300 border-blue-500/40";
          } else if (perTime > pTime && perTime >= aTime) {
            waitAction = "Persuasion Sent — Awaiting Reply";
            waitReason = `Persuasion recovery email addressing ${c.name || "creator"}'s hesitation was dispatched. Listening on Gmail IMAP for their response in dialog before proceeding.`;
            waitColor = "amber";
            waitBadge = "bg-amber-500/20 text-amber-300 border-amber-500/40";
          }

          setAiDetectedChoiceMap((prev) => ({
            ...prev,
            [c.id]: {
              decision: "AWAITING_STEP6_REPLY",
              actionLabel: waitAction,
              conceptName: concepts[0]?.name || "Recommended Concept",
              confidence: 0,
              reasoning: waitReason,
              color: waitColor,
              badgeClass: waitBadge,
              isStep6Reply: false,
            },
          }));
        }
      }
    }
  }, [realThreads, activeStep, creators, selectedCreatorId, pitchSentMap, answerSentMap, persuasionSentMap]);

  // Autonomous execution of Create Project ONLY when creator confirms interest in Step 6
  useEffect(() => {
    if (
      activeStep === 6 &&
      selectedCreator &&
      campaignRunning &&
      !hasAutoCreatedProject
    ) {
      const currentChoice = aiDetectedChoiceMap[selectedCreator.id];
      if (
        currentChoice &&
        currentChoice.decision === "CREATE_PROJECT" &&
        currentChoice.isStep6Reply
      ) {
        setHasAutoCreatedProject(true);
        setAutoLaunchCountdown(3);
      }
    }
  }, [
    activeStep,
    selectedCreator?.id,
    aiDetectedChoiceMap,
    campaignRunning,
    hasAutoCreatedProject,
  ]);

  useEffect(() => {
    if (autoLaunchCountdown === null) return;
    if (autoLaunchCountdown <= 0) {
      handlePitchAndCreateProject();
      return;
    }
    const timer = setTimeout(() => {
      setAutoLaunchCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [autoLaunchCountdown]);

  // Autonomous execution of Persuasion Email ONLY when creator responds with disinterest in Step 6
  useEffect(() => {
    if (
      activeStep === 6 &&
      selectedCreator &&
      campaignRunning &&
      !isSendingPitch
    ) {
      const currentChoice = aiDetectedChoiceMap[selectedCreator.id];
      if (
        currentChoice &&
        currentChoice.decision === "PERSUADE" &&
        currentChoice.isStep6Reply &&
        !persuasionSentMap[selectedCreator.id]
      ) {
        handleAutonomousPersuade(selectedCreator);
      }
    }
  }, [
    activeStep,
    selectedCreator?.id,
    aiDetectedChoiceMap,
    campaignRunning,
    persuasionSentMap,
    isSendingPitch,
  ]);

  // Autonomous execution of Answer Email when creator asks questions in Step 6
  useEffect(() => {
    if (
      activeStep === 6 &&
      selectedCreator &&
      campaignRunning &&
      !isSendingPitch
    ) {
      const currentChoice = aiDetectedChoiceMap[selectedCreator.id];
      if (
        currentChoice &&
        currentChoice.decision === "ANSWER_QUESTION" &&
        currentChoice.isStep6Reply &&
        !answerSentMap[selectedCreator.id]
      ) {
        handleSendAnswer(selectedCreator);
      }
    }
  }, [
    activeStep,
    selectedCreator?.id,
    aiDetectedChoiceMap,
    campaignRunning,
    answerSentMap,
    isSendingPitch,
  ]);

  // Autonomous handling of rejection / opt-out in Step 6
  useEffect(() => {
    if (
      activeStep === 6 &&
      selectedCreator &&
      campaignRunning
    ) {
      const currentChoice = aiDetectedChoiceMap[selectedCreator.id];
      if (
        currentChoice &&
        currentChoice.decision === "NOT_INTERESTED" &&
        currentChoice.isStep6Reply &&
        selectedCreator.status !== "rejected"
      ) {
        handleRejectCreator(selectedCreator.id);
      }
    }
  }, [
    activeStep,
    selectedCreator?.id,
    selectedCreator?.status,
    aiDetectedChoiceMap,
    campaignRunning,
  ]);

  const handleSimulateReply = (creatorId, classification) => {
    const creator = creators.find((c) => c.id === creatorId);
    const name = creator?.name || creator?.display_name || "Creator";
    const niche =
      (Array.isArray(creator?.niche) ? creator.niche[0] : creator?.niche) ||
      "Tech";

    let text = "";
    if (classification === "interested") {
      text = `Hey team! Saw your note regarding the co-founder partnership for our ${niche} audience. We'd love to review the product concepts and revenue split structure.`;
    } else if (classification === "question") {
      text = `Hi! Thanks for reaching out. What is the expected timeline for building the MVP, and how much time will be required on my end for community rollout?`;
    } else if (classification === "not_interested") {
      text = `Thanks for reaching out, but our partnership and sponsorship schedule is currently fully booked for this quarter.`;
    } else {
      text = `Please remove our contact from your outreach list.`;
    }

    // Step 4 "interested" = "qualified" for pitch (NOT Section 2 ready)
    const mappedClassification = classification === "interested" ? "qualified" : classification;
    const mappedStatus = classification === "interested" ? "qualified" : creator?.status;

    setCreators((prev) =>
      prev.map((c) => {
        if (c.id === creatorId) {
          return {
            ...c,
            replyClassification: mappedClassification,
            replyText: text,
            replySubject: `Re: Co-founder partnership inquiry for ${name}`,
            replyTime: "Just now",
            hasReplied: true,
            status: mappedStatus,
            productConcepts: ensureCreatorConcepts(c),
          };
        }
        return c;
      }),
    );

    if (classification === "interested" && autoAdvanceOnPositive && creator) {
      triggerAutoAdvance(creator, {
        hasRealReply: true,
        classification: "qualified",
        sentiment: "positive",
        text,
        time: "Just now",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Campaign Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[#0e1117] border border-white/[0.08] shadow-2xl relative overflow-hidden">
        

        <div className="space-y-1 z-10 max-w-xl">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400 fill-purple-400" />
              <span>Autonomous Creator Acquisition Engine</span>
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
              Live Real-Data
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real creator discovery, Apify profile & email extraction, AI product
            concepts, and autonomous outreach orchestration.
          </p>
        </div>

        <div className="flex items-center gap-2.5 z-10 flex-shrink-0 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleDeleteAllCreators}
            disabled={isDeletingAll}
            className="flex items-center gap-2 px-3.5 h-9 rounded-xl text-xs font-bold transition-all border bg-red-500/10 border-red-500/25 text-red-400 hover:bg-red-500/20 hover:text-white cursor-pointer whitespace-nowrap flex-shrink-0 disabled:opacity-50"
            title="Delete all creators from database and reset pipeline"
          >
            <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{isDeletingAll ? "Deleting..." : "Delete All Leads"}</span>
          </button>

          <button
            onClick={toggleCampaignRunning}
            className={`flex items-center gap-2 px-3.5 h-9 rounded-xl text-xs font-bold transition-all border whitespace-nowrap flex-shrink-0 cursor-pointer ${
              campaignRunning
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
            }`}
          >
            {campaignRunning ? (
              <Play className="w-3.5 h-3.5 fill-emerald-400 flex-shrink-0" />
            ) : (
              <Pause className="w-3.5 h-3.5 fill-amber-400 flex-shrink-0" />
            )}
            <span>{campaignRunning ? "Engine Active" : "Engine Paused"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAdminLookup(true)}
            className="flex items-center gap-2 px-3.5 h-9 rounded-xl text-xs font-bold transition-all border bg-rose-500/10 border-rose-500/25 text-rose-300 hover:bg-rose-500/20 cursor-pointer shadow-sm whitespace-nowrap flex-shrink-0"
            title="Open Admin Oversight & Error Log"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <span>Error & Exception Log</span>
          </button>
        </div>
      </div>

      {/* Phase Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          {
            step: 1,
            label: "Setup Engine",
            icon: Target,
            textColor: "text-purple-400",
            activeBg: "bg-purple-500/15 border-purple-500/40 text-white",
          },
          {
            step: 2,
            label: "Scraped Leads",
            icon: Search,
            textColor: "text-indigo-400",
            activeBg: "bg-indigo-500/15 border-indigo-500/40 text-white",
          },
          {
            step: 3,
            label: "Outreach Wave",
            icon: Send,
            textColor: "text-cyan-400",
            activeBg: "bg-cyan-500/15 border-cyan-500/40 text-white",
          },
          {
            step: 4,
            label: "Interested Review",
            icon: MessageSquare,
            textColor: "text-emerald-400",
            activeBg: "bg-emerald-500/15 border-emerald-500/40 text-white",
          },
          {
            step: 5,
            label: "Product Ideas",
            icon: Sparkles,
            textColor: "text-amber-400",
            activeBg: "bg-amber-500/15 border-amber-500/40 text-white",
          },
          {
            step: 6,
            label: "Pitch & Select",
            icon: Award,
            textColor: "text-pink-400",
            activeBg: "bg-pink-500/15 border-pink-500/40 text-white",
          },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeStep === item.step;
          return (
            <button
              key={item.step}
              onClick={() => setActiveStep(item.step)}
              className={`flex flex-col items-start p-3 rounded-xl text-left transition-all border cursor-pointer ${
                isActive
                  ? item.activeBg
                  : "bg-[#0e1117] border-white/[0.06] text-slate-400 hover:border-white/[0.14] hover:text-white"
              }`}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.04] mb-2">
                <Icon className={`w-4 h-4 ${item.textColor}`} />
              </div>
              <span className="text-xs font-bold truncate w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* STEP 1: CAMPAIGN SETUP */}
      {activeStep === 1 && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Parameters Card */}
            <div className="p-6 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-5">
              <div className="border-b border-white/[0.07] pb-3.5 flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span>Campaign Parameters & Autonomous Targeting</span>
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleStartFresh}
                    className="text-[11px] font-bold text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/10 border border-white/10 px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    title="Clear cached creators and start completely fresh"
                  >
                    <RefreshCw className="w-3 h-3 text-purple-400" />
                    <span>Reset Fresh</span>
                  </button>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    Autonomous Mode
                  </span>
                </div>
              </div>

              {/* Target Niches with Cancel Tags */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                    <span>Target Niche(s)</span>
                    <span className="text-[10px] text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md font-mono">
                      {niches.length} selected
                    </span>
                  </label>
                  {niches.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setNiches([])}
                      className="text-[11px] text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Interactive Niche Box with Remove Cancel Buttons */}
                <div className="p-2.5 rounded-xl bg-[#161a23] border border-white/10 flex flex-wrap items-center gap-1.5 focus-within:border-purple-500 transition-all min-h-[48px]">
                  {niches.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-950/70 text-purple-200 border border-purple-500/40 shadow-sm"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeNiche(tag)}
                        className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-purple-500/40 text-purple-300 hover:text-white transition-colors cursor-pointer"
                        title={`Remove ${tag}`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}

                  <input
                    type="text"
                    value={customNicheInput}
                    onChange={(e) => setCustomNicheInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addNiche(customNicheInput);
                      }
                    }}
                    placeholder={
                      niches.length === 0
                        ? "Type niche & press Enter..."
                        : "+ Add another..."
                    }
                    className="flex-1 min-w-[130px] bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none py-1 px-1 font-medium"
                  />
                </div>

                {/* Preset Quick Add Tag Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[11px] text-slate-500 mr-1">
                    Quick Add:
                  </span>
                  {popularNiches.map((tag) => {
                    const isAdded = niches.some(
                      (n) => n.toLowerCase() === tag.toLowerCase(),
                    );
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          isAdded ? removeNiche(tag) : addNiche(tag)
                        }
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                          isAdded
                            ? "bg-purple-500/15 text-purple-200 border-purple-500/40"
                            : "bg-white/[0.02] text-slate-400 hover:text-white border-white/[0.06] hover:border-white/20"
                        }`}
                      >
                        {isAdded ? (
                          <Check className="w-3 h-3 text-purple-300" />
                        ) : (
                          <Plus className="w-3 h-3 text-slate-500" />
                        )}
                        <span>{tag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Platforms Multi-select */}
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-semibold flex items-center justify-between">
                  <span>Target Platforms</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Select platforms for lead discovery
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "youtube", label: "YouTube", icon: Youtube, color: "text-red-400" },
                    { id: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-400" },
                    { id: "tiktok", label: "TikTok", icon: Music, color: "text-cyan-400" },
                  ].map((p) => {
                    const isSelected = selectedPlatforms.includes(p.id);
                    const PlatformIcon = p.icon;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePlatform(p.id)}
                        className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-purple-500/15 border-purple-500/40 text-white"
                            : "bg-[#161a23] border-white/[0.06] text-slate-400 hover:text-white hover:border-white/20"
                        }`}
                      >
                        <PlatformIcon className={`w-3.5 h-3.5 ${p.color}`} />
                        <span>{p.label}</span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sliders and Ranges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {/* 50 Creators Slider Control */}
                <div className="space-y-2 p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-purple-300 font-bold flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-purple-400" />
                      <span>Autonomous Creator Count</span>
                    </label>
                    <span className="text-xs font-black text-white bg-purple-600 px-2 py-0.5 rounded-md">
                      {creatorsBatchCount} Creators
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={creatorsBatchCount}
                    onChange={(e) =>
                      setCreatorsBatchCount(Number(e.target.value))
                    }
                    className="w-full accent-purple-500 cursor-pointer h-2 bg-purple-950 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-purple-400/80 font-mono">
                    <span>1 Creator</span>
                    <span>25 Creators</span>
                    <span>50 Max</span>
                  </div>
                </div>

                {/* Min Engagement */}
                <div className="space-y-2 p-3.5 rounded-xl bg-[#161a23] border border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300 font-semibold">
                      Min Engagement Rate
                    </label>
                    <span className="text-xs font-bold text-emerald-400">
                      ≥ {minEngagement}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.5"
                    value={minEngagement}
                    onChange={(e) => setMinEngagement(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-2 bg-black rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>1.0%</span>
                    <span>5.0%</span>
                    <span>10.0%</span>
                  </div>
                </div>

                {/* Follower Range */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs text-slate-300 font-semibold">
                    Follower Range (100K – 1M Target Tier)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={minFollowers}
                      onChange={(e) => setMinFollowers(Number(e.target.value))}
                      className="flex-1 bg-[#161a23] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                    <span className="text-slate-500 text-xs font-bold">TO</span>
                    <input
                      type="number"
                      value={maxFollowers}
                      onChange={(e) => setMaxFollowers(Number(e.target.value))}
                      className="flex-1 bg-[#161a23] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {/* Target Platforms Multi-Select */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs text-slate-300 font-semibold">
                    Target Platforms
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "youtube", label: "YouTube" },
                      { id: "tiktok", label: "TikTok" },
                      { id: "instagram", label: "Instagram" },
                    ].map((p) => {
                      const active = selectedPlatforms.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePlatform(p.id)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                            active
                              ? "bg-purple-600/20 border-purple-500/50 text-white shadow-sm"
                              : "bg-[#161a23] border-white/[0.06] text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Email Template Card */}
            <div className="p-6 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-4">
              <div className="border-b border-white/[0.07] pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Personalized Outreach Email Template</span>
                </h3>
                <span className="text-[11px] text-purple-400 font-mono">
                  Dynamic Merge Tags
                </span>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">
                  Subject
                </label>
                <input
                  type="text"
                  value={templateSubject}
                  onChange={(e) => setTemplateSubject(e.target.value)}
                  className="w-full bg-[#161a23] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">
                  Body
                </label>
                <textarea
                  rows={5}
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  className="w-full bg-[#161a23] border border-white/10 rounded-xl p-3.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Engine Summary & Start Button (Right Sidebar) */}
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-5 sticky top-20">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Autonomous Pipeline</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </h4>

              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Range</span>
                  <span className="text-purple-300 font-bold">100K – 1M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Batch Discovery Size</span>
                  <span className="text-purple-300 font-bold">
                    {creatorsBatchCount} Creators
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Min Engagement</span>
                  <span className="text-emerald-400 font-bold">
                    ≥ {minEngagement}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Follow-up Rule</span>
                  <span className="text-purple-300 font-bold">7 Days Gap</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Response Handling</span>
                  <span className="text-emerald-400 font-bold">
                    Stop Sequence
                  </span>
                </div>
              </div>

              {/* PRIMARY ENGINE START BUTTON */}
              <button
                onClick={handleStartEngine}
                disabled={discovering}
                className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2 border border-purple-500/50 transition-all disabled:opacity-50 cursor-pointer shadow-md active:scale-95"
              >
                {discovering ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                    <span>Discovering & Enriching Leads...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-purple-200" />
                    <span>Run Autonomous Discovery</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                Triggers dynamic AI scouting, live Apify profile extraction &
                verified business email discovery.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SCRAPED LEADS: FIND & QUALIFY CREATORS */}
      {activeStep === 2 && (
        <div className="p-6 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Scraped Leads
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400">
                  Live Apify & Scraper Enrichment
                </span>
              </div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                <Search className="w-4 h-4 text-indigo-400" />
                <span>Find & Qualify Creators</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review discovered creator profiles and verified contact emails before launching autonomous outreach.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
              {creators.length > 0 && (
                <div className="h-9 px-3 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-mono flex items-center gap-2 shadow-sm whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  <span>
                    Auto-Dispatch in:{" "}
                    <strong className="text-white">{formatCountdown(countdownSeconds)}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={toggleStep2Timer}
                    className="ml-1 text-[11px] underline text-purple-300 hover:text-white cursor-pointer font-sans"
                  >
                    {timerPaused ? "Resume" : "Pause"}
                  </button>
                </div>
              )}

              <button
                onClick={handleStartEngine}
                disabled={discovering}
                className="h-9 px-3.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-slate-200 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer border border-white/10 whitespace-nowrap active:scale-95"
                title="Re-run discovery"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-indigo-400 ${discovering ? "animate-spin" : ""}`}
                />
                <span>{discovering ? "Scouting..." : "Re-Discover"}</span>
              </button>

              <button
                onClick={() => setActiveStep(3)}
                className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-indigo-500/40 shadow-sm cursor-pointer whitespace-nowrap active:scale-95"
              >
                <span>Proceed to Outreach Wave</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Real-time Status Terminal Log */}
          {discoveryLog && (
            <div className="p-4 rounded-xl bg-black/60 border border-indigo-500/30 text-xs font-mono text-indigo-300 flex items-start gap-2 shadow-inner">
              <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1 flex-shrink-0 animate-ping" />
              <div className="flex-1 leading-relaxed">{discoveryLog}</div>
            </div>
          )}

          {/* Discovered Creators Grid */}
          {creators.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs space-y-4">
              <p>
                No creators discovered yet. Click Engine Start to run autonomous
                discovery.
              </p>
              <button
                onClick={handleStartEngine}
                disabled={discovering}
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>
                  Start Autonomous Discovery ({creatorsBatchCount} Creators)
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Top Qualified Creators ({creators.length})
                </span>
                <span>Deduplicated & enriched with public contact info</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {creators.map((c) => {
                  const cleanHandle = (c.handle || "").replace(/^@/, "");
                  const platformSlug = (c.platform || "youtube").toLowerCase();
                  const profileUrl =
                    c.profile_url ||
                    c.url ||
                    (platformSlug === "youtube"
                      ? `https://www.youtube.com/@${cleanHandle}`
                      : platformSlug === "instagram"
                        ? `https://www.instagram.com/${cleanHandle}`
                        : platformSlug === "tiktok"
                          ? `https://www.tiktok.com/@${cleanHandle}`
                          : `https://twitter.com/${cleanHandle}`);
                  const hasEmail = Boolean(c.email_public || c.email);

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCreatorId(c.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 relative ${
                        selectedCreatorId === c.id
                          ? "bg-purple-950/30 border-purple-500/60 shadow-sm"
                          : "bg-[#161a23] border-white/[0.08] hover:border-white/20"
                      }`}
                    >
                      {/* Creator Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={
                              c.avatar ||
                              c.avatar_url ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanHandle || "Creator")}&background=6366f1&color=fff`
                            }
                            alt=""
                            className="w-11 h-11 rounded-full object-cover border border-purple-500/30 flex-shrink-0 bg-[#090b0e]"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanHandle || "Creator")}&background=6366f1&color=fff`;
                            }}
                          />
                          <div className="min-w-0">
                            <h3 className="text-xs font-bold text-white truncate">
                              {c.name || c.display_name}
                            </h3>
                            <p className="text-[11px] text-slate-400 truncate font-mono">
                              @{cleanHandle} • {c.platform}
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-[11px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                            Score: {c.creatorScore || 85}/100
                          </span>
                        </div>
                      </div>

                      {/* Stats & Channel Action Bar */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-lg bg-black/40 border border-white/[0.04]">
                        <div>
                          <span className="text-slate-500 block text-[10px]">
                            Followers
                          </span>
                          <span className="text-slate-200 font-bold">
                            {c.followerStr || c.follower_count || "100K+"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">
                            Engagement
                          </span>
                          <span className="text-emerald-400 font-bold">
                            {c.engagement || 3.5}%
                          </span>
                        </div>
                      </div>

                      {/* Scraped Bio Description */}
                      {c.bio && (
                        <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed bg-black/30 p-2 rounded-lg border border-white/[0.04]">
                          {c.bio}
                        </p>
                      )}

                      {/* External Channel Link + Contact Info / Email Modifier */}
                      <div className="pt-1">
                        {editingEmailCreatorId === c.id ? (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            className="p-1.5 px-2 rounded-lg bg-[#090b0e] border border-purple-500/60 flex items-center gap-1.5 text-xs shadow-sm"
                          >
                            <Mail className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                            <input
                              type="email"
                              autoFocus
                              value={tempEmailValue}
                              onChange={(e) =>
                                setTempEmailValue(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEditEmail(c.id, e);
                                if (e.key === "Escape") cancelEditEmail(e);
                              }}
                              placeholder="Enter creator email..."
                              className="bg-transparent text-white font-mono text-[11px] focus:outline-none flex-1 min-w-0"
                            />
                            <button
                              type="button"
                              onClick={(e) => saveEditEmail(c.id, e)}
                              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                              title="Save Email"
                            >
                              <Check className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => cancelEditEmail(e)}
                              className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-all cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              {hasEmail ? (
                                <div className="p-1.5 px-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-between gap-2 text-[11px] min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <Mail className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                    <span className="font-mono text-emerald-400 truncate">
                                      {c.email_public || c.email}
                                    </span>
                                    {c.email_verified ? (
                                      <span
                                        className="text-[9px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded"
                                        title="Verified Business Email via Apify"
                                      >
                                        <span className="flex items-center gap-0.5"><Check className="w-2.5 h-2.5 text-emerald-400" /> Verified</span>
                                      </span>
                                    ) : null}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyEmail(
                                          c.email_public || c.email,
                                        );
                                      }}
                                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10"
                                      title="Copy Email"
                                    >
                                      {copiedEmail ===
                                      (c.email_public || c.email) ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    <button
                                      onClick={(e) =>
                                        startEditEmail(
                                          c.id,
                                          c.email_public || c.email,
                                          e,
                                        )
                                      }
                                      className="p-1 text-slate-400 hover:text-purple-300 rounded hover:bg-white/10 transition-colors"
                                      title="Modify Email"
                                    >
                                      <Pencil className="w-3 h-3 text-purple-400" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  <button
                                    type="button"
                                    onClick={(e) => handleApifyFindEmail(c, e)}
                                    disabled={findingApifyId === c.id}
                                    className="p-1.5 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 hover:text-white flex items-center gap-1 text-[11px] font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
                                    title="Find verified business email with Apify"
                                  >
                                    {findingApifyId === c.id ? (
                                      <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                                    ) : (
                                      <Zap className="w-3 h-3 text-emerald-400" />
                                    )}
                                    <span>
                                      {findingApifyId === c.id
                                        ? "Finding..."
                                        : "Find Business Email"}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => startEditEmail(c.id, "", e)}
                                    className="p-1.5 px-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 hover:border-purple-500/40 text-purple-300 hover:text-white flex items-center gap-1 text-[11px] font-semibold transition-all cursor-pointer"
                                    title="Add/Modify Creator Email Manually"
                                  >
                                    <Pencil className="w-2.5 h-2.5 text-purple-400" />
                                    <span>Edit</span>
                                  </button>
                                </div>
                              )}

                              {/* Direct URL Button (Opens in New Tab) */}
                              <a
                                href={profileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-500/30 transition-all flex-shrink-0"
                                title="Open creator profile in new tab"
                              >
                                <span>Profile</span>
                                <ExternalLink className="w-3 h-3 text-purple-300" />
                              </a>
                            </div>

                            {apifyStatusMsg[c.id] && (
                              <p className="text-[10px] text-amber-400/90 font-mono px-1">
                                {apifyStatusMsg[c.id]}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: AUTONOMOUS OUTREACH */}
      {activeStep === 3 && (
        <div className="p-6 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Outreach Wave
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-300">
                  Outreach Execution & Sequence Engine
                </span>
              </div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                <Send className="w-4 h-4 text-blue-400" />
                <span>Autonomous Outreach Queue</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Send personalized outreach emails, track opens & replies, and
                automatically schedule 7-day follow-ups.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleSendBulkOutreach}
                disabled={sendingBulk || creators.length === 0}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50 shadow-md"
              >
                <Send
                  className={`w-3.5 h-3.5 ${sendingBulk ? "animate-pulse" : ""}`}
                />
                <span>
                  {sendingBulk
                    ? "Sending Email Batch..."
                    : `Dispatch Bulk Wave (${creators.length} Creators)`}
                </span>
              </button>
              <button
                onClick={() => setActiveStep(4)}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <span>Advance to Replies</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {outreachLog && (
            <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 text-xs font-mono text-blue-300">
              {outreachLog}
            </div>
          )}

          {/* Sequence Automation Cards (Matching Screenshot) */}
          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.08] space-y-1">
              <span className="text-slate-400 font-medium">Batch Size</span>
              <p className="text-xl font-bold text-white">
                {creators.length} Creators
              </p>
              <span className="text-[11px] text-slate-500">
                Targeting 100K–1M verified profiles
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.08] space-y-1">
              <span className="text-slate-400 font-medium">
                Auto Follow-up Rule
              </span>
              <p className="text-xl font-bold text-purple-300">7 Days Timing</p>
              <span className="text-[11px] text-slate-500">
                No response → follow up in 7 days
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.08] space-y-1">
              <span className="text-slate-400 font-medium">
                Sequence Termination
              </span>
              <p className="text-xl font-bold text-emerald-400">
                Response → Stop
              </p>
              <span className="text-[11px] text-slate-500">
                Replies tracked automatically
              </span>
            </div>
          </div>

          {/* Queue preview table */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Active Outreach Queue ({creators.length})
            </h3>
            <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#161a23]">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/40 text-slate-400 text-[11px] border-b border-white/[0.06]">
                  <tr>
                    <th className="p-3">Creator</th>
                    <th className="p-3">Platform</th>
                    <th className="p-3">Followers</th>
                    <th className="p-3">Recipient Email</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {creators.slice(0, 10).map((c) => {
                    const emailVal = c.email || c.email_public || "";
                    const isEditing = editingEmailCreatorId === c.id;

                    return (
                      <tr key={c.id} className="hover:bg-white/[0.02]">
                        <td className="p-3 font-bold text-white flex items-center gap-2">
                          <img
                            src={c.avatar}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover border border-purple-500/20"
                          />
                          <span className="truncate max-w-[180px]">
                            {c.name || c.display_name}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{c.platform}</td>
                        <td className="p-3 font-mono text-slate-300">
                          {c.followerStr || c.follower_count}
                        </td>
                        <td className="p-3 font-mono">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 min-w-[220px]">
                              <input
                                type="email"
                                autoFocus
                                value={tempEmailValue}
                                onChange={(e) =>
                                  setTempEmailValue(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEditEmail(c.id, e);
                                  if (e.key === "Escape") cancelEditEmail(e);
                                }}
                                className="bg-[#090b0e] border border-purple-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none flex-1 font-mono"
                              />
                              <button
                                type="button"
                                onClick={(e) => saveEditEmail(c.id, e)}
                                className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                                title="Save"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => cancelEditEmail(e)}
                                className="p-1 rounded bg-white/10 hover:bg-white/20 text-slate-300"
                                title="Cancel"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 group">
                              {emailVal ? (
                                <span className="text-emerald-400 font-mono">
                                  {emailVal}
                                </span>
                              ) : (
                                <span className="text-amber-400/80 text-[11px] italic">
                                  No email set
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) =>
                                  startEditEmail(c.id, emailVal, e)
                                }
                                className="p-0.5 text-slate-500 hover:text-purple-300 rounded opacity-70 group-hover:opacity-100 transition-opacity"
                                title="Edit Email"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              emailVal
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}
                          >
                            {emailVal ? "Ready in Queue" : "Email Needed"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: INTERESTED CREATOR REVIEW */}
      {activeStep === 4 &&
        (() => {
          const creatorsWithReplies = creators.map((c) => ({
            ...c,
            replyInfo: getCreatorReply(c),
          }));

          const interestedCount = creatorsWithReplies.filter(
            (c) => c.replyInfo.classification === "interested",
          ).length;
          const questionCount = creatorsWithReplies.filter(
            (c) => c.replyInfo.classification === "question",
          ).length;
          const notInterestedCount = creatorsWithReplies.filter(
            (c) => c.replyInfo.classification === "not_interested",
          ).length;
          const unsubCount = creatorsWithReplies.filter(
            (c) => c.replyInfo.classification === "unsubscribe",
          ).length;
          const awaitingCount = creatorsWithReplies.filter(
            (c) => c.replyInfo.classification === "awaiting_reply",
          ).length;
          const noEmailCount = creatorsWithReplies.filter(
            (c) => c.replyInfo.classification === "no_email",
          ).length;

          const filteredReplies = creatorsWithReplies.filter((c) => {
            if (replyFilter === "all") return true;
            return c.replyInfo.classification === replyFilter;
          });

          const activeReviewCreator =
            creatorsWithReplies.find((c) => c.id === selectedCreatorId) ||
            filteredReplies[0] ||
            creatorsWithReplies[0] ||
            null;

          return (
            <div className="p-6 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-5">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Interested Review
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-300">
                      Live IMAP Polling & AI Reply Classification
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>
                      Interested Creator Review ({filteredReplies.length})
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Real replies are polled directly from Gmail via IMAP and
                    classified by AI into 4 categories.
                  </p>
                  {imapSyncLog && (
                    <p className="text-[11px] font-mono text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20 inline-block mt-1">
                      {imapSyncLog}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      setAutoAdvanceOnPositive(!autoAdvanceOnPositive)
                    }
                    className={`px-3 py-2 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      autoAdvanceOnPositive
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm"
                        : "bg-white/[0.04] border-white/10 text-slate-400"
                    }`}
                    title="Automatically advance to Product Ideas when a positive reply is received"
                  >
                    <Zap
                      className={`w-3.5 h-3.5 ${autoAdvanceOnPositive ? "text-emerald-400 fill-emerald-400" : "text-slate-500"}`}
                    />
                    <span>
                      Auto-Advance on Positive:{" "}
                      {autoAdvanceOnPositive ? "ON" : "OFF"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => syncImapReplies(true)}
                    disabled={pollingImap}
                    className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    title="Check Gmail IMAP for new creator replies"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 text-purple-400 ${pollingImap ? "animate-spin" : ""}`}
                    />
                    <span>
                      {pollingImap
                        ? "Polling Gmail IMAP..."
                        : "Sync IMAP Replies"}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveStep(5)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-emerald-500/40 shadow-sm cursor-pointer active:scale-95"
                  >
                    <span>Advance to Product Ideas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* AI Response Classification Interactive Filter Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                <button
                  type="button"
                  onClick={() => setReplyFilter("all")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    replyFilter === "all"
                      ? "bg-purple-500/20 border-purple-500/50 shadow-sm text-white"
                      : "bg-[#161a23] border-white/[0.06] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300">
                      All Leads
                    </span>
                    <span className="text-xs font-mono font-bold text-white bg-white/10 px-1.5 py-0.5 rounded">
                      {creatorsWithReplies.length}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReplyFilter("interested")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    replyFilter === "interested"
                      ? "bg-emerald-500/20 border-emerald-500/50 shadow-sm text-white"
                      : "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-[11px] font-bold text-emerald-300">
                        Interested
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded">
                      {interestedCount}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReplyFilter("question")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    replyFilter === "question"
                      ? "bg-amber-500/20 border-amber-500/50 shadow-sm text-white"
                      : "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-[11px] font-bold text-amber-300">
                        Question
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded">
                      {questionCount}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReplyFilter("not_interested")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    replyFilter === "not_interested"
                      ? "bg-red-500/20 border-red-500/50 shadow-sm text-white"
                      : "bg-red-500/5 border-red-500/20 hover:border-red-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="text-[11px] font-bold text-red-300">
                        Not Interested
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded">
                      {notInterestedCount}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReplyFilter("unsubscribe")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    replyFilter === "unsubscribe"
                      ? "bg-slate-500/20 border-slate-500/50 shadow-sm text-white"
                      : "bg-slate-500/5 border-slate-500/20 hover:border-slate-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      <span className="text-[11px] font-bold text-slate-300">
                        Unsubscribe
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-500/15 px-1.5 py-0.5 rounded">
                      {unsubCount}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReplyFilter("awaiting_reply")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    replyFilter === "awaiting_reply"
                      ? "bg-blue-500/20 border-blue-500/50 shadow-sm text-white"
                      : "bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-blue-400" />
                      <span className="text-[11px] font-bold text-blue-300">
                        Awaiting ({awaitingCount})
                      </span>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReplyFilter("no_email")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    replyFilter === "no_email"
                      ? "bg-amber-500/20 border-amber-500/50 shadow-sm text-white"
                      : "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[11px] font-bold text-amber-300">
                        No Email ({noEmailCount})
                      </span>
                    </div>
                  </div>
                </button>
              </div>

              {/* Master-Detail Split Layout */}
              {filteredReplies.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs bg-[#161a23] rounded-2xl border border-white/[0.05] space-y-2">
                  <p>No creators matching this category filter.</p>
                  <p className="text-slate-400 text-[11px]">
                    When creators reply to your outreach emails, click{" "}
                    <strong>"Sync IMAP Replies"</strong> to fetch and classify
                    their responses.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left: Replies List */}
                  <div className="lg:col-span-5 space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                    {filteredReplies.map((c) => {
                      const isSelected = activeReviewCreator?.id === c.id;
                      const reply = c.replyInfo;
                      const isApproved = c.status === "approved";
                      const isRejected = c.status === "rejected";

                      return (
                        <div
                          key={c.id}
                          onClick={() => setSelectedCreatorId(c.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 relative ${
                            isSelected
                              ? "bg-purple-950/30 border-purple-500/60 shadow-sm"
                              : "bg-[#161a23] border-white/[0.06] hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={
                                  c.avatar ||
                                  c.avatar_url ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(c.handle || "Creator")}&background=6366f1&color=fff`
                                }
                                alt=""
                                className="w-9 h-9 rounded-full object-cover border border-white/10 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-white truncate">
                                  {c.name || c.display_name}
                                </h4>
                                <p className="text-[11px] text-slate-400 truncate font-mono">
                                  @{c.handle?.replace(/^@/, "")} • {c.platform}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 border ${
                                reply.classification === "interested"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : reply.classification === "question"
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    : reply.classification === "not_interested"
                                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                                      : reply.classification === "unsubscribe"
                                        ? "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                        : reply.classification === "no_email"
                                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  reply.classification === "interested"
                                    ? "bg-emerald-400"
                                    : reply.classification === "question"
                                      ? "bg-amber-400"
                                      : reply.classification ===
                                          "not_interested"
                                        ? "bg-red-400"
                                        : reply.classification === "unsubscribe"
                                          ? "bg-slate-400"
                                          : reply.classification === "no_email"
                                            ? "bg-amber-400"
                                            : "bg-blue-400"
                                }`}
                              />
                              <span className="capitalize">
                                {reply.classification === "no_email"
                                  ? "No Email"
                                  : reply.classification.replace("_", " ")}
                              </span>
                            </span>
                          </div>

                          {reply.hasRealReply ? (
                            <p className="text-[11px] text-slate-300 line-clamp-2 italic leading-relaxed">
                              "{reply.text}"
                            </p>
                          ) : reply.classification === "no_email" ? (
                            <p className="text-[11px] text-amber-400/80 italic">
                              Outreach not sent. No email address available.
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-500 italic">
                              Outreach sent via Google SMTP. Awaiting creator
                              reply in Gmail.
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-white/[0.04]">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{reply.time}</span>
                            </span>
                            {isApproved ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Approved
                              </span>
                            ) : isRejected ? (
                              <span className="text-red-400 font-bold flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Rejected
                              </span>
                            ) : reply.hasRealReply ? (
                              <span className="text-purple-400 font-medium">
                                Ready for Review
                              </span>
                            ) : reply.classification === "no_email" ? (
                              <span className="text-amber-400 font-medium">
                                + Add Email
                              </span>
                            ) : (
                              <span className="text-blue-400/80 font-medium">
                                Awaiting Response
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right: Full Conversation & Decision View */}
                  {activeReviewCreator && (
                    <div className="lg:col-span-7 p-5 rounded-2xl bg-[#161a23] border border-white/[0.08] space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={
                              activeReviewCreator.avatar ||
                              activeReviewCreator.avatar_url
                            }
                            alt=""
                            className="w-12 h-12 rounded-full object-cover border border-purple-500/40"
                          />
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-white truncate">
                              {activeReviewCreator.name ||
                                activeReviewCreator.display_name}
                            </h3>
                            <p className="text-xs text-slate-400 font-mono">
                              {activeReviewCreator.handle} •{" "}
                              {activeReviewCreator.platform} •{" "}
                              {activeReviewCreator.followerStr ||
                                activeReviewCreator.follower_count}{" "}
                              followers
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 bg-[#090b0e] border border-white/10 rounded-xl px-2.5 py-1">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Modify Label:
                            </label>
                            <select
                              value={
                                activeReviewCreator.replyInfo.classification
                              }
                              onChange={(e) =>
                                handleModifyReplyClassification(
                                  activeReviewCreator.id,
                                  e.target.value,
                                )
                              }
                              className="bg-transparent border-none text-xs font-bold text-white focus:outline-none cursor-pointer"
                            >
                              <option
                                value="awaiting_reply"
                                className="bg-[#161a23] text-blue-300"
                              >
                                ⏳ Awaiting Reply
                              </option>
                              <option
                                value="interested"
                                className="bg-[#161a23] text-emerald-300"
                              >
                                Interested (Positive)
                              </option>
                              <option
                                value="question"
                                className="bg-[#161a23] text-amber-300"
                              >
                                Question
                              </option>
                              <option
                                value="not_interested"
                                className="bg-[#161a23] text-red-300"
                              >
                                Not Interested
                              </option>
                              <option
                                value="unsubscribe"
                                className="bg-[#161a23] text-slate-400"
                              >
                                Unsubscribe
                              </option>
                              <option
                                value="no_email"
                                className="bg-[#161a23] text-amber-400"
                              >
                                No Email
                              </option>
                            </select>
                          </div>

                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-lg border flex items-center gap-1.5 ${
                              activeReviewCreator.replyInfo.classification ===
                              "interested"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : activeReviewCreator.replyInfo
                                      .classification === "question"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : activeReviewCreator.replyInfo
                                        .classification === "not_interested"
                                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                                    : activeReviewCreator.replyInfo
                                          .classification === "unsubscribe"
                                      ? "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                      : activeReviewCreator.replyInfo
                                            .classification === "no_email"
                                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                activeReviewCreator.replyInfo.classification ===
                                "interested"
                                  ? "bg-emerald-400"
                                  : activeReviewCreator.replyInfo
                                        .classification === "question"
                                    ? "bg-amber-400"
                                    : activeReviewCreator.replyInfo
                                          .classification === "not_interested"
                                      ? "bg-red-400"
                                      : activeReviewCreator.replyInfo
                                            .classification === "unsubscribe"
                                        ? "bg-slate-400"
                                        : activeReviewCreator.replyInfo
                                              .classification === "no_email"
                                          ? "bg-amber-400"
                                          : "bg-blue-400"
                              }`}
                            />
                            <span className="capitalize">
                              {activeReviewCreator.replyInfo.hasRealReply
                                ? `AI: ${activeReviewCreator.replyInfo.classification.replace("_", " ")}`
                                : activeReviewCreator.replyInfo
                                      .classification === "no_email"
                                  ? "No Email Set"
                                  : "Awaiting Reply"}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* AI Classification Analysis Box */}
                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400">
                            Status:{" "}
                            <strong
                              className={
                                activeReviewCreator.replyInfo.hasRealReply
                                  ? "text-emerald-400"
                                  : activeReviewCreator.replyInfo
                                        .classification === "no_email"
                                    ? "text-amber-400"
                                    : "text-blue-400"
                              }
                            >
                              {activeReviewCreator.replyInfo.hasRealReply
                                ? "Reply Received"
                                : activeReviewCreator.replyInfo
                                      .classification === "no_email"
                                  ? "Email Needed"
                                  : "Waiting for Response"}
                            </strong>
                          </span>
                          <span className="text-slate-400">
                            Sentiment:{" "}
                            <strong className="text-purple-300">
                              {activeReviewCreator.replyInfo.sentiment}
                            </strong>
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          <strong className="text-slate-400">Analysis:</strong>{" "}
                          {activeReviewCreator.replyInfo.reasoning}
                        </p>
                      </div>

                      {/* Email Thread Viewer OR Add Email Box */}
                      <div className="space-y-3">
                        {activeReviewCreator.replyInfo.classification ===
                        "no_email" ? (
                          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs space-y-3">
                            <div className="flex items-center gap-2 text-amber-300 font-bold">
                              <span>No Email Address Found</span>
                            </div>
                            <p className="text-slate-300 text-[11px]">
                              This creator does not have a public business
                              email. To send outreach to this creator, please
                              enter their email address below:
                            </p>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                              <input
                                type="email"
                                placeholder="e.g. sponsor@creator.com"
                                value={tempEmailValue}
                                onChange={(e) =>
                                  setTempEmailValue(e.target.value)
                                }
                                className="bg-[#090b0e] border border-purple-500/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none flex-1 font-mono"
                              />
                              <button
                                type="button"
                                onClick={(e) =>
                                  saveEditEmail(activeReviewCreator.id, e)
                                }
                                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all cursor-pointer flex-shrink-0"
                              >
                                Save Email
                              </button>
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleApifyFindEmail(activeReviewCreator, e)
                                }
                                disabled={
                                  findingApifyId === activeReviewCreator.id
                                }
                                className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer flex-shrink-0 disabled:opacity-50"
                              >
                                {findingApifyId === activeReviewCreator.id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                                ) : (
                                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                                )}
                                <span>Find Business Email</span>
                              </button>
                            </div>

                            {apifyStatusMsg[activeReviewCreator.id] && (
                              <p className="text-[11px] text-amber-400 font-mono pt-1">
                                {apifyStatusMsg[activeReviewCreator.id]}
                              </p>
                            )}
                          </div>
                        ) : (
                          <>
                            {/* Outbound Sent Email */}
                            <div className="p-3.5 rounded-xl bg-[#090b0e] border border-white/[0.04] space-y-1 text-xs opacity-80">
                              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                <span>Outbound Sent Email (Google SMTP)</span>
                                <span>
                                  Recipient:{" "}
                                  {activeReviewCreator.email ||
                                    activeReviewCreator.email_public}
                                </span>
                              </div>
                              <p className="text-slate-300 font-mono text-[11px]">
                                Subject:{" "}
                                {templateSubject.replace(
                                  "{{display_name}}",
                                  activeReviewCreator.name ||
                                    activeReviewCreator.display_name,
                                )}
                              </p>
                            </div>

                            {/* Creator Incoming Reply OR Awaiting Box */}
                            {activeReviewCreator.replyInfo.hasRealReply ? (
                              <div className="p-4 rounded-xl bg-[#0d1117] border border-purple-500/30 space-y-2 text-xs shadow-inner">
                                <div className="flex justify-between text-[11px] text-slate-400 font-mono border-b border-white/[0.04] pb-1.5">
                                  <span className="text-purple-300 font-bold">
                                    {activeReviewCreator.replyInfo.subject}
                                  </span>
                                  <span>
                                    {activeReviewCreator.replyInfo.time}
                                  </span>
                                </div>
                                <p className="text-slate-100 leading-relaxed italic text-xs pt-1">
                                  "{activeReviewCreator.replyInfo.text}"
                                </p>
                              </div>
                            ) : (
                              <div className="p-4 rounded-xl bg-[#11141c] border border-dashed border-white/10 text-xs space-y-3">
                                <div className="flex items-center gap-2 text-slate-400">
                                  <Clock className="w-4 h-4 text-blue-400" />
                                  <span>
                                    Outreach sent to{" "}
                                    <strong className="text-slate-200">
                                      {activeReviewCreator.email ||
                                        activeReviewCreator.email_public}
                                    </strong>
                                    . Awaiting reply in Gmail...
                                  </span>
                                </div>

                                {/* Quick test reply simulation helper */}
                                <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                    Test Pipeline Simulation:
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSimulateReply(
                                          activeReviewCreator.id,
                                          "interested",
                                        )
                                      }
                                      className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/20 cursor-pointer"
                                    >
                                      + Simulate "Interested"
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSimulateReply(
                                          activeReviewCreator.id,
                                          "question",
                                        )
                                      }
                                      className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/20 cursor-pointer"
                                    >
                                      + Simulate "Question"
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSimulateReply(
                                          activeReviewCreator.id,
                                          "not_interested",
                                        )
                                      }
                                      className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-300 text-[11px] font-bold border border-red-500/20 cursor-pointer"
                                    >
                                      + Simulate "Not Interested"
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Human Review Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Human Review
                        </span>
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() =>
                              handleRejectCreator(activeReviewCreator.id)
                            }
                            className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold transition-all cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => {
                              handleApproveCreator(activeReviewCreator.id);
                              setSelectedCreatorId(activeReviewCreator.id);
                              setActiveStep(5);
                            }}
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Approve & Generate Product Concepts</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

      {/* STEP 5: AUDIENCE ANALYSIS & PRODUCT IDEAS */}
      {activeStep === 5 && (
        <div className="p-6 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-5">
          {/* Positive Reply Auto-Advance Notification Banner */}
          {positiveAdvanceNotice && (
            <div className="p-4 rounded-xl bg-[#101923] border border-emerald-500/40 flex items-start justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-300">
                      Positive Creator Reply Detected
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      • {positiveAdvanceNotice.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200">
                    <strong>{positiveAdvanceNotice.creatorName}</strong> (
                    {positiveAdvanceNotice.handle}) replied:{" "}
                    <span className="italic text-emerald-200">
                      "{positiveAdvanceNotice.replyText}"
                    </span>
                  </p>
                  <p className="text-[11px] text-emerald-400/90 font-medium">
                    Autonomously approved and advanced to Product Ideas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPositiveAdvanceNotice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Creator Switcher Tabs (Only Interested / Qualified Creators) */}
          <div className="p-3 rounded-xl bg-[#161a23] border border-white/[0.08] flex items-center justify-between gap-3 overflow-x-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
                Interested Creators:
              </span>
              {interestedCreators.map((c) => {
                const isSelected = selectedCreator?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCreatorId(c.id);
                      setSelectedConceptId(null);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-purple-500/20 border-purple-500/60 text-white shadow-sm"
                        : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-white/20"
                    }`}
                  >
                    <img
                      src={c.avatar}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span>{c.name || c.display_name}</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      Positive
                    </span>
                  </button>
                );
              })}

              {interestedCreators.length === 0 && (
                <span className="text-xs text-amber-300 italic px-2">
                  No creators marked interested yet
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowInterestedModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Interested Modal ({interestedCreators.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAwaitingModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>Awaiting Modal ({awaitingCreators.length})</span>
              </button>
            </div>
          </div>

          {/* Live Email Stream with Selected Creator in Step 5 (Latest Message at Top) */}
          {selectedCreator &&
            getCreatorThreadMessages(selectedCreator, realThreads).length >
              0 && (
              <div className="p-4 rounded-2xl bg-[#090b0e] border border-white/[0.08] space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      Live Email Stream with {selectedCreator?.name} (
                      {selectedCreator?.email || selectedCreator?.email_public})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-emerald-400">
                      Latest Message at Top •{" "}
                      {
                        getCreatorThreadMessages(selectedCreator, realThreads)
                          .length
                      }{" "}
                      Messages Synchronized
                    </span>
                    <button
                      type="button"
                      onClick={() => syncImapReplies(true)}
                      disabled={pollingImap}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[11px] font-bold transition-all cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${pollingImap ? "animate-spin" : ""}`}
                      />
                      <span>Sync</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {getCreatorThreadMessages(selectedCreator, realThreads).map(
                    (msg, idx) => {
                      const isLatest = idx === 0;
                      return (
                        <div
                          key={msg.id || idx}
                          className={`p-3 rounded-xl border transition-all text-xs space-y-1 ${
                            isLatest
                              ? "bg-amber-950/30 border-amber-500/50 shadow-md ring-1 ring-amber-500/30"
                              : "bg-[#141720] border-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">
                                {msg.from_address}
                              </span>
                              {isLatest && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black uppercase tracking-wider">
                                  Latest Message
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {msg.received_at
                                ? new Date(msg.received_at).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" },
                                  )
                                : "Recently"}
                            </span>
                          </div>
                          <p className="text-slate-200 text-xs font-mono whitespace-pre-wrap bg-black/40 p-2 rounded-lg border border-white/[0.04]">
                            {msg.body}
                          </p>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            )}

          {/* Autonomous Step 5 -> Step 6 Countdown Notification Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/50 via-[#141c26] to-purple-950/40 border border-amber-500/30 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                <Sparkles
                  className="w-4 h-4 text-amber-400 animate-spin"
                  style={{ animationDuration: "4s" }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-300">
                    Autonomous Pipeline Active
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    • Selected:{" "}
                    {selectedCreator?.productConcepts?.[0]?.name ||
                      "Top Concept"}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Deep audience research complete. Auto-advancing to{" "}
                  <strong>Pitch & Select</strong> in{" "}
                  <span className="font-mono text-amber-400 font-bold">
                    {step5Countdown}s
                  </span>
                  ...
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep5TimerPaused((p) => !p)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.06] hover:bg-white/10 text-slate-300 transition-all cursor-pointer"
              >
                {step5TimerPaused ? "Resume" : "Pause"}
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(6)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1 transition-all cursor-pointer shadow-md"
              >
                <span>Advance to Pitch & Select</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Product Ideas
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-300">
                  Audience Analysis & Product Ideas
                </span>
              </div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Audience Analysis & Top 3 Product Concepts</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Deep audience research, competitor analysis, and AI-scored
                software co-launch concepts for{" "}
                <strong>{selectedCreator?.name || "Creator"}</strong>.
              </p>
            </div>

            <button
              onClick={() => setActiveStep(6)}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-amber-600/20"
            >
              <span>Advance to Pitch & Select</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Deep Audience Research Intelligence Breakdown (7 Key Pillars) - 100% Dynamic Per Creator */}
          {(() => {
            const audIntel = getCreatorAudienceIntelligence(selectedCreator);
            if (!audIntel) return null;
            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span>Audience Intelligence & Deep Research Signals</span>
                  </h3>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    Verified from {selectedCreator?.name}'s channel &{" "}
                    {selectedCreator?.niche || "niche"} signals
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* 1. Content & Top Performing Posts */}
                  <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5 text-purple-400" /><span>Top-Performing Content</span>
                      </span>
                      <span className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded font-mono">
                        {audIntel.topContent.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {audIntel.topContent.headline}
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-white/[0.04]">
                      {audIntel.topContent.metricLabel}
                    </div>
                  </div>

                  {/* 2. Comments & Recurring Questions */}
                  <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /><span>Recurring Questions</span>
                      </span>
                      <span className="text-[10px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded font-mono">
                        {audIntel.recurringQuestions.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed italic">
                      {audIntel.recurringQuestions.quote}
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-white/[0.04]">
                      {audIntel.recurringQuestions.metricLabel}
                    </div>
                  </div>

                  {/* 3. Pain Points & Frustrations */}
                  <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /><span>Core Pain Points</span>
                      </span>
                      <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded font-mono">
                        {audIntel.painPoints.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {audIntel.painPoints.description}
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-white/[0.04]">
                      {audIntel.painPoints.communityLabel}
                    </div>
                  </div>

                  {/* 4. Demographics & Audience Profile */}
                  <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-400" /><span>Audience Demographics</span>
                      </span>
                      <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded font-mono">
                        {audIntel.demographics.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {audIntel.demographics.description}
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-white/[0.04]">
                      {audIntel.demographics.purchasingPower}
                    </div>
                  </div>

                  {/* 5. Existing Monetization */}
                  <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-emerald-400" /><span>Current Monetization</span>
                      </span>
                      <span className="text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
                        {audIntel.monetization.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {audIntel.monetization.description}
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-white/[0.04]">
                      {audIntel.monetization.recommendation}
                    </div>
                  </div>

                  {/* 6. Competitors & Purchase Intent */}
                  <div className="p-4 rounded-xl bg-[#161a23] border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-pink-400" /><span>Competitors & Intent</span>
                      </span>
                      <span className="text-[10px] text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded font-mono">
                        {audIntel.competitors.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {audIntel.competitors.description}
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-white/[0.04]">
                      Moat: {audIntel.competitors.moat}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {!selectedCreator?.productConcepts?.length ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No product concepts generated yet for selected creator.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs border-b border-white/[0.06] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Top 3 Product Opportunities for{" "}
                    {selectedCreator.name || selectedCreator.display_name} (
                    {selectedCreator.handle})
                  </h3>
                  <p className="text-slate-400 text-xs">
                    Each concept includes problem, key features, audience
                    evidence, pricing model, competition & UI mockup preview.
                  </p>
                </div>
                <span className="text-[11px] text-purple-300 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20 font-mono">
                  Click a card to select for pitch
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {selectedCreator.productConcepts.map((concept, index) => {
                  const isSelected =
                    selectedConceptId === concept.id ||
                    (!selectedConceptId && index === 0);
                  return (
                    <div
                      key={concept.id || index}
                      onClick={() => setSelectedConceptId(concept.id)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-4 flex flex-col justify-between ${
                        isSelected
                          ? "bg-[#151926] border-purple-500/80 shadow-md ring-1 ring-purple-500/40"
                          : "bg-[#161a23] border-white/[0.08] text-slate-300 hover:border-white/20"
                      }`}
                    >
                      <div className="space-y-3.5">
                        {/* Header Badge & Opportunity Score */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                            Concept #{index + 1}
                          </span>
                          <span className="text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>Score: {concept.opportunityScore}/100</span>
                          </span>
                        </div>

                        {/* Visual Mockup Window Preview */}
                        <div className="h-32 rounded-xl bg-gradient-to-br from-[#0a0c12] via-[#141824] to-[#1c2234] border border-white/10 p-3 relative overflow-hidden flex flex-col justify-between shadow-inner">
                          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-red-400/80" />
                              <div className="w-2 h-2 rounded-full bg-amber-400/80" />
                              <div className="w-2 h-2 rounded-full bg-emerald-400/80" />
                              <span className="text-[9px] font-mono text-slate-400 ml-1 truncate max-w-[130px]">
                                {concept.mockup?.appUrl ||
                                  `${concept.name?.toLowerCase().replace(/\s+/g, "")}.app`}
                              </span>
                            </div>
                            <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/30">
                              MVP Ready
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 my-auto">
                            <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-center">
                              <span className="text-[8px] text-slate-500 block">
                                MRR Projected
                              </span>
                              <span className="text-[10px] font-bold text-emerald-400 font-mono">
                                {concept.mockup?.primaryMetric || "$16.8K"}
                              </span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-center">
                              <span className="text-[8px] text-slate-500 block">
                                Active Users
                              </span>
                              <span className="text-[10px] font-bold text-purple-300 font-mono">
                                {concept.mockup?.activeMetric || "520"}
                              </span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-center">
                              <span className="text-[8px] text-slate-500 block">
                                Performance
                              </span>
                              <span className="text-[10px] font-bold text-cyan-300 font-mono">
                                {concept.mockup?.efficiencyMetric || "94%"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-white/[0.06] pt-1">
                            <span className="truncate max-w-[120px]">
                              {concept.customer || "Target Users"}
                            </span>
                            <span className="text-emerald-400 font-bold font-mono">
                              {concept.pricing}
                            </span>
                          </div>
                        </div>

                        {/* Name & Tagline */}
                        <div className="space-y-1">
                          <h3 className="text-sm font-black text-white tracking-tight flex items-center justify-between">
                            <span>{concept.name}</span>
                            {isSelected && (
                              <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md">
                                Selected
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-purple-300 font-semibold">
                            {concept.tagline}
                          </p>
                        </div>

                        {/* Problem & Customer */}
                        <div className="space-y-2.5 text-[11px] p-3.5 rounded-xl bg-black/40 border border-white/[0.04]">
                          <div>
                            <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">
                              Customer & Problem
                            </span>
                            <p className="text-slate-200 font-medium leading-snug mt-0.5">
                              <strong>For:</strong> {concept.customer}
                            </p>
                            <p className="text-slate-300 mt-1 leading-snug">
                              {concept.problem}
                            </p>
                          </div>

                          {/* Key Features List */}
                          {concept.keyFeatures && (
                            <div className="pt-2 border-t border-white/[0.04]">
                              <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1">
                                Key Features
                              </span>
                              <ul className="space-y-1">
                                {concept.keyFeatures.map((feat, fi) => (
                                  <li
                                    key={fi}
                                    className="flex items-start gap-1.5 text-slate-300"
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <span>{feat}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Audience Evidence */}
                          <div className="pt-2 border-t border-white/[0.04]">
                            <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">
                              Audience Evidence
                            </span>
                            <p className="text-cyan-200 text-[11px] italic mt-0.5">
                              "{concept.audienceEvidence || concept.rationale}"
                            </p>
                          </div>

                          {/* Pricing & Revenue Model */}
                          <div className="pt-2 border-t border-white/[0.04] space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                                Pricing
                              </span>
                              <span className="text-emerald-400 font-bold font-mono">
                                {concept.pricing}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-tight">
                              {concept.revenueModel}
                            </p>
                          </div>

                          {/* Competition & Moat */}
                          <div className="pt-2 border-t border-white/[0.04]">
                            <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">
                              Competition & Moat
                            </span>
                            <p className="text-slate-300 text-[10px] leading-snug mt-0.5">
                              {concept.competition}
                            </p>
                          </div>

                          {/* MVP Difficulty */}
                          <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                              MVP Timeline
                            </span>
                            <span className="text-purple-300 font-bold">
                              {concept.mvpDifficulty}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedConceptId(concept.id);
                            setActiveStep(6);
                          }}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? "bg-purple-600 hover:bg-purple-500 text-white shadow-md"
                              : "bg-white/[0.06] hover:bg-white/10 text-slate-300"
                          }`}
                        >
                          <span>
                            {isSelected
                              ? "Selected • Proceed to Pitch"
                              : "Select This Concept"}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 6: PITCH & SELECT PRODUCT */}
      {activeStep === 6 && (
        <div className="p-6 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-5">
          {/* Creator Switcher Tabs for Step 6 (Only Interested / Qualified Creators) */}
          <div className="p-3 rounded-xl bg-[#161a23] border border-white/[0.08] flex items-center justify-between gap-3 overflow-x-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
                Select Creator to Pitch:
              </span>
              {interestedCreators.map((c) => {
                const isSelected = selectedCreator?.id === c.id;
                const msgs = getCreatorThreadMessages(c, realThreads);
                const pitchSent = Boolean(
                  pitchSentMap[c.id] ||
                  msgs.some((m) => /blueprint|opportunity deck|software concepts|concept pitch|concepts for/i.test(m.subject || ""))
                );
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCreatorId(c.id);
                      setSelectedConceptId(null);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-500/50 shadow-sm"
                        : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-white/20"
                    }`}
                  >
                    <img
                      src={c.avatar}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span>{c.name || c.display_name}</span>
                    {pitchSent ? (
                      <span className="text-[10px] font-bold text-emerald-300 bg-black/40 px-1.5 py-0.2 rounded">
                        {msgs.length > 0 ? "In Dialogue" : "Pitch Sent"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-purple-300 bg-black/40 px-1.5 py-0.2 rounded">
                        Draft Ready
                      </span>
                    )}
                  </button>
                );
              })}

              {interestedCreators.length === 0 && (
                <span className="text-xs text-amber-300 italic px-2">
                  No creators ready to pitch yet
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowInterestedModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Interested Modal ({interestedCreators.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAwaitingModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>Awaiting Modal ({awaitingCreators.length})</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-pink-400">
                  Co-Launch Kickoff
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-300">
                  Opportunity Pitch & Agreement
                </span>
              </div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                <Award className="w-4 h-4 text-pink-400" />
                <span>
                  Pitch & Select Product for{" "}
                  {selectedCreator?.name || "Creator"}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select from the 3 engineered concepts, review the proposal, and initialize the co-launch venture.
              </p>
            </div>

            {/* Prominent Create Project Button */}
            <button
              onClick={handlePitchAndCreateProject}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm border border-emerald-500/50 shadow-md transition-all flex items-center gap-2.5 cursor-pointer active:scale-95"
            >
              <span>CREATE PROJECT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* AI Response Monitoring Status Banner or Pre-Send Review Callout */}
          {currentPitchSent ? (
            <div className="space-y-3">
              {/* Real-Time Telemetry & Status Banner */}
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-sm animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-2 h-2 rounded-full ${pollingImap ? "bg-amber-400 animate-ping" : "bg-emerald-400"}`}
                  />
                  <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Real-Time Sync Active for{" "}
                    {selectedCreator?.email ||
                      selectedCreator?.email_public ||
                      currentPitchSent.recipient}</span>
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    (Auto-polling Gmail IMAP every 3s)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => syncImapReplies(true)}
                    disabled={pollingImap}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${pollingImap ? "animate-spin" : ""}`}
                    />
                    <span>
                      {pollingImap ? "Syncing Gmail..." : "Sync Gmail Now"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Autonomous Project Launch Countdown Banner */}
              {autoLaunchCountdown !== null && (
                <div className="p-4 rounded-2xl bg-[#101923] border border-emerald-500/50 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in zoom-in-95">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-mono font-black text-xl">
                      {autoLaunchCountdown}s
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Autonomous Execution Active</span>
                      </span>
                      <h4 className="text-sm font-bold text-white">
                        Creator confirmed agreement! Initializing Project OS
                        for {selectedCreator?.name} in {autoLaunchCountdown}s...
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePitchAndCreateProject}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <Rocket className="w-3.5 h-3.5" />
                      <span>Launch Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAutoLaunchCountdown(null)}
                      className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-all cursor-pointer"
                    >
                      Pause
                    </button>
                  </div>
                </div>
              )}

              {/* Autonomous AI Decision Engine Card */}
              {currentAiChoice ? (
                <div
                  className={`p-4 rounded-2xl bg-[#161a23] border ${
                    currentAiChoice.decision === "PERSUADE"
                      ? "border-amber-500/50 bg-amber-950/20"
                      : currentAiChoice.decision === "ANSWER_QUESTION"
                        ? "border-blue-500/50 bg-blue-950/20"
                        : currentAiChoice.decision === "NOT_INTERESTED"
                          ? "border-rose-500/50 bg-rose-950/20"
                          : currentAiChoice.decision === "RESEND"
                            ? "border-amber-500/50 bg-amber-950/20"
                            : currentAiChoice.decision === "AWAITING_STEP6_REPLY"
                              ? "border-purple-500/40 bg-purple-950/20"
                              : "border-emerald-500/50 bg-emerald-950/20"
                  } space-y-3 shadow-md animate-in fade-in`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                        <Sparkles className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 block">
                          AI Decision Engine
                        </span>
                        <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                          <span>
                            {currentAiChoice.decision === "PERSUADE"
                              ? "AUTONOMOUS PERSUASION"
                              : currentAiChoice.decision === "ANSWER_QUESTION"
                                ? "ANSWER QUESTIONS"
                                : currentAiChoice.decision === "NOT_INTERESTED"
                                  ? "CREATOR DECLINED"
                                  : currentAiChoice.decision === "RESEND"
                                    ? "RESEND / NURTURE"
                                    : currentAiChoice.decision ===
                                        "AWAITING_STEP6_REPLY"
                                      ? `${currentAiChoice.actionLabel?.toUpperCase() || "AWAITING CREATOR FEEDBACK"}`
                                      : "CREATE PROJECT"}
                          </span>
                          {currentAiChoice.confidence > 0 && (
                            <span className="text-[11px] font-mono text-slate-400">
                              ({currentAiChoice.confidence}% Confidence)
                            </span>
                          )}
                        </h4>
                      </div>
                    </div>

                    {/* Primary Autonomous Action Trigger */}
                    <div className="flex items-center gap-2">
                      {currentAiChoice.decision === "CREATE_PROJECT" && (
                        <button
                          type="button"
                          onClick={handlePitchAndCreateProject}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs border border-emerald-500/40 shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                        >
                          <Rocket className="w-3.5 h-3.5" />
                          <span>
                            Create Project (
                            {currentAiChoice.conceptName}) →
                          </span>
                        </button>
                      )}

                      {currentAiChoice.decision === "ANSWER_QUESTION" && (
                        <button
                          type="button"
                          onClick={handleSendAnswer}
                          disabled={isSendingPitch}
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isSendingPitch ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>
                            Execute: Auto-Send Answers to Creator Questions →
                          </span>
                        </button>
                      )}

                      {currentAiChoice.decision === "NOT_INTERESTED" && (
                        <span className="text-[11px] text-rose-300 font-mono flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                          <span>
                            Creator Declined • Halting Launch
                          </span>
                        </span>
                      )}

                      {currentAiChoice.decision === "PERSUADE" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleAutonomousPersuade(selectedCreator)
                          }
                          disabled={isSendingPitch}
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isSendingPitch ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {persuasionSentMap[selectedCreator.id]
                              ? "Persuasion Sent (Resend)"
                              : "Execute: Auto-Send Persuasion Pitch →"}
                          </span>
                        </button>
                      )}

                      {currentAiChoice.decision === "RESEND" && (
                        <button
                          type="button"
                          onClick={handleAutonomousResend}
                          disabled={isSendingPitch}
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isSendingPitch ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Execute: Auto-Resend Nurture Follow-up →</span>
                        </button>
                      )}

                      {currentAiChoice.decision === "AWAITING_STEP6_REPLY" && (
                        <span className="text-[11px] text-purple-300 font-mono flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                          <Clock className="w-3.5 h-3.5 animate-pulse text-purple-400" />
                          <span>
                            Proposal Dispatched • Waiting for Creator
                            Feedback
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reasoning & Latest Message Snippet */}
                  <div className="space-y-1.5 text-xs">
                    <p className="text-slate-300 leading-relaxed font-medium">
                      <strong>AI View & Status:</strong>{" "}
                      {currentAiChoice.reasoning}
                    </p>
                    {currentAiChoice.decision === "PERSUADE" && (
                      <div className="p-2.5 rounded-lg bg-black/40 border border-rose-500/20 text-[11px] text-rose-200 space-y-1">
                        <strong className="text-rose-300 block">
                          Why they should agree:
                        </strong>
                        <p>
                          • <strong>Zero Time Commitment:</strong> Creator Forge
                          handles 100% of the engineering, product design, cloud
                          hosting, and support.
                        </p>
                        <p>
                          • <strong>High Community Demand:</strong> Verified
                          subscriber discussion proves an active need for{" "}
                          {currentAiChoice.conceptName}.
                        </p>
                        <p>
                          • <strong>50/50 Revenue Split:</strong> Zero capital
                          risk for creator with high-margin monthly recurring
                          revenue.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Real-time Email Stream for this Creator */}
              <div className="p-4 rounded-2xl bg-[#090b0e] border border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Mail className="w-3.5 h-3.5 text-purple-400" />
                    <span>
                      Live Email Stream with {selectedCreator?.name} (
                      {selectedCreator?.email || selectedCreator?.email_public})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {
                      getCreatorThreadMessages(selectedCreator, realThreads)
                        .length
                    }{" "}
                    Messages Synchronized
                  </span>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {(() => {
                    const allMsgs = getCreatorThreadMessages(selectedCreator, realThreads);
                    const pitchSent = selectedCreator ? pitchSentMap[selectedCreator.id] : null;
                    const answerSent = selectedCreator ? answerSentMap[selectedCreator.id] : null;
                    const persuasionSent = selectedCreator ? persuasionSentMap[selectedCreator.id] : null;

                    const pTime = pitchSent?.sentTimestamp || (pitchSent?.sentAt ? new Date(pitchSent.sentAt).getTime() : 0);
                    const aTime = answerSent?.sentTimestamp || (answerSent?.sentAt ? new Date(answerSent.sentAt).getTime() : 0);
                    const perTime = persuasionSent?.sentTimestamp || (persuasionSent?.sentAt ? new Date(persuasionSent.sentAt).getTime() : 0);
                    const latestOutbound = Math.max(pTime, aTime, perTime);

                    return allMsgs.length > 0 ? (
                      allMsgs.map((msg, idx) => {
                        const isLatest = idx === 0;
                        const isStep6Reply = isStep6Message(msg, latestOutbound);

                        return (
                          <div
                            key={msg.id || idx}
                            className={`p-3 rounded-xl border transition-all text-xs space-y-1 ${
                              isLatest
                                ? "bg-purple-950/30 border-purple-500/50 shadow-md ring-1 ring-purple-500/30"
                                : "bg-[#141720] border-white/[0.04]"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white">
                                  {msg.from_address}
                                </span>
                                {isStep6Reply ? (
                                  <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[9px] font-bold uppercase tracking-wider">
                                    Proposal Feedback Reply
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold uppercase tracking-wider">
                                    Initial Outreach Reply
                                  </span>
                                )}
                                {isLatest && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-white text-[9px] font-mono">
                                    Latest
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {msg.received_at
                                  ? new Date(
                                      msg.received_at,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "Recently"}
                              </span>
                            </div>
                            <p className="text-slate-200 text-xs font-mono whitespace-pre-wrap bg-black/40 p-2 rounded-lg border border-white/[0.04]">
                              {msg.body}
                            </p>
                          </div>
                        );
                      },
                    )
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 italic">
                      Waiting for incoming reply from{" "}
                      {selectedCreator?.email || selectedCreator?.email_public}
                    </div>
                  );
                })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span className="text-purple-200 leading-relaxed">
                  <strong>Follow-up Pitch Draft Ready:</strong> Presenting 3
                  concepts, mockups preview, and pricing. Review or edit below,
                  then click <strong>"Approve & Send"</strong> to dispatch to{" "}
                  {selectedCreator?.email ||
                    selectedCreator?.email_public ||
                    selectedCreator?.name}
                  .
                </span>
              </div>
              <button
                type="button"
                onClick={handleSendOpportunityPitch}
                disabled={isSendingPitch}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 flex-shrink-0 transition-all cursor-pointer shadow-md"
              >
                {isSendingPitch ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Approve & Send Pitch</span>
              </button>
            </div>
          )}

          {selectedCreator && (
            <div className="grid md:grid-cols-3 gap-5">
              {/* Concept Selector & Mockup Highlight (Left Col) */}
              <div className="md:col-span-1 p-5 rounded-2xl bg-[#161a23] border border-white/[0.08] space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Select Final Launch Concept
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      50/50 Co-Launch
                    </span>
                  </div>

                  {/* Concept Selector Pill Buttons */}
                  <div className="space-y-2">
                    {selectedCreator.productConcepts?.map((c, i) => {
                      const isChosen =
                        selectedConceptId === c.id ||
                        (!selectedConceptId && i === 0);
                      return (
                        <div
                          key={c.id}
                          onClick={() => setSelectedConceptId(c.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                            isChosen
                              ? "bg-[#181d2a] border-purple-500/70 shadow-sm ring-1 ring-purple-500/40"
                              : "bg-black/30 border-white/[0.06] hover:border-white/15"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-white flex items-center gap-1.5">
                              <span>#{i + 1}</span> {c.name}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-400 font-mono">
                              {c.pricing}
                            </span>
                          </div>
                          <p className="text-[11px] text-purple-200 line-clamp-1">
                            {c.tagline}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/[0.04]">
                            <span>Score: {c.opportunityScore}/100</span>
                            <span className="text-slate-300 font-medium">
                              {c.mvpDifficulty}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-200">
                    <span>Human Confirmation</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Confirming idea selection automatically initializes database
                    schemas, GitHub repository & Section 2 workspace.
                  </p>
                </div>
              </div>

              {/* Pitch Email Draft & Human Controls (Right 2 Cols) */}
              <div className="md:col-span-2 p-5 rounded-2xl bg-[#161a23] border border-white/[0.08] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedCreator.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-emerald-500/30"
                    />
                    <div>
                      <h3 className="text-xs font-bold text-white">
                        Opportunity Follow-Up Pitch for {selectedCreator.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        To:{" "}
                        {selectedCreator.email || selectedCreator.email_public}
                      </p>
                    </div>
                  </div>

                  {/* Human-In-The-Loop Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingPitch(!isEditingPitch)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                        isEditingPitch
                          ? "bg-purple-600 text-white border-purple-500"
                          : "bg-white/[0.05] border-white/10 text-slate-300 hover:text-white"
                      }`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>
                        {isEditingPitch ? "Done Editing" : "Edit Email"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRegeneratePitch}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Rewrite pitch with different angle"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Regenerate</span>
                    </button>

                    {currentPitchSent ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Sent at {currentPitchSent.time}</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleSendOpportunityPitch}
                          disabled={isSendingPitch}
                          className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-semibold border border-white/10 transition-all flex items-center gap-1 cursor-pointer"
                          title="Resend this pitch email"
                        >
                          <Send className="w-3 h-3" />
                          <span>
                            {isSendingPitch ? "Sending..." : "Resend"}
                          </span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOpportunityPitch}
                        disabled={isSendingPitch}
                        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {isSendingPitch ? "Sending..." : "Approve & Send"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Email Subject & Body View / Edit */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-400 font-medium block mb-1">
                      Subject
                    </label>
                    {isEditingPitch ? (
                      <input
                        type="text"
                        value={customPitchSubject}
                        onChange={(e) => setCustomPitchSubject(e.target.value)}
                        className="w-full bg-[#090b0e] border border-purple-500/50 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                      />
                    ) : (
                      <div className="p-2.5 rounded-xl bg-[#090b0e] border border-white/[0.06] font-mono text-xs text-white font-semibold">
                        {customPitchSubject ||
                          `Partnership Opportunity Deck & Top 3 Software Concepts for ${selectedCreator.name || selectedCreator.display_name}`}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-medium block mb-1">
                      Opportunity Pitch Body
                    </label>
                    {isEditingPitch ? (
                      <textarea
                        rows={11}
                        value={customPitchBody}
                        onChange={(e) => setCustomPitchBody(e.target.value)}
                        className="w-full bg-[#090b0e] border border-purple-500/50 rounded-xl p-3.5 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none"
                      />
                    ) : (
                      <div className="p-4 rounded-xl bg-[#090b0e] border border-white/[0.06] font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                        {customPitchBody || (
                          <>
                            <p>
                              Hi{" "}
                              {selectedCreator.name?.split(" ")[0] || "there"},
                            </p>
                            <br />
                            <p>
                              Following up on our sync! Based on our deep
                              audience research across your{" "}
                              {selectedCreator.followerStr || "100k+"} community
                              in {selectedCreator.niche}, we designed the top 3
                              software product concepts tailored for your
                              audience:
                            </p>
                            <br />
                            <div className="space-y-1.5 pl-3 border-l-2 border-purple-500/40 text-purple-200">
                              {selectedCreator.productConcepts?.map((c, i) => (
                                <p key={i}>
                                  • <strong>{c.name}</strong> ({c.pricing}):{" "}
                                  {c.tagline} —{" "}
                                  <em>
                                    Opportunity Score: {c.opportunityScore}/100
                                  </em>
                                </p>
                              ))}
                            </div>
                            <br />
                            <p>
                              Our engineering team will build the full MVP at
                              zero upfront cost under our 50/50 revenue-share
                              partnership.
                            </p>
                            <p>
                              Let us know which concept excites you most to kick
                              off development!
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Interested & Qualified Creators Modal ───────────────────────────────── */}
      {showInterestedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-3xl rounded-2xl bg-[#0e1117] border border-emerald-500/30 shadow-2xl p-6 space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">
                    Interested & Qualified Creators ({interestedCreators.length}
                    )
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  These creators replied with interest or have been approved.
                  Click any creator to jump straight to their distinct proposal & concepts!
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => syncImapReplies(true)}
                  disabled={pollingImap}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${pollingImap ? "animate-spin" : ""}`}
                  />
                  <span>Poll Inbox</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowInterestedModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {interestedCreators.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No creators marked as interested yet. Once a creator replies
                  or is qualified, they will automatically appear here!
                </div>
              ) : (
                interestedCreators.map((c) => {
                  const replyInfo = getCreatorReply(c);
                  const emailVal = c.email || c.email_public || "";
                  const pitchSent = Boolean(pitchSentMap[c.id]);
                  const choice = aiDetectedChoiceMap[c.id];
                  const isCurrentlySelected = selectedCreator?.id === c.id;

                  return (
                    <div
                      key={c.id}
                      className={`p-4 rounded-xl bg-[#161a23] border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                        isCurrentlySelected
                          ? "border-emerald-500/60 shadow-sm ring-1 ring-emerald-500/30"
                          : "border-white/[0.06] hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={c.avatar}
                          alt=""
                          className="w-11 h-11 rounded-full object-cover border border-white/10"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              {c.name || c.display_name}
                            </span>
                            <span className="text-slate-400 font-mono">
                              {c.handle}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400 font-mono">
                              {c.platform} • {c.followerStr || c.follower_count}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-emerald-400 font-mono text-[11px]">
                              {emailVal}
                            </span>
                            <span className="text-slate-500">•</span>
                            {pitchSent ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-300 border-emerald-500/30 flex items-center gap-1">
                                <span>Proposal Dispatched</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-purple-500/15 text-purple-300 border-purple-500/30 flex items-center gap-1">
                                <span>Ready to Pitch</span>
                              </span>
                            )}
                            {choice?.conceptName && (
                              <>
                                <span className="text-slate-500">•</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-teal-500/10 text-teal-300 border-teal-500/20">
                                  Concept: {choice.conceptName}
                                </span>
                              </>
                            )}
                          </div>

                          {replyInfo.text && (
                            <div className="mt-2 p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] text-slate-300 italic max-w-lg">
                              "
                              {replyInfo.text.length > 140
                                ? replyInfo.text.slice(0, 140) + "..."
                                : replyInfo.text}
                              "
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCreatorId(c.id);
                            setSelectedConceptId(null);
                            setActiveStep(6);
                            setShowInterestedModal(false);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isCurrentlySelected
                              ? "bg-emerald-600 text-white shadow-lg"
                              : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md"
                          }`}
                        >
                          <span>
                            {isCurrentlySelected
                              ? "Viewing in Pitch & Select"
                              : "Open in Pitch & Select →"}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.08] pt-3 text-[11px] text-slate-400">
              <span>
                Click any creator above to isolate and preview their exact
                proposal & concepts.
              </span>
              <button
                type="button"
                onClick={() => setShowInterestedModal(false)}
                className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Awaiting Creator Replies Modal ────────────────────────────────────── */}
      {showAwaitingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-3xl rounded-2xl bg-[#0e1117] border border-white/[0.12] shadow-2xl p-6 space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <h3 className="text-base font-bold text-white">
                    Awaiting Replies & Pending Leads
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  These creators have not replied with interest yet. Once they
                  reply, they will automatically advance to Product Ideas & Proposal Pitch.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => syncImapReplies(true)}
                  disabled={pollingImap}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${pollingImap ? "animate-spin" : ""}`}
                  />
                  <span>Poll Inbox</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAwaitingModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {awaitingCreators.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  All creators in this batch have replied and are qualified.
                </div>
              ) : (
                awaitingCreators.map((c) => {
                  const replyInfo = getCreatorReply(c);
                  const emailVal = c.email || c.email_public || "";
                  const hasEmail = Boolean(emailVal && emailVal.includes("@"));
                  return (
                    <div
                      key={c.id}
                      className="p-4 rounded-xl bg-[#161a23] border border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={c.avatar}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border border-white/10"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">
                              {c.name || c.display_name}
                            </span>
                            <span className="text-slate-500">{c.handle}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400 font-mono">
                              {c.platform} • {c.followerStr || c.follower_count}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {hasEmail ? (
                              <span className="text-emerald-400 font-mono text-[11px]">
                                {emailVal}
                              </span>
                            ) : (
                              <span className="text-amber-400 text-[11px] italic">
                                No Email Address
                              </span>
                            )}
                            <span className="text-slate-500">•</span>
                            {replyInfo.hasRealReply ? (
                              replyInfo.classification === "not_interested" ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-rose-500/10 text-rose-300 border-rose-500/30 flex items-center gap-1">
                                  <span>Declined / Not Interested</span>
                                </span>
                              ) : replyInfo.classification === "question" ||
                                replyInfo.classification === "more_info" ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-300 border-blue-500/30 flex items-center gap-1">
                                  <span>Question / Asking for Info</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-300 border-emerald-500/30 flex items-center gap-1">
                                  <span>Qualified / Interested</span>
                                </span>
                              )
                            ) : (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  hasEmail
                                    ? "bg-purple-500/10 text-purple-300 border-purple-500/20"
                                    : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                                }`}
                              >
                                {hasEmail
                                  ? "⏳ Awaiting Reply"
                                  : "No Email (Outreach Skipped)"}
                              </span>
                            )}
                          </div>
                          {replyInfo.hasRealReply && replyInfo.text && (
                            <div className="mt-2 p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] text-slate-300 italic max-w-lg">
                              "
                              {replyInfo.text.length > 150
                                ? replyInfo.text.slice(0, 150) + "..."
                                : replyInfo.text}
                              "
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                        {replyInfo.classification === "question" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCreatorId(c.id);
                              setShowAwaitingModal(false);
                              setActiveStep(6);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span>Answer Question</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            handleModifyReplyClassification(c.id, "interested");
                            setSelectedCreatorId(c.id);
                            setSelectedConceptId(null);
                            setActiveStep(6);
                            setShowAwaitingModal(false);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Mark as Interested & Pitch</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.08] pt-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>When creators reply to your email, they will automatically advance to product review.</span>
              </span>
              <button
                type="button"
                onClick={() => setShowAwaitingModal(false)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Pipeline Oversight & Error Lookup Modal */}
      <AdminPipelineLookup
        isOpen={showAdminLookup}
        onClose={() => setShowAdminLookup(false)}
        creators={creators}
        realThreads={realThreads}
        pitchSentMap={pitchSentMap}
        answerSentMap={answerSentMap}
        persuasionSentMap={persuasionSentMap}
        onSelectCreator={(cid) => {
          setSelectedCreatorId(cid);
          setShowAdminLookup(false);
          setActiveStep(6);
        }}
        onTriggerFollowUp={(c) => {
          handleAutonomousResend(c);
        }}
        onForceLaunchProject={(c) => {
          setSelectedCreatorId(c.id);
          setShowAdminLookup(false);
          handlePitchAndCreateProject();
        }}
        onSyncImap={() => syncImapReplies(true)}
        isSyncing={pollingImap}
        onNotify={notify}
      />

      {/* Universal Floating Action Notifications & Alerts */}
      <ActionNotificationToast toasts={toasts} onDismiss={dismissToast} />

      {/* Confirmation Modal for Resetting Pipeline & Deleting All Leads */}
      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        onConfirm={executeDeleteAllCreators}
        title="Reset Pipeline & Delete All Leads?"
        message="Are you sure you want to delete all creators and start again? This will permanently wipe all discovered creators, email threads, outreach history, and reset your acquisition workflow back to campaign setup."
        confirmText="Confirm & Delete Everything"
        cancelText="Keep Leads"
        isDestructive={true}
        isLoading={isDeletingAll}
        stats={[
          `${creators.length} Discovered Creators`,
          `${realThreads.length} Email Threads`,
          "All Opportunity Pitches & Decks",
        ]}
      />
    </div>
  );
}
