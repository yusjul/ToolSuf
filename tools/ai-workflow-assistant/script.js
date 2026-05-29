(function() {
  try {
    var p = window.parent.document.documentElement;
    if (p.classList.contains('dark')) { document.documentElement.classList.add('dark'); }
    else { document.documentElement.classList.add('light'); }
  } catch(e) { document.documentElement.classList.add('light'); }
  var lang = new URLSearchParams(window.location.search).get('lang');
  window.__initialLang = lang === 'en' ? 'en' : 'id';
})();

// Localization Dictionaries
const translations = {
  id: {
    title: 'Asisten Alur Kerja AI',
    subtitle: 'Rantai Prompt Visual & Otomatisasi AI Lokal',
    btnImport: 'Impor',
    btnExport: 'Ekspor',
    btnClear: 'Bersihkan Kanvas',
    btnRun: 'Jalankan Alur Kerja',
    nodeLibrary: 'Perpustakaan Node',
    libTriggerTitle: 'Pemicu (Mulai)',
    libTriggerDesc: 'Memulai jalannya alur kerja.',
    libFileInputTitle: 'Dokumen Input',
    libFileInputDesc: 'Memuat file (.txt, .json).',
    libPromptTitle: 'Templat Prompt',
    libPromptDesc: 'Menggabungkan variabel ke prompt.',
    libModelTitle: 'Model AI (LLM)',
    libModelDesc: 'Mengirim prompt ke Ollama/OpenAI.',
    libOutputTitle: 'Pratinjau Hasil',
    libOutputDesc: 'Menampilkan hasil Markdown akhir.',
    privacyBadgeText: 'Pemrosesan 100% Offline Lokal. Data Anda Aman.',
    canvasInstructions: 'Seret simpul dari kiri atau klik untuk menempatkannya di kanvas.',
    tabInspector: 'Inspektur',
    tabConsole: 'Log Konsol',
    tabSettings: 'Pengaturan API',
    inspectorEmpty: 'Pilih node di kanvas untuk mengonfigurasinya.',
    nodeTitleLabel: 'Label Node',
    consolePlaceholder: 'Jalankan alur kerja untuk melihat jejak eksekusi...',
    resultPreview: 'Pratinjau Hasil',
    btnCopy: 'Salin',
    btnDownload: 'Unduh',
    modelProvider: 'Penyedia Model',
    
    // Node Properties
    propTriggerType: 'Tipe Pemicu',
    propTriggerManual: 'Tombol Manual',
    propFileInputText: 'Isi Teks Konteks',
    propFilePlaceholder: 'Ketik atau tempel teks dokumen di sini...',
    propPromptTemplate: 'Templat Prompt',
    propPromptPlaceholder: 'Masukkan perintah prompt. Gunakan {{input}} untuk menyuntikkan teks dari node sebelumnya.',
    propModelSystem: 'Instruksi Sistem (System Prompt)',
    propModelTemp: 'Temperatur',
    propOutputType: 'Format Output',
    propOutputMarkdown: 'Format Markdown',
    propOutputRaw: 'Teks Mentah (Plain Text)',

    // Toast and messages
    toastCopySuccess: 'Hasil disalin ke papan klip!',
    toastClearSuccess: 'Kanvas dibersihkan.',
    toastImportSuccess: 'Alur kerja berhasil diimpor!',
    toastImportError: 'Gagal mengimpor file alur kerja.',
    toastExportSuccess: 'Alur kerja berhasil diekspor!',
    
    // Logs
    logStart: 'Memulai eksekusi alur kerja...',
    logTriggered: '[Pemicu] Diaktifkan secara manual.',
    logFileParsed: '[Dokumen Input] Teks dibaca: {len} karakter.',
    logPromptBuilt: '[Templat Prompt] Prompt berhasil dibuat.',
    logModelCalling: '[Model AI] Memanggil model {model}...',
    logModelSuccess: '[Model AI] Berhasil menerima tanggapan dari model.',
    logModelError: '[Model AI] Kesalahan: {err}',
    logOutputDone: '[Pratinjau Hasil] Hasil akhir dirender.',
    logFinished: 'Eksekusi alur kerja selesai sukses!',
    logErrorInterrupt: 'Eksekusi terhenti karena kesalahan.'
  },
  en: {
    title: 'AI Workflow Assistant',
    subtitle: 'Visual Prompt Chains & Local AI Automation',
    btnImport: 'Import',
    btnExport: 'Export',
    btnClear: 'Clear Canvas',
    btnRun: 'Run Workflow',
    nodeLibrary: 'Node Library',
    libTriggerTitle: 'Trigger (Start)',
    libTriggerDesc: 'Starts the workflow chain.',
    libFileInputTitle: 'Document Input',
    libFileInputDesc: 'Loads files (.txt, .json).',
    libPromptTitle: 'Prompt Template',
    libPromptDesc: 'Combines variables into a prompt.',
    libModelTitle: 'AI Model (LLM)',
    libModelDesc: 'Sends prompt to Ollama or OpenAI.',
    libOutputTitle: 'Output Preview',
    libOutputDesc: 'Displays final Markdown result.',
    privacyBadgeText: '100% Offline Local Processing. Your Data is Secure.',
    canvasInstructions: 'Drag nodes from the left library or click to place them.',
    tabInspector: 'Inspector',
    tabConsole: 'Console Logs',
    tabSettings: 'API Settings',
    inspectorEmpty: 'Select a node on the canvas to configure it.',
    nodeTitleLabel: 'Node Label',
    consolePlaceholder: 'Run workflow to see live execution trace...',
    resultPreview: 'Result Preview',
    btnCopy: 'Copy',
    btnDownload: 'Download',
    modelProvider: 'Model Provider',
    
    // Node Properties
    propTriggerType: 'Trigger Type',
    propTriggerManual: 'Manual Button',
    propFileInputText: 'Context Text Content',
    propFilePlaceholder: 'Type or paste document text here...',
    propPromptTemplate: 'Prompt Template',
    propPromptPlaceholder: 'Enter prompt command. Use {{input}} to inject text from the previous node.',
    propModelSystem: 'System Prompt Instructions',
    propModelTemp: 'Temperature',
    propOutputType: 'Output Format',
    propOutputMarkdown: 'Markdown Formatted',
    propOutputRaw: 'Raw Text (Plain Text)',

    // Toast and messages
    toastCopySuccess: 'Results copied to clipboard!',
    toastClearSuccess: 'Canvas cleared.',
    toastImportSuccess: 'Workflow successfully imported!',
    toastImportError: 'Failed to import workflow file.',
    toastExportSuccess: 'Workflow successfully exported!',
    
    // Logs
    logStart: 'Starting workflow execution...',
    logTriggered: '[Trigger] Triggered manually.',
    logFileParsed: '[Document Input] Read text: {len} characters.',
    logPromptBuilt: '[Prompt Template] Prompt successfully rendered.',
    logModelCalling: '[AI Model] Calling model {model}...',
    logModelSuccess: '[AI Model] Successfully received response from model.',
    logModelError: '[AI Model] Error: {err}',
    logOutputDone: '[Output Preview] Final result rendered.',
    logFinished: 'Workflow execution completed successfully!',
    logErrorInterrupt: 'Execution interrupted due to errors.'
  }
};

