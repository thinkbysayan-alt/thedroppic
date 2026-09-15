import './styles/variables.css';
import './styles/global.css';
import './styles/components.css';
import './styles/responsive.css';
import { mountApp } from './app/app';
import { initPatternParallax } from './app/pattern-parallax';

const root = document.getElementById('app');
if (root) {
  mountApp(root);
  initPatternParallax();
} else {
  // Should be unreachable — index.html always provides #app — but fail loudly in dev rather than silently no-op.
  console.error('thedroppic: #app mount point not found.');
}
