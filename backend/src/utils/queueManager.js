// Queue management for bulk operations

const queues = {}; // { userId: { tasks: [], status: 'running'|'paused'|'cancelled', currentIndex: 0 } }
const queueProcessors = {}; // { userId: async function }

/**
 * Add tasks to user's queue
 */
export const addToQueue = (userId, tasks, processor) => {
  if (!queues[userId]) {
    queues[userId] = {
      tasks: [],
      status: 'idle',
      currentIndex: 0,
      results: []
    };
  }
  
  queues[userId].tasks = [...queues[userId].tasks, ...tasks];
  queues[userId].status = 'idle';
  queues[userId].currentIndex = 0;
  queues[userId].results = [];
  
  if (processor) {
    queueProcessors[userId] = processor;
  }
};

/**
 * Get queue status
 */
export const getQueueStatus = (userId) => {
  return queues[userId] || null;
};

/**
 * Pause queue
 */
export const pauseQueue = (userId) => {
  if (queues[userId]) {
    queues[userId].status = 'paused';
    return true;
  }
  return false;
};

/**
 * Resume queue
 */
export const resumeQueue = (userId) => {
  if (queues[userId] && queues[userId].status === 'paused') {
    queues[userId].status = 'running';
    return true;
  }
  return false;
};

/**
 * Cancel queue
 */
export const cancelQueue = (userId) => {
  if (queues[userId]) {
    queues[userId].status = 'cancelled';
    queues[userId].tasks = [];
    queues[userId].currentIndex = 0;
    return true;
  }
  return false;
};

/**
 * Process queue for a user
 */
export const processQueue = async (userId, io, onProgress) => {
  const queue = queues[userId];
  if (!queue || queue.tasks.length === 0) {
    return { results: [] };
  }

  queue.status = 'running';
  const results = [];

  for (let i = queue.currentIndex; i < queue.tasks.length; i++) {
    // Check if cancelled
    if (queue.status === 'cancelled') {
      break;
    }

    // Wait if paused
    while (queue.status === 'paused') {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (queue.status === 'cancelled') {
        break;
      }
    }

    if (queue.status === 'cancelled') {
      break;
    }

    const task = queue.tasks[i];
    queue.currentIndex = i;

    try {
      const result = await queueProcessors[userId](task);
      results.push({ ...task, status: 'success', result });
      
      const progress = Math.round(((i + 1) / queue.tasks.length) * 100);
      if (onProgress) {
        onProgress({
          type: 'progress',
          task,
          progress,
          completed: i + 1,
          total: queue.tasks.length,
          status: 'success'
        });
      }

      if (io) {
        io.to(`user-${userId}`).emit('bulk-progress', {
          type: 'progress',
          task,
          progress,
          completed: i + 1,
          total: queue.tasks.length,
          status: 'success'
        });
      }
    } catch (err) {
      results.push({ ...task, status: 'failed', error: err.message });
      
      const progress = Math.round(((i + 1) / queue.tasks.length) * 100);
      if (onProgress) {
        onProgress({
          type: 'progress',
          task,
          progress,
          completed: i + 1,
          total: queue.tasks.length,
          status: 'failed',
          error: err.message
        });
      }

      if (io) {
        io.to(`user-${userId}`).emit('bulk-progress', {
          type: 'progress',
          task,
          progress,
          completed: i + 1,
          total: queue.tasks.length,
          status: 'failed',
          error: err.message
        });
      }
    }
  }

  queue.status = queue.status === 'cancelled' ? 'cancelled' : 'completed';
  queue.results = results;

  return { results };
};

/**
 * Clear queue
 */
export const clearQueue = (userId) => {
  if (queues[userId]) {
    delete queues[userId];
    delete queueProcessors[userId];
    return true;
  }
  return false;
};

