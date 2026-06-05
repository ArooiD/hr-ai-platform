import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  return (
    <div style={{padding:'24px',fontFamily:'Arial'}}>
      <h1>HR AI Platform</h1>
      <p>React frontend initialized.</p>
      <ul>
        <li>Vacancies</li>
        <li>Candidates</li>
        <li>Applications</li>
        <li>AI Analysis</li>
        <li>Dashboard</li>
      </ul>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
