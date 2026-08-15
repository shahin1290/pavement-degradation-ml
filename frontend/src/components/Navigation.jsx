import React from 'react';

function Navigation({
  activeTab,
  setActiveTab
}) {

  const tabs = [
    ['predictor', '🔮 Live Predictor'],
    ['variables', '📋 Variable Definitions'],
    ['objective', '🎯 Objective & Key Picture'],
    ['wp', '🏗️ WP0–WP4']
  ];

  return (
    <nav className="dashboard-navigation">

      {tabs.map(([tab, label]) => (

        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={
            activeTab === tab
              ? 'nav-button active'
              : 'nav-button'
          }
        >
          {label}
        </button>

      ))}

    </nav>
  );
}

export default Navigation;