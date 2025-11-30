import React from 'react';
import { Menu } from 'lucide-react';
import IAstedButtonFull from '@/components/iasted/IAstedButtonFull';

export interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
}

interface MobileBottomNavProps {
    activeSection: string;
    setActiveSection: (section: string) => void;
    onOpenIasted: () => void;
    onToggleMenu: () => void;
    navItems: NavItem[];
    embeddedButtonProps?: any;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
    activeSection,
    setActiveSection,
    onOpenIasted,
    onToggleMenu,
    navItems,
    embeddedButtonProps
}) => {
    // Calculate midpoint to split items around the central button
    // We want to balance the items. The Menu button is always on the right.
    // So we have (navItems.length + 1) total buttons excluding iAsted.
    // We want roughly half on left, half on right.
    // Total slots = navItems.length + 1 (for Menu).
    // Left slots = Math.ceil(Total / 2).

    const totalButtons = navItems.length + 1;
    const leftCount = Math.ceil(totalButtons / 2);

    const leftItems = navItems.slice(0, leftCount);
    const rightItems = navItems.slice(leftCount);

    return (
        <div className="fixed bottom-6 left-4 right-4 h-16 neu-raised rounded-2xl flex items-center justify-between px-6 z-50 md:hidden border border-border/20">
            {/* Left Items */}
            {leftItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex flex-col items-center justify-center gap-1 transition-colors ${activeSection === item.id ? 'text-primary font-bold' : 'text-muted-foreground'}`}
                >
                    <item.icon size={20} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                </button>
            ))}

            {/* Central Floating Button - IAsted Sphere */}
            <div className="relative -top-8">
                <div className="w-16 h-16 flex items-center justify-center">
                    <IAstedButtonFull
                        onClick={onOpenIasted}
                        size="md"
                        pulsing={true}
                        embedded={true}
                        {...embeddedButtonProps}
                    />
                </div>
            </div>

            {/* Right Items */}
            {rightItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex flex-col items-center justify-center gap-1 transition-colors ${activeSection === item.id ? 'text-primary font-bold' : 'text-muted-foreground'}`}
                >
                    <item.icon size={20} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                </button>
            ))}

            {/* Menu Button - Always at the end */}
            <button
                onClick={onToggleMenu}
                className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
            >
                <Menu size={20} />
                <span className="text-[10px] font-medium">Menu</span>
            </button>
        </div>
    );
};
