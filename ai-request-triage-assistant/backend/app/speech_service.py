import os
import re
import time
import logging
from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.models import SpeechCorrectionResponse

logger = logging.getLogger("speech_service")

SPEECH_SYSTEM_PROMPT = """You are an expert speech-to-text conversational query editor for the AI Request Triage platform.
The input was spoken by a user into a microphone, so it may have phonetic recognition errors, missing punctuation, awkward grammar, or colloquial phrasing.

Your instructions:
1. Fix all grammatical errors, spelling mistakes, and speech recognition transcription slips.
2. Add proper capitalization, punctuation, and a trailing question mark if it's an inquiry.
3. Properly capitalize enterprise domain terms:
   - 'sla' -> 'SLA', 'p1'/'p2'/'p3'/'p4' -> 'P1'/'P2'/'P3'/'P4'
   - 'langgraph' -> 'LangGraph', 'gemini' -> 'Gemini'
   - 'cloudwatch' -> 'CloudWatch', 'pagerduty' -> 'PagerDuty', 'datadog' -> 'Datadog'
   - 'stripe' -> 'Stripe', 'zendesk' -> 'Zendesk', 'webhook' / 'webhooks' -> 'Webhook' / 'Webhooks'
   - '504' / '504 error' -> '504 Gateway Timeout'
   - 'smtp' -> 'SMTP', 'api' -> 'API', 'oauth' -> 'OAuth'
4. Rewrite into a clean, concise, and natural question while PRESERVING the user's exact intent and meaning.
5. STRICT RULE: DO NOT ANSWER the question. ONLY return the corrected, rewritten query text. Nothing else.
"""

# Common domain terms for deterministic rule-based corrections
DOMAIN_REPLACEMENTS = [
    (r"\bsla\b", "SLA"),
    (r"\bp1\b", "P1"),
    (r"\bp2\b", "P2"),
    (r"\bp3\b", "P3"),
    (r"\bp4\b", "P4"),
    (r"\blanggraph\b", "LangGraph"),
    (r"\bgemini\b", "Gemini"),
    (r"\bcloudwatch\b", "CloudWatch"),
    (r"\bpagerduty\b", "PagerDuty"),
    (r"\bdatadog\b", "Datadog"),
    (r"\bstripe\b", "Stripe"),
    (r"\bzendesk\b", "Zendesk"),
    (r"\bwebhook\b", "Webhook"),
    (r"\bwebhooks\b", "Webhooks"),
    (r"\bsmtp\b", "SMTP"),
    (r"\bapi\b", "API"),
    (r"\boauth\b", "OAuth"),
    (r"\b504\s*(?:error|timeout|gateway)?\b", "504 Gateway Timeout"),
    (r"\bhow\s+this\s+website\s+work\b", "how does this website work"),
    (r"\bhow\s+this\s+platform\s+work\b", "how does this platform work"),
    (r"\bwhat\s+is\s+the\s+sla\s+for\b", "what is the SLA target for"),
    (r"\bwhats\b", "what's"),
    (r"\bcant\b", "can't"),
    (r"\bdont\b", "don't"),
    (r"\bwont\b", "won't"),
    (r"\bi\s*m\b", "I'm"),
]


def heuristic_speech_cleanup(raw_text: str) -> str:
    """Deterministic offline fallback to clean up spoken query grammar, spelling, and acronyms."""
    text = raw_text.strip()
    if not text:
        return ""

    # Replace known speech transcription quirks and acronyms
    for pattern, replacement in DOMAIN_REPLACEMENTS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

    # Clean multi-spaces
    text = re.sub(r"\s+", " ", text).strip()

    # Capitalize first character
    if text:
        text = text[0].upper() + text[1:]

    # Add question mark if it starts with question words and lacks ending punctuation
    question_starters = ("how", "what", "where", "why", "when", "can", "is", "does", "who", "which", "could", "should")
    first_word = text.split(" ")[0].lower().rstrip("?,.")
    if first_word in question_starters and not text.endswith(("?", ".", "!")):
        text += "?"
    elif not text.endswith(("?", ".", "!")):
        text += "."

    return text


def correct_and_rewrite_speech_query(
    text: str,
    api_key: Optional[str] = None,
    model_name: str = "gemini-2.5-flash",
    context: Optional[str] = "general",
) -> SpeechCorrectionResponse:
    """
    Submits raw speech recognition transcript to Gemini 2.5 Flash
    for intelligent grammar, spelling, punctuation, and phrasing rewriting.
    Gracefully falls back to high-reliability deterministic heuristics if offline.
    """
    start_time = time.time()
    trimmed = text.strip()
    if not trimmed:
        return SpeechCorrectionResponse(
            original_text=text,
            corrected_text=text,
            changes_made=False,
            latency_ms=0.0,
        )

    effective_key = api_key or os.getenv("GEMINI_API_KEY") or ""
    corrected_text = ""

    if effective_key:
        try:
            llm = ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=effective_key.strip().strip("'\""),
                temperature=0.2,
            )
            messages = [
                SystemMessage(content=SPEECH_SYSTEM_PROMPT),
                HumanMessage(
                    content=f"Context: {context or 'general'}\nRaw Spoken Input:\n\"{trimmed}\""
                ),
            ]
            response = llm.invoke(messages)
            content = response.content
            if isinstance(content, list):
                corrected_text = "".join(
                    [c.get("text", "") if isinstance(c, dict) else str(c) for c in content]
                )
            else:
                corrected_text = str(content)

            # Clean any leading/trailing quotes or markdown code block markers
            corrected_text = corrected_text.strip().strip("\"'").replace("```", "").strip()

        except Exception as exc:
            logger.warning(f"Gemini speech correction failed or unavailable: {exc}. Using heuristic fallback.")
            corrected_text = heuristic_speech_cleanup(trimmed)
    else:
        corrected_text = heuristic_speech_cleanup(trimmed)

    # If the model returned empty or identical string, ensure heuristic cleanup is at least applied
    if not corrected_text:
        corrected_text = heuristic_speech_cleanup(trimmed)

    latency_ms = round((time.time() - start_time) * 1000, 1)
    changes_made = corrected_text.strip() != trimmed

    return SpeechCorrectionResponse(
        original_text=text,
        corrected_text=corrected_text,
        changes_made=changes_made,
        latency_ms=latency_ms,
    )

