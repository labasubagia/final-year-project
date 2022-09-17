'''Locust test'''

import locust_plugins  # pylint: disable=unused-import
from locust import HttpUser, task

# Change this for test range of data size
# Query test
START = 1
END = 1000
STEP = 10

# Comment url if you want disable test for it
urls = [
    '/posts-api-comp-sequential',
    '/posts-api-comp-parallel',
    '/posts-api-comp-id-array',
    '/posts-cqrs-query-agg',
    '/posts-cqrs-query-manual',
    '/posts-cqrs-materialize',
]


class TestMicroservices(HttpUser):
    '''Test microservices endpoint'''
    @task
    def test_query_relational(self):
        '''test for inter-services query relational'''
        for url in urls:
            for i in range(START, END+1, STEP):
                self.client.get(f"{url}?limit={i}")
