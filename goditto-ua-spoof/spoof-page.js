(() => {
  try {
    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
    const PLATFORM = 'Win32';
    const define = (obj, prop, val) => {
      try { Object.defineProperty(obj, prop, { get: () => val, configurable: true }); } catch {}
    };

    define(navigator, 'userAgent', UA);
    define(navigator, 'appVersion', '5.0 (Windows)');
    define(navigator, 'platform', PLATFORM);
    try { define(navigator, 'oscpu', 'Windows NT 10.0; Win64; x64'); } catch {}

    const brands = [
      { brand: 'Chromium', version: '140' },
      { brand: 'Not?A_Brand', version: '24' },
      { brand: 'Google Chrome', version: '140' },
    ];
    const uaData = {
      brands,
      mobile: false,
      platform: 'Windows',
      platformVersion: '10.0.0',
      getHighEntropyValues: async (hints) => {
        const out = {};
        for (const h of hints) {
          if (h === 'platform') out.platform = 'Windows';
          if (h === 'platformVersion') out.platformVersion = '10.0.0';
          if (h === 'uaFullVersion') out.uaFullVersion = '140.0.0.0';
          if (h === 'fullVersionList') out.fullVersionList = brands.map(b => ({ brand: b.brand, version: '140.0.0.0' }));
          if (h === 'architecture') out.architecture = 'x86';
          if (h === 'bitness') out.bitness = '64';
          if (h === 'model') out.model = '';
        }
        return out;
      },
      toJSON() { return this; }
    };
    try {
      if (!('userAgentData' in navigator)) {
        Object.defineProperty(navigator, 'userAgentData', { get: () => uaData, configurable: true });
      } else {
        try { Object.setPrototypeOf(navigator.userAgentData, uaData); } catch {}
      }
    } catch {}

    try { define(window, 'platform', PLATFORM); } catch {}
  } catch {}
})();