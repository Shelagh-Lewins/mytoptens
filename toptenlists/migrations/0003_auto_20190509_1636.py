# Generated by Django 2.0.10 on 2019-05-09 16:36

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('toptenlists', '0002_auto_20190427_0925'),
    ]

    operations = [
        migrations.AlterField(
            model_name='toptenitem',
            name='topTenList',
            field=models.ForeignKey(editable=False, on_delete=django.db.models.deletion.CASCADE, related_name='topTenItem', to='toptenlists.TopTenList'),
        ),
    ]
