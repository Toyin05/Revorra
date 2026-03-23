import prisma from '../config/prisma.js';

/**
 * Activity Service - Logs user activities for fraud detection
 */
const activityService = {
  /**
   * Log user activity
   * @param {string} userId - User ID
   * @param {string} action - Activity type (LOGIN, TASK_COMPLETION, WITHDRAWAL_REQUEST, SIGNUP)
   * @param {string} ipAddress - User's IP address
   * @param {string} deviceFingerprint - Device fingerprint
   * @param {object} metadata - Additional metadata
   */
  async logActivity(userId, action, ipAddress = null, deviceFingerprint = null, metadata = null) {
    try {
      const activity = await prisma.userActivity.create({
        data: {
          userId,
          action,
          ipAddress,
          deviceFingerprint,
          metadata
        }
      });
      return activity;
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  },

  /**
   * Get user activities
   * @param {string} userId - User ID
   * @param {number} limit - Number of records to return
   */
  async getUserActivities(userId, limit = 50) {
    try {
      return await prisma.userActivity.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    } catch (error) {
      console.error('Error getting user activities:', error);
      throw error;
    }
  },

  /**
   * Get activities by type
   * @param {string} action - Activity type
   * @param {Date} since - Filter by date
   */
  async getActivitiesByType(action, since = null) {
    try {
      const where = { action };
      if (since) {
        where.createdAt = { gte: since };
      }
      return await prisma.userActivity.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error getting activities by type:', error);
      throw error;
    }
  },

  /**
   * Count activities in time window
   * @param {string} userId - User ID
   * @param {string} action - Activity type
   * @param {number} hoursAgo - Hours to look back
   */
  async countRecentActivities(userId, action, hoursAgo = 1) {
    try {
      const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      return await prisma.userActivity.count({
        where: {
          userId,
          action,
          createdAt: { gte: since }
        }
      });
    } catch (error) {
      console.error('Error counting recent activities:', error);
      throw error;
    }
  },

  /**
   * Get activities from IP address
   * @param {string} ipAddress - IP address
   * @param {number} limit - Number of records
   */
  async getActivitiesByIP(ipAddress, limit = 50) {
    try {
      return await prisma.userActivity.findMany({
        where: { ipAddress },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    } catch (error) {
      console.error('Error getting activities by IP:', error);
      throw error;
    }
  },

  /**
   * Get unique users from IP
   * @param {string} ipAddress - IP address
   */
  async getUniqueUsersFromIP(ipAddress) {
    try {
      const activities = await prisma.userActivity.groupBy({
        by: ['userId'],
        where: { ipAddress }
      });
      return activities.length;
    } catch (error) {
      console.error('Error getting unique users from IP:', error);
      throw error;
    }
  }
};

export default activityService;
