# coding=utf-8
import requests
from schoolDemo import app, mongo, models
from flask import Flask, jsonify, render_template, g, flash, redirect, url_for, json, send_file
from bson.objectid import ObjectId
from decimal import Decimal
from flask.ext.restful import Api, Resource, reqparse
from flask.ext.login import LoginManager, login_user, logout_user, current_user, login_required
import uuid
from datetime import datetime, timedelta, date
import os
import time
import tempfile
import re
import base64
from PIL import Image
from io import BytesIO, StringIO
from flask.ext.login import LoginManager, login_user, logout_user, current_user, login_required
from werkzeug.security import check_password_hash, generate_password_hash
import zipfile

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'home'

# Load user from database
current_path = os.path.dirname(os.path.abspath(__file__))


@login_manager.user_loader
def load_user(user_id):
    query = {"_id": int(user_id)}
    s = mongo.db.students.find_one(query)
    t = mongo.db.professors.find_one(query)
    a = mongo.db.school.find_one(query)
    if s:
        return models.User(s['_id'], s['name'], "student")
    if t:
        return models.User(t['_id'], t['name'], "teacher")
    if a:
        return models.User(a['_id'], a['name'], "admin")

    return None


@app.before_request
def before_request():
    """Connect to the database before each request."""
    g.user = current_user


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))


@app.route('/')
def home():
    return render_template("login.html")


@app.route('/dash')
@login_required
def dashboard():
    if current_user.type == "student":
        route = 'student'
    elif current_user.type == "teacher":
        route = 'teacher'
    elif current_user.type == "admin":
        route = 'admin'
    return redirect(url_for(route))


@app.route('/teacher')
@login_required
def teacher():
    return render_template("no_payment.html")
    principal = mongo.db.professors.find_one({"_id": int(current_user.id)}, {"principal":1, "_id": 0})
    val = bool(principal)
    return render_template("teacher_home.html", principal={"validate": val})


@app.route('/student')
@login_required
def student():
    return render_template("student_home.html")


@app.route('/teacher/class/<id>')
@login_required
def teacher_class(id):
    course = mongo.db.courses.find_one({"_id": id}, {"_id": 0, "name": 1})
    return render_template("dashboard_teacher/teacher_dashboard.html", course={"id": id, "name": course["name"]})


@app.route('/teacher/class/<id>/task/<pos>/<date>')
@login_required
def teacher_task_attach(id, pos, date):
    task = {
        "pos": int(pos),
        "date": int(date)
    }

    course = {
        "id": id
    }
    return render_template("dashboard_teacher/course_teacher/course_task_attach.html", course=course, task=task)


@app.route('/student/class/<id>')
@login_required
def student_class(id):
    course = mongo.db.courses.find_one({"_id": id}, {"_id": 0, "name": 1})
    return render_template("dashboard_student/student_dashboard.html", course={"id": id, "name": course["name"]})


@app.route('/student/class/<id>/exam/<date>')
@login_required
def student_exam(id, date):
    data = {
        "id": id,
        "date": int(date)
    }
    return render_template("dashboard_student/student_exam.html", data=data)


@app.route('/admin')
@login_required
def admin():
    return render_template("admin_base.html")


@app.route('/download/zip/<name>', methods=['GET', 'POST'])
@login_required
def download_zip(name):
    absolute_path = "/home/gerardo/Documents/Business/schools/schoolDemo/schoolDemo/static/material/" + name
    output = open(absolute_path, 'rb')
    memory_file = BytesIO(output.read())
    output.close()
    return send_file(memory_file, attachment_filename=name, as_attachment=True)

# # Custom errors
# @app.errorhandler(404)
# def not_found(error):
#     return render_template('404.html'), 404
#
#
# @app.errorhandler(500)
# def internal_error(error):
#     return render_template('500.html'), 500

###################################################
# ------------------Restful API-------------------
###################################################
api = Api(app)

# This class manage the User API
# return JSON


class UserApi(Resource):
    # Get sesson access info

    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('id', type=int,
                            location="json", required=True)
        parser.add_argument('password', type=unicode,
                            location="json", required=True)
        parser.add_argument('type', type=str, location="json", required=True)
        args = parser.parse_args()

        print args

        message = {}
        user = None

        print args.type
        if args.type == "student":
            user = mongo.db.students.find_one({"_id": args.id})
        elif args.type == "teacher":
            user = mongo.db.professors.find_one({"_id": args.id})
        elif args.type == "admin":
            user = mongo.db.school.find_one({"_id": args.id})
        else:
            message = {"status": 0, "code": 500}

        if user is not None:
            password_flag = False
            if args.type == "student" or args.type == "teacher":
                if user['password'] == args.password:
                    password_flag = True
            else:
                if check_password_hash(user['password'], args.password):
                    password_flag = True
            if password_flag:
                user_obj = models.User(args.id, user['name'], args.type)
                login_user(user_obj)
                message = {"status": 200, "code": 1}
            else:
                message = {"status": 200, "code": 2}
        else:
            message = {"status": 500, "code": 0}

        return jsonify(message)


# This class manage the simple Get school info API
# return JSON
class SimpleSchoolAPI(Resource):
    # Get general school info

    def get(self):
        school = mongo.db.school.find_one({}, {'_id': 0, 'name': 1, 'email': 1,
                                               'profile_photo': 1, "description": 1, "address.street": 1, "address.phone": 1})
        return jsonify(school)


# This class manage the school info API
# @Path <id> - school id
# return JSON
class SchoolAPI(Resource):
    # Get general school info

    def get(self, id):
        school = mongo.db.school.find_one(
            {"_id": id}, {'_id': 0, 'announcements': 0})
        return jsonify(school)

    # Update general info
    def put(self, id):
        parser = reqparse.RequestParser()
        parser.add_argument('name', type=unicode,
                            location='json', required=True)
        parser.add_argument('email', type=unicode,
                            location='json', required=True)
        parser.add_argument('description', type=unicode, location='json')
        parser.add_argument('password', type=unicode, location='json')
        parser.add_argument('profile_photo', type=str,
                            location='json', required=True)
        parser.add_argument('address', type=unicode,
                            location='json', required=True)
        parser.add_argument('phone', type=str, location='json')
        parser.add_argument('in_charge', type=unicode,
                            location='json', required=True)
        parser.add_argument('in_charge_job', type=unicode,
                            location='json', required=True)
        args = parser.parse_args()

        # Check if user already exists
        cursor = mongo.db.school.find_one({"_id": id})
        if cursor is not None:
            # First check profile photo
            photo = ''
            data = {
                "name": args.name, "email": args.email,
                "description": args.description,
                "address.street": args.address, "address.in_charge": args.in_charge,
                "address.in_charge_job": args.in_charge_job, "address.phone": args.phone
            }
            if args.profile_photo is not None and args.profile_photo != "/static/images/profile.jpg":
                # Root
                path_dir = "/static/images/"
                file_name = "profile.jpg"
                path_file = path_dir + file_name
                # Create image
                create_image(path_file, args.profile_photo)
                photo = path_file
                data["profile_photo"] = photo

            mongo.db.school.update({"_id": id}, {"$set": data})
            message = {
                "status": 201,
                "code": 1
            }
        else:
            message = {
                "status": 500,
                "code": 2
            }

        return jsonify(message)

    # Delete profile photo
    def delete(self, id):
        path = "/static/images/profile.jpg"
        delete_file(path)
        result = mongo.db.school.update_one(
            {"_id": id}, {"$set": {"profile_photo": ""}})

        if result.modified_count == 1:
            message = {
                "status": 200,
                "code": 1
            }
        else:
            message = {
                "status": 201,
                "code": 2
            }

        return jsonify(message)


