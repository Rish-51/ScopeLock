/**
 * ScopeLock Zustand Store.
 * Centralized state for workbench, live pricing, trace waterfall, and UI modals.
 */

import { create } from "zustand";
import type {
  ScopeLockProposal,
  TraceSpan,
  HealthState,
  Milestone,
} from "../types/proposal";
import { computePricing } from "../lib/pricing";

interface ProposalState {
  proposal: ScopeLockProposal | null;
  rawBriefText: string;
  filename: string;
  trace: TraceSpan[];
  isAnalyzing: boolean;
  activeTab: "milestones" | "risks" | "scope_guard" | "client_email";
  selectedHighlightId: string | null;

  // Commercial parameters
  hourlyRate: number;
  currency: string;
  contingencyPercent: number;

  // Modals
  isTraceModalOpen: boolean;
  isExportModalOpen: boolean;

  // System Health
  health: HealthState | null;

  // Actions
  setProposal: (proposal: ScopeLockProposal | null) => void;
  setRawBriefText: (text: string) => void;
  setFilename: (name: string) => void;
  setTrace: (trace: TraceSpan[]) => void;
  setIsAnalyzing: (loading: boolean) => void;
  setActiveTab: (tab: "milestones" | "risks" | "scope_guard" | "client_email") => void;
  setSelectedHighlightId: (id: string | null) => void;
  setHourlyRate: (rate: number) => void;
  setCurrency: (currency: string) => void;
  setContingencyPercent: (percent: number) => void;
  setTraceModalOpen: (open: boolean) => void;
  setExportModalOpen: (open: boolean) => void;
  setHealth: (health: HealthState | null) => void;

  updateMilestone: (id: string, updates: Partial<Milestone>) => void;
  recomputePricing: () => void;
  resetWorkbench: () => void;
}

export const useProposalStore = create<ProposalState>((set, get) => ({
  proposal: null,
  rawBriefText: "",
  filename: "",
  trace: [],
  isAnalyzing: false,
  activeTab: "milestones",
  selectedHighlightId: null,

  hourlyRate: 120.0,
  currency: "USD",
  contingencyPercent: 20,

  isTraceModalOpen: false,
  isExportModalOpen: false,
  health: null,

  setProposal: (proposal) => {
    if (proposal) {
      set({
        proposal,
        hourlyRate: proposal.commercial.hourly_rate,
        currency: proposal.commercial.currency,
        contingencyPercent: proposal.commercial.contingency_percent,
      });
    } else {
      set({ proposal: null });
    }
  },
  setRawBriefText: (rawBriefText) => set({ rawBriefText }),
  setFilename: (filename) => set({ filename }),
  setTrace: (trace) => set({ trace }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedHighlightId: (selectedHighlightId) => set({ selectedHighlightId }),
  setHourlyRate: (hourlyRate) => {
    set({ hourlyRate });
    get().recomputePricing();
  },
  setCurrency: (currency) => {
    set({ currency });
    get().recomputePricing();
  },
  setContingencyPercent: (contingencyPercent) => {
    set({ contingencyPercent });
    get().recomputePricing();
  },
  setTraceModalOpen: (isTraceModalOpen) => set({ isTraceModalOpen }),
  setExportModalOpen: (isExportModalOpen) => set({ isExportModalOpen }),
  setHealth: (health) => set({ health }),

  updateMilestone: (id, updates) => {
    const { proposal } = get();
    if (!proposal) return;

    const newMilestones = proposal.plan.milestones.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    );

    const updatedProposal = {
      ...proposal,
      plan: {
        ...proposal.plan,
        milestones: newMilestones,
      },
    };

    set({ proposal: updatedProposal });
    get().recomputePricing();
  },

  recomputePricing: () => {
    const { proposal, hourlyRate, currency, contingencyPercent } = get();
    if (!proposal) return;

    const newCommercial = computePricing(
      proposal.plan.milestones,
      proposal.requirements.requirements,
      hourlyRate,
      currency,
      contingencyPercent
    );

    set({
      proposal: {
        ...proposal,
        commercial: newCommercial,
      },
    });
  },

  resetWorkbench: () =>
    set({
      proposal: null,
      rawBriefText: "",
      filename: "",
      trace: [],
      selectedHighlightId: null,
      activeTab: "milestones",
    }),
}));
