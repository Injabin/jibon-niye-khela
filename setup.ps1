# Initialize Next.js app in a temporary folder
npx create-next-app@latest lifesim --typescript --tailwind --eslint --app --src-dir false --import-alias "@/*" --use-npm --yes

# Move files to root
Move-Item -Path lifesim\* -Destination .\ -Force
Move-Item -Path lifesim\.* -Destination .\ -Force
Remove-Item lifesim -Recurse -Force

# Set strict: true in tsconfig.json
$tsconfig = Get-Content tsconfig.json | ConvertFrom-Json
$tsconfig.compilerOptions.strict = $true
$tsconfig | ConvertTo-Json -Depth 10 | Set-Content tsconfig.json

# Install core dependencies
npm i zustand framer-motion howler idb-keyval
npm i -D vitest @vitest/ui @testing-library/react @playwright/test @vitejs/plugin-react jsdom

# Create folder structure
New-Item -ItemType Directory -Force -Path lib/engine/events/categories
New-Item -ItemType Directory -Force -Path lib/audio
New-Item -ItemType Directory -Force -Path lib/store
New-Item -ItemType Directory -Force -Path lib/save
New-Item -ItemType Directory -Force -Path content
New-Item -ItemType Directory -Force -Path components/ui
New-Item -ItemType Directory -Force -Path components/game
New-Item -ItemType Directory -Force -Path components/three
New-Item -ItemType Directory -Force -Path tests
New-Item -ItemType Directory -Force -Path public/audio
New-Item -ItemType Directory -Force -Path public/models
