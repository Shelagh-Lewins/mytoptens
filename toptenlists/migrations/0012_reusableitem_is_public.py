# Generated by Django 2.0.10 on 2019-07-11 10:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('toptenlists', '0011_auto_20190524_1342'),
    ]

    operations = [
        migrations.AddField(
            model_name='reusableitem',
            name='is_public',
            field=models.BooleanField(default=False),
        ),
    ]
