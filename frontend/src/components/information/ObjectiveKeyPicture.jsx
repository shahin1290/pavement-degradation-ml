import React from 'react';

import DiagramBox from '../common/DiagramBox';
import SmallTarget from '../common/SmallTarget';

function ObjectiveKeyPicture() {
  return (
    <section className="info-card">
      {/* =====================================================
          TITLE
      ====================================================== */}
      <h2>🎯 Objective & Key Picture</h2>

      {/* =====================================================
          PROJECT OBJECTIVE
      ====================================================== */}
      <div className="objective-box">
        <h3>Project Objective</h3>
        <p>
          Develop an AI-based automated analytical back-calculation method to
          obtain pavement layer characteristics, including properties of AC
          layers, granular course layers, and the subgrade.
        </p>
        <p>
          The project combines measured TSD structural response with available
          pavement structure, traffic, and environmental information.
          Analytical back-calculation (ERAPave/MLET) is used to obtain
          best-fitting layer characteristics as supervised targets for the
          machine learning model.
        </p>
      </div>

      {/* =====================================================
          KEY PICTURE WORKFLOW
      ====================================================== */}
      <h3 className="sub-title">Key Picture Workflow</h3>

      <div className="diagram">
        {/* STEP 1: MEASURED FIELD DATA */}
        <div className="data-input-container">
          <h3 className="data-input-title">1. MEASURED FIELD DATA (INPUTS)</h3>

          <div className="data-input-grid">
            <div className="data-input-group">
              <h4>TSD Deflections</h4>
              <p>D0000 (Central)</p>
              <p>SCI300 (Curvature)</p>
              <p>SCI_sub (Substructure)</p>
            </div>

            <div className="data-input-group">
              <h4>Structure</h4>
              <p>h1, h2, h3 (Thicknesses)</p>
              <p>Materials &amp; Soil Type</p>
            </div>

            <div className="data-input-group">
              <h4>Conditions</h4>
              <p>BELLS_TEMP (Temperature)</p>
              <p>AADT / TAADT (Traffic)</p>
              <p>Moisture / PCIP</p>
            </div>
          </div>

          <p className="diagram-note">
            Available field measurements and site context used as input features
            (X) for back-calculation and ML training.
          </p>
        </div>

        <div className="diagram-arrow">↓</div>

        {/* STEP 2: ERAPAVE OPTIMIZATION LOOP */}
        <div className="loop-container border-2 border-dashed border-blue-400 p-4 rounded-lg bg-gray-50">
          <div className="loop-header text-center font-bold text-blue-800 mb-3">
            2. ERAPAVE / MLET BACK-CALCULATION LOOP
          </div>

          <div className="ai-box mb-2">
            <strong>Initial Layer Moduli Seeds</strong>
            <p>
              Provide initial trial E-values (E_AC, E_base, E_subbase, E_subgrade).
            </p>
          </div>

          <div className="diagram-arrow">↓</div>

          <DiagramBox title="Forward ERAPave / MLET Calculation">
            Calculate theoretical surface deflection bowl from pavement structure and trial E-values.
          </DiagramBox>

          <div className="diagram-arrow">↓</div>

          <DiagramBox title="Compare with Measured TSD Response">
            Compare calculated deflection bowl against measured TSD values (D0000, SCI300, SCI_sub).
          </DiagramBox>

          <div className="diagram-arrow">↓</div>

          <div className="decision-box bg-yellow-50 border border-yellow-300 p-3 rounded text-center">
            <strong>Convergence Check</strong>
            <p>Is |Calculated Deflection - Measured Deflection| &lt; Tolerance?</p>
          </div>

          <div className="loop-feedback text-sm mt-3 pt-2 border-t flex justify-around">
            <span className="text-red-600 font-semibold">
              ❌ NO: Adjust trial E-values → Loop back to ERAPave Simulation
            </span>
            <span className="text-green-600 font-semibold">
              ✅ YES: Optimization Converged
            </span>
          </div>
        </div>

        <div className="diagram-arrow">↓</div>

        {/* STEP 3: TARGET GENERATION */}
        <div className="best-fitting-box">
          <h3>3. BEST-FITTING LAYER PROPERTIES (SUPERVISED TARGETS Y)</h3>

          <div className="target-row">
            <SmallTarget title="AC Layer" value="E_AC" />
            <SmallTarget title="Base Layer" value="E_base" />
            <SmallTarget title="Subbase" value="E_subbase" />
            <SmallTarget title="Subgrade" value="E_subgrade" />
          </div>
        </div>

        <div className="diagram-arrow">↓</div>

        {/* STEP 4: AI TRAINING */}
        <div className="ai-box">
          <strong>4. AI MODEL TRAINING</strong>
          <p>
            Machine learning model learns non-linear mapping: <br />
            Inputs (X: TSD + Structure + Temp + Traffic) ──&gt; Targets (Y: Converged Layer Moduli)
          </p>
        </div>

        <div className="diagram-arrow">↓</div>

        {/* STEP 5: REAL-TIME DEPLOYMENT */}
        <div className="best-fitting-box">
          <h3>5. REAL-TIME AI ESTIMATION (DEPLOYMENT)</h3>
          <p>
            New Road Survey Data → <strong>Trained AI Model</strong> →
            Instantaneous Real-Time Layer Moduli Estimation
          </p>

          <div className="target-row mt-3">
            <SmallTarget title="AC Layer" value="E_AC" />
            <SmallTarget title="Base Layer" value="E_base" />
            <SmallTarget title="Subbase" value="E_subbase" />
            <SmallTarget title="Subgrade" value="E_subgrade" />
          </div>
        </div>
      </div>

      {/* =====================================================
          DATA USED SUMMARY
      ====================================================== */}
      <h3 className="sub-title">Data Used in the Back-Calculation</h3>

      <div className="two-column">
        <div className="mini-card">
          <h3>TSD Structural Response</h3>
          <p>
            <strong>D0000</strong>
            <br />
            Central TSD deflection
          </p>
          <p>
            <strong>SCI300</strong>
            <br />
            Deflection curvature index (d0 - d300)
          </p>
          <p>
            <strong>SCI_sub</strong>
            <br />
            Substructure response index
          </p>
        </div>

        <div className="mini-card">
          <h3>Pavement Structure</h3>
          <p>Layer thicknesses (h1, h2, h3)</p>
          <p>Layer/material specifications</p>
          <p>Soil / subgrade classification (e.g., JG2)</p>
        </div>

        <div className="mini-card">
          <h3>Environmental Conditions</h3>
          <p>
            <strong>BELLS_TEMP</strong>
            <br />
            Pavement surface/mid-depth temperature
          </p>
          <p>Precipitation / 14-day antecedent rainfall (PCIP)</p>
          <p>Ditch depth &amp; groundwater table conditions</p>
        </div>

        <div className="mini-card">
          <h3>Traffic &amp; Loading</h3>
          <p>
            <strong>AADT</strong>
            <br />
            Average Annual Daily Traffic
          </p>
          <p>
            <strong>TAADT</strong>
            <br />
            Heavy-vehicle traffic volume
          </p>
          <p>TSD survey vehicle speed (km/h)</p>
        </div>
      </div>

      {/* =====================================================
          BACK-CALCULATION PROCESS STEPS
      ====================================================== */}
      <h3 className="sub-title">Back-Calculation Process Steps</h3>

      <div className="strategy-box">
        <div className="strategy-step">
          <span className="strategy-number">1</span>
          <div>
            <strong>Collect Measured Field Data</strong>
            <p>
              Gather TSD deflections, GPR structural layer thicknesses, soil
              type, climate, and traffic information.
            </p>
          </div>
        </div>

        <div className="strategy-step">
          <span className="strategy-number">2</span>
          <div>
            <strong>Initialize Seed Layer Properties</strong>
            <p>
              Set initial trial stiffness values (E-moduli) for the asphalt,
              granular base, subbase, and subgrade layers.
            </p>
          </div>
        </div>

        <div className="strategy-step">
          <span className="strategy-number">3</span>
          <div>
            <strong>ERAPave / MLET Calculation</strong>
            <p>
              Compute theoretical structural stress-strain response and surface
              deflections using Multi-Layer Elastic Theory.
            </p>
          </div>
        </div>

        <div className="strategy-step">
          <span className="strategy-number">4</span>
          <div>
            <strong>Compare with Measured TSD Response</strong>
            <p>
              Calculate absolute error between ERAPave deflections and measured
              TSD values (D0000, SCI300).
            </p>
          </div>
        </div>

        <div className="strategy-step">
          <span className="strategy-number">5</span>
          <div>
            <strong>Adjust Unknown Layer Properties</strong>
            <p>
              Modify trial layer moduli (E-values) using non-linear
              optimization algorithms to minimize deflection residuals.
            </p>
          </div>
        </div>

        <div className="strategy-step">
          <span className="strategy-number">6</span>
          <div>
            <strong>Iterate Until Convergence</strong>
            <p>
              Repeat ERAPave calculations and comparisons until the deflection
              error drops below the acceptable threshold (&lt; 1%).
            </p>
          </div>
        </div>

        <div className="strategy-step">
          <span className="strategy-number">7</span>
          <div>
            <strong>Extract Target Labels &amp; Train AI</strong>
            <p>
              Save best-fitting layer moduli (E_AC, E_base, E_subbase, E_subgrade)
              as supervised target labels (Y) to train the machine learning
              model.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          ROLE OF AI
      ====================================================== */}
      <h3 className="sub-title">Role of AI in Real-Time Deployment</h3>

      <div className="objective-box">
        <h3>From Iterative Back-Calculation to Real-Time AI Inference</h3>
        <p>
          Analytical back-calculation using ERAPave provides accurate,
          physics-validated layer characteristics (E_AC, E_base, E_subgrade)
          for the training dataset.
        </p>
        <p>
          These layer characteristics serve as supervised targets (Y) for the
          machine learning model, while TSD deflections, structure, traffic,
          and environmental variables form the input feature matrix (X).
        </p>
        <p>
          After training, the AI model replaces the slow, iterative ERAPave solver,
          enabling instantaneous, real-time estimation of pavement layer
          moduli across large road networks.
        </p>
      </div>

      {/* =====================================================
          SUMMARY NOTE
      ====================================================== */}
      <div className="note-box">
        <strong>
          Methodological Pipeline Summary: Measured Field Data → ERAPave Optimization → AI Supervised Targets → Real-Time Digital Twin Inference
        </strong>
      </div>
    </section>
  );
}

export default ObjectiveKeyPicture;