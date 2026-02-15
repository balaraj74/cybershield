"""
CyberShield AI - Phishing Detection Module
=============================================
NLP-based phishing classifier and URL reputation scoring.

Features:
- URL structure analysis (typosquatting, homoglyphs)
- Domain reputation scoring
- Email content analysis for phishing indicators
- Attachment risk scoring
- Link safety analysis
"""

import re
import math
import hashlib
import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse, parse_qs
from dataclasses import dataclass, field, asdict

logger = logging.getLogger("cybershield.phishing")


# ============================================
# Known phishing indicators
# ============================================

PHISHING_KEYWORDS = {
    "urgent", "immediately", "verify your account", "suspended",
    "update your payment", "confirm your identity", "unusual activity",
    "security alert", "unauthorized access", "login attempt",
    "expire", "limited time", "act now", "click here",
    "dear customer", "dear user", "dear sir/madam",
    "won", "winner", "congratulations", "selected",
    "wire transfer", "western union", "bitcoin", "cryptocurrency",
    "Nigerian prince", "inheritance", "lottery",
}

SUSPICIOUS_TLDS = {
    ".xyz", ".top", ".wang", ".win", ".bid", ".loan",
    ".click", ".link", ".gdn", ".stream", ".racing",
    ".download", ".science", ".party", ".work", ".date",
    ".review", ".trade", ".accountant", ".cricket",
    ".faith", ".men", ".zip", ".mov",
}

BRAND_DOMAINS = {
    "google": "google.com", "gmail": "gmail.com",
    "microsoft": "microsoft.com", "outlook": "outlook.com",
    "apple": "apple.com", "icloud": "icloud.com",
    "amazon": "amazon.com", "aws": "aws.amazon.com",
    "paypal": "paypal.com", "facebook": "facebook.com",
    "instagram": "instagram.com", "twitter": "twitter.com",
    "netflix": "netflix.com", "linkedin": "linkedin.com",
    "dropbox": "dropbox.com", "github": "github.com",
    "slack": "slack.com", "zoom": "zoom.us",
    "bank": None,
}

HOMOGLYPH_MAP = {
    'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c',
    'у': 'y', 'х': 'x', 'і': 'i', 'ј': 'j', 'ɡ': 'g',
    '0': 'o', '1': 'l', '@': 'a', '$': 's', '!': 'i',
}


@dataclass 
class PhishingAnalysis:
    """Phishing analysis result"""
    analysis_id: str
    target: str              # URL or email address
    target_type: str         # url, email, domain
    is_phishing: bool
    confidence: float        # 0.0 - 1.0
    risk_level: str          # safe, suspicious, dangerous, phishing
    score: float             # 0-100 (0 = safe, 100 = definitely phishing)
    indicators: List[str]
    brand_impersonated: str = ""
    recommendation: str = ""
    details: Dict = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

    def to_dict(self):
        return asdict(self)


