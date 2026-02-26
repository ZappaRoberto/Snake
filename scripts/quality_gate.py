import subprocess
import sys
from contextlib import suppress
from pathlib import Path


def run_step(step_name, command, allow_fail=False):
    """Executes a command and handles the exit code for Claude Code auto-healing."""
    print(f"\n🚀 Running: {step_name}...")

    # Execute the command capturing output, enforcing UTF-8 to prevent Windows crashes
    result = subprocess.run(
        command, capture_output=True, text=True, encoding="utf-8", errors="replace", check=False
    )

    if result.returncode != 0 and not allow_fail:
        # If it fails, prepare the exact message for Claude Code
        error_msg = (
            f"❌ FAILED: {step_name}\n\n[OUTPUT]\n{result.stdout}\n\n[ERRORS]\n{result.stderr}"
        )

        # Print to standard error (which Claude reads)
        print(error_msg, file=sys.stderr)
        blocked_at = step_name
        message = (
            f"\n[CLAUDE CODE] Quality Gate blocked at '{blocked_at}'. "
            "Analyze the errors above and fix the code autonomously."
        )
        print(message, file=sys.stderr)

        # Exit '2' tells Claude Code: "Do not stop, heal the code!"
        sys.exit(2)

    print(f"✅ PASSED: {step_name}")
    return result


def check_debug_code():
    """Checks for leftover 'icecream' or 'ic(' in the source code."""
    print("\n🧹 Running: Checking for leftover debug code (icecream)...")
    src_dir = Path("src")
    if not src_dir.exists():
        return

    for file_path in src_dir.rglob("*.py"):
        with suppress(Exception):
            content = file_path.read_text(encoding="utf-8")
            if "ic(" in content or "from icecream" in content:
                debug_msg = "❌ FAILED: Debug code found in"
                error_msg = f"{debug_msg} {file_path}! Remove imports and calls to ic()."
                print(error_msg, file=sys.stderr)
                sys.exit(2)
    print("✅ PASSED: No debug code found.")


def main():
    print("🌟 STARTING NATIVE PYTHON QUALITY GATE 🌟")

    # 1. LINTING, FORMATTING & SPELLING
    run_step("Linting (Ruff Check)", ["uv", "run", "ruff", "check", "."])
    run_step("Formatting (Ruff Format)", ["uv", "run", "ruff", "format", "--check", "."])
    run_step("Typo Checking (Codespell)", ["uv", "run", "codespell", "src/", "tests/"])

    if Path("package.json").exists() or Path("biome.json").exists():
        run_step("Frontend Linting (Biome)", ["pnpm", "biome", "check", "."])
    else:
        print("\nℹ️ package.json or biome.json not found. Skipping Biome.")

    # 2. MODERN PATTERNS & COMPLEXITY
    run_step("Modern Python Patterns (Refurb)", ["uv", "run", "refurb", "."])
    run_step(
        "Code Complexity (Xenon)",
        [
            "uv",
            "run",
            "xenon",
            "--max-absolute",
            "B",
            "--max-modules",
            "A",
            "--max-average",
            "A",
            "src/",
        ],
    )

    # 3. ARCHITECTURE
    if Path(".import-linter.ini").exists():
        run_step("Architectural Layers (Import Linter)", ["uv", "run", "lint-imports"])
    else:
        print("\n⚠️ Skipping Import Linter: .import-linter.ini not found.")

    # 4. TYPE CHECKING
    run_step("Type Checking (Ty)", ["uv", "run", "ty", "check"])

    # 5. DEAD CODE & HYGIENE
    run_step("Dead Code (Deptry)", ["uv", "run", "deptry", "."])
    run_step("Dead Code (Vulture)", ["uv", "run", "vulture", "src/", "--min-confidence", "100"])

    # 6. SECURITY
    run_step("Security AST Scan (Bandit)", ["uv", "run", "bandit", "-r", "src/", "-ll"])

    if not Path(".secrets.baseline").exists():
        print("\n⚠️ .secrets.baseline not found! Generating...", file=sys.stderr)
        with Path(".secrets.baseline").open("w") as f:
            subprocess.run(["uv", "run", "detect-secrets", "scan"], stdout=f, check=False)
        fail_msg = (
            "❌ FAILED: Generated new secrets baseline. "
            "Review it, commit it, and then restart the Quality Gate."
        )
        print(fail_msg, file=sys.stderr)
        sys.exit(2)

    git_result = subprocess.run(
        ["git", "ls-files"], capture_output=True, text=True, encoding="utf-8", check=False
    )
    # Write file list to temp file to avoid command line length limits on Windows
    with Path(".detect-secrets-files.tmp").open("w") as f:
        f.write(git_result.stdout)

    run_step(
        "Security Scan (detect-secrets)",
        [
            "uv",
            "run",
            "detect-secrets-hook",
            "--baseline",
            ".secrets.baseline",
            f"@{Path('.detect-secrets-files.tmp').absolute()}",
        ],
    )

    # Clean up temp file
    with suppress(Exception):
        Path(".detect-secrets-files.tmp").unlink()

    # 7. NO DEBUG LEFT BEHIND
    check_debug_code()

    # 8. TESTING
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

    # 9. DOCUMENTATION
    if Path("mkdocs.yml").exists():
        run_step("Documentation Check", ["uv", "run", "mkdocs", "build", "--strict"])
    else:
        print("\nℹ️ mkdocs.yml not found. Skipping docs build.")

    print("\n🎉 QUALITY GATE PASSED! THE CODE IS CLEAN AND READY. 🎉")
    sys.exit(0)


if __name__ == "__main__":
    main()
