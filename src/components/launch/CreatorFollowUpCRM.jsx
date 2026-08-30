import { useState, useMemo } from "react";
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
} from "lucide-react";

export default function CreatorFollowUpCRM({
  isOpen,
  onClose,
  creators = [],
  realThreads = [],
  pitchSentMap = {},
  onSelectCreator,
  onSyncImap,
  isSyncingImap = false,
  onOpenDecisionModal,
  onNotify,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [copiedEmail, setCopiedEmail] = useState(null);

  // Local editable overrides for labels and emails
  const [labelOverrides, setLabelOverrides] = useState({});
  const [editingEmailId, setEditingEmailId] = useState(null);
  const [emailInputs, setEmailInputs] = useState({});
  const [findingEmailId, setFindingEmailId] = useState(null);
  const [selectedDetailCreatorId, setSelectedDetailCreatorId] = useState(null);

  // Helper to extract thread messages for a creator
  const getCreatorThreadMessages = (c) => {
    if (!c) return [];
    const email = (c.email || c.email_public || "").toLowerCase().trim();
    const handle = (c.handle || "").toLowerCase().replace(/^@/, "").trim();
    const cId = c.id;

    const matchedThreads = (realThreads || []).filter((t) => {
      if (!t) return false;
      if (t.creator_id && cId && t.creator_id === cId) return true;
      if (handle && t.creator_handle && t.creator_handle.toLowerCase().replace(/^@/, "").trim() === handle) return true;
      if (email && t.creator_email && t.creator_email.toLowerCase().trim() === email) return true;
      return false;
    });

    let msgs = [];
    matchedThreads.forEach((t) => {
      (t.messages || []).forEach((m) => msgs.push(m));
    });

    msgs.sort((a, b) => new Date(b.received_at || b.sent_at || 0) - new Date(a.received_at || a.sent_at || 0));
    return msgs;
  };

  // Helper to extract reply classification and snippet
  const getCreatorReplyInfo = (c) => {
    const email = (c.email || c.email_public || "").toLowerCase().trim();
    const handle = (c.handle || "").toLowerCase().replace(/^@/, "").trim();
    const cId = c.id;

    // Check database threads
    const matchedThreads = (realThreads || []).filter((t) => {
      if (!t) return false;
      if (t.creator_id && cId && t.creator_id === cId) return true;
      if (handle && t.creator_handle && t.creator_handle.toLowerCase().replace(/^@/, "").trim() === handle) return true;
      if (email && t.creator_email && t.creator_email.toLowerCase().trim() === email) return true;
      return false;
    });

    let inboundMsgs = [];
    matchedThreads.forEach((t) => {
      (t.messages || []).forEach((m) => {
        if (m.is_inbound || m.direction === "inbound") {
          inboundMsgs.push(m);
        }
      });
    });

    // Sort newest first
    inboundMsgs.sort((a, b) => new Date(b.received_at || 0) - new Date(a.received_at || 0));

    // Overridden classification check
    const overriddenCls = labelOverrides[c.id];

    if (inboundMsgs.length > 0) {
      const latest = inboundMsgs[0];
      const cls = overriddenCls || (latest.ai_classification || c.replyClassification || c.reply_classification || "interested").toLowerCase();
      return {
        hasReply: true,
        classification: cls,
        snippet: latest.body || "",
        subject: latest.subject || "Reply Received",
        time: latest.received_at ? new Date(latest.received_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recently",
        totalInbound: inboundMsgs.length,
      };
    }

    if (c.hasReplied || c.replyClassification || c.reply_classification || overriddenCls) {
      const cls = overriddenCls || (c.replyClassification || c.reply_classification || "interested").toLowerCase();
      return {
        hasReply: true,
        classification: cls,
        snippet: c.replySnippet || c.last_message || "Creator responded to outreach.",
        subject: "Reply Logged",
        time: "Logged",
        totalInbound: 1,
      };
    }

    if (!email || !email.includes("@")) {
      return {
        hasReply: false,
        classification: overriddenCls || "no_email",
        snippet: "No verified email address found yet.",
        subject: "Missing Contact",
        time: "-",
        totalInbound: 0,
      };
    }

    return {
      hasReply: false,
      classification: overriddenCls || "awaiting_reply",
      snippet: "Outreach email sent. Awaiting creator reply.",
      subject: "Awaiting Reply",
      time: "-",
      totalInbound: 0,
    };
  };

  // Enriched creators with follow-up intelligence
  const enrichedCreators = useMemo(() => {
    return (creators || []).map((c) => {
      const replyInfo = getCreatorReplyInfo(c);
      const isPitched = Boolean(pitchSentMap[c.id]);
      const isRejected =
        (c.status || "").toLowerCase() === "rejected" ||
        (c.status || "").toLowerCase() === "declined" ||
        (c.status || "").toLowerCase() === "archived";
      const isApproved =
        (c.status || "").toLowerCase() === "approved" && !isRejected;

      return {
        ...c,
        replyInfo,
        isPitched,
        isApproved,
        isRejected,
      };
    });
  }, [creators, realThreads, pitchSentMap, labelOverrides]);

  // Metric counts
  const counts = useMemo(() => {
    return {
      all: enrichedCreators.length,
      interested: enrichedCreators.filter(
        (c) => c.replyInfo.classification === "interested" && !c.isRejected,
      ).length,
      question: enrichedCreators.filter(
        (c) => c.replyInfo.classification === "question" && !c.isRejected,
      ).length,
      not_interested: enrichedCreators.filter(
        (c) =>
          c.replyInfo.classification === "not_interested" || c.isRejected,
      ).length,
      rejected: enrichedCreators.filter((c) => c.isRejected).length,
      unsubscribe: enrichedCreators.filter(
        (c) => c.replyInfo.classification === "unsubscribe",
      ).length,
      awaiting_reply: enrichedCreators.filter(
        (c) =>
          c.replyInfo.classification === "awaiting_reply" && !c.isRejected,
      ).length,
      approved: enrichedCreators.filter((c) => c.isApproved).length,
      pitched: enrichedCreators.filter((c) => c.isPitched && !c.isRejected)
        .length,
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

      // Status filter
      if (
        statusFilter === "interested" &&
        c.replyInfo.classification !== "interested"
      )
        return false;
      if (
        statusFilter === "question" &&
        c.replyInfo.classification !== "question"
      )
        return false;
      if (
        statusFilter === "not_interested" &&
        c.replyInfo.classification !== "not_interested" &&
        !c.isRejected
      )
        return false;
      if (
        statusFilter === "unsubscribe" &&
        c.replyInfo.classification !== "unsubscribe"
      )
        return false;
      if (
        statusFilter === "awaiting_reply" &&
        c.replyInfo.classification !== "awaiting_reply"
      )
        return false;
      if (statusFilter === "approved" && !c.isApproved) return false;
      if (statusFilter === "rejected" && !c.isRejected) return false;
      if (statusFilter === "pitched" && !c.isPitched) return false;

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

  const handleCopyEmail = (email, e) => {
    e.stopPropagation();
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
    if (onNotify) {
      onNotify("success", "Email Copied", `Copied ${email} to clipboard.`);
    }
  };

  const handleModifyClassification = (creatorId, newClassification) => {
    setLabelOverrides((prev) => ({ ...prev, [creatorId]: newClassification }));
    try {
      const saved = JSON.parse(localStorage.getItem("forge_launch_discovered_creators") || "[]");
      const updated = saved.map((c) => (c.id === creatorId ? { ...c, replyClassification: newClassification, reply_classification: newClassification } : c));
      localStorage.setItem("forge_launch_discovered_creators", JSON.stringify(updated));
    } catch {}
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

  const handleExportCSV = () => {
    if (!filteredCreators || filteredCreators.length === 0) return;
    const headers = ["Name", "Handle", "Platform", "Followers", "Email", "Reply Status", "Approval Status", "Pitched", "Last Snippet"];
    const rows = filteredCreators.map((c) => [
      `"${c.name || c.display_name || ""}"`,
      `"${c.handle || ""}"`,
      `"${c.platform || ""}"`,
      `"${c.followerStr || c.follower_count || ""}"`,
      `"${c.email || c.email_public || ""}"`,
      `"${c.replyInfo.classification}"`,
      `"${c.status || "pending"}"`,
      `"${c.isPitched ? "Yes" : "No"}"`,
      `"${(c.replyInfo.snippet || "").replace(/"/g, '""').slice(0, 150)}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `creator_forge_outreach_crm_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const detailCreator = useMemo(() => {
    if (!selectedDetailCreatorId) return null;
    return enrichedCreators.find((c) => c.id === selectedDetailCreatorId) || creators.find((c) => c.id === selectedDetailCreatorId);
  }, [selectedDetailCreatorId, enrichedCreators, creators]);

  const detailCreatorMsgs = useMemo(() => {
    if (!detailCreator) return [];
    return getCreatorThreadMessages(detailCreator);
  }, [detailCreator, realThreads]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-6xl rounded-2xl bg-[#0b0e14] border border-white/[0.12] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
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
                Manage contact info, update lead status, review inbound creator replies, and monitor co-founder milestones.
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

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selected Creator Detail View (Standalone in CRM) */}
        {detailCreator ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Navigation & Profile Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div className="flex items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => setSelectedDetailCreatorId(null)}
                  className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Back to Directory</span>
                </button>
                <img
                  src={
                    detailCreator.avatar ||
                    detailCreator.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(detailCreator.handle || "Creator")}&background=6366f1&color=fff`
                  }
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover border border-white/10 flex-shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-white">{detailCreator.name || detailCreator.display_name}</h3>
                    <span className="text-xs font-mono text-purple-300">@{detailCreator.handle?.replace(/^@/, '')}</span>
                    {detailCreator.isApproved && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Approved
                      </span>
                    )}
                    {detailCreator.isRejected && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        Rejected
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                    <span>{detailCreator.platform} • {detailCreator.followerStr || detailCreator.follower_count} Followers</span>
                    <span>•</span>
                    <span className="text-purple-300 font-semibold">{detailCreator.niche || "Creator Economy"}</span>
                    <span>•</span>
                    <span className="font-mono text-emerald-300">{detailCreator.email || detailCreator.email_public || "No email"}</span>
                  </div>
                </div>
              </div>

              {/* Standalone Decision Actions */}
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                {!detailCreator.isRejected && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenDecisionModal) {
                        onOpenDecisionModal(detailCreator, "reject");
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Reject Lead</span>
                  </button>
                )}

                {!detailCreator.isApproved && !detailCreator.isRejected && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenDecisionModal) {
                        onOpenDecisionModal(detailCreator, "approve");
                      }
                    }}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Approve & Accept Lead</span>
                  </button>
                )}

                {detailCreator.isApproved && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onSelectCreator) {
                        onSelectCreator(detailCreator.id, 6);
                      }
                    }}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Open Step 6 Pitch Studio →</span>
                  </button>
                )}
              </div>
            </div>

            {/* Main Detail Grid: Profile & Concepts (Left) vs. Conversation Stream (Right) */}
            <div className="grid lg:grid-cols-12 gap-6">
              {/* Left Column (5 cols): Creator Insights & 3 Concepts */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-xl bg-[#121622] border border-white/[0.08] space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Audience & Opportunity Fit</span>
                  </h4>
                  <div className="text-xs text-slate-300 space-y-2">
                    <p><strong>Niche Category:</strong> {detailCreator.niche || "Creator"}</p>
                    <p><strong>Audience Scale:</strong> {detailCreator.followerStr || detailCreator.follower_count || "100k+"} followers on {detailCreator.platform}</p>
                    <p><strong>Commercial Model:</strong> 50/50 net recurring revenue split with zero upfront capital required.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#121622] border border-white/[0.08] space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Engineered Software Concepts</span>
                  </h4>
                  <div className="space-y-2.5">
                    {(detailCreator.productConcepts && detailCreator.productConcepts.length > 0 ? detailCreator.productConcepts : [
                      { name: `${detailCreator.name?.split(' ')[0] || 'Creator'} OS`, tagline: 'Automated workspace SaaS', pricing: '$29-$79/mo' },
                      { name: `${detailCreator.name?.split(' ')[0] || 'Creator'} Flow AI`, tagline: 'Autonomous AI assistant pipeline', pricing: '$49/mo' },
                      { name: `${detailCreator.name?.split(' ')[0] || 'Creator'} Pro Hub`, tagline: 'Private template & tools community', pricing: '$99/mo' },
                    ]).map((concept, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-black/40 border border-white/[0.06] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">#{idx + 1} {concept.name}</span>
                          <span className="text-[10px] font-mono font-bold text-emerald-400">{concept.pricing}</span>
                        </div>
                        <p className="text-[11px] text-purple-200">{concept.tagline}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column (7 cols): Full Conversation History */}
              <div className="lg:col-span-7 space-y-4">
                <div className="rounded-xl bg-[#121622] border border-white/[0.08] overflow-hidden">
                  <div className="p-3.5 bg-[#161a28] border-b border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <MessageSquare className="w-4 h-4 text-purple-400" />
                      <span>Direct Email & Reply Stream</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">
                      {detailCreatorMsgs.length} Messages Logged
                    </span>
                  </div>

                  <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">
                    {detailCreatorMsgs.length > 0 ? (
                      detailCreatorMsgs.map((msg, idx) => {
                        const isFromCreator = !/partnerships@creatorforge\.com/i.test(msg.from_address || msg.sender || "");
                        return (
                          <div
                            key={msg.id || idx}
                            className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                              isFromCreator
                                ? "bg-purple-950/20 border-purple-500/40 ml-4"
                                : "bg-white/[0.02] border-white/[0.06] mr-4"
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white">
                                  {isFromCreator ? (detailCreator.name || msg.from_address) : "Creator Forge Studio Team"}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  isFromCreator ? "bg-pink-500/20 text-pink-300" : "bg-emerald-500/20 text-emerald-300"
                                }`}>
                                  {isFromCreator ? "Creator Reply" : "Outbound Message"}
                                </span>
                              </div>
                              <span className="text-slate-500 font-mono text-[10px]">
                                {msg.received_at ? new Date(msg.received_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "Recently"}
                              </span>
                            </div>
                            {msg.subject && (
                              <p className="text-slate-400 font-semibold text-[11px]">
                                Subject: {msg.subject}
                              </p>
                            )}
                            <p className="text-slate-200 whitespace-pre-wrap leading-relaxed font-mono bg-black/40 p-2.5 rounded-lg border border-white/[0.04]">
                              {msg.body}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-400 space-y-1 italic">
                        <Mail className="w-6 h-6 text-slate-600 mx-auto" />
                        <p>No email replies logged yet for this creator.</p>
                        <p className="text-[10px] text-slate-500">Replies synced via IMAP will automatically show up here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Status Pills */}
            <div className="p-4 bg-[#0e121a] border-b border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {[
                { id: "all", label: "All Leads", count: enrichedCreators.length, color: "text-white", border: "border-white/20", dot: "bg-purple-400" },
                { id: "interested", label: "Interested", count: counts.interested, color: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-400" },
                { id: "question", label: "Questions", count: counts.question, color: "text-amber-400", border: "border-amber-500/30", dot: "bg-amber-400" },
                { id: "not_interested", label: "Not Interested", count: counts.not_interested, color: "text-red-400", border: "border-red-500/30", dot: "bg-red-400" },
                { id: "rejected", label: "Rejected", count: counts.rejected, color: "text-rose-400", border: "border-rose-500/30", dot: "bg-rose-400" },
                { id: "unsubscribe", label: "Unsubscribed", count: counts.unsubscribe, color: "text-slate-400", border: "border-slate-500/30", dot: "bg-slate-400" },
                { id: "awaiting_reply", label: "Awaiting", count: counts.awaiting_reply, color: "text-blue-400", border: "border-blue-500/30", dot: "bg-blue-400" },
                { id: "pitched", label: "Pitched", count: counts.pitched, color: "text-purple-400", border: "border-purple-500/30", dot: "bg-purple-400" },
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
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                      {item.dot && <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />}
                      <span>{item.label}</span>
                    </span>
                    <span className={`text-xs font-mono font-bold ${item.color}`}>
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
            <div className="flex-1 overflow-y-auto p-4">
              {filteredCreators.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs space-y-2">
                  <Users className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="font-semibold text-slate-400">No creators found matching your filter criteria.</p>
                  <p className="text-[11px]">Try adjusting your search terms or reply status filter.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCreators.map((c) => {
                    const reply = c.replyInfo;
                    const email = c.email || c.email_public;
                    const isEditingThisEmail = editingEmailId === c.id || (!email && reply.classification === "no_email");

                    return (
                      <div
                        key={c.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col gap-3 ${
                          c.isRejected
                            ? "bg-red-950/10 border-red-500/20 opacity-60"
                            : c.isApproved
                              ? "bg-emerald-950/15 border-emerald-500/30 hover:border-emerald-500/50"
                              : "bg-[#121622] border-white/[0.08] hover:border-white/20"
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Creator Identity */}
                          <div className="flex items-center gap-3 min-w-[220px]">
                            <img
                              src={
                                c.avatar ||
                                c.avatar_url ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(c.handle || "Creator")}&background=6366f1&color=fff`
                              }
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-white text-xs truncate">
                                  {c.name || c.display_name}
                                </h4>
                                {c.isApproved && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                                    Approved
                                  </span>
                                )}
                                {c.isRejected && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-red-500/20 text-red-300 border border-red-500/40 uppercase">
                                    Rejected
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                <span className="font-mono text-purple-300">@{c.handle?.replace(/^@/, "")}</span>
                                <span>•</span>
                                <span>{c.platform}</span>
                                <span>•</span>
                                <span>{c.followerStr || c.follower_count}</span>
                              </div>
                            </div>
                          </div>

                          {/* Email Address Column */}
                          <div className="flex items-center gap-2 min-w-[200px]">
                            {email ? (
                              <div className="flex items-center gap-1.5 bg-[#090b0e] px-2.5 py-1 rounded-lg border border-white/10">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-xs font-mono text-slate-200 truncate max-w-[180px]">
                                  {email}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyEmail(email, { stopPropagation: () => {} })}
                                  className="p-1 hover:text-white text-slate-400 cursor-pointer"
                                  title="Copy Email"
                                >
                                  {copiedEmail === email ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingEmailId(editingEmailId === c.id ? null : c.id)}
                                  className="p-1 hover:text-white text-slate-400 cursor-pointer"
                                  title="Edit Email"
                                >
                                  <Edit2 className="w-3 h-3 text-purple-400" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingEmailId(c.id)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/20 transition-colors cursor-pointer"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Add / Find Email</span>
                              </button>
                            )}
                          </div>

                          {/* Classification & Latest Reply Snippet */}
                          <div className="flex-1 min-w-[200px] bg-[#090b0e] p-2.5 rounded-lg border border-white/[0.05] space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Status:
                                </span>
                                <select
                                  value={reply.classification}
                                  onChange={(e) => handleModifyClassification(c.id, e.target.value)}
                                  className={`text-xs font-bold bg-transparent border-0 focus:outline-none cursor-pointer ${
                                    reply.classification === "interested"
                                      ? "text-emerald-400"
                                      : reply.classification === "question"
                                        ? "text-amber-400"
                                        : reply.classification === "not_interested" || reply.classification === "rejected"
                                          ? "text-red-400"
                                          : reply.classification === "pitched"
                                            ? "text-purple-400"
                                            : "text-slate-400"
                                  }`}
                                >
                                  <option value="interested" className="bg-[#161a23] text-emerald-400">
                                    Interested
                                  </option>
                                  <option value="question" className="bg-[#161a23] text-amber-400">
                                    Question / Info
                                  </option>
                                  <option value="pitched" className="bg-[#161a23] text-purple-400">
                                    Pitched
                                  </option>
                                  <option value="not_interested" className="bg-[#161a23] text-red-400">
                                    Not Interested
                                  </option>
                                  <option value="rejected" className="bg-[#161a23] text-rose-400">
                                    Rejected
                                  </option>
                                  <option value="unsubscribe" className="bg-[#161a23] text-slate-400">
                                    Unsubscribe
                                  </option>
                                  <option value="awaiting_reply" className="bg-[#161a23] text-blue-300">
                                    Awaiting Reply
                                  </option>
                                  <option value="no_email" className="bg-[#161a23] text-amber-400">
                                    No Email
                                  </option>
                                  <option value="other" className="bg-[#161a23] text-indigo-300">
                                    Other
                                  </option>
                                </select>
                              </div>

                              {reply.time !== "-" && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {reply.time}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-300 line-clamp-1 italic font-sans">
                              "{reply.snippet}"
                            </p>
                          </div>

                          {/* Action Controls */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {reply.classification === "interested" && !c.isApproved && !c.isRejected && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onOpenDecisionModal) {
                                    onOpenDecisionModal(c, "approve");
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve & Accept</span>
                              </button>
                            )}

                            {!c.isRejected && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onOpenDecisionModal) {
                                    onOpenDecisionModal(c, "reject");
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                                title="Reject and archive lead"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedDetailCreatorId(c.id)}
                              className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white text-xs font-bold transition-all border border-white/10 flex items-center gap-1 cursor-pointer"
                            >
                              <span>Open Details</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Inline Email Address Editor / Finder in CRM */}
                        {isEditingThisEmail && (
                          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-amber-300">
                                {email ? "Update Contact Email" : "No Email Address Found — Add Below"}
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingEmailId(null)}
                                className="text-[10px] text-slate-400 hover:text-white"
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
                                className="bg-[#090b0e] border border-purple-500/50 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none flex-1 font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEmail(c.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1 flex-shrink-0"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Save Email</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFindBusinessEmail(c)}
                                disabled={findingEmailId === c.id}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer flex-shrink-0 disabled:opacity-50"
                              >
                                {findingEmailId === c.id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400 flex-shrink-0 inline-block origin-center" />
                                ) : (
                                  <Zap className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                )}
                                <span>Find Business Email</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="p-4 bg-[#0e121a] border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span>
              {detailCreator ? `Viewing conversation details for ${detailCreator.name || detailCreator.display_name}` : `Showing ${filteredCreators.length} of ${enrichedCreators.length} leads in Creator Forge CRM`}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer"
          >
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
}
