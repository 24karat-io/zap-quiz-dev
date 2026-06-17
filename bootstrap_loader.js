(function () {
  var MAX_REDIRECTS = 5;
  var REDIRECT_KEY = 'bootstrap_loader_redirects';

  function isLocalDev() {
    var host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1';
  }

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function incrementRedirectCount() {
    try {
      var count = parseInt(sessionStorage.getItem(REDIRECT_KEY) || '0', 10);
      count += 1;
      sessionStorage.setItem(REDIRECT_KEY, String(count));
      return count;
    } catch (e) {
      return MAX_REDIRECTS;
    }
  }

  function resetRedirectCount() {
    try {
      sessionStorage.removeItem(REDIRECT_KEY);
    } catch (e) {}
  }

  function loadFlutterBootstrap(version) {
    var script = document.createElement('script');
    script.src = 'flutter_bootstrap.js?v=' + encodeURIComponent(version);
    script.async = true;
    document.body.appendChild(script);
  }

  function redirectWithVersion(buildNumber) {
    var count = incrementRedirectCount();
    if (count > MAX_REDIRECTS) {
      resetRedirectCount();
      loadFlutterBootstrap(buildNumber);
      return;
    }

    var url = new URL(window.location.href);
    url.searchParams.set('v', buildNumber);
    url.searchParams.set('_cb', String(Date.now()));
    window.location.replace(url.toString());
  }

  if (isLocalDev()) {
    loadFlutterBootstrap('dev');
    return;
  }

  fetch('version.json', { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) {
        throw new Error('version.json fetch failed');
      }
      return response.json();
    })
    .then(function (data) {
      var buildNumber = String(data.build_number || '');
      if (!buildNumber) {
        loadFlutterBootstrap('unknown');
        return;
      }

      if (getQueryParam('v') !== buildNumber) {
        redirectWithVersion(buildNumber);
        return;
      }

      resetRedirectCount();
      loadFlutterBootstrap(buildNumber);
    })
    .catch(function () {
      loadFlutterBootstrap('fallback');
    });
})();
