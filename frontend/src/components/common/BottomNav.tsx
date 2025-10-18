import { useLocation, useNavigate } from "react-router-dom";
import { Home, Footprints, Car } from "lucide-react";

const tabs = [
  { path: "/", label: "Home", icon: Home },
  { path: "/pedestrian", label: "Walk", icon: Footprints },
  { path: "/driver", label: "Drive", icon: Car },
];

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <ul className="mx-auto flex max-w-screen-sm items-stretch justify-around px-2 py-1">
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <li key={path} className="w-full">
              <button
                onClick={() => navigate(path)}
                className={`flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4" />
                <span>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomNav;
