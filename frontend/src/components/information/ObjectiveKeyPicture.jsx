import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
} from "@mui/material";

import {
  Input,
  Calculate,
  CompareArrows,
  ModelTraining,
  Memory,
  Timeline,
  TrendingUp,
  CheckCircle,
} from "@mui/icons-material";

function StageHeader({ number, title, subtitle }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.2,
          mb: 0.5,
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "0.9rem",
            bgcolor: "#1976d2",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {number}
        </Box>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: "#17324d",
          }}
        >
          {title}
        </Typography>
      </Box>

      <Typography
        variant="body2"
        sx={{
          color: "#607080",
          ml: 5.5,
        }}
      >
        {subtitle}
      </Typography>
    </Box>
  );
}

function FlowArrow({ label }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 48,
        py: 0.5,
      }}
    >
      {label && (
        <Typography
          variant="caption"
          sx={{
            color: "#607080",
            fontWeight: 600,
            mb: 0.2,
            textAlign: "center",
          }}
        >
          {label}
        </Typography>
      )}

      <Box
        sx={{
          width: 2,
          height: 28,
          bgcolor: "#90a4ae",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            bottom: -1,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "8px solid #90a4ae",
          }}
        />
      </Box>
    </Box>
  );
}

function FlowBox({
  icon,
  title,
  children,
  background = "#f8fafc",
  border = "#d8e1e8",
}) {
  return (
    <Card
      elevation={0}
      sx={{
        width: "100%",
        border: `1px solid ${border}`,
        borderRadius: 2,
        background,
      }}
    >
      <CardContent sx={{ p: 2.2, "&:last-child": { pb: 2.2 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#1976d2",
            }}
          >
            {icon}
          </Box>

          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: "#17324d",
            }}
          >
            {title}
          </Typography>
        </Box>

        {children}
      </CardContent>
    </Card>
  );
}

