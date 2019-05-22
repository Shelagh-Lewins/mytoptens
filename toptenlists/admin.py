from django.contrib import admin

# Register your models here.
from . models import TopTenList

admin.site.register(TopTenList)

from . models import TopTenItem

admin.site.register(TopTenItem)

from . models import ReusableItem

admin.site.register(ReusableItem)