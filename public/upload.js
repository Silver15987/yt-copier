// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const selectedSection = document.getElementById('selectedSection');
const fileList = document.getElementById('fileList');
const fileCount = document.getElementById('fileCount');
const totalSize = document.getElementById('totalSize');
const progressSection = document.getElementById('progressSection');
const progressText = document.getElementById('progressText');
const progressPercent = document.getElementById('progressPercent');
const progressFill = document.getElementById('progressFill');
const currentFile = document.getElementById('currentFile');
const resultsSection = document.getElementById('resultsSection');
const resultIcon = document.getElementById('resultIcon');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const uploadBtn = document.getElementById('uploadBtn');
const clearBtn = document.getElementById('clearBtn');
const uploadMoreBtn = document.getElementById('uploadMoreBtn');

// State
let selectedFiles = [];

// Get token from URL
function getToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get('token') || '';
}

// Format file size
function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// Check if file is a video
function isVideoFile(file) {
  const videoTypes = ['video/mp4', 'video/mkv', 'video/avi', 'video/mov', 
                      'video/wmv', 'video/flv', 'video/webm', 'video/x-matroska',
                      'video/quicktime', 'video/x-msvideo'];
  const videoExts = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
  
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  return videoTypes.includes(file.type) || videoExts.includes(ext);
}

// Handle file selection
function handleFiles(files) {
  const videoFiles = Array.from(files).filter(isVideoFile);
  
  if (videoFiles.length === 0) {
    alert('Please select video files only.');
    return;
  }
  
  selectedFiles = videoFiles;
  renderFileList();
  showSelectedSection();
}

// Render file list
function renderFileList() {
  fileList.innerHTML = '';
  let total = 0;
  
  selectedFiles.forEach((file, index) => {
    total += file.size;
    
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
      <span class="file-icon">🎬</span>
      <div class="file-info">
        <div class="file-name">${file.name}</div>
        <div class="file-size">${formatSize(file.size)}</div>
      </div>
      <span class="file-status" id="status-${index}">⏳</span>
    `;
    fileList.appendChild(item);
  });
  
  fileCount.textContent = `${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`;
  totalSize.textContent = `Total: ${formatSize(total)}`;
  uploadBtn.disabled = selectedFiles.length === 0;
}

// Show selected section
function showSelectedSection() {
  selectedSection.style.display = 'block';
  clearBtn.style.display = 'block';
  progressSection.style.display = 'none';
  resultsSection.style.display = 'none';
  dropZone.style.display = 'block';
}

// Upload files
async function uploadFiles() {
  if (selectedFiles.length === 0) return;
  
  // Show progress
  dropZone.style.display = 'none';
  selectedSection.style.display = 'none';
  progressSection.style.display = 'block';
  uploadBtn.disabled = true;
  clearBtn.style.display = 'none';
  
  const formData = new FormData();
  selectedFiles.forEach(file => {
    formData.append('files', file);
  });
  
  try {
    const token = getToken();
    const url = `/upload${token ? `?token=${token}` : ''}`;
    
    // Create XMLHttpRequest for progress tracking
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        progressFill.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;
        progressText.textContent = 'Uploading...';
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const result = JSON.parse(xhr.responseText);
        showResults(true, result);
      } else if (xhr.status === 401) {
        showResults(false, { error: 'Session expired. Please scan the QR code again.' });
      } else {
        showResults(false, { error: 'Upload failed. Please try again.' });
      }
    });
    
    xhr.addEventListener('error', () => {
      showResults(false, { error: 'Network error. Make sure you\'re connected to the same Wi-Fi.' });
    });
    
    xhr.open('POST', url);
    xhr.send(formData);
    
  } catch (error) {
    showResults(false, { error: error.message });
  }
}

// Show results
function showResults(success, result) {
  progressSection.style.display = 'none';
  resultsSection.style.display = 'block';
  
  if (success) {
    resultIcon.textContent = '✅';
    resultTitle.textContent = 'Upload Complete!';
    const uploaded = result.uploaded?.length || 0;
    const failed = result.failed?.length || 0;
    resultMessage.textContent = `${uploaded} video${uploaded !== 1 ? 's' : ''} uploaded successfully.${failed > 0 ? ` ${failed} failed.` : ''}`;
  } else {
    resultIcon.textContent = '❌';
    resultTitle.textContent = 'Upload Failed';
    resultMessage.textContent = result.error || 'An error occurred.';
  }
}

// Reset to initial state
function resetState() {
  selectedFiles = [];
  fileList.innerHTML = '';
  uploadBtn.disabled = true;
  progressFill.style.width = '0%';
  progressPercent.textContent = '0%';
  dropZone.style.display = 'block';
  selectedSection.style.display = 'none';
  progressSection.style.display = 'none';
  resultsSection.style.display = 'none';
  clearBtn.style.display = 'none';
}

// Event Listeners
dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
});

// Drag and drop
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  handleFiles(e.dataTransfer.files);
});

uploadBtn.addEventListener('click', uploadFiles);
clearBtn.addEventListener('click', resetState);
uploadMoreBtn.addEventListener('click', resetState);

// Prevent default drag behaviors on document
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());
