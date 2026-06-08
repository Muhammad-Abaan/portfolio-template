import MobileContact from './MobileContact';
import { useIsMobile } from '@/hooks/use-mobile';
import SEO from "@/components/site/SEO";
import { socials } from "@/data/socials";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, Mail, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const QUICK_CONNECT_TEMPLATES = [
  {
    label: "Collaboration",
    subject: "Potential Collaboration Inquiry",
    message: "Hi [Your Name],\n\nI really like your work and was wondering if you'd be open to discussing a potential collaboration on a project. Let me know if you're available for a quick chat!\n\nBest,\n[Your Name]"
  },
  {
    label: "General Inquiry",
    subject: "Question about your work",
    message: "Hi [Your Name],\n\nI came across your portfolio and wanted to ask a quick question regarding...\n\nThanks,\n[Your Name]"
  },
  {
    label: "Just Saying Hi",
    subject: "Hello from a fellow developer!",
    message: "Hi [Your Name],\n\nJust wanted to drop a quick note to say hello and that I really enjoy your content and projects!\n\nCheers,\n[Your Name]"
  },
  {
    label: "Report Bug/Issue",
    subject: "Bug Report / Issue found",
    message: "Hi [Your Name],\n\nI was browsing your site/project and noticed a bug or issue I'd like to report:\n\n[Describe the bug/issue here]\n\nThanks,\n[Your Name]"
  }
];

const EMAIL_ADDRESS = "your.email@example.com";

const DesktopContact = () => {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = async () => {
    await navigator.clipboard.writeText(EMAIL_ADDRESS);
    setCopiedEmail(true);
    toast.success("Email copied to clipboard!");
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleTemplateClick = (template: typeof QUICK_CONNECT_TEMPLATES[0]) => {
    setFormData(prev => ({
      ...prev,
      subject: template.subject,
      message: template.message
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: "YOUR_WEB3FORMS_ACCESS_KEY",
          name: formData.name,
          email: formData.email,
          subject: formData.subject || "New Contact Message",
          message: formData.message,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Failed to send message");
      
      toast.success("Message sent successfully! I'll get back to you soon.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to send message. Please try again or email me directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container py-12 md:py-24 animate-fade-in relative min-h-screen">
      <SEO title="Socials & Contact | Your Portfolio" description="Connect with me via email or social media." />
      
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 md:mb-20 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent pb-2">Connect With Me</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-16 lg:gap-24">
          
          {/* Left Column: Social Directory & Copy Email */}
          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Direct Mail
              </h2>
              <div className="glass-card p-6 rounded-2xl border-white/10 flex flex-col items-start gap-4 bg-background/50">
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-mono font-medium text-foreground text-sm md:text-base break-all">
                  {EMAIL_ADDRESS}
                </div>
                <div className="flex items-center gap-3 w-full mt-2">
                  <a 
                    href={`mailto:${EMAIL_ADDRESS}`}
                    className="flex-1 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-lg font-medium text-center text-sm"
                  >
                    Send Email
                  </a>
                  <button 
                    onClick={handleCopyEmail}
                    className="px-4 py-2 glass hover:bg-white/5 transition-colors rounded-lg flex items-center justify-center border border-white/10"
                    title="Copy to clipboard"
                  >
                    {copiedEmail ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-6">Profiles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {socials.map(({ name, url, Icon }) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-4 p-4 rounded-xl glass-card hover:bg-white/5 border border-white/10 transition-all overflow-hidden relative"
                  >
                    <div className="bg-primary/10 p-3 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold">{name}</span>
                      <span className="text-xs text-muted-foreground truncate opacity-70 group-hover:opacity-100 transition-opacity">
                        {url.replace(/^https?:\/\/(www\.)?/, "")}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Interactive Form */}
          <section className="bg-background/40 border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-md">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Send a Message</h2>
              <p className="text-sm text-muted-foreground">Skip the email client and reach out directly from here.</p>
            </div>

            <div className="mb-8">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick-Connect Templates</div>
              <div className="flex flex-wrap gap-2">
                {QUICK_CONNECT_TEMPLATES.map(template => (
                  <button
                    key={template.label}
                    onClick={() => handleTemplateClick(template)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Name <span className="text-destructive">*</span></label>
                  <Input 
                    id="name"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="glass bg-background/50 border-white/10 focus-visible:ring-primary/50 h-11" 
                    placeholder="Jane Doe" 
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email <span className="text-destructive">*</span></label>
                  <Input 
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="glass bg-background/50 border-white/10 focus-visible:ring-primary/50 h-11" 
                    placeholder="jane@example.com" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                <Input 
                  id="subject"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className="glass bg-background/50 border-white/10 focus-visible:ring-primary/50 h-11" 
                  placeholder="What's this about?" 
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">Message <span className="text-destructive">*</span></label>
                <Textarea 
                  id="message"
                  required
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="glass bg-background/50 border-white/10 focus-visible:ring-primary/50 min-h-[160px] resize-y" 
                  placeholder="Hello! I'd like to discuss..." 
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground h-12 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </section>

        </div>
      </div>
    </main>
  );
};

export default function Contact() {
  const isMobileDevice = useIsMobile();
  return isMobileDevice ? <MobileContact /> : <DesktopContact />;
}
