import React, { useState } from 'react'
import {
  Globe,
  Code2,
  Database,
  CheckCircle2,
  Award,
  Terminal,
  Play,
  Layers,
  Sparkles,
  Zap,
  FolderCode,
  FileCode,
  Check,
  ChevronRight,
  BarChart2,
  Cpu,
  Boxes,
  FileText
} from 'lucide-react'

export default function ProductMockupDisplay({ project, theme = 'purple' }) {
  const productName = project?.productName || 'The DataLab Hub System'
  const creatorName = project?.creatorName || 'Keith Galli'
  const niche = project?.niche || 'Data Science & Machine Learning'
  const productTagline = project?.productTagline || 'Interactive industry project sandboxes, real-world datasets & data science career accelerator'
  const keyFeatures = project?.keyFeatures || project?.features || project?.selectedConcept?.keyFeatures || []

  // Detect which concept is selected based on naming and tagline
  const nameLower = (productName + ' ' + productTagline).toLowerCase()
  const isAI = nameLower.includes('flow') || nameLower.includes('ai') || nameLower.includes('model') || nameLower.includes('copilot') || nameLower.includes('shader') || nameLower.includes('alpha')
  const isHub = nameLower.includes('hub') || nameLower.includes('datalab') || nameLower.includes('academy') || nameLower.includes('club') || nameLower.includes('sandbox') || nameLower.includes('gamelab')
  // Otherwise is OS / Toolkit (Concept 1)

  const [activeTab, setActiveTab] = useState(0)
  const [isRunningCode, setIsRunningCode] = useState(false)

  // Archetype dynamic configuration
  let config = {
    badgeText: '🧪 Live Interactive Sandbox • v1.0',
    navTabs: [
      { label: 'Project Sandboxes', icon: FolderCode },
      { label: 'Datasets Library', icon: Database },
      { label: 'Test Suite Runner', icon: Terminal },
      { label: 'Verified Badges', icon: Award },
    ],
    activeChallenge: 'Fintech Transaction Fraud Classifier & Alert Pipeline',
    challengeDetails: 'Dataset: 1.2M raw transaction logs • Imputation, Feature Encoding & SHAP Explainability',
    fileName: 'fraud_pipeline.py',
    codeLines: [
      { text: '# 1. Ingest proprietary messy dataset from DataLab Vault', color: 'text-slate-500' },
      { text: 'import datalab as dl', color: 'text-purple-300' },
      { text: 'import pandas as pd', color: 'text-purple-300' },
      { text: 'df = dl.load_dataset("fintech_transactions_v2")', color: 'text-emerald-300' },
      { text: 'pipeline = dl.models.XGBoostFraudDetector(n_estimators=300)', color: 'text-blue-300' },
      { text: 'pipeline.fit(df.drop("is_fraud", axis=1), df["is_fraud"])', color: 'text-blue-300' },
      { text: '# 2. Automated evaluation against industry benchmark test cases', color: 'text-slate-500' },
      { text: 'benchmark_report = dl.evaluator.grade_model(pipeline)', color: 'text-purple-300' },
    ],
    initialOutput: 'Tests: 14/14 Passed (100%) • F1-Score: 0.942 • Benchmark: Top 5% ✅',
    completedOutput: 'Execution completed in 240ms • All 14 test cases passed ✅ • Portfolio artifact verified!',
    specs: [
      { label: 'Environment', value: 'Python 3.11 (Conda)' },
      { label: 'Modules', value: 'Pandas, XGBoost, Torch' },
    ],
    featureCards: [
      { title: '48 Proprietary Datasets', desc: 'Messy corporate datasets matching real-world engineering take-home challenges.', icon: Database, color: 'text-purple-400' },
      { title: 'Automated Grading', desc: 'Instant test suite evaluation for algorithmic efficiency, code quality & model accuracy.', icon: CheckCircle2, color: 'text-emerald-400' },
      { title: 'Verified Portfolio', desc: 'Exportable proof-of-work badges and reproducible GitHub repos for job recruiters.', icon: Award, color: 'text-amber-400' },
    ]
  }

  if (isAI) {
    config = {
      badgeText: '🤖 AI Model Tuning & Deployment • v1.0',
      navTabs: [
        { label: 'GPU Validator', icon: Cpu },
        { label: 'LoRA Fine-Tuner', icon: Sparkles },
        { label: 'Evaluation Matrix', icon: BarChart2 },
        { label: 'Serverless Export', icon: Zap },
      ],
      activeChallenge: 'LoRA Fine-Tuning & GPU VRAM Optimizer',
      challengeDetails: 'Target: Llama-3-8B-Instruct • Target VRAM: 14.2GB • QLoRA 4-bit Quantization',
      fileName: 'finetune_lora.py',
      codeLines: [
        { text: '# 1. Check GPU environment & allocate VRAM cache', color: 'text-slate-500' },
        { text: 'import torch, transformers, peft', color: 'text-purple-300' },
        { text: 'config = peft.LoraConfig(r=16, lora_alpha=32, target_modules=["q_proj", "v_proj"])', color: 'text-blue-300' },
        { text: 'model = peft.get_peft_model(base_model, config)', color: 'text-blue-300' },
        { text: '# 2. Execute distributed memory-optimized training loop', color: 'text-slate-500' },
        { text: 'trainer = transformers.Trainer(model=model, train_dataset=clean_dataset)', color: 'text-emerald-300' },
        { text: 'trainer.train()', color: 'text-purple-300' },
      ],
      initialOutput: 'Training Epoch 3/3 • Validation Loss: 0.284 • VRAM Usage: 14.2GB / 24GB ✅',
      completedOutput: 'Model weights quantized to GGUF format • Serverless endpoint deployed in 320ms! 🚀',
      specs: [
        { label: 'CUDA Runtime', value: 'CUDA 12.2 / cuDNN 8.9' },
        { label: 'Hardware', value: 'NVIDIA RTX 4090 (24GB)' },
      ],
      featureCards: [
        { title: 'Automated VRAM Guard', desc: 'Prevents out-of-memory GPU crashes with intelligent dynamic batching.', icon: Cpu, color: 'text-purple-400' },
        { title: 'One-Click LoRA Adapters', desc: 'Fine-tune open-weights models in minutes with pre-configured hyperparameters.', icon: Sparkles, color: 'text-emerald-400' },
        { title: 'Serverless Endpoints', desc: 'Deploy optimized model weights to FastAPI microservices instantly.', icon: Zap, color: 'text-amber-400' },
      ]
    }
  } else if (!isHub) {
    // Concept 1: OS / Workspace Toolkit
    config = {
      badgeText: '⚡ Data Science Pipeline OS • v1.0',
      navTabs: [
        { label: 'Automated EDA', icon: BarChart2 },
        { label: 'Pandas Pipelines', icon: Code2 },
        { label: 'Model Benchmarks', icon: Boxes },
        { label: 'FastAPI Export', icon: Zap },
      ],
      activeChallenge: 'Automated Exploratory Data Analysis & Feature Pipeline',
      challengeDetails: 'Input: 450K rows raw CSV • 42 Columns • Auto-imputation, outliers & correlation analysis',
      fileName: 'eda_pipeline.py',
      codeLines: [
        { text: '# 1. Automated data quality audit & outlier detection', color: 'text-slate-500' },
        { text: 'import pandas_os as pos', color: 'text-purple-300' },
        { text: 'raw_df = pos.read_source("customer_churn_raw.csv")', color: 'text-emerald-300' },
        { text: 'clean_df = pos.auto_impute_missing(raw_df, strategy="knn")', color: 'text-blue-300' },
        { text: 'features = pos.encode_categorical(clean_df, method="target")', color: 'text-blue-300' },
        { text: '# 2. Generate benchmark matrix across 6 ML architectures', color: 'text-slate-500' },
        { text: 'leaderboard = pos.evaluate_all_models(features, target="churn")', color: 'text-purple-300' },
      ],
      initialOutput: 'EDA Audit Complete: 42 features analyzed • 0 missing values • Benchmark Leader: LightGBM (AUC: 0.961) ✅',
      completedOutput: 'FastAPI microservice containerized • Docker image pushed in 410ms! 🚀',
      specs: [
        { label: 'Engine Core', value: 'Polars / Pandas Engine' },
        { label: 'Throughput', value: '1.8M Rows / Sec' },
      ],
      featureCards: [
        { title: 'One-Click EDA Engine', desc: 'Eliminates 80% of repetitive data cleaning and visualization boilerplate.', icon: BarChart2, color: 'text-purple-400' },
        { title: 'Smart Pipeline Generator', desc: 'Automated categorical encoding, scaling & feature importance scoring.', icon: Code2, color: 'text-emerald-400' },
        { title: 'FastAPI Microservice Export', desc: 'Turn any trained notebook model into a production REST endpoint with 1 click.', icon: Zap, color: 'text-amber-400' },
      ]
    }
  }

  // If keyFeatures array from concept is available, override feature cards with exact wording
  if (keyFeatures.length >= 3) {
    config.featureCards = keyFeatures.slice(0, 3).map((feat, idx) => {
      const parts = String(feat).split(':')
      const title = parts[0]?.trim() || `Core Feature 0${idx + 1}`
      const desc = parts[1]?.trim() || parts[0]?.trim() || 'Engineered exclusively for target audience.'
      const icons = [Database, CheckCircle2, Award]
      const colors = ['text-purple-400', 'text-emerald-400', 'text-amber-400']
      return {
        title,
        desc,
        icon: icons[idx] || CheckCircle2,
        color: colors[idx] || 'text-purple-400'
      }
    })
  }

  const [consoleOutput, setConsoleOutput] = useState(config.initialOutput)

  const handleRun = () => {
    setIsRunningCode(true)
    setTimeout(() => {
      setIsRunningCode(false)
      setConsoleOutput(config.completedOutput)
    }, 700)
  }

  // App URL slug
  const cleanSlug = (productName || 'app')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

  const appUrl = `app.${cleanSlug}.io/workspace/sandbox-01`

  // Theme styling
  const themeMap = {
    purple: {
      border: 'border-purple-500/30',
      glow: 'shadow-purple-950/40',
      badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      primaryBg: 'bg-purple-600',
      text: 'text-purple-400',
      gradient: 'from-purple-950/40 to-[#0e1117]'
    },
    emerald: {
      border: 'border-emerald-500/30',
      glow: 'shadow-emerald-950/40',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      primaryBg: 'bg-emerald-600',
      text: 'text-emerald-400',
      gradient: 'from-emerald-950/40 to-[#0e1117]'
    }
  }
  const currentTheme = themeMap[theme] || themeMap.purple

  return (
    <div className={`w-full rounded-2xl bg-[#090b0e] border ${currentTheme.border} p-4 sm:p-6 shadow-2xl ${currentTheme.glow} transition-all space-y-4 text-left select-none`}>
      {/* macOS Window Titlebar */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/90 shadow-sm shadow-red-950" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/90 shadow-sm shadow-amber-950" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/90 shadow-sm shadow-emerald-950" />
          </div>
          <div className="px-2.5 py-0.5 rounded-md bg-[#141720] border border-white/[0.06] text-[10px] font-mono text-purple-300 flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-purple-400" />
            <span>https://{appUrl}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${currentTheme.badge}`}>
            {config.badgeText}
          </span>
          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
            Co-Built with {creatorName}
          </span>
        </div>
      </div>

      {/* Main SaaS App UI Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* App Sidebar Navigation */}
        <div className="md:col-span-3 bg-[#11141c] border border-white/[0.06] rounded-xl p-3 space-y-3">
          {/* Brand Header */}
          <div className="flex items-center gap-2 px-1">
            <div className={`w-8 h-8 rounded-lg ${currentTheme.primaryBg} flex items-center justify-center text-white font-black text-xs shadow-md shrink-0`}>
              <Code2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-white text-xs truncate">{productName}</div>
              <div className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active Session</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            {config.navTabs.map((nav, idx) => {
              const NavIcon = nav.icon
              const isSelected = activeTab === idx
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`w-full px-2.5 py-2 rounded-lg text-left transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? `${currentTheme.primaryBg} text-white shadow-sm font-bold`
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <NavIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs truncate">{nav.label}</span>
                  </div>
                  {isSelected && <ChevronRight className="w-3 h-3 text-white shrink-0" />}
                </button>
              )
            })}
          </div>

          {/* Active Sandbox Specs */}
          <div className="p-2.5 rounded-lg bg-[#0d1017] border border-white/[0.06] space-y-1.5 text-[10px]">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Environment Specs</div>
            {config.specs.map((sp, i) => (
              <div key={i} className="text-slate-300 font-mono flex items-center justify-between">
                <span>{sp.label}</span>
                <span className="text-emerald-400">{sp.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main App Viewport & Code Editor */}
        <div className="md:col-span-9 space-y-3">
          {/* Active Project Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-[#131722] to-[#0e1117] border border-purple-500/30 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  ACTIVE SPRINT
                </span>
                <span className="text-xs font-bold text-white truncate">
                  {config.activeChallenge}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 line-clamp-1">
                {config.challengeDetails}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRun}
              disabled={isRunningCode}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunningCode ? 'Executing...' : 'Run Pipeline'}</span>
            </button>
          </div>

          {/* In-Browser Python Sandbox Code Block */}
          <div className="rounded-xl bg-[#090c12] border border-white/[0.08] overflow-hidden font-mono text-xs shadow-inner">
            {/* Editor Tab bar */}
            <div className="px-3 py-2 bg-[#121620] border-b border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-white font-bold">{config.fileName}</span>
                <span className="text-[10px] text-slate-500">(Auto-Saved)</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Kernel: Ready</span>
              </div>
            </div>

            {/* Code Lines */}
            <div className="p-3.5 space-y-1 text-slate-300 overflow-x-auto text-[11px] leading-relaxed">
              {config.codeLines.map((line, idx) => (
                <div key={idx} className={line.color}>{line.text}</div>
              ))}
            </div>

            {/* Interactive Terminal Output Console */}
            <div className="p-2.5 bg-[#05070a] border-t border-white/[0.06] text-[11px] font-mono text-emerald-400 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{consoleOutput}</span>
              </div>
              <span className="text-[10px] text-slate-500 shrink-0 ml-2">Active v1.0</span>
            </div>
          </div>

          {/* 3 Core Value Proposition Modules */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {config.featureCards.map((feat, idx) => {
              const FeatIcon = feat.icon
              return (
                <div key={idx} className="p-3 rounded-xl bg-[#11141c] border border-white/[0.06] space-y-1">
                  <div className={`flex items-center gap-1.5 ${feat.color} font-bold text-[11px]`}>
                    <FeatIcon className="w-3.5 h-3.5" />
                    <span className="truncate">{feat.title}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">
                    {feat.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
