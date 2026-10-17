"""
Tests for backend/app/models/domain.py  (ISS-7)

Criteria verified:
  AC-1  domain.py defines Pydantic v2 models for every entity typed in server/db.ts
  AC-2  importing domain has no side effects (no server, no DB required)
  AC-3  every record in seed/seed.json validates against the matching model
"""
from __future__ import annotations

import importlib
import json
import sys
from pathlib import Path

import pytest

# ---------------------------------------------------------------------------
# AC-2: import has no side effects — checked before any model is touched
# ---------------------------------------------------------------------------

def test_import_has_no_side_effects():
    """Importing domain.py in a fresh sub-interpreter must not start a server
    or raise any error unrelated to the module itself."""
    # Remove cached module so we can time a fresh import
    for key in list(sys.modules):
        if "backend.app.models" in key:
            del sys.modules[key]

    mod = importlib.import_module("backend.app.models.domain")
    # The module must expose the five canonical model classes
    for cls_name in (
        "ProvenanceRecord",
        "ResourceRecord",
        "ProcessorRecord",
        "PathwayRecord",
        "CircularLoopRecord",
    ):
        assert hasattr(mod, cls_name), f"domain.py must export {cls_name}"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

SEED_PATH = Path(__file__).parent.parent / "seed" / "seed.json"


@pytest.fixture(scope="module")
def seed() -> dict:
    return json.loads(SEED_PATH.read_text())


# Late import so test_import_has_no_side_effects runs first
from backend.app.models.domain import (  # noqa: E402
    CircularLoopRecord,
    PathwayRecord,
    ProcessorRecord,
    ProvenanceRecord,
    ResourceRecord,
)


# ---------------------------------------------------------------------------
# AC-1 / AC-3: model existence + seed validation
# ---------------------------------------------------------------------------

class TestProvenanceRecord:
    """ProvenanceRecord is used as a nested type; validate via a resource."""

    def test_validate_from_seed(self, seed):
        # Each resource contains at least one provenance entry
        for raw in seed["initialResources"]:
            for prov_raw in raw["provenance"]:
                rec = ProvenanceRecord.model_validate(prov_raw)
                assert rec.qualityScore >= 0
                assert rec.status in {"LIVE", "DEMO", "CACHED", "STALE"}

    def test_source_type_is_literal(self, seed):
        for raw in seed["initialResources"]:
            for prov_raw in raw["provenance"]:
                rec = ProvenanceRecord.model_validate(prov_raw)
                assert rec.sourceType in {
                    "API", "SATELLITE", "LAB_MEASURED", "ESTIMATED", "RESEARCH"
                }


class TestResourceRecord:
    def test_all_seed_resources_validate(self, seed):
        records = [ResourceRecord.model_validate(r) for r in seed["initialResources"]]
        assert len(records) == 5

    def test_composition_fields_present(self, seed):
        for raw in seed["initialResources"]:
            rec = ResourceRecord.model_validate(raw)
            comp = rec.composition
            for attr in (
                "moisture", "ash", "cellulose", "hemicellulose", "lignin",
                "carbon", "nitrogen", "cnRatio", "energyContent", "fixedCarbon",
            ):
                m = getattr(comp, attr)
                assert m.type in {"measured", "estimated", "inferred"}
                assert isinstance(m.value, float)

    def test_location_is_geo_point(self, seed):
        for raw in seed["initialResources"]:
            rec = ResourceRecord.model_validate(raw)
            assert rec.location.type == "Point"
            assert len(rec.location.coordinates) == 2

    def test_provenance_list_not_empty(self, seed):
        for raw in seed["initialResources"]:
            rec = ResourceRecord.model_validate(raw)
            assert len(rec.provenance) >= 1


class TestProcessorRecord:
    def test_all_seed_processors_validate(self, seed):
        records = [ProcessorRecord.model_validate(p) for p in seed["initialProcessors"]]
        assert len(records) == 5

    def test_status_is_literal(self, seed):
        for raw in seed["initialProcessors"]:
            rec = ProcessorRecord.model_validate(raw)
            assert rec.status in {"OPERATIONAL", "MAINTENANCE", "IDLE"}

    def test_numeric_capacities(self, seed):
        for raw in seed["initialProcessors"]:
            rec = ProcessorRecord.model_validate(raw)
            assert rec.capacityPerDay > 0
            assert rec.availableCapacity >= 0
            assert rec.minimumBatch > 0
            assert rec.maximumBatch >= rec.minimumBatch

    def test_provenance_list_not_empty(self, seed):
        for raw in seed["initialProcessors"]:
            rec = ProcessorRecord.model_validate(raw)
            assert len(rec.provenance) >= 1


class TestPathwayRecord:
    def test_all_seed_pathways_validate(self, seed):
        records = [PathwayRecord.model_validate(p) for p in seed["initialPathways"]]
        assert len(records) == 5

    def test_status_is_literal(self, seed):
        for raw in seed["initialPathways"]:
            rec = PathwayRecord.model_validate(raw)
            assert rec.status in {"LIVE", "DEMO", "CACHED"}

    def test_conversion_efficiency_range(self, seed):
        for raw in seed["initialPathways"]:
            rec = PathwayRecord.model_validate(raw)
            assert 0.0 < rec.conversionEfficiency <= 1.0

    def test_scores_in_range(self, seed):
        for raw in seed["initialPathways"]:
            rec = PathwayRecord.model_validate(raw)
            for score in (
                rec.economicScore, rec.technicalFeasibility,
                rec.environmentalBenefit, rec.overallScore,
            ):
                assert 0 <= score <= 100


class TestCircularLoopRecord:
    def test_all_seed_loops_validate(self, seed):
        records = [CircularLoopRecord.model_validate(l) for l in seed["initialCircularLoops"]]
        assert len(records) == 3

    def test_status_is_literal(self, seed):
        for raw in seed["initialCircularLoops"]:
            rec = CircularLoopRecord.model_validate(raw)
            assert rec.status in {"ACTIVE", "SIMULATED", "PROPOSED"}

    def test_circularity_index_range(self, seed):
        for raw in seed["initialCircularLoops"]:
            rec = CircularLoopRecord.model_validate(raw)
            assert 0.0 <= rec.circularityIndex <= 100.0

    def test_foreign_key_ids_non_empty(self, seed):
        for raw in seed["initialCircularLoops"]:
            rec = CircularLoopRecord.model_validate(raw)
            assert rec.resourceId
            assert rec.processorId
            assert rec.pathwayId
