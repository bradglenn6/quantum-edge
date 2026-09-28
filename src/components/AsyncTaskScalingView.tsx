import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Play, 
  RotateCcw, 
  Trash2, 
  CheckCircle, 
  AlertOctagon, 
  Server
} from 'lucide-react';
import { TaskEngine } from '../services/taskEngine';
import { AsyncTask } from '../types';

export const AsyncTaskScalingView: React.FC = () => {
  const engine = TaskEngine.getInstance();
  const [tasks, setTasks] = useState<AsyncTask[]>(engine.getTasks());

  // Task creation state
  const [taskTitle, setTaskTitle] = useState('Dynamic ML-KEM-1024 Ephemeral Rotation');
  const [taskType, setTaskType] = useState<AsyncTask['type']>('PQC_REKEYING');
  const [taskPriority, setTaskPriority] = useState<AsyncTask['priority']>('NORMAL');
  const [selectedWorker, setSelectedWorker] = useState<AsyncTask['cloudWorker']>('AWS-Lambda-PQC-1');

  useEffect(() => {
    const unsubscribe = engine.subscribe(updated => {
      setTasks(updated);
    });
    return () => unsubscribe();
  }, [engine]);

  const handleEnqueue = () => {
    if (!taskTitle.trim()) return;
    engine.enqueueTask(taskTitle, taskType, taskPriority, selectedWorker);
    setTaskTitle('Dynamic ML-KEM-1024 Ephemeral Rotation');
  };

  const handleRetryDlq = (taskId: string) => {
    engine.retryDlqTask(taskId);
  };

  const handleClearCompleted = () => {
    engine.clearCompleted();
  };

  // Compute distribution
  const runningCount = tasks.filter(t => t.status === 'RUNNING').length;
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const dlqCount = tasks.filter(t => t.status === 'DLQ').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Asynchronous Task Processing &amp; Scaling Engine</h1>
            <span className="text-xs font-mono-code text-purple-400">Horizontal Multi-Cloud Dispatch</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Distributed background task queue balancing heavy post-quantum cryptographic workloads across AWS, GCP, Azure, and bare-metal edge nodes.
          </p>
        </div>

        <button
          onClick={handleClearCompleted}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-mono-code transition-colors border border-slate-700"
        >
          <Trash2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Clear Completed Tasks</span>
        </button>
      </div>

      {/* Overview Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono-code text-xs">
        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="text-slate-400">ACTIVE WORKERS</div>
          <div className="text-2xl font-bold text-white mt-1">4 Node Pools</div>
          <div className="text-[10px] text-cyan-400 mt-0.5">AWS · GCP · Azure · BareMetal</div>
        </div>

        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="text-slate-400">RUNNING TASKS</div>
          <div className="text-2xl font-bold text-cyan-300 mt-1">{runningCount}</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">Non-blocking background loop</div>
        </div>

        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="text-slate-400">COMPLETED SUCCESS</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</div>
          <div className="text-[10px] text-emerald-500 mt-0.5">Average latency: 412ms</div>
        </div>

        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="text-slate-400">DEAD-LETTER QUEUE (DLQ)</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{dlqCount}</div>
          <div className="text-[10px] text-amber-500/80 mt-0.5">Automatic retry with jitter</div>
        </div>
      </div>

      {/* Grid: Dispatcher & Task List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Dispatcher Form */}
        <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">Enqueue Asynchronous Task</h2>
          </div>

          <div className="space-y-3 font-mono-code text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Task Title / Specification:</label>
              <input
                type="text"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Task Category:</label>
              <select
                value={taskType}
                onChange={e => setTaskType(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="PQC_REKEYING">Batch ML-KEM-1024 Re-Keying</option>
                <option value="BULK_TELEMETRY_INGEST">Bulk Telemetry Lattice Ingest</option>
                <option value="COMPLIANCE_PROOF_GEN">Compliance Cryptographic Proof</option>
                <option value="AGENT_WEIGHT_ALIGNMENT">AI Agent Sanity Weight Alignment</option>
                <option value="DATASET_LATTICE_ENCRYPT">Dataset Lattice Encrypt</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Priority:</label>
                <select
                  value={taskPriority}
                  onChange={e => setTaskPriority(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="HIGH">High Priority</option>
                  <option value="NORMAL">Normal Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Target Cloud Worker:</label>
                <select
                  value={selectedWorker}
                  onChange={e => setSelectedWorker(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="AWS-Lambda-PQC-1">AWS Lambda (Serverless)</option>
                  <option value="GCP-CloudRun-PQC-2">GCP Cloud Run</option>
                  <option value="Azure-Edge-Container-3">Azure Edge Container</option>
                  <option value="BareMetal-SIMD-Edge">BareMetal SIMD Edge</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleEnqueue}
              className="w-full flex items-center justify-center gap-2 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors mt-2"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Dispatch to Multi-Cloud Mesh</span>
            </button>
          </div>

          {/* Cloud Distribution Stats */}
          <div className="p-3 rounded bg-slate-950/60 border border-slate-800 space-y-2 text-xs font-mono-code">
            <div className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span>Horizontal Scaling Topology</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>AWS us-east-1 Workers:</span>
                <span className="text-cyan-400">12 Instances (Active)</span>
              </div>
              <div className="flex justify-between">
                <span>GCP europe-west1:</span>
                <span className="text-cyan-400">8 Instances (Active)</span>
              </div>
              <div className="flex justify-between">
                <span>Azure eastus:</span>
                <span className="text-cyan-400">6 Instances (Active)</span>
              </div>
              <div className="flex justify-between">
                <span>Bare-Metal Edge POPs:</span>
                <span className="text-emerald-400">32 SIMD Nodes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Task Queue Monitor */}
        <div className="lg:col-span-2 p-5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Live Distributed Task Queue</h2>
            </div>
            <span className="text-xs font-mono-code text-slate-400">
              Total Enqueued: <span className="text-white font-bold">{tasks.length}</span>
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {tasks.map(task => (
              <div
                key={task.id}
                className="p-3.5 rounded bg-slate-950/70 border border-slate-800 text-xs font-mono-code space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{task.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      task.priority === 'HIGH' ? 'bg-amber-950 text-amber-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {task.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] self-start sm:self-auto">
                    <span className="text-slate-500">{task.cloudWorker}</span>
                    <span className={`font-bold ${
                      task.status === 'COMPLETED' ? 'text-emerald-400' :
                      task.status === 'RUNNING' ? 'text-cyan-400 animate-pulse' :
                      task.status === 'DLQ' ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      [{task.status}]
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      task.status === 'COMPLETED' ? 'bg-emerald-500' :
                      task.status === 'DLQ' ? 'bg-amber-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Execution: {task.executionMs}ms · Retries: {task.retries}</span>
                  {task.status === 'DLQ' ? (
                    <button
                      onClick={() => handleRetryDlq(task.id)}
                      className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Retry from DLQ</span>
                    </button>
                  ) : task.status === 'COMPLETED' ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Finished</span>
                    </span>
                  ) : (
                    <span className="text-cyan-400">{task.progress}% Progress</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
