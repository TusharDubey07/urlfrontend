import { BrowserRouter,Route, Routes  } from "react-router-dom"
import AuthPage from "./page/AuthPage"
import Dashboard from "./page/Dashboard"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
