import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  Search,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  RefreshCw,
  Download,
  ExternalLink,
  ChevronRight,
  Filter,
  Copy,
  Check,
  Zap,
  ArrowRight,
  HelpCircle,
  AlertTriangle,
  Youtube,
  Instagram,
  Music,
  Send,
  X,
  Edit2,
  Save,
  ShieldCheck,
  Flame,
  Trash2,
} from "lucide-react";

export default function CreatorFollowUpCRM({
  isOpen = false,
  isPage = false,
  onClose,
  creators = [],
  realThreads = [],
  pitchSentMap = {},
  onSelectCreator,
  onSyncImap,
  isSyncingImap = false,
  onApproveCreator,
  onRejectCreator,
  onDeleteCreator,
  onOpenDecisionModal,
  onNotify,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [copiedEmail, setCopiedEmail] = useState(null);

  // Local editable overrides for labels, status, and emails
  const [labelOverrides, setLabelOverrides] = useState({});
  // statusOverrides only provides instant visual feedback; the DB (via parent props) is the source of truth on refresh
  const [statusOverrides, setStatusOverrides] = useState({});
  const [editingEmailId, setEditingEmailId] = useState(null);
  const [emailInputs, setEmailInputs] = useState({});
  const [findingEmailId, setFindingEmailId] = useState(null);
  const [selectedDetailCreatorId, setSelectedDetailCreatorId] = useState(() => {
    try {
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      return searchParams?.get('creator') || null;
    } catch {
      return null;
    }
  });
  const [stageMap, setStageMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("forge_creator_stage_map") || "{}");
    } catch {
      return {};
    }
  });

  // Sync stage map from database on mount across devices
  useEffect(() => {
    import("../../services/opsApi").then(({ getWorkflowState }) => {
      getWorkflowState().then((ws) => {
        if (ws && ws.creator_stage_map && Object.keys(ws.creator_stage_map).length > 0) {
          setStageMap((prev) => ({ ...prev, ...ws.creator_stage_map }));
        }
      }).catch(() => {});
    });
  }, []);

  const handleOpenStudioForCreator = (creator, targetStep, actionName) => {
    if (!creator) return;
    const stepNum = typeof targetStep === "number" ? targetStep : (targetStep === "section2" ? "section2" : 5);
    try {
      const map = JSON.parse(localStorage.getItem("forge_creator_stage_map") || "{}");
      map[creator.id] = {
        step: stepNum,
        actionName: actionName || `Step ${stepNum} Studio`,
        updatedAt: new Date().toISOString(),
      };
      if (creator.handle) {
        map[(creator.handle || "").replace(/^@/, "").toLowerCase()] = map[creator.id];
      }
      localStorage.setItem("forge_creator_stage_map", JSON.stringify(map));
      setStageMap(map);
      import("../../services/opsApi").then(({ updateWorkflowState }) => {
        updateWorkflowState({ creator_stage_map: map }).catch(() => {});
      });
    } catch (e) {}

    if (onSelectCreator) {
      onSelectCreator(creator.id, targetStep);
    }
  };

  const handleDirectApprove = (creatorId) => {
    setStatusOverrides((prev) => ({ ...prev, [creatorId]: "approved" }));
    const newStageMap = {
      ...stageMap,
      [creatorId]: {
        step: 5,
        stepName: "Step 5: Audience & 3 Product Ideas",
        label: "Step 5 Product Studio →",
        updatedAt: new Date().toISOString(),
      },
    };
    setStageMap(newStageMap);
    try {
      localStorage.setItem("forge_creator_stage_map", JSON.stringify(newStageMap));
      import("../../services/opsApi").then(({ updateWorkflowState }) => {
        updateWorkflowState({ creator_stage_map: newStageMap }).catch(() => {});
      });
    } catch {}
    if (onApproveCreator) {
      onApproveCreator(creatorId);
    }
  };

  const handleDirectReject = (creatorId) => {
    setStatusOverrides((prev) => ({ ...prev, [creatorId]: "rejected" }));
    if (onRejectCreator) {
      onRejectCreator(creatorId);
    }
  };

  // ── 1. Helper to extract reply classification and snippet ───────────────────
  const getCreatorReplyInfo = (c) => {
    if (!c) return { hasReply: false, classification: "", snippet: "", subject: "", time: "-", totalInbound: 0 };
    const cId = c.id;
    const email = (c.email || c.email_public || "").toLowerCase().trim();
    const handle = (c.handle || "").toLowerCase().replace(/^@/, "").trim();
    const cName = (c.name || c.display_name || "").toLowerCase().trim();

    // Check database threads with strict creator isolation
    const matchedThreads = (realThreads || []).filter((t) => {
      if (!t) return false;
      if (t.creator_id && cId && t.creator_id === cId) return true;
      if (!t.creator_id) {
        if (handle && t.creator_handle && t.creator_handle.toLowerCase().replace(/^@/, "").trim() === handle) return true;
        if (cName && cName.length >= 3 && (t.subject || "").toLowerCase().includes(cName)) return true;
        if (email && t.creator_email && t.creator_email.toLowerCase().trim() === email) {
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
          if (!belongsToOther) return true;
        }
      }
      return false;
    });

    let inboundReplies = [];
    matchedThreads.forEach((t) => {
      (t.replies || []).forEach((r) => {
        const fromAddr = (r.from_address || "").toLowerCase().trim();
        const isAdmin = fromAddr.includes("partnerships@creatorforge.com") || fromAddr.includes("admin") || r.direction === "outbound";
        if (isAdmin) return;

        const bodyLower = (r.body || "").toLowerCase();
        const subjLower = (r.subject || "").toLowerCase();

        // Check if reply explicitly belongs to another creator
        if (bodyLower.includes("cf-cid:") && !bodyLower.includes(`cf-cid:${cId.toLowerCase()}`)) return;
        if (subjLower.includes("[#") && handle && !subjLower.includes(`[#${handle}]`)) return;

        const otherCreators = (creators || []).filter((other) => other.id !== cId);
        const hasOtherToken = otherCreators.some((other) => {
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
        if (hasOtherToken) return;

        inboundReplies.push(r);
      });
    });

    inboundReplies.sort((a, b) => new Date(b.received_at || 0) - new Date(a.received_at || 0));

    const overriddenCls = labelOverrides[c.id];

    if (inboundReplies.length > 0) {
      const latest = inboundReplies[0];
      let resolvedCls = latest.classification || latest.ai_classification || c.replyClassification || c.reply_classification;
      if (!resolvedCls) {
        const bodyText = (latest.body || "").toLowerCase();
        if (bodyText.includes("not interested") || bodyText.includes("no thanks") || bodyText.includes("pass on this") || bodyText.includes("unsubscribe") || bodyText.includes("cant do it") || bodyText.includes("can't do it")) {
          resolvedCls = "not_interested";
        } else if (bodyText.includes("how") || bodyText.includes("what") || bodyText.includes("cost") || bodyText.includes("pricing") || bodyText.includes("?") || bodyText.includes("clarification")) {
          resolvedCls = "question";
        } else if (bodyText.includes("interested") || bodyText.includes("sounds good") || bodyText.includes("let's do it") || bodyText.includes("lets do it") || bodyText.includes("yes") || bodyText.includes("sure")) {
          resolvedCls = "interested";
        } else {
          resolvedCls = "interested";
        }
      }
      const cls = (overriddenCls || resolvedCls).toLowerCase();
      const sentiment = cls === "interested" ? "positive" : cls === "question" ? "questioning" : cls === "not_interested" ? "negative" : "neutral";
      const reasoning = cls === "interested"
        ? "Creator replied positively to Step 4 outreach. Qualified for Step 5 Audience & Product Synthesis — awaiting concept selection."
        : cls === "question"
        ? "Creator requested more technical details or clarifications regarding revenue split and time commitment."
        : cls === "not_interested"
        ? "Creator indicated they are currently not interested in co-launching a venture."
        : "Inbound creator response received and logged.";
      return {
        hasReply: true,
        classification: cls,
        sentiment,
        reasoning,
        snippet: latest.body || "",
        subject: latest.subject || "Re: Outreach to " + (c.name || c.display_name || c.handle || "Creator"),
        time: latest.received_at ? new Date(latest.received_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recently",
        totalInbound: inboundReplies.length,
      };
    }

    const hasExplicitRepliedStatus = c.status === "replied" || c.status === "in_review" || c.status === "interested";
    if (overriddenCls || (hasExplicitRepliedStatus && (c.reply_text || c.replyText))) {
      const cls = (overriddenCls || c.replyClassification || c.reply_classification || "interested").toLowerCase();
      const sentiment = cls === "interested" ? "positive" : cls === "question" ? "questioning" : cls === "not_interested" ? "negative" : "neutral";
      const reasoning = cls === "interested"
        ? "Creator replied positively to Step 4 outreach. Qualified for Step 5 Audience & Product Synthesis — awaiting concept selection."
        : cls === "question"
        ? "Creator requested more technical details or clarifications regarding revenue split."
        : "Creator responded to outreach.";
      return {
        hasReply: true,
        classification: cls,
        sentiment,
        reasoning,
        snippet: c.reply_text || c.replyText || c.replySnippet || "Creator responded to outreach.",
        subject: "Re: Outreach to " + (c.name || c.display_name || c.handle || "Creator"),
        time: "Recently",
        totalInbound: 1,
      };
    }

    if (!email || !email.includes("@")) {
      return {
        hasReply: false,
        classification: "no_email",
        sentiment: "neutral",
        reasoning: "No verified public email address found yet. Add manual email address to enable outreach.",
        snippet: "No verified email address found yet.",
        subject: "Missing Contact",
        time: "-",
        totalInbound: 0,
      };
    }

    const isContacted = c.status === "contacted" || c.outreachSent;
    return {
      hasReply: false,
      classification: isContacted ? "awaiting_reply" : "ready_for_outreach",
      sentiment: "neutral",
      reasoning: isContacted
        ? "Autonomous outreach message dispatched. Awaiting inbound creator response."
        : "Lead qualified and ready for Step 3 Autonomous Outreach broadcast.",
      snippet: isContacted ? "Outreach email sent. Awaiting creator reply." : "Ready for outreach dispatch.",
      subject: isContacted ? "Awaiting Reply" : "Ready for Outreach",
      time: "-",
      totalInbound: 0,
    };
  };

  // ── 2. Helper to resolve creator pipeline stage & status badge ───────────────
  const getCreatorPipelineStage = (c) => {
    if (!c) return { stageId: "unknown", stageName: "Unknown", badgeClass: "bg-slate-500/20 text-slate-400 border-slate-500/40", dotClass: "bg-slate-400", description: "" };

    const cleanH = (c.handle || "").toLowerCase().replace(/^@/, "");
    const overrideStatus = statusOverrides[c.id] || statusOverrides[cleanH] || "";
    const effectiveStatus = (overrideStatus || c.status || "").toLowerCase();

    const isRejected =
      effectiveStatus === "rejected" ||
      effectiveStatus === "declined" ||
      effectiveStatus === "archived";

    if (isRejected) {
      return {
        stageId: "rejected",
        stageName: "Rejected by Studio",
        badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold",
        dotClass: "bg-rose-400",
        description: "Lead archived by studio admin",
      };
    }

    const isPartnered =
      effectiveStatus === "partnered" ||
      effectiveStatus === "active" ||
      effectiveStatus === "building" ||
      stageMap[c.id]?.step === "section2";

    if (isPartnered) {
      return {
        stageId: "section2",
        stageName: "Active Co-Launch Venture",
        badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold shadow-xs",
        dotClass: "bg-emerald-400 animate-pulse",
        description: "Venture greenlit & active in Section 2 (Phase 1: Validation)",
      };
    }

    const isPitched = Boolean(pitchSentMap[c.id]) || effectiveStatus === "pitched" || stageMap[c.id]?.step === 6;
    if (isPitched) {
      return {
        stageId: "step6_pitch",
        stageName: "Step 6: In Pitch / Proposal Sent",
        badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold",
        dotClass: "bg-purple-400",
        description: "Opportunity Deck & 3 SaaS Concepts active in pitch",
      };
    }

    const isApproved = effectiveStatus === "approved";
    if (isApproved) {
      return {
        stageId: "approved",
        stageName: "Step 5: Approved • In Product Review",
        badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold",
        dotClass: "bg-emerald-400",
        description: "Qualified & approved by studio for Step 5 Audience & Product Synthesis",
      };
    }

    // Dynamic reply resolution from threads & database
    const replyInfo = getCreatorReplyInfo(c);
    const overriddenCls = labelOverrides[c.id];
    const cls = (overriddenCls || replyInfo.classification || c.replyClassification || c.reply_classification || "").toLowerCase();

    if (replyInfo.hasReply || (cls && cls !== "awaiting_reply" && cls !== "no_email")) {
      if (cls === "interested") {
        return {
          stageId: "interested",
          stageName: "Interested Reply Received",
          badgeClass: "bg-teal-500/20 text-teal-300 border-teal-500/40 font-bold",
          dotClass: "bg-teal-400",
          description: "Creator replied positively with interest",
        };
      }

      if (cls === "question" || cls === "more_info" || cls === "clarification") {
        return {
          stageId: "question",
          stageName: "Questions / Clarification",
          badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold",
          dotClass: "bg-amber-400",
          description: "Creator asked questions about revenue or tech stack",
        };
      }

      if (cls === "not_interested" || cls === "declined" || cls === "hesitant") {
        return {
          stageId: "not_interested",
          stageName: "Hesitant / Uninterested",
          badgeClass: "bg-orange-500/20 text-orange-300 border-orange-500/40 font-bold",
          dotClass: "bg-orange-400",
          description: "Creator expressed hesitation or soft pass",
        };
      }

      if (cls === "unsubscribe" || cls === "opt_out") {
        return {
          stageId: "unsubscribe",
          stageName: "Unsubscribed",
          badgeClass: "bg-slate-500/20 text-slate-400 border-slate-500/40 font-bold",
          dotClass: "bg-slate-400",
          description: "Creator opted out of outreach",
        };
      }

      return {
        stageId: "inbound_reply",
        stageName: "Inbound Reply Received",
        badgeClass: "bg-teal-500/20 text-teal-300 border-teal-500/40 font-bold",
        dotClass: "bg-teal-400",
        description: "Creator sent a response to outreach",
      };
    }

    const email = (c.email || c.email_public || "").trim();
    if (!email || !email.includes("@")) {
      return {
        stageId: "no_email",
        stageName: "Missing Contact Email",
        badgeClass: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
        dotClass: "bg-yellow-400",
        description: "No verified email address found",
      };
    }

    return {
      stageId: "awaiting_reply",
      stageName: "Outreach Sent • Awaiting Reply",
      badgeClass: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      dotClass: "bg-blue-400",
      description: "Initial outreach sent, waiting for creator response",
    };
  };

  // ── Unified Chronological Collector of Replies & Admin Activities ─────────
  const getCreatorActivityAndMessages = (c) => {
    if (!c) return [];
    const email = (c.email || c.email_public || "").toLowerCase().trim();
    const handle = (c.handle || "").toLowerCase().replace(/^@/, "").trim();
    const cName = (c.name || c.display_name || "").toLowerCase().trim();
    const cId = c.id;

    // Find all matching threads for this creator in database with strict isolation
    const matchedThreads = (realThreads || []).filter((t) => {
      if (!t) return false;
      if (t.creator_id && cId && t.creator_id === cId) return true;
      if (!t.creator_id) {
        if (handle && t.creator_handle && t.creator_handle.toLowerCase().replace(/^@/, "").trim() === handle) return true;
        if (cName && cName.length >= 3 && (t.subject || "").toLowerCase().includes(cName)) return true;
        if (email && t.creator_email && t.creator_email.toLowerCase().trim() === email) {
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
          if (!belongsToOther) return true;
        }
      }
      return false;
    });

    const items = [];

    matchedThreads.forEach((t) => {
      // 1. Initial Outbound Outreach Message (Admin Activity)
      if (t.original_body || t.original_subject) {
        items.push({
          id: `outreach_${t.id}`,
          type: "outbound_email",
          sender: "Creator Forge Studio Team (Admin)",
          from_address: "partnerships@creatorforge.com",
          to_address: c.email || c.email_public || t.creator_email,
          subject: t.original_subject || `Co-founder partnership inquiry for ${c.name || c.display_name}`,
          body: t.original_body,
          timestamp: t.created_at || t.last_activity,
          label: "Initial Outreach Email",
          is_inbound: false,
        });
      }

      // 2. Inbound replies from creator (or outbound follow-ups) in t.replies
      (t.replies || []).forEach((r) => {
        const fromAddr = (r.from_address || "").toLowerCase().trim();
        const isAdmin = fromAddr.includes("partnerships@creatorforge.com") || fromAddr.includes("admin") || r.direction === "outbound";
        
        if (!isAdmin) {
          const bodyLower = (r.body || "").toLowerCase();
          const subjLower = (r.subject || "").toLowerCase();

          // Reject if explicitly marked for another creator
          if (bodyLower.includes("cf-cid:") && !bodyLower.includes(`cf-cid:${cId.toLowerCase()}`)) return;
          if (subjLower.includes("[#") && handle && !subjLower.includes(`[#${handle}]`)) return;

          const otherCreators = (creators || []).filter((other) => other.id !== cId);
          const hasOtherToken = otherCreators.some((other) => {
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
          if (hasOtherToken) return;
        }
        items.push({
          id: r.id || `reply_${Math.random()}`,
          type: isAdmin ? "outbound_email" : "inbound_reply",
          sender: isAdmin ? "Creator Forge Studio Team (Admin)" : (c.name || c.display_name || r.from_address),
          from_address: r.from_address || (isAdmin ? "partnerships@creatorforge.com" : (c.email || c.email_public)),
          to_address: isAdmin ? (c.email || c.email_public) : "partnerships@creatorforge.com",
          subject: r.subject || (isAdmin ? "Re: Partnership Update" : "Creator Reply"),
          body: r.body,
          timestamp: r.received_at || r.created_at || t.last_activity,
          label: isAdmin ? "Outbound Email" : "Creator Inbound Reply",
          classification: r.ai_classification,
          is_inbound: !isAdmin,
        });
      });

      // 3. Fallback for any messages in t.messages
      (t.messages || []).forEach((m) => {
        const isInbound = m.is_inbound || m.direction === "inbound";
        items.push({
          id: m.id || `msg_${Math.random()}`,
          type: isInbound ? "inbound_reply" : "outbound_email",
          sender: isInbound ? (c.name || c.display_name || m.from_address) : "Creator Forge Studio Team (Admin)",
          from_address: m.from_address || (isInbound ? (c.email || c.email_public) : "partnerships@creatorforge.com"),
          subject: m.subject || "Email Message",
          body: m.body,
          timestamp: m.received_at || m.sent_at || m.created_at,
          label: isInbound ? "Creator Inbound Reply" : "Outbound Email",
          is_inbound: isInbound,
        });
      });
    });

    // 4. Fallback snippet from creator record if no thread messages exist
    if (items.length === 0 && (c.replySnippet || c.last_message || c.hasReplied)) {
      items.push({
        id: `creator_reply_fallback_${c.id}`,
        type: "inbound_reply",
        sender: c.name || c.display_name || "Creator",
        from_address: c.email || c.email_public || "creator@channel.com",
        subject: "Re: Co-founder partnership inquiry",
        body: c.replySnippet || c.last_message || "Interested in learning more about how this software co-founding model works.",
        timestamp: c.updated_at || new Date().toISOString(),
        label: "Creator Inbound Reply",
        is_inbound: true,
      });
    }

    // 5. Step 6 Opportunity Deck Activity (if pitchSentMap is true)
    if (pitchSentMap && pitchSentMap[c.id]) {
      items.push({
        id: `pitch_activity_${c.id}`,
        type: "pitch_sent",
        sender: "Creator Forge Studio Team (Admin)",
        from_address: "partnerships@creatorforge.com",
        to_address: c.email || c.email_public,
        subject: `Re: 3 Engineered Software Concepts & Opportunity Deck for ${c.name || c.display_name}`,
        body: `Step 6 Opportunity Deck with 3 tailored SaaS concepts & 50/50 net revenue agreement terms sent to ${c.name || c.display_name}.`,
        timestamp: new Date().toISOString(),
        label: "Step 6: Opportunity Pitch Dispatched",
        is_inbound: false,
      });
    }

    // 6. Admin Decision Activity Logs
    const isApproved = (c.status || "").toLowerCase() === "approved";
    const isRejected = (c.status || "").toLowerCase() === "rejected" || (c.status || "").toLowerCase() === "declined";
    if (isApproved) {
      items.push({
        id: `admin_approved_${c.id}`,
        type: "admin_decision",
        sender: "Admin Action",
        subject: "Lead Approved & Qualified for Pitch",
        body: `Admin approved ${c.name || c.display_name}. Channel advanced to Step 5/6 Concept Pitch & Agreement.`,
        timestamp: c.updated_at || new Date().toISOString(),
        label: "Admin Decision: Lead Approved",
        is_inbound: false,
        badgeColor: "emerald",
      });
    } else if (isRejected) {
      items.push({
        id: `admin_rejected_${c.id}`,
        type: "admin_decision",
        sender: "Admin Action",
        subject: "Lead Rejected & Archived",
        body: `Admin marked ${c.name || c.display_name} as rejected. Outreach paused.`,
        timestamp: c.updated_at || new Date().toISOString(),
        label: "Admin Decision: Lead Rejected",
        is_inbound: false,
        badgeColor: "rose",
      });
    }

    // Deduplicate by unique content/id and sort chronological (newest first)
    const seen = new Set();
    const unique = [];
    items.forEach((item) => {
      const key = `${item.subject}_${(item.body || "").slice(0, 40)}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    });

    return unique.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  };

  // ── 3. Six-Step Workflow Definition & Step Progress Resolver ───────────────
  const PIPELINE_STEPS = [
    { num: 1, title: "1. Setup", short: "Setup", desc: "Campaign target & terms configured" },
    { num: 2, title: "2. Discovered", short: "Discover", desc: "Channel intelligence & scoring" },
    { num: 3, title: "3. Outreach", short: "Outreach", desc: "Personalized inquiry sent" },
    { num: 4, title: "4. Reply Review", short: "Reply", desc: "Positive interest classification" },
    { num: 5, title: "5. 3 Concepts", short: "Concepts", desc: "Audience research & 3 tailored SaaS ideas" },
    { num: 6, title: "6. Pitch & Co-Launch", short: "Pitch", desc: "Proposal deck & agreement studio" },
  ];

  const getCreatorCurrentStepInfo = (c) => {
    if (!c) return { stepNumber: 1, stepKey: "step1", stepName: "Step 1: Campaign Setup", badgeClass: "bg-slate-500/20 text-slate-300 border-slate-500/40", buttonLabel: "Step 1 Setup →", targetStep: 1 };

    const explicitTracked = stageMap[c.id] || stageMap[(c.handle || "").replace(/^@/, "").toLowerCase()];
    const isPitched = Boolean(pitchSentMap[c.id]) || Boolean(c.pitch_sent) || c.status === "pitched";
    const effectiveStatus = (statusOverrides[c.id] || c.status || "").toLowerCase();
    const isApproved = effectiveStatus === "approved" || c.isApproved;
    const isRejected = effectiveStatus === "rejected" || effectiveStatus === "declined" || effectiveStatus === "archived";
    const replyInfo = getCreatorReplyInfo(c);
    const hasReply = Boolean(replyInfo?.hasReply || c.hasReplied || c.reply_classification || c.replyClassification);

    // 1. Check if an active project is launched for this creator (in DB or localStorage)
    let hasActiveLaunchedProject = Boolean(c.project_id || effectiveStatus === "launched" || effectiveStatus === "active_project" || explicitTracked?.step === "section2" || explicitTracked?.step === 7);
    if (!hasActiveLaunchedProject) {
      try {
        const storedProj = JSON.parse(localStorage.getItem("forge_launch_active_project") || "null");
        if (storedProj) {
          const matchId = storedProj.creatorId && (storedProj.creatorId === c.id || storedProj.creatorId === c.handle);
          const matchHandle = storedProj.creatorHandle && (storedProj.creatorHandle.replace(/^@/, "").toLowerCase() === (c.handle || "").replace(/^@/, "").toLowerCase());
          const matchEmail = storedProj.creatorEmail && c.email && (storedProj.creatorEmail.toLowerCase() === c.email.toLowerCase());
          if (matchId || matchHandle || matchEmail) {
            hasActiveLaunchedProject = true;
          }
        }
      } catch (e) {}
    }

    // 2. Check thread messages to see if creator or operator has exchanged Step 5/6 concept proposals
    let hasConceptInThread = false;
    let hasKickoffInThread = false;
    try {
      const allMsgs = realThreads.filter(t => {
        const tId = t.creator_id || t.creatorId;
        const tHandle = (t.creator_handle || t.handle || "").replace(/^@/, "").toLowerCase();
        const cHandle = (c.handle || "").replace(/^@/, "").toLowerCase();
        const tEmail = (t.creator_email || t.email || "").toLowerCase();
        const cEmail = (c.email || c.email_public || "").toLowerCase();
        return (tId && tId === c.id) || (tHandle && tHandle === cHandle) || (tEmail && cEmail && tEmail === cEmail);
      }).flatMap(t => t.messages || (t.body ? [t] : []));

      for (const m of allMsgs) {
        const text = `${m.subject || ""} ${m.body || ""}`.toLowerCase();
        if (text.includes("concept 1") || text.includes("concept 2") || text.includes("concept 3") || text.includes("go for concept") || text.includes("choose concept") || text.includes("partnering with creator forge") || text.includes("3 concepts") || text.includes("proposal deck")) {
          hasConceptInThread = true;
        }
        if (text.includes("co-founder portal live") || (text.includes("developing") && text.includes("creator forge")) || text.includes("project os")) {
          hasKickoffInThread = true;
        }
      }
    } catch (e) {}

    if (isRejected) {
      return {
        stepNumber: 0,
        stepKey: "rejected",
        stepName: "Rejected / Archived",
        badgeText: "Lead Archived",
        badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/40",
        buttonLabel: "Lead Archived",
        targetStep: 4,
      };
    }

    if (hasActiveLaunchedProject || hasKickoffInThread) {
      return {
        stepNumber: 7,
        stepKey: "section2",
        stepName: "Section 2: Active Project OS",
        badgeText: "Project Launched 🚀",
        badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        buttonLabel: "Open Project OS 🚀",
        targetStep: "section2",
      };
    }

    // Step 6: Explicitly in Step 6, or pitch sent, or concept selected in thread
    if (explicitTracked?.step === 6 || isPitched || hasConceptInThread) {
      return {
        stepNumber: 6,
        stepKey: "step6",
        stepName: "Step 6: Pitch & Co-Launch Studio",
        badgeText: "Step 6: Concept Selected",
        badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/40",
        buttonLabel: "Step 6 Pitch Studio →",
        targetStep: 6,
      };
    }

    // Step 5: ONLY if lead is approved OR operator explicitly advanced to Step 5
    if (isApproved || (explicitTracked?.step === 5 && isApproved)) {
      return {
        stepNumber: 5,
        stepKey: "step5",
        stepName: "Step 5: Audience & 3 Product Ideas",
        badgeText: "Step 5: 3 Ideas Ready",
        badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        buttonLabel: "Step 5 Product Studio →",
        targetStep: 5,
      };
    }

    if (hasReply) {
      return {
        stepNumber: 4,
        stepKey: "step4",
        stepName: "Step 4: Interested Reply Received",
        badgeText: "Step 4: Reply Review",
        badgeClass: "bg-teal-500/20 text-teal-300 border-teal-500/40",
        buttonLabel: "Step 4 Review Reply →",
        targetStep: 4,
      };
    }

    if (c.outreach_sent || effectiveStatus === "contacted") {
      return {
        stepNumber: 3,
        stepKey: "step3",
        stepName: "Step 3: Autonomous Outreach Sent",
        badgeText: "Step 3: Outreach Sent",
        badgeClass: "bg-blue-500/20 text-blue-300 border-blue-500/40",
        buttonLabel: "Step 4 Review →",
        targetStep: 4,
      };
    }

    return {
      stepNumber: 2,
      stepKey: "step2",
      stepName: "Step 2: Discovered & Qualified",
      badgeText: "Step 2: Qualified Lead",
      badgeClass: "bg-slate-500/20 text-slate-300 border-slate-500/40",
      buttonLabel: "Step 3 Outreach →",
      targetStep: 3,
    };
  };

  // Enriched creators with follow-up intelligence & explicit stage resolution
  const enrichedCreators = useMemo(() => {
    return (creators || []).map((c) => {
      const replyInfo = getCreatorReplyInfo(c);
      const effectiveStatus = (statusOverrides[c.id] || c.status || "").toLowerCase();
      const isPitched = Boolean(pitchSentMap[c.id]) || effectiveStatus === "pitched";
      const isPartnered =
        effectiveStatus === "partnered" ||
        effectiveStatus === "active" ||
        effectiveStatus === "building" ||
        stageMap[c.id]?.step === "section2" ||
        stageMap[c.id]?.step === 7;
      const isRejected =
        effectiveStatus === "rejected" ||
        effectiveStatus === "declined" ||
        effectiveStatus === "archived";
      const isApproved =
        (effectiveStatus === "approved" ||
          effectiveStatus === "qualified" ||
          isPartnered ||
          isPitched ||
          stageMap[c.id]?.step >= 5 ||
          stageMap[c.id]?.step === "section2") &&
        !isRejected;
      const stageInfo = getCreatorPipelineStage(c);
      const stepInfo = getCreatorCurrentStepInfo({ ...c, replyInfo, isApproved, isRejected });

      return {
        ...c,
        status: effectiveStatus || c.status,
        replyInfo,
        stageInfo,
        stepInfo,
        isPitched,
        isPartnered,
        isApproved,
        isRejected,
      };
    });
  }, [creators, realThreads, pitchSentMap, labelOverrides, statusOverrides, stageMap]);

  // Metric counts for filter tabs
  const counts = useMemo(() => {
    return {
      all: enrichedCreators.length,
      step6_pitch: enrichedCreators.filter((c) => c.stageInfo.stageId === "step6_pitch").length,
      approved: enrichedCreators.filter((c) => c.stageInfo.stageId === "approved").length,
      interested: enrichedCreators.filter((c) => c.stageInfo.stageId === "interested").length,
      question: enrichedCreators.filter((c) => c.stageInfo.stageId === "question").length,
      not_interested: enrichedCreators.filter((c) => c.stageInfo.stageId === "not_interested").length,
      rejected: enrichedCreators.filter((c) => c.stageInfo.stageId === "rejected").length,
      awaiting_reply: enrichedCreators.filter((c) => c.stageInfo.stageId === "awaiting_reply").length,
      unsubscribe: enrichedCreators.filter((c) => c.stageInfo.stageId === "unsubscribe").length,
    };
  }, [enrichedCreators]);

  // Filtered creators based on search, status, and platform
  const filteredCreators = useMemo(() => {
    return enrichedCreators.filter((c) => {
      // Platform filter
      if (
        platformFilter !== "all" &&
        (c.platform || "").toLowerCase() !== platformFilter.toLowerCase()
      ) {
        return false;
      }

      // Stage / Status filter
      if (statusFilter !== "all" && c.stageInfo.stageId !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (c.name || c.display_name || "").toLowerCase();
        const handle = (c.handle || "").toLowerCase();
        const email = (c.email || c.email_public || "").toLowerCase();
        const niche = (Array.isArray(c.niche) ? c.niche.join(" ") : c.niche || "").toLowerCase();
        return name.includes(q) || handle.includes(q) || email.includes(q) || niche.includes(q);
      }

      return true;
    });
  }, [enrichedCreators, statusFilter, platformFilter, searchQuery]);

  // Active creator selected for the detailed in-modal studio
  const detailCreator = useMemo(() => {
    if (!selectedDetailCreatorId) return null;
    return enrichedCreators.find((c) => c.id === selectedDetailCreatorId) || creators.find((c) => c.id === selectedDetailCreatorId);
  }, [selectedDetailCreatorId, enrichedCreators, creators]);

  // Complete activity and messages history for the selected detail creator
  const detailCreatorActivities = useMemo(() => {
    if (!detailCreator) return [];
    return getCreatorActivityAndMessages(detailCreator);
  }, [detailCreator, realThreads, pitchSentMap]);

  const [replyText, setReplyText] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  const handleSendDirectReply = async () => {
    if (!detailCreator) return;
    const recipientEmail = detailCreator.email || detailCreator.email_public;
    if (!recipientEmail) {
      if (onNotify) onNotify("warning", "No Email", "Please add a contact email for this creator first.");
      return;
    }
    if (!replyText.trim()) {
      if (onNotify) onNotify("warning", "Empty Message", "Please enter a message to send.");
      return;
    }

    setIsSendingReply(true);
    try {
      const { sendDirectEmail } = await import("../../services/opsApi");
      const subj = replySubject.trim() || `Re: Partnering with Creator Forge - ${detailCreator.name || detailCreator.handle}`;
      await sendDirectEmail(recipientEmail, subj, replyText.trim(), detailCreator.id);
      
      setReplyText("");
      setReplySubject("");
      if (onNotify) {
        onNotify("success", "Email Dispatched", `Your reply was successfully sent to ${recipientEmail}.`);
      }
      if (onSyncImap) {
        onSyncImap();
      }
    } catch (err) {
      console.error("Direct email send failed:", err);
      if (onNotify) {
        onNotify("error", "Send Failed", err.message || "Failed to send email. Check SMTP settings.");
      }
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleCopyEmail = (email, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
    if (onNotify) {
      onNotify("success", "Email Copied", `Copied ${email} to clipboard.`);
    }
  };

  const handleModifyClassification = async (creatorId, newClassification) => {
    setLabelOverrides((prev) => ({ ...prev, [creatorId]: newClassification }));
    try {
      const { updateCreatorDetails } = await import("../../services/opsApi");
      await updateCreatorDetails(creatorId, { reply_classification: newClassification });
    } catch (e) {
      console.warn("[CRM] Failed to persist classification to DB:", e);
    }
    if (onNotify) {
      onNotify("success", "Status Updated", `Lead classification changed to ${newClassification.replace("_", " ")}.`);
    }
  };

  const handleSaveEmail = async (creatorId) => {
    const newEmail = (emailInputs[creatorId] || "").trim();
    if (!newEmail || !newEmail.includes("@")) {
      if (onNotify) onNotify("warning", "Invalid Email", "Please enter a valid email address.");
      return;
    }

    try {
      const { updateCreatorEmail } = await import("../../services/opsApi");
      await updateCreatorEmail(creatorId, newEmail);
    } catch {}

    try {
      const saved = JSON.parse(localStorage.getItem("forge_launch_discovered_creators") || "[]");
      const updated = saved.map((c) => (c.id === creatorId ? { ...c, email: newEmail, email_public: newEmail } : c));
      localStorage.setItem("forge_launch_discovered_creators", JSON.stringify(updated));
    } catch {}

    setEditingEmailId(null);
    if (onNotify) {
      onNotify("success", "Email Saved", `Contact email updated to ${newEmail}.`);
    }
  };

  const handleFindBusinessEmail = async (creator) => {
    setFindingEmailId(creator.id);
    try {
      const { extractApifyEmail } = await import("../../services/opsApi");
      const found = await extractApifyEmail({
        handle: creator.handle,
        platform: creator.platform,
        name: creator.name || creator.display_name,
      });

      if (found && found.email) {
        setEmailInputs((prev) => ({ ...prev, [creator.id]: found.email }));
        handleSaveEmail(creator.id);
        if (onNotify) {
          onNotify("success", "Email Discovered", `Found verified business email: ${found.email}`);
        }
      } else {
        if (onNotify) {
          onNotify("info", "No Email Found", "Scraper completed without public email. Enter address manually.");
        }
      }
    } catch (err) {
      if (onNotify) {
        onNotify("warning", "Lookup Notice", "Could not scrape public email automatically.");
      }
    } finally {
      setFindingEmailId(null);
    }
  };

  const [deletingCreatorId, setDeletingCreatorId] = useState(null);

  const handleDeleteCreator = async (creator, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!creator) return;
    const cName = creator.name || creator.display_name || creator.handle || "Creator";
    if (
      !window.confirm(
        `Are you sure you want to permanently delete ${cName}? All conversation history, email threads, outreach logs, and proposals will be permanently wiped from the database.`
      )
    ) {
      return;
    }
    setDeletingCreatorId(creator.id);
    try {
      const { deleteCreator } = await import("../../services/opsApi");
      const targetId = creator.id || creator.handle;
      const cleanHandle = (creator.handle || "").replace(/^@/, "").toLowerCase();
      const cleanEmail = (creator.email || creator.email_public || "").toLowerCase().trim();

      await deleteCreator(targetId);

      // Clean up localStorage persistence
      try {
        const saved = JSON.parse(localStorage.getItem("forge_launch_discovered_creators") || "[]");
        const updated = saved.filter(
          (c) =>
            c.id !== targetId &&
            c.id !== creator.id &&
            (c.handle || "").replace(/^@/, "").toLowerCase() !== cleanHandle &&
            (!cleanEmail || (c.email || c.email_public || "").toLowerCase().trim() !== cleanEmail)
        );
        localStorage.setItem("forge_launch_discovered_creators", JSON.stringify(updated));

        // Track in deleted IDs
        const deletedIds = JSON.parse(localStorage.getItem("forge_deleted_creator_ids") || "[]");
        if (creator.id && !deletedIds.includes(creator.id)) deletedIds.push(creator.id);
        if (cleanHandle && !deletedIds.includes(cleanHandle)) deletedIds.push(cleanHandle);
        if (creator.handle && !deletedIds.includes(creator.handle)) deletedIds.push(creator.handle);
        localStorage.setItem("forge_deleted_creator_ids", JSON.stringify(deletedIds));
        localStorage.setItem("forge_last_deleted_timestamp", Date.now().toString());
      } catch (e) {
        console.warn("LocalStorage update error on creator delete:", e);
      }

      // Broadcast event for all open tabs & components
      window.dispatchEvent(
        new CustomEvent("forge_creator_deleted", {
          detail: { creatorId: creator.id, handle: creator.handle, email: cleanEmail },
        })
      );

      if (onDeleteCreator) {
        onDeleteCreator(creator.id || creator.handle);
      }
      if (selectedDetailCreatorId === creator.id) {
        setSelectedDetailCreatorId(null);
      }
      if (onNotify) {
        onNotify(
          "success",
          "Creator & Chats Deleted",
          `Permanently deleted ${cName} and all conversation history from the database.`
        );
      }
    } catch (err) {
      console.warn("Delete creator failed:", err);
      if (onNotify) {
        onNotify(
          "error",
          "Deletion Failed",
          err.message || "Failed to delete creator from database."
        );
      }
    } finally {
      setDeletingCreatorId(null);
    }
  };

  const handleExportCSV = () => {
    if (!filteredCreators || filteredCreators.length === 0) return;
    const headers = ["Name", "Handle", "Platform", "Followers", "Email", "Pipeline Stage", "Reply Status", "Approval Status", "Pitched", "Last Snippet"];
    const rows = filteredCreators.map((c) => [
      `"${c.name || c.display_name || ""}"`,
      `"${c.handle || ""}"`,
      `"${c.platform || ""}"`,
      `"${c.followerStr || c.follower_count || ""}"`,
      `"${c.email || c.email_public || ""}"`,
      `"${c.stageInfo.stageName}"`,
      `"${c.replyInfo.classification}"`,
      `"${c.status || "pending"}"`,
      `"${c.isPitched ? "Yes" : "No"}"`,
      `"${(c.replyInfo.snippet || "").replace(/"/g, '""').slice(0, 150)}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `creator_forge_crm_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isPage && !isOpen) return null;

  const crmContent = (
    <div className={`w-full ${isPage ? "rounded-2xl" : "max-w-6xl rounded-2xl max-h-[92vh]"} bg-[#0b0e14] border border-white/[0.12] shadow-2xl flex flex-col overflow-hidden`}>
        {/* Header Titlebar */}
        <div className="bg-[#121620] px-6 py-4 border-b border-white/[0.08] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Creator Outreach & Follow-Up CRM Directory
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                  {enrichedCreators.length} Total Leads
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Track creator interest, review full back-and-forth messages, manage step 6 pitches, and advance co-launch partnerships.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onSyncImap}
              disabled={isSyncingImap}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
              title="Poll Gmail IMAP for latest creator replies"
            >
              <RefreshCw className={`w-3.5 h-3.5 flex-shrink-0 inline-block origin-center ${isSyncingImap ? "animate-spin" : ""}`} />
              <span className="flex-shrink-0">Sync Replies</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex-shrink-0"
              title="Export all lead statuses to CSV"
            >
              <Download className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Export CSV</span>
            </button>

            {!isPage && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* KPI Status Pills */}
        <div className="p-4 bg-[#0e121a] border-b border-white/[0.06] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {[
            { id: "all", label: "All Leads", count: counts.all, color: "text-white", border: "border-white/20", dot: "bg-purple-400" },
            { id: "interested", label: "Interested", count: counts.interested, color: "text-teal-400", border: "border-teal-500/30", dot: "bg-teal-400" },
            { id: "question", label: "Questions", count: counts.question, color: "text-amber-400", border: "border-amber-500/30", dot: "bg-amber-400" },
            { id: "awaiting_reply", label: "Awaiting Reply", count: counts.awaiting_reply, color: "text-blue-400", border: "border-blue-500/30", dot: "bg-blue-400" },
            { id: "unsubscribe", label: "Unsubscribed", count: counts.unsubscribe, color: "text-slate-400", border: "border-slate-500/30", dot: "bg-slate-400" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatusFilter(item.id)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                statusFilter === item.id
                  ? `bg-white/[0.08] ${item.border} shadow-sm ring-1 ring-white/20`
                  : "bg-white/[0.02] border-white/[0.05] hover:border-white/15"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 truncate">
                  {item.dot && <span className={`w-1.5 h-1.5 rounded-full ${item.dot} flex-shrink-0`} />}
                  <span className="truncate">{item.label}</span>
                </span>
                <span className={`text-xs font-mono font-bold ${item.color} ml-1`}>
                  {item.count}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Filter Controls & Search Bar */}
        <div className="p-4 bg-[#0e121a] border-b border-white/[0.06] flex items-center justify-between flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by creator name, handle, email, or niche..."
              className="w-full bg-[#141824] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Platform:
            </span>
            {[
              { id: "all", label: "All" },
              { id: "youtube", label: "YouTube" },
              { id: "instagram", label: "Instagram" },
              { id: "tiktok", label: "TikTok" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatformFilter(p.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  platformFilter === p.id
                    ? "bg-purple-600 text-white border-purple-500"
                    : "bg-[#141824] border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Directory Leads Table / Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {filteredCreators.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs space-y-2">
              <Users className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-400">No creators found matching your filter criteria.</p>
              <p className="text-[11px]">Try adjusting your search terms or reply status filter.</p>
            </div>
          ) : (
            filteredCreators.map((c) => {
              const reply = c.replyInfo;
              const stage = c.stageInfo;
              const email = c.email || c.email_public;
              const isEditingThisEmail = editingEmailId === c.id || (!email && reply.classification === "no_email");

              return (
                <div
                  key={c.id}
                  className={`p-5 sm:p-6 rounded-2xl border transition-all duration-200 flex flex-col gap-4 shadow-xl ${
                    c.isRejected
                      ? "bg-[#141014]/60 border-rose-500/20 opacity-70 hover:opacity-90"
                      : c.stageInfo.stageId === "step6_pitch"
                        ? "bg-gradient-to-r from-[#171328] to-[#121622] border-purple-500/30 hover:border-purple-500/60 shadow-purple-950/10"
                        : c.isApproved
                          ? "bg-gradient-to-r from-[#0f1f1a] to-[#121622] border-emerald-500/30 hover:border-emerald-500/50"
                          : "bg-[#111522]/90 border-white/[0.08] hover:border-white/20 hover:bg-[#141928]"
                  }`}
                >
                  {/* 1. Header Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative flex-shrink-0">
                        <img
                          src={
                            c.avatar ||
                            c.avatar_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(c.handle || "Creator")}&background=6366f1&color=fff`
                          }
                          alt=""
                          className="w-12 h-12 rounded-2xl object-cover border border-white/10 shadow-sm"
                        />
                        <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#0e1117] border border-white/10 shadow-xs">
                          {c.platform?.toLowerCase() === "instagram" ? (
                            <Instagram className="w-2.5 h-2.5 text-pink-400" />
                          ) : c.platform?.toLowerCase() === "tiktok" ? (
                            <Music className="w-2.5 h-2.5 text-cyan-400" />
                          ) : (
                            <Youtube className="w-2.5 h-2.5 text-red-400" />
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-white text-base tracking-tight truncate">
                            {c.name || c.display_name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5 flex-wrap">
                          <span className="text-purple-300 font-medium">@{c.handle?.replace(/^@/, "")}</span>
                          <span>•</span>
                          <span className="text-slate-300 capitalize">{c.platform || "Youtube"}</span>
                          <span>•</span>
                          <span className="text-slate-300 font-semibold">{c.followerStr || c.follower_count || "112K"} followers</span>
                        </div>
                      </div>
                    </div>

                    {/* Stage / AI Classification Badge */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-xs ${stage.badgeClass}`}>
                        <span className={`w-2 h-2 rounded-full ${stage.dotClass} animate-pulse`} />
                        <span>
                          {reply.hasReply
                            ? `AI: ${reply.classification.replace("_", " ").charAt(0).toUpperCase() + reply.classification.replace("_", " ").slice(1)}`
                            : stage.stageName}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* 2. CREATOR PROFILE & AUDIENCE Section */}
                  <div className="p-4 rounded-xl bg-[#090b0e] border border-white/[0.08] space-y-3.5 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-semibold">
                        Creator Profile & Audience
                      </span>
                      <span className="text-xs font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg shadow-xs font-mono">
                        Creator Score: {c.creatorScore || c.score || 75}/100
                      </span>
                    </div>

                    {/* 6 Stats Tiles */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                      <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-center">
                        <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-semibold">Followers</span>
                        <span className="text-xs font-bold text-white">{c.followerStr || c.follower_count || "112K"}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-center">
                        <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-semibold">Engagement</span>
                        <span className="text-xs font-bold text-emerald-400">{c.engagement || "3.9"}%</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-center">
                        <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-semibold">Niche Fit</span>
                        <span className="text-xs font-bold text-purple-300">{c.nicheFit || c.niche_fit || "95% Match"}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-center">
                        <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-semibold">Consistency</span>
                        <span className="text-xs font-bold text-cyan-300">{c.postingConsistency || c.posting_consistency || "Weekly"}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-center">
                        <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-semibold">Authenticity</span>
                        <span className="text-xs font-bold text-blue-300">{c.audienceAuthenticity || c.audience_authenticity || "91%"}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-center">
                        <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-semibold">Commercial</span>
                        <span className="text-xs font-bold text-amber-300">{c.commercialPotential || c.commercial_potential || "Strong"}</span>
                      </div>
                    </div>

                    {/* Bio / Relevant Content snippet */}
                    <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-[9px] text-slate-500 block uppercase tracking-wider mb-1 font-semibold">Relevant Content / Bio</span>
                      <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                        {c.bio ||
                          c.relevantContent ||
                          c.summary ||
                          `Don't just learn AI. Engineer it. Implement it. Welcome to ${c.name || c.display_name || "Creator Forge"}, your bridge from notebooks to production AI.`}
                      </p>
                    </div>

                    {/* Summary Strip */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 border-t border-white/[0.04] flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-blue-400" />
                        <strong className="text-slate-200">Email:</strong> {email || "Not set"}
                      </span>
                      <span className="text-slate-600">|</span>
                      <span className="flex items-center gap-1">
                        <Send className="w-3 h-3 text-cyan-400" />
                        <strong className="text-slate-200">Outreach:</strong> {c.outreach_sent ? "Sent" : "Pending"}
                      </span>
                      <span className="text-slate-600">|</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-purple-400" />
                        <strong className="text-slate-200">Platform:</strong> {c.platform || "Youtube"}
                      </span>
                    </div>
                  </div>

                  {/* 3. Status & AI Classification Analysis Card */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1.5 text-xs shadow-inner">
                    <div className="flex items-center justify-between text-[11px] font-mono flex-wrap gap-2">
                      <span className="text-slate-400">
                        Status:{" "}
                        <strong
                          className={
                            c.stepInfo?.stepNumber === 7
                              ? "text-emerald-300 font-bold"
                              : c.stepInfo?.stepNumber === 6
                              ? "text-purple-300 font-bold"
                              : c.isApproved
                              ? "text-emerald-400 font-bold"
                              : reply.hasReply
                              ? "text-teal-400 font-bold"
                              : reply.classification === "no_email"
                              ? "text-amber-400 font-bold"
                              : "text-blue-400 font-bold"
                          }
                        >
                          {c.stepInfo?.stepNumber === 7
                            ? "Venture Active (Section 2) 🚀"
                            : c.stepInfo?.stepNumber === 6
                            ? "Proposal Pitched (Step 6)"
                            : c.isApproved
                            ? "Lead Approved (Step 5)"
                            : reply.hasReply
                            ? "Reply Received"
                            : reply.classification === "no_email"
                            ? "Email Needed"
                            : "Waiting for Response"}
                        </strong>
                      </span>
                      <span className="text-slate-400">
                        Sentiment:{" "}
                        <strong className="text-purple-300 font-mono font-bold">
                          {c.stepInfo?.stepNumber === 7
                            ? "partnered"
                            : c.stepInfo?.stepNumber === 6
                            ? "pitched"
                            : c.isApproved
                            ? "qualified"
                            : reply.sentiment || "positive"}
                        </strong>
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      <strong className="text-slate-400">Analysis:</strong>{" "}
                      {c.stepInfo?.stepNumber === 7
                        ? "Co-Launch venture is active in Section 2 (Phase 1: Validation). Tracking pre-order presales, traffic milestones, and human approval gates."
                        : c.stepInfo?.stepNumber === 6
                        ? "Opportunity Pitch Deck & 3 SaaS Concepts delivered to creator. Awaiting concept confirmation."
                        : c.isApproved
                        ? "Lead approved by studio. Qualified for Step 5 Audience & Product Synthesis — ready to review tailored concepts."
                        : reply.reasoning ||
                          (reply.hasReply
                            ? "Creator replied to outreach. Awaiting operator review & approval in Step 4 before advancing to Step 5."
                            : "Autonomous outreach message dispatched. Awaiting inbound creator response.")}
                    </p>
                  </div>

                  {/* 4. Action Footer */}
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/[0.06] flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {reply.classification === "interested" && !c.isApproved && (c.stepInfo?.stepNumber < 5) && !c.isRejected && (
                        <button
                          type="button"
                          onClick={() => handleDirectApprove(c.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve Lead</span>
                        </button>
                      )}

                      {!c.isRejected && (
                        <button
                          type="button"
                          onClick={() => handleDirectReject(c.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      )}

                      {!c.isRejected && (
                        <button
                          type="button"
                          onClick={() => {
                            const targetStep = c.stepInfo?.targetStep || 5;
                            if (onClose) onClose();
                            handleOpenStudioForCreator(c, targetStep, c.stepInfo?.buttonLabel);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                            c.stepInfo?.stepNumber === 6
                              ? "bg-purple-600 hover:bg-purple-500 shadow-purple-900/30"
                              : c.stepInfo?.stepNumber === 7
                              ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30"
                              : "bg-purple-600 hover:bg-purple-500 shadow-purple-900/30"
                          }`}
                          title={`Advance to ${c.stepInfo?.stepName || "Studio"}`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{c.stepInfo?.buttonLabel || "Step 5 Product Studio →"}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleDeleteCreator(c, e)}
                        disabled={deletingCreatorId === c.id}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-200 border border-rose-500/25 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                        title="Delete creator and all chats from database"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{deletingCreatorId === c.id ? "Deleting..." : "Delete"}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedDetailCreatorId(c.id)}
                      className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 hover:text-white text-xs font-bold transition-all border border-purple-500/40 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                      <span>View Full Details & Chat History</span>
                      <ChevronRight className="w-3.5 h-3.5 text-purple-300" />
                    </button>
                  </div>

                  {/* Inline Email Address Editor / Finder Drawer */}
                  {isEditingThisEmail && (
                    <div className="p-3.5 rounded-xl bg-[#090c13] border border-purple-500/30 text-xs space-y-2.5 mt-1 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{email ? "Update Creator Contact Email" : "No Email Address Set — Add or Auto-Discover Below"}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingEmailId(null)}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="email"
                          placeholder="e.g. sponsor@creator.com"
                          value={emailInputs[c.id] !== undefined ? emailInputs[c.id] : email || ""}
                          onChange={(e) => setEmailInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          className="bg-[#121622] border border-white/15 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none flex-1 font-mono placeholder:text-slate-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEmail(c.id)}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Email</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFindBusinessEmail(c)}
                          disabled={findingEmailId === c.id}
                          className="px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                        >
                          {findingEmailId === c.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400 inline-block origin-center" />
                          ) : (
                            <Zap className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span>Auto-Find Email</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Selected Creator Detail & Chat History Modal */}
        {detailCreator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-5xl rounded-2xl max-h-[92vh] bg-[#0b0e14] border border-white/[0.15] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
              {/* Modal Top Header */}
              <div className="bg-[#121620] px-6 py-4 border-b border-white/[0.08] flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={
                      detailCreator.avatar ||
                      detailCreator.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(detailCreator.handle || "Creator")}&background=6366f1&color=fff`
                    }
                    alt=""
                    className="w-11 h-11 rounded-xl object-cover border border-white/10 flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-white">{detailCreator.name || detailCreator.display_name}</h3>
                      <span className="text-xs font-mono text-purple-300">@{detailCreator.handle?.replace(/^@/, "")}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${detailCreator.stageInfo.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${detailCreator.stageInfo.dotClass}`} />
                        <span>{detailCreator.stageInfo.stageName}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
                      <span>{detailCreator.platform} • {detailCreator.followerStr || detailCreator.follower_count} Followers</span>
                      <span>•</span>
                      <span className="text-purple-300 font-semibold">{detailCreator.niche || "Creator Economy"}</span>
                      <span>•</span>
                      <span className="font-mono text-emerald-300">{detailCreator.email || detailCreator.email_public || "No email"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!detailCreator.isRejected && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetStep = detailCreator.stepInfo?.targetStep || 5;
                        setSelectedDetailCreatorId(null);
                        if (onClose) onClose();
                        handleOpenStudioForCreator(detailCreator, targetStep, detailCreator.stepInfo?.buttonLabel);
                      }}
                      className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                      <span>{detailCreator.stepInfo?.buttonLabel || "Open Step 5 Product Studio →"}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedDetailCreatorId(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Close Modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Visual Pipeline Progress Stepper */}
              <div className="px-6 py-3.5 bg-[#0a0d14] border-b border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Live Pipeline Progress
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${detailCreator.stepInfo?.badgeClass || "bg-purple-500/20 text-purple-300 border-purple-500/40"}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      <span>{detailCreator.stepInfo?.stepName || "Step 5: Audience & 3 Product Ideas"}</span>
                    </span>
                  </div>
                  {stageMap[detailCreator.id]?.updatedAt && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      Last action: {new Date(stageMap[detailCreator.id].updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {PIPELINE_STEPS.map((step) => {
                    const currentStepNum = detailCreator.stepInfo?.stepNumber || 5;
                    const isPassed = currentStepNum > step.num;
                    const isCurrent = currentStepNum === step.num;
                    return (
                      <div
                        key={step.num}
                        onClick={() => {
                          setSelectedDetailCreatorId(null);
                          if (onClose) onClose();
                          handleOpenStudioForCreator(detailCreator, step.num, step.title);
                        }}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer group ${
                          isCurrent
                            ? "bg-purple-950/40 border-purple-500 ring-1 ring-purple-500/50 shadow-md"
                            : isPassed
                            ? "bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60"
                            : "bg-white/[0.02] border-white/[0.06] hover:border-white/20 opacity-60"
                        }`}
                        title={`Click to jump to ${step.title}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center ${
                              isCurrent
                                ? "bg-purple-600 text-white font-bold"
                                : isPassed
                                ? "bg-emerald-500/30 text-emerald-300"
                                : "bg-white/10 text-slate-400"
                            }`}
                          >
                            {isPassed ? "✓" : step.num}
                          </span>
                          {isCurrent && (
                            <span className="text-[8px] font-extrabold uppercase px-1 rounded bg-purple-500/30 text-purple-200">
                              Active
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] font-bold truncate ${isCurrent ? "text-purple-200" : isPassed ? "text-emerald-300" : "text-slate-400 group-hover:text-slate-200"}`}>
                          {step.title}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Body: 2 Columns */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid lg:grid-cols-12 gap-6">
                  {/* Left Column (5 cols): 3 Engineered Software Concepts & Terms */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="p-4 rounded-xl bg-[#121622] border border-white/[0.08] space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          <span>Engineered Software Concepts</span>
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          3 Concepts Tailored
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {(detailCreator.productConcepts && detailCreator.productConcepts.length > 0 ? detailCreator.productConcepts : [
                          { id: 'c1', name: `${detailCreator.name?.split(' ')[0] || 'Creator'} OS`, tagline: 'Automated workspace SaaS', problem: 'Fragmented coaching workflows and client management.', pricing: '$29/mo', opportunityScore: 94 },
                          { id: 'c2', name: `${detailCreator.name?.split(' ')[0] || 'Creator'} Flow AI`, tagline: 'Autonomous AI assistant pipeline', problem: 'Time-consuming manual video workout programming.', pricing: '$49/mo', opportunityScore: 91 },
                          { id: 'c3', name: `${detailCreator.name?.split(' ')[0] || 'Creator'} Pro Hub`, tagline: 'Private template & tools community', problem: 'Monetizing exclusive community content and resources.', pricing: '$79/mo', opportunityScore: 88 },
                        ]).map((concept, idx) => {
                          return (
                            <div
                              key={concept.id || idx}
                              className="p-3.5 rounded-xl border border-white/[0.08] bg-black/40 space-y-2 hover:border-white/20 transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black flex items-center justify-center">
                                    #{idx + 1}
                                  </span>
                                  <span>{concept.name}</span>
                                </span>
                                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{concept.pricing}</span>
                              </div>
                              <p className="text-[11px] text-purple-300 font-medium">{concept.tagline}</p>
                              {concept.problem && (
                                <p className="text-[10px] text-slate-300 leading-relaxed">
                                  <strong className="text-slate-400">Solves:</strong> {concept.problem}
                                </p>
                              )}
                              {concept.keyFeatures && (
                                <div className="pt-1.5 border-t border-white/[0.04] text-[10px] text-slate-400 space-y-1">
                                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Features:</span>
                                  <ul className="space-y-0.5">
                                    {concept.keyFeatures.slice(0, 2).map((feat, fi) => (
                                      <li key={fi} className="flex items-center gap-1 text-slate-300">
                                        <span className="text-emerald-400 text-[10px]">•</span> {feat}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right Column (7 cols): Full Chronological Activity & Email Stream */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="rounded-xl bg-[#121622] border border-white/[0.08] overflow-hidden">
                      <div className="p-3.5 bg-[#161a28] border-b border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-white">
                          <MessageSquare className="w-4 h-4 text-purple-400" />
                          <span>Full Message History & Admin Activities</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400">
                          {detailCreatorActivities.length} Events Logged
                        </span>
                      </div>

                      <div className="p-4 space-y-3 max-h-[480px] overflow-y-auto">
                        {detailCreatorActivities.length > 0 ? (
                          detailCreatorActivities.map((event, idx) => {
                            const isInbound = event.is_inbound;
                            const isDecision = event.type === "admin_decision";

                            if (isDecision) {
                              return (
                                <div
                                  key={event.id || idx}
                                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                                    event.badgeColor === "emerald"
                                      ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-200"
                                      : "bg-rose-950/20 border-rose-500/40 text-rose-200"
                                  }`}
                                >
                                  <div className="flex items-center justify-between font-bold text-[11px]">
                                    <span className="flex items-center gap-1.5">
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      <span>{event.label}</span>
                                    </span>
                                    <span className="text-slate-500 font-mono text-[10px]">
                                      {event.timestamp ? new Date(event.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "Logged"}
                                    </span>
                                  </div>
                                  <p className="text-[11px] opacity-90">{event.body}</p>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={event.id || idx}
                                className={`p-4 rounded-xl border text-xs space-y-2.5 shadow-md ${
                                  isInbound
                                    ? "bg-gradient-to-br from-emerald-950/20 via-[#0e1612] to-[#090b0e] border-emerald-500/30 text-emerald-300"
                                    : "bg-[#161a26] border-white/[0.08] text-slate-200"
                                }`}
                              >
                                <div className="flex items-center justify-between text-[11px] border-b border-white/[0.06] pb-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {isInbound ? (
                                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-[9px] border border-emerald-500/40">
                                        {(detailCreator.name || event.sender || "C").slice(0, 2).toUpperCase()}
                                      </div>
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-[9px]">
                                        CF
                                      </div>
                                    )}
                                    <span className="font-bold text-white text-xs">
                                      {isInbound ? (detailCreator.name || event.sender) : "Creator Forge Studio Team (Admin)"}
                                    </span>
                                    {isInbound && (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-300 font-mono flex items-center gap-1 font-bold">
                                        <span>✨ Inbound Response</span>
                                      </span>
                                    )}
                                    {!isInbound && (
                                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-bold uppercase tracking-wider">
                                        {event.label || "Outreach Email"}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-slate-400 font-mono text-[10px]">
                                    {event.timestamp ? new Date(event.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "Recently"}
                                  </span>
                                </div>

                                {event.subject && (
                                  <p className="text-emerald-400 font-mono text-xs">
                                    <strong className="text-emerald-400 font-bold">Subject:</strong> {event.subject}
                                  </p>
                                )}

                                <p className="text-slate-200 whitespace-pre-wrap leading-relaxed font-mono bg-black/40 p-3 rounded-lg border border-white/[0.04] text-[11px]">
                                  {event.body}
                                </p>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-8 text-center text-xs text-slate-400 space-y-1 italic">
                            <Mail className="w-6 h-6 text-slate-600 mx-auto" />
                            <p>No email messages or admin activities logged yet for this creator.</p>
                            <p className="text-[10px] text-slate-500">Replies synced via IMAP will automatically show up here.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Direct Reply Composer */}
                    <div className="p-4 rounded-xl bg-[#121622] border border-white/[0.08] space-y-3 shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5 text-purple-400" />
                          <span>Direct Email Reply Composer</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Sending as Studio Team via SMTP
                        </span>
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder={`Subject: Re: Partnering with Creator Forge - ${detailCreator.name || detailCreator.handle}`}
                          value={replySubject}
                          onChange={(e) => setReplySubject(e.target.value)}
                          className="w-full bg-[#0b0e14] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                        />

                        <textarea
                          rows={4}
                          placeholder={`Hi ${detailCreator.name?.split(" ")[0] || "there"}, thanks for replying! We'd love to partner with you on building...`}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="w-full bg-[#0b0e14] border border-white/10 rounded-xl p-3.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-sans leading-relaxed resize-none"
                        />
                      </div>

                      {/* Quick Suggestion Chips */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1">Templates:</span>
                        {[
                          "Excited to partner! Let's review concept #1",
                          "Here are the 70/30 revenue share terms",
                          "Can we schedule a quick 15-min demo call?",
                        ].map((suggestion, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => {
                              setReplyText((prev) => (prev ? `${prev}\n\n${suggestion}` : suggestion));
                            }}
                            className="text-[10px] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-white/[0.06] transition-all cursor-pointer truncate max-w-[220px]"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                        <span className="text-[11px] font-mono text-emerald-400">
                          Recipient: {detailCreator.email || detailCreator.email_public || "No email set"}
                        </span>
                        <button
                          type="button"
                          onClick={handleSendDirectReply}
                          disabled={isSendingReply || (!detailCreator.email && !detailCreator.email_public)}
                          className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          {isSendingReply ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>{isSendingReply ? "Sending Email..." : "Send Reply Now"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-[#0e121a] border-t border-white/[0.06] flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedDetailCreatorId(null)}
                  className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer"
                >
                  Close Modal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-[#0e121a] border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span>
              {detailCreator ? `Viewing conversation details & admin activities for ${detailCreator.name || detailCreator.display_name}` : `Showing ${filteredCreators.length} of ${enrichedCreators.length} leads in Creator Forge CRM`}
            </span>
          </div>
          {!isPage && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer"
            >
              Close Directory
            </button>
          )}
        </div>
      </div>
  );

  if (isPage) {
    return (
      <div className="w-full animate-in fade-in space-y-6">
        {crmContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      {crmContent}
    </div>
  );
}
