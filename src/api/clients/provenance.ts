import { request } from '../client.ts';

export const provenanceClient = {
  getResourceProvenance: (resourceId: string) => {
    return request<{ resourceId: string; provenance: any[]; verified: boolean }>(`/provenance/resources/${resourceId}`);
  },

  getPathwayProvenance: (pathwayId: string) => {
    return request<{ pathwayId: string; methodology: string; evidenceCount: number; confidence: number; status: string }>(`/provenance/pathways/${pathwayId}`);
  },

  getImpactProvenance: (impactId: string) => {
    return request<{ impactId: string; sourceStandard: string; auditTrail: string[]; status: string }>(`/provenance/impacts/${impactId}`);
  },

  getExecutionProvenance: (executionId: string) => {
    return request<{ executionId: string; dataSources: string[]; auditChain: string }>(`/provenance/executions/${executionId}`);
  }
};
