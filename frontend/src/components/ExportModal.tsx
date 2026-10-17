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
        className="rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {/* Header */}
        <div
          className="p-5 flex items-center justify-between"
          style={{
            borderBottom: "1px solid var(--border-subtle)",
            backgroundColor: "var(--bg-canvas)",
          }}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: "var(--status-safe-fg)" }} />
            <h3
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: "var(--text-primary)" }}
            >
              Export Client Proposal & Scope of Work
            </h3>
          </div>
          <button
            onClick={() => setExportModalOpen(false)}
            className="p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs"
          style={{
            backgroundColor: "var(--bg-input)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ color: "var(--text-secondary)" }}>
            Export ready for client sign-off and Statement of Work (SOW) attachments.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-secondary)";
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
              className="px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              style={{
                backgroundColor: "var(--accent-primary-bg)",
                color: "var(--accent-primary-fg)",
                borderRadius: "var(--input-radius)",
                fontWeight: 600,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--accent-primary-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--accent-primary-bg)";
              }}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
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
          className="p-3 text-right"
          style={{
            backgroundColor: "var(--bg-canvas)",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <button
            onClick={() => setExportModalOpen(false)}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
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
