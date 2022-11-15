'''Locust test'''

import locust_plugins  # pylint: disable=unused-import
from locust import HttpUser, task, events
from locust.runners import MasterRunner


# Change this for test range of data size
# Query test
START = 0
END = 1000
STEP = 100

# Comment url if you want disable test for it
urls = [
    # '/posts-api-comp-sequential',
    '/posts-api-comp-parallel',
    # '/posts-api-comp-id-array',
    # '/posts-cqrs-query-manual',
    # '/posts-cqrs-query-agg',
    # '/posts-cqrs-materialize',
]


class TestMicroservices(HttpUser):
    '''Test microservices endpoint'''
    @task
    def test_query_relational(self):
        '''test for inter-services query relational'''
        for url in urls:
            for i in range(START, END+1, STEP):
                self.client.get(f"{url}?limit={i}")
