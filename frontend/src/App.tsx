
import Accelerometer from './components/Accelerometer'
// import CrosswalkDetection from './CrosswalkDetection'
import { useState } from 'react'
// import { io } from 'socket.io-client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import PedestrianPage from './pages/pedestrian/pedestrianPage'
import Home from './pages/home/home'
import Layout from './pages/layout/layout'

function App() {
  const [isCurrWatching, setIsCurrWatching] = useState(false)
  localStorage.setItem("username", "test");
  // const socket = io('http://127.0.0.1:8000', {
  //   path: '/sockets',
  //   transports: ['websocket'],
  // });
  return (
    <BrowserRouter>
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/accelerometer" element={<Accelerometer isCurrWatching={isCurrWatching} setIsCurrWatching={setIsCurrWatching} />} />
        <Route path="/pedestrian" element={<PedestrianPage/>}/>
      </Routes>
      </Layout>
    </BrowserRouter>

    // <>
    //   <div>
    //     <Accelerometer isCurrWatching={isCurrWatching} setIsCurrWatching={setIsCurrWatching}/>
    //     <CrosswalkDetection isWatching={isCurrWatching} socket={socket}/>
    //   </div>
    // </>
  )
}

export default App
