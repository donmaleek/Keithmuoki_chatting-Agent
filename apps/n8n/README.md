# n8n Workflows

This folder holds n8n workflow exports used as the primary automation layer.

Import the JSON files into n8n to activate them.

## Workflows
- ingest-message-workflow.json: webhook to backend message ingest
- ai-respond-workflow.json: webhook to backend AI respond
- stripe-webhook-workflow.json: webhook to backend Stripe handler
- paystack-webhook-workflow.json: webhook to backend Paystack handler

## Required n8n env vars
- BACKEND_URL (example: http://localhost:3001)
