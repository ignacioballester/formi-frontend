#!/bin/bash

# Script to generate API clients from OpenAPI specifications

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Generating IAM API client..."
pnpm openapi-generator-cli generate -i ../auth/identity_access_management/api/rest/spec/openapi.yaml \
  -g typescript-axios \
  -o lib/generated-api/iam \
  --additional-properties=usePromises=true,useRxJS=false,withInterfaces=true

echo "IAM API client generated."

echo "Generating Secret Manager API client..."
pnpm openapi-generator-cli generate -i ../auth/secret_management/api/rest/spec/openapi.yaml \
  -g typescript-axios \
  -o lib/generated-api/secret-manager \
  --additional-properties=usePromises=true,useRxJS=false,withInterfaces=true

echo "Secret Manager API client generated."

echo "Generating Core Formi API client..."
pnpm openapi-generator-cli generate -i ../backend/api/rest/spec/bundled.yaml \
  -g typescript-axios \
  -o lib/generated-api/core \
  --additional-properties=usePromises=true,useRxJS=false,withInterfaces=true

echo "Core Formi API client generated."

echo "Generating Runner API client..."
pnpm openapi-generator-cli generate -i ../runner/api/rest/spec/openapi.yaml \
  -g typescript-axios \
  -o lib/generated-api/runner \
  --additional-properties=usePromises=true,useRxJS=false,withInterfaces=true

echo "Runner API client generated."

echo "All API clients generated successfully!" 