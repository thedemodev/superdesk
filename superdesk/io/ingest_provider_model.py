from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk.io import allowed_providers
from superdesk.activity import add_activity, ACTIVITY_CREATE, ACTIVITY_DELETE, ACTIVITY_UPDATE
from superdesk import get_resource_service


DAYS_TO_KEEP = 2


class IngestProviderResource(Resource):
    schema = {
        'name': {
            'type': 'string',
            'required': True
        },
        'type': {
            'type': 'string',
            'required': True,
            'allowed': allowed_providers
        },
        'days_to_keep': {
            'type': 'integer',
            'required': True,
            'default': DAYS_TO_KEEP
        },
        'config': {
            'type': 'dict'
        },
        'ingested_count': {
            'type': 'integer'
        },
        'accepted_count': {
            'type': 'integer'
        },
        'token': {
            'type': 'dict'
        },
        'source': {
            'type': 'string',
            'required': True,
        },
        'is_closed': {
            'type': 'boolean',
            'default': False
        },
        'update_schedule': {
            'type': 'dict',
            'schema': {
                'hours': {'type': 'integer'},
                'minutes': {'type': 'integer', 'default': 5},
                'seconds': {'type': 'integer'},
            }
        },
        'last_updated': {'type': 'datetime'},
        'rule_set': Resource.rel('rule_sets', nullable=True)
    }

    privileges = {'POST': 'ingest_providers', 'PATCH': 'ingest_providers', 'DELETE': 'ingest_providers'}


class IngestProviderService(BaseService):

    def _get_administrators(self):
        return get_resource_service('users').get(req=None, lookup={'user_type': 'administrator'})

    def on_created(self, docs):
        for doc in docs:
            add_activity(ACTIVITY_CREATE, 'created Ingest Channel {{name}}', item=doc,
                         notify=[user.get('_id') for user in self._get_administrators()],
                         name=doc.get('name'))

    def on_updated(self, updates, original):
        add_activity(ACTIVITY_UPDATE, 'updated Ingest Channel {{name}}', item=original,
                     notify=[user['_id'] for user in self._get_administrators()],
                     name=updates.get('name', original.get('name')))

        if updates.get('is_closed'):
            add_activity(ACTIVITY_UPDATE, '{{status}} Ingest Channel {{name}}', item=original,
                         notify=[user.get('_id') for user in self._get_administrators()],
                         name=updates.get('name', original.get('name')),
                         status='closed' if updates.get('is_closed') else 'opened')

    def on_deleted(self, doc):
        add_activity(ACTIVITY_DELETE, 'deleted Ingest Channel {{name}}', item=doc,
                     notify=[user.get('_id') for user in self._get_administrators()],
                     name=doc.get('name'))
