import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useStore } from './store';
import HomePage from './components/HomePage';
import AboutPage from './components/AboutPage';

function App() {
  const theme = useStore(state => state.theme);
  
  return (
    <div className={`app ${theme}`}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;