import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  FileText,
  Sparkles,
  DollarSign,
  Percent,
  AlertCircle,
  FileCode,
  Layers,
  Zap,
  Clock,
} from "lucide-react";
import { useProposalStore } from "../store/proposalStore";
import type { AnalysisResponse } from "../types/proposal";

const SAMPLE_BRIEFS = [
  {
    name: "Mobile Pets MVP",
    tag: "Mobile / IAP",
    text: `# Project Brief: "PawSnap" - Instagram for Pets MVP\n\n## Overview\nWe need an MVP mobile app dedicated exclusively to pets and pet parents.\n\n## Requirements\n1. User Authentication: Login with Apple ID and Google OAuth.\n2. Pet Profiles: Up to 5 pet profiles with breed and age.\n3. Feed & Realtime Activity: Scrolling feed with realtime like counters and instant push notifications.\n4. In-App Purchases: Treat packs virtual currency using Apple In-App Purchases and Google Play Billing.\n\n## Constraints\n- Must work smoothly on iOS and Android.\n- We want the app to be completely bug-free and scale infinitely.\n- Launch in App Store within 4 weeks.`,
  },
  {
    name: "Telehealth SaaS",
    tag: "HIPAA / Compliance",
    text: `# Scope of Work: PulseCare Telehealth Intake\n\n## Compliance Requirements\n- HIPAA Compliance: The system must be fully HIPAA compliant from day one. All Patient Health Information (PHI) encrypted with AES-256.\n- Audit Trails: Immutable database logging of all record views and downloads.\n- Multi-factor authentication (MFA) for clinical providers.\n\n## Workflows\n1. Patient Intake Forms with digital signature capture.\n2. WebRTC Video Consultations with encrypted peer-to-peer streams.\n3. Calendar Integration: Two-way sync with Google Calendar.\n4. Billing: Credit card processing via Stripe.`,
  },
  {
    name: "Fintech Marketplace",
    tag: "Payments / Stripe",
    text: `# Technical Brief: GearRent Marketplace\n\n## Overview\nPeer-to-peer equipment rental marketplace for camera and audio equipment.\n\n## Financial Requirements\n1. Multi-Vendor Onboarding: Custom onboarding via Stripe Connect Custom accounts, KYC and tax IDs.\n2. Escrow & Split Payouts: Renters pay rental fees plus security deposit held in escrow. Platform takes 12% commission.\n3. Identity Verification: Automated identity verification via Stripe Identity before equipment over $1,000 can be booked.\n4. Realtime Availability Calendar to prevent double booking.`,
  },
  {
    name: "WhatsApp Client",
    tag: "Robustness / Unstructured",
    text: `Hey bro! quick project for you. so basically we need an Uber for barbers.\npeople can just open the app and order a haircut to their apartment right away.\nactually we don't need a mobile app yet, a simple responsive website is fine. wait, our barbers only use iPhones so we definitely need an iOS app first, android can wait.\npayments should be super simple: apple pay, credit cards, cash on delivery, and bitcoin.\nbudget is around $1500 max because my cousin said he could build this in a weekend.\ncan we have a prototype ready by this Friday?`,
  },
];

