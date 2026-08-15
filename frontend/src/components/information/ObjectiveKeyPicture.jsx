import React from 'react';

function ObjectiveKeyPicture() {

  return (

    <section className="info-card">

      {/* =========================
          TITLE
      ========================== */}

      <h2>
        🎯 Objective & Key Picture
      </h2>


      {/* =========================
          OBJECTIVE
      ========================== */}

      <div className="objective-box">

        <h3>
          Project Objective
        </h3>

        <p>
          Develop an AI-based automated analytical
          back-calculation method to obtain real-time
          layer characteristics of a pavement structure,
          including AC layers, granular course layers
          and subgrade.
        </p>

      </div>


      {/* =========================
          KEY PICTURE
      ========================== */}

      <h3 className="sub-title">
        Key Picture
      </h3>


      <div className="structural-workflow">


        {/* =========================
            FIELD DATA
        ========================== */}

        <div className="workflow-title">
          FIELD DATA
        </div>


        <div className="workflow-arrow">
          ↓
        </div>


        {/* =========================
            THREE INPUT GROUPS
        ========================== */}

        <div className="workflow-inputs">


          {/* TSD */}

          <div className="workflow-box">

            <h3>
              TSD
            </h3>

            <p>
              D0000
            </p>

            <p>
              SCI300
            </p>

            <p>
              SCI_sub
            </p>

          </div>


          {/* STRUCTURE */}

          <div className="workflow-box">

            <h3>
              STRUCTURE
            </h3>

            <p>
              h₁, h₂, h₃
            </p>

            <p>
              Materials
            </p>

            <p>
              PMSv4
            </p>

          </div>


          {/* ENVIRONMENT */}

          <div className="workflow-box">

            <h3>
              ENVIRONMENT
            </h3>

            <p>
              Temperature
            </p>

            <p>
              Rain
            </p>

            <p>
              Soil
            </p>

            <p>
              Traffic
            </p>

          </div>

        </div>


        {/* =========================
            ERAPAVE
        ========================== */}

        <div className="workflow-arrow">
          ↓
        </div>


        <div className="workflow-box workflow-main">

          <h3>
            ERAPave / MLET
          </h3>

          <p>
            Structural calculations
          </p>

        </div>


        {/* =========================
            BACK CALCULATION
        ========================== */}

        <div className="workflow-arrow">
          ↓
        </div>


        <div className="workflow-box workflow-main">

          <h3>
            BACK-CALCULATION
          </h3>

          <p>
            Estimate pavement layer
            characteristics
          </p>

        </div>


        {/* =========================
            TARGETS
        ========================== */}

        <div className="workflow-arrow">
          ↓
        </div>


        <div className="workflow-targets">


          <div className="workflow-target">

            <strong>
              E_AC
            </strong>

            <span>
              AC layer
            </span>

          </div>


          <div className="workflow-target">

            <strong>
              E_base
            </strong>

            <span>
              Base layer
            </span>

          </div>


          <div className="workflow-target">

            <strong>
              E_subgrade
            </strong>

            <span>
              Subgrade
            </span>

          </div>


        </div>


        {/* =========================
            AI TARGET
        ========================== */}

        <div className="workflow-arrow">
          ↓
        </div>


        <div className="workflow-ai">

          <strong>
            AI TARGET
          </strong>

          <p>
            Predict pavement layer
            characteristics automatically
          </p>

        </div>

      </div>


    </section>

  );

}

export default ObjectiveKeyPicture;