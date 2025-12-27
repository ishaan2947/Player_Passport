# Prompt Changelog

## V2 (2025-02-23)

### Changes from V1

**Structure & Clarity**
- Added visual section separators for better readability
- Reorganized rules into numbered list for unambiguous enforcement
- Added explicit "GOOD" vs "BAD" examples for key fields (strengths, growth_areas, trend_insights, key_metrics, next_2_weeks_focus)
- Added computation rules section with exact formulas and rounding rules

**Stronger Guardrails**
- Added rule: "NEVER use negative, discouraging, or harsh language about the player"
- Added rule: "Do NOT use emojis in any field" (cleaner output for web rendering)
- Made disclaimer requirement more explicit
- Strengthened college fit indicator language — explicitly listed banned phrases like "D1 Prospect"
- Added example labels for different player profiles (guard, wing, big)

**Better Output Quality**
- Growth areas now framed positively as opportunities, not weaknesses
- Required specific stat references in strengths (not vague praise)
- Trend insights must compare first-half vs second-half of game window
- Key metrics must include actionable context in notes
- Next 2 weeks focus must be specific and actionable (not generic)

**Drill Plan Improvements**
- Added position-specific drill guidance (guards vs wings vs bigs)
- Emphasized "no special equipment" requirement
- Required drills to be doable alone in a driveway or gym

**Motivational Message**
- Must speak directly to player ("you")
- Banned hype words: "game-changer", "unstoppable"
- Required reference to specific improvements from data

**Confidence Level**
- Made scoring criteria more precise
- HIGH requires 5+ games + shooting data + notes
- MEDIUM requires 3-4 games + minutes
- LOW when data is sparse

**Technical**
- Specified rounding: averages to 2 decimals, percentages to 1 decimal
- Made `minutes` nullable in per_game_summary (for games with no minutes tracked)
- Required per_game_summary to mirror input exactly

### Reasoning
V1 produced solid output but had room for vagueness. Key issues:
1. Strengths sometimes lacked stat backing ("great player")
2. Growth areas could sound harsh ("poor shooter")
3. Trend insights were sometimes too generic
4. Drills didn't always match player position
5. College fit labels sometimes too optimistic

V2 addresses all of these with concrete examples and stricter constraints while maintaining the friendly, parent-accessible tone.

## V1 (2024-12-28)
- Initial prompt version
- Basic schema with safety guardrails
- Confidence level logic
- NON-NEGOTIABLE safety rules
