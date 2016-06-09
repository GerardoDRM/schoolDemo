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
import os, time, tempfile, re, base64
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
    return render_template("teacher_dashboard.html")

@app.route('/student/class')
def student_class():
    return render_template("student_dashboard.html")

@app.route('/admin')
def admin():
    return render_template("admin_base.html")


###################################################
# ------------------Restful API-------------------
###################################################
api = Api(app)

# This class manage the school info API
# @Path <id> - school id
# return JSON
class SchoolAPI(Resource):
    # Get general school info
    def get(self, id):
        school = mongo.db.school.find_one({"_id": ObjectId(id)},{'_id':0, 'announcements':0})
        return jsonify(school)

    # Update general info
    def put(self, id):
        parser = reqparse.RequestParser()
        parser.add_argument('name', type=str, location='json', required=True)
        parser.add_argument('email', type=str, location='json', required=True)
        parser.add_argument('description', type=str, location='json')
        parser.add_argument('password', type=str, location='json')
        parser.add_argument('profile_photo', type=str,location='json', required=True)
        parser.add_argument('address', type=str, location='json', required=True)
        parser.add_argument('phone', type=str, location='json')
        parser.add_argument('in_charge', type=str, location='json', required=True)
        parser.add_argument('in_charge_job', type=str, location='json', required=True)
        args = parser.parse_args()

        # Check if user already exists
        cursor = mongo.db.school.find_one({"_id": ObjectId(id)})
        if cursor is not None:
            # First check profile photo
            photo = '';
            if args.profile_photo is not None:
                # Root
                path_dir = "/static/images/"
                file_name = create_file_name()
                path_file = path_dir + file_name
                # Create image
                create_image(path_file, args.profile_photo)
                photo = path_file


            mongo.db.school.update({"_id": ObjectId(id)}, {"$set": {"name": args.name,"email":args.email,
                                      "profile_photo":photo, "password": "", "description": args.description,
                                      "address.street": args.address, "address.in_charge": args.in_charge,
                                      "address.in_charge_job": args.in_charge_job, "address.phone": args.phone}})
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


