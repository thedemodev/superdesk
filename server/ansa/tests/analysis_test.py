import os
import json
import unittest

from unittest.mock import patch
from ansa.analysis.analysis import parse, apply

with open(os.path.join(os.path.dirname(__file__), 'analysis.json')) as f:
    extracted = json.load(f)


class AnalysisTestCase(unittest.TestCase):

    @patch('ansa.analysis.analysis.get_place_by_id')
    def test_parse(self, mock):
        parsed = parse(extracted)
        self.assertIn('keywords', parsed)
        self.assertIn('World Cup', parsed['keywords'])

    def test_apply(self):
        parsed = {
            'keywords': ['foo', 'bar'],
        }

        item = {}
        apply(parsed, item)
        self.assertEqual(parsed['keywords'], item['keywords'])

    def test_apply_products(self):
        parsed = {
            'subject': [
                {'name': 'arts', 'qcode': '01000000'},
                {'name': 'product', 'qcode': '12345', 'scheme': 'products'},
            ],
        }

        item = {'type': 'text'}
        apply(parsed, item)
        self.assertEqual(2, len(item['subject']))

        item = {'type': 'picture'}
        apply(parsed, item)
        self.assertEqual(1, len(item['subject']))
        self.assertEqual('arts', item['subject'][0]['name'])
