import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

type LayoutProps = {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    return  (
        <div className="flex flex-col items-center justify-center h-max w-1/2 mx-auto">
        <div className="mt-3 mb-10 ">
            <h1 className="text-4xl font-extrabold mx-auto mb-2">Walk Help</h1>
            {(location.pathname === "/pedestrian" || location.pathname === "/driver") && 
            <Button className="mt-4" variant="outline" onClick={() => navigate(location.pathname === "/pedestrian" ? '/driver' : '/pedestrian')}>
                Switch to {location.pathname === "/pedestrian" ? 'Driver' : 'Pedestrian'} Mode
            </Button>}
        </div>
            {children}
        </div>
    );
}

export default Layout;
