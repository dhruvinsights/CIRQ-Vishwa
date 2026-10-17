"""Canonical Pydantic v2 models for CIRQ domain entities.

Mirrors the domain shapes typed in server/db.ts:
- ProvenanceRecord
- GeoPoint
- CompositionMeasurement
- ResourceComposition
- ResourceRecord
- ProcessorRecord
- PathwayRecord
- CircularLoopRecord
"""

from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

ProvenanceSourceType = Literal["API", "SATELLITE", "LAB_MEASURED", "ESTIMATED", "RESEARCH"]
ProvenanceStatus = Literal["LIVE", "DEMO", "CACHED", "STALE"]


class ProvenanceRecord(BaseModel):
    """Provenance record tracking data origin, license, and quality."""

    model_config = ConfigDict(extra="forbid")

    source: str
    sourceType: ProvenanceSourceType
    retrievedAt: str
    publishedAt: str
    geographicCoverage: str
    license: str
    qualityScore: float = Field(ge=0, le=100)
    status: ProvenanceStatus


class GeoPoint(BaseModel):
    """GeoJSON Point geometry and address context."""

    model_config = ConfigDict(extra="forbid")

    type: Literal["Point"] = "Point"
    coordinates: tuple[float, float]
    address: str
    countryCode: str
    region: str


CompositionUnit = Literal["%", "ratio", "GJ/t"]
CompositionMeasurementType = Literal["measured", "estimated", "inferred"]


class CompositionMeasurement(BaseModel):
    """A single proximate composition measurement with value, unit, and method."""

    model_config = ConfigDict(extra="forbid")

    value: float
    unit: CompositionUnit
    type: CompositionMeasurementType


class ResourceComposition(BaseModel):
    """Complete proximate analysis and energy characterisation for a biomass resource."""

    model_config = ConfigDict(extra="forbid")

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
    """Canonical biomass resource entity."""

    model_config = ConfigDict(extra="forbid")

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
    qualityScore: float = Field(ge=0, le=100)
    confidence: float = Field(ge=0, le=100)
    freshness: str
    composition: ResourceComposition
    provenance: list[ProvenanceRecord]


ProcessorStatus = Literal["OPERATIONAL", "MAINTENANCE", "IDLE"]


class ProcessorRecord(BaseModel):
    """Canonical processing facility entity."""

    model_config = ConfigDict(extra="forbid")

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
    status: ProcessorStatus
    queueDepth: int
    provenance: list[ProvenanceRecord]


PathwayStatus = Literal["LIVE", "DEMO", "CACHED"]


class PathwayRecord(BaseModel):
    """Canonical circular conversion pathway entity."""

    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    category: str
    primaryTechnology: str
    conversionEfficiency: float
    targetProducts: list[str]
    economicScore: float = Field(ge=0, le=100)
    technicalFeasibility: float = Field(ge=0, le=100)
    environmentalBenefit: float = Field(ge=0, le=100)
    overallScore: float = Field(ge=0, le=100)
    co2eAvoidedPerTon: float
    energyGeneratedPerTon: float
    confidence: float = Field(ge=0, le=100)
    evidenceCount: int
    freshness: str
    methodology: str
    status: PathwayStatus
    supportedResourceCategories: list[str]


CircularLoopStatus = Literal["ACTIVE", "SIMULATED", "PROPOSED"]


class CircularLoopRecord(BaseModel):
    """Canonical circular loop connecting resource, processor, and pathway."""

    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    resourceId: str
    processorId: str
    pathwayId: str
    status: CircularLoopStatus
    annualMaterialLoopTons: float
    carbonOffsetTons: float
    circularityIndex: float = Field(ge=0, le=100)
    economicValueAnnual: float
    currency: str
    participatingActors: list[str]
    nodesCount: int
