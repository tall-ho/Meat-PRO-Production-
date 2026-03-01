#!/bin/bash

# Base URL for raw content
BASE_URL="https://raw.githubusercontent.com/t-all-dcc/MEAT-PRO-Production-/main"

# Download App.tsx
curl -s -o App.tsx "$BASE_URL/App.tsx"
echo "Downloaded App.tsx"

# Create components directory
mkdir -p components

# List of components to download
components=(
  "ConnectionScreen.tsx"
  "DailyProductionPlan.tsx"
  "DraggableModalWrapper.tsx"
  "EquipmentConfig.tsx"
  "MasterItems.tsx"
  "MixingPlan.tsx"
  "PermissionMatrix.tsx"
  "PlanFromPlanning.tsx"
  "ProductItemsConfig.tsx"
  "ProductMatrix.tsx"
  "ProductionPlan.tsx"
  "ProductionStandards.tsx"
  "ProductionTracking.tsx"
  "Sidebar.tsx"
  "UnplannedJobs.tsx"
)

# Download each component
for file in "${components[@]}"; do
  curl -s -o "components/$file" "$BASE_URL/components/$file"
  echo "Downloaded components/$file"
done

# Check for services directory in imports
grep -r "services/" .
