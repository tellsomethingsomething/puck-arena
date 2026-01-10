import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Pucks } from './pages/Pucks';
import { Settings } from './pages/Settings';
import { Preview } from './pages/Preview';

function App() {
  return (
    <div className="min-h-screen bg-slate-900 flex">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pucks" element={<Pucks />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/preview" element={<Preview />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
