"use client"

import React, { useState } from "react";

export interface PreScreeningQuestion {
  id: string;
  question: string;
  type: 'dropdown' | 'text' | 'number' | 'date';
  options?: string[];
  required?: boolean;
}

interface PreScreeningQuestionsProps {
  questions: PreScreeningQuestion[];
  onQuestionsChange: (questions: PreScreeningQuestion[]) => void;
}

export default function PreScreeningQuestions({ questions, onQuestionsChange }: PreScreeningQuestionsProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addQuestion = () => {
    const newQuestion: PreScreeningQuestion = {
      id: `question_${Date.now()}`,
      question: "",
      type: 'dropdown',
      options: [""],
      required: false
    };
    onQuestionsChange([...questions, newQuestion]);
  };

  const addCustomQuestion = () => {
    const newQuestion: PreScreeningQuestion = {
      id: `custom_${Date.now()}`,
      question: "",
      type: 'text',
      required: false
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
    if (question.options) {
      updateQuestion(questionIndex, {
        options: [...question.options, ""]
      });
    }
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const question = questions[questionIndex];
    if (question.options) {
      const updatedOptions = question.options.map((opt, i) => 
        i === optionIndex ? value : opt
      );
      updateQuestion(questionIndex, { options: updatedOptions });
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex];
    if (question.options && question.options.length > 1) {
      const updatedOptions = question.options.filter((_, i) => i !== optionIndex);
      updateQuestion(questionIndex, { options: updatedOptions });
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
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
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: 16 
      }}>
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
            gap: "6px"
          }}
        >
          <i className="la la-plus" style={{ fontSize: 14 }}></i>
          Add custom
        </button>
      </div>

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
            cursor: "move"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <i className="la la-grip-vertical" style={{ color: "#9CA3AF", fontSize: 16 }}></i>
            <input
              type="text"
              value={question.question}
              onChange={(e) => updateQuestion(index, { question: e.target.value })}
              placeholder="Enter your question"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "15px",
                fontWeight: "500",
                color: "#181D27"
              }}
            />
            <button
              onClick={() => deleteQuestion(index)}
              style={{
                background: "none",
                border: "none",
                color: "#DC2626",
                cursor: "pointer",
                padding: "4px"
              }}
            >
              <i className="la la-times" style={{ fontSize: 16 }}></i>
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <select
              value={question.type}
              onChange={(e) => {
                const newType = e.target.value as PreScreeningQuestion['type'];
                const updates: Partial<PreScreeningQuestion> = { type: newType };
                
                if (newType === 'dropdown' && !question.options) {
                  updates.options = [""];
                } else if (newType !== 'dropdown') {
                  updates.options = undefined;
                }
                
                updateQuestion(index, updates);
              }}
              style={{
                padding: "6px 12px",
                border: "1px solid #D1D5DB",
                borderRadius: "6px",
                fontSize: "14px",
                outline: "none"
              }}
            >
              <option value="dropdown">Dropdown</option>
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
            </select>
          </div>

          {question.type === 'dropdown' && question.options && (
            <div style={{ marginLeft: 24 }}>
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: "#6B7280", minWidth: 20 }}>
                    {optionIndex + 1}
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                    placeholder="Enter option"
                    style={{
                      flex: 1,
                      padding: "6px 12px",
                      border: "1px solid #D1D5DB",
                      borderRadius: "4px",
                      fontSize: "14px",
                      outline: "none"
                    }}
                  />
                  <button
                    onClick={() => removeOption(index, optionIndex)}
                    disabled={question.options!.length === 1}
                    style={{
                      background: "none",
                      border: "none",
                      color: question.options!.length === 1 ? "#9CA3AF" : "#DC2626",
                      cursor: question.options!.length === 1 ? "not-allowed" : "pointer",
                      padding: "4px"
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
                  color: "#059669",
                  cursor: "pointer",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginLeft: 28
                }}
              >
                <i className="la la-plus" style={{ fontSize: 12 }}></i>
                Add Option
              </button>
            </div>
          )}

          {questions.length > 0 && (
            <button
              onClick={() => deleteQuestion(index)}
              style={{
                background: "none",
                border: "1px solid #DC2626",
                color: "#DC2626",
                padding: "6px 12px",
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer",
                marginTop: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <i className="la la-trash" style={{ fontSize: 12 }}></i>
              Delete Question
            </button>
          )}
        </div>
      ))}
    </div>
  );
}