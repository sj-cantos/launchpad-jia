"use client";

import React, { useState } from "react";

export interface PreScreeningQuestion {
  id: string;
  question: string;
  type: "dropdown" | "short-answer" | "long-answer" | "checkboxes" | "range";
  options?: string[];
  required?: boolean;
  rangeMin?: number;
  rangeMax?: number;
  rangeCurrency?: string;
}

interface PreScreeningQuestionsProps {
  questions: PreScreeningQuestion[];
  onQuestionsChange: (questions: PreScreeningQuestion[]) => void;
}

export default function PreScreeningQuestions({
  questions,
  onQuestionsChange,
}: PreScreeningQuestionsProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // 💡 Suggested premade questions
  const suggestedQuestions: PreScreeningQuestion[] = [
    {
      id: "notice_period",
      question: "How long is your notice period?",
      type: "short-answer",
      required: true,
    },
    {
      id: "work_setup",
      question: "Are you willing to report to the office when required?",
      type: "dropdown",
      options: ["Yes", "No"],
      required: true,
    },
    {
      id: "asking_salary",
      question: "How much is your expected monthly salary?",
      type: "range",
      rangeMin: 0,
      rangeMax: 100000,
      rangeCurrency: "PHP",
      required: true,
    },
  ];

  const isQuestionAdded = (id: string) => questions.some((q) => q.id === id);

  const handleAddSuggested = (q: PreScreeningQuestion) => {
    if (!isQuestionAdded(q.id)) {
      onQuestionsChange([...questions, q]);
    }
  };

  const addCustomQuestion = () => {
    const newQuestion: PreScreeningQuestion = {
      id: `custom_${Date.now()}`,
      question: "",
      type: "short-answer",
      required: false,
    };
    onQuestionsChange([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updates: Partial<PreScreeningQuestion>) => {
    const updatedQuestions = questions.map((q, i) =>
      i === index ? { ...q, ...updates } : q
    );
    onQuestionsChange(updatedQuestions);
  };

  const deleteQuestion = (index: number) => {
    onQuestionsChange(questions.filter((_, i) => i !== index));
  };

  const addOption = (questionIndex: number) => {
    const question = questions[questionIndex];
    if (
      question.options &&
      (question.type === "dropdown" || question.type === "checkboxes")
    ) {
      updateQuestion(questionIndex, {
        options: [...question.options, ""],
      });
    }
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const question = questions[questionIndex];
    if (
      question.options &&
      (question.type === "dropdown" || question.type === "checkboxes")
    ) {
      const updatedOptions = question.options.map((opt, i) =>
        i === optionIndex ? value : opt
      );
      updateQuestion(questionIndex, { options: updatedOptions });
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex];
    if (
      question.options &&
      question.options.length > 1 &&
      (question.type === "dropdown" || question.type === "checkboxes")
    ) {
      const updatedOptions = question.options.filter((_, i) => i !== optionIndex);
      updateQuestion(questionIndex, { options: updatedOptions });
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newQuestions = [...questions];
    const draggedQuestion = newQuestions[draggedIndex];
    newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(dropIndex, 0, draggedQuestion);

    onQuestionsChange(newQuestions);
    setDraggedIndex(null);
  };

  return (
    <div>
      {/* 🧠 Suggested Pre-screening Questions */}
      

      {/* Section Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>
            2. Pre-Screening Questions
          </span>
          <span style={{ fontSize: 13, color: "#9CA3AF" }}>(optional)</span>
        </div>
        <button
          onClick={addCustomQuestion}
          style={{
            background: "#000",
            color: "#fff",
            border: "none",
            padding: "6px 12px",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <i className="la la-plus" style={{ fontSize: 14 }}></i>
          Add custom
        </button>
      </div>

      {/* 🧩 Dynamic Questions List */}
      {questions.map((question, index) => (
        <div
          key={question.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
          style={{
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "12px",
            cursor: "move",
          }}
        >
          {/* Question Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <i
              className="la la-grip-vertical"
              style={{ color: "#9CA3AF", fontSize: 16 }}
            ></i>
            <input
              type="text"
              value={question.question}
              onChange={(e) =>
                updateQuestion(index, { question: e.target.value })
              }
              placeholder="Enter your question"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "15px",
                fontWeight: "500",
                color: "#181D27",
              }}
            />
            <select
              value={question.type}
              onChange={(e) => {
                const newType = e.target.value as PreScreeningQuestion["type"];
                const updates: Partial<PreScreeningQuestion> = { type: newType };

                if (newType === "dropdown" || newType === "checkboxes") {
                  if (!question.options) {
                    updates.options = [""];
                  }
                } else if (newType === "range") {
                  updates.options = undefined;
                  if (!question.rangeMin) updates.rangeMin = 0;
                  if (!question.rangeMax) updates.rangeMax = 100;
                  if (!question.rangeCurrency) updates.rangeCurrency = "PHP";
                } else {
                  updates.options = undefined;
                  updates.rangeMin = undefined;
                  updates.rangeMax = undefined;
                  updates.rangeCurrency = undefined;
                }

                updateQuestion(index, updates);
              }}
              style={{
                padding: "6px 12px",
                border: "1px solid #D1D5DB",
                borderRadius: "6px",
                fontSize: "14px",
                outline: "none",
                minWidth: "120px",
              }}
            >
              <option value="short-answer">Short Answer</option>
              <option value="long-answer">Long Answer</option>
              <option value="dropdown">Dropdown</option>
              <option value="checkboxes">Checkboxes</option>
              <option value="range">Range</option>
            </select>
            <button
              onClick={() => deleteQuestion(index)}
              style={{
                background: "none",
                border: "none",
                color: "#9CA3AF",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <i className="la la-times" style={{ fontSize: 16 }}></i>
            </button>
          </div>

          {/* Dropdown / Checkbox Options */}
          {(question.type === "dropdown" || question.type === "checkboxes") &&
            question.options && (
              <div style={{ marginLeft: 24 }}>
                {question.options.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 14, color: "#6B7280", minWidth: 20 }}>
                      {optionIndex + 1}
                    </span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) =>
                        updateOption(index, optionIndex, e.target.value)
                      }
                      placeholder="Enter option"
                      style={{
                        flex: 1,
                        padding: "6px 12px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "4px",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={() => removeOption(index, optionIndex)}
                      disabled={question.options!.length === 1}
                      style={{
                        background: "none",
                        border: "none",
                        color:
                          question.options!.length === 1
                            ? "#9CA3AF"
                            : "#6B7280",
                        cursor:
                          question.options!.length === 1
                            ? "not-allowed"
                            : "pointer",
                        padding: "4px",
                      }}
                    >
                      <i className="la la-times" style={{ fontSize: 14 }}></i>
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => addOption(index)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#6B7280",
                    cursor: "pointer",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginLeft: 28,
                  }}
                >
                  <i className="la la-plus" style={{ fontSize: 12 }}></i>
                  Add Option
                </button>
              </div>
            )}

          {/* Range Type */}
          {question.type === "range" && (
            <div style={{ marginLeft: 24, marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: 12,
                      color: "#6B7280",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Minimum
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 14, color: "#374151" }}>₱</span>
                    <input
                      type="number"
                      value={question.rangeMin || 0}
                      onChange={(e) =>
                        updateQuestion(index, {
                          rangeMin: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="40,000"
                      style={{
                        flex: 1,
                        padding: "6px 12px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "4px",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    />
                    <select
                      value={question.rangeCurrency || "PHP"}
                      onChange={(e) =>
                        updateQuestion(index, {
                          rangeCurrency: e.target.value,
                        })
                      }
                      style={{
                        padding: "6px 8px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "4px",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    >
                      <option value="PHP">PHP</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: 12,
                      color: "#6B7280",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Maximum
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 14, color: "#374151" }}>₱</span>
                    <input
                      type="number"
                      value={question.rangeMax || 0}
                      onChange={(e) =>
                        updateQuestion(index, {
                          rangeMax: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="60,000"
                      style={{
                        flex: 1,
                        padding: "6px 12px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "4px",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    />
                    <select
                      value={question.rangeCurrency || "PHP"}
                      onChange={(e) =>
                        updateQuestion(index, {
                          rangeCurrency: e.target.value,
                        })
                      }
                      style={{
                        padding: "6px 8px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "4px",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    >
                      <option value="PHP">PHP</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete button */}
          {questions.length > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <button
                onClick={() => deleteQuestion(index)}
                style={{
                  background: "none",
                  border: "1px solid #DC2626",
                  color: "#DC2626",
                  padding: "6px 12px",
                  borderRadius: "30px",
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <i className="la la-trash" style={{ fontSize: 12 }}></i>
                Delete Question
              </button>
            </div>
          )}
        </div>
      ))}
      <div
        style={{

          borderRadius: "8px",
          padding: "16px",
          marginBottom: "16px",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "15px", color: "#111827" }}>
          Suggested Pre-screening Questions:
        </span>

        <div
          style={{
            marginTop: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {suggestedQuestions.map((q) => (
            <div
              key={q.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  {q.question.split("?")[0]}
                </div>
                <div style={{ fontSize: "13px", color: "#6B7280" }}>
                  {q.question}
                </div>
              </div>
              <button
                onClick={() => handleAddSuggested(q)}
                disabled={isQuestionAdded(q.id)}
                style={{
                  background: isQuestionAdded(q.id) ? "#E5E7EB" : "#000",
                  color: isQuestionAdded(q.id) ? "#6B7280" : "#fff",
                  border: "none",
                  borderRadius: "30px",
                  padding: "6px 16px",
                  cursor: isQuestionAdded(q.id) ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: 500,
                  minWidth: "75px",
                  transition: "0.2s ease",
                }}
              >
                {isQuestionAdded(q.id) ? "Added" : "Add"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
