import React from 'react';

function StructuralWorkflow() {
  return (
    <div className="structural-workflow">

      {/* FIELD DATA */}

      <div className="workflow-title">
        FIELD DATA
      </div>

      <div className="workflow-arrow">
        ↓
      </div>


      {/* INPUT GROUPS */}

      <div className="workflow-inputs">

        <div className="workflow-column">
          <div className="workflow-box">
            <h3>TSD</h3>

            <p>D0000</p>
            <p>SCI300</p>
            <p>SCI_sub</p>
          </div>
        </div>


        <div className="workflow-column">
          <div className="workflow-box">
            <h3>STRUCTURE</h3>

            <p>h₁, h₂, h₃</p>
            <p>Materials</p>
            <p>PMSv4</p>
          </div>
        </div>


        <div className="workflow-column">
          <div className="workflow-box">
            <h3>ENVIRONMENT</h3>

            <p>Temperature</p>
            <p>Rain</p>
            <p>Soil</p>
            <p>Traffic</p>
          </div>
        </div>

      </div>


      {/* ARROW */}

      <div className="workflow-arrow">
        ↓
      </div>


      {/* ERAPAVE */}

      <div className="workflow-box workflow-main">
        <h3>
          ERAPave / MLET
        </h3>

        <p>
          Structural calculation
        </p>
      </div>


      <div className="workflow-arrow">
        ↓
      </div>


      {/* BACK CALCULATION */}

      <div className="workflow-box workflow-main">
        <h3>
          BACK-CALCULATION
        </h3>

        <p>
          Estimate pavement layer characteristics
        </p>
      </div>


      <div className="workflow-arrow">
        ↓
      </div>


      {/* TARGETS */}

      <div className="workflow-targets">

        <div className="workflow-target">
          <strong>E_AC</strong>
          <span>AC layer</span>
        </div>

        <div className="workflow-target">
          <strong>E_base</strong>
          <span>Base layer</span>
        </div>

        <div className="workflow-target">
          <strong>E_subgrade</strong>
          <span>Subgrade</span>
        </div>

      </div>


      <div className="workflow-arrow">
        ↓
      </div>


      {/* AI TARGET */}

      <div className="workflow-ai">
        <strong>
          AI TARGET
        </strong>

        <p>
          Automated prediction of pavement
          layer characteristics
        </p>
      </div>

    </div>
  );
}

export default StructuralWorkflow;