import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'katex/dist/katex.min.css'
import 'prismjs/themes/prism.min.css'

console.info(
  "%c✨ Template originally designed & developed by Muhammad Abaan K. Pathan",
  "color: #a855f7; font-weight: bold; font-size: 14px; padding: 10px;"
);

createRoot(document.getElementById("root")!).render(<App />);
