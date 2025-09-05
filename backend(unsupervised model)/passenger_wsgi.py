import sys
import os

# Add your project directory to the Python path
INTERP = os.path.expanduser("~/myenv/bin/python3")
if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

# Set up paths
project_folder = os.path.expanduser('~/ai-rec')
sys.path.insert(0, project_folder)

# Import your FastAPI app
from main import app as application  # noqa
