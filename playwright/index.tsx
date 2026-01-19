// Apply global styles here if needed
// import '../src/index.css';

import { beforeMount, afterMount } from '@playwright/experimental-ct-react/hooks';

beforeMount(async ({ hooksConfig: _hooksConfig }) => {
  console.log('Before mount');
});

afterMount(async () => {
  console.log('After mount');
});
