/**
 * Generic Async Job Runner Hook / Utility
 * POSTs job, polls status until COMPLETED or FAILED, then resolves result.
 */
import { useState, useCallback } from 'react';
import { request } from './client.ts';

export interface JobState<TResult = any> {
  jobId: string | null;
  status: 'IDLE' | 'STARTING' | 'POLLING' | 'SUCCESS' | 'ERROR' | 'CANCELLED';
  progress: number;
  result: TResult | null;
  error: string | null;
}

export function useJob<TPayload, TResult>() {
  const [state, setState] = useState<JobState<TResult>>({
    jobId: null,
    status: 'IDLE',
    progress: 0,
    result: null,
    error: null
  });

  const run = useCallback(async (
    startEndpoint: string,
    payload: TPayload,
    statusEndpointFactory: (id: string) => string,
    resultEndpointFactory: (id: string) => string,
    pollIntervalMs: number = 800
  ): Promise<TResult> => {
    setState({
      jobId: null,
      status: 'STARTING',
      progress: 10,
      result: null,
      error: null
    });

    try {
      const startRes = await request<{ id?: string; jobId?: string; simulationId?: string; executionId?: string }>(
        startEndpoint,
        { method: 'POST', body: JSON.stringify(payload) }
      );

      const id = startRes.id || startRes.jobId || startRes.simulationId || startRes.executionId;
      if (!id) {
        throw new Error('No job ID returned by server');
      }

      setState(prev => ({ ...prev, jobId: id, status: 'POLLING', progress: 30 }));

      // Poll status
      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, pollIntervalMs));
        attempts++;

        const statusRes = await request<{ status: string; progressPercent?: number }>(
          statusEndpointFactory(id)
        );

        const currentStatus = statusRes.status.toUpperCase();

        if (currentStatus === 'COMPLETED' || currentStatus === 'SUCCESS') {
          setState(prev => ({ ...prev, progress: 90 }));
          const resultRes = await request<TResult>(resultEndpointFactory(id));
          setState({
            jobId: id,
            status: 'SUCCESS',
            progress: 100,
            result: resultRes,
            error: null
          });
          return resultRes;
        }

        if (currentStatus === 'FAILED' || currentStatus === 'ERROR') {
          throw new Error('Job execution failed on server.');
        }

        if (currentStatus === 'CANCELLED') {
          setState(prev => ({ ...prev, status: 'CANCELLED', error: 'Job was cancelled.' }));
          throw new Error('Job was cancelled');
        }

        setState(prev => ({
          ...prev,
          progress: Math.min(85, 30 + attempts * 5)
        }));
      }

      throw new Error('Job timed out waiting for server completion.');
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        status: 'ERROR',
        error: err.message || 'Job failed'
      }));
      throw err;
    }
  }, []);

  return { ...state, run };
}
