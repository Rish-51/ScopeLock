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
        className="p-4 rounded-xl flex items-center justify-between gap-3"
        style={{
          backgroundColor: "var(--bg-input)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div className="space-y-1">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Mail className="w-4 h-4" style={{ color: "var(--status-safe-fg)" }} />
            <span>'Questions Before I Quote' Client Email Draft</span>
          </h3>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Send these clarification questions to the client before locking in your fixed price.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
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
        className="rounded-xl overflow-hidden space-y-3 p-4"
        style={{
          backgroundColor: "var(--bg-input)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {/* Subject */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
            Subject Line:
          </label>
          <input
            type="text"
            value={email.subject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-xs font-mono outline-none"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--border-focus)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
            }}
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
            Email Body:
          </label>
          <textarea
            value={email.body}
            onChange={(e) => handleBodyChange(e.target.value)}
            rows={12}
            className="w-full rounded-lg p-3 text-xs font-mono leading-relaxed outline-none resize-y"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--border-focus)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
            }}
          />
        </div>
      </div>
    </div>
  );
};
