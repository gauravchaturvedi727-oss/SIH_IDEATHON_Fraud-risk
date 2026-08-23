import { useState, useRef } from "react";
import api from "../services/api";

import Navbar from "../components/Navbar";

import "./VoiceAnalyzer.css";


function VoiceAnalyzer() {

    const [audio, setAudio] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [recording, setRecording] = useState(false);
    const [recordedAudioUrl, setRecordedAudioUrl] =
        useState(null);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);


    const handleFileChange = (event) => {

        const selectedFile =
            event.target.files[0];

        if (!selectedFile) return;


        if (recordedAudioUrl) {

            URL.revokeObjectURL(
                recordedAudioUrl
            );

        }


        setAudio(selectedFile);
        setResult(null);
        setError("");
        setRecordedAudioUrl(null);

    };

    const startRecording = async () => {

        try {

            setError("");
            setResult(null);


            const stream =
                await navigator.mediaDevices.getUserMedia({
                    audio: true
                });


            const mediaRecorder =
                new MediaRecorder(stream);


            mediaRecorderRef.current =
                mediaRecorder;


            audioChunksRef.current = [];


            mediaRecorder.ondataavailable =
                (event) => {

                    if (event.data.size > 0) {

                        audioChunksRef.current.push(
                            event.data
                        );

                    }

                };


            mediaRecorder.onstop = () => {

                const audioBlob =
                    new Blob(
                        audioChunksRef.current,
                        {
                            type: "audio/webm"
                        }
                    );


                const recordedFile =
                    new File(
                        [audioBlob],
                        "voice-recording.webm",
                        {
                            type: "audio/webm"
                        }
                    );


                if (recordedAudioUrl) {

                    URL.revokeObjectURL(
                        recordedAudioUrl
                    );

                }


                const audioUrl =
                    URL.createObjectURL(
                        audioBlob
                    );


                setAudio(recordedFile);

                setRecordedAudioUrl(
                    audioUrl
                );


                stream.getTracks().forEach(
                    (track) => track.stop()
                );

            };


            mediaRecorder.start();

            setRecording(true);

        }
        catch (error) {

            console.error(
                "MICROPHONE ERROR:",
                error
            );


            setError(
                "Microphone access was denied or unavailable."
            );

        }

    };


    const stopRecording = () => {

        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !==
            "inactive"
        ) {

            mediaRecorderRef.current.stop();

            setRecording(false);

        }

    };

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


            const formData =
                new FormData();


            formData.append(
                "audio",
                audio
            );

            console.log(
                "SENDING AUDIO TO BACKEND:",
                audio.name
            );


            const response =
                await api.post(

                    "/voice/analyze",

                    formData

                );


            console.log(
                "VOICE RESPONSE:",
                response.data
            );

            setResult({

                transcript:
                    response.data.transcript || "",


                riskScore:
                    response.data.riskScore ?? 0,


                riskLevel:
                    response.data.riskLevel || "LOW",


                recommendedAction:
                    response.data.recommendedAction ||
                    "Remain cautious and avoid sharing sensitive information.",


                reasons:
                    response.data.reasons ||
                    response.data.detectedIndicators ||
                    []

            });

        }
        catch (error) {

            console.error(
                "VOICE ANALYSIS ERROR:",
                error
            );


            console.log(
                "SERVER RESPONSE:",
                error.response?.data
            );


            setError(

                error.response?.data?.message ||

                "Failed to analyze voice recording. Please try again."

            );

        }
        finally {

            setLoading(false);

        }

    };

    const resetAnalyzer = () => {

        if (recording) {

            stopRecording();

        }


        if (recordedAudioUrl) {

            URL.revokeObjectURL(
                recordedAudioUrl
            );

        }


        setAudio(null);
        setResult(null);
        setError("");
        setRecordedAudioUrl(null);
        setRecording(false);

    };


    return (

        <>

            <Navbar />


            <main className="voice-page">

                <div className="voice-grid"></div>

                <div className="voice-glow voice-glow-one"></div>

                <div className="voice-glow voice-glow-two"></div>


                <div className="voice-container">


                    <section className="voice-header">

                        <div className="voice-label">

                            <span></span>

                            VOICE SECURITY AI

                        </div>


                        <h1>

                            Voice Scam

                            <span> Analyzer</span>

                        </h1>


                        <p>

                            Upload or record a suspicious call.
                            Our AI converts voice to text and analyzes
                            the conversation for possible scam and fraud
                            indicators.

                        </p>

                    </section>

                    <section className="voice-upload-card">


                        <div className="voice-card-top">

                            <div>

                                <span className="voice-section-label">

                                    AUDIO INSPECTION

                                </span>


                                <h2>

                                    Upload or Record Audio

                                </h2>


                                <p>

                                    Select an audio file or record
                                    a suspicious conversation directly.

                                </p>

                            </div>


                            <div className="voice-ai-status">

                                <span></span>

                                AI READY

                            </div>

                        </div>


                        <div className="voice-input-grid">


                            <label className="audio-upload-box">

                                <input

                                    type="file"

                                    accept=".mp3,.wav,.m4a,.webm,audio/*"

                                    onChange={handleFileChange}

                                    disabled={
                                        recording ||
                                        loading
                                    }

                                />


                                <div className="upload-icon">

                                    🎧

                                </div>


                                <strong>

                                    Choose Audio File

                                </strong>


                                <span>

                                    MP3, WAV, M4A or WEBM

                                </span>

                            </label>


                            <div className="record-box">


                                <div className="record-icon">

                                    🎤

                                </div>


                                <strong>

                                    Record Live Audio

                                </strong>


                                <span>

                                    Use your microphone

                                </span>


                                {!recording ? (

                                    <button

                                        type="button"

                                        className="record-btn"

                                        onClick={
                                            startRecording
                                        }

                                        disabled={loading}

                                    >

                                        🎙 Start Recording

                                    </button>

                                ) : (

                                    <button

                                        type="button"

                                        className="stop-record-btn"

                                        onClick={
                                            stopRecording
                                        }

                                    >

                                        ⏹ Stop Recording

                                    </button>

                                )}

                            </div>

                        </div>


                        {recording && (

                            <div className="recording-status">

                                <span></span>

                                Recording in progress...

                            </div>

                        )}


                        {audio && (

                            <div className="selected-file">

                                <div className="selected-file-icon">

                                    🎵

                                </div>


                                <div>

                                    <span>

                                        AUDIO READY FOR ANALYSIS

                                    </span>


                                    <strong>

                                        {audio.name}

                                    </strong>

                                </div>

                            </div>

                        )}


                        {recordedAudioUrl && (

                            <div className="audio-preview">

                                <span>

                                    RECORDING PREVIEW

                                </span>


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

                                {error}

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

                                        Analyzing Audio...

                                    </>

                                ) : (

                                    <>

                                        <span>🛡️</span>

                                        Analyze Voice

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

                                ↻ Reset

                            </button>

                        </div>

                    </section>

                    {loading && (

                        <section className="voice-loading">

                            <div className="voice-scanner">

                                <div className="scanner-wave wave-one"></div>

                                <div className="scanner-wave wave-two"></div>

                                <div className="scanner-wave wave-three"></div>

                                <span>

                                    AI

                                </span>

                            </div>


                            <div>

                                <h3>

                                    Processing audio with AI

                                </h3>


                                <p>

                                    Converting speech to text and detecting
                                    suspicious scam indicators...

                                </p>

                            </div>

                        </section>

                    )}

                    {result && !loading && (

                        <section
                            className={`voice-result ${
                                String(
                                    result.riskLevel || "LOW"
                                ).toLowerCase()
                            }`}
                        >

                            <div className="voice-result-header">

                                <div>

                                    <span className="voice-section-label">

                                        AI ANALYSIS COMPLETE

                                    </span>


                                    <h2>

                                        Voice Threat Assessment

                                    </h2>

                                </div>


                                <div
                                    className={`voice-risk-badge ${
                                        String(
                                            result.riskLevel || "LOW"
                                        ).toLowerCase()
                                    }`}
                                >

                                    {result.riskLevel || "LOW"} RISK

                                </div>

                            </div>


                            <div className="voice-risk-grid">

                                <div className="voice-result-card score-card">

                                    <span>

                                        AI RISK SCORE

                                    </span>


                                    <h3>

                                        {result.riskScore ?? 0}

                                        <small>/100</small>

                                    </h3>

                                </div>


                                <div className="voice-result-card">

                                    <span>

                                        RISK LEVEL

                                    </span>


                                    <h3>

                                        {result.riskLevel || "LOW"}

                                    </h3>

                                </div>


                                <div className="voice-result-card action-card">

                                    <span>

                                        RECOMMENDED ACTION

                                    </span>


                                    <p>

                                        {
                                            result.recommendedAction ||
                                            "Remain cautious and avoid sharing sensitive information."
                                        }

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

                                            SPEECH TO TEXT

                                        </span>


                                        <h3>

                                            AI Generated Transcript

                                        </h3>

                                    </div>

                                </div>


                                <p>

                                    {
                                        result.transcript ||
                                        "No speech detected in the audio."
                                    }

                                </p>

                            </div>

                            <div className="voice-reasons">

                                <div className="reasons-header">

                                    <div>

                                        <span>

                                            SECURITY SIGNALS

                                        </span>


                                        <h3>

                                            Suspicious Indicators

                                        </h3>

                                    </div>


                                    <span className="reasons-count">

                                        {
                                            result.reasons?.length || 0
                                        } SIGNALS

                                    </span>

                                </div>


                                {
                                    result.reasons &&
                                    result.reasons.length > 0
                                        ? (

                                            <div className="voice-reasons-list">

                                                {
                                                    result.reasons.map(
                                                        (reason, index) => (

                                                            <div
                                                                className="voice-reason-item"
                                                                key={index}
                                                            >

                                                                <span>

                                                                    {
                                                                        String(
                                                                            index + 1
                                                                        ).padStart(
                                                                            2,
                                                                            "0"
                                                                        )
                                                                    }

                                                                </span>


                                                                <p>

                                                                    {reason}

                                                                </p>

                                                            </div>

                                                        )
                                                    )
                                                }

                                            </div>

                                        )
                                        : (

                                            <div className="no-voice-reasons">

                                                ✓ No major suspicious indicators
                                                were detected.

                                            </div>

                                        )
                                }

                            </div>

                        </section>

                    )}

                </div>

            </main>

        </>

    );

}


export default VoiceAnalyzer;