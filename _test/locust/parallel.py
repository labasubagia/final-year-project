'''Locust test'''

from locust import HttpUser, task
from gevent.pool import Group

SIZE = 10

urls = [
    '/posts-api-comp-sequential',
    '/posts-api-comp-parallel',
    '/posts-api-comp-id-array',
    '/posts-cqrs-query-manual',
    '/posts-cqrs-query-agg',
    '/posts-cqrs-materialize',
]


class TestMicroservice(HttpUser):
    '''Test microservice endpoint'''
    @task
    def test_query_relational(self):
        '''test for inter-services query relational'''
        group = Group()
        for url in urls:
            group.spawn(lambda url=url: self.client.get(f"{url}?limit={SIZE}"))
        group.join()