function ObjectiveKeyPicture() {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1200,
        mx: "auto",
        px: { xs: 1, md: 2 },
        py: 3,
      }}
    >
      {/* OBJECTIVE */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border: "1px solid #d7e3ed",
          background:
            "linear-gradient(135deg, #f5f9fd 0%, #ffffff 100%)",
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Typography
            variant="overline"
            sx={{
              color: "#1976d2",
              fontWeight: 700,
              letterSpacing: 1.2,
            }}
          >
            PROJECT OBJECTIVE
          </Typography>

          <Typography
            variant="h5"
            sx={{
              mt: 0.5,
              mb: 1.5,
              fontWeight: 800,
              color: "#17324d",
            }}
          >
            Develop a data-driven pavement structural Digital Twin
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#455a64",
              lineHeight: 1.7,
              maxWidth: 1050,
            }}
          >
            The project combines measured TSD data, pavement structure,
            ERAPave back-calculation and machine learning to estimate
            pavement layer stiffness. These results are used to establish
            and update a Digital Twin that can represent the current
            structural condition of the pavement and support future
            structural-response prediction and maintenance decisions.
          </Typography>
        </CardContent>
      </Card>

      {/* COMPLETE PROJECT FLOW */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border: "1px solid #d7e3ed",
          background: "#ffffff",
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: "#17324d",
              mb: 0.5,
            }}
          >
            Complete Project Flow
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "#607080",
              mb: 3,
            }}
          >
            From measured pavement response to machine learning,
            Digital Twin updating and future structural prediction.
          </Typography>

          {/* STAGE 1 */}
          <StageHeader
            number="1"
            title="Back-Calculation — Establish Structural State"
            subtitle="Use measured pavement response to determine layer stiffness through iterative ERAPave calculations."
          />

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              maxWidth: 760,
              mx: "auto",
            }}
          >
            <FlowBox
              icon={<Input />}
              title="Known Field Inputs"
              background="#f8fbff"
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 1fr",
                  },
                  gap: 1,
                }}
              >
                {[
                  "h₁, h₂, h₃ — layer thicknesses",
                  "Loading / wheel load",
                  "Poisson ratios",
                  "Measured D0000",
                  "Measured SCI300",
                  "Temperature / conditions",
                ].map((item) => (
                  <Typography
                    key={item}
                    variant="body2"
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      bgcolor: "#eef5fb",
                      color: "#455a64",
                    }}
                  >
                    {item}
                  </Typography>
                ))}
              </Box>
            </FlowBox>

            <FlowArrow label="Initial trial E₁, MR₂, MR₃, MR₄" />

            <FlowBox
              icon={<Calculate />}
              title="ERAPave — Forward Calculation"
              background="#f5faff"
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#455a64",
                  lineHeight: 1.6,
                }}
              >
                ERAPave receives the pavement geometry, loading conditions
                and trial layer stiffness values:
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  fontWeight: 700,
                  color: "#1976d2",
                  textAlign: "center",
                }}
              >
                E₁, MR₂, MR₃, MR₄ → calculated D0000 and SCI300
              </Typography>
            </FlowBox>

            <FlowArrow label="Compare" />

            <FlowBox
              icon={<CompareArrows />}
              title="Compare Calculated vs Measured Response"
              background="#fffaf2"
              border="#ead8b4"
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 1fr",
                  },
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    p: 1.2,
                    borderRadius: 1,
                    bgcolor: "#fff4dc",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: "#795548" }}
                  >
                    D0000
                  </Typography>

                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Calculated ↔ Measured
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 1.2,
                    borderRadius: 1,
                    bgcolor: "#fff4dc",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: "#795548" }}
                  >
                    SCI300
                  </Typography>

                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Calculated ↔ Measured
                  </Typography>
                </Box>
              </Box>
            </FlowBox>

            <FlowArrow label="If error is too large → adjust E₁, MR₂, MR₃, MR₄" />

            <FlowBox
              icon={<CheckCircle />}
              title="Converged Structural State"
              background="#f3faf5"
              border="#c8dfcf"
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#455a64",
                  lineHeight: 1.6,
                }}
              >
                Iterate until the calculated response agrees with the
                measured TSD response within the selected tolerance.
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  fontWeight: 700,
                  color: "#2e7d32",
                  textAlign: "center",
                }}
              >
                E₁, MR₂, MR₃, MR₄ → Back-calculated structural dataset
              </Typography>
            </FlowBox>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* STAGE 2 */}
          <StageHeader
            number="2"
            title="TPIS / Machine Learning Model Development"
            subtitle="Learn the relationship between field observations and the structural stiffness obtained from back-calculation."
          />

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              maxWidth: 760,
              mx: "auto",
            }}
          >
            <FlowBox
              icon={<ModelTraining />}
              title="Training Dataset"
              background="#faf7ff"
              border="#ddd2ec"
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#455a64",
                  lineHeight: 1.6,
                }}
              >
                Field measurements and pavement information are combined
                with the E₁, MR₂, MR₃, MR₄ values obtained from Stage 1.
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  fontWeight: 700,
                  color: "#6a1b9a",
                  textAlign: "center",
                }}
              >
                X = field / pavement features
                <br />
                Y = E₁, MR₂, MR₃, MR₄
              </Typography>
            </FlowBox>

            <FlowArrow label="Train" />

            <FlowBox
              icon={<ModelTraining />}
              title="Trained TPIS / ML Model"
              background="#faf7ff"
              border="#ddd2ec"
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#455a64",
                  lineHeight: 1.6,
                }}
              >
                The model learns to estimate pavement layer stiffness
                directly from available field and structural information,
                avoiding a full ERAPave back-calculation for every new
                section.
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  fontWeight: 700,
                  color: "#6a1b9a",
                  textAlign: "center",
                }}
              >
                New pavement data → ML → estimated E₁, MR₂, MR₃, MR₄
              </Typography>
            </FlowBox>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* STAGE 3 */}
          <StageHeader
            number="3"
            title="Digital Twin — State Initialization and Updating"
            subtitle="Represent the physical pavement digitally and update its structural state when new field observations become available."
          />

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              maxWidth: 900,
              mx: "auto",
            }}
          >
            <FlowBox
              icon={<Memory />}
              title="Digital Twin — Initial Structural State"
              background="#f3f9f8"
              border="#c8dfdb"
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#455a64",
                  lineHeight: 1.6,
                }}
              >
                The Digital Twin is initialized using the structural
                information obtained from Stage 1 and/or stiffness estimates
                produced by the trained ML model in Stage 2.
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  fontWeight: 700,
                  color: "#00796b",
                  textAlign: "center",
                }}
              >
                Digital Twin state = geometry + E₁, MR₂, MR₃, MR₄ + conditions
              </Typography>
            </FlowBox>

            <FlowArrow label="New survey / new TSD observation" />

            <FlowBox
              icon={<Timeline />}
              title="New Field Observation"
              background="#f8fbff"
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#455a64",
                  lineHeight: 1.6,
                }}
              >
                A later TSD survey provides new measured structural
                responses such as D0000 and SCI300, together with updated
                pavement and environmental information.
              </Typography>
            </FlowBox>

            <FlowArrow label="Update the Digital Twin" />

            <Box
              sx={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "1fr 1fr",
                },
                gap: 2,
              }}
            >
              <FlowBox
                icon={<Calculate />}
                title="Option A — ERAPave Iterative Updating"
                background="#fffaf2"
                border="#ead8b4"
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "#455a64",
                    lineHeight: 1.6,
                  }}
                >
                  Use the previous Digital Twin state as the starting
                  stiffness estimate. Run ERAPave forward, compare the
                  calculated response with the new TSD response, and
                  iteratively adjust E₁, MR₂, MR₃, MR₄.
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    mt: 1.2,
                    fontWeight: 700,
                    color: "#8d6e00",
                    textAlign: "center",
                  }}
                >
                  New TSD → ERAPave → adjust E₁, MR₂, MR₃, MR₄ → agreement
                </Typography>
              </FlowBox>

              <FlowBox
                icon={<ModelTraining />}
                title="Option B — ML-Based DT Updating"
                background="#faf7ff"
                border="#ddd2ec"
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "#455a64",
                    lineHeight: 1.6,
                  }}
                >
                  Use the trained ML/TPIS model to estimate the new
                  structural state directly from the new field data.
                  The estimated E₁, MR₂, MR₃, MR₄ values are then used to update the
                  Digital Twin.
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    mt: 1.2,
                    fontWeight: 700,
                    color: "#6a1b9a",
                    textAlign: "center",
                  }}
                >
                  New TSD → ML → new E₁, MR₂, MR₃, MR₄ → update DT
                </Typography>
              </FlowBox>
            </Box>

            <FlowArrow label="Updated structural state" />

            <FlowBox
              icon={<Memory />}
              title="Updated Digital Twin"
              background="#f3f9f8"
              border="#c8dfdb"
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#455a64",
                  lineHeight: 1.6,
                }}
              >
                The Digital Twin now represents the latest estimated
                structural condition of the physical pavement.
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  fontWeight: 700,
                  color: "#00796b",
                  textAlign: "center",
                }}
              >
                Updated E₁, MR₂, MR₃, MR₄ + pavement state + environmental conditions
              </Typography>
            </FlowBox>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* STAGE 4 */}
          <StageHeader
            number="4"
            title="Future Prediction and Decision Support"
            subtitle="Use the updated Digital Twin to understand future pavement structural behaviour and support maintenance planning."
          />

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              maxWidth: 760,
              mx: "auto",
            }}
          >
            <FlowBox
              icon={<TrendingUp />}
              title="Forward Prediction"
              background="#f5faff"
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#455a64",
                  lineHeight: 1.6,
                }}
              >
                The updated Digital Twin can be evaluated under future
                traffic, temperature and environmental scenarios to
                estimate future structural response.
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  fontWeight: 700,
                  color: "#1976d2",
                  textAlign: "center",
                }}
              >
                Updated DT + future conditions → predicted response
              </Typography>
            </FlowBox>

            <FlowArrow label="Evaluate deterioration / condition" />

            <FlowBox
              icon={<CheckCircle />}
              title="Maintenance & Decision Support"
              background="#f3faf5"
              border="#c8dfcf"
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#455a64",
                  lineHeight: 1.6,
                }}
              >
                Predicted structural response and deterioration trends can
                support identification of sections that may require
                further investigation, maintenance or rehabilitation.
              </Typography>
            </FlowBox>
          </Box>

          {/* SUMMARY */}
          <Box
            sx={{
              mt: 4,
              p: 2.5,
              borderRadius: 2,
              bgcolor: "#f5f7fa",
              border: "1px solid #e0e6eb",
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                color: "#17324d",
                mb: 1,
              }}
            >
              Overall Logic
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "#455a64",
                lineHeight: 1.8,
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              Field Data
              {" → "}
              ERAPave Back-Calculation
              {" → "}
              E₁, MR₂, MR₃, MR₄ Dataset
              {" → "}
              TPIS / ML
              {" → "}
              Digital Twin
              {" → "}
              DT Updating
              {" → "}
              Future Prediction
              {" → "}
              Maintenance Decision
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ObjectiveKeyPicture;