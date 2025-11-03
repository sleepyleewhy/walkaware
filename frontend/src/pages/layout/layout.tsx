import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import BottomNav from "../../components/common/BottomNav";

type LayoutProps = {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    return  (
        <div className="min-h-dvh w-full">
            {/* Header */}
            <header className="sticky top-0 z-20 w-full border-b bg-background/80 backdrop-blur">
                <div className="mx-auto max-w-screen-sm px-4 py-3 flex items-center justify-between">
                    <div className="flex">
                        <img src="/walkaware-logo.svg" alt="WalkAware logo" className="h-8 w-8 mr-1" />
                        <button type="button" onClick={() => navigate('/')} className="text-xl font-bold tracking-tight">
                            WalkAware
                        </button>

                    </div>
                    {(location.pathname === "/pedestrian" || location.pathname === "/driver") && (
                        <Button size="sm" variant="outline" onClick={() => navigate(location.pathname === "/pedestrian" ? '/driver' : '/pedestrian')}>
                            Switch to {location.pathname === "/pedestrian" ? 'Driver' : 'Pedestrian'}
                        </Button>
                    )}
                </div>
            </header>

            {/* Main content */}
            <main className="mx-auto max-w-screen-sm px-4 py-6">
                {children}
            </main>

            {/* Bottom navigation for mobile only */}
            <div className="md:hidden">
                <BottomNav />
            </div>
        </div>
    );
}

export default Layout;
