/**
 * Canvas Rendering Manager
 * Manages canvas rendering operations to prevent concurrent rendering conflicts
 * Fixes "Cannot use the same canvas during multiple render() operations" errors
 */

export interface RenderTask {
  id: string;
  renderFn: () => Promise<void>;
  priority?: number;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export class CanvasRenderingManager {
  private static instance: CanvasRenderingManager;
  private isRendering = false;
  private renderQueue: RenderTask[] = [];
  private currentTask: RenderTask | null = null;
  private canvasMap = new Map<string, HTMLCanvasElement>();
  private renderingLocks = new Map<string, boolean>();
  
  private constructor() {
    console.log('🎨 Canvas Rendering Manager initialized');
  }
  
  static getInstance(): CanvasRenderingManager {
    if (!CanvasRenderingManager.instance) {
      CanvasRenderingManager.instance = new CanvasRenderingManager();
    }
    return CanvasRenderingManager.instance;
  }
  
  /**
   * Register a canvas for managed rendering
   */
  registerCanvas(id: string, canvas: HTMLCanvasElement): void {
    this.canvasMap.set(id, canvas);
    this.renderingLocks.set(id, false);
    console.log(`📋 Canvas registered: ${id}`);
  }
  
  /**
   * Unregister a canvas
   */
  unregisterCanvas(id: string): void {
    this.canvasMap.delete(id);
    this.renderingLocks.delete(id);
    console.log(`📋 Canvas unregistered: ${id}`);
  }
  
  /**
   * Check if a specific canvas is currently rendering
   */
  isCanvasRendering(canvasId: string): boolean {
    return this.renderingLocks.get(canvasId) || false;
  }
  
  /**
   * Queue a render task with priority support
   */
  async queueRender(task: RenderTask): Promise<void> {
    return new Promise((resolve, reject) => {
      const wrappedTask: RenderTask = {
        ...task,
        renderFn: async () => {
          try {
            await task.renderFn();
            if (task.onComplete) task.onComplete();
            resolve();
          } catch (error) {
            const err = error as Error;
            console.error(`❌ Render task ${task.id} failed:`, err);
            if (task.onError) task.onError(err);
            reject(err);
          }
        }
      };
      
      // Add to queue with priority sorting
      if (task.priority !== undefined) {
        // Find insertion point based on priority
        const insertIndex = this.renderQueue.findIndex(
          t => (t.priority || 0) < (task.priority || 0)
        );
        if (insertIndex === -1) {
          this.renderQueue.push(wrappedTask);
        } else {
          this.renderQueue.splice(insertIndex, 0, wrappedTask);
        }
      } else {
        this.renderQueue.push(wrappedTask);
      }
      
      console.log(`📥 Queued render task: ${task.id} (Queue size: ${this.renderQueue.length})`);
      
      // Process queue if not already processing
      if (!this.isRendering) {
        this.processQueue();
      }
    });
  }
  
  /**
   * Execute a render task immediately if possible, otherwise queue it
   */
  async render(
    id: string, 
    renderFn: () => Promise<void>, 
    options?: { 
      priority?: number; 
      canvasId?: string;
      forceImmediate?: boolean;
    }
  ): Promise<void> {
    // Check if specific canvas is busy
    if (options?.canvasId && this.isCanvasRendering(options.canvasId)) {
      console.log(`⏳ Canvas ${options.canvasId} is busy, queueing render task ${id}`);
      return this.queueRender({ 
        id, 
        renderFn, 
        priority: options.priority 
      });
    }
    
    if (this.isRendering && !options?.forceImmediate) {
      return this.queueRender({ 
        id, 
        renderFn, 
        priority: options.priority 
      });
    }
    
    // Lock canvas if specified
    if (options?.canvasId) {
      this.renderingLocks.set(options.canvasId, true);
    }
    
    this.isRendering = true;
    this.currentTask = { id, renderFn };
    
    try {
      console.log(`🎨 Starting render task: ${id}`);
      const startTime = performance.now();
      
      await renderFn();
      
      const duration = performance.now() - startTime;
      console.log(`✅ Render task ${id} completed in ${duration.toFixed(2)}ms`);
      
    } catch (error) {
      console.error(`❌ Render task ${id} failed:`, error);
      throw error;
      
    } finally {
      this.isRendering = false;
      this.currentTask = null;
      
      // Unlock canvas if specified
      if (options?.canvasId) {
        this.renderingLocks.set(options.canvasId, false);
      }
      
      // Process next task in queue
      this.processQueue();
    }
  }
  
  /**
   * Process the render queue
   */
  private async processQueue(): Promise<void> {
    if (this.isRendering || this.renderQueue.length === 0) {
      return;
    }
    
    const task = this.renderQueue.shift();
    if (!task) return;
    
    this.isRendering = true;
    this.currentTask = task;
    
    try {
      console.log(`🎨 Processing queued task: ${task.id} (${this.renderQueue.length} remaining)`);
      await task.renderFn();
    } catch (error) {
      console.error(`❌ Queued task ${task.id} failed:`, error);
    } finally {
      this.isRendering = false;
      this.currentTask = null;
      
      // Continue processing queue
      if (this.renderQueue.length > 0) {
        setTimeout(() => this.processQueue(), 0);
      }
    }
  }
  
  /**
   * Clear all pending render tasks
   */
  clearQueue(): void {
    const count = this.renderQueue.length;
    this.renderQueue = [];
    console.log(`🧹 Cleared ${count} pending render tasks`);
  }
  
  /**
   * Get current queue status
   */
  getStatus(): {
    isRendering: boolean;
    queueLength: number;
    currentTask: string | null;
    registeredCanvases: number;
  } {
    return {
      isRendering: this.isRendering,
      queueLength: this.renderQueue.length,
      currentTask: this.currentTask?.id || null,
      registeredCanvases: this.canvasMap.size
    };
  }
  
  /**
   * Wait for all pending renders to complete
   */
  async waitForCompletion(): Promise<void> {
    return new Promise((resolve) => {
      const checkCompletion = () => {
        if (!this.isRendering && this.renderQueue.length === 0) {
          resolve();
        } else {
          setTimeout(checkCompletion, 100);
        }
      };
      checkCompletion();
    });
  }
  
  /**
   * Batch multiple render operations
   */
  async batchRender(tasks: RenderTask[]): Promise<void[]> {
    console.log(`📦 Batching ${tasks.length} render tasks`);
    
    // Sort by priority if provided
    const sortedTasks = tasks.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    // Queue all tasks
    const promises = sortedTasks.map(task => this.queueRender(task));
    
    // Wait for all to complete
    return Promise.all(promises);
  }
  
  /**
   * Create a dedicated canvas for isolated rendering
   */
  createIsolatedCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    // Register with unique ID
    const id = `isolated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.registerCanvas(id, canvas);
    
    // Add cleanup method
    (canvas as any).cleanup = () => {
      this.unregisterCanvas(id);
    };
    
    return canvas;
  }
  
  /**
   * Safely render to a canvas with automatic locking
   */
  async safeCanvasRender(
    canvas: HTMLCanvasElement,
    renderFn: (ctx: CanvasRenderingContext2D) => Promise<void> | void
  ): Promise<void> {
    const canvasId = this.getCanvasId(canvas);
    
    if (this.isCanvasRendering(canvasId)) {
      // Queue the render if canvas is busy
      return this.queueRender({
        id: `canvas-render-${canvasId}-${Date.now()}`,
        renderFn: async () => {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await renderFn(ctx);
          }
        }
      });
    }
    
    // Lock the canvas
    this.renderingLocks.set(canvasId, true);
    
    try {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        await renderFn(ctx);
      }
    } finally {
      // Unlock the canvas
      this.renderingLocks.set(canvasId, false);
    }
  }
  
  /**
   * Get or generate canvas ID
   */
  private getCanvasId(canvas: HTMLCanvasElement): string {
    // Check if canvas is already registered
    for (const [id, registeredCanvas] of this.canvasMap.entries()) {
      if (registeredCanvas === canvas) {
        return id;
      }
    }
    
    // Generate and register new ID
    const id = `canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.registerCanvas(id, canvas);
    return id;
  }
}

// Export singleton instance getter
export const getCanvasRenderingManager = (): CanvasRenderingManager => {
  return CanvasRenderingManager.getInstance();
};