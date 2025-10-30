// Clear Service Worker script - run this in browser console if needed
// This script helps clear problematic service workers

if ('serviceWorker' in navigator) {
  // Unregister all service workers
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      console.log('Unregistering service worker:', registration);
      registration.unregister();
    }
  });

  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(function(names) {
      for (let name of names) {
        console.log('Deleting cache:', name);
        caches.delete(name);
      }
    });
  }
  
  console.log('Service workers and caches cleared. Please refresh the page.');
}
