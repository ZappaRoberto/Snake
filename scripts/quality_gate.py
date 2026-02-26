import os
import subprocess
import sys
from pathlib import Path


def run_step(step_name, command, allow_fail=False):
    """Esegue un comando e gestisce l'errore per Claude Code."""
    print(f"\n🚀 Esecuzione: {step_name}...")

    # Eseguiamo il comando catturando l'output
    result = subprocess.run(command, capture_output=True, text=True)

    if result.returncode != 0 and not allow_fail:
        # Se fallisce, prepariamo il messaggio per Claude Code
        error_msg = (
            f"❌ FALLITO: {step_name}\n\n[OUTPUT]\n{result.stdout}\n\n[ERRORI]\n{result.stderr}"
        )

        # Stampiamo sullo standard error (quello che Claude legge)
        print(error_msg, file=sys.stderr)
        print(
            f"\n[CLAUDE CODE] Il Quality Gate si è bloccato su '{step_name}'. Analizza gli errori qui sopra e correggi il codice in autonomia, poi riprova.",
            file=sys.stderr,
        )

        # Uscita '2' per dire a Claude Code: "Non ti fermare, auto-correggi!"
        sys.exit(2)

    print(f"✅ PASSATO: {step_name}")
    return result


def check_debug_code():
    """Controlla la presenza di 'icecream' o 'ic(' nel codice."""
    print("\n🧹 Esecuzione: Checking for leftover debug code (icecream)...")
    src_dir = Path("src")
    if not src_dir.exists():
        return

    for file_path in src_dir.rglob("*.py"):
        try:
            content = file_path.read_text(encoding="utf-8")
            if "ic(" in content or "from icecream" in content:
                error_msg = f"❌ FALLITO: Codice di debug trovato nel file {file_path}!\nRimuovi gli import e le chiamate a 'ic()'."
                print(error_msg, file=sys.stderr)
                sys.exit(2)
        except Exception:
            pass
    print("✅ PASSATO: Nessun debug code trovato.")


def main():
    print("🌟 INIZIO QUALITY GATE NATIVO PYTHON 🌟")

    # 1. LINTING & FORMATTING
    run_step("Linting (Ruff Check)", ["uv", "run", "ruff", "check", "."])
    run_step("Formatting (Ruff Format)", ["uv", "run", "ruff", "format", "--check", "."])

    # 2. MODERN PATTERNS
    run_step("Modern Python Patterns (Refurb)", ["uv", "run", "refurb", "."])

    # 3. ARCHITECTURE
    if os.path.exists(".import-linter.ini"):
        run_step("Architectural Layers (Import Linter)", ["uv", "run", "lint-imports"])
    else:
        print("\n⚠️ Skipping Import Linter: .import-linter.ini not found.")

    # 4. TYPE CHECKING
    run_step("Type Checking (Ty)", ["uv", "run", "ty", "check"])

    # 5. DEAD CODE & HYGIENE
    run_step("Dead Code (Deptry)", ["uv", "run", "deptry", "."])
    run_step("Dead Code (Vulture)", ["uv", "run", "vulture", "src/", "--min-confidence", "100"])

    # 6. DOCUMENTATION
    if os.path.exists("mkdocs.yml"):
        run_step("Documentation Check", ["uv", "run", "mkdocs", "build", "--strict"])
    else:
        print("\nℹ️ mkdocs.yml not found. Skipping docs build.")

    # 7. SECURITY
    if not os.path.exists(".secrets.baseline"):
        print("\n⚠️ .secrets.baseline non trovato! Generazione in corso...", file=sys.stderr)
        # Genera la baseline
        with open(".secrets.baseline", "w") as f:
            subprocess.run(["uv", "run", "detect-secrets", "scan"], stdout=f)
        print(
            "❌ FALLITO: Generata nuova baseline per i segreti. Controllala, committala e poi riavvia il Quality Gate.",
            file=sys.stderr,
        )
        sys.exit(2)  # Diciamo a Claude di fermarsi e avvisarti

    # Esegue detect-secrets sui file tracciati da git
    git_files = subprocess.run(
        ["git", "ls-files"], capture_output=True, text=True
    ).stdout.splitlines()
    run_step(
        "Security Scan (detect-secrets)",
        ["uv", "run", "detect-secrets-hook", "--baseline", ".secrets.baseline"] + git_files,
    )

    # 8. NO DEBUG LEFT BEHIND
    check_debug_code()

    # 9. TESTING
    run_step(
        "Testing (Pytest)",
        [
            "uv",
            "run",
            "pytest",
            "--cov=src",
            "--cov-fail-under=80",
            "--maxfail=1",
            "--tb=short",
            "-v",
        ],
    )

    print("\n🎉 QUALITY GATE SUPERATO! IL CODICE È PERFETTO E PRONTO. 🎉")
    sys.exit(0)


if __name__ == "__main__":
    main()
