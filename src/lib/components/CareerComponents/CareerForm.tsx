"use client"

import React, { useEffect, useRef, useState } from "react";
import InterviewQuestionGeneratorV2 from "./InterviewQuestionGeneratorV2";
import RichTextEditor from "@/lib/components/CareerComponents/RichTextEditor";
import CustomDropdown from "@/lib/components/CareerComponents/CustomDropdown";
import Accordion from "@/lib/components/CareerComponents/Accordion";
import PreScreeningQuestions, { PreScreeningQuestion } from "@/lib/components/CareerComponents/PreScreeningQuestions";
import philippineCitiesAndProvinces from "../../../../public/philippines-locations.json";
import { candidateActionToast, errorToast } from "@/lib/Utils";
import { useAppContext } from "@/lib/context/AppContext";
import axios from "axios";
import CareerActionModal from "./CareerActionModal";
import FullScreenLoadingAnimation from "./FullScreenLoadingAnimation";
import { assetConstants } from "@/lib/utils/constantsV2";
import { Tooltip } from "react-tooltip";

// Add error border styles
const errorBorderStyles = `
  .error-border {
    border: 2px solid #EF4444 !important;
    box-shadow: none !important;
  }
  .error-border:focus {
    border: 2px solid #EF4444 !important;
    box-shadow: 0 0 0 0.2rem rgba(239, 68, 68, 0.25) !important;
  }
`;

// Setting List icons
const screeningSettingList = [
  {
    name: "Good Fit and above",
    icon: "la la-check",
  },
  {
    name: "Only Strong Fit",
    icon: "la la-check-double",
  },
  {
    name: "No Automatic Promotion",
    icon: "la la-times",
  },
];
const workSetupOptions = [
  {
    name: "Fully Remote",
  },
  {
    name: "Onsite",
  },
  {
    name: "Hybrid",
  },
];

const employmentTypeOptions = [
  {
    name: "Full-Time",
  },
  {
    name: "Part-Time",
  },
];

