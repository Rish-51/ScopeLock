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
  const [selectedModel, setSelectedModel] = useState<string>("gemma4:e4b");
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-[2px] text-xs font-mono font-bold uppercase tracking-wider shadow-[2px_2px_0px_#2d0c30]"
          style={{
            backgroundColor: "var(--bg-elevated)",
            border: "2px solid var(--border-hard)",
            color: "var(--text-primary)",
          }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--accent-primary-bg)" }} />
          <span>Local-First • NDA-Safe • Verbatim Grounded</span>
        </div>
        <h1
          className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans"
          style={{ color: "var(--text-primary)" }}
        >
          Scope Freelance RFQs with Total Privacy
        </h1>
        <p
          className="max-w-2xl mx-auto text-sm sm:text-base leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Read client briefs on your machine with local Gemma. Ground requirements in exact quotes,
          compute pricing in deterministic code, and spot scope-creep before you quote.
        </p>
      </div>

      {/* Preset Briefs Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-[3px] shadow-[3px_3px_0px_#2d0c30]"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "2px solid var(--border-hard)",
        }}
      >
        <span
          className="text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 pl-1"
          style={{ color: "var(--text-primary)" }}
        >
          <Layers className="w-3.5 h-3.5" style={{ color: "var(--accent-primary-bg)" }} />
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
              className="px-2.5 py-1 text-xs rounded-[2px] font-mono font-semibold transition-all cursor-pointer shadow-[1px_1px_0px_#2d0c30] hover:shadow-[2px_2px_0px_#2d0c30] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1.5px solid var(--border-hard)",
                color: "var(--text-primary)",
              }}
            >
              {b.name} <span className="text-[10px] opacity-75 font-normal">({b.tag})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Tabs & Main Card */}
      <div
        className="rounded-[3px] p-6 shadow-[4px_4px_0px_#2d0c30] space-y-5"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "2px solid var(--border-hard)",
        }}
      >
        <div
          className="flex items-center justify-between pb-3 border-b-2"
          style={{ borderColor: "var(--border-hard)" }}
        >
          <div className="flex gap-2">
            <button
              onClick={() => setActiveInputTab("paste")}
              className="px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer flex items-center gap-2 shadow-[2px_2px_0px_#2d0c30]"
              style={{
                backgroundColor: activeInputTab === "paste" ? "var(--pill-active-bg)" : "var(--bg-surface)",
                color: activeInputTab === "paste" ? "var(--pill-active-fg)" : "var(--text-primary)",
                border: "2px solid var(--border-hard)",
              }}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Paste Text / Markdown</span>
            </button>
            <button
              onClick={() => setActiveInputTab("file")}
              className="px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer flex items-center gap-2 shadow-[2px_2px_0px_#2d0c30]"
              style={{
                backgroundColor: activeInputTab === "file" ? "var(--pill-active-bg)" : "var(--bg-surface)",
                color: activeInputTab === "file" ? "var(--pill-active-fg)" : "var(--text-primary)",
                border: "2px solid var(--border-hard)",
              }}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Upload PDF / MD / TXT</span>
            </button>
          </div>

          <div className="text-right text-xs font-mono font-semibold" style={{ color: "var(--text-secondary)" }}>
            <span>{charCount.toLocaleString()} chars</span>
            <span className="mx-1.5 opacity-40">•</span>
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
              className="w-full rounded-[2px] p-4 text-sm font-mono transition-all resize-y outline-none shadow-[2px_2px_0px_#2d0c30] focus:shadow-[3px_3px_0px_#2d0c30]"
              style={{
                backgroundColor: "var(--bg-input)",
                border: "2px solid var(--border-hard)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        ) : (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-[2px] p-10 text-center cursor-pointer transition-all shadow-[2px_2px_0px_#2d0c30] hover:shadow-[3px_3px_0px_#2d0c30]"
            style={{
              backgroundColor: "var(--bg-input)",
              borderColor: "var(--border-hard)",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.md,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            {selectedFile ? (
              <div className="space-y-1 font-mono">
                <p className="text-sm font-bold" style={{ color: "var(--status-safe-fg)" }}>
                  {selectedFile.name}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-bold font-mono" style={{ color: "var(--text-primary)" }}>
                  Drag and drop your RFP document, or click to browse
                </p>
                <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  Supports .pdf, .md, .txt (max 10MB)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Commercial Configuration Parameters */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t-2"
          style={{ borderColor: "var(--border-hard)" }}
        >
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider font-mono mb-1.5 flex items-center gap-1"
              style={{ color: "var(--text-primary)" }}
            >
              <DollarSign className="w-3.5 h-3.5" style={{ color: "var(--accent-primary-bg)" }} />
              <span>Hourly Rate</span>
            </label>
            <div
              className="flex rounded-[2px] overflow-hidden shadow-[2px_2px_0px_#2d0c30]"
              style={{
                backgroundColor: "var(--bg-input)",
                border: "2px solid var(--border-hard)",
              }}
            >
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="text-xs font-mono font-bold px-3 py-2 border-r-2 outline-none cursor-pointer"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border-hard)",
                }}
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
                className="w-full bg-transparent px-3 py-2 text-xs font-mono font-bold outline-none"
                style={{ color: "var(--text-primary)" }}
              />
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider font-mono mb-1.5 flex items-center gap-1"
              style={{ color: "var(--text-primary)" }}
            >
              <Percent className="w-3.5 h-3.5" style={{ color: "var(--accent-primary-bg)" }} />
              <span>Contingency Buffer</span>
            </label>
            <div
              className="grid grid-cols-3 gap-1 p-1 rounded-[2px] shadow-[2px_2px_0px_#2d0c30]"
              style={{
                backgroundColor: "var(--bg-input)",
                border: "2px solid var(--border-hard)",
              }}
            >
              {[15, 20, 25].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setContingencyPercent(pct)}
                  className="py-1 text-xs font-mono rounded-[2px] transition-all cursor-pointer font-bold"
                  style={{
                    backgroundColor: contingencyPercent === pct ? "var(--pill-active-bg)" : "transparent",
                    color: contingencyPercent === pct ? "var(--pill-active-fg)" : "var(--text-secondary)",
                    border: contingencyPercent === pct ? "1.5px solid var(--border-hard)" : "1.5px solid transparent",
                  }}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: "var(--text-primary)" }}>
                Target Architecture
              </label>
              <span
                className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[2px] shadow-[1px_1px_0px_#2d0c30]"
                style={{
                  backgroundColor: "var(--status-safe-bg)",
                  border: "1.5px solid var(--border-hard)",
                  color: "var(--status-safe-fg)",
                }}
              >
                OFFLINE SAFE
              </span>
            </div>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full rounded-[2px] px-3 py-2 text-xs font-mono font-semibold outline-none cursor-pointer shadow-[2px_2px_0px_#2d0c30]"
              style={{
                backgroundColor: "var(--bg-input)",
                border: "2px solid var(--border-hard)",
                color: "var(--text-primary)",
              }}
            >
              <option value="gemma4:e4b">Gemma 4 4B (Installed / Recommended)</option>
              <option value="gemma4:e2b">Gemma 4 2B (Lightweight / Fast CPU)</option>
              <option value="llama3.2:1b">Llama 3.2 1B (Ultra-light ~1.3GB)</option>
              <option value="llama3.2:3b">Llama 3.2 3B (Fast ~2.0GB)</option>
              <option value="qwen2.5:1.5b">Qwen 2.5 1.5B (Compact structured)</option>
            </select>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-[2px] text-xs shadow-[3px_3px_0px_#2d0c30]"
            style={{
              backgroundColor: "#2a1215",
              border: "2px solid var(--border-hard)",
              color: "#fca5a5",
            }}
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#f87171" }} />
              <div className="space-y-1">
                <p className="font-bold font-mono" style={{ color: "#fecaca" }}>Local Analysis Notice</p>
                <p className="leading-relaxed opacity-90">{errorMsg}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLoadDemo}
              className="shrink-0 px-3 py-1.5 rounded-[2px] border-2 border-[#2d0c30] text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer self-end sm:self-center shadow-[2px_2px_0px_#2d0c30] hover:shadow-[3px_3px_0px_#2d0c30] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              style={{
                backgroundColor: "var(--bg-elevated)",
                color: "var(--text-primary)",
              }}
            >
              <Zap className="w-3.5 h-3.5" style={{ color: "var(--accent-primary-bg)" }} />
              <span>Load Instant Demo</span>
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Secondary CTA: Instant Demo Replay */}
            <button
              type="button"
              onClick={handleLoadDemo}
              disabled={isAnalyzing}
              className="py-3 px-4 rounded-[2px] text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_#2d0c30] hover:shadow-[4px_4px_0px_#2d0c30] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--accent-secondary-bg)",
                border: "2px solid var(--border-hard)",
                color: "var(--accent-secondary-fg)",
              }}
            >
              <Zap className="w-4 h-4 shrink-0" style={{ color: "var(--accent-primary-bg)" }} />
              <span>⚡ Load Instant Demo Replay (0s)</span>
            </button>

            {/* Primary CTA: Live Local Gemma Scoping */}
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="py-3 px-6 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_#2d0c30] hover:shadow-[4px_4px_0px_#2d0c30] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--accent-primary-bg)",
                color: "var(--accent-primary-fg)",
                border: "2px solid var(--border-hard)",
              }}
            >
              {isAnalyzing ? (
                <>
                  <span
                    className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-t-transparent"
                    style={{ borderColor: "var(--accent-primary-fg)", borderTopColor: "transparent" }}
                  />
                  <span>Scoping Locally... ({elapsedSeconds}s)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>
                    Scope with Local{" "}
                    {selectedModel.includes("e2b")
                      ? "Gemma 2B"
                      : selectedModel.includes("e4b")
                      ? "Gemma 4B"
                      : selectedModel.includes("1b")
                      ? "Llama 1B"
                      : selectedModel.includes("3b")
                      ? "Llama 3B"
                      : selectedModel}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Active CPU Progress Indicator */}
          {isAnalyzing && (
            <div
              className="p-4 rounded-[2px] space-y-2.5 text-xs shadow-[3px_3px_0px_#2d0c30] animate-in fade-in duration-300"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "2px solid var(--border-hard)",
                color: "var(--text-secondary)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold font-mono flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <span
                    className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-t-transparent"
                    style={{ borderColor: "var(--border-hard)", borderTopColor: "transparent" }}
                  />
                  Local 5-Step Scoping Pipeline in Progress
                </span>
                <span className="font-mono text-xs font-bold flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
                  <Clock className="w-3.5 h-3.5" />
                  {elapsedSeconds}s elapsed
                </span>
              </div>
              <p className="leading-relaxed text-[11px]" style={{ color: "var(--text-secondary)" }}>
                Ollama is executing schema-constrained inference on your local CPU. Zero client data leaves your laptop.
                Because CPUs generate tokens sequentially at ~3–5 tokens/sec, this takes 1–3 minutes per step.
              </p>
              <div
                className="pt-1.5 flex items-center justify-between border-t"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
                  Want to test the full workbench immediately?
                </span>
                <button
                  type="button"
                  onClick={handleLoadDemo}
                  className="text-[11px] font-mono font-bold underline cursor-pointer"
                  style={{ color: "var(--accent-primary-bg)" }}
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

