# Deploy the backend to Google Cloud Run (free tier)

## One-time setup
1. Create a Google Cloud account: https://console.cloud.google.com (card needed, free tier applies).
2. Create a project, e.g. `pavement-moduli`.
3. Billing -> Budgets & alerts -> create a budget of 1 EUR with email alerts.
4. Install the Google Cloud CLI: https://cloud.google.com/sdk/docs/install
5. In a terminal:
       gcloud auth login
       gcloud config set project YOUR_PROJECT_ID
       gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

## Deploy (from the project root D:\THESIS\VTI)
    gcloud run deploy pavement-api --source . --region europe-north1 --allow-unauthenticated --memory 1Gi --cpu 1 --min-instances 0 --max-instances 2

- First time it asks to create an Artifact Registry repository: answer Y.
- When done it prints the URL, e.g. https://pavement-api-xxxxx.europe-north1.run.app
- Test: open <URL>/docs in the browser.

## Point the frontend to it
frontend/src/services/api.js:
    const PRODUCTION_API = 'https://pavement-api-xxxxx.europe-north1.run.app';
Push to GitHub -> Vercel redeploys.

## Update later
Run the same `gcloud run deploy ...` command again after retraining or changing the backend.

## Keep it free
- min-instances 0 (default): no cost while idle; first request after idle takes ~5-15 s.
- max-instances 2: limits cost if something calls it a lot.
- Delete old images now and then: Artifact Registry -> cloud-run-source-deploy.
