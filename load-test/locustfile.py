from locust import HttpLocust, TaskSet, TaskSequence, task, seq_task
from locust.events import request_success, quitting
import cognito
import logging, sys
import csv
import os, imghdr
import random
import time
import json
from pprint import pprint

# add event hooks to create csv of every request
logfile = open("logs_%f.csv" % time.time(), 'w', encoding='utf-8')

def logSuccessfulReq(request_type, name, response_time, response_length):
  logfile.write("%s %s, %s, %s, %s\n" % (request_type, name, time.time(), response_time, response_length))

def closeLogfile():
  logfile.close()

request_success += logSuccessfulReq
quitting += closeLogfile

# import csv of (username, password) tuples
USER_CREDENTIALS = None

# array of paths to samples images to use for upload
files = [] # e.g. 'images/001.Affenpinscher/Affenpinscher_000001.jpg'

def api_url(path="", api_prefix="epo4si2417", api_stage="prod"):
  return "https://%s.execute-api.eu-west-1.amazonaws.com/%s/%s" % (api_prefix, api_stage, path)


class UserNewNoteBehaviour(TaskSequence):
  @seq_task(1)
  def uploadNote(self):
    # choose a random image to upload
    filepath = random.choice(files)
    fullpath = os.path.realpath(filepath)

    # open it
    with open(fullpath, 'rb') as image:
      # extract filename from filepath
      local_filename = os.path.basename(filepath)

      # prepend current unix time to filename
      bucket_filename = "%f_%s" % (time.time(), local_filename)

      # generate s3 url for uploads bucket, user's private folder, with given name
      url = self.parent.s3url(key=bucket_filename)

      # extra headers for file upload
      headers = {
        "Content-Transfer-Encoding": "binary",
        "Connection": "Keep-Alive"
      }

      # convert file object to binary buffer
      f = image.read()
      b = bytearray(f)

      # PUT upload file
      response = self.client.put(url, headers=headers, auth=self.parent.authS3, data=b, name="s3upload")

      # if success, update lastUploadedFile
      if response.status_code == 200:
        self.parent.lastUploadedFile = bucket_filename
      else:
        logging.error("Failed to upload %s. Status %d. %s" % (filepath, response.status_code, response.text))
        self.interrupt()

  @seq_task(2)
  def createNote(self):
    response = self.client.post("notes", auth=self.parent.authApi, json={ 'attachment': self.parent.lastUploadedFile })
    if response.status_code == 200:
      self.parent.lastCreatedNote = response.json()['noteId']
    else:
      logging.error("Failed to create note. Status %d. %s" % (response.status_code, response.text))
      self.interrupt()

  @seq_task(3)
  def classifyNote(self):
    response = self.client.get("classify/%s" % self.parent.lastCreatedNote, auth=self.parent.authApi, name="/classify/[noteId]")
    if response.status_code != 200:
      self.interrupt()


class UserBehavior(TaskSet):
  authApi = None #awsa4 authorisation
  authS3 = None
  identity_id = None #aws cognito identity pool id
  email = "NOT_FOUND"
  password = "NOT_FOUND"
  lastUploadedFile = "" # filename on bucket inside private user folder
  lastCreatedNote = "" # noteId for note created for above file
  note_ids = None # ids of notes belonging to this user

  # Nested Tasks can be selected as well as any task defined in this class
  # UserNewNoteBehaviour is an entire TaskSequence which may be selected to be performed
  # to access authentication headers in child classes, use self.parent.authXYZ
  tasks = { UserNewNoteBehaviour: 3 }

  def on_start(self):
    # authenticate
    if len(USER_CREDENTIALS) > 0:
      self.email, self.password = USER_CREDENTIALS.pop()
      self.login()
    else:
      logging.error("Exhausted username-password pairs")
      raise RuntimeError("Failure")
    # make initial call to getNotes
    self.getNotes()

  def on_stop(self):
    self.logout()

  def login(self):
    self.authApi, self.authS3, self.identity_id = cognito.authenticate(email=self.email, password=self.password)
    # logging.info("Login with %s email and %s password", self.email, self.password)

  def logout(self):
    pass

  def s3url(self, private=True, key="", bucket="ahmerb-notesapp-uploads"):
    url = "https://%s.s3.eu-west-1.amazonaws.com/" % bucket
    if private:
      url += "private/%s/" % self.identity_id
    else:
      url += "public/"
    url += key
    return url

  @task(4)
  def getNotes(self):
    r = self.client.get("notes", auth=self.authApi)
    # extract array of noteId's and save
    self.note_ids = list(map(lambda note: note['noteId'], r.json()))

  @task(4)
  def getNote(self):
    # skip if this user has no notes
    # they may create one later
    if (len(self.note_ids) == 0):
      return

    note_id = random.choice(self.note_ids)
    self.client.get("notes/%s" % note_id, auth=self.authApi, name="notes/[id]")
    
    # after viewing a note, you must go back to the home page
    self.getNotes()


class WebsiteUserTest(HttpLocust):
  task_set = UserBehavior
  min_wait = 5000
  max_wait = 9000
  weight = 1
  host = api_url()

  def __init__(self):
    super(WebsiteUserTest, self).__init__()
    global USER_CREDENTIALS
    if (USER_CREDENTIALS == None):
      with open('credentials.csv', 'r') as f:
        reader = csv.reader(f)
        USER_CREDENTIALS = list(reader)
    find_images()

def find_images():
  global files
  files = []
  for folder in os.listdir('images'):
    if os.path.isdir('images/%s'%folder):
      for file in os.listdir('images/%s'%folder):
        if imghdr.what('images/%s/%s'%(folder,file)):
          files.append('images/%s/%s'%(folder,file))

# if __name__ == "__main__":
#   find_images()
