from flask import Flask, request, jsonify
from flask_cors import CORS

import os
import uuid
import shutil
import joblib
import pandas as pd
import whisper


# ==========================================
# APP SETUP
# ==========================================

app = Flask(__name__)

CORS(app)


# ==========================================
# PATH CONFIGURATION
# ==========================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "risk_model.pkl"
)

UPLOAD_FOLDER = os.path.join(
    BASE_DIR,
    "uploads"
)

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)


# ==========================================
# LOAD FRAUD RISK MODEL
# ==========================================

print("Loading fraud risk model...")

model = joblib.load(MODEL_PATH)

print("Fraud risk model loaded successfully")


# ==========================================
# FRAUD MODEL FEATURES
# ==========================================

FEATURES = [
    "amount",
    "newDevice",
    "newLocation",
    "rapidTransactions",
    "failedLogins",
    "otpRequests"
]


# ==========================================
# LOAD WHISPER MODEL - TINY FOR DEPLOYMENT
# ==========================================

print("Loading Whisper tiny model...")

whisper_model = whisper.load_model(
    "tiny"
)

print("Whisper tiny model loaded successfully")


# ==========================================
# HOME / HEALTH CHECK
# ==========================================

@app.get("/")
def home():

    return jsonify({

        "success": True,

        "message":
            "Fraud Risk ML API is running",

        "services": {

            "fraudPrediction":
                "ACTIVE",

            "voiceAnalysis":
                "ACTIVE"

        },

        "whisperModel":
            "tiny",

        "ffmpegAvailable":
            shutil.which("ffmpeg") is not None

    })


# ==========================================
# TRANSACTION FRAUD PREDICTION
# ==========================================

@app.post("/predict")
def predict():

    try:

        data = request.get_json()

        if not data:

            return jsonify({

                "success": False,

                "message":
                    "Request data is required"

            }), 400


        amount = float(
            data.get("amount", 0)
        )


        new_device = int(
            str(
                data.get("newDevice", False)
            ).lower()
            in ["true", "1", "yes"]
        )


        new_location = int(
            str(
                data.get("newLocation", False)
            ).lower()
            in ["true", "1", "yes"]
        )


        rapid_transactions = int(
            data.get(
                "rapidTransactions",
                0
            )
        )


        failed_logins = int(
            data.get(
                "failedLogins",
                0
            )
        )


        otp_requests = int(
            data.get(
                "otpRequests",
                0
            )
        )


        # ==================================
        # CREATE INPUT DATA
        # ==================================

        input_data = pd.DataFrame(

            [[
                amount,
                new_device,
                new_location,
                rapid_transactions,
                failed_logins,
                otp_requests
            ]],

            columns=FEATURES

        )


        # ==================================
        # ML PREDICTION
        # ==================================

        probability = float(
            model.predict_proba(
                input_data
            )[0][1]
        )


        risk_score = round(
            probability * 100,
            2
        )


        # ==================================
        # RISK LEVEL
        # ==================================

        if risk_score >= 75:

            risk_level = "HIGH"
            recommended_action = "PAUSE & VERIFY"

        elif risk_score >= 45:

            risk_level = "MEDIUM"
            recommended_action = "CONFIRM"

        else:

            risk_level = "LOW"
            recommended_action = "ALLOW"


        # ==================================
        # EXPLANATION
        # ==================================

        reasons = []


        if amount >= 50000:

            reasons.append(
                "Unusually high transaction amount"
            )


        if new_device:

            reasons.append(
                "Payment made from a new device"
            )


        if new_location:

            reasons.append(
                "Transaction from an unusual location"
            )


        if rapid_transactions >= 3:

            reasons.append(
                "Multiple rapid transactions detected"
            )


        if failed_logins >= 3:

            reasons.append(
                "Multiple failed login attempts"
            )


        if otp_requests >= 2:

            reasons.append(
                "Repeated OTP requests detected"
            )


        if not reasons:

            reasons.append(
                "No strong suspicious indicators detected"
            )


        return jsonify({

            "success": True,

            "riskScore":
                risk_score,

            "riskLevel":
                risk_level,

            "recommendedAction":
                recommended_action,

            "mlProbability":
                round(
                    probability,
                    4
                ),

            "reasons":
                reasons

        })


    except Exception as error:

        print(
            "PREDICTION ERROR:",
            repr(error)
        )


        return jsonify({

            "success": False,

            "message":
                str(error)

        }), 500


# ==========================================
# VOICE SCAM ANALYSIS
# ==========================================

