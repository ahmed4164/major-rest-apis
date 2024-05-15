const express = require('express');
const dotenv = require('dotenv');
const db = require('./config/db');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cors = require('cors')


dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors())
app.use(express.json());

app.listen(port, () => {
    db.connect()
    console.log(`Server running on port ${port}`);
});

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'iamahmedfaiyaz@gmail.com',
        pass: 'Fazal4164@'
    }
});

// Function to send invitation email
async function sendInvitationEmail(studentEmail, invitationLink) {
    console.log('@@', studentEmail)
    try {
        await transporter.sendMail({
            from: 'iamahmedfaiyaz@gmail.com',
            // to: studentEmail,
            to: 'ahmed.docx@gmail.com',
            subject: 'Invitation to Join Classroom',
            text: `Dear Student,\n\nYou have been invited to join a classroom. Please click on the following link to join:\n\n${invitationLink}\n\nRegards,\nYour School`
        });
        // console.log(`Invitation email sent to ${studentEmail}`);
        console.log(`Invitation email sent to ahmed.docx@gmail.com`);
    } catch (error) {
        console.error(`Error sending invitation email to ${studentEmail}:`, error);
    }
}

// Generate a unique link
function generateUniqueLink(classroomId) {
    // Generate a unique link based on classroom ID, timestamp, or any other criteria
    return `http://localhost:3000/join/${classroomId}`;
}

// MongoDB Models
const Student = db.Student;
const Teacher = db.Teacher;
const Classroom = db.Classroom;

// // Registration endpoint for students
// app.post('/register/student', async (req, res) => {
//     try {
//         const { name, email, password } = req.body;
//         // Hash password
//         const hashedPassword = await bcrypt.hash(password, 10);
//         const student = new Student({
//             name,
//             email,
//             password: hashedPassword,
//             createdAt: new Date()
//         });
//         const result = await student.save();
//         res.status(201).send(`Student registered with ID: ${result._id}`);
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Internal Server Error');
//     }
// });

// // Registration endpoint for teachers
// app.post('/register/teacher', async (req, res) => {
//     try {
//         const { name, email, password } = req.body;
//         // Hash password
//         const hashedPassword = await bcrypt.hash(password, 10);
//         const teacher = new Teacher({
//             name,
//             email,
//             password: hashedPassword,
//             createdAt: new Date()
//         });
//         const result = await teacher.save();
//         res.status(201).json({
//             isSuccess: true,
//             teacherId: result._id,
//             type: 'teacher'
//         });
//     } catch (error) {
//         console.error(error);
//         // res.status(500).send('Internal Server Error');
//         res.status(500).json({
//             isSuccess: false,
//             message: 'Internal Server Error',
//             type: 'teacher'
//         });
//     }
// });

