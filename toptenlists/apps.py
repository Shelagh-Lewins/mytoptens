from django.apps import AppConfig

class TopTenListsConfig(AppConfig):
	name = 'toptenlists'

	def ready(self):
		from . import signals
		
