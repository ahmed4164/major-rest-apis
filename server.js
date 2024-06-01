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
const axios = require('axios');
const OpenAI = require('openai')
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const uuid = require('uuid');

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
        pass: 'duad frda xdke cplx'
    }
});
const secretKey = process.env.JWT_SECRET; // Ensure this is set in your environment variables

function generateInvitationToken() {
    return crypto.randomBytes(20).toString('hex');
}
// Function to generate a JWT token
function generateToken(studentId) {
    return jwt.sign({ studentId }, secretKey, { expiresIn: '1h' });
}


// Function to send invitation email
async function sendInvitationEmail(studentEmail, invitationLink, student) {
    try {
        await transporter.sendMail({
            from: 'iamahmedfaiyaz@gmail.com',
            to: student.email,
            subject: 'Invitation to Join Classroom',
            html: `
                <html>
                <head>
                    <title>Invitation to Join Classroom</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #161616;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            max-width: 600px;
                            margin: 20px auto;
                            padding: 20px;
                            background-color: #161616;
                            border-radius: 10px;
                            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
                            border: 3px solid #282828;
                        }
                        .header {
                            background-color: #161616;
                            color: #ffffff;
                            padding: 20px;
                            text-align: center;
                            border-top-left-radius: 10px;
                            border-top-right-radius: 10px;
                            border-bottom: 2px solid #282828;
                        }
                        .content {
                            padding: 40px;
                            text-align: center;
                            color: #ffffff;
                        }
                        .button {
                            display: inline-block;
                            background-color: #007bff;
                            color: white;
                            padding: 15px 30px;
                            border-radius: 5px;
                            text-decoration: none;
                            font-weight: bold;
                        }
                        .footer {
                            background-color: #161616;
                            color: #ffffff;
                            padding: 20px;
                            text-align: center;
                            border-bottom-left-radius: 10px;
                            border-bottom-right-radius: 10px;
                            border-top: 2px solid #282828
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Invitation to Join Classroom</h1>
                        </div>
                        <div class="content">
                            <p>Dear ${student.name},</p>
                            <p>You have been invited to join a classroom.</p>
                            <p>Please click on the button below to join:</p>
                            <a class="button" href="${invitationLink}">Join Classroom</a>
                        </div>
                        <div class="footer">
                            <p>Regards,<br>Your School</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });
        console.log(`Invitation email sent to ${studentEmail}`);
    } catch (error) {
        console.error(`Error sending invitation email to ${studentEmail}:`, error);
    }
}

function generateUniqueLink(classroomId) {
    return `https://major-rest-apis.onrender.com/join/${classroomId}`;
}


function generateInvitationLink(classroomId, studentId) {
    const token = generateToken(studentId);
    return `https://major-rest-apis.onrender.com/join/${classroomId}?token=${token}`;
}
const Student = db.Student;
const Teacher = db.Teacher;
const Classroom = db.Classroom;
const Invitation = db.Invitation

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

app.post('/register', async (req, res) => {
    try {
        const { name, email, password, type, collegename, collegecode, branch, section, year } = req.body;
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
                createdAt: new Date(),
                collegename,
                collegecode,
                branch,
                section,
                year
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
                createdAt: new Date(),
                collegecode,
                collegename,
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


app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        let stuuser;
        let teauser;

        stuuser = await Student.findOne({ email });
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
        console.log('@@user', user)
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
// app.post('/classroom', async (req, res) => {
//     try {
//         // Ensure req.body.studentIds is an array or default to an empty array
//         const studentIds = Array.isArray(req.body.studentIds) ? req.body.studentIds : [];

//         // Create classroom
//         // const invitationLink = generateInvitationLink();
//         const classroom = new Classroom({
//             name: req.body.name,
//             teacher: req.body.teacherId,
//             students: studentIds,
//             createdAt: new Date(),
//             invitationLink,
//         });
//         // const result = await classroom.save();
//         await classroom.save();

//         // Generate invitation link
//         // const invitationLink = generateUniqueLink(result._id);
//         // Save the classroom to the database
//         await classroom.save();

//         // Extract the ID of the created classroom
//         const classroomId = classroom._id;

//         // Generate a unique invitation link with the classroom ID

//         const invitationLink = generateInvitationLink(classroomId, student);
//         console.log('@@@invi', invitationLink)
//         // Send invitation email to each student
//         for (const studentId of studentIds) {
//             const student = await Student.findById(studentId);
//             if (student) {
//                 sendInvitationEmail(student.email, invitationLink, student);
//             }
//         }

//         res.status(201).json({
//             message: 'classroom created successfully',
//             isSuccess: true
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             message: 'Internal Server Error',
//             isSuccess: true
//         })
//     }
// });
async function dropUniqueIndex() {
    try {
        await Classroom.collection.dropIndex('invitationLink_1'); 
        console.log('Unique index on invitationLink dropped');
    } catch (error) {
        if (error.codeName === 'IndexNotFound') {
            console.log('Index not found, nothing to drop');
        } else {
            console.error('Error dropping index:', error);
        }
    }
}

dropUniqueIndex();

app.post('/classroom', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { name, teacherId, studentIds } = req.body;

        if (!name || !teacherId || !Array.isArray(studentIds)) {
            return res.status(400).json({ message: 'Invalid input' });
        }

        const classroom = new Classroom({
            name,
            teacher: teacherId,
            students: [],
            createdAt: new Date()
        });

        await classroom.save({ session });

        const invitationPromises = studentIds.map(async (studentId) => {
            const token = generateInvitationToken();
            const invitation = new Invitation({
                classroom: classroom._id,
                student: studentId,
                token,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Token expires in 24 hours
            });

            await invitation.save({ session });

            const student = await Student.findById(studentId);
            if (student) {
                const invitationLink = `https://major-rest-apis.onrender.com/join-classroom?token=${token}`;
                await sendInvitationEmail(student.email, invitationLink, student);
            }
        });

        await Promise.all(invitationPromises);

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            message: 'Classroom created and invitations sent successfully',
            classroom
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


app.get('/join-classroom', async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ message: 'Invalid or missing token' });
    }

    try {
        // Find the invitation by token
        const invitation = await Invitation.findOne({ token });

        if (!invitation || new Date() > invitation.expiresAt) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Add student to the classroom
        const classroom = await Classroom.findById(invitation.classroom);
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        classroom.students.push(invitation.student);
        await classroom.save();

        // Delete the used invitation token
        await Invitation.deleteOne({ _id: invitation._id });

        res.status(200).json({
            message: 'Successfully joined the classroom',
            classroom
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});



// Endpoint to get a list of all students
// app.get('/students', async (req, res) => {
//     try {
//         const students = await Student.find({}, 'name email');
//         res.status(200).json(students);
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Internal Server Error');
//     }
// });

const authenticateTeacher = async (req, res, next) => {
    try {
        const { teacherId } = req.body; // Extract teacherId from the request body
        if (!teacherId) {
            return res.status(401).send('Unauthorized');
        }
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(401).send('Unauthorized');
        }
        req.teacher = teacher; // Attach teacher to request
        next();
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

app.post('/students', authenticateTeacher, async (req, res) => {
    try {
        const { collegecode } = req.teacher;
        const students = await Student.find({ collegecode }, 'name email');
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

app.post('/classroom/details', async (req, res) => {
    try {
        const { classroomId } = req.body;

        // Validate classroomId
        if (!mongoose.Types.ObjectId.isValid(classroomId)) {
            return res.status(400).send('Invalid classroom ID');
        }

        // Find the classroom by ID
        const classroom = await Classroom.findById(classroomId)
            .populate('teacher', 'name email')
            .populate('students', 'name email');

        if (!classroom) {
            return res.status(404).json({ isSuccess: false, message: 'Classroom not found' });
        }

        res.status(200).json({ isSuccess: true, classroom });
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