import React from 'react';

function VariableDefinitions() {

  return (

    <section className="info-card">

      <h2>
        📋 Variable Definitions
      </h2>

      <p className="paragraph">
        The variables are divided into input characteristics,
        structural-response measurements, analytical outputs,
        and project targets.
      </p>


      {/* =====================================================
          1. INPUTS
      ====================================================== */}

      <h3 className="sub-title">
        1. Inputs for ERAPave & the AI Model
      </h3>


      {/* PAVEMENT GEOMETRY */}

      <h4 className="variable-group-title">
        Pavement Geometry (Layer Thicknesses)
      </h4>

      <ul className="variable-list">

        <li>
          <code>Medelförmst_Layer_1_thk</code>
          {' '}: Thickness of pavement layer 1 (m).
        </li>

        <li>
          <code>Medelförmst_Layer_2_thk</code>
          {' '}: Thickness of pavement layer 2 (m).
        </li>

        <li>
          <code>Medelförmst_Layer_3_thk</code>
          {' '}: Thickness of pavement layer 3 (m).
        </li>

      </ul>


      {/* ENVIRONMENT */}

      <h4 className="variable-group-title">
        Environmental & Moisture Data
      </h4>

      <ul className="variable-list">

        <li>
          <code>Medelförtsd_1..4_BELLS_TEMP</code>:
          {' '}Pavement temperature during the TSD survey (°C),
          relevant to asphalt stiffness.
        </li>

        <li>
          <code>Medelförtsd_1..4_PCIP_14_DAYS</code>:
          {' '}Precipitation during the preceding 14 days (mm).
        </li>

        <li>
          <code>Förstaförsoil_GJ2_tx / JG2</code>:
          {' '}Soil/subgrade classification information.
        </li>

        <li>
          <code>Medelförmst_ditch_depth_10</code>:
          {' '}Ditch/drainage depth information (m).
        </li>

      </ul>


      {/* TRAFFIC */}

      <h4 className="variable-group-title">
        Traffic & Measurement Conditions
      </h4>

      <ul className="variable-list">

        <li>
          <code>Medelförpmsv4_AADT</code>:
          {' '}Average Annual Daily Traffic.
        </li>

        <li>
          <code>TAADT</code>:
          {' '}Heavy-traffic AADT measure.
        </li>

        <li>
          <code>Medelförtsd_1..4_SPEED</code>:
          {' '}TSD survey vehicle speed during NDT measurement (km/h).
        </li>

      </ul>


      {/* TSD */}

      <h4 className="variable-group-title">
        Field NDT Measurements — TSD Structural Response
      </h4>

      <ul className="variable-list">

        <li>
          <code>Medelförtsd_1..4_D0000</code>
          {' '}($d_0$):
          Central/zero-offset pavement deflection measured
          by the TSD.
        </li>

        <li>
          <code>Medelförtsd_1..4_SCI_300</code>
          {' '}($SCI_{300}$):
          Surface Curvature Index describing the curvature
          of the pavement deflection response.
        </li>

        <li>
          <code>Medelförtsd_1..4_SCI_sub</code>:
          {' '}Additional structural-response information.
        </li>

        <li>
          <code>Medelförtsd_1..4_SCI300_norm</code>:
          {' '}Normalized SCI300 structural-response index.
        </li>

      </ul>


      {/* =====================================================
          2. ERAPAVE / ANALYTICAL OUTPUTS
      ====================================================== */}

      <h3 className="sub-title">
        2. Outputs from ERAPave / MLET & Project Targets
      </h3>


      {/* STRAIN */}

      <h4 className="variable-group-title">
        Structural Strain Outputs
      </h4>

      <ul className="variable-list">

        <li>

          <code>
            Medelförstrain1..4_left_norm
          </code>
          {' '}and{' '}

          <code>
            Medelförstrain1..4_right_norm
          </code>:

          Normalized structural strain-related variables
          representing pavement strain response.

        </li>

      </ul>


 
      {/* LAYER MODULI */}

      <h4 className="variable-group-title">
        Layer Moduli — Main Back-Calculation Targets
      </h4>

      <ul className="variable-list">

        <li>

          <strong>
            E<sub>AC</sub>
          </strong>:
          {' '}Stiffness/modulus of the AC or bound pavement layer.

        </li>

        <li>

          <strong>
            E<sub>base</sub>
          </strong>:
          {' '}Stiffness/modulus of the granular base layer.

        </li>

        <li>

          <strong>
            E<sub>subbase</sub>
          </strong>:
          {' '}Stiffness/modulus of the subbase layer,
          when this layer is explicitly represented.

        </li>

        <li>

          <strong>
            E<sub>subgrade</sub>
          </strong>:
          {' '}Stiffness/modulus of the subgrade.

        </li>

      </ul>


      <div className="target-box">

        <h3>
          🎯 AI Supervised Targets
        </h3>

        <p>
          The main AI back-calculation targets are the
          pavement layer characteristics/moduli obtained
          from analytical back-calculation using ERAPave/MLET.
        </p>

        <div className="target-row">

          <div className="definition-target">
            <strong>
              E<sub>AC</sub>
            </strong>
            <span>
              AC layer
            </span>
          </div>

          <div className="definition-target">
            <strong>
              E<sub>base</sub>
            </strong>
            <span>
              Base layer
            </span>
          </div>

          <div className="definition-target">
            <strong>
              E<sub>subgrade</sub>
            </strong>
            <span>
              Subgrade
            </span>
          </div>

        </div>

      </div>


      {/* =====================================================
          3. CONDITION / DETERIORATION
      ====================================================== */}

      <h3 className="sub-title">
        3. Pavement Condition / Deterioration Variables
      </h3>


      <ul className="variable-list">

        <li>

          <code>
            Medelförtsd_1..4_ACD_PERCENT_WP_CELLS_CRACKED
          </code>:

          Percentage of wheel-path cells affected by
          cracking.

        </li>

        <li>

          <code>
            Spårdjup
          </code>:

          Pavement rut-depth measurement.

        </li>

        <li>

          <code>
            Spårdjup max
          </code>:

          Maximum rut-depth measurement according to
          the corresponding PMSv4 definition.

        </li>

        <li>

          <code>
            Medelförghum_max
          </code>:

          Humidity/moisture-related variable.

        </li>

      </ul>



    </section>

  );
}

export default VariableDefinitions;