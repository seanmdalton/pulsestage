import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { SubmitPage } from './pages/SubmitPage';
import { OpenQuestionsPage } from './pages/OpenQuestionsPage';
import { AnsweredQuestionsPage } from './pages/AnsweredQuestionsPage';
import { AdminPage } from './pages/AdminPage';
import { Navbar } from './components/Navbar';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<SubmitPage />} />
            <Route path="/open" element={<OpenQuestionsPage />} />
            <Route path="/answered" element={<AnsweredQuestionsPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
