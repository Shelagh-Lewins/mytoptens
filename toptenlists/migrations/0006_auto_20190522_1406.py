# Generated by Django 2.0.10 on 2019-05-22 14:06

from django.db import migrations
import django_mysql.models


class Migration(migrations.Migration):

    dependencies = [
        ('toptenlists', '0005_auto_20190522_1405'),
    ]

    operations = [
        migrations.AlterField(
            model_name='reusableitem',
            name='history',
            field=django_mysql.models.JSONField(default=list),
        ),
    ]