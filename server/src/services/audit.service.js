/**
 * audit.service.js
 * Creates immutable AuditLog entries. Never call AuditLog.save() directly — use this.
 */
const AuditLog = require('../models/AuditLog');

/**
 * @param {Object} params
 * @param {string} params.actor         - User ObjectId
 * @param {string} params.actor_role    - Role string
 * @param {string} params.action        - Action name e.g. 'login', 'llm_query'
 * @param {string} params.resource_type - e.g. 'auth', 'llm', 'session'
 * @param {string} [params.resource_id]
 * @param {string} [params.department]
 * @param {string} [params.ip_address]
 * @param {string} [params.user_agent]
 * @param {Object} [params.metadata]
 * @param {string} [params.severity]    - 'info' | 'warning' | 'critical'
 */
const logAction = async (params) => {
  try {
    await AuditLog.create(params);
  } catch (err) {
    // Audit log failures must never crash the app — log and continue
    console.error('[AuditService] Failed to write audit log:', err.message);
  }
};

module.exports = { logAction };
