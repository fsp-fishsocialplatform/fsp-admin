import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import 'antd/dist/reset.css';
import App from './App';

// HashRouter (not BrowserRouter): GitHub Pages is static hosting with no SPA
// fallback, so a hard refresh or deep link to /posts would 404. Hash routing
// keeps the path in the URL fragment (.../#/posts), which the server never
// sees, so every route resolves to index.html without any rewrite config.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
