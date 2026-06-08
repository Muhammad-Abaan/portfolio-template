import { Github, Linkedin, Twitter, Mail } from "lucide-react";

export const socials = [
  {
    name: "GitHub",
    url: "#",
    Icon: Github,
  },
  {
    name: "LinkedIn",
    url: "#",
    Icon: Linkedin,
  },
  {
    name: "Twitter",
    url: "#",
    Icon: Twitter,
  },
  {
    name: "Email",
    url: "mailto:your.email@example.com",
    Icon: Mail,
  },
] as const;
