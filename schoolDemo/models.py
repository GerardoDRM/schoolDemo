from werkzeug.security import check_password_hash

class User():
    def __init__(self, id, name, type):
        self.id = unicode(id)
        self.name = name
        self.type = type

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        return self.id

    @staticmethod
    def validate_login(password_hash, password):
        return check_password_hash(password_hash, password)
