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
            mongo.db.school.update({"_id": ObjectId(id)}, {"$set": {"name": args.name,"email":args.email,
                                      "profile_photo":args.profile_photo, "password": "", "description": args.description,
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

api.add_resource(SchoolAPI, '/api/v0/school/info/<id>', endpoint='schoolInfo')
api.add_resource(SchoolAnnouncements, '/api/v0/school/announcements/<id>', endpoint='schoolAnnouncements')
