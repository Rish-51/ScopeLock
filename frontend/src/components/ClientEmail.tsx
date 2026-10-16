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
      <div className="p-4 bg-indigo-950/30 border border-indigo-700/40 rounded-xl flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-400" />
            <span>'Questions Before I Quote' Client Email Draft</span>
          </h3>
          <p className="text-xs text-indigo-200/80">
            Send these clarification questions to the client before locking in your fixed price.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-300" />
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
      <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl overflow-hidden space-y-3 p-4">
        {/* Subject */}
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            Subject Line:
          </label>
          <input
            type="text"
            value={email.subject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            Email Body:
          </label>
          <textarea
            value={email.body}
            onChange={(e) => handleBodyChange(e.target.value)}
            rows={12}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 leading-relaxed focus:outline-none focus:border-indigo-500 resize-y"
          />
        </div>
      </div>
    </div>
  );
};
