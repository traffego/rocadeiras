import { Outlet, NavLink } from 'react-router-dom'
import {
    ClipboardList,
    PlusCircle,
    Users,
    Wrench,
    Menu,
    LogOut,
    Layout as LayoutIcon,
    Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useTheme } from '@/components/theme-provider'
import { Sun, Moon, Palette } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navigation = [
    { name: 'Dashboard', href: '/', icon: ClipboardList },
    { name: 'Listagem de OS', href: '/os', icon: ClipboardList },
    { name: 'Kanban', href: '/kanban', icon: LayoutIcon },
    { name: 'Nova OS', href: '/os/new', icon: PlusCircle },
    { name: 'Peças', href: '/inventory', icon: Package },
    { name: 'Clientes', href: '/customers', icon: Users },
    { name: 'Técnicos', href: '/technicians', icon: Wrench },
]

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { signOut } = useAuth()
    const { theme, setTheme } = useTheme()

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile menu button */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center gap-4 bg-card border-b px-4 py-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    <Menu className="h-6 w-6" />
                </Button>
                <h1 className="font-bold text-lg">ZMAQ</h1>
            </div>

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-6 py-5 border-b">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                            <Wrench className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">ZMAQ</h1>
                            <p className="text-xs text-muted-foreground">Oficina de Máquinas</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-4 space-y-1">
                        {navigation.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                    }`
                                }
                            >
                                <item.icon className="h-5 w-5" />
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Footer */}
                    <div className="px-4 py-4 border-t space-y-4">
                        <Button
                            variant="outline"
                            className="w-full justify-start text-muted-foreground"
                            onClick={() => signOut()}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sair do Sistema
                        </Button>
                        Sair do Sistema
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-muted-foreground">
                                <Palette className="mr-2 h-4 w-4" />
                                Tema: {theme === 'dark' ? 'Escuro' : theme === 'navy' ? 'Marinho' : 'Claro'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => setTheme("light")}>
                                <Sun className="mr-2 h-4 w-4" />
                                Claro
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("dark")}>
                                <Moon className="mr-2 h-4 w-4" />
                                Escuro
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("navy")}>
                                <Palette className="mr-2 h-4 w-4 text-blue-500" />
                                Marinho
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <p className="text-xs text-muted-foreground text-center">
                        v1.0.0 • ZMAQ
                    </p>
                </div>
        </div>
            </aside >

        {/* Overlay */ }
    {
        sidebarOpen && (
            <div
                className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                onClick={() => setSidebarOpen(false)}
            />
        )
    }

    {/* Main content */ }
    <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-6">
            <Outlet />
        </div>
    </main>
        </div >
    )
}
