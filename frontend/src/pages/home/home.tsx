import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";


const Home : React.FC = () => {
    const navigate = useNavigate();
    return (
            <>
            <h1 className="text-5xl font-extrabold mb-10">Choose Mode</h1>
            <div className="flex items-center">
            <Button className="mr-4"onClick={() => navigate('/pedestrian')}>Pedestrian Mode</Button>
            <Button  className="">Driver Mode</Button>
            </div>
            </>
            

    )
}

export default Home;