let currentLang = 'id';
let state = {
  nodes: [],
  connections: [],
  selectedNodeId: null,
  panX: 0,
  panY: 0
};

// DOM references
let canvasArea, nodesLayer, connectionsLayer, canvasInstructions;
let tabInspector, tabConsole, tabSettings;
let inspectorEmptyState, inspectorForm, inspectNodeType, dynamicFields;
let consoleLogs, outputPreviewBox, mdPreview;

// Initial state load
document.addEventListener('DOMContentLoaded', () => {
  canvasArea = document.getElementById('canvasArea');
  nodesLayer = document.getElementById('nodesLayer');
  connectionsLayer = document.getElementById('connectionsLayer');
  canvasInstructions = document.getElementById('canvasInstructions');
  
  inspectorEmptyState = document.getElementById('inspectorEmptyState');
  inspectorForm = document.getElementById('inspectorForm');
  inspectNodeType = document.getElementById('inspectNodeType');
  dynamicFields = document.getElementById('dynamicFields');
  
  consoleLogs = document.getElementById('consoleLogs');
  outputPreviewBox = document.getElementById('outputPreviewBox');
  mdPreview = document.getElementById('mdPreview');

  // Load language
  if (window.__initialLang) {
    applyLang(window.__initialLang);
  }

  // Load API configurations from localStorage
  loadSettings();

  // Load canvas state from localStorage
  loadCanvasState();

  // Setup Event Listeners
  setupCanvasEvents();
  setupSidebarEvents();
  setupButtonEvents();

  // Responsive default sidebar states for mobile/touch screens
  if (window.innerWidth <= 1024) {
    const leftSidebar = document.querySelector('.left-sidebar');
    const rightSidebar = document.querySelector('.right-sidebar');
    const toggleLeft = document.getElementById('toggleLeftSidebar');
    const toggleRight = document.getElementById('toggleRightSidebar');
    
    // Left sidebar is a persistent slim dock (56px) on mobile, should not be hidden
    if (leftSidebar) leftSidebar.classList.remove('collapsed');
    if (toggleLeft) toggleLeft.classList.add('active');
    
    // Right sidebar is a collapsible drawer, starts collapsed
    if (rightSidebar) rightSidebar.classList.add('collapsed');
    if (toggleRight) toggleRight.classList.remove('active');
  }
});

// Translation handling
function applyLang(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  // Dynamic placeholders
  const fileTextEl = document.getElementById('fileTextContent');
  if (fileTextEl) fileTextEl.placeholder = translations[lang].propFilePlaceholder;
  const promptEl = document.getElementById('promptTemplateContent');
  if (promptEl) promptEl.placeholder = translations[lang].propPromptPlaceholder;
}

window.syncTheme = function(dark) {
  const htmlEl = document.documentElement;
  htmlEl.classList.toggle('dark', !!dark);
  htmlEl.classList.toggle('light', !dark);
};

window.syncLang = function(lang) {
  if (!translations[lang]) return;
  applyLang(lang);
  renderNodes();
  renderConnections();
};

window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'syncTheme') {
    window.syncTheme(e.data.dark);
  }
  if (e.data && e.data.type === 'syncLang') {
    window.syncLang(e.data.lang);
  }
});

// Settings Management
function loadSettings() {
  document.getElementById('modelProvider').value = localStorage.getItem('modelProvider') || 'mock';
  document.getElementById('ollamaUrl').value = localStorage.getItem('ollamaUrl') || 'http://localhost:11434';
  document.getElementById('ollamaModel').value = localStorage.getItem('ollamaModel') || 'llama3';
  document.getElementById('openaiKey').value = localStorage.getItem('openaiKey') || '';
  document.getElementById('openaiUrl').value = localStorage.getItem('openaiUrl') || 'https://api.openai.com/v1';
  document.getElementById('openaiModel').value = localStorage.getItem('openaiModel') || 'gpt-4o-mini';
  
  toggleSettingsBlocks();
}

