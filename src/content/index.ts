// Inject inpage.js into the page context
(function injectInpage() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('assets/inpage.js');
  script.type = 'text/javascript';
  script.async = false;
  (document.head || document.documentElement).appendChild(script);
  script.onload = () => {
    script.remove();
  };
})();

export {}; 