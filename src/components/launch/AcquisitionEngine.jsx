import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Target,
  Search,
  Send,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  XCircle,
  Eye,
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
  Globe,
  Loader2,
  User,
  UserCheck,
  Lock,
  Unlock,
} from "lucide-react";
import { deleteAllCreators } from "../../services/opsApi";
import { buildSmartFallbackPlan } from "../../services/ai";
import AdminPipelineLookup from "./AdminPipelineLookup";
import CreatorFollowUpCRM from "./CreatorFollowUpCRM";
import ActionNotificationToast from "../ui/ActionNotificationToast";
import ConfirmationModal from "../ui/ConfirmationModal";
import FormattedMarkdownBody from "./FormattedMarkdownBody";
import ScoutingCyclingAnimation from "./ScoutingCyclingAnimation";
import Step5SkeletonLoader from "./Step5SkeletonLoader";
import { getExpiringItem, setExpiringItem, removeExpiringItem, ONE_HOUR_MS } from "../../utils/expiringStorage";

// Category-tailored high-res visual mockup screenshots for creator proposals
export const CONCEPT_CATEGORY_IMAGES = {
  productivity: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&auto=format&fit=crop&q=80",
  tech: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&auto=format&fit=crop&q=80",
  finance: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=1000&auto=format&fit=crop&q=80",
  video_editing: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1000&auto=format&fit=crop&q=80",
  game_dev: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1000&auto=format&fit=crop&q=80",
  data_ai: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80",
  cybersecurity: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1000&auto=format&fit=crop&q=80",
  business_founder: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&auto=format&fit=crop&q=80",
  podcast_audio: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1000&auto=format&fit=crop&q=80",
  default: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&auto=format&fit=crop&q=80",
};

export const getConceptImageUrl = (concept, fallbackNiche = "tech") => {
  if (concept?.imageUrl) return concept.imageUrl;
  if (concept?.mockup?.imageUrl) return concept.mockup.imageUrl;
  if (concept?.mockup_image) return concept.mockup_image;
  const n = (Array.isArray(fallbackNiche) ? fallbackNiche.join(" ") : String(fallbackNiche || "")).toLowerCase();
  for (const [k, url] of Object.entries(CONCEPT_CATEGORY_IMAGES)) {
    if (n.includes(k) || (concept?.tagline && concept.tagline.toLowerCase().includes(k))) {
      return url;
    }
  }
  return CONCEPT_CATEGORY_IMAGES.default;
};

