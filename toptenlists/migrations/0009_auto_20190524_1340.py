# Generated by Django 2.0.10 on 2019-05-24 13:40

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('toptenlists', '0008_auto_20190523_1415'),
    ]

    operations = [
        migrations.AlterField(
            model_name='toptenitem',
            name='reusableItem',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='topTenItem', to='toptenlists.ReusableItem'),
        ),
    ]