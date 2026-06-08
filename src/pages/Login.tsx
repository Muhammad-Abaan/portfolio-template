import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import SEO from "@/components/site/SEO";

const Login = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Dummy bypass check
    if (password === "admin123") {
      localStorage.setItem("dummy_auth_token", "admin-bypass");
      window.location.href = "/dashboard";
    } else {
      alert("Incorrect password. Hint: try 'admin123'");
    }
    
    setLoading(false);
  };

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <SEO title="Admin Login | Your Portfolio" description="Secure admin login." />
      <div className="w-full max-w-md p-8 border rounded-lg bg-card/50 backdrop-blur-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </motion.main>
  );
};

export default Login;
