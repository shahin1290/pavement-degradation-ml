import React, { useState } from 'react';

import Header from './components/Header';
import Navigation from './components/Navigation';

import LivePredictor from './components/predictor/LivePredictor';
import VariableDefinitions from './components/information/VariableDefinitions';
import ObjectiveKeyPicture from './components/information/ObjectiveKeyPicture';
import WorkPackages from './components/information/WorkPackages';

import './styles/dashboard.css';

function App() {
  const [activeTab, setActiveTab] = useState('predictor');

  return (
    <div className="app-container">

      <Header />

      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main>

        {activeTab === 'predictor' && (
          <LivePredictor />
        )}

        {activeTab === 'variables' && (
          <VariableDefinitions />
        )}

        {activeTab === 'objective' && (
          <ObjectiveKeyPicture />
        )}

        {activeTab === 'wp' && (
          <WorkPackages />
        )}

      </main>

    </div>
  );
}

export default App;