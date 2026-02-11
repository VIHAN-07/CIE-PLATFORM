// ==========================================
// Input Validation Middleware — Zod Schemas
// ==========================================
// Centralized request validation using Zod.
// Each route can use validate(schemaName) middleware.

const { z } = require('zod');

// ---- Reusable Primitives ----

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
const email = z.string().email('Invalid email format').toLowerCase().trim();
const password = z.string().min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/(?=.*[a-z])/, 'Password must contain a lowercase letter')
  .regex(/(?=.*[A-Z])/, 'Password must contain an uppercase letter')
  .regex(/(?=.*\d)/, 'Password must contain a digit');
const trimStr = z.string().trim();
const positiveInt = z.number().int().positive();

// ---- Schema Definitions ----

const schemas = {
  // Auth
  login: z.object({
    body: z.object({
      email: email,
      password: z.string().min(1, 'Password is required'),
    }),
  }),

  register: z.object({
    body: z.object({
      name: trimStr.min(2).max(100),
      email: email,
      password: password,
      role: z.enum(['admin', 'faculty']).default('faculty'),
      department: trimStr.max(100).optional().default(''),
    }),
  }),

  changePassword: z.object({
    body: z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: password,
    }),
  }),

  // Academic Year
  academicYear: z.object({
    body: z.object({
      name: trimStr.min(3).max(50),
      startDate: z.string().or(z.date()),
      endDate: z.string().or(z.date()),
      isActive: z.boolean().optional(),
    }),
  }),

  // Class
  classCreate: z.object({
    body: z.object({
      name: trimStr.min(2).max(100),
      academicYear: objectId,
      department: trimStr.max(100).optional().default(''),
    }),
  }),

  // Subject
  subjectCreate: z.object({
    body: z.object({
      name: trimStr.min(2).max(150),
      code: trimStr.min(2).max(20).toUpperCase(),
      class: objectId,
      academicYear: objectId,
      faculty: objectId,
    }),
  }),

  // Student
  studentCreate: z.object({
    body: z.object({
      rollNo: trimStr.min(1).max(30),
      name: trimStr.min(2).max(120),
      class: objectId,
      academicYear: objectId,
    }),
  }),

  studentImport: z.object({
    body: z.object({
      classId: objectId,
      academicYearId: objectId,
    }),
  }),

  // Activity
  activityCreate: z.object({
    body: z.object({
      name: trimStr.min(2).max(200),
      activityType: trimStr.min(2).max(100),
      subject: objectId,
      totalMarks: z.number().min(1).max(1000),
      topic: trimStr.max(500).optional().default(''),
      guidelines: z.string().max(10000).optional().default(''),
    }),
  }),

  activityUpdate: z.object({
    body: z.object({
      name: trimStr.min(2).max(200).optional(),
      totalMarks: z.number().min(1).max(1000).optional(),
      topic: trimStr.max(500).optional(),
      guidelines: z.string().max(10000).optional(),
    }),
  }),

  // Rubric
  rubricCreate: z.object({
    body: z.object({
      activity: objectId,
      name: trimStr.min(2).max(200),
      criteria: z.object({
        scale1: z.string().max(500).default(''),
        scale2: z.string().max(500).default(''),
        scale3: z.string().max(500).default(''),
        scale4: z.string().max(500).default(''),
        scale5: z.string().max(500).default(''),
      }),
      order: z.number().int().min(0).optional(),
    }),
  }),

  rubricUpdate: z.object({
    body: z.object({
      name: trimStr.min(2).max(200).optional(),
      criteria: z.object({
        scale1: z.string().max(500).optional(),
        scale2: z.string().max(500).optional(),
        scale3: z.string().max(500).optional(),
        scale4: z.string().max(500).optional(),
        scale5: z.string().max(500).optional(),
      }).optional(),
      order: z.number().int().min(0).optional(),
    }),
  }),

  // Score bulk save
  scoreBulk: z.object({
    body: z.object({
      activityId: objectId,
      scores: z.array(
        z.object({
          studentId: objectId,
          rubricId: objectId,
          score: z.number().int().min(1).max(5),
        })
      ).min(1, 'At least one score is required').max(5000, 'Too many scores in single request'),
    }),
  }),

  // AI requests
  aiGenerateRubrics: z.object({
    body: z.object({
      activityType: trimStr.min(2).max(100),
      topic: trimStr.min(2).max(500),
    }),
  }),

  aiGenerateGuidelines: z.object({
    body: z.object({
      activityType: trimStr.min(2).max(100),
      topic: trimStr.min(2).max(500),
    }),
  }),

  aiStudentFeedback: z.object({
    body: z.object({
      activityId: objectId,
      studentId: objectId,
    }),
  }),

  aiClassInsights: z.object({
    body: z.object({
      activityId: objectId,
    }),
  }),

  aiNAACReport: z.object({
    body: z.object({
      subjectId: objectId,
      reportType: z.enum(['NAAC', 'NBA', 'General']).optional().default('NAAC'),
    }),
  }),

  // Library
  libraryRubric: z.object({
    body: z.object({
      activityType: trimStr.min(2).max(100),
      name: trimStr.min(2).max(200),
      criteria: z.object({
        scale1: z.string().max(500).default(''),
        scale2: z.string().max(500).default(''),
        scale3: z.string().max(500).default(''),
        scale4: z.string().max(500).default(''),
        scale5: z.string().max(500).default(''),
      }),
    }),
  }),

  // Admin template
  templateCreate: z.object({
    body: z.object({
      activityType: trimStr.min(2).max(100),
      description: z.string().max(1000).optional().default(''),
      defaultRubrics: z.array(
        z.object({
          name: trimStr.min(2).max(200),
          criteria: z.object({
            scale1: z.string().max(500).default(''),
            scale2: z.string().max(500).default(''),
            scale3: z.string().max(500).default(''),
            scale4: z.string().max(500).default(''),
            scale5: z.string().max(500).default(''),
          }),
        })
      ).optional().default([]),
      guidelines: z.string().max(10000).optional().default(''),
    }),
  }),

  // Admin user update
  adminUserUpdate: z.object({
    body: z.object({
      name: trimStr.min(2).max(100).optional(),
      email: email.optional(),
      role: z.enum(['admin', 'faculty']).optional(),
      department: trimStr.max(100).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  // Pagination query params
  paginatedQuery: z.object({
    query: z.object({
      page: z.string().regex(/^\d+$/).transform(Number).optional(),
      limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    }).passthrough(),
  }),
};

// ---- Validation Middleware Factory ----

/**
 * Express middleware that validates request against a named Zod schema.
 * @param {string} schemaName — Key in the schemas object above.
 */
function validate(schemaName) {
  const schema = schemas[schemaName];
  if (!schema) {
    throw new Error(`Validation schema "${schemaName}" not found`);
  }

  return (req, res, next) => {
    try {
      const toValidate = {};
      if (schema.shape.body) toValidate.body = req.body;
      if (schema.shape.query) toValidate.query = req.query;
      if (schema.shape.params) toValidate.params = req.params;

      const result = schema.parse(toValidate);

      // Replace request data with parsed (trimmed, transformed) values
      if (result.body) req.body = result.body;
      if (result.query) Object.assign(req.query, result.query);
      if (result.params) Object.assign(req.params, result.params);

      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: messages,
        });
      }
      next(err);
    }
  };
}

module.exports = { validate, schemas };
