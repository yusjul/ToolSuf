/**
 * ToolSuf — Centralized Feature Usage Tracking Utility (Section 4)
 * ===============================================================
 * Mengirim event penggunaan fitur ke backend (POST /api/usage).
 * Backend menyimpan ke database dan langsung mengirim notifikasi email real-time ke admin.
 * Menjamin kegagalan email atau jaringan TIDAK PERNAH menggagalkan fitur utama user.
 */

(function(global) {
  'use strict';

  // In-memory debounce set to prevent rapid double-clicks
  const _recentSends = new Map();
  const DEBOUNCE_MS = 2500;

  async function trackFeatureUsage(featureId, action, metadata = {}) {
    if (!featureId || !action) {
      console.warn('[trackFeatureUsage] featureId and action are required.');
      return { success: false, error: 'featureId and action required' };
    }

    const cleanId = String(featureId).toLowerCase().trim();
    const cleanAction = String(action).toLowerCase().trim();
    const now = Date.now();
    const debounceKey = `${cleanId}:${cleanAction}`;

    // 1. Anti double-click debounce
    if (_recentSends.has(debounceKey)) {
      const lastTime = _recentSends.get(debounceKey);
      if (now - lastTime < DEBOUNCE_MS) {
        return { success: true, throttled: true, usageRecorded: true };
      }
    }
    _recentSends.set(debounceKey, now);

    // 2. Generate unique idempotency eventId
    const eventId = 'evt-' + now + '-' + Math.random().toString(36).substring(2, 9);
    const timestamp = new Date().toISOString();

    const payload = {
      featureId: cleanId,
      action: cleanAction,
      metadata: metadata || {},
      timestamp,
      eventId
    };

    // 3. Resolve API URL
    let apiBase = '';
    try {
      if (typeof window !== 'undefined') {
        const origin = window.location.origin;
        if (origin && !origin.startsWith('file:') && !origin.startsWith('null')) {
          apiBase = origin;
        }
      }
    } catch (e) {}
    if (!apiBase) apiBase = 'http://localhost:3001';

    // 4. Send to Backend without blocking or breaking user workflow
    try {
      const response = await fetch(`${apiBase}/api/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const resData = await response.json();
        return resData;
      } else {
        const errText = await response.text();
        console.warn('[trackFeatureUsage] Server returned status:', response.status, errText);
        return { success: true, usageRecorded: false, error: `HTTP ${response.status}` };
      }
    } catch (netErr) {
      // Kegagalan jaringan / offline tidak boleh merusak fitur pengguna
      console.warn('[trackFeatureUsage] Request failed silently (feature continues):', netErr.message);
      return { success: true, usageRecorded: false, error: netErr.message };
    }
  }

  // Expose ke global window dan parent
  global.trackFeatureUsage = trackFeatureUsage;
  if (typeof window !== 'undefined') {
    window.trackFeatureUsage = trackFeatureUsage;
    try {
      if (window.parent && window.parent !== window) {
        window.parent.trackFeatureUsage = trackFeatureUsage;
      }
    } catch (e) {}
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { trackFeatureUsage };
  }
})(typeof window !== 'undefined' ? window : globalThis);