function saveSettings() {
  localStorage.setItem('modelProvider', document.getElementById('modelProvider').value);
  localStorage.setItem('ollamaUrl', document.getElementById('ollamaUrl').value);
  localStorage.setItem('ollamaModel', document.getElementById('ollamaModel').value);
  localStorage.setItem('openaiKey', document.getElementById('openaiKey').value);
  localStorage.setItem('openaiUrl', document.getElementById('openaiUrl').value);
  localStorage.setItem('openaiModel', document.getElementById('openaiModel').value);
}

function toggleSettingsBlocks() {
  const provider = document.getElementById('modelProvider').value;
  document.getElementById('settingsOllama').style.display = provider === 'ollama' ? 'block' : 'none';
  document.getElementById('settingsOpenai').style.display = provider === 'openai' ? 'block' : 'none';
}

// Canvas & Drag-and-Drop Operations
function setupCanvasEvents() {
  // Library Drag-start & Touch-drag
  document.querySelectorAll('.library-item').forEach(item => {
    const dragType = item.getAttribute('data-node-type');

    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('node-type', dragType);
    });

    // UX: allow clicking/tapping to spawn too!
    item.addEventListener('click', () => {
      const rect = canvasArea.getBoundingClientRect();
      const spawnX = (rect.width / 2) - 85 - state.panX;
      const spawnY = (rect.height / 2) - 40 - state.panY;
      createNode(dragType, spawnX, spawnY);
    });

    // Mobile touch drag logic (creates floating clone under finger)
    let touchClone = null;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoved = false;

    item.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchMoved = false;
      
      // Create a floating clone of the library icon
      const innerIcon = item.querySelector('.library-icon');
      if (!innerIcon) return;
      
      touchClone = document.createElement('div');
      touchClone.className = `library-icon-clone ${innerIcon.className}`;
      touchClone.innerHTML = innerIcon.innerHTML;
      
      // Style floating clone
      touchClone.style.position = 'fixed';
      touchClone.style.width = '40px';
      touchClone.style.height = '40px';
      touchClone.style.borderRadius = '8px';
      touchClone.style.display = 'none'; // Hidden until dragging starts to prevent flicker
      touchClone.style.alignItems = 'center';
      touchClone.style.justifyContent = 'center';
      touchClone.style.zIndex = '1000';
      touchClone.style.pointerEvents = 'none';
      touchClone.style.opacity = '0.9';
      touchClone.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
      
      // Position clone exactly under finger
      touchClone.style.left = `${touch.clientX - 20}px`;
      touchClone.style.top = `${touch.clientY - 20}px`;
      
      document.body.appendChild(touchClone);
    }, { passive: true });

    item.addEventListener('touchmove', (e) => {
      if (!touchClone) return;
      const touch = e.touches[0];
      
      // Check if finger moved enough to distinguish a drag from a simple tap
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      if (!touchMoved && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        touchMoved = true;
        touchClone.style.display = 'flex'; // Show clone now that we are dragging
      }
      
      if (touchMoved) {
        touchClone.style.left = `${touch.clientX - 20}px`;
        touchClone.style.top = `${touch.clientY - 20}px`;
        e.preventDefault(); // prevent scroll
      }
    }, { passive: false });

    item.addEventListener('touchend', (e) => {
      if (!touchClone) return;
      
      const touch = e.changedTouches[0];
      touchClone.remove();
      touchClone = null;
      
      if (!touchMoved) {
        // It was a quick tap! Spawn node in the center of the canvas
        const rect = canvasArea.getBoundingClientRect();
        const spawnX = (rect.width / 2) - 85 - state.panX;
        const spawnY = (rect.height / 2) - 40 - state.panY;
        createNode(dragType, spawnX, spawnY);
      } else {
        // Check if dropped inside canvasArea boundaries
        const canvasRect = canvasArea.getBoundingClientRect();
        const inCanvasX = touch.clientX >= canvasRect.left && touch.clientX <= canvasRect.right;
        const inCanvasY = touch.clientY >= canvasRect.top && touch.clientY <= canvasRect.bottom;
        
        if (inCanvasX && inCanvasY) {
          const contentRect = document.getElementById('canvasContent').getBoundingClientRect();
          const x = touch.clientX - contentRect.left - 85; // offset node width
          const y = touch.clientY - contentRect.top - 20; // offset header
          createNode(dragType, x, y);
        }
      }
    });
  });

  // Canvas Drag-over & Drop
  canvasArea.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  canvasArea.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('node-type');
    if (!type) return;
    const rect = document.getElementById('canvasContent').getBoundingClientRect();
    const x = e.clientX - rect.left - 100; // offset half width
    const y = e.clientY - rect.top - 20; // offset header
    createNode(type, x, y);
  });

  // Deselect node on clicking canvas background + Canvas panning
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;

  // Mouse pan start
  canvasArea.addEventListener('mousedown', (e) => {
    const isBackground = e.target === canvasArea || 
                          e.target === document.getElementById('canvasContent') || 
                          e.target === nodesLayer ||
                          e.target === canvasInstructions;
    if (isBackground) {
      panStart(e.clientX, e.clientY);
      e.preventDefault();
      selectNode(null);
    }
  });

  // Touch pan start
  canvasArea.addEventListener('touchstart', (e) => {
    const isBackground = e.target === canvasArea || 
                          e.target === document.getElementById('canvasContent') || 
                          e.target === nodesLayer ||
                          e.target === canvasInstructions;
    if (isBackground) {
      const touch = e.touches[0];
      panStart(touch.clientX, touch.clientY);
      selectNode(null);
    }
  }, { passive: true });

  function panStart(clientX, clientY) {
    isPanning = true;
    panStartX = clientX - state.panX;
    panStartY = clientY - state.panY;
    canvasArea.style.cursor = 'grabbing';
  }

  // Mouse pan move
  document.addEventListener('mousemove', (e) => {
    if (isPanning) {
      panMove(e.clientX, e.clientY);
    }
  });

  // Touch pan move
  document.addEventListener('touchmove', (e) => {
    if (isPanning) {
      const touch = e.touches[0];
      panMove(touch.clientX, touch.clientY);
      e.preventDefault(); // prevent scrolling
    }
  }, { passive: false });

  function panMove(clientX, clientY) {
    state.panX = clientX - panStartX;
    state.panY = clientY - panStartY;
    updateCanvasTransform();
  }

  // Pan end
  document.addEventListener('mouseup', () => {
    if (isPanning) {
      panEnd();
    }
  });

  document.addEventListener('touchend', () => {
    if (isPanning) {
      panEnd();
    }
  });

  function panEnd() {
    isPanning = false;
    canvasArea.style.cursor = 'default';
    saveCanvasState();
  }

  // Setup dragging connection cable state
  setupPinConnectionDragging();
}

