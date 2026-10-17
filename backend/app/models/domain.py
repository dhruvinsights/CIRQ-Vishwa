"""
Canonical Pydantic v2 domain models for CIRQ.

These are the single source of truth for domain shapes, mirroring every
interface typed in server/db.ts.  Importing this module has no side effects:
it does not connect to any database or external service.
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Shared / primitive sub-models
# ---------------------------------------------------------------------------

class GeoPoint(BaseModel):
    """GeoJSON Point location shared by Resource and Processor records."""

    type: Literal["Point"]
    coordinates: tuple[float, float]
    address: str
    countryCode: str
    region: str


class ProvenanceRecord(BaseModel):
    """Provenance chain entry — every data record carries one or more of these."""

    source: str
    sourceType: Literal["API", "SATELLITE", "LAB_MEASURED", "ESTIMATED", "RESEARCH"]
    retrievedAt: str
    publishedAt: str
    geographicCoverage: str
    license: str
    qualityScore: int  # 0–100
    status: Literal["LIVE", "DEMO", "CACHED", "STALE"]


# ---------------------------------------------------------------------------
# ResourceRecord — biomass feedstock
# ---------------------------------------------------------------------------

class CompositionMeasurement(BaseModel):
    """A single proximate-analysis measurement with its unit and measurement type."""

    value: float
    unit: str
    type: Literal["measured", "estimated", "inferred"]


class ResourceComposition(BaseModel):
    """Proximate composition of a biomass resource."""

    moisture: CompositionMeasurement
    ash: CompositionMeasurement
    cellulose: CompositionMeasurement
    hemicellulose: CompositionMeasurement
    lignin: CompositionMeasurement
    carbon: CompositionMeasurement
    nitrogen: CompositionMeasurement
    cnRatio: CompositionMeasurement
    energyContent: CompositionMeasurement
    fixedCarbon: CompositionMeasurement


class ResourceRecord(BaseModel):
    """Agricultural biomass feedstock resource."""

    id: str
    canonicalConceptId: str
    name: str
    aliases: list[str]
    category: str
    sourceType: str
    quantity: float
    unit: str
    currency: str
    location: GeoPoint
    availabilityStart: str
    availabilityEnd: str
    seasonality: list[str]
    qualityScore: int
    confidence: int
    freshness: str
    composition: ResourceComposition
    provenance: list[ProvenanceRecord]


# ---------------------------------------------------------------------------
# ProcessorRecord — processing facility
# ---------------------------------------------------------------------------

class ProcessorRecord(BaseModel):
    """Circular-economy processing facility."""

    id: str
    name: str
    category: str
    location: GeoPoint
    capabilities: list[str]
    supportedResources: list[str]
    capacityPerDay: float
    availableCapacity: float
    unit: str
    minimumBatch: float
    maximumBatch: float
    energyDemandKwhPerT: float
    processingCostPerT: float
    currency: str
    certifications: list[str]
    status: Literal["OPERATIONAL", "MAINTENANCE", "IDLE"]
    queueDepth: int
    provenance: list[ProvenanceRecord]


# ---------------------------------------------------------------------------
# PathwayRecord — circular conversion pathway
# ---------------------------------------------------------------------------

class PathwayRecord(BaseModel):
    """Circular conversion pathway with multi-objective scoring."""

    id: str
    name: str
    category: str
    primaryTechnology: str
    conversionEfficiency: float  # e.g. 0.42
    targetProducts: list[str]
    economicScore: int
    technicalFeasibility: int
    environmentalBenefit: int
    overallScore: int
    co2eAvoidedPerTon: float  # kgCO2e/t
    energyGeneratedPerTon: float  # kWh/t
    confidence: int
    evidenceCount: int
    freshness: str
    methodology: str
    status: Literal["LIVE", "DEMO", "CACHED"]
    supportedResourceCategories: list[str]


# ---------------------------------------------------------------------------
# CircularLoopRecord — end-to-end circular economy loop
# ---------------------------------------------------------------------------

class CircularLoopRecord(BaseModel):
    """An active, simulated or proposed circular material loop."""

    id: str
    name: str
    resourceId: str
    processorId: str
    pathwayId: str
    status: Literal["ACTIVE", "SIMULATED", "PROPOSED"]
    annualMaterialLoopTons: float
    carbonOffsetTons: float
    circularityIndex: float  # 0–100
    economicValueAnnual: float
    currency: str
    participatingActors: list[str]
    nodesCount: int
