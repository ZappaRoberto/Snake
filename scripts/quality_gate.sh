#!/bin/bash
set -e          # Esce se un comando ritorna errore
set -o pipefail # Intercetta errori anche dentro le pipe

# Colori per l'output (Aiutano l'AI a parsare i log)
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 STARTING QUALITY GATE...${NC}"

# 1. LINTING & FORMATTING
echo -e "\n${YELLOW}🔍 1. Linting & Formatting (Ruff)...${NC}"
# Usa --output-format=github per annotazioni migliori se supportato, o text standard
uv run ruff check .
uv run ruff format --check . || { echo -e "${RED}❌ Formatting failed. Run 'uv run ruff format .'${NC}"; exit 1; }

# 2. MODERN PATTERNS
echo -e "\n${YELLOW}🧠 2. Modern Python Patterns (Refurb)...${NC}"
uv run refurb .

# 3. ARCHITECTURE
echo -e "\n${YELLOW}🏗️ 3. Architectural Layers (Import Linter)...${NC}"
# Verifica se il file di config esiste per evitare errori falsi
if [ -f ".import-linter.ini" ]; then
    uv run lint-imports
else
    echo -e "${RED}⚠️  Skipping Import Linter: .import-linter.ini not found.${NC}"
fi

# 4. TYPE CHECKING
echo -e "\n${YELLOW}🛡️ 4. Type Checking (Ty)...${NC}"
uv run ty check

# 5. DEAD CODE & HYGIENE
echo -e "\n${YELLOW}💀 5. Dead Code & Hygiene...${NC}"
uv run deptry .
# Confidenza al 100% per evitare blocchi su falsi positivi
uv run vulture src/ --min-confidence 100

# 6. DOCUMENTATION
echo -e "\n${YELLOW}📚 6. Documentation Check...${NC}"
if [ -f "mkdocs.yml" ]; then
    uv run mkdocs build --strict
else
    echo "ℹ️  mkdocs.yml not found. Skipping docs build."
fi

# 7. SECURITY (Nuova versione con detect-secrets)
echo -e "\n${YELLOW}🔒 7. Security Scan (detect-secrets)...${NC}"

# Controlla se la baseline esiste
if [ ! -f ".secrets.baseline" ]; then
    echo -e "${RED}⚠️  .secrets.baseline not found! Generating a new one...${NC}"
    echo -e "${YELLOW}Please review the generated .secrets.baseline file and commit it.${NC}"
    uv run detect-secrets scan > .secrets.baseline
    # Facciamo fallire la build la prima volta per costringerti a controllare la baseline
    exit 1
fi

# Esegue la scansione su tutti i file tracciati da git
# Usa detect-secrets-hook che ritorna exit code 1 se trova NUOVI segreti rispetto alla baseline
uv run detect-secrets-hook --baseline .secrets.baseline $(git ls-files)

# 8. NO DEBUG LEFT BEHIND
echo -e "\n${YELLOW}🧹 8 Checking for leftover debug code (icecream)...${NC}"
# Cerca "ic(" o "from icecream" nei file .py in src/
if grep -rE "ic\(|from icecream" src/; then
    echo -e "${RED}❌ FAILED: Debug code found! Remove 'ic()' and 'icecream' imports before merging.${NC}"
    exit 1
else
    echo "✅ No debug leftovers found."
fi

# 9. TESTING
echo -e "\n${YELLOW}🧪 9. Testing (Pytest)...${NC}"
# Coverage minima 80%, fail fast, output corto
uv run pytest --cov=src --cov-fail-under=80 --maxfail=1 --tb=short -v

echo -e "\n${GREEN}✅ QUALITY GATE PASSED. CODE IS CLEAN.${NC}"