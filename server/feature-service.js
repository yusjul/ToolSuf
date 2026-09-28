/**
 * ToolSuf — Feature Settings & Maintenance Service (Server-side)
 * =============================================================
 * Sumber kebenaran (Single Source of Truth) untuk status maintenance fitur.
 * Data disimpan secara persisten di server/data/feature-settings.json.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'feature-settings.json');

// Daftar fitur default beserta metadata awal
const DEFAULT_FEATURES = {
  'password': {
    id: 'password',
    feature_id: 'password',
    name: 'Password Generator',
    maintenance_enabled: false,
    maintenance_message: null,
    updated_at: new Date().toISOString(),
    updated_by: 'system'
  },
  'renamer': {
    id: 'renamer',
    feature_id: 'renamer',
    name: 'Batch Renamer Pro',
    maintenance_enabled: false,
    maintenance_message: null,
    updated_at: new Date().toISOString(),
    updated_by: 'system'
  },
  'compressor': {
    id: 'compressor',
    feature_id: 'compressor',
    name: 'Media Compressor',
    maintenance_enabled: false,
    maintenance_message: null,
    updated_at: new Date().toISOString(),
    updated_by: 'system'
  },
  'bg-remover': {
    id: 'bg-remover',
    feature_id: 'bg-remover',
    name: 'Background Remover',
    maintenance_enabled: false,
    maintenance_message: null,
    updated_at: new Date().toISOString(),
    updated_by: 'system'
  },
  'image-to-pdf': {
    id: 'image-to-pdf',
    feature_id: 'image-to-pdf',
    name: 'Image to PDF',
    maintenance_enabled: false,
    maintenance_message: null,
    updated_at: new Date().toISOString(),
    updated_by: 'system'
  },
  'pdf-to-docs': {
    id: 'pdf-to-docs',
    feature_id: 'pdf-to-docs',
    name: 'PDF to Docs',
    maintenance_enabled: false,
    maintenance_message: null,
    updated_at: new Date().toISOString(),
    updated_by: 'system'
  },
  'pdf-compressor': {
    id: 'pdf-compressor',
    feature_id: 'pdf-compressor',
    name: 'PDF Compressor',
    maintenance_enabled: false,
    maintenance_message: null,
    updated_at: new Date().toISOString(),
    updated_by: 'system'
  },
  'video-to-uhd': {
    id: 'video-to-uhd',
    feature_id: 'video-to-uhd',
    name: 'UHD Video Upscaler',
    maintenance_enabled: false,
    maintenance_message: null,
    updated_at: new Date().toISOString(),
    updated_by: 'system'
  },
  'watermark-remover': {
    id: 'watermark-remover',
    feature_id: 'watermark-remover',
    name: 'Watermark Remover',
    maintenance_enabled: false,
    maintenance_message: null,
    updated_at: new Date().toISOString(),
    updated_by: 'system'
  },
  'qr-code-master': {
    id: 'qr-code-master',
    feature_id: 'qr-code-master',
    name: 'QR Code Master',
    maintenance_enabled: false,
    maintenance_message: null,
    updated_at: new Date().toISOString(),
    updated_by: 'system'
  },
  'ai-workflow-assistant': {
    id: 'ai-workflow-assistant',
    feature_id: 'ai-workflow-assistant',
    name: 'AI Workflow Assistant',
    maintenance_enabled: false,
    maintenance_message: null,
    updated_at: new Date().toISOString(),
    updated_by: 'system'
  },
  'metadata-cleaner': {
    id: 'metadata-cleaner',
    feature_id: 'metadata-cleaner',
    name: 'Metadata Cleaner',
    maintenance_enabled: false,
    maintenance_message: null,
    updated_at: new Date().toISOString(),
    updated_by: 'system'
  },
  'web-monitor': {
    id: 'web-monitor',
    feature_id: 'web-monitor',
    name: 'Web Monitor',
    maintenance_enabled: false,
    maintenance_message: null,
    updated_at: new Date().toISOString(),
    updated_by: 'system'
  }
};

// Aliases agar endpoint menerima nama yang berbeda
const FEATURE_ALIASES = {
  'qr-generator': 'qr-code-master',
  'qr-code': 'qr-code-master',
  'qrcode': 'qr-code-master',
  'background-remover': 'bg-remover',
  'remove-background': 'bg-remover',
  'media-compressor': 'compressor',
  'image-compressor': 'compressor',
  'image-tools': 'image-to-pdf',
  'password-generator': 'password',
  'batch-renamer': 'renamer'
};

function normalizeFeatureId(rawId) {
  if (!rawId) return '';
  const clean = String(rawId).toLowerCase().trim();
  return FEATURE_ALIASES[clean] || clean;
}

// In-memory cache
let inMemoryState = {
  global: false,
  global_updated_at: new Date().toISOString(),
  global_updated_by: 'system',
  features: JSON.parse(JSON.stringify(DEFAULT_FEATURES))
};

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn('[FeatureService] Cannot create data dir:', e.message);
  }
}

function loadFromDisk() {
  try {
    ensureDataDir();
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        inMemoryState.global = Boolean(parsed.global);
        inMemoryState.global_updated_at = parsed.global_updated_at || new Date().toISOString();
        inMemoryState.global_updated_by = parsed.global_updated_by || 'system';

        const mergedFeatures = JSON.parse(JSON.stringify(DEFAULT_FEATURES));
        if (parsed.features && typeof parsed.features === 'object') {
          for (const key of Object.keys(parsed.features)) {
            const normKey = normalizeFeatureId(key);
            const item = parsed.features[key];
            if (!mergedFeatures[normKey]) {
              mergedFeatures[normKey] = {
                id: normKey,
                feature_id: normKey,
                name: normKey,
                maintenance_enabled: false,
                maintenance_message: null,
                updated_at: new Date().toISOString(),
                updated_by: 'system'
              };
            }
            if (typeof item.maintenance_enabled === 'boolean') {
              mergedFeatures[normKey].maintenance_enabled = item.maintenance_enabled;
            } else if (typeof item.maintenance === 'boolean') {
              mergedFeatures[normKey].maintenance_enabled = item.maintenance;
            }
            if (item.maintenance_message !== undefined) {
              mergedFeatures[normKey].maintenance_message = item.maintenance_message;
            } else if (item.message !== undefined) {
              mergedFeatures[normKey].maintenance_message = item.message;
            }
            if (item.updated_at) mergedFeatures[normKey].updated_at = item.updated_at;
            if (item.updated_by) mergedFeatures[normKey].updated_by = item.updated_by;
          }
        }
        inMemoryState.features = mergedFeatures;
        return;
      }
    }
  } catch (e) {
    console.warn('[FeatureService] Error reading settings from disk:', e.message);
  }
  // Simpan initial defaults jika file belum ada
  saveToDisk();
}

function saveToDisk() {
  try {
    ensureDataDir();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(inMemoryState, null, 2), 'utf8');
  } catch (e) {
    console.warn('[FeatureService] Error saving settings to disk:', e.message);
  }
}

// Inisialisasi awal saat modul dimuat
loadFromDisk();

/**
 * Mengembalikan format respon status semua fitur sesuai kebutuhan:
 * Minimal:
 * {
 *   "global": false,
 *   "features": {
 *     "pdf-compressor": {
 *       "maintenance": true,
 *       "maintenance_enabled": true,
 *       "message": "...",
 *       "updated_at": "...",
 *       "updated_by": "..."
 *     }
 *   }
 * }
 */
