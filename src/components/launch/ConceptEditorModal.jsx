import React, { useState } from "react";
import {
  X,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Palette,
  Sliders,
  Image,
  DollarSign,
  Users,
  Target,
  Layers,
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import { BRAND_COLORS } from "./DynamicConceptMockup";

/**
 * ConceptEditorModal
 * Allows full inline/modal editing of every field in a product concept:
 * Name, Tagline, Brand Color, Features, Pricing, Mockup Type, Metrics, and Audience Evidence.
 */
export default function ConceptEditorModal({
  isOpen,
  concept,
  conceptIndex = 0,
  creator,
  onClose,
  onSave
}) {
  if (!isOpen || !concept) return null;

  const [formData, setFormData] = useState({
    id: concept.id || `concept_${Date.now()}`,
    name: concept.name || "",
    tagline: concept.tagline || "",
    opportunityScore: concept.opportunityScore || 95,
    brandColor: concept.brandColor || BRAND_COLORS[conceptIndex % BRAND_COLORS.length].hex,
    mockupType: concept.mockupType || (conceptIndex === 0 ? "saas_os" : conceptIndex === 1 ? "ai_copilot" : "knowledge_hub"),
    customImageUrl: concept.customImageUrl || concept.imageUrl || "",
    customer: concept.customer || "",
    problem: concept.problem || "",
    audienceEvidence: concept.audienceEvidence || concept.rationale || "",
    pricing: concept.pricing || "$29/mo Starter • $79/mo Pro",
    revenueModel: concept.revenueModel || "SaaS Subscription • 50/50 Revenue Share",
    competition: concept.competition || "",
    mvpDifficulty: concept.mvpDifficulty || "Low (2 weeks)",
    demographicAlignment: concept.demographicAlignment || "24-42 Yrs • High-income digital practitioners",
    keyFeatures: Array.isArray(concept.keyFeatures) && concept.keyFeatures.length > 0
      ? [...concept.keyFeatures]
      : ["Automated Core Workflow", "Curated Preset & Template Library", "Real-Time Analytics Dashboard", "One-Click Digital Delivery"],
    mockup: {
      appUrl: concept.mockup?.appUrl || `${(concept.name || "app").toLowerCase().replace(/\s+/g, "")}.app`,
      primaryMetric: concept.mockup?.primaryMetric || "$22.5K MRR",
      activeMetric: concept.mockup?.activeMetric || "850",
      efficiencyMetric: concept.mockup?.efficiencyMetric || "94%",
    }
  });

  const [newFeatureText, setNewFeatureText] = useState("");

  const handleTextChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleMockupChange = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      mockup: { ...prev.mockup, [field]: val }
    }));
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFormData((prev) => ({
      ...prev,
      keyFeatures: [...prev.keyFeatures, newFeatureText.trim()]
    }));
    setNewFeatureText("");
  };

  const handleRemoveFeature = (idx) => {
    setFormData((prev) => ({
      ...prev,
      keyFeatures: prev.keyFeatures.filter((_, i) => i !== idx)
    }));
  };

  const handleUpdateFeature = (idx, text) => {
    setFormData((prev) => ({
      ...prev,
      keyFeatures: prev.keyFeatures.map((f, i) => (i === idx ? text : f))
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const explicitCustomImg = (formData.customImageUrl || "").trim();
    const finalData = {
      ...formData,
      mockup: {
        ...(formData.mockup || {}),
        appUrl: formData.mockup?.appUrl || `${(formData.name || 'app').toLowerCase().replace(/[^a-z0-9]/g, '')}.app`,
        primaryMetric: formData.mockup?.primaryMetric || formData.primaryMetric || '$22.0K MRR',
        activeMetric: formData.mockup?.activeMetric || formData.activeMetric || '850',
        efficiencyMetric: formData.mockup?.efficiencyMetric || formData.efficiencyMetric || '94%',
      },
      primaryMetric: formData.mockup?.primaryMetric || formData.primaryMetric || '$22.0K MRR',
      activeMetric: formData.mockup?.activeMetric || formData.activeMetric || '850',
      efficiencyMetric: formData.mockup?.efficiencyMetric || formData.efficiencyMetric || '94%',
      customImageUrl: explicitCustomImg || null,
      imageUrl: explicitCustomImg || null,
      image_url: explicitCustomImg || null,
      isModifiedByAdmin: true,
      lastModifiedAt: new Date().toISOString(),
    };
    onSave(finalData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs"
              style={{ backgroundColor: formData.brandColor }}
            >
              #{conceptIndex + 1}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">
                Edit Concept #{conceptIndex + 1}: {formData.name || "Untitled"}
              </h3>
              <p className="text-xs text-slate-500">
                Customize deck properties, brand colors, features & revenue metrics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Row 1: Concept Name & Score */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-slate-700 block">SaaS Concept Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleTextChange("name", e.target.value)}
                placeholder="e.g. Actionable OS"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-semibold"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Score (0-100)</label>
              <input
                type="number"
                min="60"
                max="100"
                value={formData.opportunityScore}
                onChange={(e) => handleTextChange("opportunityScore", Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Tagline */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Value Proposition / Tagline</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => handleTextChange("tagline", e.target.value)}
              placeholder="e.g. The all-in-one execution dashboard for creators"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs"
            />
          </div>

          {/* Brand Color Theme Palette */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-slate-700" />
                <span>Custom Brand Accent Color</span>
              </span>
              <span className="font-mono text-[10px] text-slate-500">{formData.brandColor}</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {BRAND_COLORS.map((bc) => (
                <button
                  key={bc.name}
                  type="button"
                  onClick={() => handleTextChange("brandColor", bc.hex)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                    formData.brandColor.toLowerCase() === bc.hex.toLowerCase()
                      ? "border-slate-900 bg-white shadow-xs ring-2 ring-slate-900/10"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: bc.hex }} />
                  <span>{bc.name}</span>
                </button>
              ))}
              <div className="flex items-center gap-1 ml-auto">
                <input
                  type="color"
                  value={formData.brandColor}
                  onChange={(e) => handleTextChange("brandColor", e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  title="Pick custom color"
                />
              </div>
            </div>
          </div>

          {/* Mockup Canvas Style & Concept Image Designed by AI / Admin */}
          <div className="space-y-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Mockup Canvas Style</label>
                <select
                  value={formData.mockupType}
                  onChange={(e) => handleTextChange("mockupType", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium cursor-pointer"
                >
                  <option value="saas_os">SaaS Workspace OS (Dashboard & Trajectory)</option>
                  <option value="ai_copilot">AI Copilot & Workflow HUD</option>
                  <option value="knowledge_hub">Private Member Hub & Preset Vault</option>
                </select>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 block">Concept Image URL</label>
                  {formData.customImageUrl && (
                    <button
                      type="button"
                      onClick={() => handleTextChange("customImageUrl", "")}
                      className="text-[10px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                    >
                      Reset to default
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  value={formData.customImageUrl}
                  onChange={(e) => handleTextChange("customImageUrl", e.target.value)}
                  placeholder="https://... (override with custom screenshot or image URL)"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono"
                />
              </div>
            </div>

            {/* Quick 1-Click AI Image Presets */}
            <div className="pt-1 border-t border-slate-200/70 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Quick AI Mockup Image Presets:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { label: "🖥️ SaaS Analytics OS", url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&auto=format&fit=crop&q=80" },
                  { label: "⚡ Productivity Suite", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&auto=format&fit=crop&q=80" },
                  { label: "🤖 AI Intelligence Engine", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80" },
                  { label: "💳 Monetization Terminal", url: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=1000&auto=format&fit=crop&q=80" },
                  { label: "🎙️ Creator Audio/Video", url: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1000&auto=format&fit=crop&q=80" },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleTextChange("customImageUrl", preset.url)}
                    className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold transition-all cursor-pointer ${
                      formData.customImageUrl === preset.url
                        ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Thumbnail Preview */}
            {(formData.customImageUrl || formData.imageUrl) && (
              <div className="flex items-center gap-3 pt-1">
                <div className="w-16 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-900 flex-shrink-0">
                  <img
                    src={formData.customImageUrl || formData.imageUrl}
                    alt="Concept preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
                <div className="text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700 block">Outbound Email Visual:</span>
                  This image will be rendered on the concept card in the Step 5 proposal email.
                </div>
              </div>
            )}
          </div>

          {/* Demographic & Audience Research Linkage */}
          <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-900 block flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-600" />
              <span>Audience & Demographic Research Alignment</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block">Target Customer Persona</label>
                <input
                  type="text"
                  value={formData.customer}
                  onChange={(e) => handleTextChange("customer", e.target.value)}
                  placeholder="e.g. Knowledge workers, agency founders"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block">Demographic Match</label>
                <input
                  type="text"
                  value={formData.demographicAlignment}
                  onChange={(e) => handleTextChange("demographicAlignment", e.target.value)}
                  placeholder="e.g. 24-42 Yrs • High digital budget"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Problem Statement & Audience Evidence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Core Problem Solved</label>
              <textarea
                rows={2}
                value={formData.problem}
                onChange={(e) => handleTextChange("problem", e.target.value)}
                placeholder="What friction in the audience's workflow does this eliminate?"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs leading-relaxed"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Audience Evidence / Quote</label>
              <textarea
                rows={2}
                value={formData.audienceEvidence}
                onChange={(e) => handleTextChange("audienceEvidence", e.target.value)}
                placeholder="e.g. 450+ recurring community questions asking for this tool"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs leading-relaxed italic"
              />
            </div>
          </div>

          {/* Key Features List (Dynamic) */}
          <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Key MVP Features ({formData.keyFeatures.length})</span>
              </label>
            </div>
            <div className="space-y-1.5">
              {formData.keyFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={feat}
                    onChange={(e) => handleUpdateFeature(idx, e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove feature"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                placeholder="Add a new feature..."
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Pricing & Commercial Projections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">App Domain / URL</label>
              <input
                type="text"
                value={formData.mockup.appUrl}
                onChange={(e) => handleMockupChange("appUrl", e.target.value)}
                placeholder="actionloop.app"
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Pricing Tiers</label>
              <input
                type="text"
                value={formData.pricing}
                onChange={(e) => handleTextChange("pricing", e.target.value)}
                placeholder="$49/mo Starter / $99/mo Pro"
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-emerald-700"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">MRR Projected</label>
              <input
                type="text"
                value={formData.mockup.primaryMetric}
                onChange={(e) => handleMockupChange("primaryMetric", e.target.value)}
                placeholder="$22.4K MRR"
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-emerald-700"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Active Users Target</label>
              <input
                type="text"
                value={formData.mockup.activeMetric}
                onChange={(e) => handleMockupChange("activeMetric", e.target.value)}
                placeholder="1,200"
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Retention / Performance</label>
              <input
                type="text"
                value={formData.mockup.efficiencyMetric}
                onChange={(e) => handleMockupChange("efficiencyMetric", e.target.value)}
                placeholder="91%"
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-cyan-700"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-colors cursor-pointer text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-md active:scale-98 flex items-center gap-1.5 cursor-pointer text-xs"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Save Concept Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
