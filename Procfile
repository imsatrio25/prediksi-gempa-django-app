web: gunicorn gempaweb.wsgi --log-file -
web: python manage.py collectstatic --noinput && gunicorn gempaweb.wsgi --log-file -