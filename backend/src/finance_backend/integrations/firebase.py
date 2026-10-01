"""Lazy Firebase Admin access using Application Default Credentials."""

import os
from functools import cache

from firebase_admin import App, initialize_app
from firebase_admin import firestore as admin_firestore
from google.cloud.firestore import Client


@cache
def get_firebase_app() -> App:
    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT")
    options = {"httpTimeout": 30}
    if project_id:
        options["projectId"] = project_id
    return initialize_app(options=options, name="finance-backend")


def get_firestore() -> Client:
    return admin_firestore.client(app=get_firebase_app())
