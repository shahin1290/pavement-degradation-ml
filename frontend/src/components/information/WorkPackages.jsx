import React from 'react';

import WorkPackage
  from '../common/WorkPackage';

import FlowBox
  from '../common/FlowBox';

function WorkPackages() {

  return (

    <section className="info-card">

      <h2>
        🏗️ Work Packages WP0–WP4
      </h2>

      <p className="paragraph">

        The project workflow moves from NDT data
        collection to machine learning, Digital Twin
        development, validation and maintenance
        decision-making.

      </p>


      <WorkPackage
        number="WP0"
        title="Data Collection"
        text="Data collection of NDT inspection data."
      />


      <WorkPackage
        number="WP1"
        title="Machine Learning"
        text="ML for processing NDT inspection data, including TSD/FWD data."
      />


      <WorkPackage
        number="WP2"
        title="Digital Twin / TPIS Model Development"
        text="DT development using data from WP1, structural data such as layer thicknesses and material, PMSv4 maintenance history, climate data such as temperature and precipitation, and ERAPave (MLET), FEM and DEM. The TPIS model is developed and validated."
      />


      <WorkPackage
        number="WP3"
        title="Iteration and Validation"
        text="Iteration of the obtained Digital Twin with data from WP0 until agreement is obtained. The process is repeated at different time intervals to estimate changes and evolution of structural conditions over time."
      />


      <WorkPackage
        number="WP4"
        title="Decision-Making"
        text="Prediction of suitable timing of maintenance and type of maintenance treatment method, including optimization. Provides timing of repairs, recycling and reuse in alignment with circular economy principles."
      />


      <h3 className="sub-title">
        Overall Workflow
      </h3>


      <div className="wp-flow">

        <FlowBox text={'WP0\nNDT Data'} />

        <span>→</span>

        <FlowBox text={'WP1\nProcess TSD/FWD'} />

        <span>→</span>

        <FlowBox text={'WP2\nTPIS / DT'} />

        <span>→</span>

        <FlowBox text={'WP3\nValidation'} />

        <span>→</span>

        <FlowBox text={'WP4\nDecision'} />

      </div>


      <div className="objective-box">

        <h3>
          Where the AI Back-Calculation Fits
        </h3>

        <p>

          The AI model is developed as part of the
          structural modelling process to automatically
          estimate pavement layer characteristics from
          available NDT/TSD and pavement data.

        </p>

      </div>

    </section>

  );
}

export default WorkPackages;