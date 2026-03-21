"""Shared constants for Player Passport API."""

# Report generation
REPORT_POLL_INTERVAL_SECONDS = 2
REPORT_MAX_WAIT_SECONDS = 120

# Player limits
MAX_PLAYERS_PER_USER = 50
MAX_GAMES_PER_PLAYER = 500

# Stat bounds (used for input validation)
MAX_POINTS = 100
MAX_REBOUNDS = 50
MAX_ASSISTS = 30
MAX_STEALS = 15
MAX_BLOCKS = 15
MAX_TURNOVERS = 20
MAX_MINUTES = 48

# Seed data
DEMO_SEED_USER_ID = "user_seed_001"
DEMO_SEED_EMAIL = "dev@playerpassport.app"
