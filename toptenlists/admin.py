from django.contrib import admin

# Register your models here.
from . models import TopTenList

admin.site.register(TopTenList)

from . models import Item

admin.site.register(Item)