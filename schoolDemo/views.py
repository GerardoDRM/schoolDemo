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

class SchoolAPI(Resource):
    def get(self):
        school = mongo.db.school.find_one({},{'_id':0})
        return jsonify(school)

    def put(self):
        parser = reqparse.RequestParser()
        parser.add_argument('name', type=str)
        parser.add_argument('email', type=str)
        parser.add_argument('password', type=str)
        parser.add_argument('profile_photo', type=str)
        parser.add_argument('address', type=str)
        parser.add_argument('responsible', type=str)
        parser.add_argument('job', type=str)
        args = parser.parse_args()

        # Check if user already exists
        cursor = mongo.db.school.find_one({})
        if cursor is None:
            mongo.db.school.update({}, {"name": args.name,"email":args.email,
                                      "profile_photo":args.profile_photo, "password":password,
                                      "address.street": args.address, "address.responsible": args.responsible,
                                      "address.responsible_job": args.job},
                                      {upsert: true})
            message = {
                "status": 201,
                "code": 1
            }

        return jsonify(message)


class SchoolAnnouncements(Resource):
    def get(self, id):
        messages = mongo.db.school.find_one({"_id":ObjectId(id)},{'announcements':1,"_id":0})
        return jsonify(messages)

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

    def delete(self, id):
        parser = reqparse.RequestParser()
        parser.add_argument('date', type=int, location='json',required=True)
        args = parser.parse_args()

        mongo.db.school.update({"_id":ObjectId(id)}, {"$pull":{
            "announcements": {"publication_date": args.date}
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

api.add_resource(SchoolAPI, '/api/v0/school/info', endpoint='school')
api.add_resource(SchoolAnnouncements, '/api/v0/school/announcements/<id>', endpoint='schoolAnnouncements')
