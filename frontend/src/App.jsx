import { Routes, Route } from 'react-router-dom'
import LobbyPage from './pages/LobbyPage'
import './App.css'

function App() {
  

  return (
    <>
      <Routes>
        <Route path='/' element={<LobbyPage/>}/>
      </Routes>
    </>
  )
}

export default App