function updateCanvasTransform() {
  const content = document.getElementById('canvasContent');
  if (content) {
    content.style.transform = `translate(${state.panX}px, ${state.panY}px)`;
  }
}

// Visual connection building logic
let activeDragCable = null;
function setupPinConnectionDragging() {
  let isDragging = false;
  let sourcePin = null;

  // Mouse drag start
  canvasArea.addEventListener('mousedown', (e) => {
    const pin = e.target.closest('.pin');
    if (!pin) return;
    dragStart(pin, e.clientX, e.clientY);
    e.stopPropagation();
  });

  // Touch drag start
  canvasArea.addEventListener('touchstart', (e) => {
    const pin = e.target.closest('.pin');
    if (!pin) return;
    const touch = e.touches[0];
    e.preventDefault(); // Prevent page scroll/pan when connecting nodes
    dragStart(pin, touch.clientX, touch.clientY);
    e.stopPropagation();
  }, { passive: false });

  function dragStart(pin, clientX, clientY) {
    isDragging = true;
    sourcePin = pin;
    
    // Create temp SVG path for dragging visualization
    activeDragCable = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    activeDragCable.setAttribute('class', 'cable-dragging');
    connectionsLayer.appendChild(activeDragCable);
  }

  // Mouse move
  canvasArea.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    dragMove(e.clientX, e.clientY);
  });

  // Touch move
  canvasArea.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    dragMove(touch.clientX, touch.clientY);
    e.preventDefault(); // prevent screen scrolling
  }, { passive: false });

  function dragMove(clientX, clientY) {
    if (!activeDragCable) return;
    const rect = document.getElementById('canvasContent').getBoundingClientRect();
    const sourceRect = sourcePin.getBoundingClientRect();
    
    const x1 = sourceRect.left + sourceRect.width / 2 - rect.left;
    const y1 = sourceRect.top + sourceRect.height / 2 - rect.top;
    const x2 = clientX - rect.left;
    const y2 = clientY - rect.top;

    // Draw bezier curve to cursor
    const dx = Math.abs(x2 - x1) * 0.5;
    const path = `M ${x1},${y1} C ${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
    activeDragCable.setAttribute('d', path);
  }

  // Mouse up (dest checking)
  document.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    dragEnd(e.clientX, e.clientY, e.target);
  });

  // Touch end (dest checking)
  document.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    
    // Find the element under touch release coordinates
    const touch = e.changedTouches[0];
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    
    dragEnd(touch.clientX, touch.clientY, targetElement);
  });

  function dragEnd(clientX, clientY, targetEl) {
    isDragging = false;

    if (activeDragCable) {
      activeDragCable.remove();
      activeDragCable = null;
    }

    if (!targetEl) return;

    let destPin = targetEl.closest('.pin');
    let destNodeEl = targetEl.closest('.node');

    // UX Fallback: if they drop anywhere on the node card, connect to its input pin
    if (!destPin && destNodeEl) {
      destPin = destNodeEl.querySelector('.pin-in');
    }

    if (!destPin || destPin === sourcePin) return;

    const sourceNodeEl = sourcePin.closest('.node');
    const destNodeElReal = destPin.closest('.node');
    const sourceNodeId = sourceNodeEl.getAttribute('data-id');
    const destNodeId = destNodeElReal.getAttribute('data-id');

    const sourceIsOut = sourcePin.classList.contains('pin-out');
    const destIsIn = destPin.classList.contains('pin-in');

    if (sourceIsOut && destIsIn && sourceNodeId !== destNodeId) {
      // Remove any existing incoming connection to destNodeId
      state.connections = state.connections.filter(c => c.toNodeId !== destNodeId);
      
      state.connections.push({
        fromNodeId: sourceNodeId,
        toNodeId: destNodeId
      });

      saveCanvasState();
      renderConnections();
    }
  }
}

// Sidebars & Tab Swappers
function setupSidebarEvents() {
  document.getElementById('tabInspectorBtn').addEventListener('click', () => switchTab('tabInspector'));
  document.getElementById('tabConsoleBtn').addEventListener('click', () => switchTab('tabConsole'));
  document.getElementById('tabSettingsBtn').addEventListener('click', () => switchTab('tabSettings'));

  // Collapsible Sidebars listeners
  const toggleLeft = document.getElementById('toggleLeftSidebar');
  const leftSidebar = document.querySelector('.left-sidebar');
  toggleLeft.addEventListener('click', () => {
    leftSidebar.classList.toggle('collapsed');
    toggleLeft.classList.toggle('active');
    setTimeout(renderConnections, 60);
  });

  const toggleRight = document.getElementById('toggleRightSidebar');
  const rightSidebar = document.querySelector('.right-sidebar');
  toggleRight.addEventListener('click', () => {
    rightSidebar.classList.toggle('collapsed');
    toggleRight.classList.toggle('active');
    setTimeout(renderConnections, 60);
  });

  // Save settings on changes
  document.getElementById('modelProvider').addEventListener('change', () => {
    saveSettings();
    toggleSettingsBlocks();
  });
  document.getElementById('ollamaUrl').addEventListener('input', saveSettings);
  document.getElementById('ollamaModel').addEventListener('input', saveSettings);
  document.getElementById('openaiKey').addEventListener('input', saveSettings);
  document.getElementById('openaiUrl').addEventListener('input', saveSettings);
  document.getElementById('openaiModel').addEventListener('input', saveSettings);
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === `${tabId}Btn`);
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.style.display = content.id === tabId ? 'flex' : 'none';
  });
}

function setupButtonEvents() {
  document.getElementById('btnClear').addEventListener('click', () => {
    state.nodes = [];
    state.connections = [];
    state.selectedNodeId = null;
    saveCanvasState();
    renderNodes();
    renderConnections();
    selectNode(null);
    showToast(translations[currentLang].toastClearSuccess);
  });

  document.getElementById('btnExport').addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', 'ai-workflow.json');
    dlAnchorElem.click();
    showToast(translations[currentLang].toastExportSuccess);
  });

  document.getElementById('btnImport').addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        try {
          const content = JSON.parse(readerEvent.target.result);
          if (content.nodes && content.connections) {
            state = content;
            saveCanvasState();
            renderNodes();
            renderConnections();
            selectNode(null);
            showToast(translations[currentLang].toastImportSuccess);
          } else {
            showToast(translations[currentLang].toastImportError);
          }
        } catch (err) {
          showToast(translations[currentLang].toastImportError);
        }
      };
      reader.readAsText(file);
    };
    fileInput.click();
  });

  document.getElementById('btnRun').addEventListener('click', runWorkflow);
}

// Node Engine CRUD
function createNode(type, x, y) {
  const id = 'node_' + Math.random().toString(36).substr(2, 9);
  let title = '';
  let defaultData = {};

  switch (type) {
    case 'trigger':
      title = translations[currentLang].libTriggerTitle;
      defaultData = { triggerType: 'manual' };
      break;
    case 'file-input':
      title = translations[currentLang].libFileInputTitle;
      defaultData = { textContent: '' };
      break;
    case 'prompt-template':
      title = translations[currentLang].libPromptTitle;
      defaultData = { template: 'Ringkas teks berikut:\n\n{{input}}' };
      break;
    case 'llm-model':
      title = translations[currentLang].libModelTitle;
      defaultData = { systemPrompt: 'Kamu adalah asisten AI yang cerdas.', temperature: 0.7 };
      break;
    case 'output-formatter':
      title = translations[currentLang].libOutputTitle;
      defaultData = { outputType: 'markdown' };
      break;
  }

  const node = { id, type, title, x, y, data: defaultData };
  state.nodes.push(node);
  saveCanvasState();
  
  renderNodes();
  selectNode(id);
}

function deleteNode(id, e) {
  if (e) e.stopPropagation();
  state.nodes = state.nodes.filter(n => n.id !== id);
  state.connections = state.connections.filter(c => c.fromNodeId !== id && c.toNodeId !== id);
  if (state.selectedNodeId === id) {
    selectNode(null);
  }
  saveCanvasState();
  renderNodes();
  renderConnections();
}

function selectNode(id) {
  state.selectedNodeId = id;
  document.querySelectorAll('.node').forEach(nodeEl => {
    nodeEl.classList.toggle('selected', nodeEl.getAttribute('data-id') === id);
  });
  
  if (!id) {
    inspectorEmptyState.style.display = 'block';
    inspectorForm.style.display = 'none';
    return;
  }

  const node = state.nodes.find(n => n.id === id);
  if (!node) return;

  inspectorEmptyState.style.display = 'none';
  inspectorForm.style.display = 'block';
  
  inspectNodeType.textContent = node.title;
  document.getElementById('nodeTitle').value = node.title;
  
  // Custom properties generator
  generateInspectorFields(node);
  switchTab('tabInspector');
}

function generateInspectorFields(node) {
  dynamicFields.innerHTML = '';

  // Label input listener
  document.getElementById('nodeTitle').oninput = (e) => {
    node.title = e.target.value;
    const labelEl = document.querySelector(`.node[data-id="${node.id}"] .node-label`);
    if (labelEl) labelEl.textContent = e.target.value;
    inspectNodeType.textContent = e.target.value;
    saveCanvasState();
  };

  if (node.type === 'trigger') {
    const group = createFormGroup(translations[currentLang].propTriggerType);
    const select = document.createElement('select');
    select.className = 'apple-select';
    select.innerHTML = `<option value="manual">${translations[currentLang].propTriggerManual}</option>`;
    select.value = node.data.triggerType || 'manual';
    select.onchange = (e) => {
      node.data.triggerType = e.target.value;
      saveCanvasState();
    };
    group.appendChild(select);
    dynamicFields.appendChild(group);
  } 
  
  else if (node.type === 'file-input') {
    // paste text box
    const group = createFormGroup(translations[currentLang].propFileInputText);
    const textarea = document.createElement('textarea');
    textarea.id = 'fileTextContent';
    textarea.className = 'apple-textarea';
    textarea.placeholder = translations[currentLang].propFilePlaceholder;
    textarea.value = node.data.textContent || '';
    textarea.oninput = (e) => {
      node.data.textContent = e.target.value;
      saveCanvasState();
      // Update node DOM preview
      const preview = document.querySelector(`.node[data-id="${node.id}"] .node-preview-text`);
      if (preview) preview.textContent = e.target.value.substring(0, 30) + (e.target.value.length > 30 ? '...' : '');
    };
    group.appendChild(textarea);
    dynamicFields.appendChild(group);
  } 
  
  else if (node.type === 'prompt-template') {
    const group = createFormGroup(translations[currentLang].propPromptTemplate);
    const textarea = document.createElement('textarea');
    textarea.id = 'promptTemplateContent';
    textarea.className = 'apple-textarea';
    textarea.placeholder = translations[currentLang].propPromptPlaceholder;
    textarea.value = node.data.template || '';
    textarea.oninput = (e) => {
      node.data.template = e.target.value;
      saveCanvasState();
      const preview = document.querySelector(`.node[data-id="${node.id}"] .node-preview-text`);
      if (preview) preview.textContent = e.target.value.substring(0, 30) + (e.target.value.length > 30 ? '...' : '');
    };
    group.appendChild(textarea);
    dynamicFields.appendChild(group);
  } 
  
  else if (node.type === 'llm-model') {
    // System Prompt
    const groupSys = createFormGroup(translations[currentLang].propModelSystem);
    const textSys = document.createElement('textarea');
    textSys.className = 'apple-textarea';
    textSys.value = node.data.systemPrompt || '';
    textSys.style.height = '60px';
    textSys.oninput = (e) => {
      node.data.systemPrompt = e.target.value;
      saveCanvasState();
    };
    groupSys.appendChild(textSys);
    dynamicFields.appendChild(groupSys);

    // Temperature Slider
    const groupTemp = createFormGroup(`${translations[currentLang].propModelTemp}: <span id="tempVal">${node.data.temperature || 0.7}</span>`);
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '1';
    slider.step = '0.1';
    slider.value = node.data.temperature || 0.7;
    slider.style.width = '100%';
    slider.oninput = (e) => {
      node.data.temperature = parseFloat(e.target.value);
      document.getElementById('tempVal').textContent = e.target.value;
      saveCanvasState();
    };
    groupTemp.appendChild(slider);
    dynamicFields.appendChild(groupTemp);
  } 
  
  else if (node.type === 'output-formatter') {
    const group = createFormGroup(translations[currentLang].propOutputType);
    const select = document.createElement('select');
    select.className = 'apple-select';
    select.innerHTML = `
      <option value="markdown">${translations[currentLang].propOutputMarkdown}</option>
      <option value="raw">${translations[currentLang].propOutputRaw}</option>
    `;
    select.value = node.data.outputType || 'markdown';
    select.onchange = (e) => {
      node.data.outputType = e.target.value;
      saveCanvasState();
    };
    group.appendChild(select);
    dynamicFields.appendChild(group);
  }
}

function createFormGroup(labelText) {
  const group = document.createElement('div');
  group.className = 'form-group';
  const label = document.createElement('label');
  label.innerHTML = labelText;
  group.appendChild(label);
  return group;
}

// Rendering HTML elements on canvas
function renderNodes() {
  nodesLayer.innerHTML = '';
  
  if (state.nodes.length > 0) {
    canvasInstructions.style.display = 'none';
  } else {
    canvasInstructions.style.display = 'block';
  }

  state.nodes.forEach(node => {
    const nodeEl = document.createElement('div');
    nodeEl.className = 'node';
    if (state.selectedNodeId === node.id) nodeEl.classList.add('selected');
    nodeEl.style.left = node.x + 'px';
    nodeEl.style.top = node.y + 'px';
    nodeEl.setAttribute('data-id', node.id);

    // Custom Header SVG Icons
    let headerIcon = '';
    switch (node.type) {
      case 'trigger':
        headerIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="10 8 16 12 10 16 10 8"/></svg>`;
        break;
      case 'file-input':
        headerIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
        break;
      case 'prompt-template':
        headerIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 13a4 4 0 0 1-8 0"/></svg>`;
        break;
      case 'llm-model':
        headerIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/></svg>`;
        break;
      case 'output-formatter':
        headerIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg>`;
        break;
    }

    let nodeBodyHtml = '';
    if (node.type === 'file-input') {
      const text = node.data.textContent || '';
      nodeBodyHtml = `<div class="node-preview-text">${text.substring(0, 30)}${text.length > 30 ? '...' : ''}</div>`;
    } else if (node.type === 'prompt-template') {
      const text = node.data.template || '';
      nodeBodyHtml = `<div class="node-preview-text">${text.substring(0, 30)}${text.length > 30 ? '...' : ''}</div>`;
    } else if (node.type === 'llm-model') {
      nodeBodyHtml = `<div style="font-size:10px;">Temp: ${node.data.temperature || 0.7}</div>`;
    } else {
      nodeBodyHtml = `<div style="font-size:10px;text-transform:capitalize;">${node.type}</div>`;
    }

    nodeEl.innerHTML = `
      <div class="node-header node-header-${node.type}">
        ${headerIcon}
        <span class="node-label">${node.title}</span>
        <button class="node-delete" onclick="deleteNode('${node.id}', event)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="node-body">${nodeBodyHtml}</div>
    `;

    // Connect pins based on Node Type
    if (node.type !== 'trigger') {
      const pinIn = document.createElement('div');
      pinIn.className = 'pin pin-in';
      nodeEl.appendChild(pinIn);
    }
    if (node.type !== 'output-formatter') {
      const pinOut = document.createElement('div');
      pinOut.className = 'pin pin-out';
      nodeEl.appendChild(pinOut);
    }

    // Set pin connectivity indicators
    updatePinStates(nodeEl, node.id);

    // Node Drag Handler (vanilla mouse tracking)
    setupNodeDragging(nodeEl, node);

    nodeEl.addEventListener('click', (e) => {
      e.stopPropagation();
      selectNode(node.id);
    });

    nodesLayer.appendChild(nodeEl);
  });
}

