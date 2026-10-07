import React from 'react';
import { AlertCircle, Inbox, RefreshCw, WifiOff } from 'lucide-react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return (
    <div
      className={`animate-pulse bg-[#1E222B] rounded-md ${className}`}
      role="status"
      aria-label="Loading..."
    />
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  icon?: React.ReactNode;
}> = ({ title, description, action, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg bg-[#181A20] border border-[#262B35]">
      <div className="w-10 h-10 rounded-full bg-[#1E222B] flex items-center justify-center text-[#9EAAA5] mb-3">
        {icon || <Inbox className="w-5 h-5 text-[#E0FF20]" />}
      </div>
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <p className="text-xs text-[#9EAAA5] max-w-sm mt-1 mb-4">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-3 py-1.5 text-xs font-bold text-[#121317] bg-[#E0FF20] hover:bg-[#EEFF52] rounded-md transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  requestId?: string;
  onRetry?: () => void;
}> = ({ title = 'Failed to load data', message, requestId, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center rounded-lg bg-[#181A20] border border-[#DC2626]/40">
      <div className="w-9 h-9 rounded-full bg-[#DC2626]/15 flex items-center justify-center text-[#DC2626] mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <p className="text-xs text-[#9EAAA5] max-w-md mt-1 mb-2">{message}</p>
      {requestId && (
        <span className="text-[10px] font-mono text-[#68756F] mb-4">
          Request ID: {requestId}
        </span>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#1E222B] hover:bg-[#252A36] border border-[#262B35] rounded-md transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#E0FF20]" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
};

export const OfflineState: React.FC<{ onReconnect?: () => void }> = ({ onReconnect }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center rounded-lg bg-[#181A20] border border-[#262B35]">
      <div className="w-9 h-9 rounded-full bg-[#EF8B44]/15 flex items-center justify-center text-[#EF8B44] mb-3">
        <WifiOff className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-white">Client Disconnected</h4>
      <p className="text-xs text-[#9EAAA5] max-w-sm mt-1 mb-4">
        Connection to CIRQ edge nodes was lost. Cached telemetry is currently displayed.
      </p>
      {onReconnect && (
        <button
          onClick={onReconnect}
          className="px-3 py-1.5 text-xs font-medium text-white bg-[#1E222B] hover:bg-[#252A36] border border-[#262B35] rounded-md transition-colors"
        >
          Reconnect Stream
        </button>
      )}
    </div>
  );
};
