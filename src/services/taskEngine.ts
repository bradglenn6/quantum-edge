import { AsyncTask } from '../types';

export class TaskEngine {
  private static instance: TaskEngine;
  private tasks: AsyncTask[] = [];
  private listeners: ((tasks: AsyncTask[]) => void)[] = [];
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {
    this.seedTasks();
    this.startWorkerSimulation();
  }

  public static getInstance(): TaskEngine {
    if (!TaskEngine.instance) {
      TaskEngine.instance = new TaskEngine();
    }
    return TaskEngine.instance;
  }

  private seedTasks() {
    const now = Date.now();
    this.tasks = [
      {
        id: 'task_pqc_901',
        title: 'Batch ML-KEM-1024 Ephemeral Re-Keying (5,000 Edge Nodes)',
        type: 'PQC_REKEYING',
        priority: 'HIGH',
        status: 'RUNNING',
        cloudWorker: 'BareMetal-SIMD-Edge',
        progress: 68,
        executionMs: 142,
        retries: 0,
        createdAt: now - 35000
      },
      {
        id: 'task_stream_902',
        title: 'Massive Edge Telemetry Lattice Ingest & Quantization',
        type: 'BULK_TELEMETRY_INGEST',
        priority: 'HIGH',
        status: 'RUNNING',
        cloudWorker: 'AWS-Lambda-PQC-1',
        progress: 42,
        executionMs: 890,
        retries: 0,
        createdAt: now - 20000
      },
      {
        id: 'task_proof_903',
        title: 'FIPS-203 Post-Quantum Cryptographic Attestation Generation',
        type: 'COMPLIANCE_PROOF_GEN',
        priority: 'NORMAL',
        status: 'COMPLETED',
        cloudWorker: 'GCP-CloudRun-PQC-2',
        progress: 100,
        executionMs: 412,
        retries: 0,
        createdAt: now - 120000
      },
      {
        id: 'task_align_904',
        title: 'Autonomous AI Sentinel Neural Weight Sanity Verification',
        type: 'AGENT_WEIGHT_ALIGNMENT',
        priority: 'NORMAL',
        status: 'COMPLETED',
        cloudWorker: 'Azure-Edge-Container-3',
        progress: 100,
        executionMs: 620,
        retries: 0,
        createdAt: now - 240000
      },
      {
        id: 'task_dlq_905',
        title: 'Legacy RSA-4096 Ingress Quarantine & Deprecation Route',
        type: 'DATASET_LATTICE_ENCRYPT',
        priority: 'LOW',
        status: 'DLQ',
        cloudWorker: 'AWS-Lambda-PQC-1',
        progress: 15,
        executionMs: 2800,
        retries: 3,
        createdAt: now - 500000
      }
    ];
  }

  private startWorkerSimulation() {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      let updated = false;

      this.tasks = this.tasks.map(task => {
        if (task.status === 'RUNNING') {
          updated = true;
          const nextProg = Math.min(100, task.progress + Math.floor(Math.random() * 14) + 6);
          if (nextProg >= 100) {
            return {
              ...task,
              progress: 100,
              status: 'COMPLETED' as const,
              executionMs: task.executionMs + Math.floor(Math.random() * 80)
            };
          }
          return {
            ...task,
            progress: nextProg,
            executionMs: task.executionMs + 40
          };
        } else if (task.status === 'PENDING') {
          updated = true;
          return {
            ...task,
            status: 'RUNNING' as const,
            progress: 5
          };
        }
        return task;
      });

      if (updated) {
        this.notify();
      }
    }, 1800);
  }

  public subscribe(cb: (tasks: AsyncTask[]) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb([...this.tasks]));
  }

  public getTasks(): AsyncTask[] {
    return this.tasks;
  }

  /**
   * Enqueue a new asynchronous task across multi-cloud workers
   */
  public enqueueTask(
    title: string,
    type: AsyncTask['type'],
    priority: AsyncTask['priority'] = 'NORMAL',
    cloudWorker?: AsyncTask['cloudWorker']
  ): AsyncTask {
    const workers: AsyncTask['cloudWorker'][] = [
      'AWS-Lambda-PQC-1',
      'GCP-CloudRun-PQC-2',
      'Azure-Edge-Container-3',
      'BareMetal-SIMD-Edge'
    ];

    const assignedWorker = cloudWorker || workers[Math.floor(Math.random() * workers.length)];

    const newTask: AsyncTask = {
      id: `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title,
      type,
      priority,
      status: 'PENDING',
      cloudWorker: assignedWorker,
      progress: 0,
      executionMs: 0,
      retries: 0,
      createdAt: Date.now()
    };

    this.tasks.unshift(newTask);
    this.notify();
    return newTask;
  }

  /**
   * Retry a task in Dead-Letter Queue (DLQ)
   */
  public retryDlqTask(taskId: string) {
    this.tasks = this.tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'RUNNING' as const,
          progress: 10,
          retries: t.retries + 1
        };
      }
      return t;
    });
    this.notify();
  }

  /**
   * Clear completed tasks
   */
  public clearCompleted() {
    this.tasks = this.tasks.filter(t => t.status !== 'COMPLETED');
    this.notify();
  }
}
