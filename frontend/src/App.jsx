import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TripPlanner from './pages/TripPlanner';
import Results from './pages/Results';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-50 selection:bg-blue-500/30">
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/plan" element={<TripPlanner />} />
            <Route path="/results" element={<Results />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
