// ==========================================
// Export Routes
// ==========================================

const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/exportController');

router.get('/subject/:subjectId/excel', auth, ctrl.exportSubjectExcel);
router.get('/subject/:subjectId/report-pdf', auth, ctrl.exportReportPDF);

module.exports = router;
