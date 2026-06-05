def analyze_candidate(candidate_skills, required_skills):
    candidate = {s.lower() for s in candidate_skills}
    required = {s.lower() for s in required_skills}

    matched = sorted(candidate & required)
    missing = sorted(required - candidate)

    score = 50 if not required else round(len(matched) / len(required) * 100)

    return {
        'score': score,
        'matched_skills': matched,
        'missing_skills': missing,
        'summary': f'Matched {len(matched)} skills from {len(required)} required.',
        'recommendation': 'Interview' if score >= 70 else 'Screening'
    }