# This class has CRUD operatios in order to
# manage school professors
# return JSON
class SchoolProfessors(Resource):
    # Get all professors by level

    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('level', type=str, required=True)
        args = parser.parse_args()
        teachers = mongo.db.professors.find({"level": args.level})
        t = create_dic(teachers)
        return jsonify(teachers=t)

    # Create or update one teacher
    def put(self):
        parser = reqparse.RequestParser()
        parser.add_argument('id', type=int, location='json')
        parser.add_argument('name', type=unicode,
                            location='json', required=True)
        parser.add_argument('password', type=unicode,
                            location='json', required=True)
        parser.add_argument('phone', type=str, location='json')
        parser.add_argument('email', type=unicode, location='json')
        parser.add_argument('level', type=list, location='json', required=True)
        parser.add_argument('courses', type=list, location='json')
        args = parser.parse_args()

        # Get autoincrement id
        id = -1
        if args.id is not None:
            id = args.id
        else:
            cursor = mongo.db.counters.find_one_and_update(
                {'_id': 'professorid'}, {'$inc': {'seq': 1}}, projection={'seq': True, '_id': False})

            id = int(cursor['seq'])

        # Update existing data else create new document
        result = mongo.db.professors.update_one({"_id": id}, {"$set": {
            "_id": id,
            "name": args.name,
            "password": args.password,
            "phone": args.phone if args.phone is not None else '',
            "email": args.email if args.email is not None else '',
            "level": args.level,
            "courses": args.courses if args.email is not None else []
        }}, upsert=True)

        message = {}
        if result.modified_count == 1:
            message = {
                "status": 200,
                "code": 1,
                "prof_id": id
            }
        else:
            message = {
                "status": 201,
                "code": 2,
                "prof_id": id
            }

        return jsonify(message)

    # Delete specific professor
    def delete(self):
        parser = reqparse.RequestParser()
        parser.add_argument('id', type=int, location='json', required=True)
        args = parser.parse_args()
        result = mongo.db.professors.delete_one({"_id": args.id})
        if result.deleted_count == 1:
            message = {
                "status": 200,
                "code": 1
            }
        else:
            message = {
                "status": 500,
                "code": 2
            }
        return jsonify(message)

# This class has CRUD operatios in order to
# manage school students
# return JSON


class SchoolStudents(Resource):
    # Get all professors by level

    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('level', type=str, required=True)
        args = parser.parse_args()
        students = mongo.db.students.find({"level": args.level})
        s = create_dic(students)
        return jsonify(students=s)

    # Create or update one teacher
    def put(self):
        parser = reqparse.RequestParser()
        parser.add_argument('id', type=int, location='json')
        parser.add_argument('name', type=unicode,
                            location='json', required=True)
        parser.add_argument('password', type=unicode,
                            location='json', required=True)
        parser.add_argument('email', type=unicode, location='json')
        parser.add_argument('level', type=str, location='json', required=True)
        parser.add_argument('semester', type=str, location='json', required=True)
        parser.add_argument('courses', type=list, location='json')
        args = parser.parse_args()

        # Get autoincrement id
        id = -1
        if args.id is not None:
            id = args.id
        else:
            cursor = mongo.db.counters.find_one_and_update(
                {'_id': 'studentid'}, {'$inc': {'seq': 1}}, projection={'seq': True, '_id': False})
            id = int(cursor['seq'])

        # Update existing data else create new document
        result = mongo.db.students.update_one({"_id": id}, {"$set": {
            "_id": id,
            "name": args.name,
            "password": args.password,
            "email": args.email if args.email is not None else '',
            "level": args.level,
            "semester": args.semester,
            "courses": args.courses if args.courses is not None else []
        }}, upsert=True)

        message = {}
        if result.modified_count == 1:
            message = {
                "status": 200,
                "code": 1,
                "student_id": id
            }
        else:
            message = {
                "status": 201,
                "code": 2,
                "student_id": id
            }

        return jsonify(message)

    # Delete specific professor
    def delete(self):
        parser = reqparse.RequestParser()
        parser.add_argument('id', type=int, location='json', required=True)
        args = parser.parse_args()

        message = {}
        result = mongo.db.students.delete_one({"_id": args.id})
        if result.deleted_count == 1:
            message = {
                "status": 200,
                "code": 1
            }
        else:
            message = {
                "status": 500,
                "code": 2
            }

        return jsonify(message)

# This class has CRUD operatios in order to
# manage school courses
# return JSON


