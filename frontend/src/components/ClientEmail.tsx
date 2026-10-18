import React, { useState } from "react";
import { Mail, Copy, Check } from "lucide-react";
import { useProposalStore } from "../store/proposalStore";

export const ClientEmail: React.FC = () => {
  const { proposal, setProposal } = useProposalStore();
  const [copied, setCopied] = useState(false);

  if (!proposal) return null;

  const email = proposal.client_email;

  const handleCopy = () => {
    const fullEmail = `Subject: ${email.subject}\n\n${email.body}`;
    navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubjectChange = (subject: string) => {
    setProposal({
      ...proposal,
      client_email: {
        ...email,
        subject,
      },
    });
  };

  const handleBodyChange = (body: string) => {
    setProposal({
      ...proposal,
      client_email: {
        ...email,
        body,
      },
    });
  };

  return (
    <div className="space-y-5">
      {/* Informational Banner */}
      <div
        className="p-4 rounded-[2px] flex items-center justify-between gap-3 shadow-[3px_3px_0px_#2d0c30]"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "2px solid var(--border-hard)",
        }}
      >
        <div className="space-y-1">
          <h3 className="text-sm font-bold font-sans flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Mail className="w-4 h-4" style={{ color: "var(--status-safe-fg)" }} />
            <span>'Questions Before I Quote' Client Email Draft</span>
          </h3>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Send these clarification questions to the client before locking in your fixed price.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="px-3.5 py-1.5 rounded-[2px] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-[2px_2px_0px_#2d0c30] hover:shadow-[3px_3px_0px_#2d0c30] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          style={{
            backgroundColor: "var(--accent-primary-bg)",
            color: "var(--accent-primary-fg)",
            border: "2px solid var(--border-hard)",
          }}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" style={{ color: "var(--status-safe-fg)" }} />
              <span>Email Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Full Email</span>
            </>
          )}
        </button>
      </div>

      {/* Email Composer Box */}
      <div
        className="rounded-[2px] overflow-hidden space-y-3 p-4 shadow-[4px_4px_0px_#2d0c30]"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "2px solid var(--border-hard)",
        }}
      >
        {/* Subject */}
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-primary)" }}>
            Subject Line:
          </label>
          <input
            type="text"
            value={email.subject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="w-full rounded-[2px] px-3 py-2 text-xs font-mono outline-none shadow-[2px_2px_0px_#2d0c30]"
            style={{
              backgroundColor: "var(--bg-input)",
              border: "2px solid var(--border-hard)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-primary)" }}>
            Email Body:
          </label>
          <textarea
            value={email.body}
            onChange={(e) => handleBodyChange(e.target.value)}
            rows={12}
            className="w-full rounded-[2px] p-3 text-xs font-mono leading-relaxed outline-none resize-y shadow-[2px_2px_0px_#2d0c30]"
            style={{
              backgroundColor: "var(--bg-input)",
              border: "2px solid var(--border-hard)",
              color: "var(--text-primary)",
            }}
          />
        </div>
      </div>
    </div>
  );
};
