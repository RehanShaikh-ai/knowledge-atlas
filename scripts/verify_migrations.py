#!/usr/bin/env python3
"""Alembic migration and schema verification utility.

Verifies that:
1. Alembic script directory is valid and reachable.
2. Migration history is linear with no branching/multiple heads.
3. Current head matches expected target revision (0003 for v0.2.2).
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from alembic import script  # noqa: E402
from alembic.config import Config  # noqa: E402


def verify_alembic_heads() -> None:
    alembic_ini = BACKEND_DIR / "alembic.ini"
    if not alembic_ini.exists():
        print(f"ERROR: Alembic config file missing at {alembic_ini}")
        sys.exit(1)

    cfg = Config(str(alembic_ini))
    scr = script.ScriptDirectory.from_config(cfg)
    heads = scr.get_heads()

    print("=== Alembic Migration Verification ===")
    print(f"Config path: {alembic_ini}")
    print(f"Current migration heads: {heads}")

    if not heads:
        print("ERROR: No migration revisions found!")
        sys.exit(1)

    if len(heads) > 1:
        print(f"ERROR: Multiple heads detected! {heads}")
        sys.exit(1)

    expected_head = "0003"
    if heads[0] != expected_head:
        print(f"ERROR: Current head {heads[0]} does not match expected {expected_head}")
        sys.exit(1)

    print(f"SUCCESS: Migration head verified at {expected_head} (v0.2.2 Knowledge Expansion)")


if __name__ == "__main__":
    verify_alembic_heads()
