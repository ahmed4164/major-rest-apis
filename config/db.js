const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
let db;
const connect = async () => {
    try {
        db = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${db.connection.host}`);
        await createCollections();
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
};
// Define schemas and models for collections
const studentSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        unique: true 
    },
    password: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    collegecode: Number,
    collegename: String,
    branch: String,
    section: String,
    year: Number
});

const teacherSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        unique: true 
    },
    password: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    collegecode: Number,
    collegename: String,
});
const classroomSchema = new mongoose.Schema({
    name: String,
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
});

const invitationSchema = new mongoose.Schema({
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    token: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
});


const Student = mongoose.model('Student', studentSchema);
const Teacher = mongoose.model('Teacher', teacherSchema);
const Classroom = mongoose.model('Classroom', classroomSchema);
const Invitation = mongoose.model('Invitation', invitationSchema);

async function createCollections() {
    try {
        await Student.createCollection();
        await Teacher.createCollection();
        await Classroom.createCollection();
        await Invitation.createCollection();
        console.log('Collections created successfully');
    } catch (error) {
        console.error('Error creating collections:', error);
    }
}
const get = () => {
    return db;
}

module.exports = { connect, get, Student, Teacher, Classroom, Invitation };
