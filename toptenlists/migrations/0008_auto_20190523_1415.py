# Generated by Django 2.0.10 on 2019-05-23 14:15

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('toptenlists', '0007_auto_20190522_1415'),
    ]

    operations = [
        migrations.AlterField(
            model_name='toptenitem',
            name='reusableItem',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='topTenItem', to='toptenlists.ReusableItem'),
        ),
    ]
