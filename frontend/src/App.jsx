import { Routes, Route } from 'react-router-dom'
import LobbyPage from './pages/LobbyPage'
import './App.css'
import RoomPage from './pages/RoomPage'

function App() {
  

  return (
    <>
      <Routes>
        <Route path='/' element={<LobbyPage/>}/>
        <Route path='/room/:roomId' element={<RoomPage/>}/>
      </Routes>
    </>
  )
}

export default App
