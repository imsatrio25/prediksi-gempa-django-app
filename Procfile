web: gunicorn gempaweb.wsgi --log-file -
web: python manage.py collectstatic --noinput && gunicorn your_project_name.wsgi --log-file -