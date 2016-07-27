# coding=utf-8
from schoolDemo import app, mongo
from flask import Flask
from flask import jsonify, render_template, g, flash, redirect, url_for, json
from bson.objectid import ObjectId
from decimal import Decimal
from flask.ext.restful import Api, Resource, reqparse
from flask.ext.bcrypt import check_password_hash, generate_password_hash
from flask.ext.login import LoginManager, login_user, logout_user, current_user, login_required
import uuid
from datetime import datetime, timedelta, date
import os
import time
import tempfile
import re
import base64
from PIL import Image
from io import BytesIO


@app.route('/')
def login():
    return render_template("login.html")


@app.route('/teacher')
def teacher():
    return render_template("teacher_home.html")


@app.route('/student')
def student():
    return render_template("student_home.html")


@app.route('/teacher/class')
def teacher_class():
    return render_template("dashboard_teacher/teacher_dashboard.html")


@app.route('/student/class')
def student_class():
    return render_template("dashboard_student/student_dashboard.html")


@app.route('/admin')
def admin():
    return render_template("admin_base.html")


###################################################
# ------------------Restful API-------------------
###################################################
api = Api(app)


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
            {"_id": ObjectId(id)}, {'_id': 0, 'announcements': 0})
        return jsonify(school)

    # Update general info
    def put(self, id):
        parser = reqparse.RequestParser()
        parser.add_argument('name', type=str, location='json', required=True)
        parser.add_argument('email', type=str, location='json', required=True)
        parser.add_argument('description', type=str, location='json')
        parser.add_argument('password', type=str, location='json')
        parser.add_argument('profile_photo', type=str,
                            location='json', required=True)
        parser.add_argument('address', type=str,
                            location='json', required=True)
        parser.add_argument('phone', type=str, location='json')
        parser.add_argument('in_charge', type=str,
                            location='json', required=True)
        parser.add_argument('in_charge_job', type=str,
                            location='json', required=True)
        args = parser.parse_args()

        # Check if user already exists
        cursor = mongo.db.school.find_one({"_id": ObjectId(id)})
        if cursor is not None:
            # First check profile photo
            photo = ''
            data = {
                "name": args.name, "email": args.email,
                "password": "", "description": args.description,
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

            mongo.db.school.update({"_id": ObjectId(id)}, {"$set": data})
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
            {"_id": ObjectId(id)}, {"$set": {"profile_photo": ""}})

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
        parser.add_argument('name', type=str,  location='json', required=True)
        parser.add_argument('password', type=str,
                            location='json', required=True)
        parser.add_argument('phone', type=str, location='json')
        parser.add_argument('email', type=str, location='json')
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
        parser.add_argument('name', type=str,  location='json', required=True)
        parser.add_argument('password', type=str,
                            location='json', required=True)
        parser.add_argument('email', type=str, location='json')
        parser.add_argument('level', type=str, location='json', required=True)
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
        parser.add_argument('name', type=str,  location='json', required=True)
        parser.add_argument('level', type=str, location='json', required=True)
        parser.add_argument('semester', type=str,
                            location='json', required=True)
        parser.add_argument('description', type=str,
                            location='json')
        parser.add_argument('college_carrer', type=str, location='json')
        parser.add_argument('section', type=list, location='json')
        args = parser.parse_args()

        # Update existing data else create new document
        result = mongo.db.courses.update_one({"_id": args.id}, {"$set": {
            "_id": args.id,
            "name": args.name,
            "level": args.level,
            "semester": args.semester,
            "description": args.description,
            "college_carrer": args.college_carrer,
            "section": args.section if args.section is not None else []
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

    def get(self, id, role):
        query = {
            "_id": ObjectId(id)
        }
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
            query, {'announcements': 1, "_id": 0})
        if messages is None:
            messages = {}
        return jsonify(messages)

    # Create or update one announcement
    def put(self, id, role):
        parser = reqparse.RequestParser()
        parser.add_argument('title', type=str,  location='json', required=True)
        parser.add_argument('content', type=str,
                            location='json', required=True)
        parser.add_argument('date', type=int, location='json', required=True)
        parser.add_argument('level', type=list, location='json', required=True)
        parser.add_argument('position', type=str, location='json')
        args = parser.parse_args()

        if args.position is None:
            mongo.db.school.update({"_id": ObjectId(id)}, {"$push": {
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
            mongo.db.school.update({"_id": ObjectId(id)}, {"$set": {"announcements." + pos + ".title": args.title,
                                                                    "announcements." + pos + ".content": args.content,
                                                                    "announcements." + pos + ".publication_date": args.date,
                                                                    "announcements." + pos + ".level": args.level}})
            message = {
                "status": 200,
                "code": 2
            }

        return jsonify(message)

    # Delete specific announcement on array by date
    def delete(self, id, role):
        parser = reqparse.RequestParser()
        parser.add_argument('publication_date', type=int,
                            location='json', required=True)
        args = parser.parse_args()

        mongo.db.school.update({"_id": ObjectId(id)}, {"$pull": {
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
        parser.add_argument('description', type=str,
                            location='json')
        parser.add_argument('email', type=str, location='json')
        parser.add_argument('phone', type=str, location='json')
        parser.add_argument('password', type=str,
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
                                           "_id": 0, "section.announ": 1})
        section = announ['section'][0]
        return jsonify(announcements=section['announ'])

    # Post announcement on course section
    def post(self, id, num):
        parser = reqparse.RequestParser()
        parser.add_argument('description', type=str,
                            location='json', required=True)
        parser.add_argument('date', type=int, location='json', required=True)
        parser.add_argument('role', type=str, location='json', required=True)
        parser.add_argument('author', type=str, location='json', required=True)
        parser.add_argument('position', type=int, location='json')
        args = parser.parse_args()

        # Update existing data else create new document
        if args.position is None:
            mongo.db.courses.update_one({"_id": id, "section.sec": num}, {"$push": {
                "section.$.announ": {
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
            mongo.db.courses.update_one({"_id": id, "section.sec": num}, {"$set": {"section.$.announ." + pos + ".description": args.description,
                                                                                   "section.$.announ." + pos + ".author": args.author,
                                                                                   "section.$.announ." + pos + ".date": args.date,
                                                                                   "section.$.announ." + pos + ".role": args.role}})
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
            "section.$.announ": {"date": args.publication_date}
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
        parser.add_argument('content', type=str,
                            location='json', required=True)
        parser.add_argument('title', type=str, location='json', required=True)
        parser.add_argument('published_date', type=int,
                            location='json', required=True)
        parser.add_argument('model', type=str,
                            location='json', required=True)
        parser.add_argument('position', type=str, location='json')
        args = parser.parse_args()

        # Update existing data else create new document
        if args.position is None:
            mongo.db.courses.update_one({"_id": id, "section.sec": num}, {"$push": {
                "section.$.hw": {
                    "content": args.content,
                    "title": args.title,
                    "published_date": args.published_date,
                    "model": args.model
                }
            }})
            message = {
                "status": 201,
                "code": 1
            }
        else:
            pos = args.position
            mongo.db.courses.update_one({"_id": id, "section.sec": num}, {"$set": {"section.$.hw." + pos + ".content": args.content,
                                                                                   "section.$.hw." + pos + ".title": args.title,
                                                                                   "section.$.hw." + pos + ".model": args.model}})
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
            "section.$.hw": {"published_date": args.published_date}
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
        parser.add_argument('content', type=str,
                            location='json', required=True)
        parser.add_argument('title', type=str, location='json', required=True)
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


def create_file_name():
    # Create unique file name
    timer = time.strftime("%d-%m-%Y%H:%M:%S") + "traviare"
    tf = tempfile.NamedTemporaryFile(prefix=timer, suffix=".jpg")
    return tf.name.replace("/tmp/", "")


def delete_file(path):
    absolute_path = "/home/gerardo/Documents/Business/schools/schoolDemo/schoolDemo" + path
    os.remove(absolute_path)


def create_folder(path):
    absolute_path = "/home/gerardo/Documents/Business/schools/schoolDemo/schoolDemo" + path
    if not os.path.exists(absolute_path):
        # Change permissions
        oldumask = os.umask(0)
        os.makedirs(absolute_path, mode=0777)
        os.umask(oldumask)


def create_image(path, file):
    absolute_path = "/home/gerardo/Documents/Business/schools/schoolDemo/schoolDemo" + path
    im = Image.open(BytesIO(base64.b64decode(file)))
    im.save(absolute_path, 'JPEG')

api.add_resource(SchoolAPI, '/api/v0/school/info/<id>', endpoint='schoolInfo')
api.add_resource(SimpleSchoolAPI, '/api/v0/school', endpoint='school')
api.add_resource(SchoolAnnouncements,
                 '/api/v0/school/announcements/<id>/<role>', endpoint='schoolAnnouncements')
api.add_resource(SchoolProfessors, '/api/v0/school/teachers',
                 endpoint='schoolTeachers')
api.add_resource(SchoolStudents, '/api/v0/school/students',
                 endpoint='schoolStudents')
api.add_resource(SchoolCourses, '/api/v0/school/courses',
                 endpoint='schoolCourses')
api.add_resource(SimpleCoursesAPI, '/api/v0/school/courses/list',
                 endpoint='schoolCoursesList')
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
