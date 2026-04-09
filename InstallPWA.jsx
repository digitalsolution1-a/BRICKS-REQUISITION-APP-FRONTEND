import React, { useEffect, useState } from 'react';

const InstallPWA = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      console.log("Install prompt captured");
      setSupportsPWA(true);
      setPromptInstall(e);
    };

    // Listen for the browser's install prompt
    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const onClick = (evt) => {
    evt.preventDefault();
    if (!promptInstall) return;
    
    // Show the browser's install dialog
    promptInstall.prompt();
    
    // Wait for the user to respond to the prompt
    promptInstall.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA install');
      } else {
        console.log('User dismissed the PWA install');
      }
      setSupportsPWA(false);
    });
  };

  if (!supportsPWA) return null;

  return (
    <div className="install-banner">
      <p>Install BRICKS App for real-time alerts</p>
      <button className="install-button" onClick={onClick}>
        Add to Home Screen
      </button>
    </div>
  );
};

export default InstallPWA;