function getStatusResponse() {
  const featuresOutput = {};
  const isGlobal = inMemoryState.global;

  for (const [key, feat] of Object.entries(inMemoryState.features)) {
    const isMnt = isGlobal || Boolean(feat.maintenance_enabled);
    featuresOutput[key] = {
      id: feat.id || key,
      feature_id: feat.feature_id || key,
      name: feat.name || key,
      maintenance: isMnt,
      maintenance_enabled: Boolean(feat.maintenance_enabled),
      message: feat.maintenance_message || null,
      updated_at: feat.updated_at,
      updated_by: feat.updated_by
    };
  }

  // Tambahkan alias agar client yang mencari "qr-generator" atau "background-remover" tetap match
  for (const [alias, canonical] of Object.entries(FEATURE_ALIASES)) {
    if (featuresOutput[canonical] && !featuresOutput[alias]) {
      featuresOutput[alias] = featuresOutput[canonical];
    }
  }

  return {
    global: inMemoryState.global,
    global_updated_at: inMemoryState.global_updated_at,
    global_updated_by: inMemoryState.global_updated_by,
    server_time: new Date().toISOString(),
    features: featuresOutput
  };
}

/**
 * Format respon API minimal level 1 & 2:
 * {
 *   "global": false,
 *   "features": {
 *     "background-remover": false,
 *     "pdf-compressor": true,
 *     "qr-generator": false,
 *     "image-tools": false,
 *     "web-monitor": false
 *   }
 * }
 */
function getMaintenanceResponse() {
  const isGlobal = Boolean(inMemoryState.global);
  const featuresMap = {};

  for (const [key, feat] of Object.entries(inMemoryState.features)) {
    featuresMap[key] = Boolean(feat.maintenance_enabled);
  }

  for (const [alias, canonical] of Object.entries(FEATURE_ALIASES)) {
    if (featuresMap[canonical] !== undefined) {
      featuresMap[alias] = Boolean(featuresMap[canonical]);
    }
  }

  return {
    global: isGlobal,
    features: featuresMap
  };
}

/**
 * Update maintenance status untuk satu fitur
 */
function setFeatureMaintenance(rawFeatureId, enabled, message, updatedBy = 'admin') {
  const normId = normalizeFeatureId(rawFeatureId);

  if (!inMemoryState.features[normId]) {
    inMemoryState.features[normId] = {
      id: normId,
      feature_id: normId,
      name: normId,
      maintenance_enabled: false,
      maintenance_message: null,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy
    };
  }

  const feat = inMemoryState.features[normId];
  feat.maintenance_enabled = Boolean(enabled);
  if (message !== undefined) {
    feat.maintenance_message = message || null;
  }
  feat.updated_at = new Date().toISOString();
  feat.updated_by = updatedBy;

  saveToDisk();
  return getStatusResponse();
}

/**
 * Update global maintenance mode
 */
function setGlobalMaintenance(enabled, updatedBy = 'admin') {
  inMemoryState.global = Boolean(enabled);
  inMemoryState.global_updated_at = new Date().toISOString();
  inMemoryState.global_updated_by = updatedBy;

  saveToDisk();
  return getStatusResponse();
}

/**
 * Reset seluruh maintenance (semua kembali aktif)
 */
function resetAllMaintenance(updatedBy = 'admin') {
  inMemoryState.global = false;
  inMemoryState.global_updated_at = new Date().toISOString();
  inMemoryState.global_updated_by = updatedBy;

  for (const key of Object.keys(inMemoryState.features)) {
    inMemoryState.features[key].maintenance_enabled = false;
    inMemoryState.features[key].updated_at = new Date().toISOString();
    inMemoryState.features[key].updated_by = updatedBy;
  }

  saveToDisk();
  return getStatusResponse();
}

module.exports = {
  getStatusResponse,
  getMaintenanceResponse,
  setFeatureMaintenance,
  setGlobalMaintenance,
  resetAllMaintenance,
  normalizeFeatureId
};
