import React from 'react';

interface TipsComponentProps {
  currentStep: number;
}

const TipsComponent: React.FC<TipsComponentProps> = ({ currentStep }) => {
  const getTipsForStep = (step: number) => {
    switch (step) {
      case 0: // Step 1: Basic Information
        return [
          {
            title: "Use clear, standard job titles",
            description: "for better searchability (e.g., \"Software Engineer\" instead of \"Code Ninja\" or \"Tech Rockstar\")."
          },
          {
            title: "Avoid abbreviations",
            description: "or internal role codes that applicants may not understand (e.g., use \"QA Engineer\" instead of \"QE\" or \"QA-LT\")."
          },
          {
            title: "Keep it concise",
            description: "— job titles should be no more than a few words (2–4 max), avoiding fluff or marketing terms."
          }
        ];
      
      case 1: // Step 2: CV Review
        return [
          {
            title: "Set clear screening criteria",
            description: "Define specific requirements that candidates must meet to pass the initial CV screening."
          },
          {
            title: "Use relevant keywords",
            description: "Include industry-specific terms and skills that the AI should look for in candidate CVs."
          },
          {
            title: "Keep prompts focused",
            description: "Avoid overly complex instructions that might confuse the AI screening process."
          }
        ];
      
      case 2: // Step 3: AI Interview
        return [
          {
            title: "Design targeted questions",
            description: "Create questions that assess the specific skills and experience needed for the role."
          },
          {
            title: "Balance technical and soft skills",
            description: "Include questions that evaluate both technical competency and cultural fit."
          },
          {
            title: "Test the flow",
            description: "Review your interview questions to ensure they create a natural conversation flow."
          }
        ];
      
      default:
        return [];
    }
  };

  const tips = getTipsForStep(currentStep);

  if (tips.length === 0) {
    return null;
  }

  return (
    <div style={{ width: "320px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ backgroundColor: "#FEF9F5", border: "1px solid #FDE5D4", borderRadius: "12px", padding: "20px" }}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <i className="la la-lightbulb" style={{ fontSize: 20, color: "#EA580C" }}></i>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#EA580C" }}>Tips</span>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {tips.map((tip, index) => (
            <div key={index}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#181D27", marginBottom: 4 }}>
                {tip.title}
              </p>
              <p style={{ fontSize: 12, color: "#6c757d", margin: 0 }}>
                {tip.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TipsComponent;