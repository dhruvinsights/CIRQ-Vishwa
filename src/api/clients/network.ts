import { request } from '../client.ts';

export const networkClient = {
  getNetwork: () => request<{ nodesCount: number; edgesCount: number; density: number; clusters: number; status: string }>('/network'),
  getNodes: () => request<{ nodes: any[] }>('/network/nodes'),
  getEdges: () => request<{ edges: any[] }>('/network/edges'),
  getClusters: () => request<{ clusters: any[] }>('/network/clusters'),
  getNetworkResource: (resourceId: string) => request<{ center: string; subgraph: { nodes: any[]; edges: any[] } }>(`/network/${resourceId}`),
  queryNetwork: (query: any) => request<{ matchedPaths: any[]; confidence: number }>('/network/query', {
    method: 'POST',
    body: JSON.stringify(query)
  })
};