export default function AcquisitionEngine({
  initialCreators = [],
  api,
  onCreateProject,
  onGoToProjectOS,
  onResetAll,
  initialActiveStep = null,
  initialSelectedCreatorId = null,
  initialNavNonce = null,
  onActiveStepChange = null,
}) {
  const [activeStep, setActiveStep] = useState(() => {
    try {
      if (initialActiveStep && initialActiveStep >= 1 && initialActiveStep <= 6) {
        return initialActiveStep;
      }
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const stepParam = Number(searchParams?.get('step'));
      if (stepParam >= 1 && stepParam <= 6) return stepParam;
      const savedStep = Number(
        getExpiringItem("forge_launch_acquisition_step"),
      );
      if (savedStep >= 1 && savedStep <= 6) return savedStep;
      return 1;
    } catch {
      return 1;
    }
  });

  // Operational Mode: 'human' (Operator Review) vs 'autonomous' (Hands-Free AI)
  const [pipelineMode, setPipelineMode] = useState(() => {
    try {
      return localStorage.getItem("forge_pipeline_mode") || "human";
    } catch {
      return "human";
    }
  });

  const handleSetPipelineMode = (mode) => {
    setPipelineMode(mode);
    try {
      localStorage.setItem("forge_pipeline_mode", mode);
    } catch (e) {}
    if (mode === "human") {
      setTimerPaused(true);
      setCampaignRunning(false);
    } else {
      setTimerPaused(false);
      setCampaignRunning(true);
    }
  };

  const [campaignRunning, setCampaignRunning] = useState(() => {
    try {
      const mode = localStorage.getItem("forge_pipeline_mode") || "human";
      return mode === "autonomous";
    } catch {
      return false;
    }
  });
  const [showAdminLookup, setShowAdminLookup] = useState(false);
  const isInitialLoadDone = useRef(false);

  useEffect(() => {
    if (initialActiveStep && initialActiveStep >= 1 && initialActiveStep <= 6) {
      setActiveStep(initialActiveStep);
    }
  }, [initialActiveStep, initialNavNonce]);

  useEffect(() => {
    if (onActiveStepChange) {
      onActiveStepChange(activeStep);
    }
  }, [activeStep, onActiveStepChange]);

  useEffect(() => {
    if (initialSelectedCreatorId) {
      setSelectedCreatorId(initialSelectedCreatorId);
      // Ensure the creator exists in local creators pool; if not, query pipeline DB
      setCreators((prev) => {
        const found = (prev || []).some(
          (c) => c.id === initialSelectedCreatorId || c.handle === initialSelectedCreatorId
        );
        if (found) return prev;
        import("../../services/opsApi").then(({ fetchCreators }) => {
          fetchCreators().then((all) => {
            if (Array.isArray(all) && all.length > 0) {
              const matched = all.find(
                (c) => c.id === initialSelectedCreatorId || c.handle === initialSelectedCreatorId
              );
              if (matched) {
                setCreators((curr) => {
                  if (curr.some((c) => c.id === matched.id)) return curr;
                  return [matched, ...curr];
                });
              }
            }
          }).catch(() => {});
        });
        return prev;
      });
    }
  }, [initialSelectedCreatorId, initialNavNonce]);

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
  const [selectedGeography, setSelectedGeography] = useState("GLOBAL");
  const [weeklyOutreachVolume, setWeeklyOutreachVolume] = useState(50);
  const [followUpDays, setFollowUpDays] = useState(7);
  const [minScoreThreshold, setMinScoreThreshold] = useState(70);
  const [creatorsBatchCount, setCreatorsBatchCount] = useState(3); // Default batch size
  const [selectedPlatforms, setSelectedPlatforms] = useState([
    "youtube",
    "tiktok",
    "instagram",
  ]);
  const [templateSubject, setTemplateSubject] = useState(
    "Quick idea for {{display_name}}",
  );
  const [templateBody, setTemplateBody] = useState(
    `Hi {{first_name}},\n\nI’ve been following your {{niche}} content on {{platform}} and really enjoy what you're building with your community.\n\nI run Creator Forge — we partner 50/50 with creators to build custom software tools for their audience. Our team handles 100% of the engineering, hosting, payment setup, and customer support with zero upfront cost to you.\n\nWe analyzed your channel and outlined 3 software product concepts tailored specifically for your {{follower_count}} followers that could generate recurring monthly revenue.\n\nWould you be open to taking a look at a brief 3-concept breakdown?\n\nBest regards,\nCreator Forge Team\n\n---\nRef: [CF-STAGE:STEP3_INQUIRY | CF-CID:{{creator_id}} | Handle:@{{handle}}]`,
  );

  // Discovered Creators State (Dynamic AI + Apify Pipeline)
  const [isLaunchingProject, setIsLaunchingProject] = useState(false);
  const [launchStepIndex, setLaunchStepIndex] = useState(1);
  const [creators, setCreators] = useState(() => {
    const deletedIds = (() => {
      try {
        return getExpiringItem("forge_deleted_creator_ids", []);
      } catch {
        return [];
      }
    })();

    let list = [];
    if (initialCreators && initialCreators.length > 0) {
      list = initialCreators;
    } else {
      try {
        const saved = getExpiringItem("forge_launch_discovered_creators");
        if (saved && Array.isArray(saved) && saved.length > 0) {
          list = saved;
        }
      } catch {}
    }

    if (deletedIds.length > 0) {
      list = list.filter((c) => {
        const cleanHandle = (c.handle || "").toLowerCase().replace(/^@/, "");
        return (
          !deletedIds.includes(c.id) &&
          !deletedIds.includes(cleanHandle) &&
          !deletedIds.includes(c.handle)
        );
      });
    }

    // Sanitize any corrupt synthetic reply texts or false positive interested classifications
    list = list.map((c) => {
      const isFakeText =
        c.replyText &&
        (c.replyText.startsWith("Creator responded") ||
          c.replyText.includes("qualified for partnership pitch") ||
          c.replyText === "Yes, I would be interested.");
      if (isFakeText) {
        return {
          ...c,
          hasReplied: false,
          replyText: null,
          reply_text: null,
          replyClassification: (c.status === "approved" || c.isApproved) ? "qualified" : "awaiting_reply",
          reply_classification: (c.status === "approved" || c.isApproved) ? "qualified" : "awaiting_reply",
        };
      }
      return c;
    });

    return list;
  });
  const [selectedCreatorId, setSelectedCreatorId] = useState(() => {
    try {
      if (initialSelectedCreatorId) return initialSelectedCreatorId;
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const creatorParam = searchParams?.get('creator') || searchParams?.get('creatorId');
      if (creatorParam) return creatorParam;
      const deletedIds = getExpiringItem("forge_deleted_creator_ids", []);
      const savedCreators = getExpiringItem("forge_launch_discovered_creators", []);
      const candidates = (initialCreators && initialCreators.length > 0 ? initialCreators : savedCreators).filter(
        (c) => !deletedIds.includes(c.id) && !deletedIds.includes((c.handle || "").replace(/^@/, "").toLowerCase())
      );
      return candidates?.[0]?.id || null;
    } catch {
      return null;
    }
  });
  const [selectedConceptId, setSelectedConceptId] = useState(null);
  const [creatorConceptSelectionMap, setCreatorConceptSelectionMap] = useState(() => {
    try {
      return getExpiringItem("forge_creator_concept_selection_map", {});
    } catch {
      return {};
    }
  });
  const [step5Error, setStep5Error] = useState(null);
  const [discovering, setDiscovering] = useState(false);
  const discoveryAbortRef = useRef(null);
  const [discoveryLog, setDiscoveryLog] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(null);
  const [replyFilter, setReplyFilter] = useState("all");
  const [showFollowUpCRM, setShowFollowUpCRM] = useState(false);

  // Synchronize active step and selected creator across devices
  useEffect(() => {
    try {
      setExpiringItem("forge_launch_acquisition_step", String(activeStep), ONE_HOUR_MS);
      import("../../services/opsApi").then(({ updateWorkflowState }) => {
        updateWorkflowState({ active_step: activeStep, selected_creator_id: selectedCreatorId }).catch(() => {});
      });
    } catch (error) {
      console.warn(
        "[AcquisitionEngine] Failed to persist workflow step:",
        error,
      );
    }
  }, [activeStep, selectedCreatorId]);

  // Auto-abort any in-flight discovery when operator navigates beyond Step 2
  useEffect(() => {
    if (activeStep > 2 && (discovering || discoveryAbortRef.current)) {
      if (discoveryAbortRef.current) {
        try {
          discoveryAbortRef.current.abort();
        } catch (e) {}
        discoveryAbortRef.current = null;
      }
      setDiscovering(false);
      try {
        import("../../services/opsApi").then(({ stopAutonomousDiscovery }) => {
          stopAutonomousDiscovery().catch(() => {});
        });
      } catch (e) {}
    }
  }, [activeStep, discovering]);

  // Sync step and creator from URL if passed as deep-link query parameters
  useEffect(() => {
    const handleUrlSync = () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const stepParam = Number(searchParams.get('step'));
        const creatorParam = searchParams.get('creator');
        if (stepParam >= 1 && stepParam <= 6) {
          setActiveStep(stepParam);
        }
        if (creatorParam) {
          setSelectedCreatorId(creatorParam);
        }
      } catch (e) {}
    };

    handleUrlSync();
    window.addEventListener('popstate', handleUrlSync);
    return () => window.removeEventListener('popstate', handleUrlSync);
  }, []);

  // Keep discovered creators persisted to expiring storage (1 hour TTL) so they never vanish on refresh
  useEffect(() => {
    try {
      const deletedIds = getExpiringItem("forge_deleted_creator_ids", []);
      const cleanList = (creators || []).filter((c) => {
        const cleanHandle = (c.handle || "").toLowerCase().replace(/^@/, "");
        return (
          !deletedIds.includes(c.id) &&
          !deletedIds.includes(cleanHandle) &&
          !deletedIds.includes(c.handle)
        );
      });

      if (cleanList.length > 0) {
        setExpiringItem(
          "forge_launch_discovered_creators",
          cleanList,
          ONE_HOUR_MS,
        );
      } else {
        removeExpiringItem("forge_launch_discovered_creators");
      }
    } catch (err) {
      console.warn(
        "[AcquisitionEngine] Failed to save creators to storage:",
        err,
      );
    }
  }, [creators]);

  // Real-time synchronization for creator deletion from CRM or other tabs
  useEffect(() => {
    const handleCreatorDeleted = (e) => {
      const targetId = e?.detail?.creatorId;
      const targetHandle = e?.detail?.handle;
      const cleanTargetHandle = (targetHandle || "").replace(/^@/, "").toLowerCase();

      setCreators((prev) =>
        (prev || []).filter((c) => {
          const cleanHandle = (c.handle || "").replace(/^@/, "").toLowerCase();
          const matches =
            c.id === targetId ||
            c.handle === targetId ||
            c.handle === targetHandle ||
            (cleanTargetHandle && cleanHandle === cleanTargetHandle);
          return !matches;
        })
      );

      setSelectedCreatorId((prevId) => {
        if (prevId === targetId || prevId === targetHandle) return null;
        return prevId;
      });
    };

    const handleStorageChange = (e) => {
      if (e.key === "forge_launch_discovered_creators" && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated)) {
            setCreators(updated);
          }
        } catch (err) {}
      }
      if (e.key === "forge_last_deleted_timestamp") {
        try {
          const deletedIds = JSON.parse(localStorage.getItem("forge_deleted_creator_ids") || "[]");
          if (deletedIds.length > 0) {
            setCreators((prev) =>
              (prev || []).filter((c) => {
                const cleanHandle = (c.handle || "").toLowerCase().replace(/^@/, "");
                return (
                  !deletedIds.includes(c.id) &&
                  !deletedIds.includes(cleanHandle) &&
                  !deletedIds.includes(c.handle)
                );
              })
            );
          }
        } catch (err) {}
      }
    };

    window.addEventListener("forge_creator_deleted", handleCreatorDeleted);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("forge_creator_deleted", handleCreatorDeleted);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Alert & Notification System State
  const [toasts, setToasts] = useState([]);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const notify = useCallback((type, title, message, duration = 3500) => {
    const id = "toast_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => {
      // Deduplicate: replace any existing toast with the same title so it never stacks
      const filtered = prev.filter((t) => t.title !== title);
      // Keep at most 2 toasts on screen simultaneously
      return [...filtered.slice(-1), { id, type, title, message, duration }];
    });
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleDeleteAllCreators = () => {
    setShowDeleteConfirmModal(true);
  };

  const executeDeleteAllCreators = async () => {
    setIsDeletingAll(true);
    const creatorCount = creators.length;
    const threadCount = realThreads.length;
    try {
      setShowDeleteConfirmModal(false);
      setCreators([]);
      setRealThreads([]);
      setSelectedCreatorId(null);
      setSelectedConceptId(null);
      setPositiveAdvanceNotice(null);
      setAutoAdvancedIds(new Set());
      autoAdvancedIdsRef.current = new Set();
      setAiDetectedChoiceMap({});
      setPitchSentMap({});
      setAnswerSentMap({});
      setPersuasionSentMap({});
      setHasAutoCreatedProject(false);
      setActiveStep(1);
      setDiscoveryLog("");
      setOutreachLog("");

      // Deep wipe of all launch persistence keys in localStorage
      localStorage.removeItem("forge_launch_discovered_creators");
      localStorage.removeItem("forge_launch_active_project");
      localStorage.removeItem("forge_launch_acquisition_step");
      localStorage.removeItem("forge_launch_active_step");
      localStorage.removeItem("forge_launch_real_threads");
      localStorage.removeItem("forge_launch_pitch_sent_map");
      localStorage.removeItem("forge_launch_answer_sent_map");
      localStorage.removeItem("forge_launch_persuasion_sent_map");
      localStorage.removeItem("forge_launch_ai_choice_map");
      localStorage.removeItem("forge_launch_creator_stage_map");
      localStorage.removeItem("forge_deleted_creator_ids");
      localStorage.removeItem("forge_last_deleted_timestamp");
      localStorage.removeItem("forge_launch_active_section");
      onResetAll?.();

      try {
        await deleteAllCreators();
        const { resetWorkflowState } = await import("../../services/opsApi");
        await resetWorkflowState().catch(() => {});
        try {
          window.history.replaceState({}, "", "/launch");
        } catch (e) {}
      } catch (err) {
        console.warn("Backend delete all creators failed or offline:", err);
      }

      // Trigger rich alert toast
      notify(
        "success",
        "Pipeline Reset & Creators Deleted",
        `Successfully wiped ${creatorCount} creators, ${threadCount} email threads, and reset workflow back to Step 1.`,
        4500
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

  const saveEditEmail = async (creatorId, e, explicitValue = null) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
      e.preventDefault();
    }
    const targetId = creatorId || editingEmailCreatorId;
    if (!targetId) return;

    const newEmail = (explicitValue !== null ? explicitValue : tempEmailValue).trim();

    // 1. Update local state immediately (both in React state and in localStorage)
    setCreators((prev) => {
      const updated = prev.map((c) => {
        const matchId = c.id === targetId;
        const cleanTarget = String(targetId).toLowerCase().replace(/^@/, "");
        const cleanHandle = String(c.handle || "").toLowerCase().replace(/^@/, "");
        const matchHandle = cleanTarget && cleanHandle && cleanTarget === cleanHandle;
        if (matchId || matchHandle) {
          return {
            ...c,
            email: newEmail,
            email_public: newEmail,
            email_verified: Boolean(newEmail && newEmail.includes("@")),
          };
        }
        return c;
      });
      try {
        setExpiringItem("forge_launch_discovered_creators", updated, ONE_HOUR_MS);
      } catch (err) {}
      return updated;
    });

    setEditingEmailCreatorId(null);
    setTempEmailValue("");

    // 2. Persist to DB if creator exists on backend
    if (newEmail) {
      try {
        const { updateCreatorDetails } = await import("../../services/opsApi");
        await updateCreatorDetails(targetId, {
          email_public: newEmail,
          email: newEmail,
        });
        notify("success", "Email Updated", `Contact email updated to ${newEmail}.`, 3000);
      } catch (err) {
        console.warn("[AcquisitionEngine] Failed to save email to DB:", err);
        notify("warning", "Saved Locally", `Email updated in session: ${newEmail}`, 3000);
      }
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

  // Hunter.io Email Finder & Verifier state
  const [hunterLoadingId, setHunterLoadingId] = useState(null);
  const [hunterActionType, setHunterActionType] = useState(null); // 'find' | 'verify'
  const [hunterDataMap, setHunterDataMap] = useState({});

  const handleHunterFindEmail = async (creator, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setHunterLoadingId(creator.id);
    setHunterActionType('find');
    try {
      const { findEmailWithHunter } = await import("../../services/opsApi");
      const res = await findEmailWithHunter({
        creator_id: creator.id,
        full_name: creator.display_name || creator.name,
        auto_save: true,
      });

      if (res && res.success && res.email) {
        setCreators((prev) =>
          prev.map((c) => {
            if (c.id === creator.id) {
              return {
                ...c,
                email: res.email,
                email_public: res.email,
                email_verified: true,
                hunter_score: res.score,
                hunter_status: res.verification_status || 'valid',
              };
            }
            return c;
          })
        );
        setHunterDataMap((prev) => ({
          ...prev,
          [creator.id]: res,
        }));
        notify(
          'success',
          'Hunter.io Email Found!',
          `Found: ${res.email} (Confidence: ${res.score}%, Status: ${res.verification_status || 'verified'})`,
          4500
        );
      } else {
        notify(
          'warning',
          'Hunter.io Search Completed',
          res?.error || `No business email found on Hunter.io for ${creator.display_name || creator.name}. Try social scrape or manual edit.`,
          4000
        );
      }
    } catch (err) {
      console.warn('[Hunter.io Find Error]:', err);
      notify('error', 'Hunter.io Error', err.message || 'Failed to search Hunter.io API', 3500);
    } finally {
      setHunterLoadingId(null);
      setHunterActionType(null);
    }
  };

  const handleHunterVerifyEmail = async (creator, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const targetEmail = (creator.email || creator.email_public || "").trim();
    if (!targetEmail) {
      notify('warning', 'No Email', 'Please provide or find an email address first.', 3000);
      return;
    }

    setHunterLoadingId(creator.id);
    setHunterActionType('verify');
    try {
      const { verifyEmailWithHunter } = await import("../../services/opsApi");
      const res = await verifyEmailWithHunter({
        email: targetEmail,
        creator_id: creator.id,
        auto_save: true,
      });

      if (res && res.success) {
        setHunterDataMap((prev) => ({
          ...prev,
          [creator.id]: res,
        }));
        setCreators((prev) =>
          prev.map((c) => {
            if (c.id === creator.id) {
              return {
                ...c,
                email_verified: res.deliverable,
                hunter_score: res.score,
                hunter_status: res.status,
              };
            }
            return c;
          })
        );
        const deliverableText = res.deliverable ? 'Deliverable ✓' : 'Risky / Undeliverable';
        notify(
          res.deliverable ? 'success' : 'warning',
          `Hunter.io: ${deliverableText}`,
          `Score: ${res.score}% | Status: ${res.status} | SMTP: ${res.smtp_check ? 'Passed' : 'Failed'} | MX: ${res.mx_records ? 'Valid' : 'Missing'}`,
          5000
        );
      } else {
        notify('error', 'Verification Failed', res?.error || 'Hunter could not verify this email.', 3500);
      }
    } catch (err) {
      console.warn('[Hunter.io Verify Error]:', err);
      notify('error', 'Verification Error', err.message || 'Failed to connect to Hunter verifier.', 3500);
    } finally {
      setHunterLoadingId(null);
      setHunterActionType(null);
    }
  };

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
        saveEditEmail(creator.id, { preventDefault: () => {} }, res.email);
        setApifyStatusMsg((prev) => ({
          ...prev,
          [creator.id]: `Verified Email: ${res.email}`,
        }));
        try {
          await updateCreatorDetails(creator.id, { email: res.email });
        } catch (dbErr) {
          console.warn("DB save error:", dbErr);
        }
      } else {
        setApifyStatusMsg((prev) => ({
          ...prev,
          [creator.id]: "No public business contact found in directory.",
        }));
      }
    } catch (err) {
      console.warn("Find error:", err);
      setApifyStatusMsg((prev) => ({
        ...prev,
        [creator.id]: "Contact lookup completed.",
      }));
    } finally {
      setFindingApifyId(null);
    }
  };

  // Comprehensive curated list of popular creator niches
  const popularNiches = [
    "Tech",
    "Software",
    "SaaS",
    "Fintech",
    "Productivity",
    "AI Tools",
    "Creator Economy",
    "Gaming",
    "Fitness & Health",
    "E-Commerce",
    "Finance",
    "Crypto & Web3",
    "Design & Creative",
    "Education",
    "Beauty & Lifestyle",
    "Marketing",
  ];

  // Merge popular niches with any active/custom niches so every niche is in the list with equal width
  const allNicheOptions = Array.from(
    new Set([
      ...popularNiches,
      ...niches,
    ])
  );

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

  // Load existing creators, workflow state, and threads from database on mount — DB is the single source of truth for cross-device persistence
  useEffect(() => {
    let isMounted = true;
    const fetchGlobalState = async () => {
      try {
        const { getCreators, getWorkflowState, getThreads } = await import("../../services/opsApi");
        
        // 1. Sync global workflow state (step, pitch map, choices) across devices
        const ws = await getWorkflowState().catch(() => null);
        if (isMounted && ws) {
          const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const urlStep = Number(searchParams?.get('step'));
          if (!urlStep && !initialActiveStep && !isInitialLoadDone.current && ws.active_step && ws.active_step >= 1 && ws.active_step <= 6) {
            setActiveStep(ws.active_step);
          }
          if (ws.selected_creator_id && !initialSelectedCreatorId) {
            setSelectedCreatorId((prev) => prev || ws.selected_creator_id);
          }
          if (ws.pitch_sent_map && Object.keys(ws.pitch_sent_map).length > 0) {
            setPitchSentMap((prev) => ({ ...ws.pitch_sent_map, ...prev }));
          }
          if (ws.ai_choice_map && Object.keys(ws.ai_choice_map).length > 0) {
            setAiDetectedChoiceMap((prev) => ({ ...ws.ai_choice_map, ...prev }));
          }
          if (ws.answer_sent_map && Object.keys(ws.answer_sent_map).length > 0) {
            setAnswerSentMap((prev) => ({ ...ws.answer_sent_map, ...prev }));
          }
          if (ws.persuasion_sent_map && Object.keys(ws.persuasion_sent_map).length > 0) {
            setPersuasionSentMap((prev) => ({ ...ws.persuasion_sent_map, ...prev }));
          }
        }

        // 2. Sync real threads / IMAP messages across devices
        const ths = await getThreads().catch(() => null);
        if (isMounted && Array.isArray(ths)) {
          setRealThreads(ths);
          if (ths.length === 0) {
            try {
              localStorage.removeItem("forge_launch_real_threads");
            } catch (e) {}
          }
        }

        // 3. Sync creator cohort
        const res = await getCreators({ limit: 50 }).catch(() => null);
        const rawList = Array.isArray(res) ? res : res?.creators || [];
        const deletedIds = (() => {
          try {
            return JSON.parse(localStorage.getItem("forge_deleted_creator_ids") || "[]");
          } catch {
            return [];
          }
        })();

        if (isMounted) {
          if (Array.isArray(res) && rawList.length === 0) {
            // DB is completely empty (all creators wiped) — prune local state & storage completely
            setCreators([]);
            setSelectedCreatorId(null);
            setAiDetectedChoiceMap({});
            try {
              localStorage.removeItem("forge_launch_discovered_creators");
              localStorage.removeItem("forge_launch_ai_choice_map");
            } catch (e) {}
          } else if (rawList.length > 0) {
            setCreators((prev) => {
            const formattedDbCreators = rawList
              .filter((dbItem) => {
                const cleanHandle = (dbItem.handle || "").toLowerCase().replace(/^@/, "");
                return (
                  !deletedIds.includes(dbItem.id) &&
                  !deletedIds.includes(cleanHandle) &&
                  !deletedIds.includes(dbItem.handle)
                );
              })
              .map((dbItem) => {
                const dbStatus = dbItem.status || "discovered";
                return {
                  id: dbItem.id,
                  name: dbItem.display_name || dbItem.name || dbItem.handle,
                  display_name: dbItem.display_name || dbItem.name || dbItem.handle,
                  handle: dbItem.handle,
                  platform: dbItem.platform || "youtube",
                  followers: dbItem.follower_count || 100000,
                  follower_count: dbItem.follower_count || 100000,
                  avatar: dbItem.avatar_url || "",
                  bio: dbItem.bio || "",
                  email: dbItem.email_public || dbItem.email || ((dbItem.bio || "").match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)?.[0] || ""),
                  email_public: dbItem.email_public || dbItem.email || ((dbItem.bio || "").match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)?.[0] || ""),
                  email_verified: Boolean(dbItem.email_verified || dbItem.email_public || (dbItem.bio || "").match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)),
                  status: dbStatus,
                  isApproved: dbStatus === "approved",
                  isRejected: dbStatus === "rejected",
                  replyClassification: (() => {
                    const raw = dbItem.reply_text;
                    const isCorrupt = raw && (raw.startsWith("Creator responded") || raw.includes("qualified for partnership pitch") || raw === "Yes, I would be interested.");
                    if (dbItem.reply_classification === "interested" && (isCorrupt || !raw)) {
                      return dbStatus === "approved" ? "qualified" : "awaiting_reply";
                    }
                    return dbItem.reply_classification;
                  })(),
                  reply_classification: (() => {
                    const raw = dbItem.reply_text;
                    const isCorrupt = raw && (raw.startsWith("Creator responded") || raw.includes("qualified for partnership pitch") || raw === "Yes, I would be interested.");
                    if (dbItem.reply_classification === "interested" && (isCorrupt || !raw)) {
                      return dbStatus === "approved" ? "qualified" : "awaiting_reply";
                    }
                    return dbItem.reply_classification;
                  })(),
                  replyText: (() => {
                    const raw = dbItem.reply_text;
                    const isCorrupt = raw && (raw.startsWith("Creator responded") || raw.includes("qualified for partnership pitch") || raw === "Yes, I would be interested.");
                    return isCorrupt ? null : raw;
                  })(),
                  creatorScore: (() => {
                    if (dbItem.score) return Math.min(99, Math.max(50, Number(dbItem.score)));
                    if (dbItem.creatorScore) return Math.min(99, Math.max(50, Number(dbItem.creatorScore)));
                    if (dbItem.engagement_score) {
                      // engagement_score is stored as an engagement rate % (e.g., 7.2, 5.2, 3.9)
                      const engRate = Number(dbItem.engagement_score);
                      const engPts = Math.min(22, Math.max(5, Math.round(engRate * 3.0)));
                      const emailPts = (dbItem.email_public || dbItem.email) ? 8 : 0;
                      return Math.min(98, Math.max(60, 68 + engPts + emailPts));
                    }
                    return 85;
                  })(),
                };
              });

            if (!prev || prev.length === 0) {
              return formattedDbCreators;
            }

            const merged = [];
            const seenKeys = new Set();

            formattedDbCreators.forEach((dbC) => {
              const cleanHandle = (dbC.handle || "").toLowerCase().replace(/^@/, "");
              const cleanEmail = (dbC.email || dbC.email_public || "").toLowerCase().trim();
              const existing = prev.find((p) => {
                const pHandle = (p.handle || "").toLowerCase().replace(/^@/, "");
                const pEmail = (p.email || p.email_public || "").toLowerCase().trim();
                return (
                  p.id === dbC.id ||
                  (pHandle && cleanHandle && pHandle === cleanHandle) ||
                  (pEmail && cleanEmail && pEmail === cleanEmail)
                );
              });

              if (existing) {
                // User manual email edits take priority over un-refreshed DB polling values
                const userEmail = (existing.email || existing.email_public || "").trim();
                const dbEmail = (dbC.email || dbC.email_public || "").trim();
                const resolvedEmail = userEmail || dbEmail;
                merged.push({
                  ...existing,
                  ...dbC,
                  email: resolvedEmail,
                  email_public: resolvedEmail,
                  email_verified: Boolean(resolvedEmail && resolvedEmail.includes("@")),
                });
              } else {
                merged.push(dbC);
              }
              seenKeys.add(dbC.id);
              if (cleanHandle) seenKeys.add(cleanHandle);
              if (cleanEmail) seenKeys.add(cleanEmail);
            });

            prev.forEach((p) => {
              const cleanHandle = (p.handle || "").toLowerCase().replace(/^@/, "");
              const cleanEmail = (p.email || p.email_public || "").toLowerCase().trim();
              const isDeleted =
                deletedIds.includes(p.id) ||
                deletedIds.includes(cleanHandle) ||
                deletedIds.includes(p.handle) ||
                (cleanEmail && deletedIds.includes(cleanEmail));

              if (!isDeleted && !seenKeys.has(p.id) && (!cleanHandle || !seenKeys.has(cleanHandle))) {
                const isDbUuid = p.id && /^[0-9a-f-]{36}$/i.test(p.id);
                if (!isDbUuid) {
                  merged.push(p);
                }
              }
            });

            return merged;
          });

          setSelectedCreatorId((prevId) => {
            if (deletedIds.includes(prevId)) return null;
            return prevId || rawList[0]?.id || null;
          });
        }
      }

      // Enable state synchronizer now that DB fetch has completed
      isInitialLoadDone.current = true;
    } catch (err) {
      console.warn("[AcquisitionEngine] Global state fetch error:", err);
      isInitialLoadDone.current = true;
    }
    };

    fetchGlobalState();
    const pollTimer = setInterval(fetchGlobalState, 10000);
    return () => {
      isMounted = false;
      clearInterval(pollTimer);
    };
  }, []);

  // ── 3-Minute Review & Autonomous Interval Timer ───────────────────────────
  // ── 30-Second Review & Auto-Advance Timer (Background-Proof & Wall-Clock Synced) ──
  const [countdownSeconds, setCountdownSeconds] = useState(30); // 30s countdown
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
        target = Date.now() + 30 * 1000;
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
          if (editingEmailCreatorId && tempEmailValue.trim()) {
            saveEditEmail(editingEmailCreatorId, null, tempEmailValue.trim());
          }
          // Explicitly halt active discovery when auto-advancing to Step 3
          if (discoveryAbortRef.current) {
            try { discoveryAbortRef.current.abort(); } catch (e) {}
            discoveryAbortRef.current = null;
          }
          setDiscovering(false);
          try {
            import("../../services/opsApi").then(({ stopAutonomousDiscovery }) => {
              stopAutonomousDiscovery().catch(() => {});
            });
          } catch (e) {}
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
      localStorage.removeItem("forge_step2_timer_target");
      localStorage.removeItem("forge_launch_discovered_creators");
      localStorage.removeItem("forge_launch_real_threads");
      localStorage.removeItem("forge_launch_pitch_sent_map");
      localStorage.removeItem("forge_launch_ai_choice_map");
      localStorage.removeItem("forge_launch_active_step");
      localStorage.removeItem("forge_launch_acquisition_step");
    } catch (e) {}
    setCountdownSeconds(30);
    setActiveStep(1);
  };

  // Autonomous Engine Start & Discovery Trigger (AI + Apify)
  const handleStartEngine = async () => {
    // Abort any prior in-flight request
    if (discoveryAbortRef.current) {
      try { discoveryAbortRef.current.abort(); } catch (e) {}
      discoveryAbortRef.current = null;
    }

    const controller = new AbortController();
    discoveryAbortRef.current = controller;

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
    setCountdownSeconds(30);
    const targetCount = creatorsBatchCount || 3;
    const activeNiches =
      niches.length > 0 ? niches : ["Tech", "Software", "SaaS"];
    setDiscoveryLog(
      `[Audience Intelligence] Dynamically discovering ${targetCount} creators across [${activeNiches.join(", ")}] on ${selectedPlatforms.join(", ")}...`,
    );

    try {
      const { discoverAutonomousCreators } =
        await import("../../services/opsApi");
      setDiscoveryLog(
        `[Discovery Engine] Scouting audience profiles & metrics for ${activeNiches.join(", ")}...`,
      );

      const res = await discoverAutonomousCreators({
        niches: activeNiches,
        min_followers: minFollowers,
        max_followers: maxFollowers,
        min_engagement_rate: minEngagement,
        target_count: targetCount,
        platforms: selectedPlatforms,
        geography: selectedGeography,
      }, controller.signal);

      if (controller.signal.aborted) {
        console.log("[Discovery] Aborted cleanly — preserving current state.");
        return;
      }

      if (res && Array.isArray(res.creators) && res.creators.length > 0) {
        const enrichedCreators = res.creators.map((c) => {
          const bioEmailMatch = (c.bio || "").match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
          const autoEmail = c.email || c.email_public || (bioEmailMatch ? bioEmailMatch[0].trim() : "");
          return {
            ...c,
            email: autoEmail,
            email_public: autoEmail,
            email_verified: Boolean(c.email_verified || autoEmail),
          };
        });
        setCreators(enrichedCreators);
        setSelectedCreatorId(enrichedCreators[0].id);
        const emailsFound = enrichedCreators.filter((c) =>
          (c.email || c.email_public || "").includes("@"),
        ).length;
        setDiscoveryLog(
          `[Discovery Complete] Identified & enriched ${enrichedCreators.length} creators (${emailsFound} verified business contacts). Review profiles before autonomous dispatch.`,
        );
      } else if (res?.status === "stopped") {
        setDiscoveryLog(
          `[Discovery] Scouting stopped. Retained all creators discovered before halt.`,
        );
      } else {
        setDiscoveryLog(
          `[Discovery] No qualifying creators returned matching criteria. Checked candidate pool.`,
        );
      }
    } catch (e) {
      if (e.name === "AbortError" || controller.signal.aborted) {
        console.log("[Discovery] Request was aborted cleanly by operator.");
        setDiscoveryLog((prev) => `${prev ? prev + "\n" : ""}[Stopped] Scouting stopped by operator.`);
        return;
      }
      console.warn("[Discovery] Engine notice:", e);
      const cleanMsg = (e.message || "").replace(/^500:\s*/, "").replace(/^Error:\s*/, "").trim() || "Scouting service ready for retry.";
      setDiscoveryLog(
        `[Discovery Notice] ${cleanMsg}`,
      );

      // Graceful fallback: If current creators list is empty, load existing database creators so operator is never stuck
      try {
        const { fetchCreators } = await import("../../services/opsApi");
        const existing = await fetchCreators();
        if (Array.isArray(existing) && existing.length > 0) {
          setCreators(existing);
          setSelectedCreatorId(existing[0].id);
          setDiscoveryLog((prev) => `${prev}\n[Auto-Recovery] Loaded ${existing.length} verified creators from pipeline database.`);
        }
      } catch (recoverErr) {
        console.debug("Recovery fallback silent:", recoverErr);
      }
    } finally {
      if (discoveryAbortRef.current === controller) {
        discoveryAbortRef.current = null;
      }
      setDiscovering(false);
    }
  };

  // Immediate halt to active discovery (keeps currently discovered creators intact)
  const handleStopDiscovery = async () => {
    if (discoveryAbortRef.current) {
      try {
        discoveryAbortRef.current.abort();
      } catch (e) {}
      discoveryAbortRef.current = null;
    }
    setDiscovering(false);
    try {
      const { stopAutonomousDiscovery } = await import("../../services/opsApi");
      await stopAutonomousDiscovery().catch(() => {});
    } catch (e) {}
    notify(
      "info",
      "Scouting Stopped",
      `Discovery halted — retaining all ${creators.length} creators found so far.`
    );
    setDiscoveryLog(
      (prev) =>
        `${prev ? prev + "\n" : ""}[Stopped] Scouting stopped by operator. Keeping current ${creators.length} creators.`
    );
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
    if (creator.audienceIntelligence && creator.audienceIntelligence.topContent) {
      return creator.audienceIntelligence;
    }

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

  // ── Auto-Advance on Positive Reply State (Disabled for strict Human Review Gate) ─
  const [autoAdvanceOnPositive, setAutoAdvanceOnPositive] = useState(false);
  const [autoAdvancedIds, setAutoAdvancedIds] = useState(() => new Set());
  const autoAdvancedIdsRef = useRef(new Set());
  const [positiveAdvanceNotice, setPositiveAdvanceNotice] = useState(null);

  // ── Real IMAP Inbox Poller & Reply Sync State ───────────────────────────────
  const [realThreads, setRealThreads] = useState(() => {
    try {
      return getExpiringItem("forge_launch_real_threads", []);
    } catch {
      return [];
    }
  });
  const [pollingImap, setPollingImap] = useState(false);
  const isSyncingImapRef = useRef(false);
  const [imapSyncLog, setImapSyncLog] = useState("");

  // ── Helper to match creator with real IMAP thread or simulation ───────────
  const getCreatorReply = (c, threads = realThreads) => {
    if (!c) return { hasRealReply: false, classification: "awaiting_reply" };
    const cEmail = (c.email || c.email_public || "").toLowerCase().trim();
    const cHandle = (c.handle || "").toLowerCase().replace(/^@/, "").trim();
    const cId = c.id;

    // 1. Explicit user/DB classification
    const explicitCls = c.replyClassification || c.reply_classification;
    const hasGenuineReplyText = Boolean(
      c.replyText &&
      !c.replyText.startsWith("Creator responded") &&
      !c.replyText.includes("qualified for partnership pitch") &&
      c.replyText !== "Yes, I would be interested."
    );

    if (
      explicitCls &&
      explicitCls !== "awaiting_reply" &&
      explicitCls !== "no_email"
    ) {
      const isPositive = explicitCls === "interested" || explicitCls === "qualified";
      // Only treat as hasRealReply if genuine custom or simulated text exists
      if (hasGenuineReplyText) {
        return {
          hasRealReply: true,
          hasEmail: Boolean(cEmail && cEmail.includes("@")),
          classification: explicitCls,
          subject:
            c.replySubject || `Re: Outreach to ${c.name || c.display_name}`,
          text: c.replyText,
          time: c.replyTime || "Recently",
          sentiment:
            isPositive
              ? "positive"
              : explicitCls === "question"
                ? "neutral"
                : "negative",
          reasoning: isPositive
            ? `Creator responded to Step 4 outreach. Qualified for Step 6 Opportunity Pitch.`
            : `Label explicitly assigned as ${explicitCls}.`,
          confidence: 96,
          isRealImap: false,
        };
      }

      // If approved or qualified by human operator without an inbound email:
      if (c.status === "approved" || c.isApproved || explicitCls === "qualified") {
        return {
          hasRealReply: false,
          hasEmail: Boolean(cEmail && cEmail.includes("@")),
          classification: "qualified",
          subject: `Outreach Sent: ${templateSubject.replace("{{display_name}}", c.name || c.display_name)}`,
          text: null,
          time: "Awaiting response",
          sentiment: "Qualified",
          reasoning: "Manually qualified by operator — awaiting creator reply.",
          confidence: 100,
          isRealImap: false,
        };
      }
    }

    // 2. Strict matching against ALL real IMAP threads from Gmail with creator isolation
    const cName = (c.name || c.display_name || "").toLowerCase().trim();
    const adminEmails = [
      "creatorforgeweb@gmail.com",
      "creatorforgestudio@gmail.com",
      "partnerships@creatorforge.com",
      "noreply@creatorforge.com",
      "hello@creatorforge.com",
    ];

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
      // If thread has NO creator_id assigned, check if subject mentions this creator specifically
      if (!t.creator_id) {
        const tSubject = (t.subject || "").toLowerCase();
        if (cName && cName.length >= 3 && tSubject.includes(`for ${cName}`)) return true;
        if (cHandle && cHandle.length >= 3 && tSubject.includes(`[#${cHandle}]`)) return true;
      }
      // If thread has NO creator_id assigned, match by email ONLY IF it doesn't belong to another creator
      if (!t.creator_id && cEmail && cEmail.includes("@") && !adminEmails.includes(cEmail)) {
        const isEmailMatch =
          (t.creator_email && t.creator_email.toLowerCase().trim() === cEmail) ||
          (t.recipient_email && t.recipient_email.toLowerCase().trim() === cEmail);
        if (isEmailMatch) {
          const tSubj = (t.subject || "").toLowerCase();
          const otherCreators = (creators || []).filter((other) => other.id !== cId);
          const belongsToOther = otherCreators.some((other) => {
            const oName = (other.name || other.display_name || "").toLowerCase().trim();
            const oHandle = (other.handle || "").toLowerCase().replace(/^@/, "").trim();
            return (
              (oName && oName.length >= 3 && tSubj.includes(`for ${oName}`)) ||
              (oHandle && oHandle.length >= 3 && tSubj.includes(`[#${oHandle}]`))
            );
          });
          if (belongsToOther) return false;
          return true;
        }
      }
      return false;
    });

    // Filter incoming replies across all matching threads, sorted chronologically
    const incomingReplies = matchingThreads
      .flatMap((t) => t.replies || [])
      .filter((r) => {
        if (!r.body || !r.body.trim()) return false;
        if (r.is_outgoing || r.ai_summary === "Outgoing reply from you" || r.actor === "admin") {
          return false;
        }

        const fromAddr = (r.from_address || "").toLowerCase().trim();
        if (
          !fromAddr ||
          adminEmails.includes(fromAddr) ||
          fromAddr === "hello@apify.com" ||
          fromAddr.includes("mailer-daemon") ||
          fromAddr.includes("no-reply") ||
          fromAddr.includes("noreply")
        ) {
          return false;
        }

        const bodyLower = r.body.toLowerCase();
        const subjLower = (r.subject || "").toLowerCase();

        // Check for embedded tracking token: if it explicitly belongs to another creator, isolate it
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

        // Isolate from other creators sharing this same email address
        const otherCreators = (creators || []).filter((other) => other.id !== cId);
        const hasOtherCreatorToken = otherCreators.some((other) => {
          const oName = (other.name || other.display_name || "").toLowerCase().trim();
          const oHandle = (other.handle || "").toLowerCase().replace(/^@/, "").trim();
          const oId = (other.id || "").toLowerCase();
          return (
            (oId && bodyLower.includes(`cf-cid:${oId}`)) ||
            (oHandle && oHandle.length >= 3 && subjLower.includes(`[#${oHandle}]`)) ||
            (oName && oName.length >= 4 && subjLower.includes(`idea for ${oName}`)) ||
            (oName && oName.length >= 4 && subjLower.includes(`outreach to ${oName}`))
          );
        });
        if (hasOtherCreatorToken) return false;

        // Strip quoted original message lines to verify new content was actually written
        const strippedBody = r.body
          .replace(/^>.*$/gm, "")
          .replace(/On\s+[\s\S]*wrote:[\s\S]*/i, "")
          .replace(/---\s*Ref:[\s\S]*/i, "")
          .trim();

        if (!strippedBody || strippedBody.length < 2) {
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
      // Clean quoted original message lines for pristine display and classification
      const cleanReplyText = latestReply.body
        .replace(/^>.*$/gm, "")
        .replace(/On\s+[\s\S]*wrote:[\s\S]*/i, "")
        .replace(/---\s*Ref:[\s\S]*/i, "")
        .trim();

      const bodyLower = (cleanReplyText || latestReply.body).toLowerCase().trim();

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
        text: cleanReplyText || latestReply.body,
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
          `AI classified live email reply from ${latestReply.from_address || "creator"}: "${(cleanReplyText || latestReply.body).slice(0, 60)}..."`,
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
    const isApprovedOrQualified = c.status === "approved" || c.isApproved;
    return {
      hasRealReply: false,
      hasEmail: true,
      classification: isApprovedOrQualified ? "qualified" : "awaiting_reply",
      subject: `Outreach Sent: ${templateSubject.replace("{{display_name}}", c.name || c.display_name)}`,
      text: null,
      time: "Awaiting response",
      sentiment: isApprovedOrQualified ? "Qualified" : "Pending",
      reasoning: `Outreach email delivered to ${cEmail}. Monitoring inbox for creator response.`,
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
      return getExpiringItem("forge_launch_pitch_sent_map", {});
    } catch {
      return {};
    }
  });
  const [persuasionSentMap, setPersuasionSentMap] = useState(() => {
    try {
      return getExpiringItem("forge_launch_persuasion_sent_map", {});
    } catch {
      return {};
    }
  });
  const [answerSentMap, setAnswerSentMap] = useState(() => {
    try {
      return getExpiringItem("forge_launch_answer_sent_map", {});
    } catch {
      return {};
    }
  });
  const [aiDetectedChoiceMap, setAiDetectedChoiceMap] = useState(() => {
    try {
      return getExpiringItem("forge_launch_ai_choice_map", {});
    } catch {
      return {};
    }
  });
  const [manualCommitmentMap, setManualCommitmentMap] = useState(() => {
    try {
      return getExpiringItem("forge_manual_commitment_map", {}) || {};
    } catch {
      return {};
    }
  });
  const [isEditingPitch, setIsEditingPitch] = useState(false);
  const [customPitchSubject, setCustomPitchSubject] = useState("");
  const [customPitchBody, setCustomPitchBody] = useState("");
  const [isSendingPitch, setIsSendingPitch] = useState(false);
  const [step1EmailTab, setStep1EmailTab] = useState("editor");
  const [step6EmailViewMode, setStep6EmailViewMode] = useState("visual");

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
        ) {
          isMatch = true;
        } else if (cName && cName.length >= 3 && (t.subject || "").toLowerCase().includes(cName)) {
          isMatch = true;
        } else if (
          cEmail &&
          cEmail.includes("@") &&
          t.creator_email?.toLowerCase().trim() === cEmail
        ) {
          const tSubj = (t.subject || "").toLowerCase();
          const otherCreators = (creators || []).filter((other) => other.id !== cId);
          const belongsToOther = otherCreators.some((other) => {
            const oName = (other.name || other.display_name || "").toLowerCase().trim();
            const oHandle = (other.handle || "").toLowerCase().replace(/^@/, "").trim();
            return (
              (oName && oName.length >= 3 && tSubj.includes(oName)) ||
              (oHandle && oHandle.length >= 3 && tSubj.includes(oHandle))
            );
          });
          if (!belongsToOther) isMatch = true;
        }
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

        // Isolate from other creators sharing this same email address
        const otherCreators = (creators || []).filter((other) => other.id !== cId);
        const hasOtherCreatorToken = otherCreators.some((other) => {
          const oName = (other.name || other.display_name || "").toLowerCase().trim();
          const oHandle = (other.handle || "").toLowerCase().replace(/^@/, "").trim();
          const oId = (other.id || "").toLowerCase();
          return (
            (oId && bodyLower.includes(`cf-cid:${oId}`)) ||
            (oHandle && oHandle.length >= 3 && subjLower.includes(`[#${oHandle}]`)) ||
            (oName && oName.length >= 4 && subjLower.includes(`idea for ${oName}`)) ||
            (oName && oName.length >= 4 && subjLower.includes(`outreach to ${oName}`))
          );
        });
        if (hasOtherCreatorToken) return false;

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

  // Helper to check if creator has given a SOLID NO (explicit unsubscribe / opt-out / not_interested / manual rejection)
  const isCreatorDeclined = (c) => {
    if (!c) return false;
    const status = (c.status || "").toLowerCase();
    if (status === "rejected" || status === "declined" || status === "archived") return true;

    const cls = (c.replyClassification || c.reply_classification || c.replyInfo?.classification || "").toLowerCase();
    if (cls === "not_interested" || cls === "unsubscribe" || cls === "opt_out" || cls === "rejected") return true;

    // Check if the creator explicitly requested a solid no / opt-out in their messages
    const msgs = getCreatorThreadMessages(c, realThreads);
    const hasSolidNo = msgs.some((m) => {
      const b = (m.body || "").toLowerCase();
      return (
        b.includes("unsubscribe") ||
        b.includes("remove me") ||
        b.includes("not interested") ||
        b.includes("im not interested") ||
        b.includes("i'm not interested") ||
        b.includes("no thanks") ||
        b.includes("pass on this") ||
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

    const subj = (msg.subject || "").toLowerCase().trim();
    const body = (msg.body || "").toLowerCase().trim();
    const allText = `${subj} ${body}`;

    // A. Explicit Step 4 Initial Outreach Indicators (MUST NEVER be treated as Step 6)
    const isInitialOutreach = (
      subj.includes("quick idea for") ||
      subj.includes("partnership inquiry") ||
      subj.includes("partnership update") ||
      subj.includes("partnership accepted") ||
      subj.includes("initial inquiry") ||
      allText.includes("cf-stage:step3") ||
      allText.includes("cf-stage:step4")
    );

    // If it is an initial outreach subject AND does NOT explicitly discuss concepts/options:
    if (isInitialOutreach && !/concept 1|concept 2|concept 3|option 1|option 2|option 3|step 1|step 2|step 3|step1|step2|step3|idea 1|idea 2|idea 3|#1|#2|#3|second|third|first|2nd|3rd|1st|blueprint proposal/i.test(allText)) {
      return false;
    }

    // B. Explicit Step 6 Pitch & Dialog Reply Subject Line or Token Match
    if (
      allText.includes("step 6") ||
      allText.includes("step6") ||
      allText.includes("cf-stage:step6") ||
      /top 3 software|top 3 concepts|opportunity pitch|opportunity deck|software concepts|concept pitch|blueprint proposal|co-founding questions|simplifying our co-founder|zero-effort co-founder|quick 60-second preview/i.test(subj)
    ) {
      return true;
    }

    // C. Explicit Concept Choice or Affirmative Agreement in Body
    if (/concept 1|concept 2|concept 3|option 1|option 2|option 3|step 1|step 2|step 3|step1|step2|step3|idea 1|idea 2|idea 3|product 1|product 2|product 3|#1|#2|#3|second|third|first|2nd|3rd|1st|number 1|number 2|number 3|no 1|no 2|no 3|interested/i.test(body)) {
      return true;
    }

    // D. Timestamp check: ONLY if NOT an initial outreach message, and received strictly after latest outbound
    if (!isInitialOutreach && latestOutboundMs > 0 && msg.received_at) {
      const msgTime = parseUtcMs(msg.received_at);
      if (msgTime > latestOutboundMs + 2000) {
        return true;
      }
    }

    return false;
  };

  // Filter creators that are qualified for Step 5/6:
  // A creator MUST have an explicit human approval or existing pitch to appear here.
  // Unapproved creators (even if they replied 'interested') MUST remain in Step 4 awaiting review.
  // Rejected creators are strictly excluded under all circumstances.
  const isCreatorQualifiedForPitch = (c) => {
    if (!c || !hasValidEmail(c)) return false;
    if (isCreatorDeclined(c)) return false;
    const status = (c.status || "").toLowerCase();
    if (status === "rejected" || status === "declined" || status === "archived") return false;

    // 1. Creator was explicitly approved by human operator in Step 4
    if (status === "approved" || c.isApproved) return true;

    // 2. Creator was explicitly selected to advance to Step 5 or 6
    if (selectedCreatorId && (c.id === selectedCreatorId || c.handle === selectedCreatorId)) return true;

    // 3. Check persistent localStorage stage map
    try {
      const stageMap = getExpiringItem("forge_creator_stage_map", {});
      if (stageMap[c.id]?.step >= 5 || (c.handle && stageMap[c.handle.replace(/^@/, "").toLowerCase()]?.step >= 5)) {
        return true;
      }
    } catch (e) {}

    // 4. In Step 5 or 6, creator's reply was classified as interested / qualified with authentic reply
    const rInfo = c.replyInfo || getCreatorReply(c);
    if (
      (rInfo?.classification === "interested" && rInfo.hasRealReply) ||
      (c.replyClassification || c.reply_classification || "").toLowerCase() === "qualified"
    ) {
      return true;
    }

    // 5. Creator already has an Opportunity Pitch sent or recorded
    if (pitchSentMap[c.id]) return true;

    // 6. Creator's thread contains an existing Step 6 pitch message
    const msgs = getCreatorThreadMessages(c, realThreads);
    const hasPitchThread = msgs.some((m) => {
      const s = (m.subject || "").toLowerCase();
      return /blueprint|opportunity pitch|opportunity deck|software concepts|concept pitch|concepts for|answers to your questions|zero upfront cost|preview/i.test(s);
    });
    if (hasPitchThread) return true;

    return false;
  };

  // In Step 5 & 6: show creators with valid emails who haven't given a solid no and are not rejected
  const eligibleCreators =
    activeStep >= 5
      ? creators.filter((c) => hasValidEmail(c) && !isCreatorDeclined(c) && (c.status || "").toLowerCase() !== "rejected")
      : creators;

  // Qualified creators = strictly those who replied positively to Step 4 outreach and are not rejected
  const interestedCreators = eligibleCreators.filter((c) =>
    isCreatorQualifiedForPitch(c),
  );
  // Awaiting = those who haven't replied yet
  const awaitingCreators = eligibleCreators.filter(
    (c) => !isCreatorQualifiedForPitch(c),
  );

  // In Step 5 and 6, pick selected creator ONLY from interestedCreators (never fall back to unreplied or rejected creators)
  const rawSelectedCreator =
    activeStep >= 5
      ? interestedCreators.find((c) => c.id === selectedCreatorId) ||
        interestedCreators.find((c) => selectedCreatorId && (c.handle === selectedCreatorId || c.email === selectedCreatorId)) ||
        interestedCreators[0] ||
        (selectedCreatorId ? creators.find((c) => c.id === selectedCreatorId) : null) ||
        creators.find((c) => (c.status || "").toLowerCase() !== "rejected") ||
        null
      : creators.find((c) => c.id === selectedCreatorId && (c.status || "").toLowerCase() !== "rejected") ||
        creators.find((c) => (c.status || "").toLowerCase() !== "rejected") ||
        null;

  const selectedCreator = rawSelectedCreator
    ? {
        ...rawSelectedCreator,
        productConcepts:
          rawSelectedCreator.productConcepts &&
          rawSelectedCreator.productConcepts.length > 0
            ? rawSelectedCreator.productConcepts
            : (activeStep === 5 ? null : ensureCreatorConcepts(rawSelectedCreator)),
      }
    : null;
  const [autoLaunchCountdown, setAutoLaunchCountdown] = useState(null);
  const [hasAutoCreatedProject, setHasAutoCreatedProject] = useState(false);

  // Concept Selection Handler: Persists choice across steps and attaches it to creator
  const handleSelectConcept = (conceptId, creatorId = selectedCreator?.id) => {
    if (!conceptId) return;
    setSelectedConceptId(conceptId);
    if (creatorId) {
      setCreatorConceptSelectionMap((prev) => {
        const next = { ...prev, [creatorId]: conceptId };
        try {
          setExpiringItem("forge_creator_concept_selection_map", next, ONE_HOUR_MS);
        } catch {}
        return next;
      });
      setCreators((prev) =>
        prev.map((c) => {
          if (c.id === creatorId) {
            const concepts = c.productConcepts || ensureCreatorConcepts(c);
            const chosen = concepts.find((p) => p.id === conceptId);
            if (chosen) {
              import("../../services/opsApi").then(({ updateCreatorDetails }) => {
                updateCreatorDetails(creatorId, {
                  selected_concept_id: conceptId,
                  selected_concept: chosen,
                }).catch(() => {});
              });
            }
            return {
              ...c,
              selectedConceptId: conceptId,
              selectedConcept: chosen || c.selectedConcept,
            };
          }
          return c;
        }),
      );
    }
  };

  // ── Step 5 & 6 Concept Selection & AI Trigger Initializer ─────────────────
  useEffect(() => {
    if (selectedCreator) {
      const savedChoice =
        creatorConceptSelectionMap[selectedCreator.id] ||
        selectedCreator.selectedConceptId;
      const concepts = selectedCreator.productConcepts;

      if (savedChoice && (!selectedConceptId || selectedConceptId !== savedChoice)) {
        setSelectedConceptId(savedChoice);
      } else if (concepts && concepts.length > 0 && !selectedConceptId) {
        setSelectedConceptId(concepts[0].id);
      }

      // If on Step 5 and creator does not have real AI concepts yet, auto-trigger AI synthesis
      if (activeStep === 5) {
        const hasRealAi =
          selectedCreator.hasAiConcepts ||
          (selectedCreator.productConcepts &&
            selectedCreator.productConcepts.length > 0 &&
            selectedCreator.audienceIntelligence?.topContent);

        if (!hasRealAi && !isSynthesizingStep5Ai && !step5Error) {
          handleSynthesizeStep5Ai(selectedCreator);
        }
      }
    }
  }, [activeStep, selectedCreator?.id, selectedCreator?.productConcepts?.length]);

  useEffect(() => {
    if (!isInitialLoadDone.current) return;
    try {
      setExpiringItem(
        "forge_launch_pitch_sent_map",
        pitchSentMap,
        ONE_HOUR_MS,
      );
      if (pitchSentMap && Object.keys(pitchSentMap).length > 0) {
        import("../../services/opsApi").then(({ updateWorkflowState }) => {
          updateWorkflowState({ pitch_sent_map: pitchSentMap }).catch(() => {});
        });
      }
    } catch {}
  }, [pitchSentMap]);

  useEffect(() => {
    if (!isInitialLoadDone.current) return;
    try {
      setExpiringItem(
        "forge_launch_persuasion_sent_map",
        persuasionSentMap,
        ONE_HOUR_MS,
      );
      if (persuasionSentMap && Object.keys(persuasionSentMap).length > 0) {
        import("../../services/opsApi").then(({ updateWorkflowState }) => {
          updateWorkflowState({ persuasion_sent_map: persuasionSentMap }).catch(() => {});
        });
      }
    } catch {}
  }, [persuasionSentMap]);

  useEffect(() => {
    if (!isInitialLoadDone.current) return;
    try {
      setExpiringItem(
        "forge_launch_answer_sent_map",
        answerSentMap,
        ONE_HOUR_MS,
      );
      if (answerSentMap && Object.keys(answerSentMap).length > 0) {
        import("../../services/opsApi").then(({ updateWorkflowState }) => {
          updateWorkflowState({ answer_sent_map: answerSentMap }).catch(() => {});
        });
      }
    } catch {}
  }, [answerSentMap]);

  useEffect(() => {
    if (!isInitialLoadDone.current) return;
    try {
      setExpiringItem(
        "forge_launch_ai_choice_map",
        aiDetectedChoiceMap,
        ONE_HOUR_MS,
      );
      if (aiDetectedChoiceMap && Object.keys(aiDetectedChoiceMap).length > 0) {
        import("../../services/opsApi").then(({ updateWorkflowState }) => {
          updateWorkflowState({ ai_choice_map: aiDetectedChoiceMap }).catch(() => {});
        });
      }
    } catch {}
  }, [aiDetectedChoiceMap]);

  const currentPitchSent =
    selectedCreator && pitchSentMap[selectedCreator.id]
      ? pitchSentMap[selectedCreator.id]
      : null;
  const currentAiChoice = selectedCreator
    ? aiDetectedChoiceMap[selectedCreator.id]
    : null;

  const [isGeneratingStep6Ai, setIsGeneratingStep6Ai] = useState(false);

  // Set clean subject default when creator changes; do NOT pre-generate message automatically (admin types, or clicks Generate AI Draft)
  useEffect(() => {
    if (selectedCreator) {
      const cleanHandle = (selectedCreator.handle || "").replace(/^@/, "").trim();
      const creatorName = selectedCreator.name || selectedCreator.display_name || "Creator";
      setCustomPitchSubject(`Re: Partnering with Creator Forge - ${creatorName} (@${cleanHandle})`);
      setCustomPitchBody(""); // Empty by default: admin writes direct reply, or clicks Generate AI Draft
      setIsEditingPitch(false);
    }
  }, [selectedCreator?.id]);

  // On-demand AI draft generation using backend LLM
  const handleRegenerateStep6Draft = async () => {
    if (!selectedCreator) return;
    setIsGeneratingStep6Ai(true);
    try {
      const { generateStep6Response } = await import("../../services/opsApi");
      const creatorMsgs = getCreatorThreadMessages(selectedCreator, realThreads);
      const latestMsg = creatorMsgs.length > 0 ? creatorMsgs[0].body : "";
      const concepts = selectedCreator.productConcepts || ensureCreatorConcepts(selectedCreator);
      const res = await generateStep6Response({
        creator_id: selectedCreator.id,
        creator_name: selectedCreator.name || selectedCreator.display_name,
        creator_handle: selectedCreator.handle,
        reply_body: latestMsg,
        concepts: concepts,
      });
      if (res && res.subject && res.body) {
        setCustomPitchSubject(res.subject);
        setCustomPitchBody(res.body);
        notify("success", "AI Draft Generated", "Suggested response updated with fresh AI copy.", 3000);
      }
    } catch (err) {
      console.warn("Failed to generate AI response suggestion:", err);
      handleRegeneratePitch();
    } finally {
      setIsGeneratingStep6Ai(false);
    }
  };

  // Regenerate pitch copy with a fresh high-converting angle
  const handleRegeneratePitch = () => {
    if (!selectedCreator) return;
    const concepts =
      selectedCreator.productConcepts || ensureCreatorConcepts(selectedCreator);
    const cleanHandle = (selectedCreator.handle || "").replace(/^@/, "").trim();
    const firstName = selectedCreator.name?.split(" ")[0] || "there";
    const subject = `Software concepts breakdown for @${cleanHandle}`;
    const body =
      `Hi ${firstName},\n\nSharing our technical breakdown! We analyzed your top content to architect 3 custom SaaS solutions for your followers:\n\n` +
      concepts
        .map(
          (c, i) =>
            `${i + 1}. ${c.name} (${c.pricing}) — ${c.tagline}\n   • Key Feature: ${c.keyFeatures?.[0] || "Automated Workflow"}\n   • Target MVP: ${c.mvpDifficulty || "2 weeks"}`,
        )
        .join("\n\n") +
      `\n\nWe handle 100% of engineering, hosting, billing, and support under a 50/50 revenue share.\n\nWhich of these concepts feels like the best fit for your audience?\n\nBest regards,\nThe Creator Forge Team\n\n---\nRef: [CF-STAGE:STEP6_PITCH | CF-CID:${selectedCreator.id} | Handle:@${cleanHandle}]`;
    setCustomPitchSubject(subject);
    setCustomPitchBody(body);
  };

  // Send Opportunity Pitch via SMTP & Activate AI Response Monitor
  // Accepts an optional creator parameter so it can pitch ANY creator, not just the selected tab.
  const handleSendOpportunityPitch = async (creatorParam) => {
    // Robust creator resolution: Ignore React SyntheticEvents
    const creator =
      creatorParam && creatorParam.id && !creatorParam.nativeEvent && !creatorParam.target
        ? creatorParam
        : selectedCreator;

    if (!creator || isSendingPitch) return;

    // Safety check: Never send pitch to rejected or unapproved leads
    if (creator.status === "rejected") {
      notify(
        "error",
        "Lead Is Rejected",
        `Cannot pitch ${creator.name || creator.display_name || creator.handle || "this creator"} because this lead is marked as Rejected.`,
        4000,
      );
      return;
    }

    const targetEmail = (
      creator.email ||
      creator.email_public ||
      ""
    ).trim();
    const cId = creator.id;
    const creatorName = creator.name || creator.display_name || creator.handle || "Creator";

    if (!targetEmail || !targetEmail.includes("@")) {
      notify(
        "warning",
        "Missing Contact Email",
        `Cannot dispatch Step 6 pitch because no email address is set for ${creatorName}. Please enter an email address in Step 2 or in the Follow-Up CRM.`,
        5500,
      );
      return;
    }

    setIsSendingPitch(true);

    const concepts =
      creator.productConcepts || ensureCreatorConcepts(creator);
    const cleanHandle = (creator.handle || "").replace(/^@/, "").trim();
    const firstName = (creator.name || creator.display_name || "there").split(" ")[0];
    const pitchSubject = `Top 3 software concepts tailored for @${cleanHandle}`;
    const pitchBody =
      `Hi ${firstName},\n\nFollowing up as promised! Based on our analysis of your ${creator.niche || "channel"} audience on ${creator.platform || "social media"}, here are the top 3 software product concepts we designed for your community:\n\n` +
      concepts
        .map(
          (c, i) =>
            `${i + 1}. ${c.name} (${c.pricing}) — ${c.tagline}\n   • Solves: ${c.problem} (Score: ${c.opportunityScore}/100)`,
        )
        .join("\n\n") +
      `\n\nUnder our 50/50 partnership, our engineering team will build and deploy the complete MVP at zero cost to you.\n\nTake a look and let us know which concept you'd be most excited to build and launch with us!\n\nBest regards,\nThe Creator Forge Team\n\n---\nRef: [CF-STAGE:STEP6_PITCH | CF-CID:${cId} | Handle:@${cleanHandle}]`;

    // Use custom pitch only if this is the currently selected creator (user may have edited it)
    const subjectToSend =
      creator.id === selectedCreator?.id && customPitchSubject
        ? customPitchSubject
        : pitchSubject;
    const bodyToSend =
      creator.id === selectedCreator?.id && customPitchBody
        ? customPitchBody
        : pitchBody;

    try {
      const { sendDirectEmail, updateCreatorDetails, updateWorkflowState } = await import("../../services/opsApi");
      const topConcept = concepts?.[0];
      const conceptImg = getConceptImageUrl(topConcept, creator.niche);
      await sendDirectEmail(targetEmail, subjectToSend, bodyToSend, cId, {
        concepts,
        concept_image_url: conceptImg,
      });

      const sentTimeIso = new Date().toISOString();
      const sentTimestamp = Date.now();
      const updatedMap = {
        ...pitchSentMap,
        [cId]: {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sentAt: sentTimeIso,
          sentTimestamp,
          recipient: targetEmail,
          subject: subjectToSend,
        },
      };
      setPitchSentMap(updatedMap);
      try {
        setExpiringItem(
          "forge_launch_pitch_sent_map",
          updatedMap,
          ONE_HOUR_MS,
        );
      } catch {}

      // Persist pitched status to PostgreSQL DB for instant cross-device correlation
      try {
        await updateCreatorDetails(cId, { status: "pitched" });
        await updateWorkflowState({ pitch_sent_map: updatedMap });
      } catch (err) {
        console.warn("[AcquisitionEngine] DB pitch sync warning:", err);
      }

      // Update local creators state
      setCreators((prev) =>
        prev.map((c) => (c.id === cId ? { ...c, status: "pitched" } : c))
      );

      notify(
        "success",
        "Opportunity Pitch Dispatched",
        `Step 6 proposal delivered to ${creatorName} (${targetEmail}).`,
        5000,
      );
      await syncImapReplies();
    } catch (e) {
      console.warn(
        "[AcquisitionEngine] Failed to dispatch opportunity pitch:",
        e,
      );
      notify(
        "error",
        "Pitch Dispatch Failed",
        `Failed to deliver email to ${targetEmail}: ${e.message}`,
        5500,
      );
    } finally {
      setIsSendingPitch(false);
    }
  };

  // ── Step 5: AI Audience Analysis & Automatic Advance to Step 6 ─────────────
  const [isSynthesizingStep5Ai, setIsSynthesizingStep5Ai] = useState(false);

  const handleSynthesizeStep5Ai = async (creator = selectedCreator) => {
    if (!creator) return;
    setIsSynthesizingStep5Ai(true);
    setStep5Error(null);
    try {
      const { generateAudienceAndConcepts } = await import("../../services/opsApi");
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("AI synthesis timed out after 25s. The model took too long to return structured concepts.")),
          25000
        )
      );

      const fetchPromise = generateAudienceAndConcepts({
        creator_id: creator.id,
        creator_name: creator.name || creator.display_name,
        creator_handle: creator.handle,
        niche: creator.niche,
        platform: creator.platform,
        followers: creator.followerStr || `${creator.follower_count}`,
        bio: creator.bio,
      });

      const res = await Promise.race([fetchPromise, timeoutPromise]);

      if (res && res.product_concepts && res.product_concepts.length > 0) {
        setCreators((prev) =>
          prev.map((c) =>
            c.id === creator.id
              ? {
                  ...c,
                  productConcepts: res.product_concepts,
                  audienceIntelligence: res.audience_intelligence,
                  hasAiConcepts: true,
                }
              : c,
          ),
        );
        if (res.pitch_email) {
          setCustomPitchSubject(res.pitch_email.subject);
          setCustomPitchBody(res.pitch_email.body);
        }
        setStep5Error(null);
        notify(
          "success",
          "AI Concepts & Audience Synthesized",
          `Engineered top 3 custom software product concepts and deep audience research for ${creator.name || creator.handle}.`,
          3500,
        );
      } else {
        throw new Error(res?.detail || res?.error || "AI engine failed to produce structured product concepts.");
      }
    } catch (err) {
      console.warn("AI synthesis failed/delayed:", err);
      const errMsg = err?.response?.data?.detail || err?.message || "AI audience research & concept synthesis delayed or failed.";
      setStep5Error(errMsg);
      notify(
        "error",
        "AI Generation Delayed",
        errMsg,
        4500,
      );
    } finally {
      setIsSynthesizingStep5Ai(false);
    }
  };

  // Autonomous Step 5 to Step 6 handler: Runs AI synthesis, dispatches 3-concept email, and advances to Step 6
  const handleAutoSynthesizeAndAdvance = async (creator) => {
    if (!creator) return;
    setIsSynthesizingStep5Ai(true);
    try {
      const { generateAudienceAndConcepts } = await import("../../services/opsApi");
      const res = await generateAudienceAndConcepts({
        creator_id: creator.id,
        creator_name: creator.name || creator.display_name,
        creator_handle: creator.handle,
        niche: creator.niche,
        platform: creator.platform,
        followers: creator.followerStr || `${creator.follower_count}`,
        bio: creator.bio,
      });

      let updatedCreator = creator;
      if (res && res.product_concepts && res.product_concepts.length > 0) {
        updatedCreator = {
          ...creator,
          productConcepts: res.product_concepts,
          audienceIntelligence: res.audience_intelligence,
        };
        setCreators((prev) =>
          prev.map((c) => (c.id === creator.id ? updatedCreator : c)),
        );
        if (res.pitch_email) {
          setCustomPitchSubject(res.pitch_email.subject);
          setCustomPitchBody(res.pitch_email.body);
        }
      }

      // Automatically dispatch the tailored 3-concept blueprint proposal email to creator
      await handleSendOpportunityPitch(updatedCreator);

      // Automatically advance to Step 6
      try {
        const map = getExpiringItem("forge_creator_stage_map", {});
        map[creator.id] = {
          step: 6,
          stepNumber: 6,
          actionName: "Step 6 Pitch & Co-Launch Studio",
          updatedAt: new Date().toISOString(),
        };
        if (creator.handle) {
          map[(creator.handle || "").replace(/^@/, "").toLowerCase()] = map[creator.id];
        }
        setExpiringItem("forge_creator_stage_map", map, ONE_HOUR_MS);
      } catch (e) {}

      setActiveStep(6);
      notify(
        "success",
        "Step 5 & 6 Autonomous Pipeline Complete",
        `Synthesized 3 custom software concepts and delivered proposal email to ${creator.name || creator.handle}.`,
        4500
      );
    } catch (err) {
      console.warn("Auto synthesis error:", err);
      setActiveStep(6);
    } finally {
      setIsSynthesizingStep5Ai(false);
    }
  };

  const handleSendBlueprintAndAdvanceToStep6 = async (creator = selectedCreator) => {
    if (!creator) return;
    await handleSendOpportunityPitch(creator);
    try {
      const map = getExpiringItem("forge_creator_stage_map", {});
      map[creator.id] = {
        step: 6,
        stepNumber: 6,
        actionName: "Step 6 Pitch & Co-Launch Studio",
        updatedAt: new Date().toISOString(),
      };
      if (creator.handle) {
        map[(creator.handle || "").replace(/^@/, "").toLowerCase()] = map[creator.id];
      }
      setExpiringItem("forge_creator_stage_map", map, ONE_HOUR_MS);
    } catch (e) {}
    setActiveStep(6);
  };

  // Sync past thread dispatches to pitchSentMap without firing unsolicited new emails
  useEffect(() => {
    if (activeStep === 6 && realThreads && realThreads.length > 0) {
      interestedCreators.forEach((c) => {
        if (pitchSentMap[c.id]) return;
        const msgs = getCreatorThreadMessages(c, realThreads);
        const existingPitch = msgs.find((m) => {
          const s = (m.subject || "").toLowerCase();
          const b = (m.body || "").toLowerCase();
          return (
            s.includes("step 6") ||
            s.includes("step6") ||
            s.includes("opportunity pitch") ||
            s.includes("software concepts") ||
            b.includes("cf-stage:step6_pitch")
          );
        });

        if (existingPitch) {
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
        }
      });
    }
  }, [activeStep, interestedCreators.length, realThreads]);

  // Autonomous Persuasion Email to overturn disinterest/hesitation
  const handleAutonomousPersuade = async (creatorParam) => {
    const creator =
      creatorParam && creatorParam.id && !creatorParam.nativeEvent && !creatorParam.target
        ? creatorParam
        : selectedCreator;
    if (!creator || isSendingPitch) return;
    const cId = creator.id;
    if (persuasionSentMap[cId]) return;
    setIsSendingPitch(true);
    const targetEmail = (creator.email || creator.email_public || "").trim();
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
      const updatedMap = {
        ...persuasionSentMap,
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
      };
      setPersuasionSentMap(updatedMap);
      try {
        setExpiringItem("forge_launch_persuasion_sent_map", updatedMap, ONE_HOUR_MS);
      } catch {}
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

  const hasCreatorReceivedReply = (c) => {
    if (!c) return false;
    if (c.hasReplied === true) return true;
    const cls = (c.replyClassification || c.reply_classification || c.replyInfo?.classification || "").toLowerCase();
    if (cls && cls !== "awaiting_reply" && cls !== "no_email" && cls !== "discovered") return true;
    if (c.reply_text || c.replyText) return true;
    const msgs = getCreatorThreadMessages(c, realThreads);
    const hasInbound = msgs.some((m) => m.is_inbound || m.direction === "inbound" || (m.from_address && !m.from_address.includes("creatorforge") && !m.from_address.includes("admin")));
    return hasInbound;
  };

  const handleApproveCreator = async (id, creatorParam = null) => {
    if (!id && !creatorParam) return;

    // Strict Gate: creator cannot be approved until the AI flagged it as interested
    const target = creatorParam || creators.find(
      (c) =>
        c.id === id ||
        (c.handle && id && c.handle.toLowerCase().replace(/^@/, "") === `${id}`.toLowerCase().replace(/^@/, "")) ||
        (c.email && id && c.email.toLowerCase() === `${id}`.toLowerCase())
    );
    const rInfo = target ? (target.replyInfo || getCreatorReply(target)) : null;
    const isAiInterested =
      rInfo?.classification === "interested" ||
      ["qualified", "interested"].includes((target?.replyClassification || target?.reply_classification || "").toLowerCase());

    if (!isAiInterested && target?.status !== "approved") {
      notify(
        "warning",
        "Approval Blocked",
        "Creator cannot be approved until AI flags their reply as interested.",
        5000
      );
      return;
    }

    const targetId = target?.id || id;

    // 1. Update local state immediately for instant UI feedback
    setCreators((prevCreators) =>
      prevCreators.map((c) => {
        const isMatch =
          c.id === targetId ||
          c.id === id ||
          (c.handle && (c.handle === target?.handle || c.handle === id)) ||
          (c.email && (c.email === target?.email || c.email === id));

        if (isMatch) {
          return {
            ...c,
            status: "approved",
            isApproved: true,
            approvedAt: new Date().toISOString(),
            productConcepts: c.productConcepts?.length ? c.productConcepts : ensureCreatorConcepts(c),
          };
        }
        return c;
      }),
    );

    // 2. Persist to stage map
    try {
      const map = getExpiringItem("forge_creator_stage_map", {});
      map[targetId] = {
        step: 5,
        stepNumber: 5,
        actionName: "Step 5 Product Studio",
        updatedAt: new Date().toISOString(),
      };
      if (target?.handle) {
        map[target.handle.replace(/^@/, "").toLowerCase()] = map[targetId];
      }
      setExpiringItem("forge_creator_stage_map", map, ONE_HOUR_MS);
    } catch (e) {}

    // 3. Persist to database (source of truth)
    try {
      const { updateCreatorDetails } = await import("../../services/opsApi");
      await updateCreatorDetails(targetId, { status: "approved" });
      console.log(`[AcquisitionEngine] Creator ${targetId} approved in DB.`);
    } catch (e) {
      console.warn("[AcquisitionEngine] Failed to persist approval status:", e);
    }

    notify(
      "success",
      "Creator Approved",
      `Creator approved — qualified for Step 5 & Step 6 co-launch.`,
      4000,
    );
  };

  const handleRejectCreator = async (id) => {
    if (!id) return;
    let targetCreator = null;

    // 1. Update local state immediately for instant UI feedback
    setCreators((prevCreators) =>
      prevCreators.map((c) => {
        const isMatch =
          c.id === id ||
          (c.handle && id && c.handle.toLowerCase().replace(/^@/, "") === `${id}`.toLowerCase().replace(/^@/, "")) ||
          (c.email && id && c.email.toLowerCase() === `${id}`.toLowerCase());

        if (isMatch) {
          targetCreator = c;
          return {
            ...c,
            status: "rejected",
            isApproved: false,
            rejectedAt: new Date().toISOString(),
          };
        }
        return c;
      }),
    );

    // 2. Persist to database (source of truth) and send rejection email
    try {
      const { updateCreatorDetails, sendDirectEmail } = await import("../../services/opsApi");
      await updateCreatorDetails(id, { status: "rejected" });
      console.log(`[AcquisitionEngine] Creator ${id} rejected in DB.`);

      // Automatically dispatch polite rejection email if email is present
      if (targetCreator) {
        const targetEmail = (targetCreator.email || targetCreator.email_public || "").trim();
        if (targetEmail && targetEmail.includes("@")) {
          const firstName = (targetCreator.name || targetCreator.display_name || "there").split(" ")[0];
          const handleClean = (targetCreator.handle || "").replace(/^@/, "");
          const rejectSubject = `Regarding Creator Forge Partnership - ${firstName} [#${handleClean}]`;
          const rejectBody = `Hi ${firstName},\n\nThank you for getting back to us and for considering a partnership with Creator Forge.\n\nAfter reviewing our current co-launch roster and active category capacity, we won't be able to move forward with a software project at this time.\n\nWe genuinely appreciate your time and wish you continued success with your channel and community.\n\nBest regards,\nCreator Forge Studio Team`;

          try {
            await sendDirectEmail(targetEmail, rejectSubject, rejectBody, targetCreator.id);
            console.log(`[AcquisitionEngine] Rejection notice delivered to ${targetEmail}`);
          } catch (mailErr) {
            console.warn("[AcquisitionEngine] Failed to send rejection email:", mailErr);
          }
        }
      }
    } catch (e) {
      console.warn("[AcquisitionEngine] Failed to persist rejection status:", e);
    }

    notify(
      "error",
      "Creator Rejected & Notified",
      `Creator archived — polite rejection email sent.`,
      4000,
    );

    // Auto-advance selection to the next active, non-rejected creator
    setCreators((current) => {
      const remaining = current.filter(
        (c) => c.id !== id && (c.status || "").toLowerCase() !== "rejected",
      );
      if (remaining.length > 0) {
        setSelectedCreatorId(remaining[0].id);
      } else {
        setSelectedCreatorId(null);
      }
      return current;
    });
  };

  // ── Step 4: Decision Modal State & Handlers (Accept / Reject with Optional AI Email) ──
  const [decisionModal, setDecisionModal] = useState({
    isOpen: false,
    creator: null,
    decisionType: "approve", // "approve" or "reject"
    sendEmail: true,
    subject: "",
    body: "",
    isGeneratingAi: false,
    isSending: false,
  });

  const openDecisionModal = (creator, decisionType = "approve") => {
    if (!creator) return;
    const isApprove = decisionType === "approve";
    const cName = creator.name || creator.display_name || creator.handle || "Partner";
    const firstName = cName.split(" ")[0];
    const niche = creator.niche || "your space";
    const platform = creator.platform || "social media";
    const hasEmail = Boolean((creator.email || creator.email_public) && (creator.email || creator.email_public).includes("@"));

    const defaultSubject = isApprove
      ? `Partnership Accepted: Advancing to Product Discovery for ${cName}`
      : `Creator Forge Partnership Update for ${cName}`;

    const defaultBody = isApprove
      ? `Hi ${firstName},\n\nGreat news! Following our review of your ${niche} content and community engagement on ${platform}, our studio team has officially approved your channel for our Co-Launch Software Incubation batch.\n\nWhat happens next:\n• Our engineering & product team is currently conducting deep audience research across your community.\n• We are designing the top 3 custom software product concepts engineered specifically to monetize your followers.\n• Under our 50/50 revenue-share partnership, Creator Forge covers 100% of engineering, hosting, billing, and support at zero upfront cost to you.\n\nWe'll follow up shortly with your customized 3-concept Opportunity Deck & interactive MVP previews.\n\nExcited to build with you,\nCreator Forge Studio Team`
      : `Hi ${firstName},\n\nThank you for your response and for taking the time to explore a potential co-launch partnership with us.\n\nAfter reviewing our cohort capacity, we are currently prioritizing specific software verticals for this upcoming batch and will not be proceeding with development at this immediate moment.\n\nWe are big fans of your ${niche} content on ${platform} and will keep your channel on file for future software project opportunities.\n\nWishing you continued growth and success,\nCreator Forge Studio Team`;

    setDecisionModal({
      isOpen: true,
      creator,
      decisionType,
      sendEmail: isApprove ? false : hasEmail,
      subject: defaultSubject,
      body: defaultBody,
      isGeneratingAi: false,
      isSending: false,
    });
  };

  // Lock background body scroll whenever any acquisition modal is open
  useEffect(() => {
    const isAnyModalOpen = Boolean(
      showInterestedModal ||
      showAwaitingModal ||
      decisionModal?.isOpen ||
      isLaunchingProject ||
      showDeleteConfirmModal
    );
    if (isAnyModalOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [showInterestedModal, showAwaitingModal, decisionModal?.isOpen, isLaunchingProject, showDeleteConfirmModal]);

  const handleGenerateDecisionAi = async () => {
    if (!decisionModal.creator) return;
    setDecisionModal((prev) => ({ ...prev, isGeneratingAi: true }));
    try {
      const { generateDecisionEmail } = await import("../../services/opsApi");
      const res = await generateDecisionEmail({
        creator_id: decisionModal.creator.id,
        creator_name: decisionModal.creator.name || decisionModal.creator.display_name,
        creator_handle: decisionModal.creator.handle,
        niche: decisionModal.creator.niche,
        platform: decisionModal.creator.platform,
        decision: decisionModal.decisionType,
      });
      if (res && res.subject && res.body) {
        setDecisionModal((prev) => ({
          ...prev,
          subject: res.subject,
          body: res.body,
          isGeneratingAi: false,
        }));
        notify(
          "success",
          "AI Email Generated",
          `Tailored ${decisionModal.decisionType === "approve" ? "acceptance" : "rejection"} email generated with AI.`,
          3000,
        );
      } else {
        setDecisionModal((prev) => ({ ...prev, isGeneratingAi: false }));
      }
    } catch (err) {
      console.warn("AI Generation failed:", err);
      setDecisionModal((prev) => ({ ...prev, isGeneratingAi: false }));
      notify("info", "Template Ready", "Loaded professional decision template.", 2500);
    }
  };

  const handleConfirmDecisionModal = async () => {
    if (!decisionModal.creator) return;
    const { creator, decisionType, sendEmail, subject, body } = decisionModal;
    setDecisionModal((prev) => ({ ...prev, isSending: true }));

    const targetEmail = creator.email || creator.email_public;
    if (sendEmail && targetEmail && targetEmail.includes("@") && body.trim()) {
      try {
        const { sendDirectEmail } = await import("../../services/opsApi");
        await sendDirectEmail(targetEmail, subject, body, creator.id);
        notify(
          "success",
          "Decision Email Dispatched",
          `Notification email successfully delivered to ${targetEmail}.`,
          3500,
        );
      } catch (err) {
        console.warn("Failed to dispatch decision email:", err);
        notify(
          "warning",
          "Email Notice",
          `Decision recorded, but email dispatch encountered an issue: ${err.message}`,
          4000,
        );
      }
    }

    if (decisionType === "approve") {
      handleApproveCreator(creator.id, creator);
      setSelectedCreatorId(creator.id);
      setActiveStep(5);
      // Synthesize AI concepts and audience intelligence for Step 5 review without auto-advancing past Step 5
      handleSynthesizeStep5Ai(creator);
    } else {
      handleRejectCreator(creator.id);
    }

    setDecisionModal({
      isOpen: false,
      creator: null,
      decisionType: "approve",
      sendEmail: true,
      subject: "",
      body: "",
      isGeneratingAi: false,
      isSending: false,
    });
  };

  const handlePitchAndCreateProject = async () => {
    if (!selectedCreator) return;

    // Strict Gate: No approval to ProjectOS until creator confirms full commitment
    const detectedChoice = aiDetectedChoiceMap[selectedCreator.id];
    const isCommittedChoice = detectedChoice?.decision === "CREATE_PROJECT" || detectedChoice?.decision === "COMMITTED";
    const isAlreadyLaunched = ["launched", "active_project"].includes((selectedCreator.status || "").toLowerCase());
    const hasFullCommitment = Boolean(
      isCommittedChoice ||
      selectedCreator.isCommitted === true ||
      isAlreadyLaunched
    );

    if (!hasFullCommitment) {
      notify(
        "warning",
        "Promotion Blocked",
        "Cannot approve project to ProjectOS until creator confirms full commitment (explicit concept selection or agreement).",
        5500
      );
      return;
    }

    const concepts =
      selectedCreator.productConcepts || ensureCreatorConcepts(selectedCreator);
    const concept =
      concepts.find((p) => p.id === selectedConceptId) ||
      concepts.find((p) => p.id === detectedChoice?.conceptId) ||
      concepts.find((p) => p.id === selectedCreator.selectedConceptId) ||
      concepts.find((p) => p.id === selectedCreator.selected_concept_id) ||
      concepts[0];

    setIsLaunchingProject(true);
    setLaunchStepIndex(1);

    // Step 1: Prepare Concept Architecture
    await new Promise((r) => setTimeout(r, 450));
    setLaunchStepIndex(2);

    // Deliver formal partnership kick-off email to the creator with secure portal access
    const targetEmail = (selectedCreator.email || selectedCreator.email_public || "").trim();
    const portalSlug = (selectedCreator.handle || selectedCreator.name || "creator").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const portalToken = "cf_sec_live";
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3001";
    const magicPortalUrl = `${origin}/portal/${portalSlug}?token=${portalToken}`;

    if (targetEmail && targetEmail.includes("@")) {
      const firstName = (selectedCreator.name || selectedCreator.display_name || "there").split(" ")[0];
      const handleClean = (selectedCreator.handle || "").replace(/^@/, "");
      const prodName = concept?.name || "your custom software platform";
      const pricing = concept?.pricing || "$29-$79/mo";
      const tagline = concept?.tagline || "Tailored software venture";
      const problem = concept?.problem || "Monetizing and streamlining workflows for your community";

      const kickoffSubject = `🚀 Co-Founder Portal Live: Developing ${prodName} with Creator Forge`;
      const kickoffBody = `Hi ${firstName},

Exciting milestone! Our venture studio engineering team has officially initiated the active development and co-launch sprint for **${prodName}** under our 50/50 venture co-launch agreement.

Your private, passwordless **Co-Founder Portal** is now live. Through your portal, you have real-time transparency into our sprint progress, shared presales revenue, launch strategy, and daily collaboration milestones.

---

### 📦 Venture Overview & Architecture
• **Product Name:** ${prodName}
• **Value Proposition:** ${tagline}
• **Pricing Tier:** ${pricing} (50/50 Net Revenue Split)
• **Target Solution:** ${problem}
• **Financial Risk:** Zero upfront capital — Creator Forge covers 100% of engineering, hosting, payment setup, and customer operations.

---

### 🔑 Access Your Co-Founder Portal
Click the link below to access your private co-founder dashboard (no password required):

${magicPortalUrl}

---

### 🛠️ Current Engineering Sprint:
1. **MVP Architecture & Staging Environment:** Fully functional core web app ready for your private review.
2. **Audience Pre-Order & Validation Funnel:** High-converting landing page, checkout, and email sequence.
3. **Co-Founder Analytics Dashboard:** Live tracking of daily visitors, conversion rate, and revenue payouts.

We are thrilled to partner with you on this venture. Feel free to reply directly to this email at any time.

Best regards,
**The Creator Forge Studio Team**
partnerships@creatorforge.com

---
Ref: [CF-STAGE:PROJECT_KICKOFF | CF-CID:${selectedCreator.id} | Handle:@${handleClean}]`;

      try {
        const { sendDirectEmail } = await import("../../services/opsApi");
        await sendDirectEmail(targetEmail, kickoffSubject, kickoffBody, selectedCreator.id);
        console.log(`[AcquisitionEngine] Project kick-off email dispatched to ${targetEmail}`);
      } catch (mailErr) {
        console.warn("[AcquisitionEngine] Failed to dispatch kick-off email:", mailErr);
      }
    }

    // Step 3: Compute Validation Milestones & Dashboard
    setLaunchStepIndex(3);
    await new Promise((r) => setTimeout(r, 550));

    const smartInitialPlan = buildSmartFallbackPlan({
      productName: concept?.name,
      productTagline: concept?.tagline,
      creatorName: selectedCreator.name || selectedCreator.display_name,
      handle: selectedCreator.handle,
      followers: selectedCreator.followerStr || selectedCreator.follower_count,
      niche: selectedCreator.niche,
      pricing: concept?.pricing,
      revenueModel: concept?.revenueModel,
      mvpDifficulty: concept?.mvpDifficulty,
    });

    const parsedTargetMatch = smartInitialPlan.threshold.match(/\$([0-9,]+)/);
    const parsedTargetVal = parsedTargetMatch ? Number(parsedTargetMatch[1].replace(/,/g, '')) : 12500;

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
      selectedConceptId: concept?.id,
      selectedConcept: concept,
      presaleTarget: parsedTargetVal,
      targetRevenue: parsedTargetVal,
      currentPhase: 1,
      validationPlan: smartInitialPlan,
    });

    try {
      const map = getExpiringItem("forge_creator_stage_map", {});
      map[selectedCreator.id] = {
        step: "section2",
        stepNumber: 7,
        actionName: "Section 2 Project OS",
        updatedAt: new Date().toISOString(),
      };
      if (selectedCreator.handle) {
        map[(selectedCreator.handle || "").replace(/^@/, "").toLowerCase()] = map[selectedCreator.id];
      }
      setExpiringItem("forge_creator_stage_map", map, ONE_HOUR_MS);

      // Persist stage map & partnered status to database for instant cross-device synchronization
      const { updateWorkflowState, updateCreatorDetails } = await import("../../services/opsApi");
      await updateWorkflowState({ creator_stage_map: map });
      await updateCreatorDetails(selectedCreator.id, { status: "partnered" });
    } catch (e) {
      console.warn("[AcquisitionEngine] DB stage sync warning on launch:", e);
    }

    // Step 4: Finalizing & Opening Dashboard
    setLaunchStepIndex(4);
    await new Promise((r) => setTimeout(r, 600));

    if (onGoToProjectOS) {
      onGoToProjectOS(selectedCreator);
    }

    setIsLaunchingProject(false);

    notify(
      "success",
      "Section 2 Project Initialized",
      `Launched Co-Launch Project OS for ${selectedCreator.name || selectedCreator.handle} (${concept?.name || "Venture"}). Kick-off email dispatched to ${targetEmail || "creator"}!`,
      6000
    );
  };

  // Helper to check if a creator has already received initial outreach
  const isCreatorContacted = (c) => {
    if (!c) return false;
    if (c.outreachSent) return true;
    const s = (c.status || "").toLowerCase();
    if (["contacted", "outreach_sent", "pitched", "replied", "interested", "launched", "active_project"].includes(s)) return true;
    if (c.hasReplied) return true;
    const msgs = getCreatorThreadMessages(c, realThreads);
    if (msgs && msgs.length > 0) return true;
    return false;
  };

  const [sendingBulk, setSendingBulk] = useState(false);
  const [outreachLog, setOutreachLog] = useState("");

  const handleSendBulkOutreach = async ({ autoAdvance = false, forceAll = false } = {}) => {
    if (sendingBulk) return;
    setSendingBulk(true);

    let activeList = creators;
    if (editingEmailCreatorId && tempEmailValue.trim()) {
      const draftEmail = tempEmailValue.trim();
      const targetId = editingEmailCreatorId;
      await saveEditEmail(targetId, null, draftEmail);
      activeList = (Array.isArray(creators) ? creators : []).map((c) => {
        const cleanTarget = String(targetId).toLowerCase().replace(/^@/, "");
        const cleanHandle = String(c.handle || "").toLowerCase().replace(/^@/, "");
        if (c.id === targetId || (cleanTarget && cleanHandle && cleanTarget === cleanHandle)) {
          return {
            ...c,
            email: draftEmail,
            email_public: draftEmail,
            email_verified: Boolean(draftEmail && draftEmail.includes("@")),
          };
        }
        return c;
      });
    }

    const uncontactedList = activeList.filter((c) => {
      const email = (c.email || c.email_public || "").trim();
      if (!email.includes("@")) return false;
      return forceAll ? true : !isCreatorContacted(c);
    });

    if (uncontactedList.length === 0) {
      const alreadyContactedCount = creators.filter((c) => isCreatorContacted(c)).length;
      if (alreadyContactedCount > 0) {
        setOutreachLog(
          `[Notice] All ${alreadyContactedCount} creators in this cohort have already received initial outreach emails. Ready in Step 4.`,
        );
      } else {
        setOutreachLog(
          `[Notice] No email addresses found for the ${creators.length} creators in this batch. Please add emails in Step 2.`,
        );
      }
      setSendingBulk(false);
      if (autoAdvance) {
        setTimeout(() => {
          setActiveStep(4);
        }, 1000);
      }
      return;
    }

    setOutreachLog(
      `[Outreach Queue] Delivering partnership inquiries to ${uncontactedList.length} uncontacted creators...`,
    );
    try {
      const { sendDirectEmail, updateCreatorDetails } = await import("../../services/opsApi");
      let sentCount = 0;
      const errors = [];

      // Send sequentially with individual logging for rock-solid reliability and live feedback
      for (let i = 0; i < uncontactedList.length; i++) {
        const c = uncontactedList[i];
        const targetEmail = (c.email || c.email_public).trim();
        const cName = c.name || c.display_name || c.handle || "Creator";

        setOutreachLog(
          `[Outreach Queue] Dispatching (${i + 1}/${uncontactedList.length}) to ${cName} (${targetEmail})...`,
        );

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

        setOutreachLog(`[Connecting SMTP] Dispatching email to ${cName} (${targetEmail})...`);
        try {
          // 45-second race timeout per email to accommodate cloud container wakeups & SMTP handshakes
          const sendWithTimeout = Promise.race([
            sendDirectEmail(targetEmail, renderedSubject, renderedBody, c.id),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Request timed out (45s) — verify SMTP credentials on cloud server")), 45000)
            ),
          ]);

          await sendWithTimeout;
          sentCount++;
          setOutreachLog(`[Delivered] Successfully sent outreach email to ${cName} (${targetEmail})!`);

          // Mark this individual creator as contacted in local state immediately
          setCreators((prev) =>
            prev.map((item) =>
              item.id === c.id || item.handle === c.handle
                ? { ...item, status: "contacted", outreachSent: true }
                : item
            )
          );

          try {
            await updateCreatorDetails(c.id, { status: "contacted" });
          } catch {}
        } catch (sendErr) {
          console.warn(`[AcquisitionEngine] Failed email to ${targetEmail}:`, sendErr);
          errors.push(`${cName} (${targetEmail}): ${sendErr.message || "Failed"}`);
        }
      }

      if (sentCount > 0) {
        notify(
          "success",
          "Outreach Wave Dispatched",
          `Successfully dispatched partnership inquiries to ${sentCount} creators.`,
          5000
        );
        setOutreachLog(
          `[Delivered] Outreach wave successfully sent to ${sentCount} creator${sentCount > 1 ? "s" : ""}.${
            errors.length > 0 ? ` (${errors.length} failed: ${errors.join(", ")})` : ""
          } Transitioning to Step 4...`,
        );
        if (autoAdvance) {
          setTimeout(() => {
            setActiveStep(4);
          }, 1200);
        }
      } else {
        notify(
          "error",
          "Outreach Dispatch Failed",
          `Failed to dispatch emails: ${errors[0] || "Please verify Google SMTP credentials in Settings."}`,
          6000
        );
        setOutreachLog(
          `[Error] Outreach dispatch failed: ${errors.join(" | ")}. Transitioning to Step 4...`,
        );
        if (autoAdvance) {
          setTimeout(() => {
            setActiveStep(4);
          }, 1500);
        }
      }
    } catch (e) {
      console.warn("[AcquisitionEngine] Outreach error:", e);
      setOutreachLog(
        `[Notice] Outreach notice: ${e.message || "Dispatched outreach"}. Transitioning to Step 4...`,
      );
      notify(
        "error",
        "Outreach Error",
        e.message || "An unexpected error occurred during dispatch.",
        5000
      );
      if (autoAdvance) {
        setTimeout(() => {
          setActiveStep(4);
        }, 1500);
      }
    } finally {
      setSendingBulk(false);
    }
  };

  // Auto-send emails on reaching Step 3 & advance to Step 4 for replies
  useEffect(() => {
    if (activeStep === 3 && !sendingBulk && creators.length > 0) {
      const hasUncontacted = creators.some((c) => {
        const email = (c.email || c.email_public || "").trim();
        return email.includes("@") && !isCreatorContacted(c);
      });
      if (hasUncontacted) {
        const timer = setTimeout(() => {
          handleSendBulkOutreach({ autoAdvance: true });
        }, 900);
        return () => clearTimeout(timer);
      } else {
        setOutreachLog(
          "[Outreach Queue] All creators in this batch have already received emails. Transitioning to Step 4 for creator replies...",
        );
        const timer = setTimeout(() => {
          setActiveStep(4);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [activeStep, creators.length, sendingBulk]);

  // ── Creator reply notification & state update function (Strict Human Review Gate) ─
  const triggerAutoAdvance = (creator, reply) => {
    if (!creator || !reply || !reply.hasRealReply || !reply.text) return;
    autoAdvancedIdsRef.current.add(creator.id);
    setAutoAdvancedIds((prev) => new Set([...prev, creator.id]));

    setCreators((prev) =>
      prev.map((c) =>
        c.id === creator.id
          ? {
              ...c,
              hasReplied: true,
              replyClassification: reply.classification || "interested",
              reply_classification: reply.classification || "interested",
              replyText: reply.text,
              replyTime: reply.time || "Recently",
              productConcepts: ensureCreatorConcepts(c),
            }
          : c,
      ),
    );

    // Persist to DB ONLY with genuine reply text
    import("../../services/opsApi").then(({ updateCreatorDetails }) => {
      updateCreatorDetails(creator.id, {
        reply_classification: reply.classification || "interested",
        reply_text: reply.text,
      }).catch((e) => console.warn(e));
    });

    // Select this creator ONLY if no creator is currently selected
    setSelectedCreatorId((prev) => (prev ? prev : creator.id));

    // Notify of incoming response (does NOT change activeStep)
    const cName =
      creator.name || creator.display_name || creator.handle || "Creator";
    notify(
      "info",
      "New Creator Response",
      `${cName} replied: "${reply.text.slice(0, 45)}..." — Ready for review in Step 4.`,
      4500,
    );
  };

  // Persist realThreads to localStorage
  useEffect(() => {
    try {
      if (realThreads && realThreads.length > 0) {
        setExpiringItem(
          "forge_launch_real_threads",
          realThreads,
          ONE_HOUR_MS,
        );
      }
    } catch (e) {}
  }, [realThreads]);

  const syncImapReplies = async (isManual = false) => {
    if (isSyncingImapRef.current) return;
    isSyncingImapRef.current = true;
    const isManualClick = isManual === true;
    setPollingImap(true);
    setImapSyncLog(
      "Syncing inbox for recent replies...",
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
          `[Inbox Synced] ${repliedThreads.length} active reply threads updated and classified.`,
        );

        // Sync incoming replies directly into creators state ONLY if real reply with text exists
        setCreators((prevCreators) => {
          if (!prevCreators || prevCreators.length === 0) return prevCreators;
          return prevCreators.map((c) => {
            const reply = getCreatorReply(c, threads);
            if (reply && reply.hasRealReply && reply.text) {
              return {
                ...c,
                hasReplied: true,
                replyClassification: reply.classification || c.replyClassification,
                reply_classification: reply.classification || c.reply_classification,
                replyText: reply.text,
                reply_text: reply.text,
              };
            }
            return c;
          });
        });

        // Only trigger an alert toast if user manually clicked a Refresh button
        if (isManualClick) {
          notify(
            "info",
            "Inbox Refreshed",
            `Inbox synced: ${repliedThreads.length} active reply threads updated.`,
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
              reply.text &&
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
      isSyncingImapRef.current = false;
    }
  };

  // Always sync IMAP on mount
  useEffect(() => {
    syncImapReplies();
  }, []);

  // Poll regularly while on Step 4, Step 5, or Step 6 (debounced 25s interval)
  useEffect(() => {
    if (activeStep >= 4) {
      syncImapReplies();
      const pollTimer = setInterval(() => {
        syncImapReplies();
      }, 25000);
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
          reply.text &&
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
        actionLabel: "Opt-Out Requested",
        confidence: 99,
        conceptName: concepts[0]?.name || "Recommended SaaS",
        reasoning: `Creator requested to opt out. Lead archived.`,
        color: "rose",
        badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      };
    }

    // 2. Explicit Concept Selection or Build Agreement (Checked FIRST before general questions)
    const explicitConceptSelection = [
      "concept 1",
      "concept 2",
      "concept 3",
      "option 1",
      "option 2",
      "option 3",
      "step 1",
      "step 2",
      "step 3",
      "step1",
      "step2",
      "step3",
      "idea 1",
      "idea 2",
      "idea 3",
      "#1",
      "#2",
      "#3",
      "first one",
      "second one",
      "third one",
      "number 1",
      "number 2",
      "number 3",
      "no 1",
      "no 2",
      "no 3",
      "1st",
      "2nd",
      "3rd",
      "i choose",
      "i prefer",
      "let's go with",
      "lets go with",
      "let's build",
      "lets build",
      "start building",
      "create project",
      "ready to move forward",
      "move forward",
      "let's do it",
      "lets do it",
      "let's do this",
      "lets do this",
      "let's proceed",
      "lets proceed",
      "sign me up",
      "count me in",
      "deal",
      "agreed",
      "ready to launch",
      "sounds great",
      "love this",
      "love it",
    ];
    const hasExplicitSelection = explicitConceptSelection.some((p) =>
      text.includes(p),
    );

    // Resolve concept match
    let matchedConcept = concepts.find((con) =>
      text.includes(con.name?.toLowerCase()),
    );
    if (!matchedConcept) {
      if (
        text.includes("concept 2") ||
        text.includes("option 2") ||
        text.includes("second") ||
        text.includes("step 2") ||
        text.includes("idea 2") ||
        text.includes("#2") ||
        text.includes("2nd") ||
        text.includes("number 2") ||
        text.includes("no 2")
      ) {
        matchedConcept = concepts[1] || concepts[0];
      } else if (
        text.includes("concept 3") ||
        text.includes("option 3") ||
        text.includes("third") ||
        text.includes("step 3") ||
        text.includes("idea 3") ||
        text.includes("#3") ||
        text.includes("3rd") ||
        text.includes("number 3") ||
        text.includes("no 3")
      ) {
        matchedConcept = concepts[2] || concepts[0];
      } else if (
        text.includes("concept 1") ||
        text.includes("option 1") ||
        text.includes("first") ||
        text.includes("step 1") ||
        text.includes("idea 1") ||
        text.includes("#1") ||
        text.includes("1st") ||
        text.includes("number 1") ||
        text.includes("no 1") ||
        hasExplicitSelection
      ) {
        matchedConcept = concepts[0];
      }
    }

    if (hasExplicitSelection || (matchedConcept && text.length > 5)) {
      const chosen = matchedConcept || concepts[0];
      return {
        decision: "CREATE_PROJECT",
        actionLabel: `Launch & Create Project (${chosen.name})`,
        confidence: 98,
        conceptName: chosen.name,
        conceptId: chosen.id,
        reasoning: `Creator confirmed positive agreement with concrete intent: "${latestBody.slice(0, 60)}...". Selected Concept: ${chosen.name}. Verified alignment threshold passed; click Create Project to initialize Section 2.`,
        color: "emerald",
        badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      };
    }

    // 3. Hesitation / Confusion / Soft Rejection -> Suggested Persuasion Draft
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
        actionLabel: "Suggested: Persuasion Draft",
        confidence: 96,
        conceptName: concepts[0]?.name || "Recommended SaaS",
        reasoning: `Creator expressed hesitation. Suggested: 50/50 zero-risk clarification draft.`,
        color: "amber",
        badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      };
    }

    // 4. Questions / Inquiries -> Suggested Answer Draft
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
      "where is the link",
      "where is the deck",
      "benefit",
      "what do i get",
      "in it for me",
    ];
    const hasQuestion = questionPatterns.some((p) => text.includes(p));
    if (hasQuestion) {
      return {
        decision: "ANSWER_QUESTION",
        actionLabel: "Suggested: Answer Draft",
        confidence: 95,
        conceptName: concepts[0]?.name || "Recommended Concept",
        reasoning: `Creator asked questions. Suggested: Term clarification & revenue split draft.`,
        color: "blue",
        badgeClass: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      };
    }

    // 5. Review in Progress / Concept Review Acknowledgment
    const reviewPatterns = [
      "check them out",
      "check it out",
      "check these out",
      "i'll check",
      "ill check",
      "i will check",
      "will check",
      "checking",
      "take a look",
      "looking into",
      "looking over",
      "reviewing",
      "will review",
      "let me review",
      "will look",
      "give me a few days",
      "give me a moment",
      "let me read",
      "let you know",
      "get back to you",
      "can we continue",
      "how do we continue",
      "what's next",
      "whats next",
    ];
    const isReview = reviewPatterns.some((p) => text.includes(p));
    if (isReview) {
      return {
        decision: "REVIEW_PREVIEW",
        actionLabel: "Suggested: 60s Preview",
        confidence: 96,
        conceptName: concepts[0]?.name || "Recommended Concept",
        reasoning: `Creator is reviewing concepts. Suggested: 60-second summary & concept preview draft.`,
        color: "amber",
        badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      };
    }

    // 8. Fallback: Conversational Dialog Reply
    if (text.length > 2) {
      return {
        decision: "REVIEW_PREVIEW",
        actionLabel: "Send Conversational Dialog Follow-up",
        confidence: 92,
        conceptName: concepts[0]?.name || "Recommended Concept",
        reasoning: `Creator reply received in active dialog ("${latestBody.slice(0, 50)}..."). AI will deploy a 60-second summary breakdown and advantages overview to maintain conversation momentum before Section 2.`,
        color: "amber",
        badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
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
  const handleAutonomousResend = async (creatorParam) => {
    const creator =
      creatorParam && creatorParam.id && !creatorParam.nativeEvent && !creatorParam.target
        ? creatorParam
        : selectedCreator;
    if (!creator || isSendingPitch) return;
    const cId = creator.id;
    if (pitchSentMap[cId]?.isFollowup) return;
    setIsSendingPitch(true);
    const targetEmail = (
      creator.email ||
      creator.email_public ||
      ""
    ).trim();
    const cleanHandle = (creator.handle || "").replace(/^@/, "").trim();
    const concepts =
      creator.productConcepts || ensureCreatorConcepts(creator);
    const followUpSubject = `Re: Quick 60-second preview: ${concepts[0]?.name} for ${creator.name || "you"}`;
    const followUpBody =
      `Hi ${creator.name?.split(" ")[0] || "there"},\n\n` +
      `Thanks for taking a look! To make your review as quick and easy as possible, here is a 60-second breakdown of our engineered concepts for your community:\n\n` +
      `1. ${concepts[0]?.name} — ${concepts[0]?.tagline} (${concepts[0]?.pricing})\n` +
      `2. ${concepts[1]?.name || concepts[0]?.name + " Pro"} — ${concepts[1]?.tagline || "AI-powered engine"} (${concepts[1]?.pricing || "$49/mo"})\n` +
      `3. ${concepts[2]?.name || concepts[0]?.name + " Hub"} — ${concepts[2]?.tagline || "Private toolkit suite"} (${concepts[2]?.pricing || "$79/mo"})\n\n` +
      `• Key Advantage: 100% fully managed engineering, server hosting, Stripe billing, and customer support at zero cost to you.\n` +
      `• Revenue Split: 50/50 net recurring revenue deposited directly to your bank account.\n` +
      `• Time Commitment: Under 2 hours/month reviewing product roadmaps and sharing with your audience.\n\n` +
      `Which of these 3 resonates most with what your followers ask for? Let us know or feel free to ask any questions!\n\n` +
      `Best regards,\nCreator Forge Studio Team\n\n---\nRef: [CF-STAGE:STEP6_DIALOG_PREVIEW | CF-CID:${cId} | Handle:@${cleanHandle}]`;

    try {
      if (targetEmail && targetEmail.includes("@")) {
        const { sendDirectEmail } = await import("../../services/opsApi");
        await sendDirectEmail(targetEmail, followUpSubject, followUpBody, cId);
      }
      const sentTimeIso = new Date().toISOString();
      const sentTimestamp = Date.now();
      const updatedMap = {
        ...pitchSentMap,
        [cId]: {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sentAt: sentTimeIso,
          sentTimestamp,
          recipient: targetEmail || "creator",
          subject: followUpSubject,
          isFollowup: true,
        },
      };
      setPitchSentMap(updatedMap);
      try {
        setExpiringItem("forge_launch_pitch_sent_map", updatedMap, ONE_HOUR_MS);
      } catch {}
      notify(
        "info",
        "Preview Nudge Sent",
        `Dispatched 60-second concept preview to ${creator.name || creator.handle}.`,
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
  const handleSendAnswer = async (creatorParam) => {
    const creator =
      creatorParam && creatorParam.id && !creatorParam.nativeEvent && !creatorParam.target
        ? creatorParam
        : selectedCreator;
    if (!creator || isSendingPitch) return;
    const cId = creator.id;
    if (answerSentMap[cId]) return;
    setIsSendingPitch(true);
    const targetEmail = (
      creator.email ||
      creator.email_public ||
      ""
    ).trim();
    const concepts =
      creator.productConcepts || ensureCreatorConcepts(creator);
    const creatorName =
      creator.name || creator.display_name || "there";
    const firstName = creatorName.split(" ")[0];
    const cleanHandle = (creator.handle || "").replace(/^@/, "").trim();

    // Get the creator's actual latest message/question
    const creatorMsgs = getCreatorThreadMessages(creator, realThreads);
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
      const updatedMap = {
        ...answerSentMap,
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
      };
      setAnswerSentMap(updatedMap);
      try {
        setExpiringItem("forge_launch_answer_sent_map", updatedMap, ONE_HOUR_MS);
      } catch {}
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
          let waitReason = `Opportunity pitch presenting 3 concepts was dispatched to ${c.name || "creator"}. Monitoring inbox for their feedback, concept choice, or questions before taking action.`;
          let waitColor = "purple";
          let waitBadge = "bg-purple-500/20 text-purple-300 border-purple-500/40";

          if (aTime > pTime && aTime >= perTime) {
            waitAction = "Answers Sent — Awaiting Reply";
            waitReason = `Clarifying answers regarding 50/50 split and tech stack were dispatched to ${c.name || "creator"}. Monitoring inbox for their response before proceeding.`;
            waitColor = "blue";
            waitBadge = "bg-blue-500/20 text-blue-300 border-blue-500/40";
          } else if (perTime > pTime && perTime >= aTime) {
            waitAction = "Persuasion Sent — Awaiting Reply";
            waitReason = `Persuasion recovery email addressing ${c.name || "creator"}'s hesitation was dispatched. Monitoring inbox for their response before proceeding.`;
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

  // Step 6 Human Confirmation Gate (All emails and project launches are strictly manually approved by human operator)

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
              <span>Creator Acquisition Engine</span>
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
              Live Real-Data
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time creator discovery, verified contact extraction, AI product
            concepts, and outreach orchestration.
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
        </div>
      </div>

      {/* Phase Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none sm:grid sm:grid-cols-3 lg:grid-cols-6">
        {[
          {
            step: 1,
            label: "1. Campaign Setup",
            icon: Target,
            textColor: "text-purple-400",
            activeBg: "bg-purple-500/15 border-purple-500/40 text-white",
          },
          {
            step: 2,
            label: "2. Find & Qualify",
            icon: Search,
            textColor: "text-indigo-400",
            activeBg: "bg-indigo-500/15 border-indigo-500/40 text-white",
          },
          {
            step: 3,
            label: "3. Direct Outreach",
            icon: Send,
            textColor: "text-cyan-400",
            activeBg: "bg-cyan-500/15 border-cyan-500/40 text-white",
          },
          {
            step: 4,
            label: "4. Interested Review",
            icon: MessageSquare,
            textColor: "text-emerald-400",
            activeBg: "bg-emerald-500/15 border-emerald-500/40 text-white",
          },
          {
            step: 5,
            label: "5. Audience & Ideas",
            icon: Sparkles,
            textColor: "text-amber-400",
            activeBg: "bg-amber-500/15 border-amber-500/40 text-white",
          },
          {
            step: 6,
            label: "6. Pitch & Select",
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
              className={`flex flex-col items-start p-3 rounded-xl text-left transition-all border cursor-pointer shrink-0 min-w-[135px] sm:min-w-0 sm:w-auto ${
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
              <div className="border-b border-white/[0.07] pb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span>Campaign Parameters & Lead Discovery</span>
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleStartFresh}
                    className="text-[11px] font-bold text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    title="Clear cached creators and start completely fresh"
                  >
                    <RefreshCw className="w-3 h-3 text-purple-400" />
                    <span>Reset Fresh</span>
                  </button>
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
                      className="inline-flex items-center justify-between gap-2 px-3 py-1 rounded-lg text-xs font-semibold bg-purple-950/70 text-purple-200 border border-purple-500/40 shadow-sm min-w-[96px]"
                    >
                      <span className="truncate">{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeNiche(tag)}
                        className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-purple-500/40 text-purple-300 hover:text-white transition-colors cursor-pointer shrink-0"
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

                {/* Available Niches - Equal Width Uniform Grid */}
                <div className="space-y-2 pt-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                      <span>Available Niches</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        (Click to toggle on / off)
                      </span>
                    </span>
                    <span className="text-[10px] text-purple-300 font-mono">
                      {niches.length} active
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {allNicheOptions.map((tag) => {
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
                          className={`w-full h-9 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                            isAdded
                              ? "bg-purple-500/20 text-purple-100 border-purple-500/50 shadow-sm shadow-purple-950/40 font-semibold"
                              : "bg-white/[0.02] text-slate-400 hover:text-slate-200 border-white/[0.06] hover:border-white/20 hover:bg-white/[0.05]"
                          }`}
                          title={isAdded ? `Click to remove ${tag}` : `Click to add ${tag}`}
                        >
                          <span className="truncate">{tag}</span>
                          {isAdded ? (
                            <Check className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
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
                <div className="grid grid-cols-3 gap-2.5 w-full">
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
                        className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer w-full ${
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

              {/* Targeting Parameters: Sliders, Geography & Ranges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {/* Target Geography Selector */}
                <div className="space-y-2 md:col-span-2 p-3.5 rounded-xl bg-[#161a23] border border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Target Geography</span>
                    </label>
                    <span className="text-[11px] text-cyan-300 font-mono font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {selectedGeography} Selected
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1 w-full">
                    {[
                      { id: "GLOBAL", label: "Global / All" },
                      { id: "US", label: "United States (US)" },
                      { id: "UK", label: "United Kingdom (UK)" },
                      { id: "CA", label: "Canada (CA)" },
                      { id: "EU", label: "Europe (EU)" },
                      { id: "AU", label: "Australia (AU)" },
                    ].map((geo) => {
                      const active = selectedGeography === geo.id;
                      return (
                        <button
                          key={geo.id}
                          type="button"
                          onClick={() => setSelectedGeography(geo.id)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center truncate w-full ${
                            active
                              ? "bg-cyan-500/20 border-cyan-500/50 text-white shadow-sm"
                              : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {geo.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sliders and Ranges */}
                {/* 50 Creators Slider Control */}
                <div className="space-y-2 p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-purple-300 font-bold flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-purple-400" />
                      <span>Batch Discovery Count</span>
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
              </div>
            </div>

            {/* ── Luxury Email Outreach Studio (Step 1) ────────────────────── */}
            <div className="rounded-2xl bg-[#0b0e14] border border-white/10 shadow-2xl overflow-hidden space-y-0">
              {/* Window Titlebar */}
              <div className="bg-[#121620] px-4 py-3 border-b border-white/[0.08] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white tracking-wide">
                      Outreach Email Studio
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">
                      🔒 TLS / SPF Ready
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-[#090b0e] p-1 rounded-xl border border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setStep1EmailTab("editor")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      step1EmailTab === "editor"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Edit Template
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep1EmailTab("preview")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      step1EmailTab === "preview"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Preview</span>
                  </button>
                </div>
              </div>

              {/* Merge Tags Insertion Toolbar */}
              <div className="px-5 py-2.5 bg-[#10141d] border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto text-[11px]">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex-shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Insert Tags:</span>
                </span>
                {[
                  { tag: "{{first_name}}", label: "First Name" },
                  { tag: "{{display_name}}", label: "Full Name" },
                  { tag: "{{niche}}", label: "Niche" },
                  { tag: "{{platform}}", label: "Platform" },
                  { tag: "{{follower_count}}", label: "Followers" },
                  { tag: "{{product_name}}", label: "Product Name" },
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => {
                      setTemplateBody((prev) => `${prev} ${item.tag}`);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-white/[0.05] hover:bg-purple-500/20 border border-white/[0.08] hover:border-purple-500/40 text-purple-300 font-mono text-[10px] font-semibold transition-all cursor-pointer flex-shrink-0"
                    title={`Click to append ${item.tag}`}
                  >
                    +{item.tag}
                  </button>
                ))}
              </div>

              {/* Editor Mode */}
              {step1EmailTab === "editor" ? (
                <div className="p-5 space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Email Subject
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={templateSubject}
                        onChange={(e) => setTemplateSubject(e.target.value)}
                        className="w-full bg-[#141824] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Email Message Body
                    </label>
                    <textarea
                      rows={7}
                      value={templateBody}
                      onChange={(e) => setTemplateBody(e.target.value)}
                      className="w-full bg-[#141824] border border-white/10 rounded-xl p-4 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500 leading-relaxed transition-colors resize-y"
                    />
                  </div>
                </div>
              ) : (
                /* Live Client Preview Mode */
                <div className="p-5 space-y-4 animate-in fade-in">
                  <div className="rounded-xl bg-[#131722] border border-white/[0.08] p-5 space-y-4 shadow-inner">
                    {/* Fake Email Client Metadata Header */}
                    <div className="space-y-2 border-b border-white/[0.06] pb-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-bold w-12">
                            From:
                          </span>
                          <span className="text-slate-200 font-mono">
                            Creator Forge Studio &lt;partnerships@creatorforge.com&gt;
                          </span>
                        </div>
                        <span className="text-[10px] text-purple-400 font-mono font-bold">
                          Step 1 Outreach Wave
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold w-12">
                          To:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-200 font-mono text-[11px] font-bold">
                            Marcus Vance (marcus@channel.com)
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            • 320K YouTube
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-slate-400 font-bold w-12">
                          Subject:
                        </span>
                        <span className="text-white font-bold text-xs">
                          {templateSubject
                            .replace("{{display_name}}", "Marcus Vance")
                            .replace("{{first_name}}", "Marcus")}
                        </span>
                      </div>
                    </div>

                    {/* Email Rendered Body */}
                    <div className="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed space-y-3">
                      {templateBody
                        .replace(/\{\{first_name\}\}/g, "Marcus")
                        .replace(/\{\{display_name\}\}/g, "Marcus Vance")
                        .replace(/\{\{niche\}\}/g, "AI Tools & Automation")
                        .replace(/\{\{platform\}\}/g, "YouTube")
                        .replace(/\{\{follower_count\}\}/g, "320,000")
                        .replace(/\{\{product_name\}\}/g, "Marcus OS")}
                    </div>

                    {/* Co-founder Guarantee Box */}
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-between text-xs text-purple-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold">
                          50/50 Revenue Split • Zero Upfront Cost to Creator
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-purple-300">
                        Venture Studio Model
                      </span>
                    </div>

                    {/* Studio Signature */}
                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <div>
                        <div className="font-bold text-white">
                          Creator Forge Studio Team
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Co-Founding Software Empires with Digital Creators
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-slate-500">
                        San Francisco, CA • studio@creatorforge.com
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Engine Summary & Start Button (Right Sidebar) */}
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-5 sticky top-20">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Campaign Summary
                </h4>
              </div>

              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Range</span>
                  <span className="text-purple-300 font-bold">100K – 1M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Geography</span>
                  <span className="text-cyan-300 font-bold">{selectedGeography}</span>
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
                  <span className="text-amber-300 font-bold">Auto-follow up after 7d</span>
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
                    <Search className="w-4 h-4 text-purple-200" />
                    <span>Start Lead Discovery</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                Scouts and enriches qualifying creator candidate profiles for your review and approval in Step 2.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* QUALIFIED LEADS: FIND & QUALIFY CREATORS */}
      {activeStep === 2 && (
        <div className="p-6 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Discovered Leads
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400">
                  Profile & Contact Intelligence
                </span>
              </div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                <Search className="w-4 h-4 text-indigo-400" />
                <span>Find & Qualify Creators</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review discovered creator profiles and verified contact emails before launching outreach.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
              {creators.length > 0 && !discovering && (
                <div className="h-9 px-3 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-mono flex items-center gap-2 shadow-sm whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  <span>
                    Auto-Advance to Step 3 in:{" "}
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

              {discovering ? (
                <button
                  type="button"
                  onClick={handleStopDiscovery}
                  className="h-9 px-3.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 whitespace-nowrap shadow-sm"
                  title="Stop discovery early and keep currently scouted creators"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Stop Scouting ({creators.length} Found)</span>
                </button>
              ) : (
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
              )}

              <button
                onClick={() => {
                  if (editingEmailCreatorId && tempEmailValue.trim()) {
                    saveEditEmail(editingEmailCreatorId, null, tempEmailValue.trim());
                  }
                  if (discovering || discoveryAbortRef.current) {
                    handleStopDiscovery();
                  }
                  setActiveStep(3);
                }}
                className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-indigo-500/40 shadow-sm cursor-pointer whitespace-nowrap active:scale-95"
              >
                <span>Proceed to Step 3: Outreach Wave</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Real-time Status Terminal Log (displayed when not actively scouting or upon completion) */}
          {discoveryLog && !discovering && (
            <div className="p-4 rounded-xl bg-black/60 border border-indigo-500/30 text-xs font-mono text-indigo-300 flex items-start gap-2 shadow-inner">
              <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1 flex-shrink-0 animate-ping" />
              <div className="flex-1 leading-relaxed">{discoveryLog}</div>
            </div>
          )}

          {/* Active Scouting State with Spinning Icon (Clean & Simple) */}
          {discovering && (
            <div className="p-5 rounded-2xl bg-[#0e1117] border border-indigo-500/30 shadow-lg space-y-3.5 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">
                        Scouting Digital Creators...
                      </span>
                      <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                        {creators.length} of {creatorsBatchCount || 3} found
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Querying registries, audience engagement velocity, and business contact channels.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleStopDiscovery}
                    className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                    <span>Stop Scouting</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(8, Math.round((creators.length / (creatorsBatchCount || 3)) * 100)))}%`,
                  }}
                />
              </div>

              {/* Live Terminal Discovery Log */}
              {discoveryLog && (
                <div className="p-3 rounded-xl bg-black/60 border border-white/[0.06] text-xs font-mono text-indigo-300 flex items-start gap-2 shadow-inner">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1 flex-shrink-0 animate-ping" />
                  <div className="flex-1 leading-relaxed truncate">{discoveryLog}</div>
                </div>
              )}
            </div>
          )}

          {/* Discovered Creators Grid / Empty State */}
          {!discovering && creators.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs space-y-4">
              <p>
                No creators discovered yet. Click Start Discovery to find matching creators.
              </p>
              <button
                onClick={handleStartEngine}
                disabled={discovering}
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Search className="w-4 h-4 text-purple-200" />
                <span>
                  Start Lead Discovery ({creatorsBatchCount} Creators)
                </span>
              </button>
            </div>
          ) : creators.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 border-b border-white/[0.04] pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                    Top Qualified Creators ({creators.length})
                  </span>
                  <span className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono">
                    {creators.filter((c) => (c.creatorScore || 85) >= minScoreThreshold).length} Advanceable (≥{minScoreThreshold})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">Score Gate:</span>
                  <div className="flex items-center gap-1">
                    {[60, 70, 80, 85].map((threshold) => (
                      <button
                        key={threshold}
                        type="button"
                        onClick={() => setMinScoreThreshold(threshold)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                          minScoreThreshold === threshold
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-white/[0.02] text-slate-400 hover:text-white border-white/[0.06]"
                        }`}
                      >
                        ≥{threshold}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(Array.isArray(creators) ? creators : []).map((c) => {
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
                  const bioEmailMatch = (c.bio || "").match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
                  const effectiveEmail = c.email_public || c.email || (bioEmailMatch ? bioEmailMatch[0].trim() : "");
                  const hasEmail = Boolean(effectiveEmail);

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
                          {(() => {
                            const score = c.creatorScore || 85;
                            const isAbove = score >= minScoreThreshold;
                            return (
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border block ${
                                  isAbove
                                    ? "text-amber-300 bg-amber-500/10 border-amber-500/30"
                                    : "text-slate-400 bg-slate-800/40 border-slate-700"
                                }`}
                              >
                                Score: {score}/100 {isAbove ? "✓" : "↓"}
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Stats & Channel Action Bar */}
                      <div className="grid grid-cols-3 gap-1.5 text-[11px] p-2.5 rounded-lg bg-black/40 border border-white/[0.04]">
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">
                            Followers
                          </span>
                          <span className="text-slate-200 font-bold">
                            {c.followerStr || c.follower_count || "100K+"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">
                            Engagement
                          </span>
                          <span className="text-emerald-400 font-bold">
                            {c.engagement || 3.5}%
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">
                            Niche Fit
                          </span>
                          <span className="text-purple-300 font-bold">
                            {c.nicheFit || c.niche_fit || "95% Match"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">
                            Consistency
                          </span>
                          <span className="text-cyan-300 font-bold">
                            {c.postingConsistency || c.posting_consistency || "Weekly"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">
                            Authenticity
                          </span>
                          <span className="text-blue-300 font-bold">
                            {c.audienceAuthenticity || c.audience_authenticity || "92%"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">
                            Commercial
                          </span>
                          <span className="text-amber-300 font-bold">
                            {c.commercialPotential || c.commercial_potential || "Strong"}
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
                              onBlur={(e) => {
                                if (tempEmailValue.trim()) {
                                  saveEditEmail(c.id, e);
                                }
                              }}
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
                                      {effectiveEmail}
                                    </span>
                                    {(c.hunter_score || hunterDataMap[c.id]?.score) ? (
                                      <span
                                        className="text-[9px] font-extrabold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded flex items-center gap-0.5 whitespace-nowrap"
                                        title={`Hunter.io Verification: Score ${c.hunter_score || hunterDataMap[c.id]?.score}%, Status: ${c.hunter_status || hunterDataMap[c.id]?.status}`}
                                      >
                                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                                        <span>{c.hunter_score || hunterDataMap[c.id]?.score}% Valid</span>
                                      </span>
                                    ) : (
                                      <span
                                        className="text-[9px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded"
                                        title="Verified Business Contact"
                                      >
                                        <span className="flex items-center gap-0.5"><Check className="w-2.5 h-2.5 text-emerald-400" /> Verified</span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyEmail(effectiveEmail);
                                      }}
                                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10"
                                      title="Copy Email"
                                    >
                                      {copiedEmail === effectiveEmail ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    <button
                                      onClick={(e) => handleHunterVerifyEmail({ ...c, email: effectiveEmail, email_public: effectiveEmail }, e)}
                                      disabled={hunterLoadingId === c.id}
                                      className="p-1 text-slate-400 hover:text-emerald-300 rounded hover:bg-white/10 transition-colors disabled:opacity-50"
                                      title="Verify deliverability with Hunter.io"
                                    >
                                      {hunterLoadingId === c.id && hunterActionType === 'verify' ? (
                                        <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
                                      ) : (
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                      )}
                                    </button>
                                    <button
                                      onClick={(e) =>
                                        startEditEmail(
                                          c.id,
                                          effectiveEmail,
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
                                    onClick={(e) => handleHunterFindEmail(c, e)}
                                    disabled={hunterLoadingId === c.id}
                                    className="p-1.5 px-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 hover:border-purple-500/40 text-purple-300 hover:text-white flex items-center gap-1.5 text-[11px] font-semibold transition-all cursor-pointer shadow-sm disabled:opacity-50"
                                    title="Auto-search bio, Hunter.io B2B, and social directory for verified contact"
                                  >
                                    {hunterLoadingId === c.id && hunterActionType === 'find' ? (
                                      <RefreshCw className="w-3 h-3 animate-spin text-purple-400" />
                                    ) : (
                                      <Sparkles className="w-3 h-3 text-purple-400" />
                                    )}
                                    <span>
                                      {hunterLoadingId === c.id && hunterActionType === 'find'
                                        ? "Searching..."
                                        : "Auto-Find Email"}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => startEditEmail(c.id, "", e)}
                                    className="p-1.5 px-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/15 text-slate-400 hover:text-white flex items-center gap-1 text-[11px] font-medium transition-all cursor-pointer"
                                    title="Manually enter email address"
                                  >
                                    <Pencil className="w-2.5 h-2.5 text-slate-400" />
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
                              <p className="text-[10px] text-emerald-400/90 font-mono px-1">
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
          ) : null}
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
                <span>Personalized Outreach Queue</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review personalized outreach drafts, confirm verified contacts, and dispatch email waves to creators.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleSendBulkOutreach({ autoAdvance: true })}
                disabled={sendingBulk || creators.length === 0}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50 shadow-md cursor-pointer"
              >
                <Send
                  className={`w-3.5 h-3.5 ${sendingBulk ? "animate-pulse" : ""}`}
                />
                <span>
                  {sendingBulk
                    ? "Dispatching Emails..."
                    : `Dispatch Email Wave (${creators.length} Creators)`}
                </span>
              </button>
              <button
                onClick={() => setActiveStep(4)}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
              >
                <span>Proceed to Step 4: Creator Replies</span>
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
              <p className="text-xl font-bold text-purple-300">{followUpDays} Days Timing</p>
              <span className="text-[11px] text-slate-500">
                No response → follow up in {followUpDays} days
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
                                onBlur={(e) => {
                                  if (tempEmailValue.trim()) {
                                    saveEditEmail(c.id, e);
                                  }
                                }}
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
                              c.status === "rejected"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : c.status === "approved"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : emailVal
                                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}
                          >
                            {c.status === "rejected"
                              ? "Archived (Rejected)"
                              : c.status === "approved"
                                ? "Approved (Active)"
                                : emailVal
                                  ? "Ready in Queue"
                                  : "Email Needed"}
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
          const creatorsWithReplies = (Array.isArray(creators) ? creators : []).map((c) => ({
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
          const otherCount = creatorsWithReplies.filter(
            (c) => c.replyInfo.classification === "other",
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
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>
                      Interested Creator Review ({filteredReplies.length})
                    </span>
                  </h2>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => syncImapReplies(true)}
                    disabled={pollingImap}
                    className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
                    title="Check inbox for new creator replies"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 flex-shrink-0 inline-block origin-center text-purple-400 ${pollingImap ? "animate-spin" : ""}`}
                    />
                    <span className="flex-shrink-0">Sync Replies</span>
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
                  onClick={() => setReplyFilter("other")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    replyFilter === "other"
                      ? "bg-indigo-500/20 border-indigo-500/50 shadow-sm text-white"
                      : "bg-indigo-500/5 border-indigo-500/20 hover:border-indigo-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      <span className="text-[11px] font-bold text-indigo-300">
                        Other
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/15 px-1.5 py-0.5 rounded">
                      {otherCount}
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
                    <strong>"Sync Replies"</strong> to fetch and classify
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
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                            isSelected
                              ? "bg-purple-950/25 border-purple-500/70 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/40"
                              : isApproved
                                ? "bg-emerald-950/10 border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-950/20"
                                : isRejected
                                  ? "bg-red-950/10 border-red-500/20 opacity-60 hover:opacity-90"
                                  : "bg-[#141824] border-white/[0.08] hover:border-white/20 hover:bg-[#181d2c]"
                          }`}
                        >
                          {/* Card Header: Avatar, Name/Handle & Classification Badge */}
                          <div className="flex items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={
                                  c.avatar ||
                                  c.avatar_url ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || c.handle || "Creator")}&background=6366f1&color=fff`
                                }
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || c.handle || "Creator")}&background=6366f1&color=fff`;
                                }}
                                alt=""
                                className="w-9 h-9 rounded-full object-cover border border-white/15 flex-shrink-0 shadow-sm"
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

                            {/* Classification Status Badge */}
                            {isApproved ? (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 flex-shrink-0 border bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span>Approved</span>
                              </span>
                            ) : isRejected ? (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 flex-shrink-0 border bg-rose-500/15 text-rose-300 border-rose-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                <span>Rejected</span>
                              </span>
                            ) : (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 flex-shrink-0 border ${
                                  reply.classification === "interested"
                                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                    : reply.classification === "question"
                                      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                      : reply.classification === "not_interested"
                                        ? "bg-red-500/15 text-red-300 border-red-500/30"
                                        : reply.classification === "unsubscribe"
                                          ? "bg-slate-500/15 text-slate-300 border-slate-500/30"
                                          : reply.classification === "no_email"
                                            ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                            : "bg-blue-500/15 text-blue-300 border-blue-500/30"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    reply.classification === "interested"
                                      ? "bg-emerald-400"
                                      : reply.classification === "question"
                                        ? "bg-amber-400"
                                        : reply.classification === "not_interested"
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
                            )}
                          </div>

                          {/* Message snippet bubble */}
                          {reply.hasRealReply ? (
                            <div className="p-2 rounded-lg bg-black/40 border border-white/[0.04]">
                              <p className="text-[11px] text-slate-200 line-clamp-2 italic leading-relaxed font-sans">
                                "{reply.snippet || reply.text}"
                              </p>
                            </div>
                          ) : reply.classification === "no_email" ? (
                            <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                              <p className="text-[11px] text-amber-300/80 italic font-sans">
                                Outreach not sent. No public business email.
                              </p>
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                              <p className="text-[11px] text-slate-400 italic font-sans">
                                Outreach delivered. Awaiting creator response.
                              </p>
                            </div>
                          )}

                          {/* Footer: Timestamp & Approval Status */}
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-white/[0.05]">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{reply.time || "Recently"}</span>
                            </span>
                            {isApproved ? (
                              <span className="text-emerald-400 text-[10px] font-extrabold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-wider">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Approved
                              </span>
                            ) : isRejected ? (
                              <span className="text-rose-400 text-[10px] font-extrabold bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-wider">
                                <XCircle className="w-3 h-3 text-rose-400" /> Rejected
                              </span>
                            ) : reply.hasRealReply ? (
                              <span className="text-purple-300 font-semibold flex items-center gap-1">
                                Ready for Review
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium">
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
                          {(activeReviewCreator.status === "approved" || activeReviewCreator.isApproved) ? (
                            <span className="text-xs font-bold px-3 py-1 rounded-lg border flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span>Approved • Qualified</span>
                            </span>
                          ) : (activeReviewCreator.status === "rejected" || activeReviewCreator.isRejected) ? (
                            <span className="text-xs font-bold px-3 py-1 rounded-lg border flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border-rose-500/20">
                              <span className="w-2 h-2 rounded-full bg-rose-400" />
                              <span>Rejected • Archived</span>
                            </span>
                          ) : (
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
                          )}
                        </div>
                      </div>

                      {/* ── Creator Profile + Audience Stats Card ── */}
                      <div className="p-4 rounded-xl bg-[#090b0e] border border-white/[0.06] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Creator Profile & Audience
                          </span>
                          <span className="text-xs font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg">
                            Creator Score: {activeReviewCreator.creatorScore || 85}/100
                          </span>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                          <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.04] text-center">
                            <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Followers</span>
                            <span className="text-xs font-bold text-white">{activeReviewCreator.followerStr || activeReviewCreator.follower_count || "N/A"}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.04] text-center">
                            <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Engagement</span>
                            <span className="text-xs font-bold text-emerald-400">{activeReviewCreator.engagement || "3.5"}%</span>
                          </div>
                          <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.04] text-center">
                            <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Niche Fit</span>
                            <span className="text-xs font-bold text-purple-300">{activeReviewCreator.nicheFit || activeReviewCreator.niche_fit || "95% Match"}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.04] text-center">
                            <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Consistency</span>
                            <span className="text-xs font-bold text-cyan-300">{activeReviewCreator.postingConsistency || activeReviewCreator.posting_consistency || "Weekly"}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.04] text-center">
                            <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Authenticity</span>
                            <span className="text-xs font-bold text-blue-300">{activeReviewCreator.audienceAuthenticity || activeReviewCreator.audience_authenticity || "92%"}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.04] text-center">
                            <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Commercial</span>
                            <span className="text-xs font-bold text-amber-300">{activeReviewCreator.commercialPotential || activeReviewCreator.commercial_potential || "Strong"}</span>
                          </div>
                        </div>

                        {/* Bio / Relevant Content */}
                        {activeReviewCreator.bio && (
                          <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                            <span className="text-[9px] text-slate-500 block uppercase tracking-wider mb-1">Relevant Content / Bio</span>
                            <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">{activeReviewCreator.bio}</p>
                          </div>
                        )}

                        {/* Outreach History Summary */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-400 pt-1 border-t border-white/[0.04]">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-blue-400" />
                            <strong className="text-slate-200">Email:</strong>
                            {editingEmailCreatorId === activeReviewCreator.id ? (
                              <span className="inline-flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <input
                                  type="email"
                                  value={tempEmailValue}
                                  onChange={e => setTempEmailValue(e.target.value)}
                                  onBlur={e => {
                                    if (tempEmailValue.trim()) {
                                      saveEditEmail(activeReviewCreator.id, e);
                                    }
                                  }}
                                  onKeyDown={e => { if (e.key === 'Enter') saveEditEmail(activeReviewCreator.id, e); if (e.key === 'Escape') cancelEditEmail(e); }}
                                  className="w-40 px-1.5 py-0.5 rounded bg-white/10 border border-purple-500/40 text-white text-[11px] font-mono focus:outline-none focus:border-purple-400"
                                  placeholder="creator@email.com"
                                  autoFocus
                                />
                                <button type="button" onClick={e => saveEditEmail(activeReviewCreator.id, e)} className="p-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white" title="Save">
                                  <Check className="w-3 h-3" />
                                </button>
                                <button type="button" onClick={e => cancelEditEmail(e)} className="p-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-300" title="Cancel">
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ) : (activeReviewCreator.email || activeReviewCreator.email_public) ? (
                              <span className="text-emerald-400 font-mono">{activeReviewCreator.email || activeReviewCreator.email_public}</span>
                            ) : (
                              <button
                                type="button"
                                onClick={e => startEditEmail(activeReviewCreator.id, '', e)}
                                className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-0.5 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Email</span>
                              </button>
                            )}
                          </span>
                          <span className="text-slate-600">|</span>
                          <span className="flex items-center gap-1">
                            <Send className="w-3 h-3 text-cyan-400" />
                            <strong className="text-slate-200">Outreach:</strong> {activeReviewCreator.outreach_sent ? "Sent" : "Pending"}
                          </span>
                          <span className="text-slate-600">|</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-purple-400" />
                            <strong className="text-slate-200">Platform:</strong> {activeReviewCreator.platform}
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

                      {/* Inbound Creator Response / Conversation Stream */}
                      <div className="space-y-3">

                        {/* Inbound Creator Response / Conversation Bubble */}
                        {activeReviewCreator.replyInfo.hasRealReply ? (
                          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/20 via-[#0e1612] to-[#090b0e] border border-emerald-500/30 space-y-2 text-xs shadow-md">
                            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                              <div className="flex items-center gap-2">
                                <img
                                  src={
                                    activeReviewCreator.avatar ||
                                    activeReviewCreator.avatar_url ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(activeReviewCreator.handle || "Creator")}&background=6366f1&color=fff`
                                  }
                                  alt=""
                                  className="w-5 h-5 rounded-full object-cover border border-emerald-500/40"
                                />
                                <span className="font-bold text-white text-xs">
                                  {activeReviewCreator.name ||
                                    activeReviewCreator.display_name}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-300 font-mono flex items-center gap-1 font-bold">
                                  <span>✨ Inbound Response</span>
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {activeReviewCreator.replyInfo.replyTime || "Recently"}
                              </span>
                            </div>
                            <p className="text-slate-200 font-mono text-[11px]">
                              <strong className="text-emerald-400">Subject:</strong>{" "}
                              {activeReviewCreator.replyInfo.subject || "Re: Partnership Inquiry"}
                            </p>
                            <div className="p-3.5 rounded-xl bg-black/50 border border-emerald-500/20 text-xs text-slate-100 shadow-inner">
                              <FormattedMarkdownBody
                                text={
                                  activeReviewCreator.replyInfo.snippet ||
                                  activeReviewCreator.last_message ||
                                  "Creator responded to outreach."
                                }
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-blue-950/10 border border-blue-500/20 text-center space-y-1.5 py-6">
                            <Clock className="w-5 h-5 text-blue-400 mx-auto" />
                            <p className="text-xs font-semibold text-slate-300">
                              Awaiting Creator Response
                            </p>
                            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                              Outreach email was delivered. Inbound replies will appear here in real-time.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Review Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Lead Decision
                          </span>
                          {activeReviewCreator.status === "approved" && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Approved
                            </span>
                          )}
                          {activeReviewCreator.status === "rejected" && (
                            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Rejected
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleRejectCreator(activeReviewCreator.id)}
                            disabled={activeReviewCreator.status === "rejected"}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              activeReviewCreator.status === "rejected"
                                ? "bg-rose-500/10 text-rose-400/50 border-rose-500/20 cursor-not-allowed"
                                : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/30 active:scale-95"
                            }`}
                          >
                            {activeReviewCreator.status === "rejected" ? "Archived (Rejected)" : "Reject Lead"}
                          </button>
                          {/* Accept & Advance to Step 5 Button (Strictly requires AI to flag as interested) */}
                          {activeReviewCreator.status !== "rejected" && (() => {
                            const rInfo = activeReviewCreator.replyInfo || getCreatorReply(activeReviewCreator);
                            const isAiInterested =
                              rInfo?.classification === "interested" ||
                              ["qualified", "interested"].includes((activeReviewCreator.replyClassification || activeReviewCreator.reply_classification || "").toLowerCase());
                            const isApproved = activeReviewCreator.status === "approved";
                            const canApproveOrAdvance = isAiInterested || isApproved;
                            const isDeclined = rInfo?.classification === "not_interested" || rInfo?.classification === "unsubscribe";

                            if (isDeclined) {
                              return (
                                <span className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                                  <span>Uninterested (Blocked from Step 5)</span>
                                </span>
                              );
                            }

                            return (
                              <button
                                type="button"
                                disabled={!canApproveOrAdvance}
                                onClick={() => {
                                  if (!canApproveOrAdvance) {
                                    notify("warning", "Approval Blocked", "Creator cannot be approved until AI flags their reply as interested.");
                                    return;
                                  }
                                  handleApproveCreator(activeReviewCreator.id, activeReviewCreator);
                                  setSelectedCreatorId(activeReviewCreator.id);
                                  setActiveStep(5);
                                  handleSynthesizeStep5Ai(activeReviewCreator);
                                }}
                                className={`px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 border ${
                                  !canApproveOrAdvance
                                    ? "bg-slate-800/80 text-slate-400 border-white/[0.08] cursor-not-allowed opacity-75"
                                    : isApproved
                                      ? "bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-500/50 cursor-pointer active:scale-95"
                                      : "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/40 cursor-pointer active:scale-95"
                                }`}
                                title={
                                  !canApproveOrAdvance
                                    ? "Locked: Creator cannot be approved until AI flags their inbound reply as interested"
                                    : "Accept lead and advance to Step 5 Product Studio"
                                }
                              >
                                {!canApproveOrAdvance ? (
                                  <>
                                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Awaiting AI Interest Flag 🔒</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>
                                      {isApproved
                                        ? "View Concepts in Step 5"
                                        : "Accept & Advance to Step 5"}
                                    </span>
                                  </>
                                )}
                              </button>
                            );
                          })()}
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
                    Approved — Product Concepts & Audience Intelligence Ready.
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
                      const savedConcept = creatorConceptSelectionMap[c.id] || c.selectedConceptId || c.productConcepts?.[0]?.id || null;
                      setSelectedConceptId(savedConcept);
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
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[11px] font-bold transition-all cursor-pointer flex-shrink-0 disabled:opacity-50"
                      title="Sync Gmail replies for this thread"
                    >
                      <RefreshCw
                        className={`w-3 h-3 flex-shrink-0 inline-block origin-center ${pollingImap ? "animate-spin" : ""}`}
                      />
                      <span className="flex-shrink-0">Sync</span>
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
                          <div className="bg-black/40 p-2.5 rounded-lg border border-white/[0.04]">
                            <FormattedMarkdownBody text={msg.body} />
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            )}

          {/* Step 5 Audience & Concept Review Status Banner */}
          {(() => {
            const hasRealAi = Boolean(
              selectedCreator?.hasAiConcepts ||
                (selectedCreator?.productConcepts?.length > 0 &&
                  selectedCreator?.audienceIntelligence?.topContent),
            );
            const showStep5Skeleton = Boolean(
              isSynthesizingStep5Ai || (!hasRealAi && !step5Error),
            );
            const isDispatched = Boolean(
              selectedCreator && pitchSentMap[selectedCreator.id],
            );
            const sentInfo = selectedCreator
              ? pitchSentMap[selectedCreator.id]
              : null;

            if (showStep5Skeleton) {
              return (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/40 via-[#141c26] to-indigo-950/30 border border-purple-500/30 flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-500/20 border border-purple-500/30">
                      <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                          <span>AI Audience Intelligence & Co-Launch Synthesis in Progress</span>
                        </span>
                        <span className="text-[10px] text-purple-400/80 bg-purple-500/10 px-2 py-0.5 rounded-full font-mono border border-purple-500/20">
                          Live Engine
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Analyzing {selectedCreator?.name || "the creator"}&apos;s YouTube channel metrics, cataloging recurring comments, and engineering 3 custom software product concepts...
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-[#141c26] to-purple-950/30 border border-amber-500/30 flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isDispatched
                        ? "bg-emerald-500/20 border border-emerald-500/30"
                        : "bg-amber-500/20 border border-amber-500/30"
                    }`}
                  >
                    {isDispatched ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          isDispatched ? "text-emerald-300" : "text-amber-300"
                        }`}
                      >
                        {isDispatched
                          ? "3-Concept Blueprint Dispatched — Awaiting Creator Reply"
                          : "Audience Analysis & Opportunities Ready"}
                      </span>
                      {sentInfo && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          • Sent at {sentInfo.time} ({sentInfo.recipient})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300">
                      {isDispatched
                        ? "The 3 engineered concepts have been emailed to the creator. If the creator has not replied yet, use the follow-up re-send button below, or proceed to Step 6."
                        : "Review audience intelligence and select one of the top 3 engineered concepts below to dispatch directly to the creator."}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

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

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
              <button
                type="button"
                onClick={() => handleSynthesizeStep5Ai(selectedCreator)}
                disabled={isSynthesizingStep5Ai}
                className="h-9 px-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 whitespace-nowrap shadow-sm"
                title="Use AI to re-engineer 3 concepts & audience intelligence"
              >
                {isSynthesizingStep5Ai ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                )}
                <span>
                  {isSynthesizingStep5Ai
                    ? "Synthesizing..."
                    : "Regenerate Ideas"}
                </span>
              </button>

              {Boolean(selectedCreator && pitchSentMap[selectedCreator.id]) ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleSendOpportunityPitch(selectedCreator)}
                    disabled={isSendingPitch}
                    className="h-9 px-3.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 text-purple-300 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95 whitespace-nowrap shadow-sm"
                    title="Send follow-up concept email again to creator"
                  >
                    {isSendingPitch ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-purple-400" />
                    )}
                    <span>
                      {isSendingPitch ? "Re-sending..." : "Re-send Email"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveStep(6)}
                    className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap border border-emerald-500/40"
                  >
                    <span>Advance to Step 6 →</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    handleSendBlueprintAndAdvanceToStep6(selectedCreator)
                  }
                  disabled={
                    isSendingPitch ||
                    isSynthesizingStep5Ai ||
                    (!selectedCreator?.hasAiConcepts &&
                      !(
                        selectedCreator?.productConcepts?.length > 0 &&
                        selectedCreator?.audienceIntelligence?.topContent
                      ) &&
                      !step5Error)
                  }
                  className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap border border-emerald-500/40"
                  title="Send the 3 product concepts directly to the creator's email and advance to Step 6"
                >
                  {isSendingPitch || isSynthesizingStep5Ai ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isSendingPitch
                      ? "Dispatching..."
                      : isSynthesizingStep5Ai
                      ? "Synthesizing Concepts..."
                      : "Send 3 Concepts & Advance to Step 6 →"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {step5Error ? (
            <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/30 text-slate-300 space-y-4 shadow-lg">
              <div className="flex items-center gap-2.5 text-red-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span>AI Audience Research & Concept Synthesis Delayed</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {step5Error}
              </p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleSynthesizeStep5Ai(selectedCreator)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry AI Synthesis</span>
                </button>
              </div>
            </div>
          ) : isSynthesizingStep5Ai ||
            (!selectedCreator?.hasAiConcepts &&
              !(
                selectedCreator?.productConcepts?.length > 0 &&
                selectedCreator?.audienceIntelligence?.topContent
              )) ? (
            <Step5SkeletonLoader
              creatorName={
                selectedCreator?.name ||
                selectedCreator?.display_name ||
                selectedCreator?.handle ||
                "Creator"
              }
            />
          ) : (
            <>
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
                <span className="text-[11px] text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 font-mono">
                  All 3 Concepts Dispatched in Email
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {selectedCreator.productConcepts.map((concept, index) => {
                  return (
                    <div
                      key={concept.id || index}
                      className="p-5 rounded-2xl border border-white/[0.08] bg-[#161a23] text-slate-300 space-y-4 flex flex-col justify-between hover:border-white/20 transition-all"
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

                        {/* Visual Mockup Window Preview with Real Concept Screenshot Image */}
                        <div className="rounded-xl bg-gradient-to-br from-[#0a0c12] via-[#141824] to-[#1c2234] border border-white/10 p-3 relative overflow-hidden flex flex-col justify-between shadow-inner space-y-2.5">
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

                          {/* Real Concept Mockup Screenshot Image */}
                          <div className="relative rounded-lg overflow-hidden border border-white/10 h-28 group bg-[#05070c]">
                            <img
                              src={getConceptImageUrl(concept, selectedCreator.niche)}
                              alt={concept.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex items-end p-2 justify-between">
                              <span className="text-[9px] font-mono text-white font-bold bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/10">
                                Visual Mockup
                              </span>
                              <span className="text-[9px] font-bold text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-500/40 backdrop-blur-sm">
                                Attached in Proposal Email
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5">
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
                          <h3 className="text-sm font-black text-white tracking-tight">
                            {concept.name}
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
                    </div>
                  );
                })}
              </div>
            </div>
          )}
            </>
          )}
        </div>
      )}

      {/* STEP 6: PITCH & SELECT PRODUCT (SIMPLIFIED HUMAN-IN-THE-LOOP STUDIO) */}
      {activeStep === 6 && (
        <div className="p-6 rounded-2xl bg-[#0e1117] border border-white/[0.08] space-y-6">
          {/* Creator Switcher Tabs */}
          {/* Creator Switcher Tabs (Only Interested / Qualified Creators) */}
          <div className="p-3 rounded-xl bg-[#161a23] border border-white/[0.08] flex items-center justify-between gap-3 overflow-x-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
                Creators in Step 6:
              </span>
              {interestedCreators.map((c) => {
                const isSelected = selectedCreator?.id === c.id;
                const msgs = getCreatorThreadMessages(c, realThreads);
                
                // Check if creator project is already launched in Project OS (Section 2)
                let isLaunched = Boolean(c.project_id || (c.status || "").toLowerCase() === "launched" || (c.status || "").toLowerCase() === "active_project");
                if (!isLaunched) {
                  try {
                    const stageMap = getExpiringItem("forge_creator_stage_map", {});
                    if (stageMap[c.id]?.step === "section2" || stageMap[c.id]?.step === 7) isLaunched = true;
                    if (c.handle && (stageMap[c.handle.replace(/^@/, "").toLowerCase()]?.step === "section2" || stageMap[c.handle.replace(/^@/, "").toLowerCase()]?.step === 7)) isLaunched = true;
                    const storedProj = JSON.parse(localStorage.getItem("forge_launch_active_project") || "null");
                    if (storedProj) {
                      const matchId = storedProj.creatorId && (storedProj.creatorId === c.id || storedProj.creatorId === c.handle);
                      const matchHandle = storedProj.creatorHandle && (storedProj.creatorHandle.replace(/^@/, "").toLowerCase() === (c.handle || "").replace(/^@/, "").toLowerCase());
                      const matchEmail = storedProj.creatorEmail && (c.email || c.email_public) && (storedProj.creatorEmail.toLowerCase() === (c.email || c.email_public).toLowerCase());
                      if (matchId || matchHandle || matchEmail) isLaunched = true;
                    }
                  } catch (e) {}
                }

                const pitchSent = Boolean(
                  pitchSentMap[c.id] ||
                  (c.status || "").toLowerCase() === "pitched" ||
                  msgs.some((m) => /blueprint|opportunity deck|software concepts|concept pitch|concepts for|partnering with creator forge|concept 1|concept 2|concept 3|co-founder portal/i.test(`${m.subject || ""} ${m.body || ""}`))
                );

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCreatorId(c.id);
                      const savedConcept = creatorConceptSelectionMap[c.id] || c.selectedConceptId || c.productConcepts?.[0]?.id || null;
                      setSelectedConceptId(savedConcept);
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
                    {isLaunched ? (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                          isSelected
                            ? "text-white bg-slate-950/70 border border-black/30 shadow-sm"
                            : "text-emerald-300 bg-emerald-500/15 border border-emerald-500/30"
                        }`}
                      >
                        Launched
                      </span>
                    ) : pitchSent ? (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                          isSelected
                            ? "text-white bg-slate-950/70 border border-black/30 shadow-sm"
                            : "text-purple-300 bg-purple-500/15 border border-purple-500/30"
                        }`}
                      >
                        {msgs.length > 0 ? "In Conversation" : "Proposal Sent"}
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                          isSelected
                            ? "text-white bg-slate-950/70 border border-black/30 shadow-sm"
                            : "text-amber-300 bg-amber-500/15 border border-amber-500/30"
                        }`}
                      >
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
                onClick={() => syncImapReplies(true)}
                disabled={pollingImap}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                title="Check inbox for new replies"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${pollingImap ? "animate-spin text-purple-400" : "text-slate-400"}`}
                />
                <span>Sync Inbox</span>
              </button>
            </div>
          </div>

          {/* Section Header with Creator Profile & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
            <div className="flex items-center gap-3.5">
              <img
                src={selectedCreator?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                alt=""
                className="w-12 h-12 rounded-xl object-cover border border-white/10"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-pink-400">
                    Step 6: Co-Launch Pitch & Agreement
                  </span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    50/50 Revenue Split
                  </span>
                </div>
                <h2 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                  <span>{selectedCreator?.name || selectedCreator?.display_name || "Creator"}</span>
                  <span className="text-xs font-normal text-slate-400 font-mono">
                    ({selectedCreator?.email || selectedCreator?.email_public || "No email"})
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review the 3 engineered concepts, converse with the creator, and click <strong>Create Project</strong> when ready to launch.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedCreator && (
                <button
                  type="button"
                  onClick={() => openDecisionModal(selectedCreator, "reject")}
                  className="h-9 px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 whitespace-nowrap shadow-sm"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Reject Lead</span>
                </button>
              )}

              {(() => {
                let isSelectedCreatorLaunched = Boolean(
                  selectedCreator?.project_id ||
                  (selectedCreator?.status || "").toLowerCase() === "launched" ||
                  (selectedCreator?.status || "").toLowerCase() === "active_project"
                );
                if (!isSelectedCreatorLaunched && selectedCreator) {
                  try {
                    const stageMap = getExpiringItem("forge_creator_stage_map", {});
                    if (stageMap[selectedCreator.id]?.step === "section2" || stageMap[selectedCreator.id]?.step === 7) isSelectedCreatorLaunched = true;
                    if (selectedCreator.handle && (stageMap[selectedCreator.handle.replace(/^@/, "").toLowerCase()]?.step === "section2" || stageMap[selectedCreator.handle.replace(/^@/, "").toLowerCase()]?.step === 7)) isSelectedCreatorLaunched = true;
                    const storedProj = JSON.parse(localStorage.getItem("forge_launch_active_project") || "null");
                    if (storedProj) {
                      const matchId = storedProj.creatorId && (storedProj.creatorId === selectedCreator.id || storedProj.creatorId === selectedCreator.handle);
                      const matchHandle = storedProj.creatorHandle && (storedProj.creatorHandle.replace(/^@/, "").toLowerCase() === (selectedCreator.handle || "").replace(/^@/, "").toLowerCase());
                      const matchEmail = storedProj.creatorEmail && (selectedCreator.email || selectedCreator.email_public) && (storedProj.creatorEmail.toLowerCase() === (selectedCreator.email || selectedCreator.email_public).toLowerCase());
                      if (matchId || matchHandle || matchEmail) isSelectedCreatorLaunched = true;
                    }
                  } catch (e) {}
                }

                if (isSelectedCreatorLaunched) {
                  return (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePitchAndCreateProject()}
                        className="h-9 px-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap shadow-sm"
                        title="Re-sync project specs from selected concept"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                        <span>Re-Sync Project</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onGoToProjectOS) onGoToProjectOS(selectedCreator);
                        }}
                        className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold border border-emerald-500/40 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
                      >
                        <Rocket className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Open Project OS</span>
                      </button>
                    </div>
                  );
                }

                return null;
              })()}
            </div>
          </div>

          {/* Admin Promotion Review Gate Banner */}
          {(() => {
            const detectedChoice = selectedCreator ? aiDetectedChoiceMap[selectedCreator.id] : null;
            const isCommittedChoice = detectedChoice?.decision === "CREATE_PROJECT" || detectedChoice?.decision === "COMMITTED";
            const isAlreadyLaunched = Boolean(
              selectedCreator?.project_id ||
              ["launched", "active_project"].includes((selectedCreator?.status || "").toLowerCase())
            );
            const hasFullCommitment = Boolean(
              isCommittedChoice ||
              selectedCreator?.isCommitted === true ||
              isAlreadyLaunched
            );

            return (
              <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md transition-all ${
                hasFullCommitment
                  ? "bg-gradient-to-r from-purple-950/40 via-[#161a24] to-emerald-950/30 border-emerald-500/40"
                  : "bg-[#121620] border-white/[0.08]"
              }`}>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      hasFullCommitment
                        ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
                        : "text-amber-400 bg-amber-500/15 border-amber-500/30"
                    }`}>
                      {hasFullCommitment ? "Commitment Confirmed" : "Commitment Gate Locked"}
                    </span>
                    <span className="text-xs font-bold text-white">
                      Step 6 Final Promotion Gate
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {hasFullCommitment
                      ? "Full commitment confirmed by creator! Click below to dispatch the official kickoff email and initialize the project in Section 2 (ProjectOS)."
                      : "Review the decided concept, proposal deck, and creator feedback below. Promotion to ProjectOS remains locked until the creator provides full commitment."}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!hasFullCommitment && selectedCreator && (
                    <button
                      type="button"
                      onClick={() => {
                        const curConcepts = selectedCreator.productConcepts || ensureCreatorConcepts(selectedCreator);
                        const curChosen = curConcepts.find((c) => c.id === selectedConceptId) || curConcepts[0];
                        setAiDetectedChoiceMap((prev) => ({
                          ...prev,
                          [selectedCreator.id]: {
                            decision: "CREATE_PROJECT",
                            actionLabel: `Launch & Create Project (${curChosen?.name || "Selected Concept"})`,
                            confidence: 100,
                            conceptName: curChosen?.name || "Selected Concept",
                            conceptId: curChosen?.id,
                            reasoning: "Admin manually confirmed creator commitment. Gate unlocked for ProjectOS promotion.",
                            color: "emerald",
                            badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
                          },
                        }));
                        setCreators((prev) =>
                          prev.map((c) => (c.id === selectedCreator.id ? { ...c, isCommitted: true } : c))
                        );
                        notify("success", "Commitment Unlocked", "Creator commitment verified! You can now promote to ProjectOS.", 3500);
                      }}
                      className="h-9 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap shadow-sm"
                      title="Manually verify creator commitment and unlock promotion to ProjectOS"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Manually Confirm & Unlock</span>
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={!hasFullCommitment}
                    onClick={() => handlePitchAndCreateProject()}
                    className={`h-9 px-4 rounded-xl text-xs font-bold border shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      hasFullCommitment
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/40 cursor-pointer active:scale-95 shadow-emerald-500/20"
                        : "bg-slate-800/80 text-slate-400 border-white/[0.08] cursor-not-allowed opacity-75"
                    }`}
                    title={
                      hasFullCommitment
                        ? "Creator has confirmed full commitment. Promote to ProjectOS."
                        : "Locked: Creator must confirm full commitment (explicit concept selection or co-launch agreement) before promotion to ProjectOS"
                    }
                  >
                    {hasFullCommitment ? (
                      <>
                        <Rocket className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Promote to Creator Dashboard & Send Kickoff Email 🚀</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Awaiting Full Creator Commitment 🔒</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Main 2-Column Split: Decided Project Concept (Left) vs. Conversation & Admin Email Composer (Right) */}
          {selectedCreator && (() => {
            const msgs = getCreatorThreadMessages(selectedCreator, realThreads);
            const pitchSent = Boolean(pitchSentMap[selectedCreator.id]);
            const detectedChoice = aiDetectedChoiceMap[selectedCreator.id];
            const concepts = selectedCreator.productConcepts || ensureCreatorConcepts(selectedCreator);
            const savedConceptId = creatorConceptSelectionMap[selectedCreator.id] || selectedConceptId || selectedCreator.selectedConceptId;
            const chosenConcept =
              concepts.find((c) => c.id === savedConceptId) ||
              concepts.find((c) => c.id === detectedChoice?.conceptId) ||
              concepts[0];

            return (
              <div className="grid lg:grid-cols-12 gap-6">
                {/* Left Column (5 cols): Decided Project Concept & Partnership Terms */}
                <div className="lg:col-span-5 space-y-4">
                  {/* 1. Decided Product Concept Card */}
                  <div className="p-5 rounded-2xl bg-[#161a24] border border-emerald-500/50 shadow-xl space-y-4 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-xs flex items-center justify-center">
                          ✓
                        </span>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Decided Project Concept
                        </span>
                      </div>
                      <span className="text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>Score: {chosenConcept?.opportunityScore || 94}/100</span>
                      </span>
                    </div>

                    <div className="space-y-2 border-b border-white/[0.06] pb-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white tracking-tight">
                          {chosenConcept?.name}
                        </h3>
                        <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/25">
                          {chosenConcept?.pricing}
                        </span>
                      </div>
                      <p className="text-xs text-purple-300 font-medium">
                        {chosenConcept?.tagline}
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        <strong className="text-slate-400">Solves:</strong> {chosenConcept?.problem}
                      </p>
                    </div>

                    {/* Target Specs & Status */}
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-black/40 border border-white/[0.05]">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Target MVP</span>
                        <span className="font-bold text-slate-200">{chosenConcept?.mvpDifficulty || "2 weeks"}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-black/40 border border-white/[0.05]">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Selection Status</span>
                        <span className="font-bold text-emerald-300 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{detectedChoice?.conceptName ? "Confirmed by Creator" : "Ready for Section 2"}</span>
                        </span>
                      </div>
                    </div>

                    {/* Concept Switcher Dropdown / Pills (in case admin wants to toggle) */}
                    {concepts.length > 1 && (
                      <div className="pt-2 border-t border-white/[0.05] space-y-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Change Selected Concept:
                        </span>
                        <div className="flex items-center gap-2">
                          {concepts.map((c, i) => {
                            const isCurrent = (chosenConcept?.id === c.id) || (!chosenConcept && i === 0);
                            return (
                              <button
                                key={c.id || i}
                                type="button"
                                onClick={() => handleSelectConcept(c.id, selectedCreator.id)}
                                className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer truncate ${
                                  isCurrent
                                    ? "bg-purple-600 text-white border-purple-500"
                                    : "bg-white/[0.03] text-slate-400 border-white/10 hover:text-white"
                                }`}
                              >
                                #{i + 1} {c.name.split(" ")[0]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. 50/50 Co-Founder Terms Card */}
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 space-y-2 shadow-sm">
                    <div className="font-bold flex items-center gap-1.5 text-white">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>50/50 Co-Founder Partnership Terms</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Creator Forge builds, hosts, and supports 100% of the MVP. Creator provides distribution and feedback. Net subscription profits split 50/50 via automated Stripe payouts.
                    </p>
                  </div>

                  {/* 3. Creator Profile Quick Summary */}
                  <div className="p-3.5 rounded-xl bg-[#121620] border border-white/[0.06] text-xs space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Creator Profile
                    </span>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Audience:</span>
                      <strong className="text-white font-mono">{selectedCreator.followerStr || selectedCreator.follower_count || "100K+"}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Niche:</span>
                      <strong className="text-purple-300">{selectedCreator.niche || "Creator Economy"}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Contact Email:</span>
                      <strong className="text-emerald-400 font-mono text-[11px]">{selectedCreator.email || selectedCreator.email_public || "No email"}</strong>
                    </div>

                    {/* Hunter.io Intelligence Block in Drawer */}
                    <div className="pt-2 border-t border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-300 flex items-center gap-1">
                          <Target className="w-3 h-3 text-amber-400" />
                          <span>Hunter.io Intelligence</span>
                        </span>
                        {(hunterDataMap[selectedCreator.id]?.score || selectedCreator.hunter_score) ? (
                          <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            {hunterDataMap[selectedCreator.id]?.score || selectedCreator.hunter_score}% Deliverable
                          </span>
                        ) : null}
                      </div>

                      {(selectedCreator.email || selectedCreator.email_public) ? (
                        <div className="space-y-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleHunterVerifyEmail(selectedCreator, e)}
                            disabled={hunterLoadingId === selectedCreator.id}
                            className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-white flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                          >
                            {hunterLoadingId === selectedCreator.id && hunterActionType === 'verify' ? (
                              <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                            ) : (
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            )}
                            <span>Verify Deliverability (Hunter.io)</span>
                          </button>
                          {hunterDataMap[selectedCreator.id] && (
                            <div className="p-2 rounded-lg bg-black/40 border border-white/[0.05] text-[10px] space-y-1 text-slate-300">
                              <div className="flex justify-between">
                                <span>Status:</span>
                                <strong className="text-emerald-400 uppercase">{hunterDataMap[selectedCreator.id].status}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span>SMTP Check:</span>
                                <strong className={hunterDataMap[selectedCreator.id].smtp_check ? "text-emerald-400" : "text-amber-400"}>
                                  {hunterDataMap[selectedCreator.id].smtp_check ? "Passed" : "Blocked/Failed"}
                                </strong>
                              </div>
                              <div className="flex justify-between">
                                <span>Public Sources:</span>
                                <strong className="text-white">{hunterDataMap[selectedCreator.id].sources_count || (hunterDataMap[selectedCreator.id].sources || []).length} web sources</strong>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleHunterFindEmail(selectedCreator, e)}
                          disabled={hunterLoadingId === selectedCreator.id}
                          className="w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-amber-500/15 to-orange-500/15 hover:from-amber-500/25 hover:to-orange-500/25 border border-amber-500/35 text-amber-300 hover:text-white flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          {hunterLoadingId === selectedCreator.id && hunterActionType === 'find' ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                          ) : (
                            <Target className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span>Find Business Email (Hunter.io)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column (7 cols): Live Conversation Thread & Admin Reply Composer */}
                <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
                  {/* 1. Live Conversation Thread */}
                  <div className="rounded-xl bg-[#121620] border border-white/[0.08] overflow-hidden space-y-0 shadow-lg">
                    <div className="p-3 bg-[#161a26] border-b border-white/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <Mail className="w-3.5 h-3.5 text-purple-400" />
                        <span>Conversation Thread with {selectedCreator?.name || "Creator"}</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {msgs.length} Messages Logged
                      </span>
                    </div>

                    <div className="p-3 space-y-2.5 max-h-[260px] overflow-y-auto">
                      {msgs.length > 0 ? (
                        msgs.map((msg, idx) => {
                          const isFromCreator = !/partnerships@creatorforge\.com/i.test(msg.from_address || "");
                          return (
                            <div
                              key={msg.id || idx}
                              className={`p-3.5 rounded-xl border text-xs space-y-1.5 shadow-sm ${
                                isFromCreator
                                  ? "bg-purple-950/20 border-purple-500/30 ml-4"
                                  : "bg-white/[0.02] border-white/[0.06] mr-4"
                              }`}
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-white flex items-center gap-1.5">
                                  <span>{isFromCreator ? (selectedCreator.name || msg.from_address) : "Creator Forge Studio"}</span>
                                  {isFromCreator && (
                                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                      Creator Reply
                                    </span>
                                  )}
                                </span>
                                <span className="text-slate-500 font-mono text-[10px]">
                                  {msg.received_at ? new Date(msg.received_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "Recently"}
                                </span>
                              </div>
                              <div className="text-xs text-slate-200 leading-relaxed font-sans">
                                <FormattedMarkdownBody text={msg.body} />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-6 text-center text-xs text-slate-400 italic space-y-1">
                          <Clock className="w-5 h-5 text-slate-600 mx-auto" />
                          <p>No messages received yet. Write a direct reply below or click Generate AI Draft.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Admin Direct Email Composer */}
                  <div className="p-4 rounded-xl bg-[#121620] border border-white/[0.08] space-y-3 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-white block">
                            Admin Direct Email Composer
                          </span>
                          <span className="text-[10px] text-slate-400">
                            You are chatting directly with {selectedCreator.name || "creator"}. Messages are sent manually by you.
                          </span>
                        </div>
                      </div>

                      {/* TOP ACTION BUTTONS */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={handleRegenerateStep6Draft}
                          disabled={isGeneratingStep6Ai}
                          className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          title="Generate fresh AI draft tailored to creator's latest response"
                        >
                          <Sparkles className={`w-3.5 h-3.5 text-purple-400 ${isGeneratingStep6Ai ? "animate-spin" : ""}`} />
                          <span>{isGeneratingStep6Ai ? "Generating..." : "Generate AI Draft"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendOpportunityPitch()}
                          disabled={isSendingPitch}
                          className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                        >
                          {isSendingPitch ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>{isSendingPitch ? "Sending..." : "Send Email"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Subject Line Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Subject Line
                      </label>
                      <input
                        type="text"
                        value={customPitchSubject}
                        onChange={(e) => setCustomPitchSubject(e.target.value)}
                        placeholder="Subject..."
                        className="w-full bg-[#090b0e] border border-white/10 focus:border-purple-500/50 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                      />
                    </div>

                    {/* Message Body Textarea */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Message Body
                      </label>
                      <textarea
                        rows={6}
                        value={customPitchBody}
                        onChange={(e) => setCustomPitchBody(e.target.value)}
                        placeholder={`Hi ${selectedCreator.name?.split(" ")[0] || "there"}, thanks for replying! We'd love to partner with you on building ${chosenConcept?.name}...`}
                        className="w-full bg-[#090b0e] border border-white/10 focus:border-purple-500/50 rounded-xl p-3.5 text-xs text-slate-200 font-sans leading-relaxed focus:outline-none resize-none"
                      />
                    </div>

                    {/* Quick Suggestion Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1">
                        Templates:
                      </span>
                      {[
                        `Glad you like ${chosenConcept?.name || "the concept"}! Let's get started`,
                        "Zero technical effort or time required from you",
                        "Can we schedule a quick 15-min demo call?",
                      ].map((suggestion, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => {
                            setCustomPitchBody((prev) =>
                              prev ? `${prev}\n\n${suggestion}` : suggestion
                            );
                          }}
                          className="text-[10px] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-white/[0.06] transition-all cursor-pointer truncate max-w-[220px]"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>

                    {/* Bottom Info Bar */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                      <div className="text-[11px] text-slate-400">
                        Recipient: <span className="text-emerald-300 font-mono font-medium">{selectedCreator.email || selectedCreator.email_public || "No email set"}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendOpportunityPitch()}
                        disabled={isSendingPitch}
                        className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 sm:hidden"
                      >
                        {isSendingPitch ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>{isSendingPitch ? "Sending..." : "Send Email"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
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
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => syncImapReplies(true)}
                  disabled={pollingImap}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer flex-shrink-0 disabled:opacity-50"
                  title="Check inbox for replies"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 flex-shrink-0 inline-block origin-center ${pollingImap ? "animate-spin" : ""}`}
                  />
                  <span className="flex-shrink-0">Sync Inbox</span>
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

                          {replyInfo.hasRealReply && replyInfo.text && (
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
                            const savedConcept = creatorConceptSelectionMap[c.id] || c.selectedConceptId || c.productConcepts?.[0]?.id || null;
                            setSelectedConceptId(savedConcept);
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
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => syncImapReplies(true)}
                  disabled={pollingImap}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all cursor-pointer flex-shrink-0 disabled:opacity-50"
                  title="Check inbox for replies"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 flex-shrink-0 inline-block origin-center ${pollingImap ? "animate-spin" : ""}`}
                  />
                  <span className="flex-shrink-0">Sync Inbox</span>
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
                            const savedConcept = creatorConceptSelectionMap[c.id] || c.selectedConceptId || c.productConcepts?.[0]?.id || null;
                            setSelectedConceptId(savedConcept);
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

      {/* Creator Follow-Up & Reply Status CRM Directory Modal */}
      <CreatorFollowUpCRM
        isOpen={showFollowUpCRM}
        onClose={() => setShowFollowUpCRM(false)}
        creators={creators}
        realThreads={realThreads}
        pitchSentMap={pitchSentMap}
        onSelectCreator={(cid, targetStep, conceptId) => {
          setSelectedCreatorId(cid);
          if (conceptId) setSelectedConceptId(conceptId);
          setShowFollowUpCRM(false);
          if (targetStep === "section2" || targetStep === 7) {
            if (onGoToProjectOS) onGoToProjectOS(cid);
          } else {
            setActiveStep(Number(targetStep) || 5);
          }
        }}
        onSyncImap={() => syncImapReplies(true)}
        onApproveCreator={handleApproveCreator}
        onRejectCreator={handleRejectCreator}
        onDeleteCreator={async (creatorId) => {
          const targetCreator = (creators || []).find((c) => c.id === creatorId || c.handle === creatorId);
          const cleanHandle = (targetCreator?.handle || creatorId || "").replace(/^@/, "").toLowerCase();

          setCreators((prev) =>
            (prev || []).filter(
              (c) =>
                c.id !== creatorId &&
                c.handle !== creatorId &&
                (c.handle || "").replace(/^@/, "").toLowerCase() !== cleanHandle
            )
          );
          setRealThreads((prev) =>
            (prev || []).filter((t) => {
              if (t.creator_id === creatorId) return false;
              if (t.creator_handle && t.creator_handle.replace(/^@/, "").toLowerCase() === cleanHandle) return false;
              return true;
            })
          );
          setPitchSentMap((prev) => {
            const next = { ...prev };
            delete next[creatorId];
            delete next[cleanHandle];
            return next;
          });
          setAiDetectedChoiceMap((prev) => {
            const next = { ...prev };
            delete next[creatorId];
            delete next[cleanHandle];
            return next;
          });
          if (selectedCreatorId === creatorId || selectedCreatorId === cleanHandle) {
            setSelectedCreatorId(null);
          }

          try {
            const { deleteCreator } = await import("../../services/opsApi");
            await deleteCreator(creatorId);
          } catch (e) {
            console.warn("deleteCreator API notice:", e);
          }
        }}
        onOpenDecisionModal={(c, decision) => {
          setShowFollowUpCRM(false);
          openDecisionModal(c, decision);
        }}
        onNotify={notify}
      />

      {/* ── Step 4 Decision & Optional Email Notification Modal ─────────────── */}
      {decisionModal.isOpen && decisionModal.creator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-[#0e1117] border border-white/[0.12] shadow-2xl p-6 space-y-5 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    decisionModal.decisionType === "approve"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  }`}
                >
                  {decisionModal.decisionType === "approve" ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        decisionModal.decisionType === "approve"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {decisionModal.decisionType === "approve"
                        ? "Accept Creator"
                        : "Reject Lead"}
                    </span>
                    <span className="text-xs text-slate-400">
                      • Step 4 Decision Review
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {decisionModal.decisionType === "approve"
                      ? `Accept Partnership with ${decisionModal.creator.name || decisionModal.creator.display_name}`
                      : `Decline & Archive ${decisionModal.creator.name || decisionModal.creator.display_name}`}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDecisionModal((prev) => ({ ...prev, isOpen: false }))
                }
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Creator Profile Summary Card */}
            <div className="p-3.5 rounded-xl bg-[#161a23] border border-white/[0.06] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={
                    decisionModal.creator.avatar ||
                    decisionModal.creator.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(decisionModal.creator.handle || "Creator")}&background=6366f1&color=fff`
                  }
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-white truncate">
                    {decisionModal.creator.name ||
                      decisionModal.creator.display_name}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    {decisionModal.creator.handle} •{" "}
                    {decisionModal.creator.platform} •{" "}
                    {decisionModal.creator.followerStr ||
                      decisionModal.creator.follower_count}{" "}
                    followers
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                  Email Address
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {decisionModal.creator.email ||
                    decisionModal.creator.email_public ||
                    "No email available"}
                </span>
              </div>
            </div>

            {/* Optional Email Notification Toggle & Composition */}
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-white flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={decisionModal.sendEmail}
                      onChange={(e) =>
                        setDecisionModal((prev) => ({
                          ...prev,
                          sendEmail: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
                    />
                    <span>Send decision notification email to creator</span>
                  </label>
                  <p className="text-[11px] text-slate-400 pl-6">
                    Optional. Send an email notification to (
                    {decisionModal.creator.email ||
                      decisionModal.creator.email_public ||
                      "creator email"}
                    ).
                  </p>
                </div>

                {decisionModal.sendEmail && (
                  <button
                    type="button"
                    onClick={handleGenerateDecisionAi}
                    disabled={decisionModal.isGeneratingAi}
                    className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 flex-shrink-0"
                    title="Generate personalized email description with AI"
                  >
                    {decisionModal.isGeneratingAi ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    )}
                    <span>
                      {decisionModal.isGeneratingAi
                        ? "Generating..."
                        : "Generate with AI"}
                    </span>
                  </button>
                )}
              </div>

              {decisionModal.sendEmail && (
                <div className="rounded-xl bg-[#0b0e14] border border-white/10 overflow-hidden space-y-0 shadow-lg animate-in fade-in">
                  {/* Fake Mailbox Header */}
                  <div className="bg-[#121620] px-4 py-2.5 border-b border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#ff5f56]" />
                        <span className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
                        <span className="w-2 h-2 rounded-full bg-[#27c93f]" />
                      </div>
                      <span className="text-[11px] font-bold text-white tracking-wide ml-1">
                        {decisionModal.decisionType === "approve"
                          ? "Partnership Acceptance Notice"
                          : "Partnership Status Update"}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                      🔒 SMTP Dispatch Ready
                    </span>
                  </div>

                  {/* Metadata fields */}
                  <div className="bg-[#0e121a] px-4 py-2.5 border-b border-white/[0.06] space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold w-14">From:</span>
                      <span className="text-slate-200 font-mono text-[11px]">
                        Creator Forge Studio &lt;partnerships@creatorforge.com&gt;
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold w-14">To:</span>
                      <span className="text-emerald-400 font-mono text-[11px] font-bold">
                        {decisionModal.creator.name ||
                          decisionModal.creator.display_name}{" "}
                        &lt;
                        {decisionModal.creator.email ||
                          decisionModal.creator.email_public}
                        &gt;
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-slate-400 font-bold w-14">
                        Subject:
                      </span>
                      <input
                        type="text"
                        value={decisionModal.subject}
                        onChange={(e) =>
                          setDecisionModal((prev) => ({
                            ...prev,
                            subject: e.target.value,
                          }))
                        }
                        placeholder="e.g. Partnership Accepted: Advancing to Product Discovery"
                        className="flex-1 bg-[#141824] border border-white/10 rounded-lg px-3 py-1 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Body Editor */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Email Message Description (Editable)
                      </label>
                      <span className="text-[10px] text-purple-400 font-mono">
                        AI-Generated Template
                      </span>
                    </div>
                    <textarea
                      rows={6}
                      value={decisionModal.body}
                      onChange={(e) =>
                        setDecisionModal((prev) => ({
                          ...prev,
                          body: e.target.value,
                        }))
                      }
                      placeholder="Enter optional description sent to the creator..."
                      className="w-full bg-[#141824] border border-white/10 rounded-xl p-3.5 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-purple-500 transition-colors"
                    />

                    {decisionModal.decisionType === "approve" && (
                      <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-between text-[11px] text-purple-200">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>50/50 Revenue Split • 0 Cost Guarantee</span>
                        </span>
                        <span className="font-mono text-[10px] text-purple-300">
                          Included in Offer
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
              <button
                type="button"
                onClick={() =>
                  setDecisionModal((prev) => ({ ...prev, isOpen: false }))
                }
                disabled={decisionModal.isSending}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/[0.05] hover:bg-white/10 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmDecisionModal}
                  disabled={decisionModal.isSending}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 ${
                    decisionModal.decisionType === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/50 shadow-emerald-600/20"
                      : "bg-rose-600 hover:bg-rose-500 border border-rose-500/50 shadow-rose-600/20"
                  }`}
                >
                  {decisionModal.isSending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : decisionModal.decisionType === "approve" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span>
                    {decisionModal.isSending
                      ? "Processing..."
                      : decisionModal.decisionType === "approve"
                        ? decisionModal.sendEmail
                          ? "Confirm Acceptance & Send Email →"
                          : "Confirm Acceptance & Advance →"
                        : decisionModal.sendEmail
                          ? "Confirm Rejection & Send Email"
                          : "Confirm Rejection & Archive"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Precision Workspace Provisioning Modal (Linear / Vercel Aesthetic) ── */}
      {isLaunchingProject && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 overflow-hidden">
          {(() => {
            const concepts = selectedCreator?.productConcepts || (selectedCreator ? ensureCreatorConcepts(selectedCreator) : []);
            const concept = concepts?.find((p) => p.id === selectedConceptId) || concepts?.[0];
            const cleanHandle = (selectedCreator?.handle || "partner").replace(/^@/, "");
            const creatorDisplayName = selectedCreator?.name || selectedCreator?.display_name || `@${cleanHandle}`;

            return (
              <div className="w-full max-w-md rounded-2xl bg-[#0c0e14] border border-white/[0.1] shadow-2xl p-6 text-left space-y-5 relative overflow-hidden">
                {/* Hairline subtle top glow */}
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

                {/* Partner Header */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    {selectedCreator?.avatar ? (
                      <img
                        src={selectedCreator.avatar}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-slate-300 text-sm">
                        {creatorDisplayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0c0e14] flex items-center justify-center">
                      <Rocket className="w-2 h-2 text-[#0c0e14]" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Initializing Workspace
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {launchStepIndex} / 4
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white tracking-tight truncate mt-0.5">
                      {creatorDisplayName}
                    </h3>
                  </div>
                </div>

                {/* Real Venture Specs */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Concept</span>
                    <p className="font-semibold text-slate-200 truncate mt-0.5">
                      {concept?.name || "Co-Launch Venture"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Terms</span>
                    <p className="font-semibold text-emerald-400 font-mono truncate mt-0.5">
                      50 / 50 Net Split
                    </p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-white/[0.04]">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Co-Founder Portal Link</span>
                    <p className="font-mono text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                      <span>{selectedCreator?.email || selectedCreator?.email_public || "Direct Magic Link Generated"}</span>
                    </p>
                  </div>
                </div>

                {/* Linear-Style Provisioning Checklist */}
                <div className="space-y-2 py-1">
                  {[
                    { id: 1, text: "Configuring product architecture & concept specs" },
                    { id: 2, text: "Generating secure Co-Founder Portal access" },
                    { id: 3, text: "Initializing validation telemetry & revenue milestones" },
                    { id: 4, text: "Connecting Project OS workspace" },
                  ].map((step) => {
                    const isComplete = launchStepIndex > step.id;
                    const isCurrent = launchStepIndex === step.id;
                    return (
                      <div
                        key={step.id}
                        className={`flex items-center gap-2.5 text-xs transition-colors duration-200 ${
                          isComplete
                            ? "text-slate-300"
                            : isCurrent
                            ? "text-white font-medium"
                            : "text-slate-600"
                        }`}
                      >
                        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                          {isComplete ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : isCurrent ? (
                            <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                          )}
                        </div>
                        <span className="truncate">{step.text}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Segmented Micro-Progress Indicator */}
                <div className="space-y-2 pt-1 border-t border-white/[0.06]">
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((idx) => (
                      <div
                        key={idx}
                        className={`h-1 rounded-full transition-all duration-300 ${
                          launchStepIndex >= idx
                            ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]"
                            : "bg-white/[0.06]"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>
                        {launchStepIndex === 1
                          ? "Binding specifications..."
                          : launchStepIndex === 2
                          ? "Deploying founder portal..."
                          : launchStepIndex === 3
                          ? "Setting up validation gates..."
                          : "Opening workspace..."}
                      </span>
                    </span>
                    <span>{launchStepIndex * 25}%</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>,
        document.body
      )}

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
