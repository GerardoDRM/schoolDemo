# coding=utf-8
from schoolDemo import app
from flask import jsonify, render_template, g, flash, redirect, url_for, json


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
