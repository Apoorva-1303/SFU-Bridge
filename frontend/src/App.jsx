import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import RoomPage from './pages/RoomPage'
import './App.css'

function App() {
  return (
    <>
      <Routes>
        <Route path='/' element={<LandingPage/>}/>
        <Route path='/signup' element={<SignupPage/>}/>
        <Route path='/dashboard' element={<DashboardPage/>}/>
        <Route path='/room/:roomId' element={<RoomPage/>}/>
      </Routes>
    </>
  )
}

export default App
