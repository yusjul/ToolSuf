(function() {
  try {
    var p = window.parent.document.documentElement;
    if (p.classList.contains('dark')) { document.documentElement.classList.add('dark'); }
    else { document.documentElement.classList.add('light'); }
  } catch(e) { document.documentElement.classList.add('light'); }
  var lang = new URLSearchParams(window.location.search).get('lang');
  window.__initialLang = lang === 'en' ? 'en' : 'id';
})();

const translations = {
  id: {
    title: 'Metadata Cleaner',
    subtitle: 'Penghapus EXIF & Alat Privasi Offline',
    dropPrompt: 'Seret & lepas foto di sini atau klik untuk memilih',
    supportedFormats: 'Mendukung JPEG, PNG, dan WebP',
    uploadedFiles: 'DAFTAR GAMBAR',
    inspectorPreview: 'INSPEKTUR METADATA',
    lblNoFile: 'Pilih gambar untuk melihat detail',
    warningMsg: 'GPS terdeteksi! Siap dibersihkan.',
    locationMap: 'Visualisasi GPS Offline',
    btnClean: 'Bersihkan & Unduh',
    btnCleanAll: 'Bersihkan Semua & Unduh ZIP',
    btnClear: 'Kosongkan Daftar',
    privacyText: 'Pemrosesan 100% Offline Lokal. Data Anda Aman.',
    lblDevice: 'Kamera:',
    lblAperture: 'Apertur:',
    lblShutter: 'Rana:',
    lblIso: 'ISO:',
    lblFocal: 'Fokus:',
    lblDate: 'Tanggal:',
    lblLocation: 'Lokasi GPS:',
    lblAltitude: 'Ketinggian:',
    lblDirection: 'Arah:',
    lblDimensions: 'Dimensi:',
    lblNoMetadata: 'Tidak ada metadata ditemukan (Aman)',
    lblFileCleaned: 'Dibersihkan',
    lblMetadataFound: 'Metadata terdeteksi',
    cleanSuccess: 'Gambar berhasil dibersihkan!',
    zipSuccess: 'Arsip ZIP berhasil diunduh!',
    errFormat: 'Format file tidak didukung!'
  },
  en: {
    title: 'Metadata Cleaner',
    subtitle: 'Offline EXIF Stripper & Privacy Suite',
    dropPrompt: 'Drag & drop photos here or click to browse',
    supportedFormats: 'Supports JPEG, PNG, and WebP',
    uploadedFiles: 'UPLOADED IMAGES',
    inspectorPreview: 'METADATA INSPECTOR',
    lblNoFile: 'Select an image to view details',
    warningMsg: 'GPS detected! Ready to be cleaned.',
    locationMap: 'Offline GPS Visualization',
    btnClean: 'Clean & Download',
    btnCleanAll: 'Clean All & Download ZIP',
    btnClear: 'Clear List',
    privacyText: '100% Offline Local Processing. Your Data is Secure.',
    lblDevice: 'Camera:',
    lblAperture: 'Aperture:',
    lblShutter: 'Shutter Speed:',
    lblIso: 'ISO:',
    lblFocal: 'Focal Length:',
    lblDate: 'Captured:',
    lblLocation: 'GPS Location:',
    lblAltitude: 'Altitude:',
    lblDirection: 'Direction:',
    lblDimensions: 'Dimensions:',
    lblNoMetadata: 'No metadata found (Secure)',
    lblFileCleaned: 'Cleaned',
    lblMetadataFound: 'Metadata detected',
    cleanSuccess: 'Image successfully cleaned!',
    zipSuccess: 'ZIP archive successfully downloaded!',
    errFormat: 'File format not supported!'
  }
};

let currentLang = 'id';
let uploadedFiles = [];
let activeFileId = null;
let radarAnimFrame = null;
let radarAngle = 0;
let radarPulses = [];

// --- Theme and Sync ---
function applyLang(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
  
  // Re-render components to apply dynamic language changes
  renderFileList();
  renderInspector();
}

window.syncTheme = function(dark) {
  const htmlEl = document.documentElement;
  htmlEl.classList.toggle('dark', !!dark);
  htmlEl.classList.toggle('light', !dark);
};

