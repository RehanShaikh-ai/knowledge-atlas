import React, { useEffect, useState, useCallback } from 'react';
import { ClusterResponse, ClusterMember } from '@/types/cluster';
import { listClusters, getCluster, generateClusters } from '@/api/clusters';
import { Layers, Sparkles, X, RefreshCw, Loader2, AlertTriangle, FileText, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ClusterViewProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectCluster?: (clusterId: string) => void;
  onNavigateToNote?: (noteId: string) => void;
  className?: string;
}

export const ClusterView: React.FC<ClusterViewProps> = ({
  workspaceId,
  isOpen,
  onClose,
  onSelectCluster,
  onNavigateToNote,
  className,
}) => {
  const [clusters, setClusters] = useState<ClusterResponse[]>([]);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [selectedClusterDetail, setSelectedClusterDetail] = useState<ClusterResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobNotice, setJobNotice] = useState<string | null>(null);

  const fetchClusters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listClusters(workspaceId);
      setClusters(data);
      if (data.length > 0 && !selectedClusterId) {
        setSelectedClusterId(data[0].id);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load clusters';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, selectedClusterId]);

  useEffect(() => {
    if (isOpen) {
      fetchClusters();
    }
  }, [isOpen, fetchClusters]);

  // Load details of selected cluster
  useEffect(() => {
    if (!selectedClusterId) {
      setSelectedClusterDetail(null);
      return;
    }

    let isMounted = true;
    setIsLoadingDetail(true);

    getCluster(workspaceId, selectedClusterId)
      .then((detail) => {
        if (isMounted) setSelectedClusterDetail(detail);
      })
      .catch((err) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to load cluster details';
          setError(msg);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingDetail(false);
      });

    return () => {
      isMounted = false;
    };
  }, [workspaceId, selectedClusterId]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await generateClusters(workspaceId);
      setJobNotice(`Clustering job ${res.status}: ${res.job_id.slice(0, 8)}`);
      setTimeout(() => setJobNotice(null), 4000);
      await fetchClusters();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate clusters';
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFilterGraph = (clusterId: string) => {
    if (onSelectCluster) {
      onSelectCluster(clusterId);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <aside
      data-testid="cluster-view"
      className={cn(
        'w-[420px] bg-slate-900/95 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-2xl flex flex-col text-slate-200 z-30',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <Layers size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-xs tracking-wide uppercase text-slate-200">
              Concept Clusters
            </h3>
            <span className="text-[10px] text-slate-400">
              {clusters.length} semantic groups identified
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || isLoading}
            className="text-[11px] text-sky-400 hover:text-sky-300 bg-sky-950/60 hover:bg-sky-900/60 px-2 py-1 rounded-lg border border-sky-800/50 transition-colors flex items-center gap-1 disabled:opacity-50"
            title="Regenerate clusters via AI analysis"
          >
            <Sparkles size={11} className={isGenerating ? 'animate-spin' : ''} />
            <span>Generate</span>
          </button>
          <button
            onClick={fetchClusters}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
            title="Refresh"
            aria-label="Refresh clusters"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-sky-400' : ''} />
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
            aria-label="Close clusters"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Notices */}
      {jobNotice && (
        <div className="mt-3 p-2 bg-sky-950/80 border border-sky-800/60 text-sky-300 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <Sparkles size={13} />
          <span>{jobNotice}</span>
        </div>
      )}

      {error && (
        <div className="mt-3 p-2.5 bg-rose-950/80 border border-rose-800/60 text-rose-300 rounded-xl text-xs flex items-start gap-2">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Content Area */}
      {isLoading && clusters.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400">
          <Loader2 size={26} className="animate-spin text-sky-400 mb-2" />
          <p className="text-xs">Analyzing concept clusters...</p>
        </div>
      ) : clusters.length === 0 ? (
        <div
          data-testid="clusters-empty-state"
          className="flex-1 flex flex-col items-center justify-center py-12 text-center px-4"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center text-slate-500 mb-2.5">
            <Layers size={20} />
          </div>
          <h4 className="font-semibold text-xs text-slate-300">No Clusters Formed</h4>
          <p className="text-[11px] text-slate-500 mt-1 max-w-[240px] leading-relaxed">
            Click &ldquo;Generate&rdquo; to group related concepts and notes into semantic clusters.
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="mt-3 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs transition-colors flex items-center gap-1.5"
          >
            <Sparkles size={12} /> Generate Clusters
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col pt-3 space-y-3 min-h-0">
          {/* Cluster Select Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {clusters.map((c) => {
              const isSelected = c.id === selectedClusterId;
              return (
                <button
                  key={c.id}
                  type="button"
                  data-testid={`cluster-tab-${c.id}`}
                  onClick={() => setSelectedClusterId(c.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-colors border flex items-center gap-1.5',
                    isSelected
                      ? 'bg-sky-500/15 border-sky-500/50 text-sky-300 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  )}
                >
                  <span>{c.label}</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1 rounded-full">
                    {c.member_count ?? c.members?.length ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Cluster Detail View */}
          {selectedClusterDetail && (
            <div
              data-testid="cluster-detail-panel"
              className="flex-1 flex flex-col bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-3 overflow-hidden"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4
                    data-testid="cluster-title"
                    className="font-bold text-sm text-slate-100"
                  >
                    {selectedClusterDetail.label}
                  </h4>
                  {selectedClusterDetail.description && (
                    <p
                      data-testid="cluster-description"
                      className="text-xs text-slate-400 mt-0.5 leading-relaxed"
                    >
                      {selectedClusterDetail.description}
                    </p>
                  )}
                </div>
                {onSelectCluster && (
                  <button
                    onClick={() => handleFilterGraph(selectedClusterDetail.id)}
                    className="text-[10px] font-medium bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                    title="Filter constellation to this cluster"
                  >
                    <span>View in Graph</span>
                    <ChevronRight size={11} />
                  </button>
                )}
              </div>

              {/* Members List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px] max-h-[300px]">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Cluster Member Notes ({selectedClusterDetail.members?.length || selectedClusterDetail.member_count || 0})
                </div>
                {isLoadingDetail ? (
                  <div className="flex items-center justify-center py-6 text-slate-500 text-xs gap-2">
                    <Loader2 size={16} className="animate-spin text-sky-400" />
                    <span>Loading members...</span>
                  </div>
                ) : !selectedClusterDetail.members || selectedClusterDetail.members.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No member notes directly assigned.
                  </div>
                ) : (
                  selectedClusterDetail.members.map((member: ClusterMember) => (
                    <div
                      key={member.note_id}
                      data-testid={`cluster-member-${member.note_id}`}
                      className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={13} className="text-amber-400 shrink-0" />
                        {onNavigateToNote ? (
                          <button
                            type="button"
                            onClick={() => onNavigateToNote(member.note_id)}
                            className="font-medium text-slate-200 hover:text-amber-300 hover:underline truncate text-left"
                            title={member.note_title || member.note_id}
                          >
                            {member.note_title || member.note_id}
                          </button>
                        ) : (
                          <span className="font-medium text-slate-200 truncate">
                            {member.note_title || member.note_id}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                        {Math.round(member.score * 100)}% fit
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
