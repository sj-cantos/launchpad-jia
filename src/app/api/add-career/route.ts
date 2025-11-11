import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongoDB/mongoDB";
import { guid } from "@/lib/Utils";
import { ObjectId } from "mongodb";
import xss from "xss";

// Input validation helpers
const validateString = (value: any, fieldName: string, maxLength: number = 1000): string => {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  if (value.trim().length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
  if (value.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength} characters`);
  }
  return value.trim();
};

const validateNumber = (value: any, fieldName: string, min?: number, max?: number): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  if (min !== undefined && num < min) {
    throw new Error(`${fieldName} must be at least ${min}`);
  }
  if (max !== undefined && num > max) {
    throw new Error(`${fieldName} must not exceed ${max}`);
  }
  return num;
};

const validateBoolean = (value: any, fieldName: string): boolean | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'boolean') {
    throw new Error(`${fieldName} must be a boolean`);
  }
  return value;
};

const validateUserObject = (value: any, fieldName: string): any => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${fieldName} must be an object`);
  }
  
  const sanitizedUser: any = {};
  
  // Validate and sanitize required fields
  if (value.name) {
    sanitizedUser.name = sanitizeText(validateString(value.name, `${fieldName}.name`, 100));
  }
  if (value.email) {
    sanitizedUser.email = sanitizeText(validateString(value.email, `${fieldName}.email`, 200));
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedUser.email)) {
      throw new Error(`${fieldName}.email must be a valid email address`);
    }
  }
  if (value.image) {
    sanitizedUser.image = sanitizeText(validateString(value.image, `${fieldName}.image`, 500));
    // Basic URL validation for image
    try {
      new URL(sanitizedUser.image);
    } catch {
      throw new Error(`${fieldName}.image must be a valid URL`);
    }
  }
  
  return sanitizedUser;
};

const sanitizeHTML = (html: string): string => {
  return xss(html, {
    whiteList: {
      // Allow basic formatting tags only
      p: [],
      br: [],
      strong: [],
      b: [],
      em: [],
      i: [],
      u: [],
      ul: [],
      ol: [],
      li: [],
      h1: [],
      h2: [],
      h3: [],
      h4: [],
      h5: [],
      h6: [],
      blockquote: [],
      div: ['class'],
      span: ['class'],
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed']
  });
};

const sanitizeText = (text: string): string => {
  // For plain text fields, strip all HTML tags
  return xss(text, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: true
  });
};

