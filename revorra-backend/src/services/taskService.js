import prisma from '../config/prisma.js';

/**
 * Get all active tasks for a user
 * Excludes tasks the user has already completed
 * @param {string} userId - User's ID
 * @returns {Array} List of available tasks
 */
export const getActiveTasks = async (userId) => {
  const now = new Date();

  // Get tasks that are active, not expired, and not completed by user
  const tasks = await prisma.task.findMany({
    where: {
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    },
    select: {
      id: true,
      title: true,
      description: true,
      reward: true,
      taskType: true,
      link: true,
      shareLink: true,
      shareMessage: true,
      dailyLimit: true,
      expiresAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Get completed task IDs for this user
  const completedTasks = await prisma.taskCompletion.findMany({
    where: { userId },
    select: { taskId: true },
  });

  const completedTaskIds = new Set(completedTasks.map((c) => c.taskId));

  // Filter out completed tasks
  return tasks.filter((task) => !completedTaskIds.has(task.id));
};

/**
 * Get a single task by ID
 * @param {string} taskId - Task's ID
 * @returns {Object|null} Task object or null
 */
export const getTaskById = async (taskId) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      title: true,
      description: true,
      link: true,
      reward: true,
      taskType: true,
      shareLink: true,
      shareMessage: true,
      dailyLimit: true,
      expiresAt: true,
      isActive: true,
    },
  });

  return task;
};

/**
 * Complete a task
 * @param {string} userId - User's ID
 * @param {string} taskId - Task's ID
 * @param {string} proof - Proof of completion
 * @returns {Object} Created completion record
 */
export const completeTask = async (userId, taskId, proof) => {
  // Check if task exists and is valid
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  if (!task.isActive) {
    throw new Error('Task is not active');
  }

  // Check if task has expired
  if (task.expiresAt && new Date(task.expiresAt) < new Date()) {
    throw new Error('Task has expired');
  }

  // Check if user has already completed this task (unique constraint will also prevent this)
  const existingCompletion = await prisma.taskCompletion.findUnique({
    where: {
      userId_taskId: {
        userId,
        taskId,
      },
    },
  });

  if (existingCompletion) {
    throw new Error('Task already completed');
  }

  // Check daily limit for sponsored posts
  if (task.taskType === 'SPONSORED_POST' && task.dailyLimit) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCompletions = await prisma.taskCompletion.count({
      where: {
        userId,
        taskId,
        completedAt: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          in: ['PENDING', 'APPROVED'],
        },
      },
    });

    if (todayCompletions >= task.dailyLimit) {
      throw new Error(`Daily limit reached. You can only complete this task ${task.dailyLimit} time(s) per day.`);
    }
  }

  // Create completion record
  const completion = await prisma.taskCompletion.create({
    data: {
      userId,
      taskId,
      proof,
      status: 'PENDING',
    },
  });

  return completion;
};

/**
 * Get user's task history
 * @param {string} userId - User's ID
 * @returns {Array} List of completed tasks with status
 */
export const getTaskHistory = async (userId) => {
  const completions = await prisma.taskCompletion.findMany({
    where: { userId },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          reward: true,
          taskType: true,
          shareLink: true,
          shareMessage: true,
        },
      },
    },
    orderBy: {
      completedAt: 'desc',
    },
  });

  return completions.map((completion) => ({
    id: completion.id,
    taskId: completion.task.id,
    title: completion.task.title,
    taskType: completion.task.taskType,
    reward: completion.task.reward,
    proof: completion.proof,
    status: completion.status,
    completedAt: completion.completedAt,
    verifiedAt: completion.verifiedAt,
  }));
};

export default {
  getActiveTasks,
  getTaskById,
  completeTask,
  getTaskHistory,
};