function updatePinStates(nodeEl, nodeId) {
  const hasIncoming = state.connections.some(c => c.toNodeId === nodeId);
  const hasOutgoing = state.connections.some(c => c.fromNodeId === nodeId);
  
  const pinIn = nodeEl.querySelector('.pin-in');
  if (pinIn && hasIncoming) pinIn.classList.add('connected');
  
  const pinOut = nodeEl.querySelector('.pin-out');
  if (pinOut && hasOutgoing) pinOut.classList.add('connected');
}

function setupNodeDragging(nodeEl, node) {
  const header = nodeEl.querySelector('.node-header');
  let startX = 0, startY = 0;
  
  header.addEventListener('mousedown', dragStart);
  header.addEventListener('touchstart', dragStart, { passive: false });
  
  function dragStart(e) {
    if (e.target.closest('.node-delete')) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    startX = clientX - node.x;
    startY = clientY - node.y;
    
    if (e.touches) {
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
      e.preventDefault(); // Stop default scroll/pan gesture
    } else {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    }
    
    selectNode(node.id);
    e.stopPropagation();
  }
  
  function onMouseMove(e) {
    moveAt(e.clientX, e.clientY);
  }
  
  function onTouchMove(e) {
    moveAt(e.touches[0].clientX, e.touches[0].clientY);
    e.preventDefault(); // prevent scroll
  }
  
  function moveAt(clientX, clientY) {
    let nx = clientX - startX;
    let ny = clientY - startY;
    
    // Bounds control within virtual canvas
    if (nx < 0) nx = 0;
    if (ny < 0) ny = 0;
    if (nx > 5000) nx = 5000;
    if (ny > 5000) ny = 5000;
    
    node.x = nx;
    node.y = ny;
    nodeEl.style.left = nx + 'px';
    nodeEl.style.top = ny + 'px';
    
    // Refresh connections dynamically
    renderConnections();
  }
  
  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    saveCanvasState();
  }
  
  function onTouchEnd() {
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
    saveCanvasState();
  }
}

