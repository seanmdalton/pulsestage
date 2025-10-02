/*
 * Copyright 2025 Sean M. Dalton
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SubmitPage } from './pages/SubmitPage';
import { OpenQuestionsPage } from './pages/OpenQuestionsPage';
import { AnsweredQuestionsPage } from './pages/AnsweredQuestionsPage';
import { AdminPage } from './pages/AdminPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { Navbar } from './components/Navbar';
import { AdminProvider } from './contexts/AdminContext';
import { TeamProvider } from './contexts/TeamContext';

function App() {
  return (
    <Router>
      <AdminProvider>
        <TeamProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                {/* Default routes - redirect to /all */}
                <Route path="/" element={<Navigate to="/all" replace />} />
                <Route path="/open" element={<Navigate to="/all/open" replace />} />
                <Route path="/answered" element={<Navigate to="/all/answered" replace />} />
                
                {/* Team-based routes */}
                <Route path="/:teamSlug" element={<SubmitPage />} />
                <Route path="/:teamSlug/open" element={<OpenQuestionsPage />} />
                <Route path="/:teamSlug/answered" element={<AnsweredQuestionsPage />} />
                
                {/* Admin routes (not team-scoped) */}
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
              </Routes>
            </main>
          </div>
        </TeamProvider>
      </AdminProvider>
    </Router>
  );
}

export default App;
