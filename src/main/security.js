const crypto = require('crypto');

class SessionManager {
  constructor() {
    this.token = null;
    this.createdAt = null;
  }

  /**
   * Generate a new session token
   * @returns {string} The generated token
   */
  generateToken() {
    this.token = crypto.randomBytes(16).toString('hex');
    this.createdAt = new Date().toISOString();
    return this.token;
  }

  /**
   * Validate a token
   * @param {string} providedToken - Token to validate
   * @returns {boolean} Whether the token is valid
   */
  validateToken(providedToken) {
    return this.token && providedToken === this.token;
  }

  /**
   * Get the current token
   * @returns {string|null} Current token
   */
  getToken() {
    return this.token;
  }

  /**
   * Generate the upload URL with token
   * @param {string} ip - Server IP
   * @param {number} port - Server port
   * @returns {string} Full URL with token
   */
  getUploadURL(ip, port) {
    return `http://${ip}:${port}/?token=${this.token}`;
  }

  /**
   * Get session info
   * @returns {Object} Session information
   */
  getInfo() {
    return {
      token: this.token,
      createdAt: this.createdAt,
      hasToken: !!this.token
    };
  }

  /**
   * Clear the current session
   */
  clear() {
    this.token = null;
    this.createdAt = null;
  }
}

module.exports = SessionManager;