class SchoolCourses(Resource):
    # Get all courses by level

    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('level', type=str, required=True)
        parser.add_argument('semester', type=str)
        args = parser.parse_args()

        query = {
            "level": args.level
        }
        if args.semester is not None:
            query["semester"] = args.semester

        courses = mongo.db.courses.find(query)
        c = create_dic(courses)
        return jsonify(courses=c)

    # Create or update one course
    def put(self):
        parser = reqparse.RequestParser()
        parser.add_argument('id', type=str, location='json', required=True)
        parser.add_argument('name', type=unicode,
                            location='json', required=True)
        parser.add_argument('level', type=str, location='json', required=True)
        parser.add_argument('semester', type=str,
                            location='json', required=True)
        parser.add_argument('description', type=unicode,
                            location='json')
        parser.add_argument('college_carrer', type=unicode, location='json')
        args = parser.parse_args()

        sec = {
            "sec": 1,
            "hw": [],
            "quiz": [],
            "material": [],
            "announcements": [],
            "criteria": {
                "participation": 0,
                "attendance": 0,
                "hw": 0,
                "extras": 0,
                "exams": 0,
                "project": 0
            }
        }
        sections = []
        sections.append(sec)
        # Update existing data else create new document
        result = mongo.db.courses.update_one({"_id": args.id}, {"$set": {
            "_id": args.id,
            "name": args.name,
            "level": args.level,
            "semester": args.semester,
            "description": args.description,
            "college_carrer": args.college_carrer,
            "section": sections
        }}, upsert=True)

        message = {}
        if result.modified_count == 1:
            message = {
                "status": 200,
                "code": 1
            }
        else:
            message = {
                "status": 201,
                "code": 2
            }

        return jsonify(message)

    # Delete specific professor
    def delete(self):
        parser = reqparse.RequestParser()
        parser.add_argument('id', type=str, location='json', required=True)
        args = parser.parse_args()
        result = mongo.db.courses.delete_one({"_id": args.id})
        if result.deleted_count == 1:
            message = {
                "status": 200,
                "code": 1
            }
        else:
            message = {
                "status": 500,
                "code": 2
            }
        return jsonify(message)

# This class manage the simple Get courses info API
# return JSON


class SimpleCoursesAPI(Resource):
    # Get general school info

    def get(self):
        courses = mongo.db.courses.find(
            {}, {"_id": 1, "name": 1, "section.sec": 1})
        c = create_dic(courses)
        courses_dict_list = []
        for sec in c:
            course_dict = {
                "_id": sec['_id'],
                "name": sec['name']
            }
            if len(sec['section']) > 0:
                sec_list = sec['section']
                for one_sec in sec_list:
                    course_dict['section'] = one_sec['sec']
                    courses_dict_list.append(course_dict)
            else:
                course_dict['section'] = 1
                courses_dict_list.append(course_dict)

        return jsonify(courses=courses_dict_list)

# Announcements made by school administrator
# this class has CRUD operatios in order to
# manage school announcements
# @Path <id> - school id
# @Path <role> - user role
# return JSON


class SchoolAnnouncements(Resource):
    # Get all announcements

    def get(self, role):
        query = {}
        parser = reqparse.RequestParser()
        if role == "teacher":
            parser.add_argument('teacher_id', type=int)
            args = parser.parse_args()
            user = mongo.db.professors.find_one(
                {"_id": args.teacher_id}, {'level': 1, "_id": 0})
            query['announcements.level'] = {"$in": user["level"]}

        elif role == "student":
            parser.add_argument('student_id', type=int)
            args = parser.parse_args()
            user = mongo.db.students.find_one(
                {"_id": args.student_id}, {'level': 1, "_id": 0})
            query['announcements.level'] = {"$in": [user["level"]]}

        messages = mongo.db.school.find_one(
            {}, {'announcements': 1, "_id": 0})
        if messages is None:
            messages = {}
        return jsonify(messages)

    # Create or update one announcement
    def put(self, role):
        parser = reqparse.RequestParser()
        parser.add_argument('title', type=unicode,
                            location='json', required=True)
        parser.add_argument('content', type=unicode,
                            location='json', required=True)
        parser.add_argument('date', type=int, location='json', required=True)
        parser.add_argument('level', type=list, location='json', required=True)
        parser.add_argument('position', type=str, location='json')
        args = parser.parse_args()

        if args.position is None:
            mongo.db.school.update({}, {"$push": {
                "announcements": {
                    "title": args.title, "content": args.content,
                    "publication_date": args.date, "level": args.level
                }}})
            message = {
                "status": 201,
                "code": 1
            }
        else:
            pos = args.position
            mongo.db.school.update({}, {"$set": {"announcements." + pos + ".title": args.title,
                                                 "announcements." + pos + ".content": args.content,
                                                 "announcements." + pos + ".publication_date": args.date,
                                                 "announcements." + pos + ".level": args.level}})
            message = {
                "status": 200,
                "code": 2
            }

        return jsonify(message)

    # Delete specific announcement on array by date
    def delete(self, role):
        parser = reqparse.RequestParser()
        parser.add_argument('publication_date', type=int,
                            location='json', required=True)
        args = parser.parse_args()

        mongo.db.school.update({}, {"$pull": {
            "announcements": {"publication_date": args.publication_date}
        }})

        message = {
            "status": 200,
            "code": 1
        }

        return jsonify(message)

# This class has CRUD operatios in order to
# manage teacher courses
# @Path <id> - teacher id
# return JSON


class TeacherCourses(Resource):
    # Get all courses by teacher

    def get(self, id):
        p = mongo.db.professors.find_one({"_id": id}, {"_id": 0, "courses": 1})
        courses = mongo.db.courses.find({"_id": {"$in": p["courses"]}}, {
                                        "name": 1, "description": 1, "level": 1})
        c = create_dic(courses)
        print c
        return jsonify(courses=c)


# This class manage the teacher photo API
# @Path <id> - teacher id
# return JSON
class TeacherPhotoAPI(Resource):
    # Update teacher photo

    def post(self, id):
        parser = reqparse.RequestParser()
        parser.add_argument('file', type=str,
                            location='json', required=True)
        args = parser.parse_args()
        # First check profile photo
        # Create file
        path_dir = "/static/teachers/"
        file_type = "." + "jpg"
        file_name = create_file_name("teacher", file_type)
        path_file = path_dir + file_name
        # Create image
        create_image(path_file, args.file)
        mongo.db.professors.update({"_id": id}, {"$set": {"image": file_name}})
        message = {
            "status": 201,
            "code": 1
        }
        return jsonify(message)

    # Delete profile photo
    def delete(self, id):
        parser = reqparse.RequestParser()
        parser.add_argument('image', type=str,
                            location='json', required=True)
        args = parser.parse_args()

        path = "/static/teachers/" + args.image
        delete_file(path)
        result = mongo.db.professors.update_one(
            {"_id": id}, {"$set": {"image": ""}})

        if result.modified_count == 1:
            message = {
                "status": 200,
                "code": 1
            }
        else:
            message = {
                "status": 201,
                "code": 2
            }

        return jsonify(message)

