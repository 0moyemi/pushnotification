"use client";
import Link from "next/link";
import { ChevronDown, Package, CheckCircle, MessageSquare, UserCheck } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";


export default function Navigation() {
    const navItems = [
        { href: "/schedule", label: "Schedule", icon: Package },
        { href: "/daily-status", label: "Daily Status", icon: CheckCircle },
        { href: "/follow-ups", label: "Follow-Ups", icon: UserCheck },
        { href: "/templates", label: "Templates", icon: MessageSquare },
    ];
    const [showSections, setShowSections] = useState(true);
    const pathname = usePathname();

    // Auto-collapse nav on navigation
    function handleNavClick() {
        setShowSections(false);
    }

    return (
        <>
            {/* Mobile Header */}
            <header className="lg:hidden sticky top-0 z-50 bg-[#050e23] shadow-md">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8  overflow-hidden flex items-center justify-center shadow-lg">
                            <img src="/1010 Primary Logo.png" alt="App Logo" className="object-contain w-full h-full" />
                        </div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Sales Ast.</h1>
                    </div>
                    <button
                        className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-semibold bg-blue-900 text-white hover:bg-blue-800 transition-all shadow-sm border border-blue-700"
                        aria-label={showSections ? "Hide menu" : "Show menu"}
                        onClick={() => setShowSections((v) => !v)}
                    >
                        <span className={`transition-transform duration-300 ${showSections ? 'rotate-180' : 'rotate-0'}`}>
                            <ChevronDown size={18} />
                        </span>
                        {showSections ? "Hide" : "Show"}
                    </button>
                </div>
                <nav
                    className="bg-[#050e23] px-4 border-blue-900 lg:hidden overflow-hidden"
                    style={{
                        maxHeight: showSections ? '500px' : '0px',
                        opacity: showSections ? 1 : 0,
                        borderTopWidth: showSections ? '1px' : '0px',
                        paddingTop: showSections ? '1rem' : '0',
                        paddingBottom: showSections ? '1rem' : '0',
                        transition: 'max-height 0.32s ease, opacity 0.25s ease, padding 0.25s ease',
                    }}
                    aria-label="Main navigation"
                >
                    <div className="grid grid-cols-2 gap-3">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.href === "/schedule"
                                ? (pathname === "/" || pathname.startsWith("/schedule"))
                                : pathname.startsWith(item.href);
                            return (
                                <Link href={item.href} key={item.href} className="focus:outline-none" onClick={handleNavClick}>
                                    <div
                                        className={`flex flex-col items-center justify-center gap-2.5 py-5 px-4 rounded-2xl font-bold transition-all shadow-sm ${isActive ? "bg-gradient-to-br from-blue-700 to-blue-900 text-white shadow-lg" : "bg-blue-950 text-blue-200 opacity-60"}`}
                                    >
                                        <Icon size={32} strokeWidth={2.5} />
                                        <span className="text-xs leading-tight text-center">{item.label}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </header>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-72 lg:border-r bg-[#050e23] border-blue-900 shadow-xl">
                <div className="p-6 border-b border-blue-900">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-7 h-7 rounded-xl overflow-hidden flex items-center justify-center shadow-lg bg-white">
                            <img src="/1010 Primary Logo.png" alt="App Logo" className="object-contain w-full h-full" />
                        </div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Sales Ast.</h1>
                    </div>
                </div>
                <nav className="flex-1 p-5 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.href === "/schedule"
                            ? (pathname === "/" || pathname.startsWith("/schedule"))
                            : pathname.startsWith(item.href);
                        return (
                            <Link href={item.href} key={item.href} className="focus:outline-none">
                                <div
                                    className={`flex items-center gap-4 px-5 py-4 rounded-xl font-semibold transition-all ${isActive ? "bg-gradient-to-br from-blue-700 to-blue-900 text-white shadow-lg" : "bg-blue-950 text-blue-200 opacity-60"}`}
                                >
                                    <Icon size={24} strokeWidth={2.5} />
                                    <span className="text-base">{item.label}</span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-6 border-t border-blue-900 text-blue-200 opacity-80">
                    <p className="text-sm text-center">Made for Nigerian SME Owners 🇳🇬</p>
                    <p className="text-xs text-center mt-2 opacity-70">All data saved locally</p>
                </div>
            </aside>
        </>
    );
}