function renderConnections() {
  connectionsLayer.innerHTML = '';
  
  state.connections.forEach(conn => {
    const fromEl = document.querySelector(`.node[data-id="${conn.fromNodeId}"]`);
    const toEl = document.querySelector(`.node[data-id="${conn.toNodeId}"]`);
    if (!fromEl || !toEl) return;

    const rect = document.getElementById('canvasContent').getBoundingClientRect();
    const pinOut = fromEl.querySelector('.pin-out');
    const pinIn = toEl.querySelector('.pin-in');
    if (!pinOut || !pinIn) return;

    const rectOut = pinOut.getBoundingClientRect();
    const rectIn = pinIn.getBoundingClientRect();

    const x1 = rectOut.left + rectOut.width / 2 - rect.left;
    const y1 = rectOut.top + rectOut.height / 2 - rect.top;
    const x2 = rectIn.left + rectIn.width / 2 - rect.left;
    const y2 = rectIn.top + rectIn.height / 2 - rect.top;

    // Curved Bezier calculation
    const dx = Math.abs(x2 - x1) * 0.55;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'cable active');
    path.setAttribute('d', `M ${x1},${y1} C ${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`);
    
    connectionsLayer.appendChild(path);
  });
}

// Local Storage Cache
function saveCanvasState() {
  localStorage.setItem('workflow_canvas_state', JSON.stringify({
    nodes: state.nodes,
    connections: state.connections,
    panX: state.panX,
    panY: state.panY
  }));
}