# This class has CRUD operatios in order to
# manage school professors
# return JSON
class SchoolProfessors(Resource):
    # Get all professors by level
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('level', type=str, required=True)
        args = parser.parse_args()
        teachers = mongo.db.professors.find({"level":args.level})
        t = create_dic(teachers)
        return jsonify(teachers = t)

    # Create or update one teacher
    def put(self):
        parser = reqparse.RequestParser()
        parser.add_argument('id', type=int, location='json')
        parser.add_argument('name', type=str,  location='json', required=True)
        parser.add_argument('password', type=str, location='json',required=True)
        parser.add_argument('phone', type=str, location='json')
        parser.add_argument('email', type=str, location='json')
        parser.add_argument('level', type=list, location='json',required=True)
        parser.add_argument('courses', type=list, location='json')
        args = parser.parse_args()

        # Get autoincrement id
        id = -1
        if args.id is not None:
            id = args.id
        else:
            cursor = mongo.db.counters.find_one_and_update(
                {'_id': 'professorid'}, {'$inc': {'seq': 1}},projection={'seq': True, '_id': False})
            id = int(cursor['seq'])

        # Update existing data else create new document
        result = mongo.db.professors.update_one({"_id": id}, {"$set":{
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
        parser.add_argument('id', type=int, location='json',required=True)
        args = parser.parse_args()
        result = mongo.db.professors.delete_one({"_id":args.id})
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
        students = mongo.db.students.find({"level":args.level})
        s = create_dic(students)
        return jsonify(students = s)

    # Create or update one teacher
    def put(self):
        parser = reqparse.RequestParser()
        parser.add_argument('id', type=int, location='json')
        parser.add_argument('name', type=str,  location='json', required=True)
        parser.add_argument('password', type=str, location='json',required=True)
        parser.add_argument('email', type=str, location='json')
        parser.add_argument('level', type=str, location='json',required=True)
        parser.add_argument('courses', type=list, location='json')
        args = parser.parse_args()

        # Get autoincrement id
        id = -1
        if args.id is not None:
            id = args.id
        else:
            cursor = mongo.db.counters.find_one_and_update(
                {'_id': 'studentid'}, {'$inc': {'seq': 1}},projection={'seq': True, '_id': False})
            id = int(cursor['seq'])

        # Update existing data else create new document
        result = mongo.db.students.update_one({"_id": id}, {"$set":{
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
        parser.add_argument('id', type=int, location='json',required=True)
        args = parser.parse_args()

        message = {}
        result = mongo.db.students.delete_one({"_id":args.id})
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
        return jsonify(courses = c)

    # Create or update one course
    def put(self):
        parser = reqparse.RequestParser()
        parser.add_argument('id', type=str, location='json', required=True)
        parser.add_argument('name', type=str,  location='json', required=True)
        parser.add_argument('level', type=str, location='json',required=True)
        parser.add_argument('semester', type=str, location='json', required=True)
        parser.add_argument('description', type=str, location='json', required=True)
        parser.add_argument('college_carrer', type=str, location='json')
        parser.add_argument('section', type=list, location='json')
        args = parser.parse_args()

        # Update existing data else create new document
        result = mongo.db.courses.update_one({"_id": args.id}, {"$set":{
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
        parser.add_argument('id', type=int, location='json',required=True)
        args = parser.parse_args()
        result = mongo.db.courses.delete_one({"_id":args.id})
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

# Announcements made by school administrator
# this class has CRUD operatios in order to
# manage school announcements
# @Path <id> - school id
# return JSON
class SchoolAnnouncements(Resource):
    # Get all announcements
    def get(self, id):
        messages = mongo.db.school.find_one({"_id":ObjectId(id)},{'announcements':1,"_id":0})
        return jsonify(messages)

    # Create or update one announcement
    def put(self, id):
        parser = reqparse.RequestParser()
        parser.add_argument('title', type=str,  location='json', required=True)
        parser.add_argument('content', type=str, location='json',required=True)
        parser.add_argument('date', type=int, location='json',required=True)
        parser.add_argument('level', type=list, location='json',required=True)
        parser.add_argument('position', type=str, location='json')
        args = parser.parse_args()

        if args.position is None:
            mongo.db.school.update({"_id":ObjectId(id)}, {"$push":{
            "announcements": {
                "title": args.title,"content":args.content,
                "publication_date":args.date, "level":args.level
                }}})
            message = {
                "status": 201,
                "code": 1
            }
        else:
            pos = args.position
            mongo.db.school.update({"_id":ObjectId(id)}, {"$set": {"announcements."+ pos +".title": args.title,
            "announcements."+ pos + ".content":args.content,
            "announcements."+ pos + ".publication_date":args.date,
            "announcements."+ pos + ".level":args.level}})
            message = {
                "status": 200,
                "code": 2
            }

        return jsonify(message)

    # Delete specific announcement on array by date
    def delete(self, id):
        parser = reqparse.RequestParser()
        parser.add_argument('publication_date', type=int, location='json',required=True)
        args = parser.parse_args()

        mongo.db.school.update({"_id":ObjectId(id)}, {"$pull":{
            "announcements": {"publication_date": args.publication_date}
        }})

        message = {
            "status": 200,
            "code": 1
        }

        return jsonify(message)



def create_dic(cursor):
    k = []
    for doc in cursor:
        k.append({key:(str(value) if key == "_id" else value) for key, value in doc.items()})
    return k


def create_secure_name(name):
    dict = {u" ": u"", u"Á": u"A", u"É": u"E", u"Í": u"I", u"Ó": u"O", u"Ú": u"U", u"Ñ": u"N", u"\'": u"", u"\"": u""}
    # Create a regular expression  from the dictionary keys
    regex = re.compile(u"({0:s})".format("|".join(map(re.escape, dict.keys()))))
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
api.add_resource(SchoolAnnouncements, '/api/v0/school/announcements/<id>', endpoint='schoolAnnouncements')
api.add_resource(SchoolProfessors, '/api/v0/school/teachers', endpoint='schoolTeachers')
api.add_resource(SchoolStudents, '/api/v0/school/students', endpoint='schoolStudents')
api.add_resource(SchoolCourses, '/api/v0/school/courses', endpoint='schoolCourses')
