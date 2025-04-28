import React from 'react';

interface UserProfileButtonProps {
    user: {
        first_name?: string;
        last_name?: string;
    } | null;
    onClick: () => void;
    expanded?: boolean;
}

/**
 * Button displaying user initials that toggles the user menu
 */
export function UserProfileButton({ user, onClick, expanded = false }: UserProfileButtonProps) {
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    
    // Use effect to imperatively set the aria-expanded attribute
    React.useEffect(() => {
        if (buttonRef.current) {
            buttonRef.current.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        }
    }, [expanded]);
    
    return (
        <button 
            ref={buttonRef}
            type="button"
            onClick={onClick}
            className="flex items-center gap-2 rounded-full px-3 py-2 text-[var(--color-foreground)] hover:bg-[var(--heart-blue-500)/10]"
        >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--heart-blue-500)] text-white">
                <span className="text-sm font-medium">
                    {user?.first_name?.charAt(0)}
                    {user?.last_name?.charAt(0)}
                </span>
            </div>
            <span className="hidden font-medium sm:inline-block">{user?.first_name}</span>
        </button>
    );
}

/**
 * Mobile version of the user profile button (only shows initials)
 */
export function MobileUserProfileButton({ user, onClick }: Omit<UserProfileButtonProps, 'expanded'>) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--heart-blue-500)] text-white"
        >
            <span className="text-sm font-medium">
                {user?.first_name?.charAt(0)}
                {user?.last_name?.charAt(0)}
            </span>
        </button>
    );
}