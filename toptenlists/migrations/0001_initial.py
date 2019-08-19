# Generated by Django 2.0.10 on 2019-08-19 18:02

import django.core.validators
from django.db import migrations, models
import django_mysql.models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='ReusableItem',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_by_username', models.CharField(max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('name', models.CharField(max_length=255)),
                ('definition', models.CharField(blank=True, default='', max_length=255)),
                ('is_public', models.BooleanField(default=False)),
                ('link', models.CharField(blank=True, default='', max_length=255)),
                ('modified_at', models.DateTimeField(auto_now_add=True)),
                ('users_when_modified', models.IntegerField(default=0)),
                ('change_request', django_mysql.models.JSONField(blank=True, default=None, null=True)),
                ('change_request_at', models.DateTimeField(blank=True, null=True)),
                ('history', django_mysql.models.JSONField(blank=True, default=list)),
                ('votes_yes_count', models.IntegerField(blank=True, null=True)),
                ('votes_no_count', models.IntegerField(blank=True, null=True)),
                ('my_vote', models.CharField(blank=True, max_length=255, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='TopTenItem',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('modified_at', models.DateTimeField(auto_now_add=True)),
                ('name', models.CharField(blank=True, default='', max_length=255)),
                ('description', models.CharField(blank=True, default='', max_length=5000)),
                ('order', models.IntegerField(validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(10)])),
            ],
            options={
                'ordering': ['order'],
            },
        ),
        migrations.CreateModel(
            name='TopTenList',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_by_username', models.CharField(max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('modified_at', models.DateTimeField(auto_now_add=True)),
                ('name', models.CharField(max_length=255)),
                ('description', models.CharField(blank=True, default='', max_length=5000)),
                ('is_public', models.BooleanField(default=False)),
            ],
        ),
    ]
