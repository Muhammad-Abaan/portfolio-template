import { Github, Linkedin, Twitter } from "lucide-react";
import { useLocation } from "react-router-dom";

const Footer = () => {
  const location = useLocation();
  if (location.pathname === '/') return null;

  return (
    <footer className="border-t mt-16">
      <div className="container py-10 grid gap-6 md:grid-cols-3 items-center">
        <div className="text-sm text-muted-foreground">© 2025 Your Portfolio</div>
        <div className="text-center text-sm">Learning • Building • Sharing</div>
        <div className="flex items-center justify-end gap-4">
          <a href="#" target="_blank" rel="noreferrer" aria-label="GitHub" className="hover:text-primary transition-colors"><Github className="w-5 h-5" /></a>
          <a href="#" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-primary transition-colors"><Linkedin className="w-5 h-5" /></a>
          <a href="https://twitter.com/" target="_blank" rel="noreferrer" aria-label="Twitter" className="hover:text-primary transition-colors"><Twitter className="w-5 h-5" /></a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
