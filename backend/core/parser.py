"""
Document Parser and Text Normalizer.
PLAN.md Section 3.3, 4:
- Reads .pdf (using pypdf, BSD licensed), .md, and .txt.
- Estimates tokens as chars / 4.
- Chunks long briefs (> 60% of num_ctx) by Markdown headings or paragraph boundaries.
- Merges and deduplicates requirements across chunks.
- NEVER logs or sends brief text to outside services.
"""

import io
import re
from typing import List, Tuple
from pydantic import BaseModel
from pypdf import PdfReader

from backend.schemas.proposal import RequirementsResult, Requirement


class ParsedDocument(BaseModel):
    filename: str
    text: str
    char_count: int
    estimated_tokens: int
    is_chunked: bool
    chunks: List[str]


def normalize_whitespace(text: str) -> str:
    """Normalize line endings and clean excess blank lines."""
    # Convert CRLF to LF
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Clean null bytes or non-printable chars
    text = text.replace("\x00", "")
    # Collapse 3+ consecutive newlines to 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def parse_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF using pypdf."""
    reader = PdfReader(io.BytesIO(file_bytes))
    page_texts: List[str] = []
    for idx, page in enumerate(reader.pages):
        page_text = page.extract_text() or ""
        page_texts.append(f"--- Page {idx + 1} ---\n{page_text}")
    return "\n\n".join(page_texts)


def estimate_tokens(text: str) -> int:
    """Estimate token count as chars / 4 per PLAN.md Section 4."""
    return max(1, len(text) // 4)


def split_text_into_chunks(text: str, max_chunk_tokens: int) -> List[str]:
    """
    Split long document into chunks along heading or paragraph boundaries.
    """
    # Try splitting by Markdown headings (#, ##, ###)
    heading_sections = re.split(r"(?m)(?=^#{1,3}\s+)", text)
    if len(heading_sections) > 1:
        chunks: List[str] = []
        current_chunk = ""
        for sec in heading_sections:
            if not current_chunk:
                current_chunk = sec
            elif estimate_tokens(current_chunk + "\n\n" + sec) <= max_chunk_tokens:
                current_chunk += "\n\n" + sec
            else:
                chunks.append(current_chunk.strip())
                current_chunk = sec
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        return chunks

    # Fallback to paragraph splitting
    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = ""
    for para in paragraphs:
        if not current_chunk:
            current_chunk = para
        elif estimate_tokens(current_chunk + "\n\n" + para) <= max_chunk_tokens:
            current_chunk += "\n\n" + para
        else:
            chunks.append(current_chunk.strip())
            current_chunk = para
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    return chunks


def parse_document(file_bytes: bytes, filename: str, num_ctx: int = 16384) -> ParsedDocument:
    """
    Parses document from bytes, extracts text, estimates tokens,
    and partitions into chunks if text exceeds ~60% of num_ctx.
    """
    ext = filename.lower().split(".")[-1]
    if ext == "pdf":
        raw_text = parse_pdf(file_bytes)
    else:
        # text / markdown / fallback
        try:
            raw_text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            raw_text = file_bytes.decode("latin-1", errors="replace")

    normalized = normalize_whitespace(raw_text)
    est_toks = estimate_tokens(normalized)

    # 60% of num_ctx threshold
    threshold_tokens = int(num_ctx * 0.60)
    if est_toks > threshold_tokens:
        chunks = split_text_into_chunks(normalized, threshold_tokens)
        is_chunked = len(chunks) > 1
    else:
        chunks = [normalized]
        is_chunked = False

    return ParsedDocument(
        filename=filename,
        text=normalized,
        char_count=len(normalized),
        estimated_tokens=est_toks,
        is_chunked=is_chunked,
        chunks=chunks,
    )


def merge_requirements_results(results: List[RequirementsResult]) -> RequirementsResult:
    """
    Merge multiple chunk RequirementsResults and re-index requirement IDs (R1, R2, ...).
    Deduplicates requirements by normalized summary and source quote.
    """
    if not results:
        return RequirementsResult(
            project_title="Untitled Proposal",
            one_line_summary="No requirements extracted.",
            stated_platform_or_stack=[],
            requirements=[],
        )

    primary = results[0]
    all_reqs: List[Requirement] = []
    seen_keys = set()
    all_stacks = list(primary.stated_platform_or_stack)

    for r in results:
        for stack_item in r.stated_platform_or_stack:
            if stack_item not in all_stacks:
                all_stacks.append(stack_item)

        for req in r.requirements:
            key = (req.summary.strip().lower(), req.source_quote.strip().lower())
            if key not in seen_keys:
                seen_keys.add(key)
                all_reqs.append(req)

    # Re-index requirements cleanly: R1, R2, ...
    indexed_reqs: List[Requirement] = []
    for idx, req in enumerate(all_reqs, start=1):
        indexed_reqs.append(
            Requirement(
                id=f"R{idx}",
                summary=req.summary,
                kind=req.kind,
                source_quote=req.source_quote,
                complexity_tags=req.complexity_tags,
            )
        )

    return RequirementsResult(
        project_title=primary.project_title,
        one_line_summary=primary.one_line_summary,
        stated_platform_or_stack=all_stacks,
        requirements=indexed_reqs,
    )