@app.post("/analyze-voice")
def analyze_voice():

    audio_path = None

    try:

        # ==================================
        # CHECK FFMPEG
        # ==================================

        if not shutil.which("ffmpeg"):

            return jsonify({

                "success": False,

                "message":
                    "FFmpeg is not available on the server."

            }), 500


        # ==================================
        # CHECK AUDIO
        # ==================================

        if "audio" not in request.files:

            return jsonify({

                "success": False,

                "message":
                    "Audio file is required"

            }), 400


        audio_file = request.files["audio"]


        if not audio_file.filename:

            return jsonify({

                "success": False,

                "message":
                    "No audio file selected"

            }), 400


        # ==================================
        # FILE EXTENSION
        # ==================================

        original_extension = os.path.splitext(
            audio_file.filename
        )[1].lower()


        if not original_extension:

            original_extension = ".webm"


        # ==================================
        # UNIQUE FILE
        # ==================================

        unique_filename = (
            f"{uuid.uuid4()}"
            f"{original_extension}"
        )


        audio_path = os.path.join(
            UPLOAD_FOLDER,
            unique_filename
        )


        # ==================================
        # SAVE AUDIO
        # ==================================

        audio_file.save(
            audio_path
        )


        print(
            "Analyzing voice file:",
            audio_path
        )


        # ==================================
        # TRANSCRIBE USING WHISPER TINY
        # ==================================

        result = whisper_model.transcribe(

            audio_path,

            fp16=False,

            verbose=False

        )


        transcript = result.get(
            "text",
            ""
        ).strip()


        print(
            "TRANSCRIPT:",
            transcript
        )


        # ==================================
        # NO SPEECH
        # ==================================

        if not transcript:

            return jsonify({

                "success": True,

                "transcript": "",

                "riskScore": 0,

                "riskLevel": "LOW",

                "reasons": [],

                "detectedIndicators": [],

                "recommendedAction":
                    "Could not detect clear speech. Please record again."

            })


        # ==================================
        # SCAM KEYWORDS
        # ==================================

        suspicious_keywords = [

            "otp",
            "one time password",
            "cvv",
            "bank account",
            "account blocked",
            "account suspended",
            "verify your account",
            "verify immediately",
            "share your details",
            "share your password",
            "urgent",
            "immediately",
            "send money",
            "transfer money",
            "refund",
            "prize",
            "winner",
            "police",
            "arrest",
            "threat",
            "kyc",
            "pan number",
            "aadhaar",
            "debit card",
            "credit card"

        ]


        transcript_lower = transcript.lower()

        detected_indicators = []


        for keyword in suspicious_keywords:

            if keyword in transcript_lower:

                detected_indicators.append(
                    keyword
                )


        # ==================================
        # RISK SCORE
        # ==================================

        risk_score = min(

            len(detected_indicators) * 15,

            100

        )


        # ==================================
        # RISK LEVEL
        # ==================================

        if risk_score >= 60:

            risk_level = "HIGH"

            recommended_action = (
                "Do not share OTP, banking details, "
                "passwords or personal information. "
                "Verify the caller independently."
            )


        elif risk_score >= 30:

            risk_level = "MEDIUM"

            recommended_action = (
                "Be cautious. Verify the caller through "
                "an official source before sharing any "
                "sensitive information."
            )


        else:

            risk_level = "LOW"

            recommended_action = (
                "No major scam indicators were detected. "
                "Continue to remain cautious."
            )


        # ==================================
        # REASONS
        # ==================================

        reasons = []


        for indicator in detected_indicators:

            reasons.append(
                f"Suspicious keyword detected: {indicator}"
            )


        if not reasons:

            reasons.append(
                "No strong scam indicators detected"
            )


        # ==================================
        # FINAL RESPONSE
        # ==================================

        return jsonify({

            "success": True,

            "transcript":
                transcript,

            "riskScore":
                risk_score,

            "riskLevel":
                risk_level,

            "reasons":
                reasons,

            "detectedIndicators":
                detected_indicators,

            "recommendedAction":
                recommended_action

        })


    except Exception as error:

        print(
            "VOICE ANALYSIS ERROR:",
            repr(error)
        )


        return jsonify({

            "success": False,

            "message":
                str(error)

        }), 500


    finally:

        # ==================================
        # DELETE TEMP FILE
        # ==================================

        if (
            audio_path
            and
            os.path.exists(audio_path)
        ):

            try:

                os.remove(
                    audio_path
                )

                print(
                    "Temporary audio deleted"
                )

            except Exception as delete_error:

                print(
                    "FILE DELETE ERROR:",
                    str(delete_error)
                )


# ==========================================
# START SERVER
# ==========================================

if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            8000
        )
    )


    app.run(

        host="0.0.0.0",

        port=port,

        debug=False

    )