import pytest
from app.models import CategoryEnum, PriorityEnum, OwnerEnum, TriageAnalysis, TriageOutput
from app.agent import create_triage_graph


def test_triage_analysis_schema_validation():
    analysis = TriageAnalysis(
        summary="User cannot login due to 500 errors on authentication gateway.",
        category=CategoryEnum.TECHNICAL,
        priority=PriorityEnum.URGENT,
        priority_reason="System-wide authentication outage blocking all company employees.",
        assigned_owner=OwnerEnum.ENGINEERING,
    )
    assert analysis.category == "Technical"
    assert analysis.priority == "Urgent"
    assert analysis.assigned_owner == "Engineering"


def test_triage_graph_compilation():
    graph = create_triage_graph()
    assert graph is not None
    # Inspect nodes in compiled state graph
    assert "classify_and_analyze" in graph.nodes
    assert "draft_response" in graph.nodes