window.syncLang = function(lang) {
  if (!translations[lang]) return;
  applyLang(lang);
};

window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'syncTheme') {
    window.syncTheme(e.data.dark);
  }
  if (e.data && e.data.type === 'syncLang') {
    window.syncLang(e.data.lang);
  }
});

// Send message to parent shell to show toast
function notifyParent(msg) {
  window.parent.postMessage({ type: 'showToast', message: msg }, '*');
}

// --- File Sorter & Parser ---
document.addEventListener('DOMContentLoaded', () => {
  if (window.__initialLang) applyLang(window.__initialLang);
  
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const btnCleanActive = document.getElementById('btnCleanActive');
  const btnCleanAll = document.getElementById('btnCleanAll');
  const btnClearList = document.getElementById('btnClearList');
  
  // Trigger file browser on dropzone click
  dropzone.addEventListener('click', () => fileInput.click());
  
  fileInput.addEventListener('change', (e) => {
    handleSelectedFiles(e.target.files);
    fileInput.value = ''; // Reset input
  });
  
  // Drag and Drop listeners
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    handleSelectedFiles(e.dataTransfer.files);
  });
  
  // Button Actions
  btnCleanActive.addEventListener('click', cleanActiveImage);
  btnCleanAll.addEventListener('click', cleanAllImages);
  btnClearList.addEventListener('click', clearFilesList);
});

function handleSelectedFiles(filesList) {
  if (!filesList || filesList.length === 0) return;
  
  const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  let hasValid = false;
  
  Array.from(filesList).forEach(file => {
    if (!acceptedTypes.includes(file.type)) {
      notifyParent(translations[currentLang].errFormat + ` (${file.name})`);
      return;
    }
    hasValid = true;
    
    const fileId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const newFileObj = {
      id: fileId,
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
      metadata: null,
      hasGPS: false,
      status: 'ready',
      cleanedBlob: null,
      thumbnailUrl: URL.createObjectURL(file)
    };
    
    uploadedFiles.push(newFileObj);
    
    // Parse EXIF tags using exif-js
    EXIF.getData(file, function() {
      const allTags = EXIF.getAllTags(this);
      
      let device = '—';
      if (allTags.Make || allTags.Model) {
        const make = allTags.Make ? allTags.Make.trim() : '';
        const model = allTags.Model ? allTags.Model.trim() : '';
        device = make === model ? model : `${make} ${model}`;
      }
      
      // Parse coordinates
      let latitude = null;
      let longitude = null;
      if (allTags.GPSLatitude && allTags.GPSLatitude.length >= 3) {
        latitude = convertDMSToDD(allTags.GPSLatitude, allTags.GPSLatitudeRef);
      }
      if (allTags.GPSLongitude && allTags.GPSLongitude.length >= 3) {
        longitude = convertDMSToDD(allTags.GPSLongitude, allTags.GPSLongitudeRef);
      }
      
      const hasGpsData = (latitude !== null && longitude !== null);
      
      newFileObj.metadata = {
        device: device,
        aperture: allTags.FNumber ? `f/${allTags.FNumber}` : '—',
        shutterSpeed: formatShutterSpeed(allTags.ExposureTime),
        iso: allTags.ISOSpeedRatings ? allTags.ISOSpeedRatings : '—',
        focalLength: allTags.FocalLength ? `${allTags.FocalLength} mm` : '—',
        date: allTags.DateTimeOriginal || allTags.DateTime || '—',
        latitude: latitude,
        longitude: longitude,
        altitude: allTags.GPSAltitude ? `${parseFloat(allTags.GPSAltitude).toFixed(1)} m` : '—',
        direction: allTags.GPSImgDirection ? `${parseFloat(allTags.GPSImgDirection).toFixed(1)}°` : '—'
      };
      
      // Determine if image has general metadata fields (device or coordinates or capture date)
      const hasAnyMeta = (
        device !== '—' || 
        allTags.DateTimeOriginal || 
        allTags.DateTime || 
        allTags.FNumber || 
        hasGpsData
      );
      
      newFileObj.hasGPS = hasGpsData;
      newFileObj.hasMeta = hasAnyMeta;
      
      // If we don't have metadata, show as clean initially
      if (!hasAnyMeta) {
        newFileObj.status = 'ready'; // Ready but clean
      }
      
      renderFileList();
      if (activeFileId === newFileObj.id) {
        renderInspector();
      }
    });
  });
  
  if (hasValid && uploadedFiles.length > 0) {
    if (!activeFileId) {
      activeFileId = uploadedFiles[0].id;
    }
    document.getElementById('fileListSection').style.display = 'block';
    document.getElementById('actionsSection').style.display = 'block';
    renderFileList();
    renderInspector();
  }
}

