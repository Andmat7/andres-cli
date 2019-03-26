#configure Mysql
mysql -u  root -h localhost -p
CREATE DATABASE moodle36;
GRANT ALL PRIVILEGES ON moodle36.* To 'moodle36_user'@'localhost' IDENTIFIED BY 'password';