class PhishingDetector:
    """
    AI-powered phishing detection.
    
    Uses multiple signals:
    1. URL structure analysis
    2. Domain reputation scoring
    3. Brand impersonation detection
    4. Homoglyph/typosquatting detection
    5. Email content NLP analysis
    """

    def __init__(self):
        self._analysis_history: List[PhishingAnalysis] = []
        self._known_safe: set = set()
        self._known_phishing: set = set()
        logger.info("Phishing detector initialized")

    def analyze_url(self, url: str) -> PhishingAnalysis:
        """Analyze a URL for phishing indicators"""
        indicators = []
        score = 0.0

        try:
            parsed = urlparse(url if "://" in url else f"https://{url}")
        except Exception:
            return PhishingAnalysis(
                analysis_id=f"url-{hashlib.md5(url.encode()).hexdigest()[:8]}",
                target=url, target_type="url",
                is_phishing=False, confidence=0.5,
                risk_level="suspicious", score=50,
                indicators=["Could not parse URL"],
                recommendation="Avoid clicking this URL",
            )

        domain = parsed.hostname or ""
        path = parsed.path or ""
        query = parsed.query or ""

        # 1. Check IP-based URL
        if re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', domain):
            indicators.append("URL uses IP address instead of domain")
            score += 25

        # 2. Check suspicious TLDs
        for tld in SUSPICIOUS_TLDS:
            if domain.endswith(tld):
                indicators.append(f"Suspicious TLD: {tld}")
                score += 15
                break

        # 3. Check domain length (long domains = suspicious)
        if len(domain) > 30:
            indicators.append(f"Unusually long domain: {len(domain)} chars")
            score += 10

        # 4. Check for excessive subdomains
        subdomain_count = domain.count(".")
        if subdomain_count > 3:
            indicators.append(f"Excessive subdomains: {subdomain_count} levels")
            score += 15

        # 5. Check for brand impersonation
        brand = self._detect_brand_impersonation(domain)
        if brand:
            indicators.append(f"Possible {brand} impersonation")
            score += 30

        # 6. Check for homoglyphs
        homoglyphs = self._detect_homoglyphs(domain)
        if homoglyphs:
            indicators.append(f"Homoglyph characters detected: {homoglyphs}")
            score += 25

        # 7. Check for URL obfuscation
        if "@" in url.split("?")[0]:
            indicators.append("URL contains @ sign (credential harvesting)")
            score += 20

        # 8. Check for data: or javascript: URIs
        if parsed.scheme in ("data", "javascript"):
            indicators.append(f"Dangerous URI scheme: {parsed.scheme}")
            score += 40

        # 9. Check for encoded characters
        encoded_count = url.count("%")
        if encoded_count > 5:
            indicators.append(f"Heavy URL encoding: {encoded_count} encoded chars")
            score += 10

        # 10. Check for suspicious path patterns
        phishing_paths = ["/login", "/signin", "/verify", "/secure", "/account",
                          "/update", "/confirm", "/password", "/bank"]
        for pp in phishing_paths:
            if pp in path.lower():
                indicators.append(f"Suspicious path: {pp}")
                score += 5
                break

        # 11. Check HTTPS
        if parsed.scheme == "http":
            indicators.append("No HTTPS encryption")
            score += 10

        # 12. Check for URL shorteners
        shorteners = {"bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly"}
        if domain in shorteners:
            indicators.append("URL shortener detected (hiding destination)")
            score += 15

        # Determine risk level
        score = min(100, score)
        if score >= 70:
            risk_level = "phishing"
        elif score >= 45:
            risk_level = "dangerous"
        elif score >= 20:
            risk_level = "suspicious"
        else:
            risk_level = "safe"

        analysis = PhishingAnalysis(
            analysis_id=f"url-{hashlib.md5(url.encode()).hexdigest()[:8]}",
            target=url,
            target_type="url",
            is_phishing=score >= 60,
            confidence=min(1.0, score / 100 + 0.3),
            risk_level=risk_level,
            score=score,
            indicators=indicators,
            brand_impersonated=brand or "",
            recommendation=self._get_recommendation(risk_level),
            details={
                "domain": domain,
                "scheme": parsed.scheme,
                "path": path,
                "has_query": bool(query),
            },
        )

        self._analysis_history.append(analysis)
        return analysis

    def analyze_email(self, subject: str = "", body: str = "",
                     sender: str = "", links: List[str] = None) -> PhishingAnalysis:
        """Analyze email content for phishing"""
        indicators = []
        score = 0.0
        text = f"{subject} {body}".lower()

        # 1. Check phishing keywords
        keywords_found = []
        for keyword in PHISHING_KEYWORDS:
            if keyword.lower() in text:
                keywords_found.append(keyword)
                score += 5

        if keywords_found:
            indicators.append(f"Phishing keywords: {', '.join(keywords_found[:5])}")

        # Cap keyword score
        score = min(score, 30)

        # 2. Check urgency patterns
        urgency_patterns = [
            r"within\s+\d+\s+(hour|minute|day)",
            r"before\s+\d{1,2}[:/]\d{2}",
            r"immediately",
            r"right\s+now",
            r"asap",
        ]
        for pattern in urgency_patterns:
            if re.search(pattern, text):
                indicators.append("Creates sense of urgency")
                score += 10
                break

        # 3. Check sender domain
        if sender:
            sender_domain = sender.split("@")[-1] if "@" in sender else ""
            if sender_domain:
                brand = self._detect_brand_impersonation(sender_domain)
                if brand:
                    indicators.append(f"Sender impersonates {brand}")
                    score += 25

        # 4. Check embedded links
        link_scores = []
        if links:
            for link in links[:5]:
                link_analysis = self.analyze_url(link)
                link_scores.append(link_analysis.score)
                if link_analysis.score > 40:
                    indicators.append(f"Suspicious link: {link[:60]}")

            if link_scores:
                max_link_score = max(link_scores)
                score += max_link_score * 0.3

        # 5. Check for generic greeting
        if re.search(r"dear\s+(customer|user|sir|madam|account\s+holder)", text):
            indicators.append("Generic greeting (not personalized)")
            score += 10

        # 6. Grammar/spelling issues (simple heuristic)
        grammar_issues = [
            r"kindly\s+do", r"your\s+esteemed", r"please\s+to\s+be",
            r"the\s+below\s+link", r"click\s+on\s+below",
        ]
        for pattern in grammar_issues:
            if re.search(pattern, text):
                indicators.append("Poor grammar (common in phishing)")
                score += 8
                break

        score = min(100, score)
        if score >= 60:
            risk_level = "phishing"
        elif score >= 35:
            risk_level = "dangerous"
        elif score >= 15:
            risk_level = "suspicious"
        else:
            risk_level = "safe"

        analysis = PhishingAnalysis(
            analysis_id=f"email-{hashlib.md5(text[:100].encode()).hexdigest()[:8]}",
            target=sender or subject[:50],
            target_type="email",
            is_phishing=score >= 50,
            confidence=min(1.0, score / 100 + 0.2),
            risk_level=risk_level,
            score=score,
            indicators=indicators,
            recommendation=self._get_recommendation(risk_level),
            details={
                "subject": subject[:100],
                "sender": sender,
                "link_count": len(links or []),
                "keywords_found": len(keywords_found),
            },
        )

        self._analysis_history.append(analysis)
        return analysis

    def _detect_brand_impersonation(self, domain: str) -> Optional[str]:
        """Detect if domain is impersonating a known brand"""
        domain_lower = domain.lower()

        for brand, legit_domain in BRAND_DOMAINS.items():
            if legit_domain and domain_lower == legit_domain:
                continue  # Legitimate domain
            if brand in domain_lower and (legit_domain is None or domain_lower != legit_domain):
                # Check it's not a legitimate subdomain
                if legit_domain and not domain_lower.endswith(f".{legit_domain}"):
                    return brand

        return None

    def _detect_homoglyphs(self, domain: str) -> Optional[str]:
        """Detect homoglyph (look-alike) characters"""
        found = []
        for char, latin in HOMOGLYPH_MAP.items():
            if char in domain:
                found.append(f"'{char}' looks like '{latin}'")

        return "; ".join(found) if found else None

    def _get_recommendation(self, risk_level: str) -> str:
        """Get user-friendly recommendation"""
        recs = {
            "safe": "This appears safe, but always exercise caution",
            "suspicious": "Proceed with caution – verify through official channels",
            "dangerous": "High risk – do not click links or provide information",
            "phishing": "⚠️ PHISHING DETECTED – do not interact, report this",
        }
        return recs.get(risk_level, "Exercise caution")

    def get_analysis_history(self, limit: int = 50) -> List[Dict]:
        """Get recent analyses"""
        return [a.to_dict() for a in self._analysis_history[-limit:]]

    def get_stats(self) -> Dict:
        """Get detection statistics"""
        total = len(self._analysis_history)
        phishing = sum(1 for a in self._analysis_history if a.is_phishing)
        return {
            "total_analyzed": total,
            "phishing_detected": phishing,
            "safe_count": total - phishing,
            "detection_rate": phishing / total if total > 0 else 0,
            "by_type": {
                "url": sum(1 for a in self._analysis_history if a.target_type == "url"),
                "email": sum(1 for a in self._analysis_history if a.target_type == "email"),
            },
        }


# Singleton
_detector = None


def get_phishing_detector() -> PhishingDetector:
    global _detector
    if _detector is None:
        _detector = PhishingDetector()
    return _detector
