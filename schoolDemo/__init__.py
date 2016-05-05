from flask import Flask
from flask.ext.triangle import Triangle

app = Flask(__name__)
# Adding Triangle in order to use AngularJS
Triangle(app)

import views
