import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SHOW_ADS_PAGES = [
  '/vtu',
  '/referrals',
  '/history',
];

const AdLoader = () => {
  const location = useLocation();

  useEffect(() => {
    const shouldShowAds = SHOW_ADS_PAGES.some(page =>
      location.pathname.startsWith(page)
    );

    if (!shouldShowAds) {
      // Remove ad scripts on pages that shouldn't have ads
      const s1 = document.querySelector('script[data-zone="10865350"]');
      const s2 = document.querySelector('script[data-zone="10864527"]');
      if (s1) s1.remove();
      if (s2) s2.remove();
      return;
    }

    // Load ads only on allowed pages
    if (!document.querySelector('script[data-zone="10865350"]')) {
      const script1 = document.createElement('script');
      script1.dataset.zone = '10865350';
      script1.src = 'https://n6wxm.com/vignette.min.js';
      document.head.appendChild(script1);
    }

    if (!document.querySelector('script[data-zone="10864527"]')) {
      const script2 = document.createElement('script');
      script2.dataset.zone = '10864527';
      script2.src = 'https://al5sm.com/tag.min.js';
      document.head.appendChild(script2);
    }
  }, [location.pathname]);

  return null;
};

export default AdLoader;