# This class has CRUD operatios in order to
# manage a short cut teachers activity
# return JSON
class TeachersActivity(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('id', type=int, required=True)
        args = parser.parse_args()
        # First get principal level
        principal = mongo.db.professors.find_one({"_id": args.id}, {"principal_level": 1, "_id": 0})
        courses = create_dic(mongo.db.courses.find({"level":{"$in": principal["principal_level"]}}, {"_id": 1, "section.hw": 1, "name":1, "section.material": 1, "section.quiz":1}))
        teachers = create_dic(mongo.db.professors.find({},{"name":1, "_id":1, 'courses':1, 'image':1}))
        teachers_analysis = []
        for course in courses:
            for teacher in teachers:
                if course['_id'] in teacher['courses']:
                    register = {
                        "image": teacher['image'],
                        "teacher_name": teacher['name'],
                        "teacher_id": teacher['_id'],
                        "course_id": course["_id"],
                        "course_name": course["name"],
                        "hw": len(course['section'][0]['hw']),
                        "material": len(course['section'][0]['material']),
                        "quiz": len(course['section'][0]['quiz'])
                    }
                    teachers_analysis.append(register)

        return jsonify(activity=teachers_analysis)


# This class has CRUD operatios in order to
# manage teacher profile
# @Path <id> - teacher id
# return JSON


class TeacherProfile(Resource):
    # Get teacher profile

    def get(self, id):
        teacher = mongo.db.professors.find_one(
            {"_id": id}, {'_id': 0, 'courses': 0})

        return jsonify(teacher)

    # Update teacher profile
    def put(self, id):
        parser = reqparse.RequestParser()
        parser.add_argument('description', type=unicode,
                            location='json')
        parser.add_argument('email', type=unicode, location='json')
        parser.add_argument('phone', type=str, location='json')
        parser.add_argument('password', type=unicode,
                            location='json', required=True)
        args = parser.parse_args()

        data = {
            "description": args.description,
            "email": args.email,
            "phone": args.phone,
            "password": args.password
        }

        message = {}
        # Update existing data else create new document
        result = mongo.db.professors.update_one(
            {"_id": id}, {"$set": data})

        if result.modified_count == 1:
            message = {
                "status": 200,
                "code": 1
            }
        else:
            message = {
                "status": 201,
                "code": 2
            }

        return jsonify(message)

# This class has CRUD operatios in order to
# manage student profile
# @Path <id> - student id
# return JSON


class StudentProfile(Resource):
    # Get student profile

    def get(self, id):
        teacher = mongo.db.students.find_one(
            {"_id": id}, {'_id': 0, 'courses': 0})

        return jsonify(teacher)

    # Update teacher profile
    def put(self, id):
        parser = reqparse.RequestParser()
        parser.add_argument('description', type=unicode,
                            location='json')
        parser.add_argument('email', type=unicode, location='json')
        parser.add_argument('password', type=unicode,
                            location='json', required=True)
        args = parser.parse_args()

        data = {
            "email": args.email,
            "password": args.password
        }

        message = {}
        # Update existing data else create new document
        result = mongo.db.students.update_one(
            {"_id": id}, {"$set": data})

        if result.modified_count == 1:
            message = {
                "status": 200,
                "code": 1
            }
        else:
            message = {
                "status": 201,
                "code": 2
            }

        return jsonify(message)


# This class has CRUD operatios in order to
# manage student courses
# @Path <id> - student id
# return JSON


class StudentCourses(Resource):
    # Get all courses by student

    def get(self, id):
        p = mongo.db.students.find_one({"_id": id}, {"_id": 0, "courses": 1})
        courses = mongo.db.courses.find({"_id": {"$in": p["courses"]}}, {
                                        "name": 1, "description": 1, "level": 1})
        c = create_dic(courses)
        return jsonify(courses=c)

# This class has CRUD operatios in order to
# manage a course announ
# @Path <id> - curse id
# @Path <num> - section number
# return JSON


class CoursesAnnoun(Resource):
    # Get announcement from course section

    def get(self, id, num):
        announ = mongo.db.courses.find_one({"_id": id, "section.sec": int(num)}, {
                                           "_id": 0, "section.announcements": 1})
        section = announ['section'][0]
        return jsonify(announcements=section['announcements'])

    # Post announcement on course section
    def post(self, id, num):
        parser = reqparse.RequestParser()
        parser.add_argument('description', type=unicode,
                            location='json', required=True)
        parser.add_argument('date', type=int,
                            location='json', required=True)
        parser.add_argument('role', type=unicode,
                            location='json', required=True)
        parser.add_argument('author', type=unicode,
                            location='json', required=True)
        parser.add_argument('position', type=int, location='json')
        args = parser.parse_args()

        # Update existing data else create new document
        if args.position is None:
            mongo.db.courses.update_one({"_id": id, "section.sec": num}, {"$push": {
                "section.$.announcements": {
                    "description": args.description,
                    "author": args.author,
                    "date": args.date,
                    "role": args.role
                }
            }})
            message = {
                "status": 201,
                "code": 1
            }
        else:
            pos = args.position
            mongo.db.courses.update_one({"_id": id, "section.sec": num}, {"$set": {"section.$.announcements." + pos + ".description": args.description,
                                                                                   "section.$.announcements." + pos + ".author": args.author,
                                                                                   "section.$.announcements." + pos + ".date": args.date,
                                                                                   "section.$.announcements." + pos + ".role": args.role}})
            message = {
                "status": 200,
                "code": 2
            }

        return jsonify(message)

    # Delte announcement from course section
    def delete(self, id, num):
        parser = reqparse.RequestParser()
        parser.add_argument('publication_date', type=int,
                            location='json', required=True)
        args = parser.parse_args()

        result = mongo.db.courses.update_one({"_id": id, "section.sec": num}, {"$pull": {
            "section.$.announcements": {"date": args.publication_date}
        }})

        message = {}
        if result.modified_count == 1:
            message = {
                "status": 200,
                "code": 1
            }
        else:
            message = {
                "status": 201,
                "code": 2
            }

        return jsonify(message)


# This class has CRUD operatios in order to
# manage a course tasks
# @Path <id> - curse id
# @Path <num> - section number
# return JSON
class CoursesTasks(Resource):
    # Get announcement from course section

    def get(self, id, num):
        tasks = mongo.db.courses.find_one({"_id": id, "section.sec": num}, {
            "_id": 0, "section.hw": 1})

        section = tasks['section'][0]
        return jsonify(tasks=section['hw'])

    # Post announcement on course section
    def post(self, id, num):
        parser = reqparse.RequestParser()
        parser.add_argument('content', type=unicode,
                            location='json', required=True)
        parser.add_argument('title', type=unicode,
                            location='json', required=True)
        parser.add_argument('published_date', type=int,
                            location='json', required=True)
        parser.add_argument('end_date', type=int,
                            location='json')
        parser.add_argument('end_hour', type=int,
                            location='json')
        parser.add_argument('model', type=unicode,
                            location='json', required=True)
        parser.add_argument('attachment', type=int,
                            location='json', required=True)
        parser.add_argument('position', type=str, location='json')
        parser.add_argument('file', type=str,
                            location='json')
        parser.add_argument('edition', type=int, location='json')
        parser.add_argument('file_name', type=str, location='json')
        parser.add_argument('type', type=str, location='json')
        args = parser.parse_args()

        # Update existing data else create new document
        if args.position is None:
            file_name = ""
            data = {
                "content": args.content,
                "title": args.title,
                "published_date": args.published_date,
                "model": args.model,
                "attachment": args.attachment,
                "attachments": []
            }
            if args.file is not None:
                path_dir = "/static/tasks/"
                file_type = "." + args.type
                file_name = create_file_name("school", file_type)
                path_file = path_dir + file_name
                # Create image
                if args.type == "jpg" or args.type == "png" or args.type == "JPEG":
                    create_image(path_file, args.file)
                else:
                    create_package(path_file, args.file)
            data["route"] = file_name

            if args.end_date is not None and args.end_hour is not None:
                data["end_date"] = args.end_date
                data["end_hour"] = args.end_hour

            mongo.db.courses.update_one({"_id": id, "section.sec": num}, {"$push": {
                "section.$.hw": data
            }})
            message = {
                "status": 201,
                "code": 1
            }
        else:
            route = None
            if args.edition == 0:
                if args.file is not None:
                    path_dir = "/static/tasks/"
                    # Create file
                    file_type = "." + args.type
                    file_name = create_file_name("school", file_type)
                    path_file = path_dir + file_name
                    # Create image
                    if args.type == "jpg" or args.type == "png" or args.type == "JPEG":
                        create_image(path_file, args.file)
                    else:
                        create_package(path_file, args.file)
                    route = file_name
                else:
                    route = args.file_name
            elif args.edition == 1:
                path_dir = "/static/tasks/"
                # Remove file
                remove_file = path_dir + args.file_name
                delete_file(remove_file)
                route = ""
                if args.file is not None:
                    # Create file
                    file_type = "." + args.type
                    file_name = create_file_name("school", file_type)
                    path_file = path_dir + file_name
                    # Create image
                    if args.type == "jpg" or args.type == "png" or args.type == "JPEG":
                        create_image(path_file, args.file)
                    else:
                        create_package(path_file, args.file)
                    route = file_name

            pos = args.position
            data = {
                "section.$.hw." + pos + ".content": args.content,
                "section.$.hw." + pos + ".title": args.title,
                "section.$.hw." + pos + ".model": args.model,
                "section.$.hw." + pos + ".attachment": args.attachment,
                "section.$.hw." + pos + ".route": route
            }
            if args.end_date is not None and args.end_hour is not None:
                data["section.$.hw." + pos + ".end_date"] = args.end_date
                data["section.$.hw." + pos + ".end_hour"] = args.end_hour

            mongo.db.courses.update_one(
                {"_id": id, "section.sec": num}, {"$set": data})
            message = {
                "status": 200,
                "code": 2
            }

        return jsonify(message)

    # Delte announcement from course section
    def delete(self, id, num):
        parser = reqparse.RequestParser()
        parser.add_argument('published_date', type=int,
                            location='json', required=True)
        parser.add_argument('file_name', type=str, location='json')

        args = parser.parse_args()

        result = mongo.db.courses.update_one({"_id": id, "section.sec": num}, {"$pull": {
            "section.$.hw": {"published_date": args.published_date}
        }})

        message = {}
        if result.modified_count == 1:
            message = {
                "status": 200,
                "code": 1
            }
            if args.file_name is not None:
                path_dir = "/static/tasks/"
                file_name = args.file_name
                path_file = path_dir + file_name
                delete_file(path_file)
        else:
            message = {
                "status": 201,
                "code": 2
            }

        return jsonify(message)


# This class has CRUD operatios in order to
# manage a course quiz
# @Path <id> - curse id
# @Path <num> - section number
# return JSON
class CoursesQuiz(Resource):
    # Get announcement from course section

    def get(self, id, num):
        quiz = mongo.db.courses.find_one({"_id": id, "section.sec": num}, {
            "_id": 0, "section.quiz": 1})

        section = quiz['section'][0]
        return jsonify(quiz=section['quiz'])

    # Post announcement on course section
    def post(self, id, num):
        parser = reqparse.RequestParser()
        parser.add_argument('content', type=unicode,
                            location='json', required=True)
        parser.add_argument('title', type=unicode,
                            location='json', required=True)
        parser.add_argument('published_date', type=int,
                            location='json', required=True)
        parser.add_argument('start_date', type=int,
                            location='json', required=True)
        parser.add_argument('start_hour', type=int,
                            location='json', required=True)
        parser.add_argument('end_date', type=int,
                            location='json', required=True)
        parser.add_argument('end_hour', type=int,
                            location='json', required=True)
        parser.add_argument('position', type=str, location='json')
        parser.add_argument('questions', type=list, location='json')

        args = parser.parse_args()

        # Update existing data else create new document
        if args.position is None:
            mongo.db.courses.update_one({"_id": id, "section.sec": num}, {"$push": {
                "section.$.quiz": {
                    "content": args.content,
                    "title": args.title,
                    "published_date": args.published_date,
                    "start_date": args.start_date,
                    "start_hour": args.start_hour,
                    "end_date": args.end_date,
                    "end_hour": args.end_hour,
                    "questions": args.questions
                }
            }})
            message = {
                "status": 201,
                "code": 1
            }
        else:
            pos = args.position
            mongo.db.courses.update_one({"_id": id, "section.sec": num}, {"$set": {"section.$.quiz." + pos + ".content": args.content,
                                                                                   "section.$.quiz." + pos + ".title": args.title,
                                                                                   "section.$.quiz." + pos + ".start_date": args.start_date,
                                                                                   "section.$.quiz." + pos + ".start_hour": args.start_hour,
                                                                                   "section.$.quiz." + pos + ".end_date": args.end_date,
                                                                                   "section.$.quiz." + pos + ".end_hour": args.end_hour,
                                                                                   "section.$.quiz." + pos + ".questions": args.questions}})
            message = {
                "status": 200,
                "code": 2
            }

        return jsonify(message)

    # Delte announcement from course section
    def delete(self, id, num):
        parser = reqparse.RequestParser()
        parser.add_argument('published_date', type=int,
                            location='json', required=True)
        args = parser.parse_args()

        result = mongo.db.courses.update_one({"_id": id, "section.sec": num}, {"$pull": {
            "section.$.quiz": {"published_date": args.published_date}
        }})

        message = {}
        if result.modified_count == 1:
            message = {
                "status": 200,
                "code": 1
            }
        else:
            message = {
                "status": 201,
                "code": 2
            }

        return jsonify(message)

# This class has CRUD operatios in order to
# manage a course material
# @Path <id> - curse id
# @Path <num> - section number
# return JSON


class CoursesMaterial(Resource):
    # Get material from course section

    def get(self, id, num):
        quiz = mongo.db.courses.find_one({"_id": id, "section.sec": num}, {
            "_id": 0, "section.material": 1})

        section = quiz['section'][0]
        return jsonify(material=section['material'])

    # Post material on course section
    def post(self, id, num):
        parser = reqparse.RequestParser()
        parser.add_argument('content', type=unicode,
                            location='json', required=True)
        parser.add_argument('title', type=unicode,
                            location='json', required=True)
        parser.add_argument('published_date', type=int,
                            location='json', required=True)
        parser.add_argument('file', type=str,
                            location='json')
        parser.add_argument('position', type=str, location='json')
        parser.add_argument('edition', type=int, location='json')
        parser.add_argument('file_name', type=str, location='json')
        parser.add_argument('type', type=str, location='json')

        args = parser.parse_args()

        # Update existing data else create new document
        if args.position is None:
            file_name = ""
            if args.file is not None:
                path_dir = "/static/material/"
                file_type = "." + args.type
                file_name = create_file_name("school", file_type)
                path_file = path_dir + file_name
                # Create image
                if args.type == "jpg" or args.type == "png" or args.type == "JPEG":
                    create_image(path_file, args.file)
                else:
                    create_package(path_file, args.file)

            mongo.db.courses.update_one({"_id": id, "section.sec": num}, {"$push": {
                "section.$.material": {
                    "content": args.content,
                    "title": args.title,
                    "published_date": args.published_date,
                    "route": file_name
                }
            }})
            message = {
                "status": 201,
                "code": 1
            }
        else:
            route = None
            if args.edition == 0:
                if args.file is not None:
                    path_dir = "/static/material/"
                    # Create file
                    file_type = "." + args.type
                    file_name = create_file_name("school", file_type)
                    path_file = path_dir + file_name
                    # Create image
                    if args.type == "jpg" or args.type == "png" or args.type == "JPEG":
                        create_image(path_file, args.file)
                    else:
                        create_package(path_file, args.file)
                    route = file_name
                else:
                    route = args.file_name
            elif args.edition == 1:
                path_dir = "/static/material/"
                # Remove file
                remove_file = path_dir + args.file_name
                delete_file(remove_file)
                route = ""
                if args.file is not None:
                    # Create file
                    file_type = "." + args.type
                    file_name = create_file_name("school", file_type)
                    path_file = path_dir + file_name
                    # Create image
                    if args.type == "jpg" or args.type == "png" or args.type == "JPEG":
                        create_image(path_file, args.file)
                    else:
                        create_package(path_file, args.file)
                    route = file_name

            pos = args.position
            mongo.db.courses.update_one({"_id": id, "section.sec": num}, {"$set": {"section.$.material." + pos + ".content": args.content,
                                                                                   "section.$.material." + pos + ".title": args.title,
                                                                                   "section.$.material." + pos + ".route": route
                                                                                   }})
            message = {
                "status": 200,
                "code": 2
            }

        return jsonify(message)

    # Delte material from course section
    def delete(self, id, num):
        parser = reqparse.RequestParser()
        parser.add_argument('published_date', type=int,
                            location='json', required=True)
        parser.add_argument('file_name', type=str, location='json')
        args = parser.parse_args()

        result = mongo.db.courses.update_one({"_id": id, "section.sec": num}, {"$pull": {
            "section.$.material": {"published_date": args.published_date}
        }})

        message = {}
        if result.modified_count == 1:
            message = {
                "status": 200,
                "code": 1
            }
            if args.file_name is not None:
                path_dir = "/static/material/"
                file_name = args.file_name
                path_file = path_dir + file_name
                delete_file(path_file)

        else:
            message = {
                "status": 201,
                "code": 2
            }

        return jsonify(message)


# This class has CRUD operatios in order to
# manage a course tasks attachments
# @Path <id> - curse id
# @Path <num> - section number
# return JSON
class CoursesTasksAttach(Resource):

    def get(self, id, num):
        parser = reqparse.RequestParser()
        parser.add_argument('published_date', type=int,
                            required=True)

        args = parser.parse_args()

        pipe = [
            # Only include the docs with the specified user id
            {"$match": {'_id': id, "section.sec": num}},
            # Bring group out to the only top level field and exclude _id
            {"$project": {'_id': 0, 'hw': '$section.hw'}},
            {"$unwind": "$hw"},
            {"$unwind": "$hw"},
            {"$match": {'hw.published_date': args.published_date}},
            {"$project": {"hw.attachments": 1}}
        ]
        cursor = mongo.db.courses.aggregate(pipe)
        att_list = create_dic(cursor)
        attach = {}
        if len(att_list) > 0:
            attach = att_list[0]['hw']['attachments']
        else:
            attach['attachments'] = []
        return jsonify(attachments=attach)

    # Create an attachments to task
    def post(self, id, num):
        parser = reqparse.RequestParser()
        parser.add_argument('file', type=str,
                            location='json')
        parser.add_argument('position_task', type=str,
                            location='json', required=True)
        parser.add_argument('position_attach', type=str, location='json')
        parser.add_argument('edition', type=int, location='json')
        parser.add_argument('file_name', type=str, location='json')
        parser.add_argument('student', type=int,
                            location='json', required=True)
        parser.add_argument('type', type=str, location='json')

        args = parser.parse_args()

        # Create
        if args.position_attach is None:
            file_name = ""
            if args.file is not None:
                path_dir = "/static/tasks/"
                file_type = "." + args.type
                file_name = create_file_name("school", file_type)
                path_file = path_dir + file_name
                # Create image
                if args.type == "jpg" or args.type == "png" or args.type == "JPEG":
                    create_image(path_file, args.file)
                else:
                    create_package(path_file, args.file)

            print args.student
            student = mongo.db.students.find_one(
                {"_id": args.student}, {"name": 1, "_id": 0})
            mongo.db.courses.update_one({"_id": id, "section.sec": num}, {"$push": {
                "section.$.hw." + args.position_task + ".attachments": {"student": args.student, "url": file_name, "grade": 0.0, "student_name": student["name"]}
            }})

            message = {
                "status": 201,
                "code": 1
            }
        else:
            route = None
            if args.edition == 0:
                if args.file is not None:
                    path_dir = "/static/tasks/"
                    # Create file
                    file_type = "." + args.type
                    file_name = create_file_name("school", file_type)
                    path_file = path_dir + file_name
                    # Create image
                    if args.type == "jpg" or args.type == "png" or args.type == "JPEG":
                        create_image(path_file, args.file)
                    else:
                        create_package(path_file, args.file)
                    route = file_name
                else:
                    route = args.file_name
            elif args.edition == 1:
                path_dir = "/static/tasks/"
                # Remove file
                remove_file = path_dir + args.file_name
                delete_file(remove_file)
                route = ""
                if args.file is not None:
                    # Create file
                    file_type = "." + args.type
                    file_name = create_file_name("school", file_type)
                    path_file = path_dir + file_name
                    # Create image
                    if args.type == "jpg" or args.type == "png" or args.type == "JPEG":
                        create_image(path_file, args.file)
                    else:
                        create_package(path_file, args.file)
                    route = file_name

            pos = args.position_attach
            mongo.db.courses.update_one({"_id": id, "section.sec": num}, {"$set": {"section.$.hw." + args.position_task + ".attachments." + pos + ".url": route
                                                                                   }})
            message = {
                "status": 200,
                "code": 2
            }

        return jsonify(message)

# This class has CRUD operatios in order to
# manage a course tasks attachments
# @Path <id> - curse id
# @Path <num> - section number
# return JSON


class CoursesExamAnswers(Resource):

    def get(self, id, num):
        parser = reqparse.RequestParser()
        parser.add_argument('published_date', type=int,
                            required=True)

        args = parser.parse_args()

        pipe = [
            # Only include the docs with the specified user id
            {"$match": {'_id': id, "section.sec": num}},
            # Bring group out to the only top level field and exclude _id
            {"$project": {'_id': 0, 'hw': '$section.hw'}},
            {"$unwind": "$hw"},
            {"$unwind": "$hw"},
            {"$match": {'hw.published_date': args.published_date}},
            {"$project": {"hw.attachments": 1}}
        ]
        cursor = mongo.db.courses.aggregate(pipe)
        attach = create_dic(cursor)[0]['hw']
        return jsonify(attachments=attach['attachments'])

    # Create an attachments to task
    def post(self, id, num):
        parser = reqparse.RequestParser()
        parser.add_argument('file', type=str,
                            location='json')
        parser.add_argument('position_task', type=str,
                            location='json', required=True)
        parser.add_argument('position_attach', type=str, location='json')
        parser.add_argument('edition', type=int, location='json')
        parser.add_argument('file_name', type=str, location='json')
        parser.add_argument('student', type=int,
                            location='json', required=True)
        parser.add_argument('type', type=str, location='json')

        args = parser.parse_args()

        # Create
        if args.position_attach is None:
            file_name = ""
            if args.file is not None:
                path_dir = "/static/tasks/"
                file_type = "." + args.type
                file_name = create_file_name("school", file_type)
                path_file = path_dir + file_name
                create_package(path_file, args.file)

            mongo.db.courses.update_one({"_id": id, "section.sec": num}, {"$push": {
                "section.$.hw." + args.position_task + ".attachments": {"student": args.student, "url": file_name, "grade": 0.0}
            }})

            message = {
                "status": 201,
                "code": 1
            }
        else:
            route = None
            if args.edition == 0:
                if args.file is not None:
                    path_dir = "/static/tasks/"
                    # Create file
                    file_type = "." + args.type
                    file_name = create_file_name("school", file_type)
                    path_file = path_dir + file_name
                    create_package(path_file, args.file)
                    route = file_name
                else:
                    route = args.file_name
            elif args.edition == 1:
                path_dir = "/static/tasks/"
                # Remove file
                remove_file = path_dir + args.file_name
                delete_file(remove_file)
                route = ""
                if args.file is not None:
                    # Create file
                    file_type = "." + args.type
                    file_name = create_file_name("school", file_type)
                    path_file = path_dir + file_name
                    create_package(path_file, args.file)
                    route = file_name

            pos = args.position_attach
            mongo.db.courses.update_one({"_id": id, "section.sec": num}, {"$set": {"section.$.hw." + args.position_task + ".attachments." + pos + ".url": route
                                                                                   }})
            message = {
                "status": 200,
                "code": 2
            }

        return jsonify(message)

# This class has CRUD operatios in order to
# manage a course tasks attachments
# @Path <id> - curse id
# @Path <num> - section number
# return JSON


class CoursesSimpleQuiz(Resource):

    def get(self, id, num):
        parser = reqparse.RequestParser()
        parser.add_argument('published_date', type=int,
                            required=True)

        args = parser.parse_args()
        pipe = [
            # Only include the docs with the specified user id
            {"$match": {'_id': id, "section.sec": num}},
            # Bring group out to the only top level field and exclude _id
            {"$project": {'_id': 0, 'qz': '$section.quiz'}},
            {"$unwind": "$qz"},
            {"$unwind": "$qz"},
            {"$match": {'qz.published_date': args.published_date}}
        ]
        cursor = mongo.db.courses.aggregate(pipe)
        quiz = create_dic(cursor)[0]['qz']

        return jsonify(quiz)

# This class has CRUD operatios in order to
# manage a attendance and students groups
# @Path <id> - curse id
# @Path <num> - section number
# return JSON
class CoursesStudents(Resource):

    def get(self, id, num):
        students = mongo.db.students.find({"courses":id},{"name":1, "_id":1})
        s = create_dic(students)
        return jsonify(students=s)

# This class has CRUD operatios in order to
# manage a course tasks attachments
# @Path <id> - curse id
# @Path <num> - section number
# return JSON


class TaskGrade(Resource):

    def post(self, id, num):
        parser = reqparse.RequestParser()
        parser.add_argument('position_attach', type=int,
                            location="json", required=True)
        parser.add_argument('position_task', type=str,
                            location="json", required=True)
        parser.add_argument('position_attach', type=str,
                            location="json", required=True)
        parser.add_argument('grade', type=float,
                            location="json", required=True)

        args = parser.parse_args()

        result = mongo.db.courses.update_one({"_id": id, "section.sec": num},
                                             {"$set": {
                                                 "section.$.hw." + args.position_task + ".attachments." + args.position_attach + ".grade": args.grade
                                             }})
        message = {}
        if result.modified_count == 1:
            message = {
                "status": 200,
                "code": 1
            }
        else:
            message = {
                "status": 201,
                "code": 2
            }

        return jsonify(message)


# This class has CRUD operatios in order to
# manage a course tasks attachments
# @Path <id> - curse id
# @Path <num> - section number
# return JSON


class CourseCriteria(Resource):

    def get(self, id, num):
        criteria = mongo.db.courses.find_one(
            {"_id": id, "section.sec": num}, {"_id": 0, "section.$": 1})
        c = criteria['section'][0]
        teacher = mongo.db.professors.find_one(
            {"courses": id}, {"_id": 0, "image": 1})
        dict_criteria = {
            "criteria": c['criteria'],
            "photo": teacher['image'] if teacher is not None else "",
            "description": c['description'] if c['description'] is not None else ""
        }
        return jsonify(dict_criteria)

    def post(self, id, num):
        parser = reqparse.RequestParser()
        parser.add_argument('participation', type=int,
                            location="json", required=True)
        parser.add_argument('project', type=int,
                            location="json", required=True)
        parser.add_argument('extras', type=int,
                            location="json", required=True)
        parser.add_argument('hw', type=int,
                            location="json", required=True)
        parser.add_argument('exams', type=int,
                            location="json", required=True)
        parser.add_argument('attendance', type=int,
                            location="json", required=True)
        parser.add_argument('description', type=unicode,
                            location="json", required=True)

        args = parser.parse_args()

        result = mongo.db.courses.update_one({"_id": id, "section.sec": num},
                                             {"$set": {
                                                 "section.$.criteria.participation": args.participation,
                                                 "section.$.criteria.project": args.project,
                                                 "section.$.criteria.extras": args.extras,
                                                 "section.$.criteria.hw": args.hw,
                                                 "section.$.criteria.exams": args.exams,
                                                 "section.$.criteria.attendance": args.attendance,
                                                 "section.$.description": args.description
                                             }})
        message = {}
        if result.modified_count == 1:
            message = {
                "status": 200,
                "code": 1
            }
        else:
            message = {
                "status": 201,
                "code": 2
            }

        return jsonify(message)



def create_dic(cursor):
    k = []
    for doc in cursor:
        k.append({key: (str(value) if key == "_id" else value)
                  for key, value in doc.items()})
    return k


def create_secure_name(name):
    dict = {u" ": u"", u"Á": u"A", u"É": u"E", u"Í": u"I",
            u"Ó": u"O", u"Ú": u"U", u"Ñ": u"N", u"\'": u"", u"\"": u""}
    # Create a regular expression  from the dictionary keys
    regex = re.compile(u"({0:s})".format(
        "|".join(map(re.escape, dict.keys()))))
    # For each match, look-up corresponding value in dictionary
    return regex.sub(lambda mo: dict[mo.string[mo.start():mo.end()]], name).upper()


def create_file_name(prefix, suffix):
    # Create unique file name
    timer = time.strftime("%d-%m-%Y%H:%M:%S") + prefix
    tf = tempfile.NamedTemporaryFile(prefix=timer, suffix=suffix)
    return tf.name.replace("/tmp/", "")


def delete_file(path):
    absolute_path = current_path + path
    os.remove(absolute_path)


def create_folder(path):
    absolute_path = current_path + path
    if not os.path.exists(absolute_path):
        # Change permissions
        oldumask = os.umask(0)
        os.makedirs(absolute_path, mode=0777)
        os.umask(oldumask)


def create_package(path, file):
    absolute_path = current_path + path
    # z = zipfile.ZipFile(BytesIO(base64.b64decode(file)), "r")
    byte_str = BytesIO(base64.b64decode(file)).read()
    output = open(absolute_path, 'wb')
    output.write(byte_str)
    output.close()


def create_image(path, file):
    absolute_path = current_path + path
    im = Image.open(BytesIO(base64.b64decode(file)))
    im.save(absolute_path, 'JPEG', quality=50)

api.add_resource(SchoolAPI, '/api/v0/school/info/<int:id>',
                 endpoint='schoolInfo')
api.add_resource(SimpleSchoolAPI, '/api/v0/school', endpoint='school')
api.add_resource(SchoolAnnouncements,
                 '/api/v0/school/announcements/<role>', endpoint='schoolAnnouncements')
api.add_resource(SchoolProfessors, '/api/v0/school/teachers',
                 endpoint='schoolTeachers')
api.add_resource(SchoolStudents, '/api/v0/school/students',
                 endpoint='schoolStudents')
api.add_resource(SchoolCourses, '/api/v0/school/courses',
                 endpoint='schoolCourses')
api.add_resource(SimpleCoursesAPI, '/api/v0/school/courses/list',
                 endpoint='schoolCoursesList')
api.add_resource(
    StudentProfile, '/api/v0/student/profile/<int:id>', endpoint='studentProfile')
api.add_resource(
    StudentCourses, '/api/v0/student/courses/<int:id>', endpoint='studentCourses')
api.add_resource(
    TeacherCourses, '/api/v0/teacher/courses/<int:id>', endpoint='teacherCourses')
api.add_resource(
    TeacherProfile, '/api/v0/teacher/profile/<int:id>', endpoint='teacherProfile')
api.add_resource(CoursesAnnoun, '/api/v0/courses/announ/<id>/<int:num>',
                 endpoint='coursesAnnoun')
api.add_resource(CoursesTasks, '/api/v0/courses/task/<id>/<int:num>',
                 endpoint='coursesTask')
api.add_resource(CoursesQuiz, '/api/v0/courses/quiz/<id>/<int:num>',
                 endpoint='coursesQuiz')
api.add_resource(CoursesMaterial, '/api/v0/courses/material/<id>/<int:num>',
                 endpoint='coursesMaterial')
api.add_resource(UserApi, '/api/v0/user/login',
                 endpoint='userProfile')
api.add_resource(CoursesTasksAttach, '/api/v0/courses/task/attach/<id>/<int:num>',
                 endpoint='courseTaskAttach')
api.add_resource(CoursesSimpleQuiz, '/api/v0/courses/quiz/info/<id>/<int:num>',
                 endpoint='courseSimpleQuiz')
api.add_resource(TaskGrade, '/api/v0/courses/task/grade/<id>/<int:num>',
                 endpoint='taskGrade')
api.add_resource(CourseCriteria, '/api/v0/courses/criteria/<id>/<int:num>',
                 endpoint='courseCriteria')
api.add_resource(
    TeacherPhotoAPI, '/api/v0/teacher/profile/photo/<int:id>', endpoint='teacherPhoto')
api.add_resource(CoursesStudents, '/api/v0/courses/students/<id>/<int:num>', endpoint='studentsOnCourse')
api.add_resource(TeachersActivity, '/api/v0/principal/views', endpoint="teachersActivity")
