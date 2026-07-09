/* ============================================
   CAMERA — Camera Module
   Handles getUserMedia, countdown, and capture
   ============================================ */

const Camera = (() => {
  let stream = null;
  let videoEl = null;
  let currentFacingMode = 'user';
  let mode = 'single'; // 'single' or 'filmstrip'
  let isCapturing = false;
  
  const filmstripCount = 4;

  async function init(videoElement) {
    videoEl = videoElement;
    await startCamera();
  }

  async function startCamera() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: currentFacingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      videoEl.srcObject = stream;
      videoEl.style.transform = currentFacingMode === 'user' ? 'scaleX(-1)' : 'none';
      
      // Attempt to wait for video to play to ensure dimensions are ready
      await new Promise(res => {
        videoEl.onloadedmetadata = () => {
          videoEl.play();
          res();
        };
      });
      
    } catch (err) {
      console.error('Camera access error:', err);
      Utils.showToast('Gagal mengakses kamera. Pastikan izin diberikan.', 'error');
    }
  }

  function stop() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
  }

  function switchCamera() {
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    startCamera();
  }

  function setMode(newMode) {
    if (newMode === 'single' || newMode === 'filmstrip') {
      mode = newMode;
      const prog = document.getElementById('filmstrip-progress');
      if (prog) prog.style.display = mode === 'filmstrip' ? 'flex' : 'none';
      initProgress();
    }
  }

  function initProgress() {
    const prog = document.getElementById('filmstrip-progress');
    if (!prog) return;
    if (mode === 'single') {
      prog.innerHTML = '';
      return;
    }
    let html = '';
    for(let i = 0; i < filmstripCount; i++) {
      html += `<div class="filmstrip-dot" id="fs-dot-${i}"></div>`;
    }
    prog.innerHTML = html;
  }

  function updateProgress(index, state) {
    const dot = document.getElementById(`fs-dot-${index}`);
    if (dot) {
      dot.className = 'filmstrip-dot ' + state; // state: 'current', 'captured', ''
    }
  }

  async function startCountdown(seconds) {
    const overlay = document.getElementById('countdown-overlay');
    const number = document.getElementById('countdown-number');
    
    return new Promise(resolve => {
      overlay.classList.add('active');
      let count = seconds;
      
      number.textContent = count;
      // Re-trigger animation
      number.style.animation = 'none';
      void number.offsetWidth;
      number.style.animation = null;

      const timer = setInterval(() => {
        count--;
        if (count > 0) {
          number.textContent = count;
          number.style.animation = 'none';
          void number.offsetWidth;
          number.style.animation = null;
        } else {
          clearInterval(timer);
          overlay.classList.remove('active');
          resolve();
        }
      }, 1000);
    });
  }

  function triggerFlash() {
    const flash = document.getElementById('flash-overlay');
    flash.classList.remove('flash');
    void flash.offsetWidth;
    flash.classList.add('flash');
  }

  function captureFrame() {
    if (!videoEl || !stream) return null;
    
    const canvas = document.createElement('canvas');
    const vw = videoEl.videoWidth;
    const vh = videoEl.videoHeight;
    canvas.width = vw;
    canvas.height = vh;
    
    const ctx = canvas.getContext('2d');
    
    if (currentFacingMode === 'user') {
      ctx.translate(vw, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoEl, 0, 0, vw, vh);
    
    return canvas.toDataURL('image/png', 0.92);
  }

  // Allow optional callbacks to hook into the capture flow
  async function capture(onComplete, onNextFrame) {
    if (isCapturing) return;
    isCapturing = true;

    if (mode === 'single') {
      if (onNextFrame) onNextFrame(0);
      await startCountdown(3);
      triggerFlash();
      const photo = captureFrame();
      isCapturing = false;
      onComplete({ mode: 'single', photos: [photo] });
      
    } else if (mode === 'filmstrip') {
      const filmstripPhotos = [];
      initProgress();
      
      for (let i = 0; i < filmstripCount; i++) {
        updateProgress(i, 'current');
        if (onNextFrame) onNextFrame(i, null); // Notify UI to move camera frame
        
        await startCountdown(3);
        triggerFlash();
        const photo = captureFrame();
        
        if (photo) filmstripPhotos.push(photo);
        updateProgress(i, 'captured');
        if (onNextFrame) onNextFrame(i, photo); // Notify UI to display captured photo
        
        // Short pause between shots
        if (i < filmstripCount - 1) {
          await new Promise(r => setTimeout(r, 600));
        }
      }
      
      isCapturing = false;
      onComplete({ mode: 'filmstrip', photos: filmstripPhotos });
    }
  }

  return { init, stop, switchCamera, setMode, getMode: () => mode, capture, startCountdown, triggerFlash, captureFrame };
})();
