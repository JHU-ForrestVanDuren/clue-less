from django.db.models.signals import post_migrate
from django.dispatch import receiver
from django.db import connection

@receiver(post_migrate)
def run_sql_script(sender, **kwargs):
    if kwargs.get('app_config').name == 'players':  # Only run for your specific app
        with connection.cursor() as cursor:
            with open('./players/initDB.sql', 'r') as f:
                sql_script = f.read()
            
            statements = [s.strip() for s in sql_script.split(';')]

            for statement in statements:
                print(statement)
                try:
                    cursor.execute(statement)
                except Exception as e:
                    print(f"Error executing statement: {statement}\nError: {e}")