export default function CareerForm({ career, formType, setShowEditModal }: { career?: any, formType: string, setShowEditModal?: (show: boolean) => void }) {
  const { user, orgID } = useAppContext();
  const [jobTitle, setJobTitle] = useState(career?.jobTitle || "");
  const [description, setDescription] = useState(career?.description || "");
  const [workSetup, setWorkSetup] = useState(career?.workSetup || "");
  const [workSetupRemarks, setWorkSetupRemarks] = useState(career?.workSetupRemarks || "");
  const [screeningSetting, setScreeningSetting] = useState(career?.screeningSetting || "Good Fit and above");
  const [employmentType, setEmploymentType] = useState(career?.employmentType || "Full-Time");
  const [requireVideo, setRequireVideo] = useState(career?.requireVideo || true);
  const [salaryNegotiable, setSalaryNegotiable] = useState(career?.salaryNegotiable || true);
  const [minimumSalary, setMinimumSalary] = useState(career?.minimumSalary || "");
  const [maximumSalary, setMaximumSalary] = useState(career?.maximumSalary || "");

  // Field error states
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // CV Review settings
  const [cvSecretPrompt, setCvSecretPrompt] = useState(career?.cvSecretPrompt || "");

  // Pre-screening questions
  const [preScreeningQuestions, setPreScreeningQuestions] = useState<PreScreeningQuestion[]>(career?.preScreeningQuestions || []);

  // AI Interview settings
  const [aiInterviewScreening, setAiInterviewScreening] = useState(career?.aiInterviewScreening || "Good Fit and above");
  const [aiSecretPrompt, setAiSecretPrompt] = useState(career?.aiSecretPrompt || "");

  const [questions, setQuestions] = useState(career?.questions || [
    {
      id: 1,
      category: "CV Validation / Experience",
      questionCountToAsk: null,
      questions: [],
    },
    {
      id: 2,
      category: "Technical",
      questionCountToAsk: null,
      questions: [],
    },
    {
      id: 3,
      category: "Behavioral",
      questionCountToAsk: null,
      questions: [],
    },
    {
      id: 4,
      category: "Analytical",
      questionCountToAsk: null,
      questions: [],
    },
    {
      id: 5,
      category: "Others",
      questionCountToAsk: null,
      questions: [],
    },
  ]);
  const [country, setCountry] = useState(career?.country || "");
  const [province, setProvince] = useState(career?.province || "");
  const [city, setCity] = useState(career?.location || "");
  const [provinceList, setProvinceList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState("");
  const [isSavingCareer, setIsSavingCareer] = useState(false);
  const savingCareerRef = useRef(false);

  // Track saved career for draft state
  const [savedCareerId, setSavedCareerId] = useState(career?._id || null);
  const [isDraft, setIsDraft] = useState(false);

  // Stepper state
  const steps = ["Career Details", "CV Review", "AI Interview", "Review"];
  const stepIcons = ["la la-briefcase", "la la-clipboard-list", "la la-robot", "la la-eye"];
  const [currentStep, setCurrentStep] = useState(0); // 0-indexed
  const stepStatus = ["Completed", "Pending", "In Progress"];

  // Edit states for accordion sections
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    jobTitle: "",
    description: "",
    workSetup: "",
    workSetupRemarks: "",
    employmentType: "",
    minimumSalary: "",
    maximumSalary: "",
    salaryNegotiable: true,
    country: "",
    province: "",
    city: "",
    screeningSetting: "",
    cvSecretPrompt: "",
    preScreeningQuestions: [] as PreScreeningQuestion[],
    aiInterviewScreening: "",
    aiSecretPrompt: "",
    requireVideo: true
  });

  const isFormValid = () => {
    // For step 1, only require basic fields
    if (currentStep === 0) {
      return jobTitle?.trim().length > 0 && description?.trim().length > 0 && workSetup?.trim().length > 0;
    }
    // For other steps, require all fields including questions
    return jobTitle?.trim().length > 0 && description?.trim().length > 0 && questions.some((q) => q.questions.length > 0) && workSetup?.trim().length > 0;
  }

  // Process step state for stepper
  const processState = (index: number, isAdvance = false) => {
    if (currentStep === index) {
      return isAdvance ? stepStatus[2] : stepStatus[2]; // In Progress
    }
    if (currentStep > index) {
      return stepStatus[0]; // Completed
    }
    return stepStatus[1]; // Pending
  };

  // Fetch organization members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await axios.post("/api/fetch-members", { orgID });
        // Organization members fetched but not used for team access anymore
      } catch (error) {
        console.error("Error fetching members:", error);
      }
    };
    if (orgID) {
      fetchMembers();
    }
  }, [orgID]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Keep basic click outside handling for any other dropdowns
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const updateCareer = async (status: string) => {
    if (Number(minimumSalary) && Number(maximumSalary) && Number(minimumSalary) > Number(maximumSalary)) {
      errorToast("Minimum salary cannot be greater than maximum salary", 1300);
      return;
    }
    let userInfoSlice = {
      image: user.image,
      name: user.name,
      email: user.email,
    };
    const careerId = savedCareerId || career?._id;

    const updatedCareer = {
      _id: careerId,
      jobTitle,
      description,
      workSetup,
      workSetupRemarks,
      questions,
      lastEditedBy: userInfoSlice,
      status,
      updatedAt: Date.now(),
      screeningSetting,
      cvSecretPrompt,
      preScreeningQuestions,
      aiInterviewScreening,
      aiSecretPrompt,
      requireVideo,
      salaryNegotiable,
      minimumSalary: isNaN(Number(minimumSalary)) ? null : Number(minimumSalary),
      maximumSalary: isNaN(Number(maximumSalary)) ? null : Number(maximumSalary),
      country,
      province,
      // Backwards compatibility
      location: city,
      employmentType,
    }
    try {
      setIsSavingCareer(true);
      const response = await axios.post("/api/update-career", updatedCareer);
      if (response.status === 200) {
        candidateActionToast(
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#181D27" }}>Career updated</span>
          </div>,
          1300,
          <i className="la la-check-circle" style={{ color: "#039855", fontSize: 32 }}></i>)
        // No redirect - keep user on edit form
      }
    } catch (error) {
      console.error(error);
      errorToast("Failed to update career", 1300);
    } finally {
      setIsSavingCareer(false);
    }
  }


  const confirmSaveCareer = (status: string) => {
    if (Number(minimumSalary) && Number(maximumSalary) && Number(minimumSalary) > Number(maximumSalary)) {
      errorToast("Minimum salary cannot be greater than maximum salary", 1300);
      return;
    }

    setShowSaveModal(status);
  }

  // Edit helper functions
  const startEditing = (section: string) => {
    setEditingSection(section);
    // Copy current form data to edit form
    setEditFormData({
      jobTitle: jobTitle,
      description: description,
      workSetup: workSetup,
      workSetupRemarks: workSetupRemarks,
      employmentType: employmentType,
      minimumSalary: minimumSalary,
      maximumSalary: maximumSalary,
      salaryNegotiable: salaryNegotiable,
      country: country,
      province: province,
      city: city,
      screeningSetting: screeningSetting,
      cvSecretPrompt: cvSecretPrompt,
      preScreeningQuestions: preScreeningQuestions,
      aiInterviewScreening: aiInterviewScreening,
      aiSecretPrompt: aiSecretPrompt,
      requireVideo: requireVideo
    });
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditFormData({
      jobTitle: "",
      description: "",
      workSetup: "",
      workSetupRemarks: "",
      employmentType: "",
      minimumSalary: "",
      maximumSalary: "",
      salaryNegotiable: true,
      country: "",
      province: "",
      city: "",
      screeningSetting: "",
      cvSecretPrompt: "",
      preScreeningQuestions: [],
      aiInterviewScreening: "",
      aiSecretPrompt: "",
      requireVideo: true
    });
  };

  const saveEditing = async () => {
    try {
      // Update individual state variables with edit data
      setJobTitle(editFormData.jobTitle);
      setDescription(editFormData.description);
      setWorkSetup(editFormData.workSetup);
      setWorkSetupRemarks(editFormData.workSetupRemarks);
      setEmploymentType(editFormData.employmentType);
      setMinimumSalary(editFormData.minimumSalary);
      setMaximumSalary(editFormData.maximumSalary);
      setSalaryNegotiable(editFormData.salaryNegotiable);
      setCountry(editFormData.country);
      setProvince(editFormData.province);
      setCity(editFormData.city);
      setScreeningSetting(editFormData.screeningSetting);
      setCvSecretPrompt(editFormData.cvSecretPrompt);
      setPreScreeningQuestions(editFormData.preScreeningQuestions);
      setAiInterviewScreening(editFormData.aiInterviewScreening);
      setAiSecretPrompt(editFormData.aiSecretPrompt);
      setRequireVideo(editFormData.requireVideo);

      // Save to database if editing existing career
      if (savedCareerId) {
        await updateCareer("active");
      }

      setEditingSection(null);
      candidateActionToast(
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#181D27" }}>Changes saved successfully!</span>
        </div>,
        1300,
        <i className="la la-check-circle" style={{ color: "#039855", fontSize: 32 }}></i>
      );
    } catch (error) {
      console.error("Error saving edits:", error);
      errorToast("Error saving changes", 1300);
    }
  };

  const continueToNextStep = async () => {
    // Clear previous errors
    setFieldErrors({});

    // Validate required fields for current step
    const errors: { [key: string]: string } = {};

    if (currentStep === 0) {
      // Validate Career Details fields
      if (!jobTitle?.trim()) {
        errors.jobTitle = "This is a required field";
      }
      if (!description?.trim()) {
        errors.description = "This is a required field";
      }
      if (!workSetup?.trim()) {
        errors.workSetup = "This is a required field";
      }
      if (!employmentType?.trim()) {
        errors.employmentType = "This is a required field";
      }

      // Validate Location fields
      if (!country?.trim()) {
        errors.country = "This is a required field";
      }
      if (!province?.trim()) {
        errors.province = "This is a required field";
      }
      if (!city?.trim()) {
        errors.city = "This is a required field";
      }

      // Validate Salary fields
      if (!minimumSalary || minimumSalary.toString().trim() === "") {
        errors.minimumSalary = "This is a required field";
      }
      if (!maximumSalary || maximumSalary.toString().trim() === "") {
        errors.maximumSalary = "This is a required field";
      }

      // Check if there are any validation errors
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        errorToast("Please fill in all required fields", 1300);
        return;
      }
    }

    // Validate salary if provided
    if (Number(minimumSalary) && Number(maximumSalary) && Number(minimumSalary) > Number(maximumSalary)) {
      errorToast("Minimum salary cannot be greater than maximum salary", 1300);
      return;
    }

    // Always save data before moving to next step
    try {
      setIsSavingCareer(true);

      let userInfoSlice = {
        image: user.image,
        name: user.name,
        email: user.email,
      };

      // Determine status based on current step
      const careerStatus = currentStep === 3 ? "active" : "draft";

      if (savedCareerId) {
        // Update existing career
        const updatedCareer = {
          _id: savedCareerId,
          jobTitle,
          description,
          workSetup,
          workSetupRemarks,
          questions,
          lastEditedBy: userInfoSlice,
          status: careerStatus,
          updatedAt: Date.now(),
          screeningSetting,
          cvSecretPrompt,
          preScreeningQuestions,
          aiInterviewScreening,
          aiSecretPrompt,
          requireVideo,
          salaryNegotiable,
          minimumSalary: isNaN(Number(minimumSalary)) ? null : Number(minimumSalary),
          maximumSalary: isNaN(Number(maximumSalary)) ? null : Number(maximumSalary),
          country,
          province,
          location: city,
          employmentType,
        };

        const response = await axios.post("/api/update-career", updatedCareer);
        
        // If publishing (last step), show success message and redirect
        if (currentStep === 3 && response.status === 200) {
          candidateActionToast(
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#181D27" }}>Career published successfully</span>
            </div>,
            1300,
            <i className="la la-check-circle" style={{ color: "#039855", fontSize: 32 }}></i>
          );
          setTimeout(() => {
            window.location.href = `/recruiter-dashboard/careers`;
          }, 1300);
          setIsSavingCareer(false);
          return;
        }
      } else {
        // Create new career
        const careerData = {
          jobTitle,
          description,
          workSetup,
          workSetupRemarks,
          questions,
          lastEditedBy: userInfoSlice,
          createdBy: userInfoSlice,
          screeningSetting,
          cvSecretPrompt,
          preScreeningQuestions,
          aiInterviewScreening,
          aiSecretPrompt,
          orgID,
          requireVideo,
          salaryNegotiable,
          minimumSalary: isNaN(Number(minimumSalary)) ? null : Number(minimumSalary),
          maximumSalary: isNaN(Number(maximumSalary)) ? null : Number(maximumSalary),
          country,
          province,
          location: city,
          status: careerStatus,
          employmentType,
        };

        const response = await axios.post("/api/add-career", careerData);
        if (response.status === 200) {
          setSavedCareerId(response.data._id);
          setIsDraft(careerStatus === "draft");
          
          // If publishing (last step), show success message and redirect
          if (currentStep === 3) {
            candidateActionToast(
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#181D27" }}>Career published successfully</span>
              </div>,
              1300,
              <i className="la la-check-circle" style={{ color: "#039855", fontSize: 32 }}></i>
            );
            setTimeout(() => {
              window.location.href = `/recruiter-dashboard/careers`;
            }, 1300);
            setIsSavingCareer(false);
            return;
          }
        }
      }

      setIsSavingCareer(false);
    } catch (error) {
      setIsSavingCareer(false);
      errorToast("Failed to save changes", 1300);
      return;
    }

    // Move to next step
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }

  const saveCareer = async (status: string) => {
    setShowSaveModal("");
    if (!status) {
      return;
    }

    if (!savingCareerRef.current) {
      setIsSavingCareer(true);
      savingCareerRef.current = true;
      let userInfoSlice = {
        image: user.image,
        name: user.name,
        email: user.email,
      };

      // If we already have a saved career, update it
      if (savedCareerId) {
        const updatedCareer = {
          _id: savedCareerId,
          jobTitle,
          description,
          workSetup,
          workSetupRemarks,
          questions,
          lastEditedBy: userInfoSlice,
          status,
          updatedAt: Date.now(),
          screeningSetting,
          cvSecretPrompt,
          preScreeningQuestions,
          aiInterviewScreening,
          aiSecretPrompt,
          requireVideo,
          salaryNegotiable,
          minimumSalary: isNaN(Number(minimumSalary)) ? null : Number(minimumSalary),
          maximumSalary: isNaN(Number(maximumSalary)) ? null : Number(maximumSalary),
          country,
          province,
          location: city,
          employmentType,
        };

        try {
          const response = await axios.post("/api/update-career", updatedCareer);
          if (response.status === 200) {
            candidateActionToast(
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#181D27" }}>Career {status === "active" ? "published" : "saved as unpublished"}</span>
              </div>,
              1300,
              <i className="la la-check-circle" style={{ color: "#039855", fontSize: 32 }}></i>)
            setTimeout(() => {
              window.location.href = `/recruiter-dashboard/careers`;
            }, 1300);
          }
        } catch (error) {
          errorToast("Failed to update career", 1300);
        } finally {
          savingCareerRef.current = false;
          setIsSavingCareer(false);
        }
        return;
      }

      // Otherwise create a new career
      const career = {
        jobTitle,
        description,
        workSetup,
        workSetupRemarks,
        questions,
        lastEditedBy: userInfoSlice,
        createdBy: userInfoSlice,
        screeningSetting,
        cvSecretPrompt,
        preScreeningQuestions,
        aiInterviewScreening,
        aiSecretPrompt,
        orgID,
        requireVideo,
        salaryNegotiable,
        minimumSalary: isNaN(Number(minimumSalary)) ? null : Number(minimumSalary),
        maximumSalary: isNaN(Number(maximumSalary)) ? null : Number(maximumSalary),
        country,
        province,
        // Backwards compatibility
        location: city,
        status,
        employmentType,
      }

      try {
        const response = await axios.post("/api/add-career", career);
        if (response.status === 200) {
          // Set the savedCareerId for future updates
          if (response.data && response.data._id) {
            setSavedCareerId(response.data._id);
            setIsDraft(true);
          }

          // Move to next step if status is active (Save and Continue)
          if (status === "active") {
            setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
          } else {
            // Show toast and redirect only for Save as Unpublished
            candidateActionToast(
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#181D27" }}>Career saved as unpublished</span>
              </div>,
              1300,
              <i className="la la-check-circle" style={{ color: "#039855", fontSize: 32 }}></i>)
            setTimeout(() => {
              window.location.href = `/recruiter-dashboard/careers`;
            }, 1300);
          }
        }
      } catch (error) {
        errorToast("Failed to add career", 1300);
      } finally {
        savingCareerRef.current = false;
        setIsSavingCareer(false);
      }
    }
  }

  useEffect(() => {
    const parseProvinces = () => {
      setProvinceList(philippineCitiesAndProvinces.provinces);

      // Only set defaults if editing an existing career
      if (career?.province) {
        const provinceObj = philippineCitiesAndProvinces.provinces.find((p) => p.name === career.province);
        if (provinceObj) {
          const cities = philippineCitiesAndProvinces.cities.filter((city) => city.province === provinceObj.key);
          setCityList(cities);
        }
      }
    }
    parseProvinces();
  }, [career])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: errorBorderStyles }} />
      <div className="col">
        {formType === "add" ? (<div style={{ marginBottom: "35px", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 550, color: "#374151" }}>
            {(isDraft || currentStep > 0) && jobTitle ? `[DRAFT] ${jobTitle}` : "Add new career"}
          </h1>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" }}>
            <button
              disabled={isSavingCareer}
              style={{ width: "fit-content", color: "#414651", background: "#fff", border: "1px solid #D5D7DA", padding: "8px 16px", borderRadius: "60px", cursor: isSavingCareer ? "not-allowed" : "pointer", whiteSpace: "nowrap" }} onClick={() => {
                confirmSaveCareer("inactive");
              }}>
              Save as Unpublished
            </button>
            <button
              disabled={isSavingCareer}
              style={{ width: "fit-content", background: isSavingCareer ? "#D5D7DA" : "black", color: "#fff", border: "1px solid #E9EAEB", padding: "8px 16px", borderRadius: "60px", cursor: isSavingCareer ? "not-allowed" : "pointer", whiteSpace: "nowrap" }} onClick={continueToNextStep}>
              {currentStep === 3 ? "Publish" : "Save and Continue"}
            </button>
          </div>
        </div>) : (
          <div style={{ marginBottom: "35px", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <h1 style={{ fontSize: "24px", fontWeight: 550, color: "#374151" }}>Edit Career Details</h1>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" }}>
              <button
                style={{ width: "fit-content", color: "#414651", background: "#fff", border: "1px solid #D5D7DA", padding: "8px 16px", borderRadius: "60px", cursor: "pointer", whiteSpace: "nowrap" }} onClick={() => {
                  setShowEditModal?.(false);
                }}>
                Cancel
              </button>
              <button
                disabled={!isFormValid() || isSavingCareer}
                style={{ width: "fit-content", color: "#414651", background: "#fff", border: "1px solid #D5D7DA", padding: "8px 16px", borderRadius: "60px", cursor: !isFormValid() || isSavingCareer ? "not-allowed" : "pointer", whiteSpace: "nowrap" }} onClick={() => {
                  updateCareer("inactive");
                }}>
                Save Changes as Unpublished
              </button>
              <button
                disabled={!isFormValid() || isSavingCareer}
                style={{ width: "fit-content", background: !isFormValid() || isSavingCareer ? "#D5D7DA" : "black", color: "#fff", border: "1px solid #E9EAEB", padding: "8px 16px", borderRadius: "60px", cursor: !isFormValid() || isSavingCareer ? "not-allowed" : "pointer", whiteSpace: "nowrap" }} onClick={() => {
                  updateCareer("active");
                }}>
                <i className="la la-check-circle" style={{ color: "#fff", fontSize: 20, marginRight: 8 }}></i>
                Save Changes as Published
              </button>
            </div>
          </div>
        )}

        {/* Navigation Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, padding: "0 4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Back Button */}
            <button
              disabled={currentStep === 0}
              onClick={() => {
                if (currentStep > 0) {
                  setCurrentStep(currentStep - 1);
                }
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "1px solid #E5E7EB",
                background: currentStep === 0 ? "#F9FAFB" : "#fff",
                cursor: currentStep === 0 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: currentStep === 0 ? "#9CA3AF" : "#374151"
              }}
            >
              <i className="la la-arrow-left" style={{ fontSize: 16 }}></i>
            </button>

            {/* Forward Button */}
            <button
              disabled={currentStep === steps.length - 1}
              onClick={() => {
                if (currentStep < steps.length - 1) {
                  setCurrentStep(currentStep + 1);
                }
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "1px solid #E5E7EB",
                background: currentStep === steps.length - 1 ? "#F9FAFB" : "#fff",
                cursor: currentStep === steps.length - 1 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: currentStep === steps.length - 1 ? "#9CA3AF" : "#374151"
              }}
            >
              <i className="la la-arrow-right" style={{ fontSize: 16 }}></i>
            </button>

            {/* Progress Indicator */}
            <span style={{ fontSize: 14, color: "#6B7280", marginLeft: 8 }}>
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          {/* Navigation section placeholder for future controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          </div>
        </div>

        {/* Stepper Progress - UploadCV Style */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          {/* Step Icons and Connectors */}
          <div style={{ display: "flex", gap: 32 }}>
            {steps.map((_, index) => (
              <div key={index} style={{ width: index === steps.length - 1 ? "unset" : "100%", maxWidth: index === steps.length - 1 ? "unset" : 300, alignItems: "center", display: "flex", gap: 32 }}>
                <img
                  alt=""
                  src={assetConstants[
                    processState(index, true)
                      .toLowerCase()
                      .replace(" ", "_")
                  ]}
                  style={{ height: 20, width: 20, flexShrink: 0 }}
                />
                {index < steps.length - 1 && (
                  <hr
                    style={{
                      height: 6,
                      width: "100%",
                      border: "unset",
                      borderRadius: 10,
                      margin: 0,
                      background:
                        processState(index) === "Completed"
                          ? "linear-gradient(90deg, #fccec0 0%, #ebacc9 33%, #ceb6da 66%, #9fcaed 100%)"
                          : processState(index) === "In Progress"
                            ? "linear-gradient(90deg, #fccec0 0%, #ebacc9 33%, #ceb6da 66%, #9fcaed 100%) 0 0 / 50% 100% no-repeat, #d9d9d9"
                            : "#d9d9d9",
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Labels */}
          <div style={{ display: "flex", gap: 32 }}>
            {steps.map((step, index) => (
              <span
                key={index}
                style={{
                  width: index === steps.length - 1 ? "unset" : "100%",
                  maxWidth: index === steps.length - 1 ? "unset" : 300,
                  fontWeight: 700,
                  fontSize: 14,
                  lineHeight: "20px",
                  color:
                    processState(index, true) === "In Progress"
                      ? "#181d27"
                      : "#a4a7ae",
                }}
              >
                {step}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", width: "100%", gap: 24, alignItems: "flex-start" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Step 1: Career Details */}
            {currentStep === 0 && (
              <>
                {/* 1. Career Information Card */}
                <div className="layered-card-outer">
                  <div className="layered-card-middle">
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>1. Career Information</span>
                    </div>
                    <div className="layered-card-content">
                      {/* Basic Information */}
                      <span style={{ fontSize: 15, color: "#181D27", fontWeight: 700 }}>Basic Information</span>
                      <span>Job Title</span>
                      <input
                        value={jobTitle}
                        className={`form-control ${fieldErrors.jobTitle ? 'error-border' : ''}`}
                        placeholder="Enter job title"
                        style={{
                          ...(fieldErrors.jobTitle && {
                            border: "2px solid #EF4444",
                            boxShadow: "none"
                          })
                        }}
                        onChange={(e) => {
                          setJobTitle(e.target.value || "");
                          if (fieldErrors.jobTitle) {
                            setFieldErrors({ ...fieldErrors, jobTitle: "" });
                          }
                        }}
                      ></input>
                      {fieldErrors.jobTitle && (
                        <span style={{ fontSize: 13, color: "#EF4444", marginTop: -8 }}>
                          {fieldErrors.jobTitle}
                        </span>
                      )}

                      {/* Work Setting */}
                      <span style={{ fontSize: 15, color: "#181D27", fontWeight: 700, marginTop: 16 }}>Work Setting</span>
                      <div style={{ display: "flex", flexDirection: "row", gap: 12 }}>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                          <span>Employment Type</span>
                          <CustomDropdown
                            onSelectSetting={(employmentType) => {
                              setEmploymentType(employmentType);
                            }}
                            screeningSetting={employmentType}
                            settingList={employmentTypeOptions}
                            placeholder="Choose Employment Type"
                          />
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                          <span>Work Setup Arrangement</span>
                          <CustomDropdown
                            onSelectSetting={(setting) => {
                              setWorkSetup(setting);
                              if (fieldErrors.workSetup) {
                                setFieldErrors({ ...fieldErrors, workSetup: "" });
                              }
                            }}
                            screeningSetting={workSetup}
                            settingList={workSetupOptions}
                            placeholder="Choose Work Setup"
                            hasError={!!fieldErrors.workSetup}
                          />
                          {fieldErrors.workSetup && (
                            <span style={{ fontSize: 13, color: "#EF4444", marginTop: -4 }}>
                              {fieldErrors.workSetup}
                            </span>
                          )}
                        </div>
                      </div>

                      <span>Work Setup Remarks</span>
                      <input
                        className="form-control"
                        placeholder="Additional remarks about work setup (optional)"
                        value={workSetupRemarks}
                        onChange={(e) => {
                          setWorkSetupRemarks(e.target.value || "");
                        }}
                      ></input>

                      {/* Location */}
                      <span style={{ fontSize: 15, color: "#181D27", fontWeight: 700, marginTop: 16 }}>Location</span>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <span>Country</span>
                          <CustomDropdown
                            onSelectSetting={(setting) => {
                              setCountry(setting);
                              if (fieldErrors.country) {
                                setFieldErrors({ ...fieldErrors, country: "" });
                              }
                            }}
                            screeningSetting={country}
                            settingList={[{ name: "Philippines" }]}
                            placeholder="Choose Country"
                            hasError={!!fieldErrors.country}
                          />
                          {fieldErrors.country && (
                            <span style={{ fontSize: 13, color: "#EF4444", marginTop: -4 }}>
                              {fieldErrors.country}
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <span>State / Province</span>
                          <CustomDropdown
                            onSelectSetting={(province) => {
                              setProvince(province);
                              if (fieldErrors.province) {
                                setFieldErrors({ ...fieldErrors, province: "" });
                              }
                              const provinceObj = provinceList.find((p) => p.name === province);
                              const cities = philippineCitiesAndProvinces.cities.filter((city) => city.province === provinceObj.key);
                              setCityList(cities);
                              setCity(cities[0]?.name || "");
                            }}
                            screeningSetting={province}
                            settingList={provinceList}
                            placeholder="Choose province"
                            hasError={!!fieldErrors.province}
                          />
                          {fieldErrors.province && (
                            <span style={{ fontSize: 13, color: "#EF4444", marginTop: -4 }}>
                              {fieldErrors.province}
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <span>City</span>
                          <CustomDropdown
                            onSelectSetting={(city) => {
                              setCity(city);
                              if (fieldErrors.city) {
                                setFieldErrors({ ...fieldErrors, city: "" });
                              }
                            }}
                            screeningSetting={city}
                            settingList={cityList}
                            placeholder="Choose City"
                            hasError={!!fieldErrors.city}
                          />
                          {fieldErrors.city && (
                            <span style={{ fontSize: 13, color: "#EF4444", marginTop: -4 }}>
                              {fieldErrors.city}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Salary */}
                      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginTop: 16 }}>
                        <span style={{ fontSize: 15, color: "#181D27", fontWeight: 700 }}>Salary</span>
                        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <label className="switch">
                            <input type="checkbox" checked={salaryNegotiable} onChange={() => setSalaryNegotiable(!salaryNegotiable)} />
                            <span className="slider round"></span>
                          </label>
                          <span>{salaryNegotiable ? "Negotiable" : "Fixed"}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "row", gap: 12 }}>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                          <span>Minimum Salary</span>
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
                              type="number"
                              className={`form-control ${fieldErrors.minimumSalary ? 'error-border' : ''}`}
                              style={{
                                paddingLeft: "28px",
                                paddingRight: "50px",
                                ...(fieldErrors.minimumSalary && {
                                  border: "2px solid #EF4444",
                                  boxShadow: "none"
                                })
                              }}
                              placeholder="0"
                              min={0}
                              value={minimumSalary}
                              onChange={(e) => {
                                setMinimumSalary(e.target.value || "");
                                if (fieldErrors.minimumSalary) {
                                  setFieldErrors({ ...fieldErrors, minimumSalary: "" });
                                }
                              }}
                            />
                            <span style={{
                              position: "absolute",
                              right: "12px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "#6c757d",
                              fontSize: "14px",
                              pointerEvents: "none",
                            }}>
                              PHP
                            </span>
                          </div>
                          {fieldErrors.minimumSalary && (
                            <span style={{ fontSize: 13, color: "#EF4444", marginTop: -4 }}>
                              {fieldErrors.minimumSalary}
                            </span>
                          )}
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                          <span>Maximum Salary</span>
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
                              type="number"
                              className="form-control"
                              style={{
                                paddingLeft: "28px",
                                paddingRight: "50px",
                                borderColor: fieldErrors.maximumSalary ? "#EF4444" : undefined,
                                borderWidth: fieldErrors.maximumSalary ? "2px" : undefined,
                                borderStyle: fieldErrors.maximumSalary ? "solid" : undefined
                              }}
                              placeholder="0"
                              min={0}
                              value={maximumSalary}
                              onChange={(e) => {
                                setMaximumSalary(e.target.value || "");
                                if (fieldErrors.maximumSalary) {
                                  setFieldErrors({ ...fieldErrors, maximumSalary: "" });
                                }
                              }}
                            />
                            <span style={{
                              position: "absolute",
                              right: "12px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "#6c757d",
                              fontSize: "14px",
                              pointerEvents: "none",
                            }}>
                              PHP
                            </span>
                          </div>
                          {fieldErrors.maximumSalary && (
                            <span style={{ fontSize: 13, color: "#EF4444", marginTop: -4 }}>
                              {fieldErrors.maximumSalary}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Job Description Card */}
                <div className="layered-card-outer">
                  <div className="layered-card-middle">
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>2. Job Description</span>
                    </div>
                    <div className="layered-card-content">
                      <div style={{
                        border: fieldErrors.description ? "2px solid #EF4444" : undefined,
                        borderRadius: fieldErrors.description ? "8px" : undefined,
                        padding: fieldErrors.description ? "2px" : undefined
                      }}>
                        <RichTextEditor
                          setText={(value) => {
                            setDescription(value);
                            if (fieldErrors.description) {
                              setFieldErrors({ ...fieldErrors, description: "" });
                            }
                          }}
                          text={description}
                        />
                      </div>
                      {fieldErrors.description && (
                        <span style={{ fontSize: 13, color: "#EF4444", marginTop: 8, display: "block" }}>
                          {fieldErrors.description}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

              </>
            )}

            {/* Step 2: CV Review */}
            {currentStep === 1 && (
              <>
                <div className="layered-card-outer">
                  <div className="layered-card-middle">
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>1. CV Review Settings</span>
                    </div>
                    <div className="layered-card-content">
                      {/* CV Screening */}
                      <span style={{ fontSize: 15, color: "#181D27", fontWeight: 700 }}>CV Screening</span>
                      <span style={{ fontSize: 14, color: "#6c757d", marginBottom: 12, display: "block" }}>
                        Jia automatically endorses candidates who meet the chosen criteria.
                      </span>

                      <div style={{ position: "relative", marginBottom: 16 }}>
                        <CustomDropdown
                          onSelectSetting={(setting) => {
                            setScreeningSetting(setting);
                          }}
                          screeningSetting={screeningSetting}
                          settingList={screeningSettingList}
                          placeholder="Select Screening Level"
                        />


                      </div>

                      {/* CV Secret Prompt */}
                      <div style={{ marginTop: screeningSetting ? 60 : 24 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <i className="la la-eye-slash" style={{ fontSize: 16, color: "#6c757d" }}></i>
                          <span style={{ fontSize: 15, color: "#181D27", fontWeight: 700 }}>CV Secret Prompt</span>
                          <span style={{ fontSize: 13, color: "#9CA3AF" }}>(optional)</span>
                          <div 
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              border: "1px solid #9CA3AF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "help",
                              fontSize: 10,
                              color: "#9CA3AF",
                              fontWeight: "bold"
                            }}
                            data-tooltip-id="cv-secret-prompt-tooltip"
                            data-tooltip-html="These prompts remain hidden from candidates and the public job portal.<br/>Additionally, only Admins and the Job Owner can view the secret prompt."
                          >
                            ?
                          </div>
                        </div>

                        <span style={{ fontSize: 13, color: "#6c757d", display: "block", marginBottom: 12 }}>
                          Secret Prompts give you extra control over Jia's evaluation style, complementing her accurate assessment of requirements from the job description.
                        </span>

                        <textarea
                          className="form-control"
                          placeholder="Enter a secret prompt (e.g. Give higher fit scores to candidates who participate in hackathons or competitions.)"
                          value={cvSecretPrompt}
                          onChange={(e) => setCvSecretPrompt(e.target.value)}
                          style={{
                            minHeight: 120,
                            resize: "vertical",
                            fontFamily: "inherit",
                            fontSize: 14,
                            lineHeight: "1.5"
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pre-Screening Questions */}
                <div className="layered-card-outer" style={{ marginTop: 16 }}>
                  <div className="layered-card-middle">
                    <div className="layered-card-content">
                      <PreScreeningQuestions
                        questions={preScreeningQuestions}
                        onQuestionsChange={setPreScreeningQuestions}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 3: AI Interview */}
            {currentStep === 2 && (
              <>
                <div className="layered-card-outer">
                  <div className="layered-card-middle">
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>1. AI Interview Settings</span>
                    </div>
                    <div className="layered-card-content">
                      {/* AI Interview Screening */}
                      <span style={{ fontSize: 15, color: "#181D27", fontWeight: 700 }}>AI Interview Screening</span>
                      <span style={{ fontSize: 14, color: "#6c757d", marginBottom: 12, display: "block" }}>
                        Jia automatically endorses candidates who meet the chosen criteria.
                      </span>

                      <div style={{ position: "relative", marginBottom: 16 }}>
                        <CustomDropdown
                          onSelectSetting={(setting) => {
                            setAiInterviewScreening(setting);
                          }}
                          screeningSetting={aiInterviewScreening}
                          settingList={screeningSettingList}
                          placeholder="Select Screening Level"
                        />
                      </div>

                      {/* Require Video on Interview */}
                      <div style={{ marginTop: 24 }}>
                        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <i className="la la-video" style={{ fontSize: 16, color: "#6c757d" }}></i>
                              <span style={{ fontSize: 15, color: "#181D27", fontWeight: 700 }}>Require Video on Interview</span>
                            </div>
                            <span style={{ fontSize: 14, color: "#6c757d", display: "block" }}>
                              Require candidates to keep their camera on. Recordings will appear on their analysis page.
                            </span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 16 }}>
                            <label className="switch">
                              <input type="checkbox" checked={requireVideo} onChange={() => setRequireVideo(!requireVideo)} />
                              <span className="slider round"></span>
                            </label>
                            <span style={{ fontSize: 14, color: "#181D27", fontWeight: 500 }}>{requireVideo ? "Yes" : "No"}</span>
                          </div>
                        </div>
                      </div>

                      {/* AI Interview Secret Prompt */}
                      <div style={{ marginTop: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <i className="la la-eye-slash" style={{ fontSize: 16, color: "#6c757d" }}></i>
                          <span style={{ fontSize: 15, color: "#181D27", fontWeight: 700 }}>AI Interview Secret Prompt</span>
                          <span style={{ fontSize: 13, color: "#9CA3AF" }}>(optional)</span>
                          <div 
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              border: "1px solid #9CA3AF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "help",
                              fontSize: 10,
                              color: "#9CA3AF",
                              fontWeight: "bold"
                            }}
                            data-tooltip-id="ai-interview-secret-prompt-tooltip"
                            data-tooltip-html="These prompts remain hidden from candidates and the public job portal.<br/>Additionally, only Admins and the Job Owner can view the secret prompt."
                          >
                            ?
                          </div>
                        </div>

                        <span style={{ fontSize: 13, color: "#6c757d", display: "block", marginBottom: 12 }}>
                          Secret Prompts give you extra control over Jia's evaluation style, complementing her accurate assessment of requirements from the job description.
                        </span>

                        <textarea
                          className="form-control"
                          placeholder="Enter a secret prompt (e.g. Treat candidates who speak in Taglish, English, or Tagalog equally. Focus on clarity, coherence, and confidence rather than language preference or accent.)"
                          value={aiSecretPrompt}
                          onChange={(e) => setAiSecretPrompt(e.target.value)}
                          style={{
                            minHeight: 120,
                            resize: "vertical",
                            fontFamily: "inherit",
                            fontSize: 14,
                            lineHeight: "1.5"
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Interview Questions Card */}
                <InterviewQuestionGeneratorV2
                  questions={questions}
                  setQuestions={setQuestions}
                  jobTitle={jobTitle}
                  description={description}
                />
              </>
            )}

            {/* Step 4: Review */}
            {currentStep === 3 && (
              <>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "center", 
                  width: "100%" 
                }}>
                  <div style={{ 
                    width: "90%", 
                    maxWidth: "1000px" 
                  }}>
                    <Accordion 
                      items={[
                        {
                          id: "step1",
                          title: "Career Details",
                          onEdit: () => startEditing('career-details'),
                          content: (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              {editingSection === 'career-details' ? (
                                <>
                                  {/* Editable Job Title */}
                                  <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid #E5E7EB" }}>
                                    <label style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 8 }}>Job Title</label>
                                    <input
                                      type="text"
                                      value={editFormData.jobTitle}
                                      onChange={(e) => setEditFormData({ ...editFormData, jobTitle: e.target.value })}
                                      style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        border: "1px solid #D1D5DB",
                                        borderRadius: "6px",
                                        fontSize: "15px",
                                        outline: "none"
                                      }}
                                      placeholder="Enter job title"
                                    />
                                  </div>

                                  {/* Editable Employment Type & Work Setup */}
                                  <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid #E5E7EB" }}>
                                    <div style={{ display: "flex", gap: 20 }}>
                                      <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 8 }}>Employment Type</label>
                                        <select
                                          value={editFormData.employmentType}
                                          onChange={(e) => setEditFormData({ ...editFormData, employmentType: e.target.value })}
                                          style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            border: "1px solid #D1D5DB",
                                            borderRadius: "6px",
                                            fontSize: "15px",
                                            outline: "none"
                                          }}
                                        >
                                          <option value="">Select employment type</option>
                                          <option value="full-time">Full Time</option>
                                          <option value="part-time">Part Time</option>
                                          <option value="contract">Contract</option>
                                          <option value="freelance">Freelance</option>
                                          <option value="internship">Internship</option>
                                        </select>
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 8 }}>Work Arrangement</label>
                                        <select
                                          value={editFormData.workSetup}
                                          onChange={(e) => setEditFormData({ ...editFormData, workSetup: e.target.value })}
                                          style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            border: "1px solid #D1D5DB",
                                            borderRadius: "6px",
                                            fontSize: "15px",
                                            outline: "none"
                                          }}
                                        >
                                          <option value="">Select work arrangement</option>
                                          <option value="on-site">On-site</option>
                                          <option value="remote">Remote</option>
                                          <option value="hybrid">Hybrid</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Editable Location */}
                                  <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid #E5E7EB" }}>
                                    <div style={{ display: "flex", gap: 20 }}>
                                      <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 8 }}>Country</label>
                                        <input
                                          type="text"
                                          value={editFormData.country}
                                          onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                                          style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            border: "1px solid #D1D5DB",
                                            borderRadius: "6px",
                                            fontSize: "15px",
                                            outline: "none"
                                          }}
                                          placeholder="Enter country"
                                        />
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 8 }}>State / Province</label>
                                        <input
                                          type="text"
                                          value={editFormData.province}
                                          onChange={(e) => setEditFormData({ ...editFormData, province: e.target.value })}
                                          style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            border: "1px solid #D1D5DB",
                                            borderRadius: "6px",
                                            fontSize: "15px",
                                            outline: "none"
                                          }}
                                          placeholder="Enter province"
                                        />
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 8 }}>City</label>
                                        <input
                                          type="text"
                                          value={editFormData.city}
                                          onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                                          style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            border: "1px solid #D1D5DB",
                                            borderRadius: "6px",
                                            fontSize: "15px",
                                            outline: "none"
                                          }}
                                          placeholder="Enter city"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Editable Salary */}
                                  <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid #E5E7EB" }}>
                                    <div style={{ display: "flex", gap: 20 }}>
                                      <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 8 }}>Minimum Salary</label>
                                        <input
                                          type="number"
                                          value={editFormData.minimumSalary}
                                          onChange={(e) => setEditFormData({ ...editFormData, minimumSalary: e.target.value })}
                                          style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            border: "1px solid #D1D5DB",
                                            borderRadius: "6px",
                                            fontSize: "15px",
                                            outline: "none"
                                          }}
                                          placeholder="Enter minimum salary"
                                        />
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 8 }}>Maximum Salary</label>
                                        <input
                                          type="number"
                                          value={editFormData.maximumSalary}
                                          onChange={(e) => setEditFormData({ ...editFormData, maximumSalary: e.target.value })}
                                          style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            border: "1px solid #D1D5DB",
                                            borderRadius: "6px",
                                            fontSize: "15px",
                                            outline: "none"
                                          }}
                                          placeholder="Enter maximum salary"
                                        />
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 8 }}>Negotiable</label>
                                        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "15px", color: "#181D27", cursor: "pointer" }}>
                                          <input
                                            type="checkbox"
                                            checked={editFormData.salaryNegotiable}
                                            onChange={(e) => setEditFormData({ ...editFormData, salaryNegotiable: e.target.checked })}
                                            style={{ marginRight: "8px" }}
                                          />
                                          Salary is negotiable
                                        </label>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Editable Job Description */}
                                  <div style={{ paddingBottom: 16, marginBottom: editFormData.workSetupRemarks ? 16 : 0, borderBottom: editFormData.workSetupRemarks ? "1px solid #E5E7EB" : "none" }}>
                                    <label style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 8 }}>Job Description</label>
                                    <textarea
                                      value={editFormData.description}
                                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                      style={{
                                        width: "100%",
                                        minHeight: "100px",
                                        padding: "8px 12px",
                                        border: "1px solid #D1D5DB",
                                        borderRadius: "6px",
                                        fontSize: "15px",
                                        outline: "none",
                                        resize: "vertical"
                                      }}
                                      placeholder="Enter job description"
                                    />
                                  </div>

                                  {/* Editable Work Setup Remarks */}
                                  <div>
                                    <label style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 8 }}>Work Setup Remarks</label>
                                    <textarea
                                      value={editFormData.workSetupRemarks}
                                      onChange={(e) => setEditFormData({ ...editFormData, workSetupRemarks: e.target.value })}
                                      style={{
                                        width: "100%",
                                        minHeight: "60px",
                                        padding: "8px 12px",
                                        border: "1px solid #D1D5DB",
                                        borderRadius: "6px",
                                        fontSize: "15px",
                                        outline: "none",
                                        resize: "vertical"
                                      }}
                                      placeholder="Enter work setup remarks"
                                    />
                                  </div>
                                </>
                              ) : (
                                <>
                                  {/* Job Title */}
                                  <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid #E5E7EB" }}>
                                    <span style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 4 }}>Job Title</span>
                                    <span style={{ fontSize: 15, color: "#6c757d" }}>{jobTitle || "Not specified"}</span>
                                  </div>

                                  {/* Employment Type & Work Setup */}
                                  <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid #E5E7EB" }}>
                                    <div style={{ display: "flex", gap: 20 }}>
                                      <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 4 }}>Employment Type</span>
                                        <span style={{ fontSize: 15, color: "#6c757d" }}>{employmentType || "Not specified"}</span>
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 4 }}>Work Arrangement</span>
                                        <span style={{ fontSize: 15, color: "#6c757d" }}>{workSetup || "Not specified"}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Location */}
                                  <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid #E5E7EB" }}>
                                    <div style={{ display: "flex", gap: 20 }}>
                                      <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 4 }}>Country</span>
                                        <span style={{ fontSize: 15, color: "#6c757d" }}>{country || "Not specified"}</span>
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 4 }}>State / Province</span>
                                        <span style={{ fontSize: 15, color: "#6c757d" }}>{province || "Not specified"}</span>
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 4 }}>City</span>
                                        <span style={{ fontSize: 15, color: "#6c757d" }}>{city || "Not specified"}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Salary */}
                                  <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid #E5E7EB" }}>
                                    <div style={{ display: "flex", gap: 20 }}>
                                      <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 4 }}>Minimum Salary</span>
                                        <span style={{ fontSize: 15, color: "#6c757d" }}>₱{minimumSalary || "0"} PHP</span>
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 4 }}>Maximum Salary</span>
                                        <span style={{ fontSize: 15, color: "#6c757d" }}>₱{maximumSalary || "0"} PHP</span>
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 4 }}>Negotiable</span>
                                        <span style={{ fontSize: 15, color: "#6c757d" }}>{salaryNegotiable ? "Yes" : "No"}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Job Description */}
                                  <div style={{ paddingBottom: 16, marginBottom: workSetupRemarks ? 16 : 0, borderBottom: workSetupRemarks ? "1px solid #E5E7EB" : "none" }}>
                                    <span style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 4 }}>Job Description</span>
                                    <div style={{ fontSize: 15, color: "#6c757d", lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: description || "No description provided" }}></div>
                                  </div>

                                  {/* Work Setup Remarks */}
                                  {workSetupRemarks && (
                                    <div>
                                      <span style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 4 }}>Work Setup Remarks</span>
                                      <span style={{ fontSize: 15, color: "#6c757d" }}>{workSetupRemarks}</span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )
                        },
                        {
                          id: "step2",
                          title: "CV Review",
                          onEdit: () => startEditing('cv-review'),
                          content: (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              {editingSection === 'cv-review' ? (
                                <>
                                  {/* Editable CV Screening */}
                                  <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid #E5E7EB" }}>
                                    <label style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 8 }}>CV Screening</label>
                                    <select
                                      value={editFormData.screeningSetting}
                                      onChange={(e) => setEditFormData({ ...editFormData, screeningSetting: e.target.value })}
                                      style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        border: "1px solid #D1D5DB",
                                        borderRadius: "6px",
                                        fontSize: "15px",
                                        outline: "none"
                                      }}
                                    >
                                      <option value="">Select screening type</option>
                                      <option value="manual">Manual Review</option>
                                      <option value="ai">AI Screening</option>
                                      <option value="both">Both Manual and AI</option>
                                    </select>
                                  </div>
                                  
                                  {/* Editable CV Secret Prompt */}
                                  <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid #E5E7EB" }}>
                                    <label style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 8 }}>CV Secret Prompt</label>
                                    <textarea
                                      value={editFormData.cvSecretPrompt}
                                      onChange={(e) => setEditFormData({ ...editFormData, cvSecretPrompt: e.target.value })}
                                      style={{
                                        width: "100%",
                                        minHeight: "80px",
                                        padding: "12px",
                                        border: "1px solid #D1D5DB",
                                        borderRadius: "6px",
                                        fontSize: "15px",
                                        outline: "none",
                                        resize: "vertical"
                                      }}
                                      placeholder="Enter CV screening instructions for AI"
                                    />
                                  </div>

                                  {/* Editable Pre-Screening Questions */}
                                  <div>
                                    <PreScreeningQuestions
                                      questions={editFormData.preScreeningQuestions}
                                      onQuestionsChange={(questions) => setEditFormData({ ...editFormData, preScreeningQuestions: questions })}
                                    />
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div style={{ paddingBottom: 16, marginBottom: cvSecretPrompt || preScreeningQuestions.length > 0 ? 16 : 0, borderBottom: cvSecretPrompt || preScreeningQuestions.length > 0 ? "1px solid #E5E7EB" : "none" }}>
                                    <span style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 4 }}>CV Screening</span>
                                    <span style={{ fontSize: 15, color: "#6c757d" }}>{screeningSetting || "Not specified"}</span>
                                  </div>
                                  {cvSecretPrompt && (
                                    <div style={{ paddingBottom: 16, marginBottom: preScreeningQuestions.length > 0 ? 16 : 0, borderBottom: preScreeningQuestions.length > 0 ? "1px solid #E5E7EB" : "none" }}>
                                      <span style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 4 }}>CV Secret Prompt</span>
                                      <div style={{ 
                                        padding: "12px", 
                                        backgroundColor: "#F9FAFB", 
                                        borderRadius: "6px",
                                        border: "1px solid #E5E7EB",
                                        fontSize: 15, 
                                        color: "#6c757d",
                                        lineHeight: 1.5
                                      }}>
                                        {cvSecretPrompt}
                                      </div>
                                    </div>
                                  )}
                                  {preScreeningQuestions.length > 0 && (
                                    <div>
                                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                        <span style={{ fontSize: 15, fontWeight: 600, color: "#181D27" }}>Pre-Screening Questions</span>
                                        <span style={{ 
                                          fontSize: 12, 
                                          fontWeight: 500, 
                                          color: "#059669", 
                                          backgroundColor: "#D1FAE5", 
                                          padding: "2px 6px", 
                                          borderRadius: "4px" 
                                        }}>
                                          {preScreeningQuestions.length}
                                        </span>
                                      </div>
                                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                        {preScreeningQuestions.map((question, index) => (
                                          <div key={question.id}>
                                            <div style={{ fontSize: 15, fontWeight: 500, color: "#374151", marginBottom: 8 }}>
                                              {index + 1}. {question.question || "Untitled question"}
                                            </div>
                                            {(question.type === 'dropdown' || question.type === 'checkboxes') && question.options && question.options.length > 0 && (
                                              <ul style={{ margin: 0, paddingLeft: 20, color: "#6B7280", fontSize: 15 }}>
                                                {question.options.filter(opt => opt.trim()).map((option, optIndex) => (
                                                  <li key={optIndex} style={{ marginBottom: 4 }}>
                                                    {option}
                                                  </li>
                                                ))}
                                              </ul>
                                            )}
                                            {question.type === 'range' && (
                                              <div style={{ fontSize: 14, color: "#6B7280", marginLeft: 20 }}>
                                                Preferred: {question.rangeCurrency || 'PHP'} {question.rangeMin?.toLocaleString() || '0'} - {question.rangeCurrency || 'PHP'} {question.rangeMax?.toLocaleString() || '0'}
                                              </div>
                                            )}
                                            {!['dropdown', 'checkboxes', 'range'].includes(question.type) && (
                                              <div style={{ fontSize: 14, color: "#9CA3AF", fontStyle: "italic", marginLeft: 20 }}>
                                                {question.type === 'short-answer' ? 'Short text answer' : 
                                                 question.type === 'long-answer' ? 'Long text answer' : 'Answer'}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )
                        },
                        {
                          id: "step3",
                          title: "AI Interview",
                          onEdit: () => startEditing('ai-interview'),
                          content: (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              {editingSection === 'ai-interview' ? (
                                <>
                                  {/* Editable AI Interview Screening */}
                                  <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid #E5E7EB" }}>
                                    <label style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 8 }}>AI Interview Screening</label>
                                    <select
                                      value={editFormData.aiInterviewScreening}
                                      onChange={(e) => setEditFormData({ ...editFormData, aiInterviewScreening: e.target.value })}
                                      style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        border: "1px solid #D1D5DB",
                                        borderRadius: "6px",
                                        fontSize: "15px",
                                        outline: "none"
                                      }}
                                    >
                                      <option value="">Select screening level</option>
                                      <option value="Good Fit and above">Good Fit and above</option>
                                      <option value="Only Strong Fit">Only Strong Fit</option>
                                      <option value="No Automatic Promotion">No Automatic Promotion</option>
                                    </select>
                                  </div>

                                  {/* Editable Require Video */}
                                  <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid #E5E7EB" }}>
                                    <label style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 8 }}>Require Video</label>
                                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "15px", color: "#181D27", cursor: "pointer" }}>
                                      <input
                                        type="checkbox"
                                        checked={editFormData.requireVideo}
                                        onChange={(e) => setEditFormData({ ...editFormData, requireVideo: e.target.checked })}
                                        style={{ marginRight: "8px" }}
                                      />
                                      Require video recording for interviews
                                    </label>
                                  </div>

                                  {/* Editable AI Interview Secret Prompt */}
                                  <div>
                                    <label style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 8 }}>AI Interview Secret Prompt</label>
                                    <textarea
                                      value={editFormData.aiSecretPrompt}
                                      onChange={(e) => setEditFormData({ ...editFormData, aiSecretPrompt: e.target.value })}
                                      style={{
                                        width: "100%",
                                        minHeight: "80px",
                                        padding: "12px",
                                        border: "1px solid #D1D5DB",
                                        borderRadius: "6px",
                                        fontSize: "15px",
                                        outline: "none",
                                        resize: "vertical"
                                      }}
                                      placeholder="Enter AI interview instructions and criteria"
                                    />
                                    <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "4px" }}>
                                      Note: Interview questions are generated automatically and cannot be edited here.
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid #E5E7EB" }}>
                                    <span style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 4 }}>AI Interview Screening</span>
                                    <span style={{ fontSize: 15, color: "#6c757d" }}>{aiInterviewScreening || "Not specified"}</span>
                                  </div>
                                  <div style={{ paddingBottom: 16, marginBottom: aiSecretPrompt ? 16 : (questions.length > 0 ? 16 : 0), borderBottom: (aiSecretPrompt || questions.length > 0) ? "1px solid #E5E7EB" : "none" }}>
                                    <span style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 4 }}>Require Video</span>
                                    <span style={{ fontSize: 15, color: "#6c757d" }}>{requireVideo ? "Yes" : "No"}</span>
                                  </div>
                                  {aiSecretPrompt && (
                                    <div style={{ paddingBottom: 16, marginBottom: questions.length > 0 ? 16 : 0, borderBottom: questions.length > 0 ? "1px solid #E5E7EB" : "none" }}>
                                      <span style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 4 }}>AI Interview Secret Prompt</span>
                                      <div style={{ fontSize: 15, color: "#6c757d", lineHeight: 1.5 }}>
                                        {aiSecretPrompt}
                                      </div>
                                    </div>
                                  )}
                                  {questions.length > 0 && (
                                    <div>
                                      <span style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 8 }}>Interview Questions</span>
                                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                        {questions.map((category, index) => (
                                          <div key={index} style={{ 
                                            paddingBottom: 16,
                                            marginBottom: 16,
                                            borderBottom: index < questions.length - 1 ? "1px solid #E5E7EB" : "none"
                                          }}>
                                            <span style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 8 }}>
                                              {category.category}
                                            </span>
                                            {category.questions && category.questions.length > 0 ? (
                                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                                {category.questions.map((q, qIndex) => (
                                                  <span key={qIndex} style={{ fontSize: 15, color: "#374151", lineHeight: 1.5 }}>
                                                    • {q.question}
                                                  </span>
                                                ))}
                                              </div>
                                            ) : (
                                              <span style={{ fontSize: 15, color: "#6c757d" }}>No questions added</span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {questions.length === 0 && (
                                    <div>
                                      <span style={{ fontSize: 15, fontWeight: 600, color: "#181D27", display: "block", marginBottom: 8 }}>Interview Questions</span>
                                      <span style={{ fontSize: 15, color: "#6c757d" }}>No interview questions configured</span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )
                        }
                      ]}
                      allowMultiple={true}
                    />

                    {/* Edit Control Buttons */}
                    {editingSection && (
                      <div style={{ 
                        marginTop: "20px", 
                        padding: "16px", 
                        backgroundColor: "#F9FAFB", 
                        borderRadius: "8px", 
                        border: "1px solid #E5E7EB",
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "12px"
                      }}>
                        <button
                          onClick={cancelEditing}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#F3F4F6",
                            color: "#374151",
                            border: "1px solid #D1D5DB",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: "500",
                            cursor: "pointer",
                            outline: "none"
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEditing}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#059669",
                            color: "white",
                            border: "1px solid #059669",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: "500",
                            cursor: "pointer",
                            outline: "none"
                          }}
                        >
                          Save Changes
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Tips Cards - Only show on steps 1-3 */}
          {currentStep <= 2 && (
            <div style={{ width: "320px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Step 1 Tips */}
              {currentStep === 0 && (
                <div className="layered-card-outer">
                  <div className="layered-card-middle">
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <i
                        className="la la-lightbulb"
                        style={{
                          fontSize: 20,
                          background: "linear-gradient(90deg, #fccec0 0%, #ebacc9 33%, #ceb6da 66%, #9fcaed 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text"
                        }}
                      ></i>
                      <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>Tips</span>
                    </div>
                    <div className="layered-card-content">
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#181D27", marginBottom: 4 }}>
                            Use clear, standard job titles <span style={{ fontSize: 12, color: "#6c757d", fontWeight: 400 }}>for better searchability (e.g., "Software Engineer" instead of "Code Ninja" or "Tech Rockstar").</span>
                          </p>
                        </div>

                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#181D27", marginBottom: 4 }}>
                            Avoid abbreviations <span style={{ fontSize: 12, color: "#6c757d", fontWeight: 400 }}>or internal role codes that applicants may not understand (e.g., use "QA Engineer" instead of "QE" or "QA-LT").</span>
                          </p>
                        </div>

                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#181D27", marginBottom: 4 }}>
                            Keep it concise <span style={{ fontSize: 12, color: "#6c757d", fontWeight: 400 }}>— job titles should be no more than a few words (2–4 max), avoiding fluff or marketing terms.</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 Tips */}
              {currentStep === 1 && (
                <div className="layered-card-outer">
                  <div className="layered-card-middle">
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <i
                        className="la la-lightbulb"
                        style={{
                          fontSize: 20,
                          background: "linear-gradient(90deg, #fccec0 0%, #ebacc9 33%, #ceb6da 66%, #9fcaed 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text"
                        }}
                      ></i>
                      <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>Tips</span>
                    </div>
                    <div className="layered-card-content">
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#181D27", marginBottom: 4 }}>
                            Set clear screening criteria <span style={{ fontSize: 12, color: "#6c757d", fontWeight: 400 }}>Define specific requirements that candidates must meet to pass the initial CV screening.</span>
                          </p>
                        </div>

                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#181D27", marginBottom: 4 }}>
                            Use relevant keywords <span style={{ fontSize: 12, color: "#6c757d", fontWeight: 400 }}>Include industry-specific terms and skills that the AI should look for in candidate CVs.</span>
                          </p>
                        </div>

                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#181D27", marginBottom: 4 }}>
                            Keep prompts focused <span style={{ fontSize: 12, color: "#6c757d", fontWeight: 400 }}>Avoid overly complex instructions that might confuse the AI screening process.</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 Tips */}
              {currentStep === 2 && (
                <div className="layered-card-outer">
                  <div className="layered-card-middle">
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <i
                        className="la la-lightbulb"
                        style={{
                          fontSize: 20,
                          background: "linear-gradient(90deg, #fccec0 0%, #ebacc9 33%, #ceb6da 66%, #9fcaed 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text"
                        }}
                      ></i>
                      <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>Tips</span>
                    </div>
                    <div className="layered-card-content">
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#181D27", marginBottom: 4 }}>
                            Design targeted questions <span style={{ fontSize: 12, color: "#6c757d", fontWeight: 400 }}>Create questions that assess the specific skills and experience needed for the role.</span>
                          </p>
                        </div>

                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#181D27", marginBottom: 4 }}>
                            Balance technical and soft skills <span style={{ fontSize: 12, color: "#6c757d", fontWeight: 400 }}>Include questions that evaluate both technical competency and cultural fit.</span>
                          </p>
                        </div>

                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#181D27", marginBottom: 4 }}>
                            Test the flow <span style={{ fontSize: 12, color: "#6c757d", fontWeight: 400 }}>Review your interview questions to ensure they create a natural conversation flow.</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {showSaveModal && (
          <CareerActionModal action={showSaveModal} onAction={(action) => saveCareer(action)} />
        )}
        {isSavingCareer && (
          <FullScreenLoadingAnimation title={formType === "add" ? "Saving career..." : "Updating career..."} subtext={`Please wait while we are ${formType === "add" ? "saving" : "updating"} the career`} />
        )}
        
        {/* Tooltip components */}
        <Tooltip id="cv-secret-prompt-tooltip" />
        <Tooltip id="ai-interview-secret-prompt-tooltip" />
      </div>
    </>
  )
}