app.post('/register', async(req, res)=>{
    try {
        const { name, email, password, type } = req.body;
        if (!name || !email || !password || !type) {
            return res.status(400).json({
                isSuccess: false,
                message: 'Name, email, password, and type are required',
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        let user, result;
        if (type === 'student') {
            user = new Student({
                name,
                email,
                password: hashedPassword,
                createdAt: new Date()
            });
            result = await user.save();
            res.status(201).json({
                isSuccess: true,
                studentId: result._id,
                type: 'student'
            });
        } else if (type === 'teacher') {
            user = new Teacher({
                name,
                email,
                password: hashedPassword,
                createdAt: new Date()
            });
            result = await user.save();
            res.status(201).json({
                isSuccess: true,
                teacherId: result._id,
                type: 'teacher'
            });
        } else {
            res.status(400).json({
                isSuccess: false,
                message: 'Invalid type provided',
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            isSuccess: false,
            message: 'Internal Server Error',
        });
    }

})


// // Endpoint for student login
// app.post('/login', async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         // Find the student by email
//         const student = await Student.findOne({ email });
//         if (!student) {
//             return res.status(401).json({ message: 'Invalid email or password' });
//         }

//         // Verify the password
//         const isPasswordValid = await bcrypt.compare(password, student.password);
//         if (!isPasswordValid) {
//             return res.status(401).json({ message: 'Invalid email or password' });
//         }

//         // Generate JWT token
//         const secretKey = crypto.randomBytes(32).toString('hex');
//         console.log(secretKey);
//         const token = jwt.sign({ id: student._id, email: student.email }, secretKey, { expiresIn: '1h' });

//         // Send the token in the response
//         res.status(200).json({ 
//             token,
//             isSuccess: true,
//             type:'teacher'
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal Server Error' });
//     }
// });

// // Endpoint for teacher login
// app.post('/teacher/login', async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         // Find the teacher by email
//         const teacher = await Teacher.findOne({ email });
//         if (!teacher) {
//             return res.status(401).json({ message: 'Invalid email or password' });
//         }

//         // Verify the password
//         const isPasswordValid = await bcrypt.compare(password, teacher.password);
//         if (!isPasswordValid) {
//             return res.status(401).json({ message: 'Invalid email or password' });
//         }

//         // Generate JWT token
//         const secretKey = crypto.randomBytes(32).toString('hex');
//         console.log(secretKey);
//         const token = jwt.sign({ id: teacher._id, email: teacher.email }, secretKey, { expiresIn: '1h' });

//         // Send the token in the response
//         res.status(200).json({ 
//             token,
//             teacherid: teacher._id, 
//             isSuccess: true,
//             type:'teacher'
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ 
//             message: 'Internal Server Error',
//             isSuccess: false,
//             type:'teacher'
//          });
//     }
// });

// Unified login endpoint
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        let stuuser;
        let teauser;

        // Check if the user is a student
        stuuser = await Student.findOne({ email });
        // Check if the user is a teacher
        teauser = await Teacher.findOne({ email });

        // If neither a student nor a teacher found, return error
        if (!stuuser && !teauser) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Verify the password based on the user type
        let user;
        if (stuuser) {
            user = stuuser;
        } else if (teauser) {
            user = teauser;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const secretKey = crypto.randomBytes(32).toString('hex');
        const token = jwt.sign({ id: user._id, email: user.email }, secretKey, { expiresIn: '1h' });

        // Determine user type
        let type;
        if (stuuser && teauser) {
            type = 'both';
        } else if (stuuser) {
            type = 'student';
        } else if (teauser) {
            type = 'teacher';
        }

        // Send response with user type
        res.status(200).json({ 
            token,
            userId: user._id, 
            isSuccess: true,
            type // Indicate the user type in the response
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            message: 'Internal Server Error',
            isSuccess: false
         });
    }
});



app.post('/login/type', async (req, res) => {
    try {
        const { type, email } = req.body;
        // const email = req.user.email; 

        let user;
        user = await Student.findOne({ email });
        if (!user && type === 'student') {
            return res.status(404).json({ message: 'User not found or not a student' });
        }

        user = await Teacher.findOne({ email });
        if (!user && type === 'teacher') {
            return res.status(404).json({ message: 'User not found or not a teacher' });
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log('@@user',user)
        const secretKey = crypto.randomBytes(32).toString('hex');
        const token = jwt.sign({ id: user._id, email: user.email }, secretKey, { expiresIn: '1h' });
        let newData;

        if (type === 'student') {
            newData = {
                token,
                studentId: user._id, 
                isSuccess: true,
                type: type,
                message: `Login selected as ${type}`,
            };
        } else if (type === 'teacher') {
            newData = {
                token,
                teacherId: user._id, 
                isSuccess: true,
                type: type,
                message: `Login selected as ${type}`,
            };
        }

        res.status(200).json(newData); // Send the updated data to the frontend
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            message: 'Internal Server Error',
            isSuccess: false
         });
    }
});
// // Endpoint for a teacher to create a classroom and invite students
// app.post('/classroom', async (req, res) => {
//     try {
//         const { teacherId, name, studentIds } = req.body;
//         // Ensure the teacher exists
//         const teacher = await Teacher.findById(teacherId);
//         if (!teacher) {
//             return res.status(404).send('Teacher not found');
//         }
//         // Ensure all student IDs are valid
//         const students = await Student.find({ _id: { $in: studentIds } });
//         if (students.length !== studentIds.length) {
//             return res.status(400).send('One or more students not found');
//         }
//         // Create classroom
//         const classroom = new Classroom({
//             name,
//             teacher: teacherId,
//             students: studentIds,
//             createdAt: new Date()
//         });
//         const result = await classroom.save();
//         res.status(201).send(`Classroom created with ID: ${result._id}`);
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Internal Server Error');
//     }
// });
// Endpoint for a teacher to create a classroom and generate an invitation link
app.post('/classroom', async (req, res) => {
    try {
        // Create classroom
        const classroom = new Classroom({
            name: req.body.name,
            teacher: req.body.teacherId,
            students: req.body.studentIds,
            createdAt: new Date()
        });
        const result = await classroom.save();

        // Generate invitation link
        const invitationLink = generateUniqueLink(result._id);

        // Send invitation email to each student
        for (const studentId of req.body.studentIds) {
            const student = await Student.findById(studentId);
            if (student) {
                sendInvitationEmail(student.email, invitationLink);
            }
        }

        res.status(201).send(`Classroom created. Invitation emails sent to students.`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to get a list of all students
app.get('/students', async (req, res) => {
    try {
        const students = await Student.find({}, 'name email');
        res.status(200).json(students);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to add a student to a classroom
app.post('/classroom/addStudent', async (req, res) => {
    try {
        const { teacherId, classroomId, studentId } = req.body;

        // Validate teacher's authorization to add students to the classroom (implementation needed)

        // Retrieve the classroom
        const classroom = await Classroom.findById(classroomId);

        // Check if the classroom exists
        if (!classroom) {
            return res.status(404).send('Classroom not found');
        }

        // Check if the teacher is associated with the classroom
        if (classroom.teacher.toString() !== teacherId) {
            return res.status(403).send('Unauthorized: Teacher is not associated with this classroom');
        }

        // Check if the student is already enrolled in the classroom
        if (classroom.students.includes(studentId)) {
            return res.status(400).send('Student is already enrolled in the classroom');
        }

        // Add the student to the classroom
        classroom.students.push(studentId);

        // Save the updated classroom
        await classroom.save();

        res.status(200).send('Student added to the classroom successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to get a list of all classrooms
app.get('/classrooms', async (req, res) => {
    try {
        const classrooms = await Classroom.find().populate('teacher', 'name email').populate('students', 'name email');
        res.status(200).json({
            isSuccess: true,
            classrooms
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to get classrooms associated with a particular teacher
app.post('/teacher/classrooms', async (req, res) => {
    try {
        const { teacherId } = req.body;

        // Validate teacherId
        if (!mongoose.Types.ObjectId.isValid(teacherId)) {
            return res.status(400).send('Invalid teacher ID');
        }

        // Find classrooms where the teacher is assigned
        const classrooms = await Classroom.find({ 'teacher': teacherId })
            .populate('teacher', 'name email')
            .populate('students', 'name email');

        res.status(200).json({
            isSuccess: true,
            classrooms
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


// Endpoint to get a list of classrooms for a specific student
app.post('/student/classrooms', async (req, res) => {
    try {
        const { studentId } = req.body;

        // Validate studentId
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).send('Invalid student ID');
        }

        // Find classrooms where the student is registered
        const classrooms = await Classroom.find({ students: studentId })
            .populate('teacher', 'name email')
            .populate('students', 'name email');

        res.status(200).json({
            isSuccess: true,
            classrooms
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});