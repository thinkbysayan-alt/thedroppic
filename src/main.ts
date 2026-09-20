import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './styles/variables.css';
import './styles/global.css';
import './styles/components.css';
import './styles/responsive.css';
import { mountApp } from './app/app';
import { hideBootLoader } from './app/boot-loader';

const root = document.getElementById('app');
if (root) {
  mountApp(root);
  hideBootLoader();
} else {
  // Should be unreachable: index.html always provides #app. Fail loudly in dev rather than silently no-op.
  console.error('thedroppic: #app mount point not found.');
}
