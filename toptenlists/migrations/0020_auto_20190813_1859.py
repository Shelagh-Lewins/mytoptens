# Generated by Django 2.0.10 on 2019-08-13 18:59

from django.db import migrations
import django_mysql.models


class Migration(migrations.Migration):

    dependencies = [
        ('toptenlists', '0019_auto_20190813_1855'),
    ]

    operations = [
        migrations.AlterField(
            model_name='reusableitem',
            name='proposed_modification',
            field=django_mysql.models.JSONField(blank=True, default=None, null=True),
        ),
    ]