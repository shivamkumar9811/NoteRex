'use client';

import { Button } from '@/components/ui/button';
import { Brain, LayoutDashboard, LogIn, UserPlus, FileText } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';

export default function DashboardNavbar() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isDashboardActive = pathname === '/dashboard';
  const isNotesActive = pathname === '/dashboard/notes';

  return (
    <header className="border-b border-purple-900/20 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          {/* Left: Logo + Navigation */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="p-2.5 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-xl shadow-lg shadow-purple-500/50">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                  NoteRex
                </h1>
              </div>
            </Link>
            
            {/* Center Navigation */}
            <nav className="hidden md:flex items-center gap-4 ml-6">
              <Link href="/dashboard">
                <Button 
                  variant="ghost" 
                  className={`transition-all duration-200 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] ${
                    isDashboardActive 
                      ? 'text-white bg-purple-900/30' 
                      : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/dashboard/notes">
                <Button 
                  variant="ghost" 
                  className={`transition-all duration-200 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] ${
                    isNotesActive 
                      ? 'text-white bg-purple-900/30' 
                      : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
                  }`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  My Notes
                </Button>
              </Link>
            </nav>
          </div>

          {/* Right: Auth Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button 
                variant="ghost"
                onClick={logout}
                className="text-purple-300 hover:text-white hover:bg-purple-900/30 transition-all duration-200"
              >
                Logout
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/login')}
                  className="text-purple-300 hover:text-white hover:bg-purple-900/30 transition-all duration-200 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Login</span>
                </Button>
                <Button 
                  onClick={() => router.push('/signup')}
                  className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-200 hover:scale-105"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Sign Up</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

