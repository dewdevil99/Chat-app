import os

from flask import Flask, url_for, render_template, request, flash, redirect
from flask_socketio import SocketIO, emit, join_room, leave_room
from collections import OrderedDict
from datetime import datetime
import time

app = Flask(__name__)
app.config["SECRET_KEY"] = 'hello secret'#os.getenv("SECRET_KEY")
socketio = SocketIO(app)

channels=[]
users=[]
messages=OrderedDict()

@app.route("/", methods=["POST","GET"])
def index():
	if(request.method=="POST"):
		name=request.form.get("display_name")
		if(name in users):
			flash('Username exists')
			return redirect(url_for("login"))
		else:
			users.append(name)
			return render_template("home.html", name=name, channels=channels)
	return redirect(url_for('login'))

@app.route("/login")
def login():
	return render_template("login.html")

@app.route("/<channel>")
def chat(channel):
	return messages[channel]

@socketio.on('new channel created')
def new_channel(channel_name):
	if(channel_name["channel_name"].strip() in channels):
		emit('channel exists')
	else:
		channels.append(channel_name["channel_name"].strip())
		print(channels)
		emit('display new channel',{"channel_name": channel_name["channel_name"].strip()},broadcast=True)

@socketio.on('join')
def user_join(data):
	user=data['name']
	channel=data['channel'].strip()
	print(user)
	print(channel)
	join_room(channel)
	emit('new user joined',{'user': user, 'channel': channel}, room=channel)

@socketio.on('new message')
def new_message(message_sent):
	channel=message_sent['channel'].strip()
	print(channel)
	message=message_sent['message']
	print(message)
	user_time=str(time.time()*1000)+'|'+message_sent['user']
	if(channel in messages):
		if(len(messages[channel])>=100):
			messages[channel].popitem(False)
	else:
		messages[channel]=OrderedDict()
	messages[channel][user_time]=message
	emit('display message',{'message':message, 'user': user_time.split('|')[1], 'time': user_time.split('|')[0]}, room=channel)

@socketio.on('leave')
def leave_channel(data):
	user=data['name']
	channel=data['channel'].strip()
	leave_room(channel)
	emit('left room',{'user': user, 'channel': channel}, room=channel)

@socketio.on('user exit')
def user_logout(name):
	user_name=name["disp_name"]
	users.remove(user_name)
	emit('redirect',{'url': url_for('login')})

if __name__ == '__main__':
	socketio.run(app)
