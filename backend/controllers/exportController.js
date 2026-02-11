// ==========================================
// Export Controller — Excel & PDF exports
// ==========================================

const Subject = require('../models/Subject');
const Activity = require('../models/Activity');
const Student = require('../models/Student');
const FinalSubjectResult = require('../models/FinalSubjectResult');
const AIReport = require('../models/AIReport');
const { generateResultsExcel } = require('../services/excelService');
const { generateReportPDF } = require('../services/pdfService');

/** GET /api/exports/subject/:subjectId/excel — Download results Excel */
exports.exportSubjectExcel = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.subjectId)
      .populate('class', 'name')
      .populate('academicYear', 'name');
    if (!subject) return res.status(404).json({ message: 'Subject not found.' });

    const activities = await Activity.find({ subject: subject._id }).sort('createdAt');
    const students = await Student.find({
      class: subject.class._id,
      academicYear: subject.academicYear._id,
    }).sort('rollNo');
    const results = await FinalSubjectResult.find({ subject: subject._id });

    const workbook = await generateResultsExcel(
      subject.name,
      activities,
      results,
      students
    );

    const filename = `${subject.code}_${subject.name}_Results.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

/** GET /api/exports/subject/:subjectId/report-pdf — Download NAAC/NBA PDF */
exports.exportReportPDF = async (req, res, next) => {
  try {
    const report = await AIReport.findOne({ subject: req.params.subjectId })
      .populate({
        path: 'subject',
        populate: [
          { path: 'class', select: 'name' },
          { path: 'academicYear', select: 'name' },
        ],
      })
      .populate('faculty', 'name');

    if (!report) {
      return res.status(404).json({ message: 'No AI report found. Generate one first.' });
    }

    const pdfBuffer = await generateReportPDF({
      reportType: report.reportType,
      subjectName: report.subject.name,
      subjectCode: report.subject.code,
      facultyName: report.faculty.name,
      className: report.subject.class.name,
      academicYear: report.subject.academicYear.name,
      content: report.content,
    });

    const filename = `${report.subject.code}_${report.reportType}_Report.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};
