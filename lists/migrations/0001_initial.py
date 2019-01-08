# Generated by Django 2.0.10 on 2019-01-08 15:49

import django.core.validators
from django.db import migrations, models
import django.db.models.deletion
import lists.models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Item',
            fields=[
                ('slug', models.CharField(default=lists.models.pkgen, editable=False, max_length=12)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('description', models.CharField(max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('order', models.IntegerField(validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(10)])),
            ],
            options={
                'ordering': ['order'],
            },
        ),
        migrations.CreateModel(
            name='List',
            fields=[
                ('slug', models.CharField(default=lists.models.pkgen, editable=False, max_length=12)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('description', models.CharField(max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('is_public', models.BooleanField(default=False)),
                ('timer', models.IntegerField(default=0)),
            ],
        ),
        migrations.AddField(
            model_name='item',
            name='list',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='lists.List'),
        ),
        migrations.AlterUniqueTogether(
            name='item',
            unique_together={('list', 'order')},
        ),
    ]
