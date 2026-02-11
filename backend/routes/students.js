// ==========================================
// Student Routes — Validated
// ==========================================

const router = require('express').Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const ctrl = require('../controllers/studentController');

router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, validate('studentCreate'), ctrl.create);
router.put('/:id', auth, ctrl.update);
router.delete('/:id', auth, ctrl.remove);
router.post('/import', auth, upload.single('file'), validate('studentImport'), ctrl.importExcel);

module.exports = router;
