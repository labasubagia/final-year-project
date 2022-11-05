'''Locust test'''

from locust import HttpUser, task

SIZE = 10

urls = [
    '/posts-api-comp-sequential',
    # '/posts-api-comp-parallel',
    # '/posts-api-comp-id-array',
    # '/posts-cqrs-query-manual',
    # '/posts-cqrs-query-agg',
    # '/posts-cqrs-materialize',
]


class TestMicroservice(HttpUser):
    '''Test microservice endpoint'''
    @task
    def test_query_relational(self):
        '''test for inter-services query relational'''
        for url in urls:
            self.client.get(f"{url}?limit={SIZE}")
