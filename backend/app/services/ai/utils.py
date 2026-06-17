"""Utility functions for AI services."""


def normalize_skill(skill: str) -> str:
    """Normalize skill name for comparison.
    
    Args:
        skill: Raw skill string
        
    Returns:
        Normalized skill name (lowercase, stripped)
    """
    return skill.strip().lower()
