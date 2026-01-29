import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import OptionsApp from './App';
import '@/styles/globals.css';
import './styles/settings.css';

// Mount React app
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <StrictMode>
      <OptionsApp />
    </StrictMode>
  );
}
