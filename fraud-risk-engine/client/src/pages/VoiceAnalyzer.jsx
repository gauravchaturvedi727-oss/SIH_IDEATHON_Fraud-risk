import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import "./VoiceAnalyzer.css";

function VoiceAnalyzer() {
  const [audio, setAudio] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  };

  // ==========================================
  // FILE SELECT
  // ==========================================
  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }

    setAudio(selectedFile);
    setResult(null);
    setError("");
    setRecordedAudioUrl(null);
    setCopied(false);
  };

  // ==========================================
  // START RECORDING
  // ==========================================
  const startRecording = async () => {
    try {
      setError("");
      setResult(null);
      setRecordingTimer(0);
      setCopied(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;

      let mimeType = "";

      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      }

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const recordedMimeType =
          mediaRecorder.mimeType || "audio/webm";

        const audioBlob = new Blob(
          audioChunksRef.current,
          {
            type: recordedMimeType,
          }
        );

        const recordedFile = new File(
          [audioBlob],
          "voice-recording.webm",
          {
            type: recordedMimeType,
          }
        );

        if (recordedAudioUrl) {
          URL.revokeObjectURL(recordedAudioUrl);
        }

        const audioUrl = URL.createObjectURL(audioBlob);

        setAudio(recordedFile);
        setRecordedAudioUrl(audioUrl);

        if (streamRef.current) {
          streamRef.current
            .getTracks()
            .forEach((track) => track.stop());

          streamRef.current = null;
        }

        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      };

      mediaRecorder.start();

      setRecording(true);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTimer((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("MICROPHONE ERROR:", err);

      setError(
        "Microphone access was denied or unavailable."
      );
    }
  };

  // ==========================================
  // STOP RECORDING
  // ==========================================
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    setRecording(false);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // ==========================================
  // ANALYZE VOICE
  // ==========================================
  const analyzeVoice = async () => {
    if (!audio) {
      setError(
        "Please select or record an audio file first."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);
      setCopied(false);

      const formData = new FormData();

      formData.append(
        "audio",
        audio,
        audio.name || "voice-recording.webm"
      );

      console.log("SENDING AUDIO:", {
        name: audio.name,
        type: audio.type,
        size: audio.size,
      });

      const response = await api.post(
        "/voice/analyze",
        formData
      );

      console.log(
        "VOICE API RESPONSE:",
        response.data
      );

      /*
        SUPPORTS BOTH BACKEND FORMATS:

        FORMAT 1:
        {
          transcript,
          riskScore,
          riskLevel,
          reasons
        }

        FORMAT 2:
        {
          transcript,
          analysis: {
            risk_score,
            risk_level,
            reasons
          }
        }
      */

      const data = response.data || {};

      const analysis =
        data.analysis ||
        data.data?.analysis ||
        data.result?.analysis ||
        {};

      const transcript =
        data.transcript ||
        data.data?.transcript ||
        data.result?.transcript ||
        "";

      const riskScore =
        data.riskScore ??
        data.risk_score ??
        analysis.riskScore ??
        analysis.risk_score ??
        0;

      const riskLevel =
        data.riskLevel ||
        data.risk_level ||
        analysis.riskLevel ||
        analysis.risk_level ||
        "LOW";

      const recommendedAction =
        data.recommendedAction ||
        data.recommended_action ||
        analysis.recommendedAction ||
        analysis.recommended_action ||
        "Remain cautious and avoid sharing sensitive credentials.";

      const reasons =
        data.reasons ||
        analysis.reasons ||
        analysis.suspicious_indicators ||
        [];

      const tactics =
        data.detectedTactics ||
        data.detected_tactics ||
        analysis.detectedTactics ||
        analysis.detected_tactics ||
        [];

      const indicators =
        data.suspiciousIndicators ||
        data.suspicious_indicators ||
        analysis.suspiciousIndicators ||
        analysis.suspicious_indicators ||
        [];

      const engineUsed =
        data.engineUsed ||
        data.engine_used ||
        analysis.engineUsed ||
        analysis.engine_used ||
        "Fraud Detection Engine";

      // Combine reasons + tactics + indicators
      const allSignals = [
        ...(Array.isArray(reasons) ? reasons : []),
        ...(Array.isArray(tactics)
          ? tactics.map(
              (item) => `Detected tactic: ${item}`
            )
          : []),
        ...(Array.isArray(indicators)
          ? indicators.map(
              (item) => `Suspicious indicator: ${item}`
            )
          : []),
      ];

      const uniqueSignals = [
        ...new Set(
          allSignals
            .filter(Boolean)
            .map((item) => String(item).trim())
        ),
      ];

      const numericScore = Math.max(
        0,
        Math.min(
          100,
          Number(riskScore) || 0
        )
      );

      setResult({
        transcript,
        riskScore: Math.round(numericScore),
        riskLevel: String(riskLevel).toUpperCase(),
        recommendedAction,
        reasons: uniqueSignals,
        tactics,
        indicators,
        engineUsed,
      });

      toast.success(
        "Voice Fraud Analysis Complete!"
      );

    } catch (err) {
      console.error(
        "VOICE ANALYSIS ERROR:",
        err
      );

      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to analyze voice recording. Try again.";

      setError(errMsg);

      toast.error(errMsg);

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // COPY TRANSCRIPT
  // ==========================================
  const copyTranscript = async () => {
    if (!result?.transcript) return;

    try {
      await navigator.clipboard.writeText(
        result.transcript
      );

      setCopied(true);

      toast.info(
        "Transcript copied to clipboard!"
      );

      setTimeout(() => {
        setCopied(false);
      }, 2000);

    } catch (err) {
      console.error("COPY ERROR:", err);
      toast.error("Could not copy transcript.");
    }
  };

  // ==========================================
  // RESET
  // ==========================================
  const resetAnalyzer = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }

    setAudio(null);
    setResult(null);
    setError("");
    setRecordedAudioUrl(null);
    setRecording(false);
    setRecordingTimer(0);
    setCopied(false);

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }

    audioChunksRef.current = [];
  };

  const riskLevelClass = String(
    result?.riskLevel || "LOW"
  ).toLowerCase();

  return (
    <>
      <Navbar />

      <main className="voice-page">
        <div className="voice-grid"></div>
        <div className="voice-glow voice-glow-one"></div>
        <div className="voice-glow voice-glow-two"></div>

        <div className="voice-container">

          <section className="voice-header">
            <Link to="/" className="back-link">
              <span>←</span> Back to Dashboard
            </Link>

            <div className="header-title-group">
              <div className="voice-label">
                <span className="badge-dot"></span>
                NEURAL SPEECH DEEP-SCAN
              </div>

              <h1>
                Voice Scam <span>Analyzer</span>
              </h1>

              <p>
                Upload call recordings or capture live
                microphone speech. Our AI engine transcribes
                audio and detects coercion, fake authority,
                urgency, and scam patterns.
              </p>
            </div>
          </section>

          <div className="voice-main-layout">

            {/* LEFT */}
            <section className="voice-upload-card">

              <div className="voice-card-top">
                <div>
                  <span className="voice-section-label">
                    01 // AUDIO INGESTION
                  </span>

                  <h2>
                    Upload or Record Speech
                  </h2>

                  <p>
                    Provide an audio file or record from
                    your microphone to test for scam
                    indicators.
                  </p>
                </div>

                <div className="voice-ai-status">
                  <span></span>
                  AI OPERATIONAL
                </div>
              </div>

              <div className="voice-input-grid">

                <label
                  className={`audio-upload-box ${
                    audio && !recordedAudioUrl
                      ? "has-file"
                      : ""
                  }`}
                >
                  <input
                    type="file"
                    accept=".mp3,.wav,.m4a,.webm,audio/*"
                    onChange={handleFileChange}
                    disabled={recording || loading}
                  />

                  <div className="upload-icon">
                    🎧
                  </div>

                  <strong>
                    Choose Audio File
                  </strong>

                  <span>
                    MP3, WAV, M4A, WEBM formats supported
                  </span>
                </label>

                <div
                  className={`record-box ${
                    recording
                      ? "is-recording"
                      : ""
                  }`}
                >
                  <div className="record-icon">
                    {recording ? "🎙️" : "🎤"}
                  </div>

                  <strong>
                    {recording
                      ? "Recording Active..."
                      : "Live Microphone Stream"}
                  </strong>

                  <span>
                    {recording
                      ? `Duration: ${formatTimer(
                          recordingTimer
                        )}`
                      : "Record audio directly from your microphone"}
                  </span>

                  {!recording ? (
                    <button
                      type="button"
                      className="record-btn"
                      onClick={startRecording}
                      disabled={loading}
                    >
                      <span>🎙</span>
                      Start Recording
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="stop-record-btn"
                      onClick={stopRecording}
                    >
                      <span>⏹</span>
                      Stop Recording (
                      {formatTimer(recordingTimer)})
                    </button>
                  )}
                </div>

              </div>

              {recording && (
                <div className="voice-waveform-visualizer">
                  <span className="recording-pill">
                    ● REC [{formatTimer(recordingTimer)}]
                  </span>

                  <div className="waveform-bars">
                    {[...Array(24)].map((_, i) => (
                      <span
                        key={i}
                        className="wave-bar"
                        style={{
                          animationDelay:
                            `${(i % 5) * 0.15}s`,
                        }}
                      ></span>
                    ))}
                  </div>
                </div>
              )}

              {audio && (
                <div className="selected-file">
                  <div className="selected-file-icon">
                    🎵
                  </div>

                  <div className="file-meta">
                    <span>
                      AUDIO READY FOR ANALYSIS
                    </span>

                    <strong>
                      {audio.name}
                    </strong>

                    <small>
                      {(
                        audio.size /
                        (1024 * 1024)
                      ).toFixed(2)} MB
                    </small>
                  </div>
                </div>
              )}

              {recordedAudioUrl && (
                <div className="audio-preview">
                  <div className="preview-label">
                    <span>
                      RECORDING PLAYBACK PREVIEW
                    </span>
                  </div>

                  <audio
                    controls
                    src={recordedAudioUrl}
                    className="audio-player"
                  />
                </div>
              )}

              {error && (
                <div className="error-message">
                  <span>⚠</span>
                  <p>{error}</p>
                </div>
              )}

              <div className="voice-buttons">

                <button
                  type="button"
                  className="voice-primary-btn"
                  onClick={analyzeVoice}
                  disabled={
                    loading ||
                    recording ||
                    !audio
                  }
                >
                  {loading ? (
                    <>
                      <span className="voice-loader"></span>
                      Transcribing & Evaluating...
                    </>
                  ) : (
                    <>
                      <span>🛡️</span>
                      Analyze Voice Recording
                      <b>→</b>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="voice-secondary-btn"
                  onClick={resetAnalyzer}
                  disabled={loading}
                >
                  ↻ Reset Telemetry
                </button>

              </div>

            </section>

            {/* RIGHT */}
            <div className="voice-right-column">

              {!result && !loading && (
                <section className="voice-bot-assistant-card">

                  <div className="bot-visual-badge">
                    <div className="bot-head-mini">
                      <span className="bot-antenna-dot"></span>
                      <div className="bot-visor-mini"></div>
                    </div>
                  </div>

                  <div className="bot-meta-info">
                    <span className="bot-badge-tag">
                      AI SPEECH AGENT ACTIVE
                    </span>

                    <h3>
                      Awaiting Speech Stream
                    </h3>

                    <p>
                      Upload or record audio to detect
                      coercive pressure, fake authority,
                      banking credential theft, urgency,
                      and other known fraud patterns.
                    </p>
                  </div>

                </section>
              )}

              {loading && (
                <section className="voice-loading">

                  <div className="voice-scanner">
                    <div className="scanner-wave wave-one"></div>
                    <div className="scanner-wave wave-two"></div>
                    <div className="scanner-wave wave-three"></div>
                    <span>AI</span>
                  </div>

                  <div className="loading-text-group">
                    <h3>
                      Deep Neural Speech Transcription
                    </h3>

                    <p>
                      Transcribing audio and evaluating
                      semantic fraud indicators...
                    </p>
                  </div>

                </section>
              )}

              {result && !loading && (
                <section
                  className={`voice-result ${riskLevelClass}`}
                >

                  <div className="voice-result-header">

                    <div>
                      <span className="voice-section-label">
                        02 // THREAT VERDICT
                      </span>

                      <h2>
                        Voice Threat Assessment
                      </h2>
                    </div>

                    <div
                      className={`voice-risk-badge ${riskLevelClass}`}
                    >
                      <span className="dot"></span>
                      {result.riskLevel} RISK
                    </div>

                  </div>

                  <div className="voice-risk-grid">

                    <div className="voice-result-card score-card">
                      <span>
                        AI RISK SCORE
                      </span>

                      <h3>
                        {result.riskScore}
                        <small>/100</small>
                      </h3>
                    </div>

                    <div className="voice-result-card">
                      <span>
                        RISK LEVEL
                      </span>

                      <h3
                        className={`level-text ${riskLevelClass}`}
                      >
                        {result.riskLevel}
                      </h3>
                    </div>

                    <div className="voice-result-card action-card">
                      <span>
                        RECOMMENDED DIRECTIVE
                      </span>

                      <p>
                        {result.recommendedAction}
                      </p>
                    </div>

                  </div>

                  <div className="transcript-box">

                    <div className="result-box-heading">

                      <div className="result-box-icon">
                        📝
                      </div>

                      <div>
                        <span>
                          SPEECH RECOGNITION
                        </span>

                        <h3>
                          AI Generated Transcript
                        </h3>
                      </div>

                      <button
                        className="copy-transcript-btn"
                        onClick={copyTranscript}
                      >
                        {copied
                          ? "✓ Copied"
                          : "📋 Copy"}
                      </button>

                    </div>

                    <div className="transcript-content">
                      <p>
                        {result.transcript ||
                          "No discernible human speech detected in the audio file."}
                      </p>
                    </div>

                  </div>

                  <div className="voice-reasons">

                    <div className="reasons-header">

                      <div>
                        <span>
                          DETECTED SIGNALS
                        </span>

                        <h3>
                          Fraud Indicators & Signals
                        </h3>
                      </div>

                      <span className="reasons-count">
                        {result.reasons?.length || 0}
                        {" "}SIGNALS
                      </span>

                    </div>

                    {result.reasons &&
                    result.reasons.length > 0 ? (

                      <div className="voice-reasons-list">

                        {result.reasons.map(
                          (reason, index) => (

                            <div
                              className={`voice-reason-item ${riskLevelClass}`}
                              key={index}
                            >
                              <span className="reason-idx">
                                {String(
                                  index + 1
                                ).padStart(2, "0")}
                              </span>

                              <p>
                                {reason}
                              </p>
                            </div>

                          )
                        )}

                      </div>

                    ) : (

                      <div className="no-voice-reasons">
                        <span className="safe-icon">
                          ✓
                        </span>

                        <p>
                          No coercive tactics, deceptive
                          keywords, or known scam scripts
                          detected.
                        </p>
                      </div>

                    )}

                    <div className="engine-info">
                      Engine: {result.engineUsed}
                    </div>

                  </div>

                </section>
              )}

            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default VoiceAnalyzer;