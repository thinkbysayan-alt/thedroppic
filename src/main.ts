import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/geist-mono';
import './styles/variables.css';
import './styles/global.css';
import './styles/components.css';
import './styles/site.css';
import { mountApp } from './app/app';
import { initCursor } from './utils/cursor';

const root = document.getElementById('app');
if (root) {
  mountApp(root);
  initCursor();
} else {
  // Should be unreachable: index.html always provides #app. Fail loudly in dev rather than silently no-op.
  console.error('thedroppic: #app mount point not found.');
}
