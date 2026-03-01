"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.classList.remove("page-enter");
        // Force reflow so the animation re-triggers on every navigation
        void el.offsetHeight;
        el.classList.add("page-enter");
    }, [pathname]);

    return (
        <div ref={ref} className="page-enter">
            {children}
        </div>
    );
}
