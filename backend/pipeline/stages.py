"""
Pipeline Stages with strict Locality.
Co-locates prompts, target schemas, and message builders per stage.
Source of truth: PLAN.md Section 4, GLOSSARY.md 'Scoping Pipeline'.
"""

from typing import Dict, List, Type
from pydantic import BaseModel
from backend.schemas.proposal import (
    RequirementsResult,
    RiskResult,
    MilestonePlan,
    ClientEmail,
)

SYSTEM_PROMPT_REQUIREMENTS = """You are ScopeLock Scoper, an expert technical estimator.
Extract atomic functional and non-functional requirements from the client brief.
RULES:
1. Every requirement MUST contain a source_quote copied EXACTLY character-for-character from the brief.
2. If you cannot find an exact verbatim quote in the brief, omit the item.
3. Extract exactly 3 or 4 key requirements total. Keep summaries concise (under 15 words).
4. Assign appropriate complexity_tags (e.g. AUTH, PAYMENTS, THIRD_PARTY_API, COMPLIANCE, REALTIME, MOBILE_RELEASE, AI_ML, NONE).
5. Output MUST strictly match the JSON schema."""

SYSTEM_PROMPT_RISKS = """You are ScopeLock Scoper, an expert software architect.
Analyze the client brief and requirements for technical risks and scope-creep traps.
RULES:
1. Identify 2 key technical risks with category, severity (LOW, MEDIUM, HIGH, CRITICAL), and concise 1-sentence mitigation.
2. Identify 2 scope-creep warnings: vague phrases in the brief that could cause unpaid work. For each, quote the EXACT ambiguous phrase from the brief, explain why it is dangerous, and provide a protective Statement of Work (SOW) clause.
3. List 2 to 3 explicit assumptions and out-of-scope items. Be concise.
4. Output MUST strictly match the JSON schema."""

SYSTEM_PROMPT_MILESTONES = """You are ScopeLock Scoper, an expert engineering project manager.
Break down the requirements into an ordered milestone plan with integer hour estimates.
RULES:
1. Provide exactly 3 sequential milestones (M1, M2, M3).
2. Each milestone must specify id, title, objective, deliverables (list of 2-3 concise strings), linked requirement_ids, an hour range (hours_min, hours_max), and depends_on (list of milestone ids).
3. Keep descriptions and deliverable lists concise (1-2 lines each) so all milestones fit completely without truncation.
4. Hours MUST be realistic integers (e.g. 10 to 25).
5. Do NOT compute prices, rates, totals, or percentages.
6. Output MUST strictly match the JSON schema."""

SYSTEM_PROMPT_EMAIL = """You are ScopeLock Scoper.
Draft a professional, courteous 'questions before I quote' email for the freelancer to send to the client.
RULES:
1. Highlight the key technical ambiguities and scope clarification questions.
2. Keep the tone collaborative, professional, and confidence-inspiring. Keep it under 100 words.
3. Output MUST strictly match the JSON schema with 'subject' and 'body'."""


class PipelineStage:
    """Base class for an isolated pipeline stage."""
    name: str
    response_model: Type[BaseModel]
    default_num_predict: int = 1500

    def build_messages(self, **kwargs) -> List[Dict[str, str]]:
        raise NotImplementedError


class RequirementsStage(PipelineStage):
    name = "requirements"
    response_model = RequirementsResult
    default_num_predict = 1500

    def build_messages(self, chunk_text: str) -> List[Dict[str, str]]:
        return [
            {"role": "system", "content": SYSTEM_PROMPT_REQUIREMENTS},
            {"role": "user", "content": f"Extract requirements from this project brief:\n\n{chunk_text}"},
        ]


class RiskStage(PipelineStage):
    name = "risks"
    response_model = RiskResult
    default_num_predict = 1500

    def build_messages(self, brief_excerpt: str, requirements: RequirementsResult) -> List[Dict[str, str]]:
        req_lines = [
            f"- {r.id}: {r.summary} (Tags: {[t.value for t in r.complexity_tags]})"
            for r in requirements.requirements
        ]
        req_context = "\n".join(req_lines)
        return [
            {"role": "system", "content": SYSTEM_PROMPT_RISKS},
            {
                "role": "user",
                "content": (
                    f"Brief excerpt:\n{brief_excerpt[:3000]}\n\n"
                    f"Extracted Requirements:\n{req_context}\n\n"
                    f"Analyze the technical risks, scope creep hazards, assumptions, and out-of-scope items."
                ),
            },
        ]


class MilestoneStage(PipelineStage):
    name = "milestones"
    response_model = MilestonePlan
    default_num_predict = 2048

    def build_messages(self, requirements: RequirementsResult, risks: RiskResult) -> List[Dict[str, str]]:
        req_lines = [
            f"- {r.id}: {r.summary} (Tags: {[t.value for t in r.complexity_tags]})"
            for r in requirements.requirements
        ]
        risk_lines = [f"- {risk.title} ({risk.severity}): {risk.mitigation}" for risk in risks.risks]
        return [
            {"role": "system", "content": SYSTEM_PROMPT_MILESTONES},
            {
                "role": "user",
                "content": (
                    f"Requirements:\n" + "\n".join(req_lines) + "\n\n"
                    f"Technical Risks:\n" + "\n".join(risk_lines) + "\n\n"
                    f"Create an ordered milestone plan with integer hour ranges for each milestone."
                ),
            },
        ]


class ClientEmailStage(PipelineStage):
    name = "client_email"
    response_model = ClientEmail
    default_num_predict = 800

    def build_messages(self, project_title: str, risks: RiskResult) -> List[Dict[str, str]]:
        questions = [r.client_question for r in risks.risks if r.client_question]
        for w in risks.scope_creep_warnings:
            questions.append(f"Scope clarification regarding '{w.vague_quote}'")

        return [
            {"role": "system", "content": SYSTEM_PROMPT_EMAIL},
            {
                "role": "user",
                "content": (
                    f"Project Title: {project_title}\n"
                    f"Open Questions and Risks to Clarify:\n"
                    + "\n".join(f"- {q}" for q in questions)
                    + "\n\nDraft a concise clarification email to the client."
                ),
            },
        ]
