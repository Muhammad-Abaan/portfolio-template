import { useEffect } from "react";

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
}

export const SEO = ({ title, description, canonical }: SEOProps) => {
  useEffect(() => {
    document.title = title.length > 60 ? `${title.slice(0, 57)}...` : title;

    const ensureMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    if (description) {
      const trimmed = description.length > 160 ? `${description.slice(0,157)}...` : description;
      ensureMeta("description", trimmed);
      ensureMeta("og:description", trimmed);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null;
    if (ogTitle) ogTitle.setAttribute("content", title);

    const linkRel = "canonical";
    let link = document.querySelector(`link[rel="${linkRel}"]`) as HTMLLinkElement | null;
    const url = canonical || window.location.href;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", linkRel);
      document.head.appendChild(link);
    }
    link.setAttribute("href", url);
  }, [title, description, canonical]);

  return null;
};

export default SEO;
