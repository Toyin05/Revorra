import { getActiveTasks, getTaskById, completeTask, getTaskHistory } from '../services/taskService.js';
import fraudService from '../services/fraudService.js';
import activityService from '../services/activityService.js';

/**
 * Get all active tasks for the user
 * Excludes already completed tasks
 */
export const getTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await getActiveTasks(userId);

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get tasks.',
    });
  }
};

/**
 * Get a single task by ID
 */
export const getTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await getTaskById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Get task error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get task.',
    });
  }
};

/**
 * Complete a task
 * User must submit proof of completion
 */
export const complete = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { proof } = req.body;
    const userId = req.user.id;

    // Get metadata from request
    const ipAddress = req.metadata?.ip || req.ipAddress;
    const deviceFingerprint = req.metadata?.deviceFingerprint || req.deviceFingerprint;

    // Check fraud: task completion cooldown
    const cooldownCheck = await fraudService.checkTaskCompletionCooldown(userId);
    if (!cooldownCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: `Too many task completions. You can complete ${cooldownCheck.limit} tasks per hour. You've completed ${cooldownCheck.recentCount} already.`,
      });
    }

    // Check if user is suspended
    const isSuspended = await fraudService.isUserSuspended(userId);
    if (isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended.',
      });
    }

    // Validate proof
    if (!proof || proof.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Proof is required.',
      });
    }

    // Complete the task
    const completion = await completeTask(userId, taskId, proof);

    // Log activity
    await activityService.logActivity(
      userId,
      'TASK_COMPLETION',
      ipAddress,
      deviceFingerprint,
      { taskId, completionId: completion.id }
    );

    return res.status(201).json({
      success: true,
      data: {
        id: completion.id,
        taskId: completion.taskId,
        status: completion.status,
        completedAt: completion.completedAt,
      },
    });
  } catch (error) {
    console.error('Complete task error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to complete task.',
    });
  }
};

/**
 * Get user's task history
 */
export const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await getTaskHistory(userId);

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Get task history error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get task history.',
    });
  }
};

export default {
  getTasks,
  getTask,
  complete,
  getHistory,
};
