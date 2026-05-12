import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SkillNetApp from './SkillNetApp';

export default function Root() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app/*" element={<SkillNetApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