export const IngestionDropzone: React.FC = () => {
  const {
    setProposal,
    setRawBriefText,
    setFilename,
    setTrace,
    isAnalyzing,
    setIsAnalyzing,
    hourlyRate,
    setHourlyRate,
    currency,
    setCurrency,
    contingencyPercent,
    setContingencyPercent,
  } = useProposalStore();

  const [activeInputTab, setActiveInputTab] = useState<"file" | "paste">("paste");
  const [pastedText, setPastedText] = useState(SAMPLE_BRIEFS[0].text);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("gemma4:e2b");
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const charCount = activeInputTab === "file" && selectedFile ? selectedFile.size : pastedText.length;
  const estimatedTokens = Math.max(1, Math.round(charCount / 4));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      setErrorMsg(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setActiveInputTab("file");
      setErrorMsg(null);
    }
  };

  const handleLoadDemo = async () => {
    setErrorMsg(null);
    setIsAnalyzing(true);
    try {
      const res = await fetch("/demo/01_mobile_pets_mvp.json");
      if (!res.ok) throw new Error("Could not load recorded demo trace.");
      const data = await res.json();
      setProposal(data.proposal);
      setTrace(data.trace || []);
      setRawBriefText(data.brief_text || pastedText);
      setFilename("demo_recorded_run.json");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load demo replay.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = async () => {
    setErrorMsg(null);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("hourly_rate", hourlyRate.toString());
      formData.append("currency", currency);
      formData.append("contingency_percent", contingencyPercent.toString());
      formData.append("model", selectedModel);

      if (activeInputTab === "file" && selectedFile) {
        formData.append("file", selectedFile);
        setFilename(selectedFile.name);
      } else {
        if (!pastedText.trim()) {
          throw new Error("Please enter or paste brief text to analyze.");
        }
        formData.append("brief_text", pastedText);
        setFilename("pasted_brief.txt");
        setRawBriefText(pastedText);
      }

      const response = await fetch("/api/v1/scope/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server returned HTTP ${response.status}`);
      }

      const data: AnalysisResponse = await response.json();
      setProposal(data.proposal);
      setTrace(data.trace || []);
      if (activeInputTab === "file" && selectedFile) {
        // If file was text/md, read for brief pane
        if (selectedFile.name.endsWith(".md") || selectedFile.name.endsWith(".txt")) {
          const txt = await selectedFile.text();
          setRawBriefText(txt);
        } else {
          setRawBriefText(`[Extracted from ${selectedFile.name} (${data.char_count} chars, ~${data.estimated_tokens} tokens)]`);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to analyze brief. Ensure Ollama is running locally.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="text-center space-y-3 pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Local-First • NDA-Safe • Verbatim Grounded</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Scope Freelance RFQs with Total Privacy
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          Read client briefs on your machine with local Gemma. Ground requirements in exact quotes,
          compute pricing in deterministic code, and spot scope-creep before you quote.
        </p>
      </div>

      {/* Preset Briefs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
        <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5 pl-1">
          <Layers className="w-3.5 h-3.5 text-zinc-500" />
          <span>Load Synthetic Brief:</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_BRIEFS.map((b) => (
            <button
              key={b.name}
              onClick={() => {
                setPastedText(b.text);
                setActiveInputTab("paste");
                setSelectedFile(null);
              }}
              className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors cursor-pointer"
            >
              {b.name} <span className="text-[10px] text-zinc-500">({b.tag})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Tabs & Main Card */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveInputTab("paste")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                activeInputTab === "paste"
                  ? "bg-zinc-800 text-white border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Paste Text / Markdown</span>
            </button>
            <button
              onClick={() => setActiveInputTab("file")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                activeInputTab === "file"
                  ? "bg-zinc-800 text-white border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Upload PDF / MD / TXT</span>
            </button>
          </div>

          <div className="text-right text-xs font-mono text-zinc-400">
            <span>{charCount.toLocaleString()} chars</span>
            <span className="mx-1.5 text-zinc-600">•</span>
            <span>~{estimatedTokens.toLocaleString()} tokens</span>
          </div>
        </div>

        {/* Input Area */}
        {activeInputTab === "paste" ? (
          <div>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste your client RFQ, project brief, or email here..."
              rows={10}
              className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-y"
            />
          </div>
        ) : (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl p-10 text-center cursor-pointer bg-zinc-950/40 hover:bg-zinc-950/70 transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.md,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
            {selectedFile ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-emerald-400">{selectedFile.name}</p>
                <p className="text-xs text-zinc-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-300">
                  Drag and drop your RFP document, or click to browse
                </p>
                <p className="text-xs text-zinc-500">Supports .pdf, .md, .txt (max 10MB)</p>
              </div>
            )}
          </div>
        )}

        {/* Commercial Configuration Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-800/80">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
              <span>Hourly Rate</span>
            </label>
            <div className="flex rounded-lg bg-zinc-950 border border-zinc-800 focus-within:border-zinc-600">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-transparent text-xs text-zinc-300 px-3 py-2 border-r border-zinc-800 focus:outline-none"
              >
                <option value="USD">USD</option>
                <option value="INR">INR</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
                className="w-full bg-transparent px-3 py-2 text-xs font-mono text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-zinc-500" />
              <span>Contingency Buffer</span>
            </label>
            <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              {[15, 20, 25].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setContingencyPercent(pct)}
                  className={`py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                    contingencyPercent === pct
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-400">Target Architecture</label>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                OFFLINE SAFE
              </span>
            </div>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              <option value="gemma4:e2b">Gemma 4 2B (Fast / CPU Recommended)</option>
              <option value="gemma4:e4b">Gemma 4 4B (Deep / GPU)</option>
            </select>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-red-300">Local Analysis Notice</p>
                <p className="text-red-300/80 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLoadDemo}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-end sm:self-center"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Load Instant Demo</span>
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Instant Demo Replay Button */}
            <button
              type="button"
              onClick={handleLoadDemo}
              disabled={isAnalyzing}
              className="py-3 px-4 rounded-xl bg-zinc-800/90 hover:bg-zinc-800 border border-emerald-500/40 hover:border-emerald-500/70 text-emerald-300 hover:text-emerald-200 font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4 text-emerald-400 shrink-0 fill-emerald-400/20" />
              <span>⚡ Load Instant Demo Replay (0s)</span>
            </button>

            {/* Live Local Gemma Scoping Button */}
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-500 font-bold text-xs tracking-wide transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-zinc-900 border-t-transparent" />
                  <span>Scoping Locally... ({elapsedSeconds}s)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Scope with Local {selectedModel.includes("e2b") ? "Gemma 2B" : "Gemma 4B"}</span>
                </>
              )}
            </button>
          </div>

          {/* Active CPU Progress Indicator */}
          {isAnalyzing && (
            <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800/80 space-y-2.5 text-xs text-zinc-300 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-400 flex items-center gap-2">
                  <span className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-emerald-400 border-t-transparent" />
                  Local 5-Step Scoping Pipeline in Progress
                </span>
                <span className="font-mono text-xs text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  {elapsedSeconds}s elapsed
                </span>
              </div>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Ollama is executing schema-constrained inference on your local CPU. Zero client data leaves your laptop.
                Because CPUs generate tokens sequentially at ~3–5 tokens/sec, this takes 1–3 minutes per step.
              </p>
              <div className="pt-1.5 flex items-center justify-between border-t border-zinc-800/60">
                <span className="text-[11px] text-zinc-500">Want to test the full workbench immediately?</span>
                <button
                  type="button"
                  onClick={handleLoadDemo}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline cursor-pointer"
                >
                  ⚡ Switch to Instant Demo Trace →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
