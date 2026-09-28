const featureService = require('../server/feature-service.js');

module.exports = async function handler(req, res) {
  // CORS & Cache-Control: no-cache, no-store
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Pragma, Cache-Control');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  try {
    // 0. GET /api/maintenance
    if (req.method === 'GET' && (pathname.endsWith('/maintenance') || pathname.endsWith('/maintenance/'))) {
      const mnt = featureService.getMaintenanceResponse();
      return res.status(200).json(mnt);
    }

    // 0b. PUT / PATCH / POST /api/maintenance/global
    if (['PUT', 'PATCH', 'POST'].includes(req.method) && pathname.includes('/maintenance/global')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const enabled = body.enabled !== undefined ? body.enabled : (body.maintenance !== undefined ? body.maintenance : body.global);
      const updatedBy = body.updated_by || 'admin';
      featureService.setGlobalMaintenance(enabled, updatedBy);
      return res.status(200).json({ success: true, ...featureService.getMaintenanceResponse() });
    }

    // 0c. PUT / PATCH / POST /api/maintenance/features/:featureId or /api/maintenance/:featureId
    const mntMatch = pathname.match(/\/api\/maintenance\/(?:features\/)?([^\/]+)\/?$/i);
    if (mntMatch && ['PUT', 'PATCH', 'POST'].includes(req.method) && mntMatch[1] !== 'global') {
      const featureId = decodeURIComponent(mntMatch[1]);
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const enabled = body.enabled !== undefined ? body.enabled : (body.maintenance !== undefined ? body.maintenance : true);
      const message = body.message !== undefined ? body.message : body.maintenance_message;
      const updatedBy = body.updated_by || 'admin';

      featureService.setFeatureMaintenance(featureId, enabled, message, updatedBy);
      return res.status(200).json({
        success: true,
        featureId,
        enabled: Boolean(enabled),
        ...featureService.getMaintenanceResponse()
      });
    }

    // 1. GET /api/features/status
    if (req.method === 'GET' && (pathname.endsWith('/status') || pathname.endsWith('/features') || pathname.endsWith('/features/'))) {
      const status = featureService.getStatusResponse();
      return res.status(200).json(status);
    }

    // 2. POST /api/features/global/maintenance
    if (req.method === 'POST' && pathname.includes('/global/maintenance')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const enabled = body.maintenance !== undefined ? body.maintenance : (body.enabled !== undefined ? body.enabled : body.global);
      const updatedBy = body.updated_by || 'admin';
      const status = featureService.setGlobalMaintenance(enabled, updatedBy);
      return res.status(200).json({ success: true, ...status });
    }

    // 3. POST /api/features/reset-all
    if (req.method === 'POST' && pathname.includes('/reset-all')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const updatedBy = body.updated_by || 'admin';
      const status = featureService.resetAllMaintenance(updatedBy);
      return res.status(200).json({ success: true, ...status });
    }

    // 4. PUT / PATCH / POST /api/features/:featureId/maintenance
    const match = pathname.match(/\/api\/features\/([^\/]+)\/maintenance\/?$/i);
    if (match && ['PUT', 'PATCH', 'POST'].includes(req.method)) {
      const featureId = decodeURIComponent(match[1]);
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const maintenance = body.maintenance !== undefined ? body.maintenance : (body.enabled !== undefined ? body.enabled : true);
      const message = body.message !== undefined ? body.message : body.maintenance_message;
      const updatedBy = body.updated_by || 'admin';

      const status = featureService.setFeatureMaintenance(featureId, maintenance, message, updatedBy);
      return res.status(200).json({
        success: true,
        featureId,
        maintenance,
        ...status
      });
    }

    // Default: Return current status
    const status = featureService.getStatusResponse();
    return res.status(200).json(status);
  } catch (err) {
    console.error('[API features Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
