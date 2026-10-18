import React, { useState } from "react";
import { X, Copy, Check, Download, Printer, FileText } from "lucide-react";
import { useProposalStore } from "../store/proposalStore";
import { generateProposalMarkdown } from "../lib/markdown";

export const ExportModal: React.FC = () => {
  const { isExportModalOpen, setExportModalOpen, proposal } = useProposalStore();
  const [copied, setCopied] = useState(false);

  if (!isExportModalOpen || !proposal) return null;

  const markdownContent = generateProposalMarkdown(proposal);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = proposal.requirements.project_title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_");
    link.href = url;
    link.download = `scopelock_proposal_${safeTitle}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="rounded-[3px] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[6px_6px_0px_#2d0c30] overflow-hidden"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "2px solid var(--border-hard)",
        }}
      >
        {/* Header */}
        <div
          className="p-5 flex items-center justify-between border-b-2"
          style={{
            borderColor: "var(--border-hard)",
            backgroundColor: "var(--bg-canvas)",
          }}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: "var(--status-safe-fg)" }} />
            <h3
              className="text-sm font-mono font-bold uppercase tracking-wider"
              style={{ color: "var(--text-primary)" }}
            >
              Export Client Proposal & Scope of Work
            </h3>
          </div>
          <button
            onClick={() => setExportModalOpen(false)}
            className="p-1.5 rounded-[2px] border border-[#2d0c30] transition-all cursor-pointer shadow-[1px_1px_0px_#2d0c30] hover:shadow-[2px_2px_0px_#2d0c30]"
            style={{ color: "var(--text-primary)", backgroundColor: "var(--bg-elevated)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs font-mono border-b-2"
          style={{
            backgroundColor: "var(--bg-input)",
            borderColor: "var(--border-hard)",
          }}
        >
          <div style={{ color: "var(--text-secondary)" }}>
            Export ready for client sign-off and Statement of Work (SOW) attachments.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-[2px] font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-[2px_2px_0px_#2d0c30] hover:shadow-[3px_3px_0px_#2d0c30] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "2px solid var(--border-hard)",
                color: "var(--text-primary)",
              }}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" style={{ color: "var(--status-safe-fg)" }} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-[2px] font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-[2px_2px_0px_#2d0c30] hover:shadow-[3px_3px_0px_#2d0c30] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "2px solid var(--border-hard)",
                color: "var(--text-primary)",
              }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-[2px] font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-[2px_2px_0px_#2d0c30] hover:shadow-[3px_3px_0px_#2d0c30] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              style={{
                backgroundColor: "var(--accent-primary-bg)",
                color: "var(--accent-primary-fg)",
                border: "2px solid var(--border-hard)",
              }}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Markdown Preview Area */}
        <div
          className="flex-1 p-6 overflow-y-auto font-mono text-xs whitespace-pre-wrap select-text leading-relaxed"
          style={{
            backgroundColor: "var(--bg-input)",
            color: "var(--text-primary)",
          }}
        >
          {markdownContent}
        </div>

        {/* Footer */}
        <div
          className="p-3 text-right border-t-2"
          style={{
            backgroundColor: "var(--bg-canvas)",
            borderColor: "var(--border-hard)",
          }}
        >
          <button
            onClick={() => setExportModalOpen(false)}
            className="px-4 py-1.5 rounded-[2px] text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[2px_2px_0px_#2d0c30] hover:shadow-[3px_3px_0px_#2d0c30] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "2px solid var(--border-hard)",
              color: "var(--text-primary)",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
