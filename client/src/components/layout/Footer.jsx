import React from 'react';
import { ExternalLink } from 'lucide-react';

const Footer = () => (
  <footer className="border-t border-surface-variant/20 bg-surface-container-lowest/80 backdrop-blur px-4 py-5 text-body-sm font-body-sm text-outline sm:px-6">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p>AI Buddy · Institutional Learning Support</p>
      <a className="inline-flex items-center gap-1 hover:text-primary transition-colors" href="mailto:it-support@institution.edu">
        Contact IT <ExternalLink size={13} />
      </a>
    </div>
  </footer>
);

export default Footer;