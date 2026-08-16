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
          <code>Medelförmst_Layer_1_thk</code>:
          Thickness of pavement layer 1 (m).
        </li>

        <li>
          <code>Medelförmst_Layer_2_thk</code>:
          Thickness of pavement layer 2 (m).
        </li>

        <li>
          <code>Medelförmst_Layer_3_thk</code>:
          Thickness of pavement layer 3 (m).
        </li>

      </ul>


      {/* ENVIRONMENT */}

      <h4 className="variable-group-title">
        Environmental & Moisture Data
      </h4>

      <ul className="variable-list">

        <li>
          <code>Medelförtsd_1..4_BELLS_TEMP</code>:
          Pavement temperature during the TSD survey (°C).
        </li>

        <li>
          <code>Medelförtsd_1..4_PCIP_14_DAYS</code>:
          Precipitation during the preceding 14 days (mm).
        </li>

        <li>
          <code>Förstaförsoil_JG2</code>:
          Soil/subgrade classification information.
        </li>

        <li>
          <code>Förstaförsoil_GJ2_tx</code>:
          Text-based soil/subgrade classification information.
        </li>

        <li>
          <code>Medelförmst_ditch_depth_10</code>:
          Ditch/drainage depth information.
        </li>

      </ul>


      {/* TRAFFIC */}

      <h4 className="variable-group-title">
        Traffic & Measurement Conditions
      </h4>

      <ul className="variable-list">

        <li>
          <code>Medelförpmsv4_AADT</code>:
          Average Annual Daily Traffic.
        </li>

        <li>
          <code>Medelförpmsv4_TAADT</code>:
          Heavy-traffic AADT measure.
        </li>

        <li>
          <code>Medelförtsd_1..4_SPEED</code>:
          TSD survey vehicle speed during NDT measurement (km/h).
        </li>

      </ul>


      {/* TSD */}

      <h4 className="variable-group-title">
        Field NDT Measurements — TSD Structural Response
      </h4>

      <ul className="variable-list">

        <li>
          <code>Medelförtsd_1..4_D0000</code>:
          Central pavement deflection measured by the TSD.
        </li>

        <li>
          <code>Medelförtsd_1..4_SCI_300</code>:
          Surface Curvature Index describing the curvature
          of the pavement deflection response.
        </li>

        <li>
          <code>tsd1_SCI_sub ... tsd4_SCI_sub</code>:
          Substructure-related structural-response indices.
        </li>

        <li>
          <code>Medelförtsd1_SCI300_norm ... Medelförtsd4_SCI300_norm</code>:
          Normalized SCI300 structural-response indices.
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

          Normalized structural strain variables.

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
          Stiffness/modulus of the AC or bound pavement layer.
        </li>

        <li>
          <strong>
            E<sub>base</sub>
          </strong>:
          Stiffness/modulus of the granular base layer.
        </li>

        <li>
          <strong>
            E<sub>subbase</sub>
          </strong>:
          Stiffness/modulus of the subbase layer.
        </li>

        <li>
          <strong>
            E<sub>subgrade</sub>
          </strong>:
          Stiffness/modulus of the subgrade.
        </li>

      </ul>


      <div className="target-box">

        <h3>
          🎯 AI Supervised Targets
        </h3>

        <p>
          The intended AI back-calculation targets are the
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


      {/* =====================================================
          4. ML VARIABLE MAPPING — AT THE END
      ====================================================== */}

      <h3 className="sub-title">
        ML Variable Mapping
      </h3>

      <p className="paragraph">
        The table below summarizes the important variables
        available in the dataset and their possible role in
        the planned machine learning back-calculation model.
      </p>


      <div className="ml-table-container">

        <table className="ml-variable-table">

          <thead>

            <tr>

              <th>
                Variable
              </th>

              <th>
                Meaning
              </th>

              <th>
                Category
              </th>

              <th>
                Possible role
              </th>

            </tr>

          </thead>


          <tbody>

            {/* TSD */}

            <tr>

              <td>
                <code>D0000</code>
              </td>

              <td>
                Central TSD deflection
              </td>

              <td>
                Structural response
              </td>

              <td className="input-role">
                Input
              </td>

            </tr>


            <tr>

              <td>
                <code>SCI300</code>
              </td>

              <td>
                Deflection curvature index
              </td>

              <td>
                Structural response
              </td>

              <td className="input-role">
                Input
              </td>

            </tr>


            <tr>

              <td>
                <code>SCI_sub</code>
              </td>

              <td>
                Substructure response
              </td>

              <td>
                Structural response
              </td>

              <td className="input-role">
                Input
              </td>

            </tr>


            {/* STRUCTURE */}

            <tr>

              <td>
                <code>Layer 1 thickness</code>
              </td>

              <td>
                Pavement layer thickness
              </td>

              <td>
                Structure
              </td>

              <td className="input-role">
                Input
              </td>

            </tr>


            <tr>

              <td>
                <code>Layer 2 thickness</code>
              </td>

              <td>
                Pavement layer thickness
              </td>

              <td>
                Structure
              </td>

              <td className="input-role">
                Input
              </td>

            </tr>


            <tr>

              <td>
                <code>Layer 3 thickness</code>
              </td>

              <td>
                Pavement layer thickness
              </td>

              <td>
                Structure
              </td>

              <td className="input-role">
                Input
              </td>

            </tr>


            {/* ENVIRONMENT */}

            <tr>

              <td>
                <code>BELLS_TEMP</code>
              </td>

              <td>
                Pavement temperature
              </td>

              <td>
                Environment
              </td>

              <td className="input-role">
                Input
              </td>

            </tr>


            <tr>

              <td>
                <code>PCIP_14_DAYS</code>
              </td>

              <td>
                14-day precipitation
              </td>

              <td>
                Environment / moisture
              </td>

              <td className="input-role">
                Input
              </td>

            </tr>


            <tr>

              <td>
                <code>Soil</code>
              </td>

              <td>
                Subgrade soil information
              </td>

              <td>
                Structure / environment
              </td>

              <td className="input-role">
                Input
              </td>

            </tr>


            <tr>

              <td>
                <code>Ditch depth</code>
              </td>

              <td>
                Drainage information
              </td>

              <td>
                Environment / drainage
              </td>

              <td className="input-role">
                Input
              </td>

            </tr>


            {/* TRAFFIC */}

            <tr>

              <td>
                <code>AADT</code>
              </td>

              <td>
                Average Annual Daily Traffic
              </td>

              <td>
                Traffic
              </td>

              <td className="input-role">
                Input
              </td>

            </tr>


            <tr>

              <td>
                <code>TAADT</code>
              </td>

              <td>
                Heavy-traffic AADT
              </td>

              <td>
                Traffic
              </td>

              <td className="input-role">
                Input
              </td>

            </tr>


            {/* TARGETS */}

            <tr>

              <td>
                <strong>E_AC</strong>
              </td>

              <td>
                AC layer modulus
              </td>

              <td>
                Layer characteristic
              </td>

              <td className="target-role">
                Target
              </td>

            </tr>


            <tr>

              <td>
                <strong>E_base</strong>
              </td>

              <td>
                Base layer modulus
              </td>

              <td>
                Layer characteristic
              </td>

              <td className="target-role">
                Target
              </td>

            </tr>


            <tr>

              <td>
                <strong>E_subbase</strong>
              </td>

              <td>
                Subbase layer modulus
              </td>

              <td>
                Layer characteristic
              </td>

              <td className="target-role">
                Target
              </td>

            </tr>


            <tr>

              <td>
                <strong>E_subgrade</strong>
              </td>

              <td>
                Subgrade modulus
              </td>

              <td>
                Layer characteristic
              </td>

              <td className="target-role">
                Target
              </td>

            </tr>

          </tbody>

        </table>

      </div>


    </section>

  );
}

export default VariableDefinitions;