# Generated by Django 2.0.10 on 2019-08-15 07:59

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('toptenlists', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='toptenlist',
            name='created_by',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='topTenList_created_by_id', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='toptenlist',
            name='modified_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='topTenList_modified_by', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='toptenlist',
            name='parent_topTenItem',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='parent_topTenItem', to='toptenlists.TopTenItem'),
        ),
        migrations.AddField(
            model_name='toptenitem',
            name='reusableItem',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='topTenItem', to='toptenlists.ReusableItem'),
        ),
        migrations.AddField(
            model_name='toptenitem',
            name='topTenList',
            field=models.ForeignKey(editable=False, on_delete=django.db.models.deletion.CASCADE, related_name='topTenItem', to='toptenlists.TopTenList'),
        ),
        migrations.AddField(
            model_name='reusableitem',
            name='created_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reusableItem_created_by', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='reusableitem',
            name='proposed_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reusableItem_proposed_by', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='reusableitem',
            name='votes_no',
            field=models.ManyToManyField(blank=True, related_name='reusableItem_votes_no', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='reusableitem',
            name='votes_yes',
            field=models.ManyToManyField(blank=True, related_name='reusableItem_votes_yes', to=settings.AUTH_USER_MODEL),
        ),
    ]