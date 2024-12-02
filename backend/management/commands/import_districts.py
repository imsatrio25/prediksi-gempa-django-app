import csv
from django.core.management.base import BaseCommand
from backend.models import District

class Command(BaseCommand):
    help = 'Import district data from a CSV file'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to the CSV file')

    def handle(self, *args, **kwargs):
        csv_file = kwargs['csv_file']

        with open(csv_file, 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                District.objects.update_or_create(
                    name=row['Location'],  # Adjust to match your CSV headers
                    defaults={
                        'latitude': float(row['latitude']),
                        'longitude': float(row['longitude']),
                    }
                )
        self.stdout.write(self.style.SUCCESS('District data imported successfully'))
