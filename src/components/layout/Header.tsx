import { Button } from "@/components/ui/button";
import { Menu, GitBranch, LogOut, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <GitBranch className="h-6 w-6 text-primary" />
          CommitTranslator
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/" 
            className={`text-sm hover:text-primary transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            Home
          </Link>
          {user && (
            <>
              <Link 
                to="/dashboard" 
                className={`text-sm hover:text-primary transition-colors ${location.pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}
              >
                Dashboard
              </Link>
              <Link 
                to="/connect" 
                className={`text-sm hover:text-primary transition-colors ${location.pathname === '/connect' ? 'text-primary' : 'text-muted-foreground'}`}
              >
                Connect
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground hidden md:block">
                {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link to="/auth">
                <User className="h-4 w-4" />
                Sign In
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;