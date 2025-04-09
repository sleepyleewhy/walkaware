import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";


const Home : React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-5xl font-extrabold mb-10">Walk Help</h1>
            <div className="flex items-center">
            <Button className="mr-4"onClick={() => navigate('/pedestrian')}>Pedestrian Mode</Button>
            <Button  className="">Driver Mode</Button>
            </div>
            
        </div>
    )
}

export default Home;