// DMS coordinate conversion helper
function convertDMSToDD(gpsData, ref) {
  if (!gpsData || gpsData.length < 3) return null;
  const deg = parseFloat(gpsData[0]) || 0;
  const min = parseFloat(gpsData[1]) || 0;
  const sec = parseFloat(gpsData[2]) || 0;
  let decimal = deg + (min / 60) + (sec / 3600);
  if (ref === 'S' || ref === 'W') {
    decimal = -decimal;
  }
  return decimal;
}

// Exposure Time formatter helper
function formatShutterSpeed(val) {
  if (!val) return '—';
  if (typeof val === 'number') {
    if (val >= 1) return val.toFixed(1) + 's';
    return `1/${Math.round(1 / val)}s`;
  }
  if (val.numerator && val.denominator) {
    if (val.numerator === 1) return `1/${val.denominator}s`;
    return `${val.numerator}/${val.denominator}s`;
  }
  return val + 's';
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// --- Render File List UI ---
function renderFileList() {
  const fileList = document.getElementById('fileList');
  fileList.innerHTML = '';
  
  if (uploadedFiles.length === 0) {
    document.getElementById('fileListSection').style.display = 'none';
    document.getElementById('actionsSection').style.display = 'none';
    return;
  }
  
  uploadedFiles.forEach(fileObj => {
    const fileItem = document.createElement('div');
    fileItem.className = `file-item ${activeFileId === fileObj.id ? 'active' : ''}`;
    fileItem.addEventListener('click', () => {
      activeFileId = fileObj.id;
      renderFileList();
      renderInspector();
    });
    
    // Determine inline badge state
    let badgeHtml = '';
    if (fileObj.status === 'cleaned') {
      badgeHtml = `<span class="status-badge-inline clean">${translations[currentLang].lblFileCleaned}</span>`;
    } else if (fileObj.hasGPS) {
      badgeHtml = `<span class="status-badge-inline gps">GPS</span>`;
    } else if (fileObj.hasMeta) {
      badgeHtml = `<span class="status-badge-inline ready">META</span>`;
    } else {
      badgeHtml = `<span class="status-badge-inline clean">SECURE</span>`;
    }
    
    fileItem.innerHTML = `
      <div class="file-item-left">
        <img class="file-item-thumb" src="${fileObj.thumbnailUrl}" alt="Thumb">
        <div class="file-item-info">
          <span class="file-item-name" title="${fileObj.name}">${fileObj.name}</span>
          <span class="file-item-size">${formatBytes(fileObj.size)}</span>
        </div>
      </div>
      <div class="file-item-right">
        ${badgeHtml}
        <button class="btn-remove-file" aria-label="Remove image" onclick="event.stopPropagation(); removeFileFromList('${fileObj.id}');">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `;
    
    fileList.appendChild(fileItem);
  });
  
  // Show / Hide Batch actions
  const btnCleanAll = document.getElementById('btnCleanAll');
  if (uploadedFiles.length > 1) {
    btnCleanAll.style.display = 'inline-flex';
  } else {
    btnCleanAll.style.display = 'none';
  }
}

// Remove single file
window.removeFileFromList = function(id) {
  uploadedFiles = uploadedFiles.filter(f => {
    if (f.id === id) {
      URL.revokeObjectURL(f.thumbnailUrl);
      return false;
    }
    return true;
  });
  
  if (activeFileId === id) {
    activeFileId = uploadedFiles.length > 0 ? uploadedFiles[0].id : null;
  }
  
  renderFileList();
  renderInspector();
};

// --- Render Inspector Details UI ---
function renderInspector() {
  const emptyState = document.getElementById('inspectorEmpty');
  const panelState = document.getElementById('inspectorPanel');
  
  stopRadarAnimation();
  
  if (!activeFileId || uploadedFiles.length === 0) {
    emptyState.style.display = 'flex';
    panelState.style.display = 'none';
    return;
  }
  
  emptyState.style.display = 'none';
  panelState.style.display = 'flex';
  
  const fileObj = uploadedFiles.find(f => f.id === activeFileId);
  if (!fileObj) return;
  
  // Header
  document.getElementById('previewThumb').src = fileObj.thumbnailUrl;
  document.getElementById('previewName').textContent = fileObj.name;
  document.getElementById('previewSize').textContent = formatBytes(fileObj.size);
  
  // Info Rows
  const infoRows = document.getElementById('infoRows');
  infoRows.innerHTML = '';
  
  const addRow = (keyText, valText, isWarn = false) => {
    const row = document.createElement('div');
    row.className = `info-row ${isWarn ? 'warning' : ''}`;
    row.innerHTML = `
      <span class="info-key">${keyText}</span>
      <span class="info-val">${valText}</span>
    `;
    infoRows.appendChild(row);
  };
  
  if (fileObj.status === 'cleaned') {
    addRow(translations[currentLang].lblNoMetadata, `✓ ${translations[currentLang].lblFileCleaned}`);
    document.getElementById('gpsAlert').style.display = 'none';
    document.getElementById('mapWidget').style.display = 'none';
  } else if (!fileObj.metadata) {
    // Parsing tags, display loading state
    addRow('Status:', 'Scanning EXIF...');
    document.getElementById('gpsAlert').style.display = 'none';
    document.getElementById('mapWidget').style.display = 'none';
  } else if (!fileObj.hasMeta) {
    addRow(translations[currentLang].lblNoMetadata, '✓ Secure');
    document.getElementById('gpsAlert').style.display = 'none';
    document.getElementById('mapWidget').style.display = 'none';
  } else {
    // Draw EXIF metadata rows
    const m = fileObj.metadata;
    
    if (m.device !== '—') addRow(translations[currentLang].lblDevice, m.device);
    if (m.aperture !== '—') addRow(translations[currentLang].lblAperture, m.aperture);
    if (m.shutterSpeed !== '—') addRow(translations[currentLang].lblShutter, m.shutterSpeed);
    if (m.iso !== '—') addRow(translations[currentLang].lblIso, m.iso);
    if (m.focalLength !== '—') addRow(translations[currentLang].lblFocal, m.focalLength);
    if (m.date !== '—') addRow(translations[currentLang].lblDate, m.date);
    
    if (fileObj.hasGPS) {
      addRow(translations[currentLang].lblLocation, `${m.latitude.toFixed(5)}, ${m.longitude.toFixed(5)}`, true);
      if (m.altitude !== '—') addRow(translations[currentLang].lblAltitude, m.altitude);
      if (m.direction !== '—') addRow(translations[currentLang].lblDirection, m.direction);
      
      // Show Alert & Map
      document.getElementById('gpsAlert').style.display = 'flex';
      document.getElementById('mapWidget').style.display = 'flex';
      document.getElementById('coordTag').textContent = `${m.latitude.toFixed(5)}, ${m.longitude.toFixed(5)}`;
      
      // Start Canvas Telemetry sweep
      startRadarAnimation(m.latitude, m.longitude);
    } else {
      document.getElementById('gpsAlert').style.display = 'none';
      document.getElementById('mapWidget').style.display = 'none';
    }
  }
}

// --- Canvas Radar Lock-on Animation ---
function startRadarAnimation(lat, lng) {
  const canvas = document.getElementById('mapCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  if (radarAnimFrame) {
    cancelAnimationFrame(radarAnimFrame);
  }
  
  radarPulses = [0.1, 0.45, 0.8]; // three concentric circles
  radarAngle = 0;
  
  function animate() {
    ctx.fillStyle = '#0a0b10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxRadius = Math.min(cx, cy) - 20;
    
    // Draw fine radar grid lines
    ctx.strokeStyle = 'rgba(0, 122, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let r = 30; r <= maxRadius; r += 30) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(0, 122, 255, 0.25)';
      ctx.font = '8px monospace';
      ctx.fillText(`${r * 10}m`, cx + r + 2, cy - 2);
    }
    
    // Grid coordinate axis crosshairs
    ctx.strokeStyle = 'rgba(0, 122, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(10, cy);
    ctx.lineTo(canvas.width - 10, cy);
    ctx.moveTo(cx, 10);
    ctx.lineTo(cx, canvas.height - 10);
    ctx.stroke();
    
    // Radar sweep line with fading gradient
    radarAngle = (radarAngle + 0.008) % (Math.PI * 2);
    const sweepX = cx + Math.cos(radarAngle) * maxRadius;
    const sweepY = cy + Math.sin(radarAngle) * maxRadius;
    
    const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
    sweepGrad.addColorStop(0, 'rgba(0, 122, 255, 0.12)');
    sweepGrad.addColorStop(1, 'rgba(0, 122, 255, 0)');
    
    ctx.strokeStyle = sweepGrad;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(sweepX, sweepY);
    ctx.stroke();
    
    // Pulsing target signals
    radarPulses = radarPulses.map(p => {
      let np = p + 0.006;
      if (np > 1) np = 0.01;
      
      ctx.strokeStyle = `rgba(0, 122, 255, ${1.2 - np})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, np * maxRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      return np;
    });
    
    // Center point (representing locked coordinates)
    ctx.fillStyle = '#FF9500'; // Orange lock point
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Target acquisition brackets
    ctx.strokeStyle = '#FF9500';
    ctx.lineWidth = 1.8;
    const b = 10; // Bracket size
    const pad = 12;
    ctx.beginPath();
    // Top-Left
    ctx.moveTo(cx - pad, cy - pad + b);
    ctx.lineTo(cx - pad, cy - pad);
    ctx.lineTo(cx - pad + b, cy - pad);
    // Top-Right
    ctx.moveTo(cx + pad, cy - pad + b);
    ctx.lineTo(cx + pad, cy - pad);
    ctx.lineTo(cx + pad - b, cy - pad);
    // Bottom-Left
    ctx.moveTo(cx - pad, cy + pad - b);
    ctx.lineTo(cx - pad, cy + pad);
    ctx.lineTo(cx - pad + b, cy + pad);
    // Bottom-Right
    ctx.moveTo(cx + pad, cy + pad - b);
    ctx.lineTo(cx + pad, cy + pad);
    ctx.lineTo(cx + pad - b, cy + pad);
    ctx.stroke();
    
    // Scientific HUD layout text overlay
    ctx.fillStyle = 'rgba(0, 122, 255, 0.4)';
    ctx.font = '9px monospace';
    ctx.fillText('GPS TELEMETRY LOCK // DETECTED', 16, 22);
    ctx.fillText('COORD LAT: ' + (lat >= 0 ? '+' : '') + lat.toFixed(5), 16, 36);
    ctx.fillText('COORD LNG: ' + (lng >= 0 ? '+' : '') + lng.toFixed(5), 16, 48);
    
    ctx.fillText('SYS: OFFLINE PRIVACY', canvas.width - 130, 22);
    ctx.fillText('GPS STATUS: LOCK_ACQUIRED', canvas.width - 150, 36);
    
    radarAnimFrame = requestAnimationFrame(animate);
  }
  
  animate();
}

function stopRadarAnimation() {
  if (radarAnimFrame) {
    cancelAnimationFrame(radarAnimFrame);
    radarAnimFrame = null;
  }
}

// --- Binary Metadata Stripping ---
function stripMetadata(arrayBuffer, fileType) {
  if (fileType === 'image/jpeg' || fileType === 'image/jpg') {
    return stripJpegMetadata(arrayBuffer);
  } else if (fileType === 'image/png') {
    return stripPngMetadata(arrayBuffer);
  } else if (fileType === 'image/webp') {
    return stripWebpMetadata(arrayBuffer);
  }
  return arrayBuffer;
}

// Lossless JPEG stripper (APP1 Exif/XMP and APP13 Photoshop markers)
function stripJpegMetadata(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  if (view.getUint16(0) !== 0xFFD8) {
    return arrayBuffer; // Not valid JPEG
  }
  
  const length = arrayBuffer.byteLength;
  let offset = 2;
  const segments = [];
  
  while (offset < length) {
    if (offset + 4 > length) {
      segments.push(new Uint8Array(arrayBuffer, offset));
      break;
    }
    
    const marker = view.getUint16(offset);
    if (marker === 0xFFDA) { // SOS (Start of Scan) - entropy data follows
      segments.push(new Uint8Array(arrayBuffer, offset));
      break;
    }
    
    if (view.getUint8(offset) !== 0xFF) {
      segments.push(new Uint8Array(arrayBuffer, offset));
      break;
    }
    
    const markerByte = view.getUint8(offset + 1);
    if (markerByte === 0xD9) { // EOI
      segments.push(new Uint8Array(arrayBuffer, offset));
      break;
    }
    
    const segmentLength = view.getUint16(offset + 2);
    const fullSegmentLength = 2 + segmentLength;
    
    if (offset + fullSegmentLength > length) {
      segments.push(new Uint8Array(arrayBuffer, offset));
      break;
    }
    
    // Strip APP1 (Exif/XMP) and APP13 (Photoshop metadata)
    if (markerByte === 0xE1 || markerByte === 0xED) {
      // Skipped
    } else {
      segments.push(new Uint8Array(arrayBuffer, offset, fullSegmentLength));
    }
    
    offset += fullSegmentLength;
  }
  
  const totalLength = 2 + segments.reduce((sum, seg) => sum + seg.length, 0);
  const cleanBuffer = new Uint8Array(totalLength);
  
  // Write SOI
  cleanBuffer[0] = 0xFF;
  cleanBuffer[1] = 0xD8;
  
  let writeOffset = 2;
  for (const seg of segments) {
    cleanBuffer.set(seg, writeOffset);
    writeOffset += seg.length;
  }
  
  return cleanBuffer.buffer;
}

// Lossless PNG stripper (tEXt, zTXt, iTXt, eXIf, and tIME)
function stripPngMetadata(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  if (view.getUint32(0) !== 0x89504E47 || view.getUint32(4) !== 0x0D0A1A0A) {
    return arrayBuffer;
  }
  
  const length = arrayBuffer.byteLength;
  let offset = 8;
  const segments = [];
  const signature = new Uint8Array(arrayBuffer, 0, 8);
  const chunksToStrip = ['tEXt', 'zTXt', 'iTXt', 'eXIf', 'tIME'];
  
  while (offset < length) {
    if (offset + 8 > length) break;
    const chunkLength = view.getUint32(offset);
    const chunkTypeBytes = new Uint8Array(arrayBuffer, offset + 4, 4);
    const chunkType = String.fromCharCode(...chunkTypeBytes);
    
    const fullChunkLength = 12 + chunkLength; // 4 (length) + 4 (type) + chunk + 4 (CRC)
    
    if (chunksToStrip.includes(chunkType)) {
      // Skipped
    } else {
      segments.push(new Uint8Array(arrayBuffer, offset, fullChunkLength));
    }
    
    offset += fullChunkLength;
  }
  
  const totalLength = 8 + segments.reduce((sum, seg) => sum + seg.length, 0);
  const cleanBuffer = new Uint8Array(totalLength);
  
  cleanBuffer.set(signature, 0);
  let writeOffset = 8;
  for (const seg of segments) {
    cleanBuffer.set(seg, writeOffset);
    writeOffset += seg.length;
  }
  
  return cleanBuffer.buffer;
}

// Lossless WebP metadata stripper (EXIF and XMP chunks, patch VP8X flags and recalculate size)
function stripWebpMetadata(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  if (view.getUint32(0) !== 0x52494646 || view.getUint32(8) !== 0x57454250) {
    return arrayBuffer;
  }
  
  const length = arrayBuffer.byteLength;
  let offset = 12;
  const segments = [];
  
  while (offset < length) {
    if (offset + 8 > length) break;
    const tagBytes = new Uint8Array(arrayBuffer, offset, 4);
    const tag = String.fromCharCode(...tagBytes);
    const size = view.getUint32(offset + 4, true);
    
    const paddedSize = size + (size % 2);
    const fullChunkLength = 8 + paddedSize;
    
    if (tag === 'EXIF' || tag === 'XMP ') {
      // Skipped
    } else if (tag === 'VP8X') {
      let flags = view.getUint8(offset + 8);
      // Unset Exif (0x08) and XMP (0x10)
      flags = flags & ~0x08 & ~0x10;
      
      const modifiedVp8x = new Uint8Array(arrayBuffer, offset, fullChunkLength);
      const vp8xCopy = new Uint8Array(modifiedVp8x);
      vp8xCopy[8] = flags;
      segments.push(vp8xCopy);
    } else {
      segments.push(new Uint8Array(arrayBuffer, offset, fullChunkLength));
    }
    
    offset += fullChunkLength;
  }
  
  const totalPayloadLength = segments.reduce((sum, seg) => sum + seg.length, 0) + 4; // 'WEBP'
  const totalLength = totalPayloadLength + 8; // 'RIFF' + size
  
  const cleanBuffer = new Uint8Array(totalLength);
  
  // Write RIFF
  cleanBuffer[0] = 0x52; cleanBuffer[1] = 0x49; cleanBuffer[2] = 0x46; cleanBuffer[3] = 0x46;
  const sizeView = new DataView(cleanBuffer.buffer);
  sizeView.setUint32(4, totalPayloadLength, true);
  // Write WEBP
  cleanBuffer[8] = 0x57; cleanBuffer[9] = 0x45; cleanBuffer[10] = 0x42; cleanBuffer[11] = 0x50;
  
  let writeOffset = 12;
  for (const seg of segments) {
    cleanBuffer.set(seg, writeOffset);
    writeOffset += seg.length;
  }
  
  return cleanBuffer.buffer;
}

// Download Helper
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- Action Operations ---
function cleanActiveImage() {
  const activeFile = uploadedFiles.find(f => f.id === activeFileId);
  if (!activeFile) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const rawBuffer = e.target.result;
    const cleanBuffer = stripMetadata(rawBuffer, activeFile.type);
    
    activeFile.cleanedBlob = new Blob([cleanBuffer], { type: activeFile.type });
    activeFile.status = 'cleaned';
    
    // Download cleaned file
    downloadBlob(activeFile.cleanedBlob, 'clean_' + activeFile.name);
    notifyParent(translations[currentLang].cleanSuccess);
    
    renderFileList();
    renderInspector();
  };
  reader.readAsArrayBuffer(activeFile.file);
}

function cleanAllImages() {
  if (uploadedFiles.length === 0) return;
  
  const zip = new JSZip();
  let processedCount = 0;
  
  uploadedFiles.forEach(fileObj => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const rawBuffer = e.target.result;
      const cleanBuffer = stripMetadata(rawBuffer, fileObj.type);
      
      fileObj.cleanedBlob = new Blob([cleanBuffer], { type: fileObj.type });
      fileObj.status = 'cleaned';
      
      zip.file('clean_' + fileObj.name, fileObj.cleanedBlob);
      processedCount++;
      
      if (processedCount === uploadedFiles.length) {
        zip.generateAsync({ type: 'blob' }).then(zipBlob => {
          downloadBlob(zipBlob, 'cleaned_images.zip');
          notifyParent(translations[currentLang].zipSuccess);
          renderFileList();
          renderInspector();
        });
      }
    };
    reader.readAsArrayBuffer(fileObj.file);
  });
}

function clearFilesList() {
  uploadedFiles.forEach(f => URL.revokeObjectURL(f.thumbnailUrl));
  uploadedFiles = [];
  activeFileId = null;
  
  renderFileList();
  renderInspector();
}
