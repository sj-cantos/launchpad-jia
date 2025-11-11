"use client";

import { useState, useEffect } from "react";
import { assetConstants } from "@/lib/utils/constantsV2";
import styles from "@/lib/styles/screens/uploadCV.module.scss";

interface PreScreeningQuestion {
    _id: string;
    type: 'dropdown' | 'short-answer' | 'long-answer' | 'checkboxes' | 'range';
    question: string;
    options?: string[];
    required: boolean;
    rangeMin?: number;
    rangeMax?: number;
    rangeLabel?: string;
}

interface QuickPreScreeningProps {
    questions: PreScreeningQuestion[];
    onComplete: (answers: any) => void;
    onSkip?: () => void;
}

export default function QuickPreScreening({
    questions,
    onComplete,
    onSkip
}: QuickPreScreeningProps) {
    const [preScreenAnswers, setPreScreenAnswers] = useState<any>({});
    const [screeningLoading, setScreeningLoading] = useState(false);

    useEffect(() => {
        // Initialize answers object
        const initialAnswers = {};
        questions.forEach((question, idx) => {
            if (question.type === 'checkboxes') {
                initialAnswers[idx] = [];
            } else if (question.type === 'range') {
                initialAnswers[idx] = { min: "0", max: "0" };
            } else {
                initialAnswers[idx] = '';
            }
        });
        setPreScreenAnswers(initialAnswers);
    }, [questions]);

    const handleSubmitPreScreen = async () => {
        setScreeningLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
            onComplete(preScreenAnswers);
        } catch (error) {
            console.error('Error submitting pre-screening:', error);
        } finally {
            setScreeningLoading(false);
        }
    };

    if (!questions || questions.length === 0) {
        return (
            <div className={styles.uploadCVContainer}>
                <div className={styles.cvDetailsContainer}>
                    <div className={styles.gradient}>
                        <div className={styles.cvDetailsCard}>
                            <div className={styles.sectionTitle}>
                                <img alt="" src={assetConstants.account} />
                                No Pre-Screening Questions
                            </div>
                            <div className={styles.detailsContainer} style={{ 
                                background: "#ffffff",
                                borderRadius: "16px",
                                padding: "24px"
                            }}>
                                <span style={{ color: "#181d27" }}>No pre-screening questions for this role. You can proceed.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.uploadCVContainer}>
            <div className={styles.cvDetailsContainer}>
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                        Quick Pre-screening
                    </h2>
                    <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: '1.5', margin: 0 }}>
                        Just a few short questions to help your recruiters assess you faster. Takes less than a minute.
                    </p>
                </div>

            {questions.map((questions: any, id: number) => {
                const type = (questions.type || "").toString().toLowerCase();
                const options = Array.isArray(questions.options) ? questions.options : [];
                return (
                    <div key={id} className={styles.gradient} style={{ 
                        marginBottom: "16px",
                        background: "linear-gradient(90deg, rgba(159, 202, 237, 0.5) 0%, rgba(206, 182, 218, 0.5) 34%, rgba(235, 172, 201, 0.5) 67%, rgba(252, 206, 192, 0.5) 100%)",
                        borderRadius: "24px",
                        padding: "8px 0 0 0"
                    }}>
                        <div className={styles.cvDetailsCard} style={{
                            background: "#f8f9fc",
                            borderRadius: "24px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            padding: "12px 8px 8px 8px"
                        }}>
                            <div className={styles.sectionTitle} style={{ 
                                justifyContent: "flex-start",
                                alignItems: "center",
                                display: "flex",
                                gap: "12px",
                                margin: "0 12px",
                                fontWeight: 700,
                                fontSize: "18px",
                                lineHeight: "28px",
                                color: "#181d27"
                            }}>
                                {questions.question || `Question ${id + 1}`}
                            </div>
                            <div className={styles.detailsContainer} style={{
                                background: "#ffffff",
                                borderRadius: "16px",
                                padding: "24px"
                            }}>
                                    {type === "dropdown" && (
                                        <select
                                            className="form-control"
                                            value={preScreenAnswers[id] || ""}
                                            style={{
                                                width: "100%",
                                                maxWidth: 400,
                                                border: "1px solid #D5D7DA",
                                                padding: "10px",
                                                borderRadius: "10px",
                                                color: "#717680",
                                                fontSize: "16px",
                                            }}
                                            onChange={(e) => setPreScreenAnswers({ ...preScreenAnswers, [id]: e.target.value })}
                                        >
                                            <option value="">Select an option</option>
                                            {options.map((o: any, oIdx: number) => (
                                                <option key={oIdx} value={o.label || o}>{o.label || o}</option>
                                            ))}
                                        </select>
                                    )}
                                    {type === "checkboxes" && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                            {options.map((o: any, oIdx: number) => {
                                                const current = preScreenAnswers[id] || [];
                                                const label = o.label || o;
                                                const checked = current.includes(label);
                                                return (
                                                    <label key={oIdx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            style={{
                                                                height: 20,
                                                                width: 20,
                                                                border: "1px solid #D5D7DA",
                                                                borderRadius: 30,
                                                                cursor: "pointer",
                                                                accentColor: "#4A90E2",
                                                            }}
                                                            onChange={() => {
                                                                let next = [...current];
                                                                next = checked ? next.filter(v => v !== label) : [...next, label];
                                                                setPreScreenAnswers({ ...preScreenAnswers, [id]: next });
                                                            }}
                                                        />
                                                        <span style={{ color: "#414651" }}>{label}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {type === "range" && (
                                        <div style={{ display: "flex", gap: 10 }}>
                                            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                                                <span style={{ color: "#414651" }}>Minimum Salary</span>
                                                <div style={{ position: "relative" }}>
                                                    <span
                                                        style={{
                                                            position: "absolute",
                                                            left: "12px",
                                                            top: "50%",
                                                            transform: "translateY(-50%)",
                                                            color: "#6c757d",
                                                            fontSize: "16px",
                                                            pointerEvents: "none",
                                                        }}
                                                    >
                                                        ₱
                                                    </span>
                                                    <input
                                                        className="form-control"
                                                        type="number"
                                                        min={0}
                                                        style={{
                                                            paddingLeft: "28px",
                                                            border: "1px solid #D5D7DA",
                                                            borderRadius: "10px",
                                                            color: "#717680",
                                                            fontSize: "16px",
                                                        }}
                                                        value={preScreenAnswers[id]?.min || "0"}
                                                        onChange={(e) =>
                                                            setPreScreenAnswers({
                                                                ...preScreenAnswers,
                                                                [id]: { ...(preScreenAnswers[id] || {}), min: e.target.value },
                                                            })
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                                                <span style={{ color: "#414651" }}>Maximum Salary</span>
                                                <div style={{ position: "relative" }}>
                                                    <span
                                                        style={{
                                                            position: "absolute",
                                                            left: "12px",
                                                            top: "50%",
                                                            transform: "translateY(-50%)",
                                                            color: "#6c757d",
                                                            fontSize: "16px",
                                                            pointerEvents: "none",
                                                        }}
                                                    >
                                                        ₱
                                                    </span>
                                                    <input
                                                        className="form-control"
                                                        type="number"
                                                        min={0}
                                                        style={{
                                                            paddingLeft: "28px",
                                                            border: "1px solid #D5D7DA",
                                                            borderRadius: "10px",
                                                            color: "#717680",
                                                            fontSize: "16px",
                                                        }}
                                                        value={preScreenAnswers[id]?.max || "0"}
                                                        onChange={(e) =>
                                                            setPreScreenAnswers({
                                                                ...preScreenAnswers,
                                                                [id]: { ...(preScreenAnswers[id] || {}), max: e.target.value },
                                                            })
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {(type === "short answer" || type === "short-answer" || type === "long answer" || type === "long-answer" || !type) && (
                                        <textarea
                                            className="form-control"
                                            placeholder="Type your answer..."
                                            rows={type === "long answer" || type === "long-answer" ? 4 : 2}
                                            value={preScreenAnswers[id] || ""}
                                            onChange={(e) => setPreScreenAnswers({ ...preScreenAnswers, [id]: e.target.value })}
                                            style={{ width: "100%", maxWidth: "none" }}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div 
                    className={styles.buttonContainer} 
                    style={{ 
                        justifyContent: "flex-end !important", 
                        width: "100%",
                        display: "flex",
                        marginLeft: "auto"
                    }}
                >
                    <button
                        onClick={handleSubmitPreScreen}
                        disabled={screeningLoading}
                        style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "8px",
                            minWidth: "auto",
                            width: "auto",
                            marginLeft: "auto"
                        }}
                    >
                        {screeningLoading ? "Submitting..." : "Continue"}
                        {!screeningLoading && <img alt="arrow" src={assetConstants.arrowV3} style={{ width: "16px", height: "16px" }} />}
                    </button>
                </div>
            </div>
        </div>
    );
}