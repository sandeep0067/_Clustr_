import express from 'express';
import {
  validateStudentBody,
  validateStudentIdParam,
  requireApiKey,
  validateQueryString,
  requestSizeLimit,
  errorHandler
} from './src/validation/expressMiddleware.js';
import fileRoutes, { initializeFileRoutes } from './src/fileHandling/fileRoutes.js';
import { fileConfig } from './src/fileHandling/fileConfig.js';

const app = express();
const PORT = 3002;


initializeFileRoutes();


app.use(requestSizeLimit('50mb'));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(express.static('public'));
console.log('[Static Files] Serving static files from ./public');


app.use('/uploads', express.static(fileConfig.uploadDir));
console.log('[Upload Files] Serving uploaded files from ./uploads');


app.use((req, _res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(`${req.method} ${req.url} @ ${req.requestTime}`);
  next();
});


app.use((req, _res, next) => {
  req.appName = 'express-demo';
  next();
});


const students = [
  { id: 1, name: 'Aarav', course: 'Express Basics' },
  { id: 2, name: 'Diya', course: 'Node Routing' },
];

const router = express.Router();


function attachStudentById(req, res, next) {
  const studentId = req.validatedId; 
  const student = students.find((item) => item.id === studentId);

  if (!student) {
    return res.status(404).json({
      success: false,
      error: 'Student not found',
      details: [`No student with ID ${studentId} exists`]
    });
  }

  req.student = student;
  return next();
}


router.use((req, _res, next) => {
  console.log('Students router middleware reached');
  next();
});

router.use((req, _res, next) => {
  req.routerName = 'students';
  next();
});


router.get('/', validateQueryString(), (_req, res) => {
  res.json({
    success: true,
    message: 'Students fetched successfully',
    count: students.length,
    students,
    middlewareUsed: ['application-level', 'router-level', 'query-validation'],
  });
});


router.get('/:id', validateStudentIdParam(), attachStudentById, (req, res) => {
  return res.json({
    success: true,
    message: 'Student fetched successfully',
    student: req.student,
    routerName: req.routerName,
  });
});


router.post('/', validateStudentBody('POST'), (req, res) => {
  const newStudent = {
    id: students.length + 1,
    ...req.validatedData,
  };

  students.push(newStudent);

  return res.status(201).json({
    success: true,
    message: 'Student created successfully',
    student: newStudent,
  });
});


router.patch('/:id/course', validateStudentIdParam(), attachStudentById, validateStudentBody('PATCH'), (req, res) => {
  req.student.course = req.validatedData.course;

  return res.json({
    success: true,
    message: 'Student course updated successfully',
    student: req.student,
  });
});


router.get('/secure/list', requireApiKey(), (_req, res) => {
  res.json({
    success: true,
    message: 'Protected students route accessed',
    students,
  });
});


router.get(
  '/special/check',
  validateQueryString(),
  (req, _res, next) => {
    if (req.query.skip === 'true') {
      return next('route');
    }

    return next();
  },
  (_req, res) => {
    res.json({
      success: true,
      message: 'Primary special route handler executed',
    });
  },
);

router.get('/special/check', (_req, res) => {
  res.json({
    message: 'Fallback special route handler executed because next("route") was used',
  });
});

app.get('/', (req, res) => {
  res.send(`
    <h1>Express Demo Server</h1>
    <p>This standalone file does not affect the main site.</p>
    <p>App name: ${req.appName}</p>
    <p>Request time: ${req.requestTime}</p>
    
    <h2>Student Endpoints</h2>
    <ul>
      <li>GET /health</li>
      <li>GET /students</li>
      <li>GET /students/1</li>
      <li>POST /students</li>
      <li>PATCH /students/1/course</li>
      <li>GET /students/secure/list with header x-api-key: demo123</li>
      <li>GET /students/special/check</li>
      <li>GET /students/special/check?skip=true</li>
    </ul>

    <h2>File Handling Endpoints</h2>
    <ul>
      <li>GET /files - List all uploaded files</li>
      <li>POST /files/upload - Upload single file</li>
      <li>POST /files/upload/image - Upload image file</li>
      <li>POST /files/upload/document - Upload document file</li>
      <li>POST /files/upload/audio - Upload audio file</li>
      <li>POST /files/upload/video - Upload video file</li>
      <li>POST /files/upload/multiple - Upload multiple files</li>
      <li>GET /files/:filename - Download/view file</li>
      <li>GET /files/info/:filename - Get file metadata</li>
      <li>DELETE /files/:filename - Delete specific file</li>
      <li>DELETE /files?confirm=true - Delete all files</li>
    </ul>

    <h2>Static Files</h2>
    <ul>
      <li>GET / (public folder) - Static files served from ./public</li>
      <li>GET /uploads/:filename - Uploaded files served from ./uploads</li>
    </ul>
  `);
});

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    server: 'express-demo',
    appName: req.appName,
    requestTime: req.requestTime,
  });
});

app.get('/middleware-demo', requireApiKey(), (req, res) => {
  res.json({
    success: true,
    message: 'App-level and route-level middleware executed successfully',
    appName: req.appName,
    requestTime: req.requestTime,
  });
});

app.use('/students', router);


app.use('/files', fileRoutes);


app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    details: [`Route ${req.originalUrl} was not found`]
  });
});


app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode || error.status || 500;

  res.status(statusCode).json({
    success: false,
    error: error.message || 'Internal server error',
    details: error.details || []
  });
});

app.listen(PORT, () => {
  console.log(`Express demo server running on http://localhost:${PORT}`);
});
