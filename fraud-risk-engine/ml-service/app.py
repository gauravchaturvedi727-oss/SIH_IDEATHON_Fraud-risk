import os
import re
import json
import logging
import tempfile
import gc
import joblib
import pandas as pd

from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from dotenv import load_dotenv


# =========================================================
# CONFIGURATION
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(ENV_PATH, override=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "risk_model.pkl"
)

UPLOAD_FOLDER = os.path.join(
    tempfile.gettempdir(),
    "dhanrakshak_uploads"
)

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# =========================================================
# FLASK
# =========================================================

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/*": {
            "origins": "*"
        }
    }
)


# =========================================================
# LOGGING
# =========================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

logger = logging.getLogger("DhanRakshak")


# =========================================================
# TABULAR ML FEATURES
# =========================================================

FEATURES = [
    "amount",
    "newDevice",
    "newLocation",
    "rapidTransactions",
    "failedLogins",
    "otpRequests"
]


# =========================================================
# UTILITY FUNCTIONS
# =========================================================

def clamp(value, minimum=0, maximum=100):

    try:
        value = float(value)

        if value < minimum:
            return minimum

        if value > maximum:
            return maximum

        return value

    except Exception:
        return minimum


def clean_text(text):

    if text is None:
        return ""

    text = str(text)

    text = re.sub(r"\s+", " ", text)

    return text.strip()


def unique_list(items):

    result = []
    seen = set()

    if not isinstance(items, list):
        return result

    for item in items:

        item = str(item).strip()

        if not item:
            continue

        key = item.lower()

        if key not in seen:

            seen.add(key)

            result.append(item)

    return result


def normalize_bool(value):

    if isinstance(value, bool):
        return int(value)

    return int(
        str(value).strip().lower()
        in [
            "true",
            "1",
            "yes",
            "y"
        ]
    )


def get_risk_level(score):

    score = float(score)

    if score >= 85:
        return "CRITICAL"

    elif score >= 60:
        return "HIGH"

    elif score >= 30:
        return "MEDIUM"

    return "LOW"


# =========================================================
# SAFE CONTEXT DETECTION
# =========================================================

def is_safety_advisory(text):

    t = clean_text(text).lower()

    if not t:
        return False


    # Dangerous links / APK / suspicious URLs
    dangerous_link = re.search(
        r"(bit\.ly|tinyurl|t\.me|wa\.me|\.apk|"
        r"\b\d{1,3}(?:\.\d{1,3}){3}\b)",
        t
    )

    if dangerous_link:
        return False


    safe_signals = [

        r"\b(do not|don't|never)\b.{0,60}\bshare\b.{0,30}"
        r"\b(otp|pin|cvv|password|mpin)\b",

        r"\bbank.{0,30}never.{0,60}"
        r"\b(ask|asks)\b.{0,50}"
        r"\b(otp|pin|cvv|password)\b",

        r"\bdo not share\b",

        r"\bkeep\b.{0,40}"
        r"\b(otp|pin|password|credentials)\b.{0,30}"
        r"\b(confidential|secret|private)\b",

        r"\bofficial (website|mobile app|app)\b",

        r"\bverify\b.{0,50}\bofficial\b",

        r"\bindependently obtained customer.?care number\b",

        r"\bfraud prevention\b",

        r"\bcyber safety\b",

        r"\bsecurity advisory\b",

        r"\bsatark rahein\b",

        r"\bsavdhan rahein\b"
    ]


    score = 0

    for pattern in safe_signals:

        if re.search(pattern, t, re.IGNORECASE):

            score += 1


    return score >= 2


def get_legitimate_context_score(text):

    t = clean_text(text).lower()

    score = 0


    safe_patterns = [

        r"\bdo not share\b",

        r"\bnever share\b",

        r"\bbank never asks\b",

        r"\bofficial website\b",

        r"\bofficial mobile app\b",

        r"\bverify independently\b",

        r"\bcyber safety\b",

        r"\bfraud prevention\b",

        r"\bsecurity advisory\b"
    ]


    for pattern in safe_patterns:

        if re.search(pattern, t, re.IGNORECASE):

            score += 1


    return score


# =========================================================
# LEGITIMATE BANK SMS DETECTION
# =========================================================

def is_legitimate_transaction_sms(text):

    t = clean_text(text).lower()

    transaction_patterns = [

        r"\b(?:rs\.?|inr|₹)\s?\d[\d,]*"
        r".{0,100}\bdebited\b",

        r"\b(?:rs\.?|inr|₹)\s?\d[\d,]*"
        r".{0,100}\bcredited\b",

        r"\baccount.{0,50}(debited|credited)\b",

        r"\btxn id\b",

        r"\btransaction id\b",

        r"\bref(?:erence)? no\b",

        r"\bavailable balance\b",

        r"\bacct ending\b",

        r"\ba/c ending\b"
    ]


    count = 0

    for pattern in transaction_patterns:

        if re.search(pattern, t, re.IGNORECASE):

            count += 1


    dangerous_action = re.search(

        r"\b(click|tap|visit|download|install|call|"
        r"share|send|give|provide|enter)\b.{0,80}"
        r"\b(otp|pin|cvv|password|link|apk)\b",

        t,

        re.IGNORECASE
    )


    return count >= 2 and not dangerous_action


# =========================================================
# NEGATION DETECTION
# =========================================================

def has_safe_negation_before(text, keyword):

    patterns = [

        rf"\b(do not|don't|never|not)\b.{{0,60}}\b{keyword}\b",

        rf"\b{keyword}\b.{{0,60}}\b(do not|don't|never)\b"
    ]


    for pattern in patterns:

        if re.search(pattern, text, re.IGNORECASE):

            return True


    return False


# =========================================================
# SCAM RULE DEFINITIONS
# =========================================================

RULES = [

    {
        "name": "Digital Arrest / Police Impersonation",
        "score": 92,
        "patterns": [

            r"\bdigital arrest\b",

            r"\byou (are|will be) arrested\b",

            r"\barrest warrant\b",

            r"\bpolice case\b",

            r"\bcriminal case\b",

            r"\bcbi officer\b",

            r"\bpolice officer\b",

            r"\bcyber crime officer\b",

            r"\bnarcotics officer\b",

            r"\bcustoms officer\b",

            r"\bmoney laundering case\b",

            r"\billegal parcel\b",

            r"\bdrugs found\b",

            r"\bskype interrogation\b",

            r"\bvideo call investigation\b"
        ]
    },


    {
        "name": "Remote Access / APK Fraud",
        "score": 92,
        "patterns": [

            r"\bdownload apk\b",

            r"\binstall apk\b",

            r"\bdownload the app from this link\b",

            r"\binstall this application\b",

            r"\banydesk\b",

            r"\bteamviewer\b",

            r"\brustdesk\b",

            r"\bquicksupport\b",

            r"\bshare your screen\b",

            r"\bscreen share\b",

            r"\bgive remote access\b",

            r"\bremote access\b"
        ]
    },


    {
        "name": "OTP / Credential Theft",
        "score": 88,
        "patterns": [

            r"\bshare.{0,50}\b(otp|pin|cvv|password|mpin)\b",

            r"\bsend.{0,50}\b(otp|pin|cvv|password|mpin)\b",

            r"\bgive.{0,50}\b(otp|pin|cvv|password|mpin)\b",

            r"\bprovide.{0,50}\b(otp|pin|cvv|password|mpin)\b",

            r"\btell.{0,50}\b(otp|pin|cvv|password|mpin)\b",

            r"\benter.{0,50}\b(otp|pin|cvv|password|mpin)\b",

            r"\bforward.{0,50}\b(otp|pin|cvv|password)\b",

            r"\bbatao.{0,50}\b(otp|pin|cvv)\b",

            r"\bbhejo.{0,50}\b(otp|pin|cvv)\b"
        ]
    },


    {
        "name": "KYC / Account Suspension Fraud",
        "score": 68,
        "patterns": [

            r"\bkyc.{0,60}\b(update immediately|update now|complete now)\b",

            r"\bkyc.{0,60}\b(account|service).{0,40}"
            r"\b(block|freeze|suspend)\b",

            r"\baccount.{0,60}\b(will be|will get|shall be).{0,30}"
            r"\b(blocked|frozen|suspended)\b",

            r"\bupdate kyc immediately\b",

            r"\bcomplete kyc immediately\b",

            r"\baccount will be blocked\b",

            r"\baccount will be frozen\b",

            r"\baccount suspension\b"
        ]
    },


    {
        "name": "Utility Disconnection Scam",
        "score": 70,
        "patterns": [

            r"\belectricity.{0,80}"
            r"\b(disconnect|disconnected|cut|cut off|suspend)\b",

            r"\bpower supply.{0,80}"
            r"\b(disconnect|cut|suspend)\b",

            r"\bbijli.{0,80}\b(kat|band|disconnect)\b",

            r"\bsim.{0,80}"
            r"\b(block|blocked|deactivate|deactivated|suspend)\b",

            r"\bmobile number.{0,80}"
            r"\b(disconnect|deactivate|block)\b"
        ]
    },


    {
        "name": "Fake Job / Task Scam",
        "score": 70,
        "patterns": [

            r"\bpart.?time job\b.{0,100}"
            r"\bearn\b",

            r"\bwork from home\b.{0,100}"
            r"\bearn\b",

            r"\btelegram task\b",

            r"\byoutube like.{0,60}"
            r"\bearn\b",

            r"\bgoogle review task\b",

            r"\bprepaid task\b",

            r"\bcomplete task.{0,80}"
            r"\bcommission\b"
        ]
    },


    {
        "name": "Investment / Guaranteed Return Scam",
        "score": 72,
        "patterns": [

            r"\bguaranteed return\b",

            r"\bguaranteed profit\b",

            r"\binvest.{0,60}\bdouble\b",

            r"\bdouble your money\b",

            r"\bcrypto.{0,80}\bguaranteed\b",

            r"\bdeposit.{0,60}\bget\b"
        ]
    },


    {
        "name": "Lottery / Prize Scam",
        "score": 72,
        "patterns": [

            r"\byou have won\b",

            r"\bwon a prize\b",

            r"\blottery winner\b",

            r"\bclaim your prize\b",

            r"\bprocessing fee\b.{0,80}\bprize\b"
        ]
    },


    {
        "name": "Suspicious Link",
        "score": 50,
        "patterns": [

            r"\bbit\.ly\b",

            r"\btinyurl\b",

            r"\bshorturl\b",

            r"\bgoo\.gl\b",

            r"\bclick here\b.{0,100}"
            r"\b(kyc|verify|account|bank)\b"
        ]
    },


    {
        "name": "Urgency / Pressure",
        "score": 18,
        "patterns": [

            r"\bimmediately\b",

            r"\burgent\b",

            r"\bright now\b",

            r"\bwithin \d+ (minute|minutes|hour|hours)\b",

            r"\bfinal warning\b",

            r"\blast warning\b",

            r"\baction will be taken\b",

            r"\bturant\b",

            r"\bjaldi\b"
        ]
    }
]


# =========================================================
# RULE ENGINE
# =========================================================

def evaluate_rules(text):

    text = clean_text(text)
    t = text.lower()


    # -----------------------------------------------------
    # 1. Empty
    # -----------------------------------------------------

    if not text:

        return {

            "is_scam": False,

            "risk_score": 0,

            "risk_level": "LOW",

            "scam_category": "No Content",

            "confidence": 1.0,

            "detected_tactics": [],

            "suspicious_indicators": [],

            "reasons": [
                "No message content provided."
            ],

            "recommended_action":
                "Provide message content for analysis.",

            "engineUsed":
                "Rule-Engine"
        }


    # -----------------------------------------------------
    # 2. SAFETY ADVISORY
    # -----------------------------------------------------

    if is_safety_advisory(text):

        return {

            "is_scam": False,

            "risk_score": 2,

            "risk_level": "LOW",

            "scam_category":
                "Legitimate Safety Advisory",

            "confidence": 0.98,

            "detected_tactics": [],

            "suspicious_indicators": [],

            "reasons": [

                "The message warns users not to share sensitive credentials.",

                "It directs users toward official verification channels."
            ],

            "recommended_action":
                "This appears to be a safety or fraud-prevention advisory.",

            "engineUsed":
                "Safe-Context-Rule-Engine"
        }


    # -----------------------------------------------------
    # 3. LEGITIMATE TRANSACTION
    # -----------------------------------------------------

    if is_legitimate_transaction_sms(text):

        return {

            "is_scam": False,

            "risk_score": 3,

            "risk_level": "LOW",

            "scam_category":
                "Legitimate Transaction Alert",

            "confidence": 0.97,

            "detected_tactics": [],

            "suspicious_indicators": [],

            "reasons": [

                "Message matches a standard transactional notification format."
            ],

            "recommended_action":
                "No strong scam indicators detected.",

            "engineUsed":
                "Transaction-Rule-Engine"
        }


    # -----------------------------------------------------
    # 4. NORMAL SAFE TEXT
    # -----------------------------------------------------

    matched_rules = []

    all_indicators = []

    reasons = []


    for rule in RULES:

        matches = []


        for pattern in rule["patterns"]:

            found = re.finditer(
                pattern,
                t,
                re.IGNORECASE
            )


            for match in found:

                matched = match.group(0).strip()

                if matched:

                    matches.append(matched)


        if matches:

            # Important:
            # Ignore OTP rule if context says:
            # "Do not share OTP"
            if rule["name"] == "OTP / Credential Theft":

                credential_words = [
                    "otp",
                    "pin",
                    "cvv",
                    "password",
                    "mpin"
                ]

                all_negated = True

                for word in credential_words:

                    if re.search(rf"\b{word}\b", t):

                        if not has_safe_negation_before(
                            t,
                            word
                        ):
                            all_negated = False


                if all_negated:

                    continue


            matched_rules.append({

                "name": rule["name"],

                "score": rule["score"],

                "matches":
                    unique_list(matches)
            })


            all_indicators.extend(matches)


    # -----------------------------------------------------
    # No rules
    # -----------------------------------------------------

    if not matched_rules:

        return {

            "is_scam": False,

            "risk_score": 5,

            "risk_level": "LOW",

            "scam_category":
                "No Strong Fraud Pattern",

            "confidence": 0.88,

            "detected_tactics": [],

            "suspicious_indicators": [],

            "reasons": [

                "No strong scam pattern or coercive action was detected."
            ],

            "recommended_action":
                "No strong fraud evidence detected. Continue normal caution.",

            "engineUsed":
                "Rule-Engine"
        }


    # -----------------------------------------------------
    # Calculate score
    # -----------------------------------------------------

    matched_rules.sort(
        key=lambda x: x["score"],
        reverse=True
    )


    primary = matched_rules[0]


    score = float(primary["score"])


    for extra in matched_rules[1:]:

        name = extra["name"]

        if name == "Urgency / Pressure":

            score += 8

        elif name == "Suspicious Link":

            score += 10

        else:

            score += min(
                extra["score"] * 0.18,
                15
            )


    categories = [
        item["name"]
        for item in matched_rules
    ]


    # -----------------------------------------------------
    # Severe combinations
    # -----------------------------------------------------

    has_otp = (
        "OTP / Credential Theft"
        in categories
    )

    has_remote = (
        "Remote Access / APK Fraud"
        in categories
    )

    has_digital_arrest = (
        "Digital Arrest / Police Impersonation"
        in categories
    )

    has_kyc = (
        "KYC / Account Suspension Fraud"
        in categories
    )

    has_urgency = (
        "Urgency / Pressure"
        in categories
    )


    if has_otp and has_remote:

        score += 12

        reasons.append(
            "Remote access combined with credential theft is highly dangerous."
        )


    if has_digital_arrest and has_otp:

        score += 10

        reasons.append(
            "Police impersonation combined with credential theft detected."
        )


    if has_kyc and has_urgency:

        score += 8

        reasons.append(
            "Account threat combined with urgency increases fraud likelihood."
        )


    score = int(clamp(score))


    level = get_risk_level(score)


    is_scam = score >= 30


    # -----------------------------------------------------
    # Reasons
    # -----------------------------------------------------

    for item in matched_rules:

        reasons.append(
            f"Detected indicators related to {item['name']}."
        )


    # -----------------------------------------------------
    # Recommended action
    # -----------------------------------------------------

    if score >= 85:

        action = (
            "CRITICAL RISK: Stop responding immediately. "
            "Do not share OTP, PIN, CVV or passwords. "
            "Do not install APK files or provide remote access."
        )


    elif score >= 60:

        action = (
            "HIGH RISK: Do not follow instructions in this message. "
            "Verify independently using the institution's official website or app."
        )


    elif score >= 30:

        action = (
            "MEDIUM RISK: The message contains suspicious patterns. "
            "Do not click links or share sensitive information until independently verified."
        )


    else:

        action = (
            "LOW RISK: No severe fraud pattern detected, "
            "but remain cautious."
        )


    return {

        "is_scam": is_scam,

        "risk_score": score,

        "risk_level": level,

        "scam_category":
            primary["name"],

        "confidence":
            0.97 if score >= 85
            else 0.93 if score >= 60
            else 0.85,

        "detected_tactics":
            unique_list(categories),

        "suspicious_indicators":
            unique_list(all_indicators),

        "reasons":
            unique_list(reasons),

        "recommended_action":
            action,

        "engineUsed":
            "Advanced-Calibrated-Rule-Engine"
    }


# =========================================================
# GROQ INITIALIZATION
# =========================================================

groq_client = None
groq_verified = False

CHAT_MODEL = None
TRANSCRIPTION_MODEL = None


def initialize_groq():

    global groq_client
    global groq_verified
    global CHAT_MODEL
    global TRANSCRIPTION_MODEL


    if not GROQ_API_KEY.startswith("gsk_"):

        logger.warning(
            "Groq key missing. AI analysis disabled."
        )

        return


    try:

        groq_client = Groq(
            api_key=GROQ_API_KEY
        )


        models_response = (
            groq_client.models.list()
        )


        available_models = [

            item.id

            for item
            in models_response.data
        ]


        preferred_chat_models = [

            "llama-3.3-70b-versatile",

            "llama-3.1-8b-instant"
        ]


        for model_name in preferred_chat_models:

            if model_name in available_models:

                CHAT_MODEL = model_name

                break


        if CHAT_MODEL is None:

            CHAT_MODEL = (
                preferred_chat_models[0]
            )


        preferred_audio_models = [

            "whisper-large-v3-turbo",

            "whisper-large-v3"
        ]


        for model_name in preferred_audio_models:

            if model_name in available_models:

                TRANSCRIPTION_MODEL = model_name

                break


        if TRANSCRIPTION_MODEL is None:

            TRANSCRIPTION_MODEL = (
                "whisper-large-v3"
            )


        groq_verified = True


        logger.info(
            "Groq initialized successfully."
        )


    except Exception as error:

        logger.error(
            "Groq initialization failed: %s",
            repr(error)
        )


        groq_client = None
        groq_verified = False


initialize_groq()


# =========================================================
# LOAD TABULAR MODEL
# =========================================================

model = None


try:

    if os.path.exists(MODEL_PATH):

        model = joblib.load(
            MODEL_PATH
        )

        logger.info(
            "ML risk model loaded."
        )

    else:

        logger.warning(
            "ML model not found. Heuristic fallback active."
        )


except Exception as error:

    logger.error(
        "Model loading failed: %s",
        repr(error)
    )


# =========================================================
# AI ANALYSIS
# =========================================================

SYSTEM_PROMPT = """
You are a financial fraud detection system.

Analyze the message carefully.

IMPORTANT:
A message is NOT a scam merely because it contains words like OTP, KYC,
PIN, CVV, bank, account, fraud, security, or verification.

SAFE EXAMPLES:
- "Do not share OTP with anyone."
- "Verify only through the official bank app."
- "Banks never ask for your PIN."
- Normal bank transaction notifications.
These should receive LOW risk, normally 0-10.

SCAM EXAMPLES:
- Asking the user to share/send/provide OTP or PIN.
- Asking the user to install an APK.
- Asking for AnyDesk or screen sharing.
- Digital arrest or police impersonation.
- Threatening account block and demanding immediate action through a link.
- Fake task/job/investment schemes.

Return ONLY valid JSON:

{
  "risk_score": integer,
  "scam_category": string,
  "confidence": number,
  "detected_tactics": [],
  "suspicious_indicators": [],
  "reasons": [],
  "recommended_action": string
}

SCORING:
0-10 = clearly safe
11-29 = low suspicion
30-59 = medium suspicion
60-84 = high risk
85-100 = critical scam

Do not exaggerate risk.
"""


def extract_clean_json(content):

    content = content.strip()


    if content.startswith("```"):

        content = re.sub(
            r"^```(?:json)?\s*",
            "",
            content,
            flags=re.IGNORECASE
        )


        content = re.sub(
            r"\s*```$",
            "",
            content
        )


    start = content.find("{")

    end = content.rfind("}")


    if start != -1 and end != -1:

        content = content[
            start:end + 1
        ]


    return json.loads(content)


def analyze_with_ai(text):

    if not groq_verified:

        return None


    if not groq_client:

        return None


    if not CHAT_MODEL:

        return None


    try:

        response = (
            groq_client.chat.completions.create(

                model=CHAT_MODEL,

                messages=[

                    {
                        "role": "system",
                        "content": SYSTEM_PROMPT
                    },

                    {
                        "role": "user",
                        "content":
                            f"Analyze this message:\n{text}"
                    }
                ],

                response_format={
                    "type": "json_object"
                },

                temperature=0.0,

                max_tokens=500
            )
        )


        content = (
            response.choices[0]
            .message.content
        )


        data = extract_clean_json(
            content
        )


        score = int(
            clamp(
                data.get(
                    "risk_score",
                    0
                )
            )
        )


        return {

            "risk_score": score,

            "risk_level":
                get_risk_level(score),

            "scam_category":
                str(
                    data.get(
                        "scam_category",
                        "Unknown"
                    )
                ),

            "confidence":
                round(
                    clamp(
                        data.get(
                            "confidence",
                            0.80
                        ),
                        0,
                        1
                    ),
                    2
                ),

            "detected_tactics":
                unique_list(
                    data.get(
                        "detected_tactics",
                        []
                    )
                ),

            "suspicious_indicators":
                unique_list(
                    data.get(
                        "suspicious_indicators",
                        []
                    )
                ),

            "reasons":
                unique_list(
                    data.get(
                        "reasons",
                        []
                    )
                ),

            "recommended_action":
                str(
                    data.get(
                        "recommended_action",
                        "Verify independently."
                    )
                ),

            "engineUsed":
                f"Groq-{CHAT_MODEL}"
        }


    except Exception as error:

        logger.warning(
            "AI analysis failed: %s",
            repr(error)
        )

        return None


# =========================================================
# HYBRID MESSAGE ANALYSIS
# =========================================================

def analyze_content(text):

    text = clean_text(text)


    if not text:

        return {

            "is_scam": False,

            "risk_score": 0,

            "risk_level": "LOW",

            "scam_category":
                "No Content",

            "confidence": 1.0,

            "detected_tactics": [],

            "suspicious_indicators": [],

            "reasons": [
                "No message content provided."
            ],

            "recommended_action":
                "Provide a valid message.",

            "engineUsed":
                "Validation"
        }


    # Rule engine first
    rule_result = evaluate_rules(
        text
    )


    rule_score = (
        rule_result["risk_score"]
    )


    # =====================================================
    # SAFE RULE SHORT CIRCUIT
    # AI cannot turn a clear safety advisory into scam
    # =====================================================

    if rule_result["scam_category"] in [

        "Legitimate Safety Advisory",

        "Legitimate Transaction Alert"

    ]:

        return rule_result


    # =====================================================
    # AI
    # =====================================================

    ai_result = analyze_with_ai(
        text
    )


    if ai_result is None:

        return rule_result


    ai_score = (
        ai_result["risk_score"]
    )


    # =====================================================
    # SCORING STRATEGY
    # =====================================================

    # Strong deterministic scam:
    # Rules should dominate
    if rule_score >= 85:

        final_score = round(

            rule_score * 0.80

            +

            ai_score * 0.20
        )


    # Strong scam
    elif rule_score >= 60:

        final_score = round(

            rule_score * 0.65

            +

            ai_score * 0.35
        )


    # Medium suspicion
    elif rule_score >= 30:

        final_score = round(

            rule_score * 0.55

            +

            ai_score * 0.45
        )


    # Weak rule signal
    else:

        # Don't let AI randomly produce 100
        final_score = round(

            rule_score * 0.50

            +

            ai_score * 0.50
        )


        final_score = min(
            final_score,
            40
        )


    # =====================================================
    # EXTRA SAFE DE-ESCALATION
    # =====================================================

    legitimate_score = (
        get_legitimate_context_score(
            text
        )
    )


    if legitimate_score >= 2:

        final_score = min(
            final_score,
            15
        )


    final_score = int(
        clamp(final_score)
    )


    final_level = (
        get_risk_level(
            final_score
        )
    )


    if final_score >= 85:

        action = (
            "CRITICAL RISK: Stop communication. "
            "Do not share credentials, install apps, "
            "or provide remote access."
        )


    elif final_score >= 60:

        action = (
            "HIGH RISK: Do not follow the message instructions. "
            "Verify using an independently obtained official contact."
        )


    elif final_score >= 30:

        action = (
            "MEDIUM RISK: Suspicious indicators detected. "
            "Verify before taking any action."
        )


    else:

        action = (
            "LOW RISK: No strong fraud evidence detected."
        )


    return {

        "is_scam":
            final_score >= 30,

        "risk_score":
            final_score,

        "risk_level":
            final_level,

        "scam_category":

            rule_result["scam_category"]

            if rule_score >= 30

            else ai_result["scam_category"],

        "confidence":

            round(
                max(

                    rule_result.get(
                        "confidence",
                        0.80
                    ),

                    ai_result.get(
                        "confidence",
                        0.80
                    )
                ),
                2
            ),

        "detected_tactics":

            unique_list(

                rule_result.get(
                    "detected_tactics",
                    []
                )

                +

                ai_result.get(
                    "detected_tactics",
                    []
                )
            ),

        "suspicious_indicators":

            unique_list(

                rule_result.get(
                    "suspicious_indicators",
                    []
                )

                +

                ai_result.get(
                    "suspicious_indicators",
                    []
                )
            ),

        "reasons":

            unique_list(

                rule_result.get(
                    "reasons",
                    []
                )

                +

                ai_result.get(
                    "reasons",
                    []
                )
            ),

        "recommended_action":
            action,

        "engineUsed":

            f"Hybrid Rules + {ai_result['engineUsed']}",

        "engineScores": {

            "ruleScore":
                rule_score,

            "aiScore":
                ai_score,

            "finalScore":
                final_score
        }
    }


# =========================================================
# MESSAGE API
# =========================================================

@app.post("/analyze-message")
@app.post("/api/analyze-message")
def analyze_message():

    try:

        data = (
            request.get_json(
                silent=True
            )
            or {}
        )


        text = clean_text(

            data.get("message")

            or

            data.get("text")

            or ""
        )


        if not text:

            return jsonify({

                "success": False,

                "message":
                    "Field 'message' or 'text' is required"

            }), 400


        result = analyze_content(
            text
        )


        return jsonify({

            "success": True,

            "inputText":
                text,

            "analysis":
                result,

            "riskScore":
                result["risk_score"],

            "riskLevel":
                result["risk_level"],

            "recommendedAction":
                result["recommended_action"],

            "reasons":
                result["reasons"]
        })


    except Exception as error:

        logger.exception(
            "Message analysis error"
        )


        return jsonify({

            "success": False,

            "message":
                str(error)

        }), 500


# =========================================================
# TABULAR FRAUD PREDICTION
# =========================================================

@app.post("/predict")
@app.post("/api/predict")
def predict():

    try:

        data = (
            request.get_json(
                silent=True
            )
            or {}
        )


        amount = max(
            0,
            float(
                data.get(
                    "amount",
                    0
                )
            )
        )


        new_device = normalize_bool(
            data.get(
                "newDevice",
                False
            )
        )


        new_location = normalize_bool(
            data.get(
                "newLocation",
                False
            )
        )


        rapid_txns = max(
            0,
            int(
                data.get(
                    "rapidTransactions",
                    0
                )
            )
        )


        failed_logins = max(
            0,
            int(
                data.get(
                    "failedLogins",
                    0
                )
            )
        )


        otp_requests = max(
            0,
            int(
                data.get(
                    "otpRequests",
                    0
                )
            )
        )


        input_df = pd.DataFrame(

            [[

                amount,

                new_device,

                new_location,

                rapid_txns,

                failed_logins,

                otp_requests

            ]],

            columns=FEATURES
        )


        # -------------------------------------------------
        # Actual ML prediction
        # -------------------------------------------------

        if model is not None:

            probabilities = (
                model.predict_proba(
                    input_df
                )[0]
            )


            classes = list(
                model.classes_
            )


            if 1 in classes:

                fraud_index = (
                    classes.index(1)
                )

            elif "1" in classes:

                fraud_index = (
                    classes.index("1")
                )

            else:

                fraud_index = 1


            fraud_probability = float(
                probabilities[
                    fraud_index
                ]
            )


            risk_score = round(

                clamp(
                    fraud_probability * 100
                ),

                2
            )


        # -------------------------------------------------
        # Fallback
        # -------------------------------------------------

        else:

            risk_score = 3


            if amount >= 100000:

                risk_score += 25

            elif amount >= 50000:

                risk_score += 18

            elif amount >= 15000:

                risk_score += 10


            if new_device:

                risk_score += 18


            if new_location:

                risk_score += 15


            if rapid_txns >= 5:

                risk_score += 25

            elif rapid_txns >= 3:

                risk_score += 15


            if failed_logins >= 5:

                risk_score += 20

            elif failed_logins >= 2:

                risk_score += 10


            if otp_requests >= 5:

                risk_score += 20

            elif otp_requests >= 3:

                risk_score += 12


            risk_score = round(
                clamp(risk_score),
                2
            )


            fraud_probability = round(
                risk_score / 100,
                4
            )


        return jsonify({

            "success": True,

            "riskScore":
                risk_score,

            "riskLevel":
                get_risk_level(
                    risk_score
                ),

            "fraudProbability":
                fraud_probability
        })


    except Exception as error:

        logger.exception(
            "Prediction error"
        )


        return jsonify({

            "success": False,

            "message":
                str(error)

        }), 500


# =========================================================
# VOICE ANALYSIS
# =========================================================

@app.post("/analyze-voice")
@app.post("/api/voice/analyze")
@app.post("/voice/analyze")
def analyze_voice():

    temp_audio_file = None


    try:

        if not groq_verified:

            return jsonify({

                "success": False,

                "message":
                    "Groq transcription is not configured."

            }), 500


        audio_file = (

            request.files.get("audio")

            or

            request.files.get("file")
        )


        if not audio_file:

            return jsonify({

                "success": False,

                "message":
                    "No audio file provided."

            }), 400


        extension = os.path.splitext(
            audio_file.filename
        )[1].lower()


        allowed = {

            ".mp3",
            ".wav",
            ".m4a",
            ".webm",
            ".ogg",
            ".flac",
            ".mp4",
            ".mpeg",
            ".mpga"
        }


        if extension not in allowed:

            return jsonify({

                "success": False,

                "message":
                    "Unsupported audio format."

            }), 400


        with tempfile.NamedTemporaryFile(

            delete=False,

            suffix=extension,

            dir=UPLOAD_FOLDER

        ) as temp:

            temp_audio_file = temp.name

            audio_file.save(
                temp_audio_file
            )


        with open(
            temp_audio_file,
            "rb"
        ) as audio_stream:

            transcription = (

                groq_client.audio.transcriptions.create(

                    file=(

                        os.path.basename(
                            temp_audio_file
                        ),

                        audio_stream
                    ),

                    model=
                        TRANSCRIPTION_MODEL,

                    response_format="json",

                    temperature=0.0,

                    prompt=(
                        "Indian cyber fraud, OTP, PIN, CVV, "
                        "digital arrest, CBI, police, customs, "
                        "KYC scam, bank fraud, AnyDesk, APK."
                    )
                )
            )


        transcript = clean_text(

            getattr(
                transcription,
                "text",
                ""
            )
        )


        if not transcript:

            return jsonify({

                "success": True,

                "transcript": "",

                "riskScore": 0,

                "riskLevel": "LOW",

                "recommendedAction":
                    "No recognizable speech detected.",

                "reasons":
                    ["Audio was unclear or silent."]
            })


        analysis = analyze_content(
            transcript
        )


        return jsonify({

            "success": True,

            "transcript":
                transcript,

            "analysis":
                analysis,

            "riskScore":
                analysis["risk_score"],

            "riskLevel":
                analysis["risk_level"],

            "recommendedAction":
                analysis["recommended_action"],

            "reasons":
                analysis["reasons"]
        })


    except Exception as error:

        logger.exception(
            "Voice analysis error"
        )


        return jsonify({

            "success": False,

            "message":
                str(error)

        }), 500


    finally:

        if (
            temp_audio_file
            and
            os.path.exists(
                temp_audio_file
            )
        ):

            try:

                os.remove(
                    temp_audio_file
                )

            except Exception:

                pass


        gc.collect()


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return jsonify({

        "success": True,

        "service":
            "DhanRakshak Fraud Intelligence Engine",

        "status":
            "OPERATIONAL",

        "groq_status":
            "ACTIVE"
            if groq_verified
            else "INACTIVE",

        "chat_model":
            CHAT_MODEL,

        "transcription_model":
            TRANSCRIPTION_MODEL,

        "ml_model_status":
            "ACTIVE"
            if model is not None
            else "HEURISTIC",

        "port":
            8000
    })


# =========================================================
# RUN SERVER
# =========================================================

if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            8000
        )
    )


    print("\n" + "=" * 55)

    print(
        "DhanRakshak Fraud Intelligence Engine"
    )

    print(
        f"Endpoint: http://127.0.0.1:{port}"
    )

    print(
        f"Groq: {'ONLINE' if groq_verified else 'OFFLINE'}"
    )

    print(
        f"Chat Model: {CHAT_MODEL}"
    )

    print(
        f"ML Model: {'LOADED' if model else 'HEURISTIC'}"
    )

    print("=" * 55 + "\n")


    app.run(

        host="0.0.0.0",

        port=port,

        debug=False
    )