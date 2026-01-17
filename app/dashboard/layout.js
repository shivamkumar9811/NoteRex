import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import DashboardNavbar from './DashboardNavbar';

/**
 * Dashboard Layout
 * Protects the dashboard route - redirects to login if not authenticated
 */
export default async function DashboardLayout({ children }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-purple-950 to-black opacity-90"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black"></div>
      
      {/* Animated Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      
      <div className="relative z-10">
        <DashboardNavbar />
        {children}
      </div>
    </div>
  );
}
