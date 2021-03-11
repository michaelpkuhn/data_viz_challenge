from flask import Flask, jsonify, render_template, url_for, request
import json

from flask.helpers import make_response

# Initiate Flask Application
app = Flask(__name__)

app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

@app.route('/')
def index():
    return render_template('index.html')

@app.route("/json", methods=['GET'])
def return_json():
    if request.method == 'GET':
        with open('static/data/nested.json') as f:
            nested = json.load(f)

        res = jsonify(nested)

        return res

if __name__ == '__main__':
    app.run(debug=True)