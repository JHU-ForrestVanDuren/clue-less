Run these commands in order to get started

# **Linux/Mac:**
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    python manage.py runserver

# **Windows:**
    python -m venv venv
    ./venv/Scripts/activate
    pip install -r requirements.txt
    python manage.py runserver

Note that after you've created your venv the first time you shouldn't need to do it again. You'll need to activate it each time you open a new terminal session. And you may occasionally need to rerun the pip command if the requirements have changed since the last time you did it. 

The packages were all installed with python 3.13.9 and pip 25.5. If you're having troubles installing from the requirements document, you could try upgrading python or manually installing django, daphne, and channels with your current version of pip.