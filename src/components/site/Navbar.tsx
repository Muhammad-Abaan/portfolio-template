import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { socials } from "@/data/socials";

import { motion } from "framer-motion";

const navItems = [
  { to: "/projects", label: "Projects" },
  { to: "/stack", label: "Stack" },
  { to: "/research", label: "Research" },
  { to: "/artifacts", label: "Artifacts" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
];

const Navbar = () => {
  return (
    <header className="fixed top-4 z-50 px-4 flex justify-center w-full">
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-full px-2 h-14 flex items-center justify-between w-full max-w-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
      >
        <Link to="/" className="flex items-center gap-2 font-semibold px-4 text-white hover:text-white/80 transition-colors">
          <span aria-hidden className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-white/20 bg-white/10 text-[10px] font-bold">AP</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-white text-black shadow-sm" 
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu" className="text-white hover:bg-white/10 rounded-full mr-1">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] sm:w-80 h-full flex flex-col">
              <SheetHeader>
                <SheetTitle className="text-xl">Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-4">
                <ul className="grid gap-3">
                  {[{ to: "/", label: "Home" }, ...navItems].map((item) => (
                    <li key={item.to}>
                      <SheetClose asChild>
                        <NavLink
                          to={item.to}
                          end
                          className={({ isActive }) =>
                            cn(
                              "block px-3 py-2 rounded-md text-base hover:underline underline-offset-4",
                              isActive && "bg-secondary text-secondary-foreground"
                            )
                          }
                        >
                          {item.label}
                        </NavLink>
                      </SheetClose>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="mt-auto border-t pt-4">
                <div className="flex items-center justify-around">
                  {socials.map((s) => (
                    <a
                      key={s.name}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={s.name}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <s.Icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </motion.nav>
    </header>
  );
};

export default Navbar;