export async function POST(request: Request) {
  try {
    const {
      jobTitle,
      description,
      questions,
      lastEditedBy,
      createdBy,
      screeningSetting,
      orgID,
      requireVideo,
      location,
      workSetup,
      workSetupRemarks,
      status,
      salaryNegotiable,
      minimumSalary,
      maximumSalary,
      country,
      province,
      employmentType,
      cvSecretPrompt,
      preScreeningQuestions,
      aiInterviewScreening,
      aiSecretPrompt,
    } = await request.json();
    
    // Input validation and sanitization
    let sanitizedJobTitle: string;
    let sanitizedDescription: string;
    let sanitizedQuestions: any;
    let sanitizedLastEditedBy: any;
    let sanitizedCreatedBy: any;
    let sanitizedLocation: string;
    let sanitizedWorkSetup: string;
    let sanitizedWorkSetupRemarks: string | undefined;
    let sanitizedStatus: string | undefined;
    let sanitizedCountry: string | undefined;
    let sanitizedProvince: string | undefined;
    let sanitizedEmploymentType: string | undefined;
    let validatedMinimumSalary: number | undefined;
    let validatedMaximumSalary: number | undefined;
    let validatedSalaryNegotiable: boolean | undefined;
    let validatedRequireVideo: boolean | undefined;
    let sanitizedCvSecretPrompt: string | undefined;
    let sanitizedPreScreeningQuestions: any[] = [];
    let sanitizedAiInterviewScreening: string | undefined;
    let sanitizedAiSecretPrompt: string | undefined;
    
    try {
      // Validate and sanitize required fields
      sanitizedJobTitle = sanitizeText(validateString(jobTitle, "Job title", 200));
      sanitizedDescription = sanitizeHTML(validateString(description, "Description", 10000));
      sanitizedLocation = sanitizeText(validateString(location, "Location", 100));
      sanitizedWorkSetup = sanitizeText(validateString(workSetup, "Work setup", 50));
      sanitizedLastEditedBy = validateUserObject(lastEditedBy, "Last edited by");
      sanitizedCreatedBy = validateUserObject(createdBy, "Created by");
      
      // Validate questions array
      if (!Array.isArray(questions)) {
        throw new Error("Questions must be an array");
      }
      if (questions.length === 0) {
        throw new Error("At least one question category is required");
      }
      if (questions.length > 50) {
        throw new Error("Maximum 50 question categories allowed");
      }
      
      // Handle structured questions format: [{ id, category, questionCountToAsk, questions: [...] }]
      sanitizedQuestions = questions.map((questionCategory, index) => {
        if (typeof questionCategory !== 'object' || questionCategory === null || Array.isArray(questionCategory)) {
          throw new Error(`Question category ${index + 1} must be an object`);
        }
        
        const sanitizedCategory: any = {};
        
        // Validate id (optional)
        if (questionCategory.id !== undefined) {
          sanitizedCategory.id = validateNumber(questionCategory.id, `Question category ${index + 1} id`) || questionCategory.id;
        }
        
        // Validate category (optional)
        if (questionCategory.category) {
          sanitizedCategory.category = sanitizeText(validateString(questionCategory.category, `Question category ${index + 1} category`, 200));
        } else {
          sanitizedCategory.category = "";
        }
        
        // Validate questionCountToAsk (optional)
        if (questionCategory.questionCountToAsk !== undefined && questionCategory.questionCountToAsk !== null) {
          sanitizedCategory.questionCountToAsk = validateNumber(questionCategory.questionCountToAsk, `Question category ${index + 1} questionCountToAsk`, 0, 1000);
        } else {
          sanitizedCategory.questionCountToAsk = null;
        }
        
        // Validate questions array
        if (!Array.isArray(questionCategory.questions)) {
          throw new Error(`Question category ${index + 1} questions must be an array`);
        }
        
        sanitizedCategory.questions = questionCategory.questions.map((question: any, qIndex: number) => {
          if (typeof question !== 'string') {
            throw new Error(`Question ${index + 1}.${qIndex + 1} must be a string`);
          }
          if (question.trim().length === 0) {
            throw new Error(`Question ${index + 1}.${qIndex + 1} cannot be empty`);
          }
          if (question.length > 1000) {
            throw new Error(`Question ${index + 1}.${qIndex + 1} exceeds maximum length of 1000 characters`);
          }
          return sanitizeText(question.trim());
        });
        
        return sanitizedCategory;
      });
      
      // Validate and sanitize optional fields
      if (workSetupRemarks) {
        sanitizedWorkSetupRemarks = sanitizeText(validateString(workSetupRemarks, "Work setup remarks", 500));
      }
      
      if (status) {
        sanitizedStatus = sanitizeText(validateString(status, "Status", 20));
        if (!['active', 'inactive', 'draft'].includes(sanitizedStatus)) {
          throw new Error("Status must be 'active', 'inactive', or 'draft'");
        }
      }
      
      if (country) {
        sanitizedCountry = sanitizeText(validateString(country, "Country", 100));
      }
      
      if (province) {
        sanitizedProvince = sanitizeText(validateString(province, "Province", 100));
      }
      
      if (employmentType) {
        sanitizedEmploymentType = sanitizeText(validateString(employmentType, "Employment type", 50));
      }
      
      // Validate numeric fields
      validatedMinimumSalary = validateNumber(minimumSalary, "Minimum salary", 0, 10000000);
      validatedMaximumSalary = validateNumber(maximumSalary, "Maximum salary", 0, 10000000);
      
      // Validate salary range
      if (validatedMinimumSalary && validatedMaximumSalary && validatedMinimumSalary > validatedMaximumSalary) {
        throw new Error("Minimum salary cannot be greater than maximum salary");
      }
      
      // Validate boolean fields
      validatedSalaryNegotiable = validateBoolean(salaryNegotiable, "Salary negotiable");
      validatedRequireVideo = validateBoolean(requireVideo, "Require video");
      
      // Validate orgID
      if (!orgID || typeof orgID !== 'string') {
        throw new Error("Organization ID is required and must be a string");
      }
      
      // Validate ObjectId format for orgID
      if (!ObjectId.isValid(orgID)) {
        throw new Error("Invalid organization ID format");
      }
      
      // Validate additional optional fields
      if (cvSecretPrompt) {
        sanitizedCvSecretPrompt = sanitizeText(validateString(cvSecretPrompt, "CV secret prompt", 2000));
      }
      
      if (preScreeningQuestions && Array.isArray(preScreeningQuestions)) {
        sanitizedPreScreeningQuestions = preScreeningQuestions.map((question: any, index: number) => {
          if (typeof question === 'string') {
            return sanitizeText(validateString(question, `Pre-screening question ${index + 1}`, 1000));
          } else if (typeof question === 'object' && question !== null) {
            // Handle structured pre-screening questions similar to questions
            const sanitizedPreScreening: any = {};
            if (question.question) {
              sanitizedPreScreening.question = sanitizeText(validateString(question.question, `Pre-screening question ${index + 1}`, 1000));
            }
            if (question.type) {
              sanitizedPreScreening.type = sanitizeText(validateString(question.type, `Pre-screening question ${index + 1} type`, 50));
            }
            if (question.options && Array.isArray(question.options)) {
              sanitizedPreScreening.options = question.options.map((option: any, optIndex: number) => 
                sanitizeText(validateString(option, `Pre-screening question ${index + 1} option ${optIndex + 1}`, 200))
              );
            }
            return sanitizedPreScreening;
          }
          return question;
        });
      }
      
      if (aiInterviewScreening) {
        sanitizedAiInterviewScreening = sanitizeText(validateString(aiInterviewScreening, "AI interview screening", 100));
      }
      
      if (aiSecretPrompt) {
        sanitizedAiSecretPrompt = sanitizeText(validateString(aiSecretPrompt, "AI secret prompt", 2000));
      }
      
    } catch (validationError) {
      return NextResponse.json(
        { error: `Validation error: ${validationError.message}` },
        { status: 400 }
      );
    }

    const { db } = await connectMongoDB();

    const orgDetails = await db.collection("organizations").aggregate([
      {
        $match: {
          _id: new ObjectId(orgID)
        }
      },
      {
        $lookup: {
            from: "organization-plans",
            let: { planId: "$planId" },
            pipeline: [
                {
                    $addFields: {
                        _id: { $toString: "$_id" }
                    }
                },
                {
                    $match: {
                        $expr: { $eq: ["$_id", "$$planId"] }
                    }
                }
            ],
            as: "plan"
        }
      },
      {
        $unwind: "$plan"
      },
    ]).toArray();

    if (!orgDetails || orgDetails.length === 0) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const totalActiveCareers = await db.collection("careers").countDocuments({ orgID, status: "active" });

    if (totalActiveCareers >= (orgDetails[0].plan.jobLimit + (orgDetails[0].extraJobSlots || 0))) {
      return NextResponse.json({ error: "You have reached the maximum number of jobs for your plan" }, { status: 400 });
    }

    const career = {
      id: guid(),
      jobTitle: sanitizedJobTitle,
      description: sanitizedDescription,
      questions: sanitizedQuestions,
      location: sanitizedLocation,
      workSetup: sanitizedWorkSetup,
      workSetupRemarks: sanitizedWorkSetupRemarks,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastEditedBy: sanitizedLastEditedBy,
      createdBy: sanitizedCreatedBy,
      status: sanitizedStatus || "active",
      screeningSetting: sanitizeText(screeningSetting || ""),
      orgID: sanitizeText(orgID),
      requireVideo: validatedRequireVideo,
      lastActivityAt: new Date(),
      salaryNegotiable: validatedSalaryNegotiable,
      minimumSalary: validatedMinimumSalary,
      maximumSalary: validatedMaximumSalary,
      country: sanitizedCountry,
      province: sanitizedProvince,
      employmentType: sanitizedEmploymentType,
      cvSecretPrompt: sanitizedCvSecretPrompt || "",
      preScreeningQuestions: sanitizedPreScreeningQuestions,
      aiInterviewScreening: sanitizedAiInterviewScreening || "",
      aiSecretPrompt: sanitizedAiSecretPrompt || "",
    };

    const insertResult = await db.collection("careers").insertOne(career);

    // Attach the Mongo _id to the returned career object for easier frontend handling
    const insertedId = insertResult.insertedId;
    // Note: career already contains a string `id` GUID; attach the Mongo ObjectId as _id
    const returnedCareer = { ...career, _id: insertedId };

    return NextResponse.json({
      message: "Career added successfully",
      career: returnedCareer,
      _id: insertedId,
    });
  } catch (error) {
    console.error("Error adding career:", error);
    return NextResponse.json(
      { error: "Failed to add career" },
      { status: 500 }
    );
  }
}
