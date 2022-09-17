# Dokumentasi locust test 
Konfigurasi dan menjalankan locust pada project

### Setup
1. Buat venv
    ```ssh
    $ python -m venv env
    ```
2. Install requirement
    ```sh
    $ pip install -r requirements.txt
    ```
3. Jalankan locust 

    Menjalakan locust dapat menggunkan cara seperti berikut

    - set file (-f) menjadi main.py
    - set host (-H) misalnya menjadi http://localhost:5000
    - set iterasi/banyaknya request (-i) misalnya menjadi 10

    ```sh
    $ locust -f main.py -H http://localhost:5000 -i 10
    ```