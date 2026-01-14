import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { isSuperAdmin, signOut, profile } = useAuth();

  const adminNavItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    { icon: Building2, label: 'Condomínios', href: '/admin/condominios' },
  ];

  const managerNavItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: FileText, label: 'Chamados', href: '/chamados' },
    { icon: ShoppingCart, label: 'Compras', href: '/compras' },
    { icon: Users, label: 'Prestadores', href: '/prestadores' },
    { icon: BarChart3, label: 'Relatórios', href: '/relatorios' },
    { icon: Settings, label: 'Configurações', href: '/configuracoes' },
  ];

  const navItems = isSuperAdmin ? adminNavItems : managerNavItems;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {collapsed ? (
            <img 
              src="/favicon.png" 
              alt="ZelaSync" 
              className="h-8 w-8 mx-auto rounded-lg"
            />
          ) : (
            <div className="flex items-center gap-2">
              <img 
                src="/favicon.png" 
                alt="ZelaSync Logo" 
                className="h-8 w-8 rounded-lg"
              />
              <span className="text-lg font-semibold">ZelaSync</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          {!collapsed && profile && (
            <div className="mb-3 px-3">
              <p className="text-sm font-medium truncate">{profile.name}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{profile.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={signOut}
            className={cn(
              'w-full text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              collapsed ? 'justify-center px-0' : 'justify-start'
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="ml-3">Sair</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