function loadCanvasState() {
  try {
    const saved = JSON.parse(localStorage.getItem('workflow_canvas_state'));
    if (saved) {
      state.nodes = saved.nodes || [];
      state.connections = saved.connections || [];
      state.panX = saved.panX || 0;
      state.panY = saved.panY || 0;
      updateCanvasTransform();
      renderNodes();
      renderConnections();
    }
  } catch (e) {
    console.error('Failed to load canvas state', e);
  }
}

// Custom simple Toast system
function showToast(message) {
  // Let parent handle it if integrated, or fallback to native alert/console
  const parentToast = window.parent.document.getElementById('toast');
  const parentText = window.parent.document.getElementById('toastText');
  if (parentToast && parentText) {
    parentText.textContent = message;
    parentToast.classList.add('active');
    setTimeout(() => {
      parentToast.classList.remove('active');
    }, 3000);
  } else {
    // Local tool console/toast fallback
    console.log('[Toast]', message);
  }
}

// Execution Logic (The prompt pipeline execution)
async function runWorkflow() {
  switchTab('tabConsole');
  consoleLogs.innerHTML = '';
  outputPreviewBox.style.display = 'none';
  
  addLog(translations[currentLang].logStart, 'info');

  // Find start trigger nodes
  const triggers = state.nodes.filter(n => n.type === 'trigger');
  if (triggers.length === 0) {
    addLog(currentLang === 'id' ? 'Kesalahan: Tidak ada node Pemicu (Trigger) di kanvas.' : 'Error: No Trigger node on the canvas.', 'error');
    return;
  }

  // Visual pulses clear
  document.querySelectorAll('.node').forEach(n => n.classList.remove('running'));

  // Simple sequencing traversal
  try {
    let currentNode = triggers[0];
    let pipelineData = ''; // Carries the output data down the chain

    while (currentNode) {
      const nodeEl = document.querySelector(`.node[data-id="${currentNode.id}"]`);
      if (nodeEl) nodeEl.classList.add('running');

      // Processing node output
      pipelineData = await processNode(currentNode, pipelineData);
      
      if (nodeEl) nodeEl.classList.remove('running');

      // Find next node connected to this node's output
      const conn = state.connections.find(c => c.fromNodeId === currentNode.id);
      if (conn) {
        currentNode = state.nodes.find(n => n.id === conn.toNodeId);
      } else {
        currentNode = null;
      }
    }

    addLog(translations[currentLang].logFinished, 'success');
  } catch (err) {
    addLog(translations[currentLang].logModelError.replace('{err}', err.message || err), 'error');
    addLog(translations[currentLang].logErrorInterrupt, 'error');
    document.querySelectorAll('.node').forEach(n => n.classList.remove('running'));
  }
}

