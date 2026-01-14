"""
CyberShield AI - Threat Analyzer Service
AI-powered threat detection with explainable outputs
"""
import re
import hashlib
import uuid
from datetime import datetime
from typing import Optional
import random

from schemas import (
    AnalyzeRequest, AnalyzeResponse, ThreatIndicator, 
    ExplanationSection, RiskContribution, ThreatType, SeverityLevel
)
from config import get_settings


class ThreatAnalyzer:
    """
    AI-powered threat analysis engine.
    In production, this would use transformer models for classification.
    For hackathon, uses rule-based + heuristic approach with realistic outputs.
    """
    
    # Threat detection patterns
    PHISHING_KEYWORDS = [
        "urgent", "immediately", "verify", "suspended", "unusual activity",
        "click here", "confirm your", "update your", "expires", "limited time",
        "act now", "don't delay", "final notice", "account will be",
        "security alert", "unauthorized", "compromised", "locked"
    ]
    
    CREDENTIAL_PATTERNS = [
        r"password", r"login", r"username", r"ssn", r"social security",
        r"credit card", r"bank account", r"routing number", r"pin",
        r"cvv", r"expir(e|ation|y)", r"billing"
    ]
    
    SUSPICIOUS_URL_PATTERNS = [
        r"bit\.ly", r"tinyurl", r"goo\.gl", r"t\.co",  # URL shorteners
        r"\d+\.\d+\.\d+\.\d+",  # IP addresses
        r"[a-z0-9]+-[a-z0-9]+-[a-z0-9]+\.",  # Random subdomains
        r"\.tk$", r"\.ml$", r"\.ga$", r"\.cf$",  # Free domains
        r"login|signin|verify|secure|account|update",  # Suspicious paths
        r"\.php\?", r"\.asp\?",  # Query parameters
    ]
    
    SOCIAL_ENGINEERING_PHRASES = [
        "you have won", "congratulations", "selected", "lucky winner",
        "million dollars", "lottery", "inheritance", "prince",
        "wire transfer", "western union", "money gram", "bitcoin",
        "gift card", "itunes", "amazon card"
    ]
    
    def __init__(self):
        self.settings = get_settings()
        self.model_version = "1.0.0"
    
    async def analyze(self, request: AnalyzeRequest) -> AnalyzeResponse:
        """
        Main analysis entry point.
        Routes to appropriate analyzer based on input type.
        """
        start_time = datetime.utcnow()
        content_lower = request.content.lower()
        
        # Route to specific analyzer
        if request.type == "email":
            result = await self._analyze_email(request.content, content_lower)
        elif request.type == "url":
            result = await self._analyze_url(request.content, content_lower)
        else:  # message
            result = await self._analyze_message(request.content, content_lower)
        
        # Calculate processing time
        processing_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        # Build response
        return AnalyzeResponse(
            id=str(uuid.uuid4()),
            threatType=result["threat_type"],
            severity=result["severity"],
            riskScore=result["risk_score"],
            confidence=result["confidence"],
            summary=result["summary"],
            explanation=result["explanation"],
            indicators=result["indicators"],
            recommendations=result["recommendations"],
            riskContributions=result["risk_contributions"],
            analyzedAt=datetime.utcnow().isoformat() + "Z",
            inputHash=request.get_content_hash()[:16],  # Truncated for display
            processingTimeMs=processing_time,
            modelVersion=self.model_version,
            falsePositiveLikelihood=self._get_fp_likelihood(result["confidence"])
        )
    
    async def _analyze_email(self, content: str, content_lower: str) -> dict:
        """Analyze email content for phishing and threats"""
        indicators = []
        risk_contributions = []
        explanations = []
        total_risk = 0
        
        # Check for phishing keywords
        found_keywords = []
        for keyword in self.PHISHING_KEYWORDS:
            if keyword in content_lower:
                found_keywords.append(keyword)
        
        if found_keywords:
            risk_add = min(len(found_keywords) * 8, 40)
            total_risk += risk_add
            for kw in found_keywords[:5]:  # Limit to 5
                indicators.append(ThreatIndicator(
                    type="keyword",
                    value=f'"{kw}"',
                    riskContribution=8,
                    description=f"Urgency/pressure language commonly used in phishing"
                ))
            risk_contributions.append(RiskContribution(
                label="Urgency Language",
                value=risk_add,
                category="keywords"
            ))
            explanations.append(ExplanationSection(
                title="Urgency & Pressure Tactics",
                content=f"Detected {len(found_keywords)} phrases designed to create urgency and bypass critical thinking. Phishing emails often pressure victims to act quickly.",
                severity="high" if len(found_keywords) > 3 else "medium",
                indicators=indicators[:3]
            ))
        
        # Check for credential requests
        cred_matches = []
        for pattern in self.CREDENTIAL_PATTERNS:
            if re.search(pattern, content_lower):
                cred_matches.append(pattern)
        
        if cred_matches:
            risk_add = min(len(cred_matches) * 10, 30)
            total_risk += risk_add
            indicators.append(ThreatIndicator(
                type="pattern",
                value="Credential request detected",
                riskContribution=15,
                description="Email requests sensitive information like passwords or financial data"
            ))
            risk_contributions.append(RiskContribution(
                label="Credential Harvesting",
                value=risk_add,
                category="patterns"
            ))
            explanations.append(ExplanationSection(
                title="Credential Harvesting Attempt",
                content="This email requests sensitive credentials or personal information. Legitimate organizations never request passwords or full account details via email.",
                severity="critical",
                indicators=None
            ))
        
        # Check for suspicious URLs
        url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
        urls = re.findall(url_pattern, content)
        suspicious_urls = []
        
        for url in urls:
            for pattern in self.SUSPICIOUS_URL_PATTERNS:
                if re.search(pattern, url.lower()):
                    suspicious_urls.append(url)
                    break
        
        if suspicious_urls:
            risk_add = min(len(suspicious_urls) * 15, 35)
            total_risk += risk_add
            for url in suspicious_urls[:3]:
                # Mask the URL for privacy
                masked_url = self._mask_url(url)
                indicators.append(ThreatIndicator(
                    type="url",
                    value=masked_url,
                    riskContribution=15,
                    description="URL contains suspicious patterns associated with phishing"
                ))
            risk_contributions.append(RiskContribution(
                label="Suspicious Links",
                value=risk_add,
                category="urls"
            ))
            explanations.append(ExplanationSection(
                title="Suspicious URLs Detected",
                content=f"Found {len(suspicious_urls)} URL(s) with patterns commonly used in phishing attacks, including URL shorteners, IP addresses, or deceptive domains.",
                severity="high",
                indicators=None
            ))
        
        # Check for social engineering
        social_matches = []
        for phrase in self.SOCIAL_ENGINEERING_PHRASES:
            if phrase in content_lower:
                social_matches.append(phrase)
        
        if social_matches:
            risk_add = min(len(social_matches) * 12, 25)
            total_risk += risk_add
            indicators.append(ThreatIndicator(
                type="behavioral",
                value="Social engineering tactics",
                riskContribution=risk_add,
                description="Content uses manipulation techniques to gain trust or trigger emotional response"
            ))
            risk_contributions.append(RiskContribution(
                label="Social Engineering",
                value=risk_add,
                category="behavioral"
            ))
        
        # Determine threat type and severity
        if total_risk >= 70:
            threat_type = "phishing" if found_keywords or suspicious_urls else "social_engineering"
            severity = "critical"
        elif total_risk >= 50:
            threat_type = "phishing" if suspicious_urls else "spam"
            severity = "high"
        elif total_risk >= 30:
            threat_type = "spam"
            severity = "medium"
        elif total_risk >= 15:
            threat_type = "unknown"
            severity = "low"
        else:
            threat_type = "safe"
            severity = "safe"
        
        # Generate summary
        summary = self._generate_summary(threat_type, severity, total_risk, len(indicators))
        
        # Generate recommendations
        recommendations = self._get_recommendations(threat_type, severity)
        
        # Calculate confidence based on indicator strength
        confidence = min(60 + len(indicators) * 5 + (total_risk // 5), 98)
        
        return {
            "threat_type": threat_type,
            "severity": severity,
            "risk_score": min(total_risk, 100),
            "confidence": confidence,
            "summary": summary,
            "explanation": explanations if explanations else [
                ExplanationSection(
                    title="Analysis Complete",
                    content="No significant threat indicators were detected in this content.",
                    severity="safe",
                    indicators=None
                )
            ],
            "indicators": indicators,
            "recommendations": recommendations,
            "risk_contributions": risk_contributions
        }
    
    async def _analyze_url(self, content: str, content_lower: str) -> dict:
        """Analyze URL for threats"""
        indicators = []
        risk_contributions = []
        explanations = []
        total_risk = 0
        
        url = content.strip()
        
        # Check for IP address
        if re.search(r'\d+\.\d+\.\d+\.\d+', url):
            total_risk += 30
            indicators.append(ThreatIndicator(
                type="url",
                value="IP-based URL",
                riskContribution=30,
                description="URL uses IP address instead of domain name - common in phishing"
            ))
            risk_contributions.append(RiskContribution(
                label="IP-based URL",
                value=30,
                category="urls"
            ))
        
        # Check for URL shorteners
        shorteners = ["bit.ly", "tinyurl", "goo.gl", "t.co", "ow.ly", "is.gd"]
        for shortener in shorteners:
            if shortener in content_lower:
                total_risk += 20
                indicators.append(ThreatIndicator(
                    type="url",
                    value=f"URL shortener ({shortener})",
                    riskContribution=20,
                    description="URL shorteners can hide malicious destinations"
                ))
                risk_contributions.append(RiskContribution(
                    label="URL Shortener",
                    value=20,
                    category="urls"
                ))
                break
        
        # Check for suspicious TLDs
        suspicious_tlds = [".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".work"]
        for tld in suspicious_tlds:
            if content_lower.endswith(tld) or tld + "/" in content_lower:
                total_risk += 25
                indicators.append(ThreatIndicator(
                    type="url",
                    value=f"Suspicious TLD ({tld})",
                    riskContribution=25,
                    description="Free or cheap domain commonly used for malicious sites"
                ))
                risk_contributions.append(RiskContribution(
                    label="Suspicious Domain",
                    value=25,
                    category="urls"
                ))
                break
        
        # Check for suspicious keywords in URL
        url_keywords = ["login", "signin", "verify", "secure", "account", "update", "confirm", "bank", "paypal"]
        found_url_kw = [kw for kw in url_keywords if kw in content_lower]
        if found_url_kw:
            risk_add = min(len(found_url_kw) * 10, 25)
            total_risk += risk_add
            indicators.append(ThreatIndicator(
                type="pattern",
                value=f"Suspicious path keywords: {', '.join(found_url_kw[:3])}",
                riskContribution=risk_add,
                description="URL contains keywords commonly used in phishing URLs"
            ))
            risk_contributions.append(RiskContribution(
                label="Phishing Keywords",
                value=risk_add,
                category="patterns"
            ))
        
        # Check for excessive subdomains
        subdomain_count = content_lower.count('.') - 1  # Exclude TLD
        if subdomain_count > 3:
            total_risk += 15
            indicators.append(ThreatIndicator(
                type="pattern",
                value=f"Excessive subdomains ({subdomain_count})",
                riskContribution=15,
                description="Many subdomains can indicate domain spoofing attempt"
            ))
        
        # Build explanations
        if indicators:
            explanations.append(ExplanationSection(
                title="URL Structure Analysis",
                content=f"Identified {len(indicators)} suspicious characteristic(s) in this URL that are commonly associated with malicious websites.",
                severity="high" if total_risk >= 50 else "medium",
                indicators=indicators[:3]
            ))
        
        # Determine severity
        if total_risk >= 60:
            threat_type, severity = "url_threat", "critical"
        elif total_risk >= 40:
            threat_type, severity = "url_threat", "high"
        elif total_risk >= 20:
            threat_type, severity = "url_threat", "medium"
        elif total_risk >= 10:
            threat_type, severity = "unknown", "low"
        else:
            threat_type, severity = "safe", "safe"
        
        summary = self._generate_summary(threat_type, severity, total_risk, len(indicators))
        recommendations = self._get_recommendations(threat_type, severity)
        confidence = min(55 + len(indicators) * 8 + (total_risk // 4), 95)
        
        return {
            "threat_type": threat_type,
            "severity": severity,
            "risk_score": min(total_risk, 100),
            "confidence": confidence,
            "summary": summary,
            "explanation": explanations if explanations else [
                ExplanationSection(
                    title="URL Analysis Complete",
                    content="No obvious threat indicators detected. However, always verify URLs before entering sensitive information.",
                    severity="safe",
                    indicators=None
                )
            ],
            "indicators": indicators,
            "recommendations": recommendations,
            "risk_contributions": risk_contributions
        }
    
    async def _analyze_message(self, content: str, content_lower: str) -> dict:
        """Analyze text message for threats (SMS phishing, scams)"""
        # Similar logic to email but tuned for shorter content
        indicators = []
        risk_contributions = []
        explanations = []
        total_risk = 0
        
        # Check for phishing keywords (weighted higher for short messages)
        message_phishing = ["urgent", "verify", "click", "prize", "winner", "claim", "expires", "suspended"]
        found = [kw for kw in message_phishing if kw in content_lower]
        
        if found:
            risk_add = min(len(found) * 12, 45)
            total_risk += risk_add
            for kw in found[:3]:
                indicators.append(ThreatIndicator(
                    type="keyword",
                    value=f'"{kw}"',
                    riskContribution=12,
                    description="Common SMS phishing trigger word"
                ))
            risk_contributions.append(RiskContribution(
                label="Phishing Keywords",
                value=risk_add,
                category="keywords"
            ))
        
        # Check for URLs in message
        url_pattern = r'https?://[^\s]+'
        urls = re.findall(url_pattern, content)
        if urls:
            total_risk += 20
            indicators.append(ThreatIndicator(
                type="url",
                value=f"{len(urls)} URL(s) detected",
                riskContribution=20,
                description="Text messages with links are often used for phishing"
            ))
            risk_contributions.append(RiskContribution(
                label="Embedded Links",
                value=20,
                category="urls"
            ))
        
        # Check for money/financial mentions
        money_patterns = [r"\$\d+", r"£\d+", r"€\d+", "money", "cash", "transfer", "payment", "bitcoin", "crypto"]
        money_found = any(re.search(p, content_lower) for p in money_patterns)
        if money_found:
            total_risk += 25
            indicators.append(ThreatIndicator(
                type="behavioral",
                value="Financial reference",
                riskContribution=25,
                description="Message mentions money or financial transactions"
            ))
            risk_contributions.append(RiskContribution(
                label="Financial Lure",
                value=25,
                category="behavioral"
            ))
        
        # Build explanation
        if indicators:
            explanations.append(ExplanationSection(
                title="SMS/Message Analysis",
                content=f"This message exhibits {len(indicators)} characteristic(s) commonly found in smishing (SMS phishing) attacks.",
                severity="high" if total_risk >= 50 else "medium",
                indicators=indicators
            ))
        
        # Determine threat
        if total_risk >= 60:
            threat_type, severity = "social_engineering", "critical"
        elif total_risk >= 40:
            threat_type, severity = "phishing", "high"
        elif total_risk >= 25:
            threat_type, severity = "spam", "medium"
        elif total_risk >= 10:
            threat_type, severity = "unknown", "low"
        else:
            threat_type, severity = "safe", "safe"
        
        summary = self._generate_summary(threat_type, severity, total_risk, len(indicators))
        recommendations = self._get_recommendations(threat_type, severity)
        confidence = min(50 + len(indicators) * 10 + (total_risk // 5), 95)
        
        return {
            "threat_type": threat_type,
            "severity": severity,
            "risk_score": min(total_risk, 100),
            "confidence": confidence,
            "summary": summary,
            "explanation": explanations if explanations else [
                ExplanationSection(
                    title="Message Analysis Complete",
                    content="No significant threat patterns detected in this message.",
                    severity="safe",
                    indicators=None
                )
            ],
            "indicators": indicators,
            "recommendations": recommendations,
            "risk_contributions": risk_contributions
        }
    
    def _mask_url(self, url: str) -> str:
        """Mask sensitive parts of URL for privacy"""
        try:
            # Keep protocol and first part of domain, mask the rest
            if "://" in url:
                protocol, rest = url.split("://", 1)
                parts = rest.split("/", 1)
                domain = parts[0]
                if len(domain) > 20:
                    domain = domain[:15] + "..." + domain[-5:]
                path = "/" + parts[1][:20] + "..." if len(parts) > 1 and len(parts[1]) > 20 else ""
                return f"{protocol}://{domain}{path}"
            return url[:30] + "..." if len(url) > 30 else url
        except:
            return url[:30] + "..."
    
    def _generate_summary(self, threat_type: str, severity: str, risk_score: int, indicator_count: int) -> str:
        """Generate human-readable summary"""
        if threat_type == "safe":
            return "No significant threats detected. This content appears to be safe, but always exercise caution with unsolicited communications."
        
        severity_text = {
            "critical": "extremely high-risk",
            "high": "high-risk",
            "medium": "potentially suspicious",
            "low": "low-risk"
        }.get(severity, "unknown risk")
        
        threat_text = {
            "phishing": "phishing attack attempting to steal credentials or sensitive information",
            "malware": "potential malware distribution",
            "spam": "unsolicited spam or promotional content",
            "social_engineering": "social engineering manipulation tactics",
            "credential_theft": "active credential harvesting attempt",
            "url_threat": "malicious or deceptive URL",
            "data_exfiltration": "possible data theft attempt"
        }.get(threat_type, "suspicious activity")
        
        return f"Analysis detected a {severity_text} {threat_text}. Found {indicator_count} threat indicator(s) with a combined risk score of {risk_score}%. Immediate caution is advised."
    
    def _get_recommendations(self, threat_type: str, severity: str) -> list[str]:
        """Generate actionable recommendations based on threat"""
        recs = []
        
        if severity in ["critical", "high"]:
            recs.extend([
                "Do NOT click any links in this content",
                "Do NOT reply or provide any personal information",
                "Report this to your IT security team immediately"
            ])
        
        if threat_type in ["phishing", "credential_theft"]:
            recs.extend([
                "If you entered credentials, change your password immediately",
                "Enable two-factor authentication on affected accounts",
                "Monitor your accounts for unauthorized activity"
            ])
        
        if "url" in threat_type.lower() or severity in ["critical", "high"]:
            recs.append("Block the sender or source of this content")
        
        if not recs or severity in ["low", "safe"]:
            recs = [
                "Always verify sender identity before responding",
                "Be cautious of unsolicited requests for information",
                "When in doubt, contact the organization directly using official channels"
            ]
        
        return recs[:5]  # Max 5 recommendations
    
    def _get_fp_likelihood(self, confidence: int) -> str:
        """Determine false positive likelihood based on confidence"""
        if confidence >= 85:
            return "low"
        elif confidence >= 65:
            return "medium"
        else:
            return "high"


# Singleton instance
analyzer = ThreatAnalyzer()


async def get_analyzer() -> ThreatAnalyzer:
    """Get analyzer instance"""
    return analyzer
