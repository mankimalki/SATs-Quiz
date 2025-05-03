// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful');
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}

// Install Prompt Handling
let deferredPrompt;
const installButton = document.createElement('button');
installButton.textContent = 'Install App';
installButton.style.position = 'fixed';
installButton.style.bottom = '20px';
installButton.style.right = '20px';
installButton.style.zIndex = '1000';
installButton.style.padding = '10px 20px';
installButton.style.backgroundColor = '#2c3e50';
installButton.style.color = 'white';
installButton.style.border = 'none';
installButton.style.borderRadius = '5px';
installButton.style.cursor = 'pointer';
installButton.style.display = 'none';

document.body.appendChild(installButton);

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show the install button
  installButton.style.display = 'block';
  
  installButton.addEventListener('click', () => {
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      deferredPrompt = null;
      installButton.style.display = 'none';
    });
  });
});

// Detect if the app is running as a PWA
function isRunningAsPWA() {
  return (window.matchMedia('(display-mode: standalone)').matches) || 
         (window.navigator.standalone) || 
         document.referrer.includes('android-app://');
}

// Check for updates when the app comes online
window.addEventListener('online', () => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'UPDATE_CHECK' });
  }
});

// Send periodic background sync requests
function registerPeriodicSync() {
  if ('periodicSync' in window.registration) {
    try {
      window.registration.periodicSync.register('update-resources', {
        minInterval: 24 * 60 * 60 * 1000 // 1 day
      }).then(() => {
        console.log('Periodic sync registered');
      });
    } catch (error) {
      console.log('Periodic sync could not be registered', error);
    }
  }
}

// Initialize periodic sync when appropriate
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  navigator.serviceWorker.ready.then(registration => {
    registerPeriodicSync();
  });
}

// File Handling (for PDFs)
if ('launchQueue' in window) {
  window.launchQueue.setConsumer(async (launchParams) => {
    const files = launchParams.files;
    if (files.length > 0) {
      // Handle the file (e.g., open PDF viewer)
      const fileHandle = files[0];
      const file = await fileHandle.getFile();
      console.log('Opening file:', file.name);
      // Implement your file opening logic here
    }
  });
}

// Badge API for notifications
if ('setAppBadge' in navigator) {
  // Example: Set badge count when new resources are available
  function updateBadge(count) {
    navigator.setAppBadge(count).catch(error => {
      console.error('Could not set badge:', error);
    });
  }
}

// Share Target API
if ('serviceWorker' in navigator && 'share' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'SHARE_TARGET') {
      const sharedData = event.data;
      console.log('Shared data:', sharedData);
      // Handle the shared content (e.g., save shared PDF)
    }
  });
}

// Custom Install Button for Desktop
function showCustomInstallPrompt() {
  if (!isRunningAsPWA() && deferredPrompt) {
    const installDialog = document.createElement('div');
    installDialog.style.position = 'fixed';
    installDialog.style.bottom = '20px';
    installDialog.style.right = '20px';
    installDialog.style.backgroundColor = 'white';
    installDialog.style.padding = '20px';
    installDialog.style.borderRadius = '8px';
    installDialog.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    installDialog.style.zIndex = '1000';
    installDialog.style.maxWidth = '300px';
    
    installDialog.innerHTML = `
      <h3 style="margin-bottom: 10px;">Install EduResources App</h3>
      <p style="margin-bottom: 15px;">Get faster access and work offline by installing our app.</p>
      <div style="display: flex; gap: 10px;">
        <button id="installConfirm" style="flex: 1; padding: 8px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Install</button>
        <button id="installCancel" style="flex: 1; padding: 8px; background-color: #e0e0e0; border: none; border-radius: 4px; cursor: pointer;">Not Now</button>
      </div>
    `;
    
    document.body.appendChild(installDialog);
    
    document.getElementById('installConfirm').addEventListener('click', () => {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(choiceResult => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted install');
        }
        installDialog.remove();
      });
    });
    
    document.getElementById('installCancel').addEventListener('click', () => {
      installDialog.remove();
    });
  }
}

// Show install prompt after some user interaction
setTimeout(() => {
  showCustomInstallPrompt();
}, 30000); // Show after 30 seconds