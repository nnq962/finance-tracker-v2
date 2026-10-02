"""Lazy Firebase Admin access (FCM) using Application Default Credentials."""

import os
from functools import cache

from firebase_admin import App, initialize_app


@cache
def get_firebase_app() -> App:
    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT")
    options = {"httpTimeout": 30}
    if project_id:
        options["projectId"] = project_id
    return initialize_app(options=options, name="finance-backend")
