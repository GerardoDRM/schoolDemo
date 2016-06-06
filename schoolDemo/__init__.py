from flask import Flask
from flask.ext.triangle import Triangle
from flask.ext.pymongo import PyMongo

app = Flask(__name__)
app.config['MONGO_DBNAME'] = 'schoolDemo'
mongo = PyMongo(app)

# Adding Triangle in order to use AngularJS
Triangle(app)

import views
