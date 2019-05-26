from django.apps import AppConfig
print('oi')

class TopTenListsConfig(AppConfig):
	name = 'toptenlists'

	def ready(self):
		from . import signals
		