function addLog(text, type = 'info') {
  const placeholder = consoleLogs.querySelector('.console-placeholder');
  if (placeholder) placeholder.remove();

  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  
  const timestamp = new Date().toLocaleTimeString();
  entry.textContent = `[${timestamp}] ${text}`;
  
  consoleLogs.appendChild(entry);
  consoleLogs.scrollTop = consoleLogs.scrollHeight;
}

// Process individual node operation
async function processNode(node, inputContext) {
  switch (node.type) {
    
    case 'trigger':
      addLog(translations[currentLang].logTriggered, 'success');
      return 'trigger_pulse';

    case 'file-input':
      const fileText = node.data.textContent || '';
      addLog(translations[currentLang].logFileParsed.replace('{len}', fileText.length), 'info');
      return fileText;

    case 'prompt-template':
      const template = node.data.template || '{{input}}';
      // Replace input placeholders
      let resolvedPrompt = template.replace(/\{\{input\}\}/g, inputContext);
      addLog(translations[currentLang].logPromptBuilt, 'info');
      return resolvedPrompt;

    case 'llm-model':
      const systemPrompt = node.data.systemPrompt || '';
      const temperature = node.data.temperature || 0.7;
      const provider = document.getElementById('modelProvider').value;
      
      addLog(translations[currentLang].logModelCalling.replace('{model}', provider.toUpperCase()), 'info');
      
      const response = await callAIModel(provider, systemPrompt, inputContext, temperature);
      addLog(translations[currentLang].logModelSuccess, 'success');
      return response;

    case 'output-formatter':
      const format = node.data.outputType || 'markdown';
      
      // Setup preview
      outputPreviewBox.style.display = 'flex';
      
      if (format === 'markdown') {
        // Safe minimal render fallback for marked
        mdPreview.innerHTML = parseMarkdown(inputContext);
      } else {
        // Plain text raw
        mdPreview.innerHTML = `<pre style="white-space:pre-wrap;">${escapeHtml(inputContext)}</pre>`;
      }
      
      // Store in memory for copy/download buttons
      window.__lastWorkflowResult = inputContext;
      
      addLog(translations[currentLang].logOutputDone, 'success');
      
      // Wire copy and download buttons
      document.getElementById('btnCopyResult').onclick = () => {
        navigator.clipboard.writeText(inputContext);
        showToast(translations[currentLang].toastCopySuccess);
      };
      
      document.getElementById('btnDownloadResult').onclick = () => {
        const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(inputContext);
        const dl = document.createElement('a');
        dl.setAttribute('href', dataStr);
        dl.setAttribute('download', format === 'markdown' ? 'ai-output.md' : 'ai-output.txt');
        dl.click();
      };
      
      return inputContext;
  }
}

// Call configured model endpoints
async function callAIModel(provider, systemPrompt, promptContent, temperature) {
  if (provider === 'mock') {
    // Simulated delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Custom mock content response depending on input
    return `### AI Workflow Summary (Simulation Mode)

Berikut adalah hasil ringkasan teks otomatis yang di-generate menggunakan model simulasi:

- **Instruksi Sistem:** "${systemPrompt}"
- **Temperatur Parameter:** \`${temperature}\`
- **Panjang Prompt Masuk:** ${promptContent.length} karakter

#### Analisis Model
Teks yang dimasukkan berisi sekumpulan data input. Model mensimulasikan pemrosesan ini 100% lokal.

> **Catatan:** Untuk mengaktifkan integrasi penuh dengan kecerdasan nyata, silakan buka tab **Pengaturan API** di panel samping sebelah kanan dan hubungkan ke endpoint **Ollama** atau masukkan kunci **OpenAI API** Anda.`;
  }
  
  if (provider === 'ollama') {
    const endpoint = document.getElementById('ollamaUrl').value.trim();
    const model = document.getElementById('ollamaModel').value.trim();
    
    try {
      const res = await fetch(`${endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: promptContent }
          ],
          options: { temperature: temperature },
          stream: false
        })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }
      
      const data = await res.json();
      return data.message.content;
    } catch (e) {
      throw new Error(`Gagal menghubungi Ollama. Pastikan Ollama berjalan di ${endpoint} dengan CORS aktif (OLLAMA_ORIGINS="*" ollama serve). Detail: ${e.message}`);
    }
  }

  if (provider === 'openai') {
    const key = document.getElementById('openaiKey').value.trim();
    const url = document.getElementById('openaiUrl').value.trim();
    const model = document.getElementById('openaiModel').value.trim();

    if (!key) {
      throw new Error('API Key OpenAI tidak boleh kosong. Harap isi di Pengaturan API.');
    }

    try {
      const res = await fetch(`${url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: promptContent }
          ],
          temperature: temperature
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || `HTTP Error ${res.status}`);
      }

      const data = await res.json();
      return data.choices[0].message.content;
    } catch (e) {
      throw new Error(`Koneksi OpenAI Gagal: ${e.message}`);
    }
  }
}

// Helper: Lightweight Markdown Parser
function parseMarkdown(md) {
  if (!md) return '';
  let html = md;
  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');
  // Bold
  html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
  // Inline code
  html = html.replace(/\`(.*)\`/gim, '<code>$1</code>');
  // Lists
  html = html.replace(/\-\s(.*$)/gim, '<li>$1</li>');
  // Paragraphs
  html = html.replace(/\n(.*)/g/gim, '<p>$1</p>');
  return html;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
