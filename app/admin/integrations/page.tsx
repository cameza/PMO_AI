'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, Link2, Unlink, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import {
  connectLinear,
  syncLinear,
  fetchIntegrationStatus,
  disconnectLinear,
  type IntegrationStatus,
  type SyncResult,
} from '@/lib/api';

export default function IntegrationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<IntegrationStatus>({ connected: false });
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadStatus();
  }, [authLoading, user]);

  const loadStatus = async () => {
    const s = await fetchIntegrationStatus();
    setStatus(s);
  };

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      setError('Please enter a Linear API key');
      return;
    }
    setIsConnecting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await connectLinear(apiKey.trim());
      if (result.success) {
        setSuccessMessage(`Connected to workspace: ${result.organization?.name || 'Linear'}`);
        setApiKey('');
        await loadStatus();
      } else {
        setError(result.error || 'Connection failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await syncLinear();
      setLastSyncResult(result);
      setSuccessMessage(
        `Synced ${result.programs} programs, ${result.milestones} milestones, ${result.strategic_objectives} strategic objectives`
      );
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Linear integration? Synced data will remain in the database.')) return;
    setIsDisconnecting(true);
    setError(null);
    try {
      await disconnectLinear();
      setStatus({ connected: false });
      setSuccessMessage('Linear integration disconnected');
      setLastSyncResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed');
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-deep flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent-violet border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white">Integrations</h1>
            <p className="text-sm text-slate-500">Connect external project management tools</p>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 bg-accent-rose/10 border border-accent-rose/20 rounded-xl flex items-center gap-2">
            <XCircle className="w-4 h-4 text-accent-rose flex-shrink-0" />
            <span className="text-sm text-accent-rose">{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 bg-accent-emerald/10 border border-accent-emerald/20 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent-emerald flex-shrink-0" />
            <span className="text-sm text-accent-emerald">{successMessage}</span>
          </div>
        )}

        {/* Linear Integration Card */}
        <div className="bg-surface rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#5E6AD2] rounded-xl flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 100 100" fill="none">
                  <path d="M1.22541 61.5228c-.97401-6.3956-.22714-13.0413 2.25364-18.8631C5.76829 36.8399 9.94609 31.9387 15.2354 28.4884c5.2893-3.4503 11.4649-5.3072 17.7895-5.3483 6.3246-.0412 12.5237 1.7442 17.8573 5.1348l-4.9424 7.6082c-3.7362-2.3755-8.0835-3.6273-12.5089-3.6018-4.4254.0256-8.7583 1.3305-12.4686 3.7519-3.7103 2.4214-6.6291 5.8522-8.4074 9.8782-1.7783 4.026-2.3411 8.4823-1.6199 12.8328l8.8118-1.4513z" fill="white"/>
                  <path d="M.00519 46.8891c.20174-2.7618.67454-5.4983 1.41081-8.1613l8.6035 2.7992c-.5765 2.0842-.9469 4.2233-1.1037 6.3863L.00519 46.8891z" fill="white" fillOpacity=".5"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Linear</h2>
                <p className="text-xs text-slate-500">Project management & issue tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {status.connected ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-accent-emerald bg-accent-emerald/10 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-accent-emerald rounded-full animate-pulse" />
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-700/50 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                  Disconnected
                </span>
              )}
            </div>
          </div>

          {!status.connected ? (
            /* Connect Form */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="lin_api_..."
                  className="w-full bg-deep border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-violet/50 transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Generate at Linear → Settings → API → Personal API keys
                </p>
              </div>
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full flex items-center justify-center gap-2 bg-accent-violet text-white font-semibold py-2.5 rounded-xl hover:bg-accent-violet/80 transition-colors disabled:opacity-50"
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                {isConnecting ? 'Connecting...' : 'Connect Linear'}
              </button>
            </div>
          ) : (
            /* Connected State */
            <div className="space-y-4">
              {/* Workspace Info */}
              {status.organization && (
                <div className="bg-deep/50 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Workspace</p>
                      <p className="text-sm font-medium text-white">{status.organization.workspace_name}</p>
                    </div>
                    {status.last_sync_at && (
                      <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Last Sync</p>
                        <p className="text-sm text-slate-300">{new Date(status.last_sync_at).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sync Result */}
              {lastSyncResult && (
                <div className="bg-deep/50 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Last Sync Results</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-white">{lastSyncResult.programs}</p>
                      <p className="text-xs text-slate-500">Programs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-white">{lastSyncResult.milestones}</p>
                      <p className="text-xs text-slate-500">Milestones</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-white">{lastSyncResult.strategic_objectives}</p>
                      <p className="text-xs text-slate-500">Objectives</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="flex-1 flex items-center justify-center gap-2 bg-accent-violet text-white font-semibold py-2.5 rounded-xl hover:bg-accent-violet/80 transition-colors disabled:opacity-50"
                >
                  {isSyncing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-accent-rose/30 text-accent-rose rounded-xl hover:bg-accent-rose/10 transition-colors disabled:opacity-50"
                >
                  {isDisconnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unlink className="w-4 h-4" />
                  )}
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mapping Info */}
        <div className="mt-6 bg-surface rounded-2xl border border-white/10 p-6">
          <h3 className="text-sm font-semibold text-white mb-3">Field Mapping (v1)</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Linear Initiative</span>
              <span className="text-slate-300">→ Strategic Objective</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Linear Project</span>
              <span className="text-slate-300">→ Program</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Project Milestone</span>
              <span className="text-slate-300">→ Milestone</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Project Status</span>
              <span className="text-slate-300">→ Pipeline Stage</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Product Line Label</span>
              <span className="text-slate-300">→ Product Line</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Issues / Risks</span>
              <span className="text-slate-300">→ Not mapped (manual entry)</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Custom mapping UI and AI-assisted mapping coming in a future release.
          </p>
        </div>
      </div>
    </div>
  );
}
