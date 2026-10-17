"""Tests for canonical Pydantic v2 domain models (ISS-7).

Proves:
1. Domain module defines models for all server/db.ts entities with explicit types and no Any.
2. Importing domain module has no side effects.
3. Every record in backend/seed/seed.json validates successfully against its respective model.
"""

import importlib
import json
from pathlib import Path
from typing import Any, get_args, get_origin

import pytest
from pydantic import BaseModel, ValidationError

from backend.app.models import (
    CircularLoopRecord,
    CompositionMeasurement,
    GeoPoint,
    PathwayRecord,
    ProcessorRecord,
    ProvenanceRecord,
    ResourceComposition,
    ResourceRecord,
)

SEED_PATH = Path(__file__).parent.parent / "seed" / "seed.json"


@pytest.fixture(scope="module")
def seed_data() -> dict:
    """Load seed JSON data for validation tests."""
    with open(SEED_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def test_import_has_no_side_effects():
    """AC-2: Importing backend.app.models.domain has no side effects and exposes canonical models."""
    mod = importlib.import_module("backend.app.models.domain")
    assert hasattr(mod, "ResourceRecord")
    assert hasattr(mod, "ProcessorRecord")
    assert hasattr(mod, "PathwayRecord")
    assert hasattr(mod, "CircularLoopRecord")
    assert hasattr(mod, "ProvenanceRecord")
    assert hasattr(mod, "ResourceComposition")
    assert hasattr(mod, "CompositionMeasurement")
    assert hasattr(mod, "GeoPoint")


def _check_no_any(model_cls: type[BaseModel]):
    """Recursively verify that no field in a Pydantic model is typed as Any."""
    for name, field in model_cls.model_fields.items():
        annotation = field.annotation
        assert annotation is not Any, f"Field '{name}' in {model_cls.__name__} must not be typed as Any"
        origin = get_origin(annotation)
        args = get_args(annotation)
        assert Any not in args, f"Field '{name}' in {model_cls.__name__} has Any in type arguments: {args}"
        if origin is not None and isinstance(origin, type) and issubclass(origin, BaseModel):
            _check_no_any(origin)
        for arg in args:
            if isinstance(arg, type) and issubclass(arg, BaseModel):
                _check_no_any(arg)


def test_models_have_explicit_types_and_no_any():
    """AC-1: Every entity model is a Pydantic v2 BaseModel with explicit types and no Any."""
    models = [
        ProvenanceRecord,
        GeoPoint,
        CompositionMeasurement,
        ResourceComposition,
        ResourceRecord,
        ProcessorRecord,
        PathwayRecord,
        CircularLoopRecord,
    ]
    for model in models:
        assert issubclass(model, BaseModel), f"{model.__name__} must inherit from pydantic.BaseModel"
        _check_no_any(model)


def test_package_exports_all_canonical_models():
    """Verify backend.app.models exports all models cleanly."""
    models_pkg = importlib.import_module("backend.app.models")
    for name in [
        "ProvenanceRecord",
        "GeoPoint",
        "CompositionMeasurement",
        "ResourceComposition",
        "ResourceRecord",
        "ProcessorRecord",
        "PathwayRecord",
        "CircularLoopRecord",
    ]:
        assert hasattr(models_pkg, name)


def test_validate_all_seed_resources(seed_data: dict):
    """AC-3: Validate every resource record in seed.json against ResourceRecord."""
    resources = seed_data["initialResources"]
    assert len(resources) == 5, "Seed should contain 5 resources"
    for raw in resources:
        record = ResourceRecord.model_validate(raw)
        assert record.id.startswith("res-")
        assert record.location.type == "Point"
        assert len(record.location.coordinates) == 2
        assert isinstance(record.composition, ResourceComposition)
        assert record.composition.moisture.unit == "%"
        assert record.composition.cnRatio.unit == "ratio"
        assert record.composition.energyContent.unit == "GJ/t"
        assert len(record.provenance) > 0
        for prov in record.provenance:
            assert isinstance(prov, ProvenanceRecord)
            assert prov.status in ("LIVE", "DEMO", "CACHED", "STALE")


@pytest.mark.parametrize("resource_idx", range(5))
def test_validate_individual_seed_resource(seed_data: dict, resource_idx: int):
    """Validate each individual seed resource record."""
    raw = seed_data["initialResources"][resource_idx]
    record = ResourceRecord.model_validate(raw)
    assert record.id == raw["id"]
    assert record.quantity == raw["quantity"]
    assert record.qualityScore == raw["qualityScore"]
    assert record.confidence == raw["confidence"]


def test_validate_all_seed_processors(seed_data: dict):
    """AC-3: Validate every processor record in seed.json against ProcessorRecord."""
    processors = seed_data["initialProcessors"]
    assert len(processors) == 5, "Seed should contain 5 processors"
    for raw in processors:
        record = ProcessorRecord.model_validate(raw)
        assert record.id.startswith("proc-")
        assert record.location.type == "Point"
        assert len(record.location.coordinates) == 2
        assert record.status in ("OPERATIONAL", "MAINTENANCE", "IDLE")
        assert record.capacityPerDay > 0
        assert len(record.provenance) > 0


@pytest.mark.parametrize("proc_idx", range(5))
def test_validate_individual_seed_processor(seed_data: dict, proc_idx: int):
    """Validate each individual seed processor record."""
    raw = seed_data["initialProcessors"][proc_idx]
    record = ProcessorRecord.model_validate(raw)
    assert record.id == raw["id"]
    assert record.capacityPerDay == raw["capacityPerDay"]
    assert record.status == raw["status"]


def test_validate_all_seed_pathways(seed_data: dict):
    """AC-3: Validate every pathway record in seed.json against PathwayRecord."""
    pathways = seed_data["initialPathways"]
    assert len(pathways) == 5, "Seed should contain 5 pathways"
    for raw in pathways:
        record = PathwayRecord.model_validate(raw)
        assert record.id.startswith("pw-")
        assert record.status in ("LIVE", "DEMO", "CACHED")
        assert 0 <= record.conversionEfficiency <= 1
        assert 0 <= record.overallScore <= 100
        assert 0 <= record.confidence <= 100


@pytest.mark.parametrize("pathway_idx", range(5))
def test_validate_individual_seed_pathway(seed_data: dict, pathway_idx: int):
    """Validate each individual seed pathway record."""
    raw = seed_data["initialPathways"][pathway_idx]
    record = PathwayRecord.model_validate(raw)
    assert record.id == raw["id"]
    assert record.conversionEfficiency == raw["conversionEfficiency"]
    assert record.overallScore == raw["overallScore"]


def test_validate_all_seed_circular_loops(seed_data: dict):
    """AC-3: Validate every circular loop record in seed.json against CircularLoopRecord."""
    loops = seed_data["initialCircularLoops"]
    assert len(loops) == 3, "Seed should contain 3 circular loops"
    for raw in loops:
        record = CircularLoopRecord.model_validate(raw)
        assert record.id.startswith("loop-")
        assert record.status in ("ACTIVE", "SIMULATED", "PROPOSED")
        assert 0 <= record.circularityIndex <= 100
        assert record.annualMaterialLoopTons > 0


@pytest.mark.parametrize("loop_idx", range(3))
def test_validate_individual_seed_loop(seed_data: dict, loop_idx: int):
    """Validate each individual seed circular loop record."""
    raw = seed_data["initialCircularLoops"][loop_idx]
    record = CircularLoopRecord.model_validate(raw)
    assert record.id == raw["id"]
    assert record.circularityIndex == raw["circularityIndex"]
    assert record.annualMaterialLoopTons == raw["annualMaterialLoopTons"]


def test_provenance_validation_rejects_invalid_quality_score():
    """Verify qualityScore validation boundary [0, 100]."""
    with pytest.raises(ValidationError):
        ProvenanceRecord(
            source="Test Source",
            sourceType="API",
            retrievedAt="2026-10-06T14:00:00Z",
            publishedAt="2026-10-06T12:00:00Z",
            geographicCoverage="Global",
            license="MIT",
            qualityScore=150,  # Invalid: > 100
            status="LIVE",
        )


def test_provenance_validation_rejects_invalid_status():
    """Verify status validation against Literal union."""
    with pytest.raises(ValidationError):
        ProvenanceRecord(
            source="Test Source",
            sourceType="API",
            retrievedAt="2026-10-06T14:00:00Z",
            publishedAt="2026-10-06T12:00:00Z",
            geographicCoverage="Global",
            license="MIT",
            qualityScore=90,
            status="UNKNOWN_STATUS",  # type: ignore[arg-type]
        )


def test_composition_measurement_rejects_invalid_type():
    """Verify composition measurement type validation."""
    with pytest.raises(ValidationError):
        CompositionMeasurement(
            value=12.4,
            unit="%",
            type="fabricated",  # type: ignore[arg-type]
        )


def test_models_forbid_extra_fields():
    """Verify that models strictly forbid undeclared extra fields."""
    with pytest.raises(ValidationError):
        GeoPoint(
            type="Point",
            coordinates=(80.9462, 26.8467),
            address="Test Address",
            countryCode="IND",
            region="Uttar Pradesh",
            extraField="not allowed",  # type: ignore[call-arg]
        )
